import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "cyan" | "red" | "emerald" | "amber" | "orange" | "violet" | "lime";
}) {
  const accents = {
    cyan: "text-cyan-300 border-cyan-400/25 bg-cyan-400/10",
    red: "text-red-300 border-red-400/25 bg-red-400/10",
    emerald: "text-emerald-300 border-emerald-400/25 bg-emerald-400/10",
    amber: "text-amber-200 border-amber-400/25 bg-amber-400/10",
    orange: "text-orange-300 border-orange-400/25 bg-orange-400/10",
    violet: "text-violet-300 border-violet-400/25 bg-violet-400/10",
    lime: "text-[#A3FF12] border-[#A3FF12]/25 bg-[#A3FF12]/10",
  };
  return (
    <Card glow className="transition hover:border-violet-400/25">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </div>
          <div className="mt-1.5 font-display text-2xl font-semibold text-white">
            {value}
          </div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        <div className={cn("rounded-xl border p-2.5", accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
