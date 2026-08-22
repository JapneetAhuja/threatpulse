"use client";

import { AppShell, PageHeader, fieldClass } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet, formatDateTime } from "@/lib/utils";
import type { SecurityEvent } from "@/types";
import { useEffect, useState } from "react";

const EVENT_TYPES = [
  "",
  "LOGIN_FAILURE",
  "LOGIN_SUCCESS",
  "PORT_SCAN",
  "BRUTE_FORCE",
  "SUSPICIOUS_DNS",
  "MALWARE_DETECTED",
  "PRIVILEGE_ESCALATION",
  "DATA_EXFILTRATION",
  "UNUSUAL_NETWORK_TRAFFIC",
  "MULTIPLE_FAILED_LOGINS",
  "UNAUTHORIZED_ACCESS",
  "DNS_QUERY",
  "FILE_ACCESS",
  "NETWORK_CONNECTION",
  "PROCESS_START",
];

export default function EventsPage() {
  const [items, setItems] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const limit = 20;

  const load = async () => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(page * limit),
      sort_by: sortBy,
      sort_dir: sortDir,
    });
    if (search) params.set("search", search);
    if (eventType) params.set("event_type", eventType);
    if (severity) params.set("severity", severity);
    const data = await apiGet<{ items: SecurityEvent[]; total: number }>(
      `/events?${params}`
    );
    setItems(data.items);
    setTotal(data.total);
  };

  useEffect(() => {
    load().catch(() => undefined);
    const id = setInterval(() => load().catch(() => undefined), 3000);
    return () => clearInterval(id);
  }, [search, eventType, severity, sortBy, sortDir, page]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <AppShell connected systemStatus="HEALTHY">
      <PageHeader
        title="Events"
        description="Full telemetry stream with search, filters, sorting, and pagination"
      />

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <input
            className={`${fieldClass} md:col-span-2`}
            placeholder="Search IP, user, type, ID…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
          <select
            className={fieldClass}
            value={eventType}
            onChange={(e) => {
              setPage(0);
              setEventType(e.target.value);
            }}
          >
            <option value="">All Types</option>
            {EVENT_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={severity}
            onChange={(e) => {
              setPage(0);
              setSeverity(e.target.value);
            }}
          >
            <option value="">All Severities</option>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [b, d] = e.target.value.split(":");
              setSortBy(b);
              setSortDir(d);
            }}
          >
            <option value="timestamp:desc">Newest</option>
            <option value="timestamp:asc">Oldest</option>
            <option value="risk_score:desc">Risk ↓</option>
            <option value="risk_score:asc">Risk ↑</option>
            <option value="anomaly_score:desc">Anomaly ↓</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  {["Time", "Type", "Source", "Dest", "User", "Severity", "Risk", "Anomaly"].map(
                    (h) => (
                      <th key={h} className="px-3 py-3 font-semibold">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr
                    key={e.id}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                    onClick={() => setSelected(e)}
                  >
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {formatDateTime(e.timestamp)}
                    </td>
                    <td className="px-3 py-2 text-slate-100">{e.event_type}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.source_ip}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.destination_ip}</td>
                    <td className="px-3 py-2 text-slate-400">{e.username || "—"}</td>
                    <td className="px-3 py-2">
                      <Badge severity={e.severity}>{e.severity}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-violet-300">
                      {Math.round(e.risk_score)}
                    </td>
                    <td className="px-3 py-2 font-mono text-cyan-300">
                      {Math.round(e.anomaly_score)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm">
            <span className="text-slate-500">
              {total} events · page {page + 1}/{pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                disabled={page + 1 >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>

        <Card glow>
          <CardHeader>
            <CardTitle>Event Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {!selected ? (
              <div className="text-slate-500">Select an event to inspect details.</div>
            ) : (
              <>
                <div className="font-mono text-xs text-[#A3FF12]">{selected.id}</div>
                <Detail label="Type" value={selected.event_type} />
                <Detail label="Timestamp" value={formatDateTime(selected.timestamp)} />
                <Detail label="Source" value={selected.source_ip} />
                <Detail label="Destination" value={selected.destination_ip} />
                <Detail label="Username" value={selected.username || "—"} />
                <Detail label="Protocol" value={selected.protocol} />
                <Detail label="Port" value={String(selected.port)} />
                <Detail label="Severity" value={selected.severity} />
                <Detail label="Risk Score" value={String(selected.risk_score)} />
                <Detail label="Anomaly Score" value={String(selected.anomaly_score)} />
                <Detail label="Bytes Sent" value={String(selected.bytes_sent ?? 0)} />
                <Detail label="Bytes Received" value={String(selected.bytes_received ?? 0)} />
                {selected.explanation ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed">
                    {selected.explanation}
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-100">{value}</span>
    </div>
  );
}
