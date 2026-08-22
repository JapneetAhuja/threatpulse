"""SQLite persistence for ThreatPulse prototype."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Generator, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "threatpulse.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source_ip TEXT,
                destination_ip TEXT,
                username TEXT,
                event_type TEXT,
                protocol TEXT,
                port INTEGER,
                severity TEXT,
                anomaly_score REAL,
                risk_score REAL,
                bytes_sent INTEGER,
                bytes_received INTEGER,
                privilege_level INTEGER,
                asset_criticality INTEGER,
                is_malicious INTEGER,
                simulation_id TEXT,
                explanation TEXT,
                evidence TEXT,
                features TEXT
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                event_id TEXT,
                threat_name TEXT,
                severity TEXT,
                risk_score REAL,
                anomaly_score REAL,
                detection_time_seconds REAL,
                timestamp TEXT,
                source_ip TEXT,
                destination_ip TEXT,
                username TEXT,
                explanation TEXT,
                evidence TEXT,
                within_60_seconds INTEGER,
                incident_id TEXT
            );

            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                threat_name TEXT,
                first_seen TEXT,
                last_seen TEXT,
                source_ip TEXT,
                target TEXT,
                severity TEXT,
                risk_score REAL,
                status TEXT,
                detection_time_seconds REAL,
                explanation TEXT,
                evidence TEXT,
                related_event_ids TEXT,
                timeline TEXT,
                investigation_priority TEXT,
                simulation_id TEXT,
                within_60_seconds INTEGER
            );

            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts(timestamp);
            CREATE INDEX IF NOT EXISTS idx_incidents_risk ON incidents(risk_score);
            """
        )


def _json_dumps(value: Any) -> str:
    return json.dumps(value, default=str)


def _json_loads(value: Optional[str], default: Any = None) -> Any:
    if not value:
        return default if default is not None else []
    return json.loads(value)


def insert_event(event: dict[str, Any]) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO events (
                id, timestamp, source_ip, destination_ip, username, event_type,
                protocol, port, severity, anomaly_score, risk_score, bytes_sent,
                bytes_received, privilege_level, asset_criticality, is_malicious,
                simulation_id, explanation, evidence, features
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event["id"],
                event["timestamp"] if isinstance(event["timestamp"], str) else event["timestamp"].isoformat(),
                event.get("source_ip"),
                event.get("destination_ip"),
                event.get("username"),
                event.get("event_type"),
                event.get("protocol"),
                event.get("port"),
                event.get("severity"),
                event.get("anomaly_score", 0),
                event.get("risk_score", 0),
                event.get("bytes_sent", 0),
                event.get("bytes_received", 0),
                event.get("privilege_level", 0),
                event.get("asset_criticality", 1),
                1 if event.get("is_malicious") else 0,
                event.get("simulation_id"),
                event.get("explanation"),
                _json_dumps(event.get("evidence", [])),
                _json_dumps(event.get("features", {})),
            ),
        )


def insert_alert(alert: dict[str, Any]) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO alerts (
                id, event_id, threat_name, severity, risk_score, anomaly_score,
                detection_time_seconds, timestamp, source_ip, destination_ip,
                username, explanation, evidence, within_60_seconds, incident_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                alert["id"],
                alert.get("event_id"),
                alert.get("threat_name"),
                alert.get("severity"),
                alert.get("risk_score"),
                alert.get("anomaly_score"),
                alert.get("detection_time_seconds"),
                alert["timestamp"] if isinstance(alert["timestamp"], str) else alert["timestamp"].isoformat(),
                alert.get("source_ip"),
                alert.get("destination_ip"),
                alert.get("username"),
                alert.get("explanation"),
                _json_dumps(alert.get("evidence", [])),
                1 if alert.get("within_60_seconds") else 0,
                alert.get("incident_id"),
            ),
        )


def upsert_incident(incident: dict[str, Any]) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO incidents (
                id, threat_name, first_seen, last_seen, source_ip, target,
                severity, risk_score, status, detection_time_seconds, explanation,
                evidence, related_event_ids, timeline, investigation_priority,
                simulation_id, within_60_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident["id"],
                incident.get("threat_name"),
                incident["first_seen"] if isinstance(incident["first_seen"], str) else incident["first_seen"].isoformat(),
                incident["last_seen"] if isinstance(incident["last_seen"], str) else incident["last_seen"].isoformat(),
                incident.get("source_ip"),
                incident.get("target"),
                incident.get("severity"),
                incident.get("risk_score"),
                incident.get("status"),
                incident.get("detection_time_seconds", 0),
                incident.get("explanation", ""),
                _json_dumps(incident.get("evidence", [])),
                _json_dumps(incident.get("related_event_ids", [])),
                _json_dumps(incident.get("timeline", [])),
                incident.get("investigation_priority", "P3"),
                incident.get("simulation_id"),
                1 if incident.get("within_60_seconds", True) else 0,
            ),
        )


