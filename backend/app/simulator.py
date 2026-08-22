"""Simulated network event generator and attack scenarios."""

from __future__ import annotations

import asyncio
import random
import uuid
from datetime import datetime
from typing import Any, Awaitable, Callable, Optional

USERS = [
    "j.smith",
    "a.patel",
    "m.chen",
    "s.nguyen",
    "admin",
    "svc-backup",
    "r.wilson",
    "ops.bot",
]

INTERNAL_IPS = [f"10.0.{r}.{h}" for r in range(1, 5) for h in range(10, 40)]
EXTERNAL_IPS = [
    "185.220.101.42",
    "91.219.237.18",
    "45.33.32.156",
    "103.27.202.11",
    "198.51.100.23",
    "203.0.113.77",
    "89.248.165.44",
]
PROTOCOLS = ["TCP", "UDP", "HTTPS", "SSH", "DNS", "SMB"]
NORMAL_TYPES = [
    "LOGIN_SUCCESS",
    "DNS_QUERY",
    "FILE_ACCESS",
    "NETWORK_CONNECTION",
    "PROCESS_START",
]
SUSPICIOUS_TYPES = [
    "LOGIN_FAILURE",
    "SUSPICIOUS_DNS",
    "UNUSUAL_NETWORK_TRAFFIC",
    "MULTIPLE_FAILED_LOGINS",
]
MALICIOUS_TYPES = [
    "PORT_SCAN",
    "BRUTE_FORCE",
    "MALWARE_DETECTED",
    "PRIVILEGE_ESCALATION",
    "DATA_EXFILTRATION",
    "UNAUTHORIZED_ACCESS",
]

ProcessFn = Callable[[dict[str, Any]], Awaitable[Optional[dict[str, Any]]]]


