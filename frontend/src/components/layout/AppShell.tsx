import { TopNav } from "@/components/layout/TopNav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppShell({
  children,
  connected,
  systemStatus,
  className,
  maxWidth = "max-w-[1600px]",
}: {
  children: ReactNode;
  connected?: boolean;
  systemStatus?: string;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070612] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-15%,rgba(124,58,237,0.38),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_90%_10%,rgba(34,211,238,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_35%_25%_at_10%_30%,rgba(163,255,18,0.06),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
      </div>
      <TopNav connected={connected} systemStatus={systemStatus} />
      <main className={cn("mx-auto space-y-4 px-4 py-5", maxWidth, className)}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export const fieldClass =
  "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/30";
