"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, severityDot } from "@/lib/utils";
import type { SecurityEvent } from "@/types";

export function LiveEventStream({ events }: { events: SecurityEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live Event Stream</CardTitle>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
          {events.length} buffered
        </span>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-2 overflow-y-auto p-3">
        {events.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Waiting for events…
          </div>
        ) : (
          events.slice(0, 40).map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[70px_1fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs transition hover:border-violet-400/25"
            >
              <div className="font-mono text-slate-500">{formatTime(e.timestamp)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${severityDot(e.severity)}`} />
                  <span className="font-medium text-slate-100">{e.event_type}</span>
                </div>
                <div className="mt-0.5 text-slate-500">
                  {e.source_ip} → {e.destination_ip}
                  {e.username ? ` · ${e.username}` : ""}
                </div>
              </div>
              <div className="text-right">
                <Badge severity={e.severity}>{e.severity}</Badge>
                <div className="mt-1 font-mono text-slate-400">
                  R {Math.round(e.risk_score)}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