def row_to_event(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "source_ip": row["source_ip"],
        "destination_ip": row["destination_ip"],
        "username": row["username"],
        "event_type": row["event_type"],
        "protocol": row["protocol"],
        "port": row["port"],
        "severity": row["severity"],
        "anomaly_score": row["anomaly_score"],
        "risk_score": row["risk_score"],
        "bytes_sent": row["bytes_sent"],
        "bytes_received": row["bytes_received"],
        "privilege_level": row["privilege_level"],
        "asset_criticality": row["asset_criticality"],
        "is_malicious": bool(row["is_malicious"]),
        "simulation_id": row["simulation_id"],
        "explanation": row["explanation"],
        "evidence": _json_loads(row["evidence"], []),
        "features": _json_loads(row["features"], {}),
    }


def row_to_alert(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "event_id": row["event_id"],
        "threat_name": row["threat_name"],
        "severity": row["severity"],
        "risk_score": row["risk_score"],
        "anomaly_score": row["anomaly_score"],
        "detection_time_seconds": row["detection_time_seconds"],
        "timestamp": row["timestamp"],
        "source_ip": row["source_ip"],
        "destination_ip": row["destination_ip"],
        "username": row["username"],
        "explanation": row["explanation"],
        "evidence": _json_loads(row["evidence"], []),
        "within_60_seconds": bool(row["within_60_seconds"]),
        "incident_id": row["incident_id"],
    }


def row_to_incident(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "threat_name": row["threat_name"],
        "first_seen": row["first_seen"],
        "last_seen": row["last_seen"],
        "source_ip": row["source_ip"],
        "target": row["target"],
        "severity": row["severity"],
        "risk_score": row["risk_score"],
        "status": row["status"],
        "detection_time_seconds": row["detection_time_seconds"],
        "explanation": row["explanation"],
        "evidence": _json_loads(row["evidence"], []),
        "related_event_ids": _json_loads(row["related_event_ids"], []),
        "timeline": _json_loads(row["timeline"], []),
        "investigation_priority": row["investigation_priority"],
        "simulation_id": row["simulation_id"],
        "within_60_seconds": bool(row["within_60_seconds"]),
    }


def list_events(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_dir: str = "desc",
) -> tuple[list[dict[str, Any]], int]:
    allowed_sort = {"timestamp", "risk_score", "anomaly_score", "event_type", "severity"}
    if sort_by not in allowed_sort:
        sort_by = "timestamp"
    direction = "DESC" if sort_dir.lower() != "asc" else "ASC"

    clauses: list[str] = []
    params: list[Any] = []
    if search:
        clauses.append(
            "(source_ip LIKE ? OR destination_ip LIKE ? OR username LIKE ? OR event_type LIKE ? OR id LIKE ?)"
        )
        like = f"%{search}%"
        params.extend([like, like, like, like, like])
    if event_type:
        clauses.append("event_type = ?")
        params.append(event_type)
    if severity:
        clauses.append("severity = ?")
        params.append(severity)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    with get_db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM events {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM events {where} ORDER BY {sort_by} {direction} LIMIT ? OFFSET ?",
            [*params, limit, offset],
        ).fetchall()
    return [row_to_event(r) for r in rows], total


def list_alerts(limit: int = 50) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY risk_score DESC, timestamp DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [row_to_alert(r) for r in rows]


def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    threat: Optional[str] = None,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if severity:
        clauses.append("severity = ?")
        params.append(severity)
    if status:
        clauses.append("status = ?")
        params.append(status)
    if threat:
        clauses.append("threat_name LIKE ?")
        params.append(f"%{threat}%")
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with get_db() as conn:
        rows = conn.execute(
            f"SELECT * FROM incidents {where} ORDER BY risk_score DESC, last_seen DESC",
            params,
        ).fetchall()
    return [row_to_incident(r) for r in rows]


def get_incident(incident_id: str) -> Optional[dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    return row_to_incident(row) if row else None


def update_incident_status(incident_id: str, status: str) -> Optional[dict[str, Any]]:
    with get_db() as conn:
        conn.execute("UPDATE incidents SET status = ? WHERE id = ?", (status, incident_id))
    return get_incident(incident_id)


def clear_all() -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM events")
        conn.execute("DELETE FROM alerts")
        conn.execute("DELETE FROM incidents")
        conn.execute("DELETE FROM metrics")


def count_table(table: str) -> int:
    with get_db() as conn:
        return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def events_since(seconds: int = 60) -> list[dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM events
            WHERE datetime(timestamp) >= datetime('now', ?)
            ORDER BY timestamp ASC
            """,
            (f"-{seconds} seconds",),
        ).fetchall()
    return [row_to_event(r) for r in rows]


def save_metrics_blob(data: dict[str, Any]) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO metrics (id, data) VALUES (1, ?)",
            (_json_dumps(data),),
        )


def load_metrics_blob() -> dict[str, Any]:
    with get_db() as conn:
        row = conn.execute("SELECT data FROM metrics WHERE id = 1").fetchone()
    if not row:
        return {}
    return _json_loads(row["data"], {})


def now_iso() -> str:
    return datetime.utcnow().isoformat()