class SimulationEngine:
    def __init__(self) -> None:
        self.running = False
        self.simulation_active = False
        self.simulation_id: Optional[str] = None
        self.simulation_started_at: Optional[datetime] = None
        self.phase = "idle"
        self.detection_time_seconds: Optional[float] = None
        self.within_60_seconds: Optional[bool] = None
        self.message = "Idle"
        self._task: Optional[asyncio.Task] = None
        self._attack_task: Optional[asyncio.Task] = None
        self.events_generated = 0
        self._recent_timestamps: list[float] = []

    def events_per_sec(self) -> float:
        now = datetime.utcnow().timestamp()
        self._recent_timestamps = [t for t in self._recent_timestamps if now - t <= 5]
        return round(len(self._recent_timestamps) / 5.0, 2)

    def _base_event(
        self,
        event_type: str,
        *,
        malicious: bool = False,
        simulation_id: Optional[str] = None,
    ) -> dict[str, Any]:
        source = random.choice(EXTERNAL_IPS if malicious else INTERNAL_IPS + EXTERNAL_IPS[:2])
        dest = random.choice(INTERNAL_IPS)
        return {
            "id": f"EVT-{uuid.uuid4().hex[:10].upper()}",
            "timestamp": datetime.utcnow(),
            "source_ip": source,
            "destination_ip": dest,
            "username": random.choice(USERS),
            "event_type": event_type,
            "protocol": random.choice(PROTOCOLS),
            "port": random.choice([22, 53, 80, 443, 3389, 8080, 445, 3306, 5432]),
            "severity": "LOW",
            "anomaly_score": 0.0,
            "risk_score": 0.0,
            "bytes_sent": random.randint(200, 40_000),
            "bytes_received": random.randint(200, 60_000),
            "privilege_level": random.randint(0, 1),
            "asset_criticality": random.randint(1, 3),
            "is_malicious": malicious,
            "simulation_id": simulation_id,
            "explanation": None,
            "evidence": [],
            "features": {},
        }

    def generate_normal(self) -> dict[str, Any]:
        return self._base_event(random.choice(NORMAL_TYPES), malicious=False)

    def generate_suspicious(self) -> dict[str, Any]:
        ev = self._base_event(random.choice(SUSPICIOUS_TYPES), malicious=False)
        if ev["event_type"] == "LOGIN_FAILURE":
            ev["bytes_sent"] = random.randint(100, 800)
        return ev

    def generate_malicious(self) -> dict[str, Any]:
        etype = random.choice(MALICIOUS_TYPES)
        ev = self._base_event(etype, malicious=True)
        if etype == "DATA_EXFILTRATION":
            ev["bytes_sent"] = random.randint(2_500_000, 8_000_000)
            ev["asset_criticality"] = 5
        if etype == "PRIVILEGE_ESCALATION":
            ev["privilege_level"] = 4
            ev["username"] = "admin"
        if etype == "PORT_SCAN":
            ev["port"] = random.randint(1, 1024)
        return ev

    async def start_background(self, process_event: ProcessFn, interval: float = 0.45) -> None:
        if self.running:
            return
        self.running = True
        self._task = asyncio.create_task(self._loop(process_event, interval))

    async def stop_background(self) -> None:
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _loop(self, process_event: ProcessFn, interval: float) -> None:
        while self.running:
            try:
                roll = random.random()
                if self.simulation_active:
                    event = self.generate_normal() if roll < 0.7 else self.generate_suspicious()
                else:
                    if roll < 0.88:
                        event = self.generate_normal()
                    elif roll < 0.97:
                        event = self.generate_suspicious()
                    else:
                        event = self.generate_malicious()
                await process_event(event)
                self.events_generated += 1
                self._recent_timestamps.append(datetime.utcnow().timestamp())
            except asyncio.CancelledError:
                raise
            except Exception:
                pass
            await asyncio.sleep(interval)

    async def start_attack_simulation(self, process_event: ProcessFn) -> dict[str, Any]:
        if self.simulation_active:
            return self.status()
        self.simulation_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
        self.simulation_started_at = datetime.utcnow()
        self.simulation_active = True
        self.detection_time_seconds = None
        self.within_60_seconds = None
        self.phase = "normal"
        self.message = "Attack simulation started — generating normal baseline traffic"
        self._attack_task = asyncio.create_task(self._run_attack_sequence(process_event))
        return self.status()

    async def stop_attack_simulation(self) -> dict[str, Any]:
        self.simulation_active = False
        self.phase = "stopped"
        self.message = "Simulation stopped"
        if self._attack_task:
            self._attack_task.cancel()
            try:
                await self._attack_task
            except asyncio.CancelledError:
                pass
            self._attack_task = None
        return self.status()

    async def _run_attack_sequence(self, process_event: ProcessFn) -> None:
        try:
            attacker_ip = random.choice(EXTERNAL_IPS)
            target = random.choice(INTERNAL_IPS)
            victim_users = random.sample(USERS, 4)
            sim_id = self.simulation_id

            await asyncio.sleep(2.0)
            self.phase = "suspicious"
            self.message = "Suspicious authentication activity emerging"

            for i in range(12):
                if not self.simulation_active:
                    return
                ev = self._base_event("LOGIN_FAILURE", malicious=True, simulation_id=sim_id)
                ev["source_ip"] = attacker_ip
                ev["destination_ip"] = target
                ev["username"] = victim_users[i % len(victim_users)]
                ev["port"] = 22
                ev["protocol"] = "SSH"
                ev["asset_criticality"] = 4
                ev["simulation_started_at"] = self.simulation_started_at
                await process_event(ev)
                await asyncio.sleep(0.35)

            self.phase = "anomaly"
            self.message = "Anomaly detected — credential attack pattern"

            for _ in range(3):
                if not self.simulation_active:
                    return
                ev = self._base_event("BRUTE_FORCE", malicious=True, simulation_id=sim_id)
                ev["source_ip"] = attacker_ip
                ev["destination_ip"] = target
                ev["username"] = victim_users[0]
                ev["simulation_started_at"] = self.simulation_started_at
                await process_event(ev)
                await asyncio.sleep(0.4)

            await asyncio.sleep(1.0)
            self.phase = "compromise"
            self.message = "Successful login after failures — risk escalating"

            ev = self._base_event("LOGIN_SUCCESS", malicious=True, simulation_id=sim_id)
            ev["source_ip"] = attacker_ip
            ev["destination_ip"] = target
            ev["username"] = victim_users[0]
            ev["port"] = 22
            ev["protocol"] = "SSH"
            ev["asset_criticality"] = 5
            ev["simulation_started_at"] = self.simulation_started_at
            await process_event(ev)
            await asyncio.sleep(1.2)

            self.phase = "privilege"
            self.message = "Privilege escalation observed"
            ev = self._base_event("PRIVILEGE_ESCALATION", malicious=True, simulation_id=sim_id)
            ev["source_ip"] = attacker_ip
            ev["destination_ip"] = target
            ev["username"] = victim_users[0]
            ev["privilege_level"] = 5
            ev["asset_criticality"] = 5
            ev["simulation_started_at"] = self.simulation_started_at
            await process_event(ev)
            await asyncio.sleep(1.5)

            self.phase = "exfil_prep"
            self.message = "Unusual network activity — possible staging"
            for _ in range(4):
                if not self.simulation_active:
                    return
                ev = self._base_event("UNUSUAL_NETWORK_TRAFFIC", malicious=True, simulation_id=sim_id)
                ev["source_ip"] = target
                ev["destination_ip"] = attacker_ip
                ev["bytes_sent"] = random.randint(400_000, 900_000)
                ev["asset_criticality"] = 5
                ev["simulation_started_at"] = self.simulation_started_at
                await process_event(ev)
                await asyncio.sleep(0.5)

            self.phase = "exfiltration"
            self.message = "Data exfiltration attempt in progress"
            for _ in range(3):
                if not self.simulation_active:
                    return
                ev = self._base_event("DATA_EXFILTRATION", malicious=True, simulation_id=sim_id)
                ev["source_ip"] = target
                ev["destination_ip"] = attacker_ip
                ev["username"] = victim_users[0]
                ev["bytes_sent"] = random.randint(3_000_000, 9_000_000)
                ev["asset_criticality"] = 5
                ev["privilege_level"] = 5
                ev["simulation_started_at"] = self.simulation_started_at
                await process_event(ev)
                await asyncio.sleep(0.7)

            await asyncio.sleep(2.0)
            self.phase = "complete"
            if self.detection_time_seconds is not None:
                status = "PASSED" if self.within_60_seconds else "MISSED"
                self.message = (
                    f"Threat detected in {self.detection_time_seconds:.1f} seconds — "
                    f"60-second objective: {status}"
                )
            else:
                self.message = "Attack sequence complete"
            self.simulation_active = False
        except asyncio.CancelledError:
            self.phase = "cancelled"
            self.message = "Attack simulation cancelled"
            self.simulation_active = False
            raise

    def mark_detection(self, detection_time: float) -> None:
        if self.detection_time_seconds is None and self.simulation_started_at:
            self.detection_time_seconds = round(detection_time, 1)
            self.within_60_seconds = detection_time <= 60.0
            status = "PASSED" if self.within_60_seconds else "MISSED"
            # Keep attack-phase progression; surface detection outcome in message.
            self.message = (
                f"Threat detected in {self.detection_time_seconds:.1f} seconds — "
                f"60-second objective: {status} · continuing kill-chain observation"
            )

    def status(self) -> dict[str, Any]:
        return {
            "active": self.simulation_active,
            "simulation_id": self.simulation_id,
            "started_at": self.simulation_started_at.isoformat() if self.simulation_started_at else None,
            "phase": self.phase,
            "detection_time_seconds": self.detection_time_seconds,
            "within_60_seconds": self.within_60_seconds,
            "message": self.message,
        }

    def reset(self) -> None:
        self.simulation_active = False
        self.simulation_id = None
        self.simulation_started_at = None
        self.phase = "idle"
        self.detection_time_seconds = None
        self.within_60_seconds = None
        self.message = "Simulation reset"
        if self._attack_task and not self._attack_task.done():
            self._attack_task.cancel()
            self._attack_task = None
