"""Pydantic models and shared enums for ThreatPulse."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, Enum):
    NEW = "NEW"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"


class EventType(str, Enum):
    LOGIN_FAILURE = "LOGIN_FAILURE"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    PORT_SCAN = "PORT_SCAN"
    BRUTE_FORCE = "BRUTE_FORCE"
    SUSPICIOUS_DNS = "SUSPICIOUS_DNS"
    MALWARE_DETECTED = "MALWARE_DETECTED"
    PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION"
    DATA_EXFILTRATION = "DATA_EXFILTRATION"
    UNUSUAL_NETWORK_TRAFFIC = "UNUSUAL_NETWORK_TRAFFIC"
    MULTIPLE_FAILED_LOGINS = "MULTIPLE_FAILED_LOGINS"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
    DNS_QUERY = "DNS_QUERY"
    FILE_ACCESS = "FILE_ACCESS"
    NETWORK_CONNECTION = "NETWORK_CONNECTION"
    PROCESS_START = "PROCESS_START"


class SecurityEvent(BaseModel):
    id: str
    timestamp: datetime
    source_ip: str
    destination_ip: str
    username: Optional[str] = None
    event_type: str
    protocol: str = "TCP"
    port: int = 443
    severity: Severity = Severity.LOW
    anomaly_score: float = 0.0
    risk_score: float = 0.0
    bytes_sent: int = 0
    bytes_received: int = 0
    privilege_level: int = 0
    asset_criticality: int = 1
    is_malicious: bool = False
    simulation_id: Optional[str] = None
    explanation: Optional[str] = None
    evidence: list[str] = Field(default_factory=list)
    features: dict[str, float] = Field(default_factory=dict)


class Alert(BaseModel):
    id: str
    event_id: str
    threat_name: str
    severity: Severity
    risk_score: float
    anomaly_score: float
    detection_time_seconds: float
    timestamp: datetime
    source_ip: str
    destination_ip: str
    username: Optional[str] = None
    explanation: str
    evidence: list[str] = Field(default_factory=list)
    within_60_seconds: bool = True
    incident_id: Optional[str] = None


class Incident(BaseModel):
    id: str
    threat_name: str
    first_seen: datetime
    last_seen: datetime
    source_ip: str
    target: str
    severity: Severity
    risk_score: float
    status: IncidentStatus = IncidentStatus.NEW
    detection_time_seconds: float = 0.0
    explanation: str = ""
    evidence: list[str] = Field(default_factory=list)
    related_event_ids: list[str] = Field(default_factory=list)
    timeline: list[dict[str, Any]] = Field(default_factory=list)
    investigation_priority: str = "P3"
    simulation_id: Optional[str] = None
    within_60_seconds: bool = True


class Metrics(BaseModel):
    active_threats: int = 0
    critical_alerts: int = 0
    events_per_sec: float = 0.0
    avg_detection_time: float = 0.0
    false_positive_reduction: float = 72.0
    total_events: int = 0
    total_alerts: int = 0
    total_incidents: int = 0
    severity_distribution: dict[str, int] = Field(default_factory=dict)
    risk_distribution: dict[str, int] = Field(default_factory=dict)
    events_over_time: list[dict[str, Any]] = Field(default_factory=list)
    threats_over_time: list[dict[str, Any]] = Field(default_factory=list)
    system_status: str = "HEALTHY"
    simulation_active: bool = False
    detection_window: Optional[dict[str, Any]] = None


class SimulationStatus(BaseModel):
    active: bool
    simulation_id: Optional[str] = None
    started_at: Optional[datetime] = None
    phase: str = "idle"
    detection_time_seconds: Optional[float] = None
    within_60_seconds: Optional[bool] = None
    message: str = ""
