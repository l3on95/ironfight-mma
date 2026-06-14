"use client";

import Icon, { type IconName } from "@/components/ui/Icon";
import Link from "next/link";

/** Schnellzugriff-Kachel: Icon, Titel, Untertitel — mit Hover-Lift. */
export default function QuickAction({
  href,
  icon,
  title,
  sub,
  accent = "var(--ta-cyan)",
}: {
  href: string;
  icon: IconName;
  title: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="card-glass card-interactive group flex items-center gap-3 !p-4"
      style={{ textDecoration: "none" }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ color: accent, background: "rgba(255,255,255,.05)" }}
      >
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0">
        <span
          className="font-display-ta block truncate font-black uppercase"
          style={{ fontSize: "14px", letterSpacing: "0.05em", color: "var(--fg)" }}
        >
          {title}
        </span>
        {sub && (
          <span
            className="font-mono-ta block truncate text-[9px] uppercase"
            style={{ letterSpacing: "0.15em", color: "var(--fg-4)" }}
          >
            {sub}
          </span>
        )}
      </span>
      <span
        className="ml-auto shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
        style={{ color: accent }}
      >
        <Icon name="arrow-right" size={16} strokeWidth={2.2} />
      </span>
    </Link>
  );
}
