"use client";

import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet, formatDateTime } from "@/lib/utils";
import type { Incident } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    apiGet<Incident | { error: string }>(`/incidents/${params.id}`)
      .then((data) => {
        if ("error" in data) {
          setError(true);
          return;
        }
        setIncident(data as Incident);
      })
      .catch(() => setError(true));
  }, [params?.id]);

  return (
    <AppShell connected systemStatus="HEALTHY" maxWidth="max-w-5xl">
      <Link
        href="/incidents"
        className="text-sm text-[#A3FF12] hover:underline"
      >
        ← Back to incidents
      </Link>

      {error || !incident ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            {error ? "Incident not found." : "Loading incident…"}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-slate-500">{incident.id}</div>
              <PageHeader title={incident.threat_name} description={incident.explanation} />
            </div>
            <Badge severity={incident.severity}>{incident.severity}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Risk Score", `${Math.round(incident.risk_score)}/100`],
              ["Detection Time", `${incident.detection_time_seconds?.toFixed(1)}s`],
              ["Status", incident.status],
              ["Priority", incident.investigation_priority],
            ].map(([k, v]) => (
              <Card key={k} glow>
                <CardContent className="p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {k}
                  </div>
                  <div className="mt-1.5 text-lg font-semibold text-white">{v}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Threat Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <div>
                  <span className="text-slate-500">Source IP: </span>
                  {incident.source_ip}
                </div>
                <div>
                  <span className="text-slate-500">Target: </span>
                  {incident.target}
                </div>
                <div>
                  <span className="text-slate-500">First Seen: </span>
                  {formatDateTime(incident.first_seen)}
                </div>
                <div>
                  <span className="text-slate-500">Last Seen: </span>
                  {formatDateTime(incident.last_seen)}
                </div>
                <div>
                  <span className="text-slate-500">Related Events: </span>
                  {incident.related_event_ids?.length || 0}
                </div>
                {incident.within_60_seconds ? (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-emerald-300">
                    Detected within 60-second objective
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(incident.evidence || []).map((e) => (
                    <li
                      key={e}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                    >
                      {e}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(incident.timeline || []).map((t, idx) => (
                <div
                  key={`${t.timestamp}-${idx}`}
                  className="flex gap-3 border-l-2 border-violet-400/40 pl-4"
                >
                  <div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(t.timestamp)}
                    </div>
                    <div className="text-sm font-medium text-white">{t.event_type}</div>
                    <div className="text-xs text-slate-400">{t.detail}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader>
              <CardTitle>AI-Generated Explanation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-300">
              {incident.explanation}
              <div className="mt-3 text-xs text-slate-500">
                Generated from rule evidence, anomaly scores, and correlated event stages —
                no external LLM API required.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
