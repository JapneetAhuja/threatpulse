import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function GlassCard({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "violet" | "lime" | "cyan" | "none";
}) {
  const glows = {
    violet: "shadow-[0_0_40px_-10px_rgba(124,58,237,0.45)]",
    lime: "shadow-[0_0_40px_-10px_rgba(163,255,18,0.35)]",
    cyan: "shadow-[0_0_40px_-10px_rgba(34,211,238,0.35)]",
    none: "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]",
  };
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl",
        glows[glow || "none"],
        className
      )}
    >
      {children}
    </div>
  );
}

export function MetricGlassCard({
  label,
  value,
  delta,
  positive = true,
  spark = [12, 18, 14, 22, 19, 28, 24, 32],
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  spark?: number[];
}) {
  const max = Math.max(...spark);
  return (
    <GlassCard className="p-4" glow="violet">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-display text-3xl font-semibold text-white">{value}</div>
        {delta ? (
          <span
            className={cn(
              "mb-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              positive ? "bg-[#A3FF12]/15 text-[#A3FF12]" : "bg-red-500/15 text-red-300"
            )}
          >
            {positive ? "↑" : "↓"} {delta}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex h-8 items-end gap-1">
        {spark.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-violet-500/20 to-cyan-300/80"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
    </GlassCard>
  );
}

export function StatHighlightCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <GlassCard className="p-5" glow="lime">
      <Icon className="h-5 w-5 text-[#A3FF12]" />
      <div className="mt-4 font-display text-4xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </div>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </GlassCard>
  );
}
