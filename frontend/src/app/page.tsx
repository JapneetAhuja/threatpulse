import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  GlassCard,
  MetricGlassCard,
  StatHighlightCard,
} from "@/components/landing/GlassCards";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  ListOrdered,
  Radio,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";

const capabilities = [
  {
    id: "detect",
    title: "Hybrid Detection",
    body: "Rule engine for known kill-chain behaviors plus Isolation Forest anomaly scoring on live telemetry features.",
    points: [
      "Brute force, port scan, privilege escalation",
      "ML anomaly scores from traffic baselines",
      "Transparent severity mapping 0–100",
    ],
  },
  {
    id: "correlate",
    title: "Alert Correlation",
    body: "Collapse noisy related events into one prioritized incident so analysts investigate meaning, not volume.",
    points: [
      "Kill-chain staging across login → escalate → exfil",
      "Fewer duplicate alerts, higher signal",
      "Investigation-ready timelines",
    ],
  },
  {
    id: "explain",
    title: "Explainable Priority",
    body: "Every critical finding ships with evidence and a human-readable rationale — no paid LLM required.",
    points: [
      "Evidence list tied to scoring inputs",
      "Risk formula analysts can defend",
      "60-second detection window tracking",
    ],
  },
];

const workflow = [
  { step: "01", title: "Ingest", text: "Simulated enterprise events stream in real time over WebSockets." },
  { step: "02", title: "Detect", text: "Hybrid rules + ML flag suspicious and malicious patterns." },
  { step: "03", title: "Correlate", text: "Related signals merge into a single high-value incident." },
  { step: "04", title: "Prioritize", text: "Risk scoring ranks CRITICAL threats above alert noise." },
  { step: "05", title: "Explain", text: "Evidence-backed narratives guide the analyst response." },
];

