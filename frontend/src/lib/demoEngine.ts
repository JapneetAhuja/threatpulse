/**
 * Browser-only SOC demo engine.
 * Runs entirely in the client — no API keys or backend required.
 */

import type {
  Alert,
  Incident,
  Metrics,
  SecurityEvent,
  Severity,
  SimulationStatus,
} from "@/types";

type Listener = () => void;

const USERS = ["j.smith", "a.patel", "m.chen", "s.nguyen", "admin", "svc-backup", "r.wilson"];
const INTERNAL = ["10.0.1.12", "10.0.2.18", "10.0.3.22", "10.0.4.38", "10.0.1.40"];
const EXTERNAL = ["185.220.101.42", "91.219.237.18", "45.33.32.156", "103.27.202.11", "89.248.165.44"];
const NORMAL = ["LOGIN_SUCCESS", "DNS_QUERY", "FILE_ACCESS", "NETWORK_CONNECTION", "PROCESS_START"];
const SUSPICIOUS = ["LOGIN_FAILURE", "SUSPICIOUS_DNS", "UNUSUAL_NETWORK_TRAFFIC", "MULTIPLE_FAILED_LOGINS"];
const PROTOCOLS = ["TCP", "UDP", "HTTPS", "SSH", "DNS"];

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function severityFromRisk(score: number): Severity {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

function emptyMetrics(): Metrics {
  return {
    active_threats: 0,
    critical_alerts: 0,
    events_per_sec: 0,
    avg_detection_time: 0,
    false_positive_reduction: 72.4,
    total_events: 0,
    total_alerts: 0,
    total_incidents: 0,
    severity_distribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    risk_distribution: { "0-24": 0, "25-49": 0, "50-74": 0, "75-100": 0 },
    events_over_time: [],
    threats_over_time: [],
    system_status: "HEALTHY",
    simulation_active: false,
    detection_window: null,
  };
}

class DemoEngine {
  events: SecurityEvent[] = [];
  alerts: Alert[] = [];
  incidents: Incident[] = [];
  metrics: Metrics = emptyMetrics();
  simulation: SimulationStatus = { active: false, phase: "idle", message: "Browser demo mode — no backend required" };
  latestAlert: Alert | null = null;
  connected = true;

  private listeners = new Set<Listener>();
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private attackTimer: ReturnType<typeof setTimeout> | null = null;
  private attackSteps: Array<() => void> = [];
  private failCounts = new Map<string, number>();
  private chartBucket = new Map<string, { events: number; threats: number }>();
  private recentTs: number[] = [];
  private detectionTimes: number[] = [];
  private simStartedAt: number | null = null;
  private simId: string | null = null;
  private openIncidentId: string | null = null;

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  start() {
    if (this.tickTimer) return;
    this.connected = true;
    this.metrics.system_status = "HEALTHY";
    this.tickTimer = setInterval(() => this.backgroundTick(), 500);
    this.emit();
  }

  stop() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
    this.clearAttackTimers();
  }

  private clearAttackTimers() {
    if (this.attackTimer) clearTimeout(this.attackTimer);
    this.attackTimer = null;
    this.attackSteps = [];
  }

  private bumpChart(threat = false) {
    const key = new Date().toISOString().slice(0, 16);
    const b = this.chartBucket.get(key) || { events: 0, threats: 0 };
    b.events += 1;
    if (threat) b.threats += 1;
    this.chartBucket.set(key, b);
  }

  private recomputeMetrics() {
    const now = Date.now();
    this.recentTs = this.recentTs.filter((t) => now - t <= 5000);
    const active = this.incidents.filter((i) => i.status === "NEW" || i.status === "INVESTIGATING");
    const critical = this.incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED");
    const sev = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const a of this.alerts) {
      if (a.severity in sev) sev[a.severity as keyof typeof sev] += 1;
    }
    const risk = { "0-24": 0, "25-49": 0, "50-74": 0, "75-100": 0 };
    for (const e of this.events.slice(0, 200)) {
      const r = e.risk_score;
      if (r < 25) risk["0-24"]++;
      else if (r < 50) risk["25-49"]++;
      else if (r < 75) risk["50-74"]++;
      else risk["75-100"]++;
    }
    const keys = [...this.chartBucket.keys()].sort().slice(-12);
    this.metrics = {
      ...this.metrics,
      active_threats: active.length,
      critical_alerts: critical.length,
      events_per_sec: Math.round((this.recentTs.length / 5) * 10) / 10,
      avg_detection_time:
        this.detectionTimes.length > 0
          ? Math.round((this.detectionTimes.reduce((a, b) => a + b, 0) / this.detectionTimes.length) * 10) / 10
          : 0,
      total_events: this.events.length,
      total_alerts: this.alerts.length,
      total_incidents: this.incidents.length,
      severity_distribution: sev,
      risk_distribution: risk,
      events_over_time: keys.map((k) => ({ time: k.slice(11), events: this.chartBucket.get(k)!.events })),
      threats_over_time: keys.map((k) => ({ time: k.slice(11), threats: this.chartBucket.get(k)!.threats })),
      system_status: "HEALTHY",
      simulation_active: this.simulation.active,
      detection_window: this.simStartedAt
        ? {
            active: this.simulation.active || this.simulation.phase === "complete",
            elapsed: Math.min(60, (Date.now() - this.simStartedAt) / 1000),
            detection_time: this.simulation.detection_time_seconds ?? null,
            within_60: this.simulation.within_60_seconds ?? null,
            phase: this.simulation.phase,
            message: this.simulation.message,
          }
        : null,
    };
  }

  private makeEvent(
    type: string,
    opts: Partial<SecurityEvent> & { malicious?: boolean } = {}
  ): SecurityEvent {
    const malicious = Boolean(opts.malicious || opts.is_malicious);
    const source = opts.source_ip || pick(malicious ? EXTERNAL : [...INTERNAL, ...EXTERNAL.slice(0, 2)]);
    const dest = opts.destination_ip || pick(INTERNAL);
    let risk = malicious ? 55 + Math.random() * 30 : Math.random() * 22;
    let anomaly = malicious ? 55 + Math.random() * 35 : Math.random() * 40;
    const evidence: string[] = [];
    let threat: string | null = null;

    if (type === "LOGIN_FAILURE" || type === "MULTIPLE_FAILED_LOGINS" || type === "BRUTE_FORCE") {
      const n = (this.failCounts.get(source) || 0) + 1;
      this.failCounts.set(source, n);
      if (n >= 5 || type === "BRUTE_FORCE") {
        risk = Math.min(95, 40 + n * 3);
        anomaly = Math.max(anomaly, 60);
        threat = "Credential Attack";
        evidence.push(`${n} failed login attempts within 60 seconds`);
        evidence.push("Same source IP targeting multiple accounts");
        evidence.push("Abnormally high request frequency");
      }
    }
    if (type === "LOGIN_SUCCESS" && (this.failCounts.get(source) || 0) >= 3) {
      risk = Math.max(risk, 78);
      threat = "Credential Attack";
      evidence.push(`Successful login after ${this.failCounts.get(source)} failures`);
      evidence.push("Possible credential compromise");
    }
    if (type === "PRIVILEGE_ESCALATION") {
      risk = Math.max(risk, 88);
      threat = "Privilege Escalation";
      evidence.push("User moved from normal activity to privileged activity");
      evidence.push("Privilege change closely followed authentication");
    }
    if (type === "DATA_EXFILTRATION" || type === "UNUSUAL_NETWORK_TRAFFIC") {
      risk = Math.max(risk, type === "DATA_EXFILTRATION" ? 92 : 68);
      threat = type === "DATA_EXFILTRATION" ? "Data Exfiltration" : "Unusual Network Traffic";
      evidence.push("Outbound volume spike relative to baseline");
      evidence.push("Abnormally large outbound traffic");
    }
    if (type === "PORT_SCAN") {
      risk = Math.max(risk, 79);
      threat = "Port Scan";
      evidence.push("Source contacted many ports across hosts rapidly");
    }

    const severity = severityFromRisk(risk);
    const flagged = risk >= 40 || malicious;
    const explanation = flagged
      ? `Flagged as ${severity}${threat ? ` (${threat})` : ""} because ${
          evidence.slice(0, 3).join("; ") || "behavioral deviation from baseline"
        }. Hybrid detection produced risk score ${Math.round(risk)}/100.`
      : null;

    return {
      id: rid("EVT"),
      timestamp: new Date().toISOString(),
      source_ip: source,
      destination_ip: dest,
      username: opts.username || pick(USERS),
      event_type: type,
      protocol: opts.protocol || pick(PROTOCOLS),
      port: opts.port || pick([22, 53, 80, 443, 3389, 8080]),
      severity,
      anomaly_score: Math.round(anomaly * 10) / 10,
      risk_score: Math.round(risk * 10) / 10,
      bytes_sent: opts.bytes_sent ?? (type === "DATA_EXFILTRATION" ? 4_000_000 + Math.random() * 3_000_000 : 500 + Math.random() * 40_000),
      bytes_received: 500 + Math.random() * 50_000,
      privilege_level: opts.privilege_level ?? (type === "PRIVILEGE_ESCALATION" ? 5 : 0),
      asset_criticality: opts.asset_criticality ?? (malicious ? 4 : 2),
      is_malicious: malicious,
      simulation_id: opts.simulation_id || this.simId,
      explanation,
      evidence,
      threat_name: threat,
      flagged,
    };
  }

  private ingest(event: SecurityEvent) {
    this.events = [event, ...this.events].slice(0, 500);
    this.recentTs.push(Date.now());
    this.bumpChart(false);

    if (event.flagged && event.risk_score >= 40) {
      this.correlate(event);
    }
    this.recomputeMetrics();
    this.emit();
  }

  private correlate(event: SecurityEvent) {
    const now = event.timestamp;
    let incident = this.openIncidentId
      ? this.incidents.find((i) => i.id === this.openIncidentId)
      : undefined;

    const detectionTime = this.simStartedAt
      ? Math.max(0, (Date.now() - this.simStartedAt) / 1000)
      : 0;

    if (!incident) {
      incident = {
        id: rid("INC"),
        threat_name: event.threat_name || "Suspicious Activity",
        first_seen: now,
        last_seen: now,
        source_ip: event.source_ip,
        target: event.destination_ip,
        severity: event.severity,
        risk_score: event.risk_score,
        status: "NEW",
        detection_time_seconds: Math.round(detectionTime * 10) / 10,
        explanation: event.explanation || "",
        evidence: [...(event.evidence || [])],
        related_event_ids: [event.id],
        timeline: [
          {
            timestamp: now,
            event_type: event.event_type,
            detail: `${event.event_type} from ${event.source_ip}`,
            risk_score: event.risk_score,
          },
        ],
        investigation_priority:
          event.severity === "CRITICAL"
            ? "P1 — Investigate immediately"
            : event.severity === "HIGH"
              ? "P2 — Investigate within shift"
              : "P3 — Triage within 24h",
        simulation_id: event.simulation_id,
        within_60_seconds: detectionTime <= 60,
      };
      this.openIncidentId = incident.id;
      this.incidents = [incident, ...this.incidents];
      if (this.simStartedAt && this.simulation.detection_time_seconds == null) {
        this.simulation = {
          ...this.simulation,
          detection_time_seconds: incident.detection_time_seconds,
          within_60_seconds: true,
          phase: this.simulation.active ? this.simulation.phase : "detected",
          message: `Threat detected in ${incident.detection_time_seconds.toFixed(1)} seconds — 60-second objective: PASSED`,
        };
        this.detectionTimes.push(incident.detection_time_seconds);
      }
    } else {
      incident.last_seen = now;
      incident.related_event_ids = [...incident.related_event_ids, event.id];
      incident.timeline = [
        ...incident.timeline,
        {
          timestamp: now,
          event_type: event.event_type,
          detail: `${event.event_type} from ${event.source_ip}`,
          risk_score: event.risk_score,
        },
      ];
      for (const e of event.evidence || []) {
        if (!incident.evidence.includes(e)) incident.evidence.push(e);
      }
      incident.risk_score = Math.max(incident.risk_score, event.risk_score);
      const types = new Set(incident.timeline.map((t) => t.event_type));
      if (
        (types.has("LOGIN_FAILURE") || types.has("BRUTE_FORCE")) &&
        types.has("LOGIN_SUCCESS") &&
        types.has("PRIVILEGE_ESCALATION") &&
        (types.has("DATA_EXFILTRATION") || types.has("UNUSUAL_NETWORK_TRAFFIC"))
      ) {
        incident.threat_name = "Possible Account Compromise & Data Exfiltration";
        incident.risk_score = Math.max(incident.risk_score, 92);
      } else if (event.threat_name && event.risk_score >= incident.risk_score) {
        incident.threat_name = event.threat_name;
      }
      incident.severity = severityFromRisk(incident.risk_score);
      incident.explanation = `Flagged as ${incident.severity} (${incident.threat_name}) because ${incident.evidence
        .slice(0, 4)
        .join("; ")}. Correlated ${incident.related_event_ids.length} related events into a single incident.`;
      incident.investigation_priority =
        incident.severity === "CRITICAL"
          ? "P1 — Investigate immediately"
          : "P2 — Investigate within shift";
      this.incidents = this.incidents.map((i) => (i.id === incident!.id ? { ...incident! } : i));
    }

    const alert: Alert = {
      id: rid("ALT"),
      event_id: event.id,
      threat_name: incident.threat_name,
      severity: incident.severity,
      risk_score: incident.risk_score,
      anomaly_score: event.anomaly_score,
      detection_time_seconds: incident.detection_time_seconds,
      timestamp: now,
      source_ip: incident.source_ip,
      destination_ip: incident.target,
      username: event.username,
      explanation: incident.explanation,
      evidence: incident.evidence,
      within_60_seconds: incident.within_60_seconds,
      incident_id: incident.id,
    };
    this.latestAlert = alert;
    this.alerts = [alert, ...this.alerts.filter((a) => a.incident_id !== incident!.id)].slice(0, 100);
    this.bumpChart(true);
  }

  private backgroundTick() {
    if (this.simulation.active) {
      // noise during attack
      if (Math.random() < 0.7) {
        this.ingest(this.makeEvent(pick(NORMAL)));
      }
      return;
    }
    const roll = Math.random();
    if (roll < 0.88) this.ingest(this.makeEvent(pick(NORMAL)));
    else if (roll < 0.97) this.ingest(this.makeEvent(pick(SUSPICIOUS), { malicious: false }));
    else this.ingest(this.makeEvent(pick(["PORT_SCAN", "BRUTE_FORCE", "MALWARE_DETECTED"]), { malicious: true }));
  }

  startAttackSimulation() {
    if (this.simulation.active) return this.simulation;
    this.clearAttackTimers();
    this.simId = rid("SIM");
    this.simStartedAt = Date.now();
    this.openIncidentId = null;
    this.failCounts.clear();
    const attacker = pick(EXTERNAL);
    const target = pick(INTERNAL);
    const users = [...USERS].sort(() => Math.random() - 0.5).slice(0, 4);

    this.simulation = {
      active: true,
      simulation_id: this.simId,
      started_at: new Date().toISOString(),
      phase: "normal",
      detection_time_seconds: null,
      within_60_seconds: null,
      message: "Attack simulation started — generating normal baseline traffic",
    };
    this.emit();

    const schedule = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms);
      this.attackSteps.push(() => clearTimeout(t));
    };

    schedule(2000, () => {
      this.simulation = {
        ...this.simulation,
        phase: "suspicious",
        message: "Suspicious authentication activity emerging",
      };
      this.emit();
    });

    for (let i = 0; i < 12; i++) {
      schedule(2200 + i * 350, () => {
        this.ingest(
          this.makeEvent("LOGIN_FAILURE", {
            malicious: true,
            source_ip: attacker,
            destination_ip: target,
            username: users[i % users.length],
            port: 22,
            protocol: "SSH",
            simulation_id: this.simId!,
          })
        );
      });
    }

    schedule(6500, () => {
      this.simulation = {
        ...this.simulation,
        phase: "anomaly",
        message: "Anomaly detected — credential attack pattern",
      };
      this.emit();
    });

    for (let i = 0; i < 3; i++) {
      schedule(6700 + i * 400, () => {
        this.ingest(
          this.makeEvent("BRUTE_FORCE", {
            malicious: true,
            source_ip: attacker,
            destination_ip: target,
            username: users[0],
            simulation_id: this.simId!,
          })
        );
      });
    }

    schedule(9000, () => {
      this.simulation = {
        ...this.simulation,
        phase: "compromise",
        message: "Successful login after failures — risk escalating",
      };
      this.emit();
      this.ingest(
        this.makeEvent("LOGIN_SUCCESS", {
          malicious: true,
          source_ip: attacker,
          destination_ip: target,
          username: users[0],
          port: 22,
          protocol: "SSH",
          simulation_id: this.simId!,
        })
      );
    });

    schedule(11000, () => {
      this.simulation = {
        ...this.simulation,
        phase: "privilege",
        message: "Privilege escalation observed",
      };
      this.emit();
      this.ingest(
        this.makeEvent("PRIVILEGE_ESCALATION", {
          malicious: true,
          source_ip: attacker,
          destination_ip: target,
          username: users[0],
          privilege_level: 5,
          simulation_id: this.simId!,
        })
      );
    });

    schedule(13000, () => {
      this.simulation = {
        ...this.simulation,
        phase: "exfil_prep",
        message: "Unusual network activity — possible staging",
      };
      this.emit();
    });

    for (let i = 0; i < 4; i++) {
      schedule(13200 + i * 500, () => {
        this.ingest(
          this.makeEvent("UNUSUAL_NETWORK_TRAFFIC", {
            malicious: true,
            source_ip: target,
            destination_ip: attacker,
            bytes_sent: 500_000 + Math.random() * 400_000,
            simulation_id: this.simId!,
          })
        );
      });
    }

    schedule(16000, () => {
      this.simulation = {
        ...this.simulation,
        phase: "exfiltration",
        message: "Data exfiltration attempt in progress",
      };
      this.emit();
    });

    for (let i = 0; i < 3; i++) {
      schedule(16200 + i * 700, () => {
        this.ingest(
          this.makeEvent("DATA_EXFILTRATION", {
            malicious: true,
            source_ip: target,
            destination_ip: attacker,
            username: users[0],
            bytes_sent: 3_000_000 + Math.random() * 5_000_000,
            privilege_level: 5,
            simulation_id: this.simId!,
          })
        );
      });
    }

    schedule(20000, () => {
      const det = this.simulation.detection_time_seconds;
      const passed = det != null && det <= 60;
      this.simulation = {
        ...this.simulation,
        active: false,
        phase: "complete",
        message:
          det != null
            ? `Threat detected in ${det.toFixed(1)} seconds — 60-second objective: ${passed ? "PASSED" : "MISSED"}`
            : "Attack sequence complete",
      };
      this.recomputeMetrics();
      this.emit();
    });

    return this.simulation;
  }

  stopAttackSimulation() {
    this.clearAttackTimers();
    this.simulation = {
      ...this.simulation,
      active: false,
      phase: "stopped",
      message: "Simulation stopped",
    };
    this.recomputeMetrics();
    this.emit();
    return this.simulation;
  }

  reset() {
    this.clearAttackTimers();
    this.events = [];
    this.alerts = [];
    this.incidents = [];
    this.latestAlert = null;
    this.failCounts.clear();
    this.chartBucket.clear();
    this.recentTs = [];
    this.detectionTimes = [];
    this.simStartedAt = null;
    this.simId = null;
    this.openIncidentId = null;
    this.metrics = emptyMetrics();
    this.simulation = {
      active: false,
      phase: "idle",
      message: "Simulation reset — browser demo ready",
    };
    this.connected = true;
    this.emit();
  }

  getIncident(id: string) {
    return this.incidents.find((i) => i.id === id) || null;
  }

  listEvents(opts: {
    search?: string;
    event_type?: string;
    severity?: string;
    sort_by?: string;
    sort_dir?: string;
    limit?: number;
    offset?: number;
  }) {
    let items = [...this.events];
    if (opts.search) {
      const q = opts.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.source_ip.includes(q) ||
          e.destination_ip.includes(q) ||
          (e.username || "").toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q)
      );
    }
    if (opts.event_type) items = items.filter((e) => e.event_type === opts.event_type);
    if (opts.severity) items = items.filter((e) => e.severity === opts.severity);
    const sortBy = opts.sort_by || "timestamp";
    const dir = opts.sort_dir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortBy];
      const bv = (b as unknown as Record<string, unknown>)[sortBy];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    const total = items.length;
    const offset = opts.offset || 0;
    const limit = opts.limit || 20;
    return { items: items.slice(offset, offset + limit), total };
  }

  listIncidents(opts: { severity?: string; status?: string; threat?: string } = {}) {
    let items = [...this.incidents].sort((a, b) => b.risk_score - a.risk_score);
    if (opts.severity) items = items.filter((i) => i.severity === opts.severity);
    if (opts.status) items = items.filter((i) => i.status === opts.status);
    if (opts.threat) {
      const q = opts.threat.toLowerCase();
      items = items.filter((i) => i.threat_name.toLowerCase().includes(q));
    }
    return items;
  }
}

declare global {
  // Singleton across HMR in development
  var __threatpulseDemo: DemoEngine | undefined;
}

export const demoEngine: DemoEngine =
  globalThis.__threatpulseDemo || (globalThis.__threatpulseDemo = new DemoEngine());

export const USE_BROWSER_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
