"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/incidents", label: "Incidents" },
  { href: "/events", label: "Events" },
  { href: "/architecture", label: "Architecture" },
];

export function TopNav({
  connected,
  systemStatus,
}: {
  connected?: boolean;
  systemStatus?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1020]/80 px-4 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Logo compact href="/" />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-white/10 text-[#A3FF12]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden items-center gap-1.5 text-slate-400 sm:flex">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            System Status:{" "}
            <span className="font-medium text-emerald-400">
              {systemStatus || "HEALTHY"}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
              connected
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/30 bg-amber-400/10 text-amber-300"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              )}
            />
            {connected ? "LIVE" : "RECONNECTING"}
          </div>
        </div>
      </div>
    </header>
  );
}
