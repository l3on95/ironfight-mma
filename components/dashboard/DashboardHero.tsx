"use client";

import Icon, { type IconName } from "@/components/ui/Icon";

export type HeroAccent = "cyan" | "pink" | "amber";

const ACCENTS: Record<
  HeroAccent,
  { color: string; soft: string; border: string }
> = {
  cyan: {
    color: "var(--ta-cyan)",
    soft: "rgba(35,196,206,.14)",
    border: "rgba(35,196,206,.35)",
  },
  pink: {
    color: "var(--ta-pink)",
    soft: "rgba(255,79,168,.13)",
    border: "rgba(255,79,168,.35)",
  },
  amber: {
    color: "var(--ta-amber)",
    soft: "rgba(138,99,232,.12)",
    border: "rgba(138,99,232,.35)",
  },
};

/**
 * Rollen-Hero für alle Dashboards: Hintergrundbild (Tidal-Gym) mit
 * Verlaufs-Overlay, Rollen-Badge, Begrüßung und hereinwachsender Akzentlinie.
 */
export default function DashboardHero({
  badges,
  accent = "cyan",
  title,
  subtitle,
  children,
}: {
  badges: { label: string; accent: HeroAccent; icon?: IconName }[];
  accent?: HeroAccent;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="relative overflow-hidden border-b" style={{ borderColor: a.border }}>
      {/* Hintergrundbild — Tidal-Gym, stark abgedunkelt */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/hero-gym.png)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(105deg, rgba(3,4,6,.96) 30%, rgba(3,4,6,.78) 60%, rgba(3,4,6,.55)), radial-gradient(420px 260px at 95% 10%, ${a.soft}, transparent 65%)`,
        }}
        aria-hidden="true"
      />
      <div className="retro-scanlines absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="rise flex items-center gap-2">
          {badges.map((b) => {
            const ba = ACCENTS[b.accent];
            return (
              <span
                key={b.label}
                className="font-mono-ta inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase"
                style={{
                  letterSpacing: "0.18em",
                  background: ba.soft,
                  border: `1px solid ${ba.border}`,
                  color: ba.color,
                }}
              >
                {b.icon && <Icon name={b.icon} size={12} strokeWidth={2.2} />}
                {b.label}
              </span>
            );
          })}
        </div>

        <h1
          className="rise-1 font-display-ta mt-3 font-black uppercase leading-none text-white"
          style={{ fontSize: "clamp(30px, 5vw, 50px)", letterSpacing: "0.02em" }}
        >
          {title}
        </h1>

        {/* Akzentlinie */}
        <div
          className="animate-grow-x mt-3 h-[3px] w-24 rounded-full"
          style={{ background: `linear-gradient(90deg, ${a.color}, transparent)` }}
        />

        {subtitle && (
          <p
            className="rise-2 font-mono-ta mt-3 text-[11px] uppercase"
            style={{ letterSpacing: "0.2em", color: "rgba(201,209,218,.75)" }}
          >
            {subtitle}
          </p>
        )}

        {children && <div className="rise-3 mt-5">{children}</div>}
      </div>
    </div>
  );
}
