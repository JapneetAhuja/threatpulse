import { cn } from "@/lib/utils";
import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="tp-g" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A3FF12" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#0B1020" stroke="url(#tp-g)" strokeWidth="1.5" />
      <path
        d="M20 8.5L29.5 13.2V21.8C29.5 27.1 25.4 31.1 20 32.5C14.6 31.1 10.5 27.1 10.5 21.8V13.2L20 8.5Z"
        stroke="url(#tp-g)"
        strokeWidth="1.6"
        fill="rgba(163,255,18,0.06)"
      />
      <path
        d="M14.2 20.2L18.1 24L25.8 16.4"
        stroke="#A3FF12"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="12.2" r="1.4" fill="#22D3EE" />
    </svg>
  );
}

export function Logo({
  href = "/",
  compact = false,
  light = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-[17px] font-semibold tracking-tight",
            light ? "text-slate-900" : "text-white"
          )}
        >
          ThreatPulse
        </div>
        {!compact ? (
          <div
            className={cn(
              "mt-1 text-[9px] font-medium uppercase tracking-[0.22em]",
              light ? "text-slate-500" : "text-slate-400"
            )}
          >
            The 60-Second Breach
          </div>
        ) : null}
      </div>
    </Link>
  );
}
