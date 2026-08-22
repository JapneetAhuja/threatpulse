export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "NEW" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  username?: string | null;
  event_type: string;
  protocol: string;
  port: number;
  severity: Severity;
  anomaly_score: number;
  risk_score: number;
  bytes_sent?: number;
  bytes_received?: number;
  privilege_level?: number;
  asset_criticality?: number;
  is_malicious?: boolean;
  simulation_id?: string | null;
  explanation?: string | null;
  evidence?: string[];
  threat_name?: string | null;
  flagged?: boolean;
}

export interface Alert {
  id: string;
  event_id: string;
  threat_name: string;
  severity: Severity;
  risk_score: number;
  anomaly_score: number;
  detection_time_seconds: number;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  username?: string | null;
  explanation: string;
  evidence: string[];
  within_60_seconds: boolean;
  incident_id?: string | null;
}

export interface Incident {
  id: string;
  threat_name: string;
  first_seen: string;
  last_seen: string;
  source_ip: string;
  target: string;
  severity: Severity;
  risk_score: number;
  status: IncidentStatus;
  detection_time_seconds: number;
  explanation: string;
  evidence: string[];
  related_event_ids: string[];
  timeline: Array<{
    timestamp: string;
    event_type: string;
    detail: string;
    risk_score?: number;
  }>;
  investigation_priority: string;
  simulation_id?: string | null;
  within_60_seconds: boolean;
  related_events?: SecurityEvent[];
}

export interface Metrics {
  active_threats: number;
  critical_alerts: number;
  events_per_sec: number;
  avg_detection_time: number;
  false_positive_reduction: number;
  total_events: number;
  total_alerts: number;
  total_incidents: number;
  severity_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  events_over_time: Array<{ time: string; events: number }>;
  threats_over_time: Array<{ time: string; threats: number }>;
  system_status: string;
  simulation_active: boolean;
  detection_window?: {
    active: boolean;
    elapsed: number;
    detection_time: number | null;
    within_60: boolean | null;
    phase: string;
    message: string;
  } | null;
}

export interface SimulationStatus {
  active: boolean;
  simulation_id?: string | null;
  started_at?: string | null;
  phase: string;
  detection_time_seconds?: number | null;
  within_60_seconds?: boolean | null;
  message: string;
}

export interface WsMessage {
  type: string;
  data?: SecurityEvent | SimulationStatus;
  alert?: Alert | null;
  incident?: Incident | null;
  metrics?: Metrics;
  simulation?: SimulationStatus;
  events?: SecurityEvent[];
  alerts?: Alert[];
  incidents?: Incident[];
}
