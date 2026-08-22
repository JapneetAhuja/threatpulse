import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "lime";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-gradient-to-r from-violet-600 to-indigo-500 text-white border border-violet-400/30 shadow-md shadow-violet-600/25 hover:brightness-110",
    lime: "bg-[#A3FF12] text-slate-950 border border-[#A3FF12]/50 shadow-[0_0_24px_-6px_rgba(163,255,18,0.55)] hover:brightness-105",
    secondary:
      "bg-white/5 hover:bg-white/10 text-slate-100 border border-white/15 backdrop-blur",
    danger:
      "bg-red-600/90 hover:bg-red-500 text-white border border-red-400/40 shadow-md shadow-red-600/20",
    ghost:
      "bg-transparent hover:bg-white/5 text-slate-300 border border-transparent",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
