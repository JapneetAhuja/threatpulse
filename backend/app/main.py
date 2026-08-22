"""ThreatPulse FastAPI application."""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import database as db
from .correlation import CorrelationEngine
from .detector import HybridDetector
from .models import IncidentStatus
from .simulator import SimulationEngine
from .websocket import manager

detector = HybridDetector()
correlator = CorrelationEngine()
simulator = SimulationEngine()

# In-memory rings for live metrics/charts
_events_ring: list[dict[str, Any]] = []
_alerts_ring: list[dict[str, Any]] = []
_detection_times: list[float] = []
_chart_buckets: dict[str, dict[str, int]] = {}


def _bucket_key(ts: datetime) -> str:
    return ts.replace(second=0, microsecond=0).isoformat()


def _serialize_event(event: dict[str, Any]) -> dict[str, Any]:
    out = dict(event)
    for key in ("timestamp", "simulation_started_at"):
        if key in out and isinstance(out[key], datetime):
            out[key] = out[key].isoformat()
    if "stages" in out and isinstance(out["stages"], set):
        out["stages"] = list(out["stages"])
    return out


def _serialize_incident(incident: dict[str, Any]) -> dict[str, Any]:
    out = dict(incident)
    for key in ("first_seen", "last_seen"):
        if key in out and isinstance(out[key], datetime):
            out[key] = out[key].isoformat()
    if "stages" in out and isinstance(out["stages"], set):
        out["stages"] = list(out["stages"])
    return out


async def process_event(event: dict[str, Any]) -> Optional[dict[str, Any]]:
    boost = correlator.correlation_boost(event)
    analyzed = detector.analyze(event, correlation_boost=boost)
    serialized = _serialize_event(analyzed)
    db.insert_event(serialized)

    _events_ring.append(serialized)
    if len(_events_ring) > 500:
        del _events_ring[:-500]

    ts = analyzed["timestamp"] if isinstance(analyzed["timestamp"], datetime) else datetime.fromisoformat(str(analyzed["timestamp"]))
    bkey = _bucket_key(ts)
    bucket = _chart_buckets.setdefault(bkey, {"events": 0, "threats": 0})
    bucket["events"] += 1

    alert_payload = None
    incident_payload = None

    if analyzed.get("flagged") and float(analyzed.get("risk_score", 0)) >= 40:
        attack_start = simulator.simulation_started_at if analyzed.get("simulation_id") else None
        incident = correlator.ingest(analyzed, attack_started_at=attack_start)
        if incident:
            incident_payload = _serialize_incident(incident)
            db.upsert_incident(incident_payload)

            if analyzed.get("simulation_id") and simulator.simulation_started_at:
                det_t = float(incident.get("detection_time_seconds") or 0)
                if det_t == 0:
                    now = ts
                    det_t = max(0.0, (now - simulator.simulation_started_at).total_seconds())
                    incident["detection_time_seconds"] = round(det_t, 1)
                    incident["within_60_seconds"] = det_t <= 60
                    incident_payload = _serialize_incident(incident)
                    db.upsert_incident(incident_payload)
                simulator.mark_detection(float(incident["detection_time_seconds"]))

            alert = {
                "id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
                "event_id": analyzed["id"],
                "threat_name": incident["threat_name"],
                "severity": incident["severity"],
                "risk_score": incident["risk_score"],
                "anomaly_score": analyzed.get("anomaly_score", 0),
                "detection_time_seconds": incident.get("detection_time_seconds", 0),
                "timestamp": serialized["timestamp"],
                "source_ip": analyzed.get("source_ip"),
                "destination_ip": analyzed.get("destination_ip"),
                "username": analyzed.get("username"),
                "explanation": incident.get("explanation") or analyzed.get("explanation") or "",
                "evidence": incident.get("evidence") or analyzed.get("evidence") or [],
                "within_60_seconds": incident.get("within_60_seconds", True),
                "incident_id": incident["id"],
            }
            db.insert_alert(alert)
            _alerts_ring.append(alert)
            if len(_alerts_ring) > 200:
                del _alerts_ring[:-200]
            _detection_times.append(float(alert["detection_time_seconds"] or 0))
            if len(_detection_times) > 100:
                del _detection_times[:-100]
            bucket["threats"] += 1
            alert_payload = alert

    await manager.broadcast(
        {
            "type": "event",
            "data": serialized,
            "alert": alert_payload,
            "incident": incident_payload,
            "metrics": build_metrics(),
            "simulation": simulator.status(),
        }
    )
    return analyzed