const pillars = [
  { icon: Clock3, title: "60-Second Detection", text: "Close the breach window before lateral movement completes." },
  { icon: Radio, title: "Real-time SOC", text: "Live KPIs, event stream, and charts without page reloads." },
  { icon: Eye, title: "Explainable AI", text: "Understand why each alert fired — with proof, not black boxes." },
  { icon: ListOrdered, title: "Prioritized Queue", text: "Highest risk always surfaces first for human action." },
  { icon: UserCheck, title: "Human-controlled", text: "Analysts own status, investigation, and containment decisions." },
  { icon: ShieldCheck, title: "Enterprise posture", text: "Designed to look and feel like a production security platform." },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#070612] text-white">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.45),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(34,211,238,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_15%_40%,rgba(163,255,18,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
        <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-400/10 to-cyan-400/20 blur-3xl" />
      </div>

      <LandingNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-16 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#A3FF12]" />
            The AI-assisted SOC platform
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl">
            ThreatPulse
          </h1>
          <p className="mt-3 font-display text-2xl font-medium text-white/90 md:text-4xl">
            Detect the Threat Before the Breach.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
            Real-time threat detection, prioritization and explainable security
            intelligence — within 60 seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#A3FF12] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_-6px_rgba(163,255,18,0.7)] transition hover:brightness-105"
            >
              Launch SOC Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              View Architecture
            </Link>
          </div>
        </div>

        {/* Premium floating product cards */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <GlassCard className="overflow-hidden p-3 md:p-4" glow="violet">
            <div className="rounded-xl border border-white/10 bg-[#0a0d1a]/90 p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <LogoMark className="h-6 w-6" />
                  <span className="font-medium">SOC Overview</span>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  ● LIVE
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <MetricGlassCard label="Open alerts" value="128" delta="4.1%" spark={[8, 10, 9, 14, 12, 16, 15, 18]} />
                <MetricGlassCard label="Critical / High" value="2,440" delta="3.4%" spark={[20, 18, 22, 25, 21, 28, 30, 27]} />
                <MetricGlassCard label="Unassigned" value="36" delta="1.2%" positive={false} spark={[14, 12, 11, 13, 10, 9, 12, 11]} />
                <MetricGlassCard label="Assets at risk" value="19" delta="0.8%" spark={[6, 8, 7, 9, 11, 10, 12, 13]} />
                <MetricGlassCard label="Avg detect" value="3.8s" delta="12%" spark={[30, 26, 22, 18, 16, 14, 12, 10]} />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
                <GlassCard className="p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Top unmitigated alerts by severity
                  </div>
                  <div className="space-y-2.5">
                    {[
                      ["CRITICAL", "Credential Attack", "auth-gateway-01"],
                      ["CRITICAL", "Data Exfiltration", "db-finance-03"],
                      ["HIGH", "Privilege Escalation", "jump-host-12"],
                      ["HIGH", "Port Scan", "edge-fw-02"],
                      ["MEDIUM", "Suspicious DNS", "dns-resolver-1"],
                    ].map(([sev, name, asset]) => (
                      <div
                        key={name}
                        className="grid grid-cols-[88px_1fr_auto] items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm"
                      >
                        <span
                          className={
                            sev === "CRITICAL"
                              ? "text-red-400"
                              : sev === "HIGH"
                                ? "text-orange-400"
                                : "text-amber-300"
                          }
                        >
                          ● {sev}
                        </span>
                        <span className="truncate text-slate-200">{name}</span>
                        <span className="truncate text-xs text-slate-500">{asset}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                <div className="space-y-3">
                  <StatHighlightCard
                    icon={Zap}
                    value="45%"
                    label="Fewer alerts & less noise"
                    hint="Correlation collapses kill-chain noise into one incident."
                  />
                  <GlassCard className="p-4" glow="cyan">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Violations prevented
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <div className="font-display text-4xl font-semibold">465</div>
                      <span className="mb-1 rounded-full bg-[#A3FF12]/15 px-2 py-0.5 text-[11px] font-semibold text-[#A3FF12]">
                        ↑ 12%
                      </span>
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-slate-400">
                      <span>35 contained</span>
                      <span>25 investigating</span>
                      <span>10 resolved</span>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CAPABILITIES — page 2 feel */}
      <section id="platform" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A3FF12]">
            Platform
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Built for defenders. Engineered for the 60-second advantage.
          </h2>
          <p className="mt-4 text-slate-400">
            ThreatPulse is a hackathon-ready SOC that demonstrates how hybrid detection,
            correlation, and transparent risk scoring cut through alert overload.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {capabilities.map((cap) => (
            <GlassCard key={cap.id} className="p-6 transition hover:border-violet-400/30" glow="none">
              <div className="mb-4 inline-flex rounded-xl border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-200">
                {cap.id}
              </div>
              <h3 className="font-display text-xl font-semibold text-white">{cap.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{cap.body}</p>
              <ul className="mt-5 space-y-2">
                {cap.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#A3FF12]" />
                    {p}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section id="capabilities" className="border-y border-white/5 bg-white/[0.02] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Capabilities
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Everything a modern SOC needs — simulated, live, explainable.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <GlassCard key={p.title} className="p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <p.icon className="h-5 w-5 text-[#A3FF12]" />
                </div>
                <h3 className="text-base font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW — page 3 feel */}
      <section id="workflow" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
              Workflow
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              From raw events to prioritized action in one continuous loop.
            </h2>
            <p className="mt-4 text-slate-400">
              Press <span className="text-white">Start Attack Simulation</span> on the
              dashboard and watch the full kill chain resolve inside the 60-second window.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#A3FF12] px-5 py-2.5 text-sm font-semibold text-slate-950 hover:brightness-105"
            >
              Start the demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {workflow.map((w, i) => (
              <GlassCard key={w.step} className="flex gap-4 p-4 md:p-5">
                <div className="font-display text-2xl font-semibold text-violet-300/90">
                  {w.step}
                </div>
                <div>
                  <div className="font-semibold text-white">{w.title}</div>
                  <p className="mt-1 text-sm text-slate-400">{w.text}</p>
                  {i < workflow.length - 1 ? (
                    <div className="mt-3 h-px w-full bg-gradient-to-r from-violet-500/40 to-transparent" />
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / STATS STRIP */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["0", "API keys required"],
            ["60s", "Detection objective"],
            ["Hybrid", "Rules + Isolation Forest"],
            ["1", "Correlated incident per attack"],
          ].map(([v, l]) => (
            <GlassCard key={l} className="p-5 text-center">
              <div className="font-display text-3xl font-semibold text-white">{v}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{l}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <GlassCard
          className="relative overflow-hidden px-8 py-12 text-center md:px-16 md:py-16"
          glow="lime"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,255,18,0.12),transparent_60%)]" />
          <div className="relative">
            <Logo className="mx-auto justify-center" />
            <h2 className="mt-6 font-display text-3xl font-semibold md:text-4xl">
              Ready to detect the breach in 60 seconds?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Launch the live SOC, run the attack simulation, and show judges prioritized,
              explainable threat intelligence — entirely local.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#A3FF12] px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-105"
              >
                Launch SOC Dashboard
              </Link>
              <Link
                href="/incidents"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Browse Incidents
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo compact />
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/incidents" className="hover:text-white">
              Incidents
            </Link>
            <Link href="/events" className="hover:text-white">
              Events
            </Link>
            <Link href="/architecture" className="hover:text-white">
              Architecture
            </Link>
          </div>
          <p className="text-xs text-slate-500">ThreatPulse · Hackathon prototype</p>
        </div>
      </footer>
    </main>
  );
}
