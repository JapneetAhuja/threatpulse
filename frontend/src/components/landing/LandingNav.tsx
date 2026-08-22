"use client";

import { Logo } from "@/components/brand/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#workflow", label: "Workflow" },
  { href: "/architecture", label: "Architecture" },
  { href: "/dashboard", label: "SOC" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all",
          scrolled
            ? "border-white/10 bg-[#0b1020]/85 shadow-lg shadow-black/30 backdrop-blur-xl"
            : "border-white/15 bg-white text-slate-900 shadow-xl shadow-black/10"
        )}
      >
        <Logo light={!scrolled} compact />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                scrolled
                  ? "text-slate-300 hover:bg-white/5 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/architecture"
            className={cn(
              "hidden rounded-full border px-3.5 py-1.5 text-sm font-medium sm:inline-flex",
              scrolled
                ? "border-white/20 text-white hover:bg-white/5"
                : "border-slate-900 bg-slate-950 text-white hover:bg-slate-800"
            )}
          >
            View Architecture
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-violet-600/30 hover:brightness-110"
          >
            Launch SOC
          </Link>
        </div>
      </div>
    </header>
  );
}
