"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metrics, SimulationStatus } from "@/types";
import { RotateCcw, Siren, Square } from "lucide-react";
import { useEffect, useState } from "react";

export function DetectionWindow({
  metrics,
  simulation,
  onStart,
  onStop,
  onReset,
}: {
  metrics: Metrics;
  simulation: SimulationStatus;
  onStart: () => Promise<unknown>;
  onStop: () => Promise<unknown>;
  onReset: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const window = metrics.detection_window;
  const active =
    simulation.active || Boolean(window?.active && !window?.detection_time);

  useEffect(() => {
    if (!simulation.active || !simulation.started_at) {
      if (simulation.detection_time_seconds != null) {
        setElapsed(simulation.detection_time_seconds);
      }
      return;
    }
    const start = new Date(simulation.started_at).getTime();
    const tick = () => {
      const e = (Date.now() - start) / 1000;
      setElapsed(Math.min(60, Math.max(0, e)));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [simulation.active, simulation.started_at, simulation.detection_time_seconds]);

  const displayElapsed =
    simulation.detection_time_seconds != null
      ? simulation.detection_time_seconds
      : elapsed;
  const progress = Math.min(100, (displayElapsed / 60) * 100);
  const passed = simulation.within_60_seconds === true;
  const failed = simulation.within_60_seconds === false;

  return (
    <Card glow className="border-violet-400/20">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">60-Second Detection Window</CardTitle>
          <p className="mt-0.5 text-xs text-slate-400">
            Launch a kill-chain simulation and track detection against the objective
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="danger"
            disabled={busy || simulation.active}
            onClick={async () => {
              setBusy(true);
              try {
                await onStart();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Siren className="h-4 w-4" />
            Start Attack Simulation
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !simulation.active}
            onClick={async () => {
              setBusy(true);
              try {
                await onStop();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onReset();
                setElapsed(0);
              } finally {
                setBusy(false);
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Elapsed Detection Time
            </div>
            <div className="font-mono text-3xl text-white">
              {displayElapsed.toFixed(1)}
              <span className="text-base text-slate-500">s</span>
              <span className="ml-2 text-sm text-slate-500">/ 60s</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Phase
            </div>
            <div className="text-sm font-semibold capitalize text-[#A3FF12]">
              {simulation.phase || "idle"}
            </div>
          </div>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all ${
              passed
                ? "bg-emerald-400"
                : failed
                  ? "bg-red-400"
                  : "bg-gradient-to-r from-violet-500 to-[#A3FF12]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
          {simulation.message || "Ready to launch attack simulation."}
        </div>

        {simulation.detection_time_seconds != null ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              passed
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
          >
            Threat detected in {simulation.detection_time_seconds.toFixed(1)} seconds —{" "}
            60-second objective: {passed ? "PASSED" : "MISSED"}
          </div>
        ) : null}

        {active ? (
          <div className="text-xs text-slate-500">
            Demo flow: Normal → Suspicious → Anomaly → Risk ↑ → Correlation → Critical
            Incident → Prioritized → Explanation
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
