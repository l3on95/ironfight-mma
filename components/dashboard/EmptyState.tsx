"use client";

import Icon, { type IconName } from "@/components/ui/Icon";

/** Leerer Zustand mit Icon statt Emoji — für Listen ohne Daten. */
export default function EmptyState({
  icon = "spark",
  title,
  hint,
  children,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{ border: "1px dashed var(--ink-5)", background: "rgba(255,255,255,.02)" }}
    >
      <div
        className="animate-float mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: "var(--ink-3)", color: "var(--ta-cyan)" }}
      >
        <Icon name={icon} size={24} />
      </div>
      <p className="text-sm font-bold" style={{ color: "var(--fg-3)" }}>
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--fg-4)" }}>
          {hint}
        </p>
      )}
      {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
    </div>
  );
}
