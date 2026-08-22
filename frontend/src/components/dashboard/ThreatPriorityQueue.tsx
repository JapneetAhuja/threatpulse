"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Incident } from "@/types";
import Link from "next/link";

export function ThreatPriorityQueue({ incidents }: { incidents: Incident[] }) {
  const sorted = [...incidents].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Threat Priority Queue</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-2 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No prioritized threats yet.
          </div>
        ) : (
          sorted.slice(0, 12).map((inc, idx) => (
            <Link
              key={inc.id}
              href={`/incidents/${inc.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-400/30 hover:bg-white/[0.05]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 text-xs text-slate-600">{idx + 1}</span>
                <Badge severity={inc.severity}>{inc.severity}</Badge>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {inc.threat_name}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {inc.source_ip} → {inc.target}
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm font-semibold text-[#A3FF12]">
                {Math.round(inc.risk_score)}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
