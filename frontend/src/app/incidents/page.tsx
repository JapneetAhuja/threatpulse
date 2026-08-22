"use client";

import { AppShell, PageHeader, fieldClass } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoEngine } from "@/lib/demoEngine";
import { formatDateTime } from "@/lib/utils";
import type { Incident } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export default function IncidentsPage() {
  const incidents = useSyncExternalStore(
    demoEngine.subscribe,
    () => demoEngine.incidents,
    () => [] as Incident[]
  );
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [threat, setThreat] = useState("");

  useEffect(() => {
    demoEngine.start();
  }, []);

  const filtered = useMemo(
    () =>
      demoEngine.listIncidents({
        severity: severity || undefined,
        status: status || undefined,
        threat: threat || undefined,
      }),
    [incidents, severity, status, threat]
  );

  return (
    <AppShell connected systemStatus="HEALTHY">
      <PageHeader
        title="Incidents"
        description="Correlated threats prioritized by risk — not raw alert volume"
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select className={fieldClass} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {["NEW", "INVESTIGATING", "CONTAINED", "RESOLVED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className={`${fieldClass} md:col-span-2`}
            placeholder="Filter by threat type…"
            value={threat}
            onChange={(e) => setThreat(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.14em] text-slate-400">
              <tr>
                {["Incident ID", "Threat", "First Seen", "Last Seen", "Source", "Target", "Severity", "Risk", "Status", "Detection"].map((h) => (
                  <th key={h} className="px-3 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    No incidents yet. Run an attack simulation from the dashboard.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <Link href={`/incidents/${inc.id}`} className="font-mono text-[#A3FF12] hover:underline">
                        {inc.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-100">{inc.threat_name}</td>
                    <td className="px-3 py-3 text-slate-400">{formatDateTime(inc.first_seen)}</td>
                    <td className="px-3 py-3 text-slate-400">{formatDateTime(inc.last_seen)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-300">{inc.source_ip}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-300">{inc.target}</td>
                    <td className="px-3 py-3"><Badge severity={inc.severity}>{inc.severity}</Badge></td>
                    <td className="px-3 py-3 font-mono font-semibold text-violet-300">{Math.round(inc.risk_score)}</td>
                    <td className="px-3 py-3 text-slate-300">{inc.status}</td>
                    <td className="px-3 py-3 font-mono text-slate-300">{inc.detection_time_seconds?.toFixed(1)}s</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
