import { cn, severityColor } from "@/lib/utils";
import type { Severity } from "@/types";
import type { ReactNode } from "react";

export function Badge({
  severity,
  children,
  className,
}: {
  severity?: Severity | string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        severity ? severityColor(severity) : "border-white/15 bg-white/5 text-slate-300",
        className
      )}
    >
      {children}
    </span>
  );
}