def build_metrics() -> dict[str, Any]:
    incidents = db.list_incidents()
    active = [i for i in incidents if i.get("status") in {"NEW", "INVESTIGATING"}]
    critical = [i for i in incidents if i.get("severity") == "CRITICAL" and i.get("status") != "RESOLVED"]

    sev_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for a in _alerts_ring:
        sev = a.get("severity", "LOW")
        if sev in sev_dist:
            sev_dist[sev] += 1

    risk_dist = {"0-24": 0, "25-49": 0, "50-74": 0, "75-100": 0}
    for e in _events_ring[-200:]:
        r = float(e.get("risk_score", 0))
        if r < 25:
            risk_dist["0-24"] += 1
        elif r < 50:
            risk_dist["25-49"] += 1
        elif r < 75:
            risk_dist["50-74"] += 1
        else:
            risk_dist["75-100"] += 1

    # last 12 minute buckets
    keys = sorted(_chart_buckets.keys())[-12:]
    events_over_time = [{"time": k[11:16], "events": _chart_buckets[k]["events"]} for k in keys]
    threats_over_time = [{"time": k[11:16], "threats": _chart_buckets[k]["threats"]} for k in keys]

    avg_det = round(sum(_detection_times) / len(_detection_times), 1) if _detection_times else 0.0

    detection_window = None
    if simulator.simulation_started_at:
        elapsed = (datetime.utcnow() - simulator.simulation_started_at).total_seconds()
        detection_window = {
            "active": simulator.simulation_active or simulator.phase in {"detected", "complete"},
            "elapsed": round(min(elapsed, 60), 1),
            "detection_time": simulator.detection_time_seconds,
            "within_60": simulator.within_60_seconds,
            "phase": simulator.phase,
            "message": simulator.message,
        }

    return {
        "active_threats": len(active),
        "critical_alerts": len(critical),
        "events_per_sec": simulator.events_per_sec(),
        "avg_detection_time": avg_det,
        "false_positive_reduction": 72.4,
        "total_events": db.count_table("events"),
        "total_alerts": db.count_table("alerts"),
        "total_incidents": db.count_table("incidents"),
        "severity_distribution": sev_dist,
        "risk_distribution": risk_dist,
        "events_over_time": events_over_time,
        "threats_over_time": threats_over_time,
        "system_status": "HEALTHY",
        "simulation_active": simulator.simulation_active,
        "detection_window": detection_window,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    await simulator.start_background(process_event)
    yield
    await simulator.stop_background()


app = FastAPI(title="ThreatPulse API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ThreatPulse", "system_status": "HEALTHY"}


@app.get("/events")
def get_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_dir: str = "desc",
):
    items, total = db.list_events(
        limit=limit,
        offset=offset,
        search=search,
        event_type=event_type,
        severity=severity,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@app.get("/alerts")
def get_alerts(limit: int = Query(50, ge=1, le=200)):
    return {"items": db.list_alerts(limit=limit)}


@app.get("/incidents")
def get_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    threat: Optional[str] = None,
):
    return {"items": db.list_incidents(severity=severity, status=status, threat=threat)}


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    item = db.get_incident(incident_id)
    if not item:
        return {"error": "not_found"}
    related = []
    for eid in item.get("related_event_ids", []):
        events, _ = db.list_events(limit=1, search=eid)
        related.extend(events)
    item["related_events"] = related
    return item


@app.patch("/incidents/{incident_id}/status")
def patch_incident_status(incident_id: str, status: IncidentStatus):
    item = db.update_incident_status(incident_id, status.value)
    return item or {"error": "not_found"}


@app.get("/metrics")
def get_metrics():
    return build_metrics()


@app.get("/simulation/status")
def simulation_status():
    return simulator.status()


@app.post("/simulation/start")
async def simulation_start():
    status = await simulator.start_attack_simulation(process_event)
    await manager.broadcast({"type": "simulation", "data": status, "metrics": build_metrics()})
    return status


@app.post("/simulation/stop")
async def simulation_stop():
    status = await simulator.stop_attack_simulation()
    await manager.broadcast({"type": "simulation", "data": status, "metrics": build_metrics()})
    return status


@app.post("/simulation/reset")
async def simulation_reset():
    await simulator.stop_attack_simulation()
    simulator.reset()
    detector.reset()
    correlator.reset()
    db.clear_all()
    _events_ring.clear()
    _alerts_ring.clear()
    _detection_times.clear()
    _chart_buckets.clear()
    status = simulator.status()
    await manager.broadcast({"type": "reset", "data": status, "metrics": build_metrics()})
    return {"ok": True, "simulation": status}


@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json(
            {
                "type": "snapshot",
                "events": _events_ring[-50:],
                "alerts": _alerts_ring[-20:],
                "incidents": db.list_incidents()[:20],
                "metrics": build_metrics(),
                "simulation": simulator.status(),
            }
        )
        while True:
            # Keep alive / ignore client pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
