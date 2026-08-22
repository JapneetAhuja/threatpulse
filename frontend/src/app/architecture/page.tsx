import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

const stages = [
  {
    title: "Simulated Network Events",
    text: "Continuous generator produces normal, suspicious, and malicious telemetry with realistic volumes.",
  },
  {
    title: "Real-time Event Ingestion",
    text: "FastAPI ingests events and fans them out to the SOC over WebSockets.",
  },
  {
    title: "Preprocessing",
    text: "Normalize timestamps, identities, asset criticality, and traffic counters.",
  },
  {
    title: "Feature Extraction",
    text: "Derive login failure counts, request frequency, ports contacted, bytes, privilege level, and more.",
  },
  {
    title: "Hybrid Detection Engine",
    text: "Rule engine catches known bad patterns; Isolation Forest scores behavioral anomalies.",
    children: ["Rule Engine", "ML Anomaly Detector"],
  },
  {
    title: "Event Correlation",
    text: "Related signals are grouped into a single incident to reduce alert overload.",
  },
  {
    title: "Risk Scoring",
    text: "Transparent 0–100 score blends anomaly, rules, frequency, asset criticality, and correlation.",
  },
  {
    title: "Alert Prioritization",
    text: "Incidents are ranked so critical compromise chains surface first.",
  },
  {
    title: "Explainable Threat Analysis",
    text: "Evidence-backed narratives explain why each threat was flagged — no paid LLM required.",
  },
  {
    title: "SOC Dashboard",
    text: "Live KPIs, streams, charts, detection timer, and investigation views for analysts.",
  },
];

export default function ArchitecturePage() {
  return (
    <AppShell connected systemStatus="HEALTHY" maxWidth="max-w-4xl">
      <PageHeader
        title="System Architecture"
        description="End-to-end pipeline from simulated telemetry to prioritized, explainable incidents"
        action={
          <Link
            href="/dashboard"
            className="rounded-full bg-[#A3FF12] px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-105"
          >
            Open SOC Dashboard
          </Link>
        }
      />

      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div key={stage.title} className="flex flex-col items-center">
            <Card className="w-full" glow={idx === 4 || idx === 9}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#A3FF12]/25 bg-[#A3FF12]/10 text-xs font-semibold text-[#A3FF12]">
                    {idx + 1}
                  </span>
                  {stage.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{stage.text}</p>
                {stage.children ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {stage.children.map((c) => (
                      <div
                        key={c}
                        className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {idx < stages.length - 1 ? (
              <ArrowDown className="my-2 h-5 w-5 text-violet-400/50" />
            ) : null}
          </div>
        ))}
      </div>

      <Card glow>
        <CardHeader>
          <CardTitle>Risk Score Formula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm text-slate-300">
          <div>
            Risk = 30% anomaly + 30% rules + 20% frequency + 10% asset + 10% correlation
          </div>
          <div className="text-slate-500">
            Severity: 0–24 LOW · 25–49 MEDIUM · 50–74 HIGH · 75–100 CRITICAL
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
