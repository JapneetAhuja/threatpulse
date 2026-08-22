"use client";

import { useEffect, useSyncExternalStore } from "react";
import { demoEngine } from "@/lib/demoEngine";
import type { Alert, Incident, Metrics, SecurityEvent, SimulationStatus } from "@/types";

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
  system_status: "HEALTHY",
  simulation_active: false,
  detection_window: null,
};

/**
 * Live SOC data from the in-browser demo engine.
 * Works on Netlify with no backend, API keys, or tunnels.
 */
export function useThreatPulse() {
  const snap = useSyncExternalStore(
    demoEngine.subscribe,
    () => ({
      events: demoEngine.events as SecurityEvent[],
      alerts: demoEngine.alerts as Alert[],
      incidents: demoEngine.incidents as Incident[],
      metrics: demoEngine.metrics,
      simulation: demoEngine.simulation as SimulationStatus,
      connected: demoEngine.connected,
      latestAlert: demoEngine.latestAlert as Alert | null,
    }),
    () => ({
      events: [] as SecurityEvent[],
      alerts: [] as Alert[],
      incidents: [] as Incident[],
      metrics: emptyMetrics,
      simulation: {
        active: false,
        phase: "idle",
        message: "Browser demo mode",
      } as SimulationStatus,
      connected: false,
      latestAlert: null as Alert | null,
    })
  );

  useEffect(() => {
    demoEngine.start();
  }, []);

  return {
    ...snap,
    startSimulation: async () => demoEngine.startAttackSimulation(),
    stopSimulation: async () => demoEngine.stopAttackSimulation(),
    resetSimulation: async () => {
      demoEngine.reset();
      demoEngine.start();
    },
  };
}
