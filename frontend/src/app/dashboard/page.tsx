"use client";

import { DetectionWindow } from "@/components/dashboard/DetectionWindow";
import { KpiCard } from "@/components/dashboard/KpiCards";
import { LiveEventStream } from "@/components/dashboard/LiveEventStream";
import { LiveThreatCharts } from "@/components/dashboard/LiveThreatCharts";
import { ThreatDetectionPanel } from "@/components/dashboard/ThreatDetectionPanel";
import { ThreatPriorityQueue } from "@/components/dashboard/ThreatPriorityQueue";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { useThreatPulse } from "@/hooks/useThreatPulse";
import {
  Activity,
  Clock,
  Gauge,
  ShieldAlert,
  Siren,
} from "lucide-react";

export default function DashboardPage() {
  const {
    events,
    incidents,
    metrics,
    simulation,
    connected,
    latestAlert,
    startSimulation,
    stopSimulation,
    resetSimulation,
  } = useThreatPulse();

  return (
    <AppShell connected={connected} systemStatus={metrics.system_status}>
      <PageHeader
        title="SOC Dashboard"
        description="Real-time monitoring, hybrid detection, and prioritized incident response"
      />

      <DetectionWindow
        metrics={metrics}
        simulation={simulation}
        onStart={startSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active Threats"
          value={metrics.active_threats}
          icon={ShieldAlert}
          accent="orange"
        />
        <KpiCard
          label="Critical Alerts"
          value={metrics.critical_alerts}
          icon={Siren}
          accent="red"
        />
        <KpiCard
          label="Events/sec"
          value={metrics.events_per_sec.toFixed(1)}
          icon={Activity}
          accent="cyan"
        />
        <KpiCard
          label="Avg Detection Time"
          value={`${metrics.avg_detection_time.toFixed(1)}s`}
          icon={Clock}
          accent="lime"
        />
        <KpiCard
          label="False Positive Reduction"
          value={`${metrics.false_positive_reduction}%`}
          hint="via correlation & prioritization"
          icon={Gauge}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <LiveEventStream events={events} />
        <ThreatDetectionPanel alert={latestAlert} />
        <ThreatPriorityQueue incidents={incidents} />
      </div>

      <LiveThreatCharts metrics={metrics} />
    </AppShell>
  );
}
