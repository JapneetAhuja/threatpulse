"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL, apiGet, apiPost } from "@/lib/utils";
import type {
  Alert,
  Incident,
  Metrics,
  SecurityEvent,
  SimulationStatus,
  WsMessage,
} from "@/types";

const emptyMetrics: Metrics = {
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
  system_status: "CONNECTING",
  simulation_active: false,
  detection_window: null,
};

export function useThreatPulse() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [simulation, setSimulation] = useState<SimulationStatus>({
    active: false,
    phase: "idle",
    message: "Idle",
  });
  const [connected, setConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upsertIncident = useCallback((incident: Incident) => {
    setIncidents((prev) => {
      const idx = prev.findIndex((i) => i.id === incident.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = incident;
      else next.unshift(incident);
      return next.sort((a, b) => b.risk_score - a.risk_score).slice(0, 100);
    });
  }, []);

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.metrics) setMetrics(msg.metrics);
      if (msg.simulation) setSimulation(msg.simulation);

      if (msg.type === "snapshot") {
        if (msg.events) setEvents(msg.events.slice().reverse());
        if (msg.alerts) {
          setAlerts(msg.alerts);
          if (msg.alerts[0]) setLatestAlert(msg.alerts[0]);
        }
        if (msg.incidents) {
          setIncidents(
            msg.incidents.slice().sort((a, b) => b.risk_score - a.risk_score)
          );
        }
        return;
      }

      if (msg.type === "reset") {
        setEvents([]);
        setAlerts([]);
        setIncidents([]);
        setLatestAlert(null);
        return;
      }

      if (msg.type === "event" && msg.data) {
        const ev = msg.data as SecurityEvent;
        setEvents((prev) => [ev, ...prev].slice(0, 200));
      }

      if (msg.alert) {
        setLatestAlert(msg.alert);
        setAlerts((prev) => {
          const without = prev.filter((a) => a.incident_id !== msg.alert!.incident_id);
          return [msg.alert!, ...without].slice(0, 100);
        });
      }

      if (msg.incident) {
        upsertIncident(msg.incident);
      }
    },
    [upsertIncident]
  );

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send("ping");
      };

      ws.onmessage = (evt) => {
        try {
          handleMessage(JSON.parse(evt.data) as WsMessage);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          retryRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 15000);

    // bootstrap REST in case WS is slow
    apiGet<Metrics>("/metrics")
      .then(setMetrics)
      .catch(() => undefined);
    apiGet<{ items: Incident[] }>("/incidents")
      .then((r) =>
        setIncidents(r.items.sort((a, b) => b.risk_score - a.risk_score))
      )
      .catch(() => undefined);

    return () => {
      cancelled = true;
      clearInterval(ping);
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [handleMessage]);

  const startSimulation = useCallback(async () => {
    const status = await apiPost<SimulationStatus>("/simulation/start");
    setSimulation(status);
    return status;
  }, []);

  const stopSimulation = useCallback(async () => {
    const status = await apiPost<SimulationStatus>("/simulation/stop");
    setSimulation(status);
    return status;
  }, []);

  const resetSimulation = useCallback(async () => {
    await apiPost("/simulation/reset");
    setEvents([]);
    setAlerts([]);
    setIncidents([]);
    setLatestAlert(null);
    setSimulation({ active: false, phase: "idle", message: "Simulation reset" });
  }, []);

  return {
    events,
    alerts,
    incidents,
    metrics,
    simulation,
    connected,
    latestAlert,
    startSimulation,
    stopSimulation,
    resetSimulation,
  };
}
