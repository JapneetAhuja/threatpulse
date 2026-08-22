"""Correlate related events into prioritized incidents."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .risk_scoring import build_explanation, investigation_priority, severity_from_score


class CorrelationEngine:
    """Groups related suspicious events by source IP / simulation into incidents."""

    def __init__(self, window_seconds: int = 120) -> None:
        self.window = timedelta(seconds=window_seconds)
        self.open_incidents: Dict[str, dict[str, Any]] = {}

    def _key(self, event: dict[str, Any]) -> str:
        if event.get("simulation_id"):
            return f"sim:{event['simulation_id']}"
        return f"ip:{event.get('source_ip', 'unknown')}"

    def ingest(self, event: dict[str, Any], attack_started_at: Optional[datetime] = None) -> Optional[dict[str, Any]]:
        if not event.get("flagged") and float(event.get("risk_score", 0)) < 40:
            return None

        key = self._key(event)
        now = event["timestamp"] if isinstance(event["timestamp"], datetime) else datetime.fromisoformat(str(event["timestamp"]))
        threat = event.get("threat_name") or self._infer_threat(event)

        incident = self.open_incidents.get(key)
        if incident:
            last = incident["last_seen"]
            if isinstance(last, str):
                last = datetime.fromisoformat(last)
            if now - last > self.window and not event.get("simulation_id"):
                incident = None

        if not incident:
            detection_time = 0.0
            if attack_started_at:
                detection_time = max(0.0, (now - attack_started_at).total_seconds())
            elif event.get("simulation_started_at"):
                started = event["simulation_started_at"]
                if isinstance(started, str):
                    started = datetime.fromisoformat(started)
                detection_time = max(0.0, (now - started).total_seconds())

            incident = {
                "id": f"INC-{uuid.uuid4().hex[:8].upper()}",
                "threat_name": threat,
                "first_seen": now,
                "last_seen": now,
                "source_ip": event.get("source_ip"),
                "target": event.get("destination_ip"),
                "severity": event.get("severity", "MEDIUM"),
                "risk_score": float(event.get("risk_score", 0)),
                "status": "NEW",
                "detection_time_seconds": round(detection_time, 1),
                "explanation": event.get("explanation") or "",
                "evidence": list(event.get("evidence") or []),
                "related_event_ids": [event["id"]],
                "timeline": [
                    {
                        "timestamp": now.isoformat() if isinstance(now, datetime) else str(now),
                        "event_type": event.get("event_type"),
                        "detail": f"{event.get('event_type')} from {event.get('source_ip')}",
                        "risk_score": event.get("risk_score"),
                    }
                ],
                "investigation_priority": investigation_priority(
                    float(event.get("risk_score", 0)),
                    severity_from_score(float(event.get("risk_score", 0))),
                ),
                "simulation_id": event.get("simulation_id"),
                "within_60_seconds": detection_time <= 60.0,
                "stages": {event.get("event_type")},
            }
            self.open_incidents[key] = incident
        else:
            incident["last_seen"] = now
            incident["related_event_ids"].append(event["id"])
            incident["timeline"].append(
                {
                    "timestamp": now.isoformat() if isinstance(now, datetime) else str(now),
                    "event_type": event.get("event_type"),
                    "detail": f"{event.get('event_type')} from {event.get('source_ip')}",
                    "risk_score": event.get("risk_score"),
                }
            )
            for e in event.get("evidence") or []:
                if e not in incident["evidence"]:
                    incident["evidence"].append(e)
            incident["stages"].add(event.get("event_type"))
            incident["risk_score"] = max(float(incident["risk_score"]), float(event.get("risk_score", 0)))
            # escalate threat name for multi-stage compromise
            stages = incident["stages"]
            if {"LOGIN_FAILURE", "LOGIN_SUCCESS", "PRIVILEGE_ESCALATION"} & stages and (
                "DATA_EXFILTRATION" in stages or "UNUSUAL_NETWORK_TRAFFIC" in stages
            ):
                incident["threat_name"] = "Possible Account Compromise & Data Exfiltration"
                incident["risk_score"] = max(incident["risk_score"], 92.0)
            elif "PRIVILEGE_ESCALATION" in stages and ("LOGIN_SUCCESS" in stages or "LOGIN_FAILURE" in stages):
                incident["threat_name"] = "Account Compromise Chain"
                incident["risk_score"] = max(incident["risk_score"], 88.0)
            else:
                # keep highest severity threat naming
                if float(event.get("risk_score", 0)) >= float(incident.get("risk_score", 0)):
                    incident["threat_name"] = threat

            sev = severity_from_score(incident["risk_score"])
            incident["severity"] = sev.value
            incident["investigation_priority"] = investigation_priority(incident["risk_score"], sev)
            incident["explanation"] = build_explanation(
                threat_name=incident["threat_name"],
                severity=sev,
                risk_score=incident["risk_score"],
                evidence=incident["evidence"],
                anomaly_score=float(event.get("anomaly_score", 0)),
                rule_score=float(event.get("rule_score", 0)),
                correlation_count=len(incident["related_event_ids"]),
            )
            if attack_started_at and incident.get("detection_time_seconds", 0) == 0:
                incident["detection_time_seconds"] = round(max(0.0, (now - attack_started_at).total_seconds()), 1)
                incident["within_60_seconds"] = incident["detection_time_seconds"] <= 60.0

        # serialize stages for storage
        out = dict(incident)
        out["stages"] = list(incident["stages"])
        out["first_seen"] = incident["first_seen"]
        out["last_seen"] = incident["last_seen"]
        return out

    def correlation_boost(self, event: dict[str, Any]) -> float:
        key = self._key(event)
        incident = self.open_incidents.get(key)
        if not incident:
            # peek recent related types via simulation
            if event.get("is_malicious"):
                return 35.0
            return 0.0
        n = len(incident.get("related_event_ids", []))
        stages = len(incident.get("stages", set()))
        return min(100.0, 20 + n * 8 + stages * 10)

    def _infer_threat(self, event: dict[str, Any]) -> str:
        mapping = {
            "LOGIN_FAILURE": "Failed Login",
            "MULTIPLE_FAILED_LOGINS": "Credential Attack",
            "BRUTE_FORCE": "Brute Force",
            "PORT_SCAN": "Port Scan",
            "PRIVILEGE_ESCALATION": "Privilege Escalation",
            "DATA_EXFILTRATION": "Data Exfiltration",
            "SUSPICIOUS_DNS": "Suspicious DNS",
            "MALWARE_DETECTED": "Malware Detected",
            "UNAUTHORIZED_ACCESS": "Unauthorized Access",
            "UNUSUAL_NETWORK_TRAFFIC": "Unusual Network Traffic",
            "LOGIN_SUCCESS": "Suspicious Authentication",
        }
        return mapping.get(event.get("event_type", ""), "Suspicious Activity")

    def reset(self) -> None:
        self.open_incidents.clear()
