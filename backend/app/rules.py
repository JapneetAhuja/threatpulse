"""Rule-based detection engine for known suspicious behaviors."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Deque, Dict, List, Optional, Tuple


@dataclass
class RuleHit:
    rule_name: str
    threat_name: str
    score: float
    evidence: List[str] = field(default_factory=list)


class RuleEngine:
    """Stateful sliding-window rule engine."""

    def __init__(self, window_seconds: int = 60) -> None:
        self.window = timedelta(seconds=window_seconds)
        self.login_failures: Dict[str, Deque[datetime]] = defaultdict(deque)
        self.login_failure_users: Dict[str, set] = defaultdict(set)
        self.port_contacts: Dict[str, Deque[Tuple[datetime, int, str]]] = defaultdict(deque)
        self.dns_queries: Dict[str, Deque[datetime]] = defaultdict(deque)
        self.bytes_out: Dict[str, Deque[Tuple[datetime, int]]] = defaultdict(deque)
        self.privilege_changes: Dict[str, Deque[Tuple[datetime, int]]] = defaultdict(deque)
        self.request_times: Dict[str, Deque[datetime]] = defaultdict(deque)
        self.successful_logins: Dict[str, datetime] = {}

    def _prune(self, dq: Deque, now: datetime) -> None:
        cutoff = now - self.window
        while dq and (dq[0] if not isinstance(dq[0], tuple) else dq[0][0]) < cutoff:
            dq.popleft()

    def evaluate(self, event: dict[str, Any]) -> RuleHit:
        now = event["timestamp"] if isinstance(event["timestamp"], datetime) else datetime.fromisoformat(str(event["timestamp"]))
        source = event.get("source_ip", "unknown")
        etype = event.get("event_type", "")
        username = event.get("username") or "unknown"
        evidence: List[str] = []
        score = 0.0
        threat_name = "Benign Activity"
        rule_name = "baseline"

        self.request_times[source].append(now)
        self._prune(self.request_times[source], now)
        freq = len(self.request_times[source])

        # Brute force / multiple failed logins
        if etype in {"LOGIN_FAILURE", "MULTIPLE_FAILED_LOGINS", "BRUTE_FORCE"}:
            self.login_failures[source].append(now)
            self.login_failure_users[source].add(username)
            self._prune(self.login_failures[source], now)
            fail_count = len(self.login_failures[source])
            unique_users = len(self.login_failure_users[source])
            if fail_count >= 5 or etype == "BRUTE_FORCE":
                score = max(score, min(95.0, 40 + fail_count * 3 + unique_users * 5))
                threat_name = "Credential Attack"
                rule_name = "brute_force"
                evidence.append(f"{fail_count} failed login attempts within {self.window.seconds} seconds")
                if unique_users > 1:
                    evidence.append(f"Same source IP targeting {unique_users} accounts")
                if freq > 15:
                    evidence.append("Abnormally high request frequency")
                evidence.append("Unusual authentication behavior")

        # Successful login after failures
        if etype == "LOGIN_SUCCESS":
            self._prune(self.login_failures[source], now)
            fail_count = len(self.login_failures[source])
            self.successful_logins[source] = now
            if fail_count >= 3:
                score = max(score, min(90.0, 55 + fail_count * 2))
                threat_name = "Credential Attack"
                rule_name = "auth_success_after_failures"
                evidence.append(f"Successful login after {fail_count} failures from {source}")
                evidence.append("Possible credential compromise")

        # Port scan
        if etype == "PORT_SCAN" or (etype == "NETWORK_CONNECTION" and event.get("is_malicious")):
            port = int(event.get("port", 0))
            dest = event.get("destination_ip", "")
            self.port_contacts[source].append((now, port, dest))
            self._prune(self.port_contacts[source], now)
            ports = {p for _, p, _ in self.port_contacts[source]}
            hosts = {h for _, _, h in self.port_contacts[source]}
            if len(ports) >= 8 or len(hosts) >= 5 or etype == "PORT_SCAN":
                score = max(score, min(92.0, 45 + len(ports) * 2 + len(hosts) * 3))
                threat_name = "Port Scan"
                rule_name = "port_scan"
                evidence.append(f"Source contacted {len(ports)} ports across {len(hosts)} hosts rapidly")
                evidence.append("Reconnaissance pattern consistent with network scanning")

        # Privilege escalation
        if etype == "PRIVILEGE_ESCALATION" or event.get("privilege_level", 0) >= 3:
            priv = int(event.get("privilege_level", 3))
            self.privilege_changes[username].append((now, priv))
            self._prune(self.privilege_changes[username], now)
            score = max(score, 88.0 if etype == "PRIVILEGE_ESCALATION" else 70.0)
            threat_name = "Privilege Escalation"
            rule_name = "privilege_escalation"
            evidence.append("User moved from normal activity to privileged activity")
            if source in self.successful_logins:
                evidence.append("Privilege change closely followed authentication")
            evidence.append(f"Observed privilege level: {priv}")

        # Data exfiltration
        bytes_sent = int(event.get("bytes_sent", 0))
        self.bytes_out[source].append((now, bytes_sent))
        self._prune(self.bytes_out[source], now)
        total_out = sum(b for _, b in self.bytes_out[source])
        if etype == "DATA_EXFILTRATION" or total_out > 5_000_000 or bytes_sent > 2_000_000:
            score = max(score, min(98.0, 60 + min(35, total_out / 500_000)))
            threat_name = "Data Exfiltration"
            rule_name = "data_exfiltration"
            evidence.append(f"Outbound volume spike: {total_out:,} bytes in window")
            evidence.append("Abnormally large outbound traffic relative to baseline")

        # Suspicious DNS
        if etype in {"SUSPICIOUS_DNS", "DNS_QUERY"}:
            self.dns_queries[source].append(now)
            self._prune(self.dns_queries[source], now)
            dns_count = len(self.dns_queries[source])
            if etype == "SUSPICIOUS_DNS" or dns_count > 20:
                score = max(score, min(85.0, 35 + dns_count))
                threat_name = "Suspicious DNS"
                rule_name = "suspicious_dns"
                evidence.append(f"DNS behavior deviation: {dns_count} queries in window")
                evidence.append("Query patterns deviate from normal baseline")

        # Malware / unauthorized access
        if etype == "MALWARE_DETECTED":
            score = max(score, 93.0)
            threat_name = "Malware Detected"
            rule_name = "malware"
            evidence.append("Endpoint protection signature matched known malware indicator")
        if etype == "UNAUTHORIZED_ACCESS":
            score = max(score, 86.0)
            threat_name = "Unauthorized Access"
            rule_name = "unauthorized_access"
            evidence.append("Access attempt outside authorized policy scope")
        if etype == "UNUSUAL_NETWORK_TRAFFIC":
            score = max(score, 68.0)
            threat_name = "Unusual Network Traffic"
            rule_name = "unusual_traffic"
            evidence.append("Network traffic volume/pattern outside historical baseline")

        if freq > 25 and score < 40:
            score = max(score, 42.0)
            threat_name = "Abnormal Request Frequency"
            rule_name = "request_frequency"
            evidence.append(f"High request frequency: {freq} events from source in window")

        return RuleHit(rule_name=rule_name, threat_name=threat_name, score=score, evidence=evidence)

    def reset(self) -> None:
        self.login_failures.clear()
        self.login_failure_users.clear()
        self.port_contacts.clear()
        self.dns_queries.clear()
        self.bytes_out.clear()
        self.privilege_changes.clear()
        self.request_times.clear()
        self.successful_logins.clear()
