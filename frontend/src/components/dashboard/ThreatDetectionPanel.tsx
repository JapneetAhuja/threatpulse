"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { Alert } from "@/types";

export function ThreatDetectionPanel({ alert }: { alert: Alert | null }) {
  return (
    <Card className="h-full border-red-400/20" glow>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          Threat Detection Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!alert ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
            No active threat flagged yet. Launch an attack simulation to demonstrate
            detection.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
                Threat Detected
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h4 className="text-lg font-semibold text-white">{alert.threat_name}</h4>
                <Badge severity={alert.severity}>{alert.severity}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Risk Score</div>
                  <div className="font-mono text-xl text-red-300">
                    {Math.round(alert.risk_score)}
                    <span className="text-sm text-slate-500">/100</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Detection Time</div>
                  <div className="font-mono text-xl text-white">
                    {alert.detection_time_seconds?.toFixed(1) ?? "—"}s
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Why Flagged
              </div>
              <ul className="space-y-1.5">
                {(alert.evidence || []).map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                  >
                    <span className="text-[#A3FF12]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-slate-300">
              {alert.explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
