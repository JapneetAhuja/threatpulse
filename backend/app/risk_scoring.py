"""Transparent risk scoring 0–100."""

from __future__ import annotations

from typing import Any

from .models import Severity


def severity_from_score(score: float) -> Severity:
    if score >= 75:
        return Severity.CRITICAL
    if score >= 50:
        return Severity.HIGH
    if score >= 25:
        return Severity.MEDIUM
    return Severity.LOW


def investigation_priority(score: float, severity: Severity) -> str:
    if severity == Severity.CRITICAL or score >= 85:
        return "P1 — Investigate immediately"
    if severity == Severity.HIGH or score >= 60:
        return "P2 — Investigate within shift"
    if severity == Severity.MEDIUM:
        return "P3 — Triage within 24h"
    return "P4 — Monitor"


def compute_risk_score(
    anomaly_score: float,
    rule_score: float,
    event_frequency: float,
    asset_criticality: int,
    attack_correlation: float,
) -> float:
    """
    Risk Score =
      30% anomaly score
    + 30% rule detection score
    + 20% event frequency
    + 10% asset criticality
    + 10% attack correlation
    """
    anomaly_n = max(0.0, min(100.0, anomaly_score))
    rule_n = max(0.0, min(100.0, rule_score))
    freq_n = max(0.0, min(100.0, event_frequency))
    asset_n = max(0.0, min(100.0, asset_criticality * 20.0))
    corr_n = max(0.0, min(100.0, attack_correlation))

    score = (
        0.30 * anomaly_n
        + 0.30 * rule_n
        + 0.20 * freq_n
        + 0.10 * asset_n
        + 0.10 * corr_n
    )
    return round(min(100.0, max(0.0, score)), 1)


def build_explanation(
    threat_name: str,
    severity: Severity,
    risk_score: float,
    evidence: list[str],
    anomaly_score: float,
    rule_score: float,
    correlation_count: int = 1,
) -> str:
    evidence_text = "; ".join(evidence[:4]) if evidence else "behavioral deviation from baseline"
    corr_text = (
        f" Correlated {correlation_count} related events into a single incident."
        if correlation_count > 1
        else ""
    )
    return (
        f"Flagged as {severity.value} ({threat_name}) because {evidence_text}. "
        f"Hybrid detection combined rule score {rule_score:.0f}/100 with anomaly score "
        f"{anomaly_score:.0f}/100, producing risk score {risk_score:.0f}/100."
        f"{corr_text}"
    )


def score_breakdown(event: dict[str, Any]) -> dict[str, float]:
    return {
        "anomaly": float(event.get("anomaly_score", 0)),
        "rule": float(event.get("features", {}).get("rule_score", 0)),
        "frequency": float(event.get("features", {}).get("request_frequency", 0)),
        "asset": float(event.get("asset_criticality", 1)) * 20,
        "correlation": float(event.get("features", {}).get("correlation", 0)),
    }
