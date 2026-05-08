"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { greetingFor } from "@/lib/greeting";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoTimer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoWorkout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IcoBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
function IcoQuiz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}
function IcoDash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const disciplines = [
  {
    slug: "boxing",
    name: "Boxing",
    tag: "Stand-Up",
    glyph: (
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
        <path d="M20 55 C20 40 30 30 50 28 L60 26 L60 38 L52 40 L60 54 L40 60 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" opacity=".7"/>
        <circle cx="58" cy="26" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity=".5"/>
      </svg>
    ),
    cyanAccent: true,
  },
  {
    slug: "wrestling",
    name: "Wrestling",
    tag: "Grappling",
    glyph: (
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
        <path d="M20 20 Q40 10 60 30 Q70 50 50 60 Q30 70 20 50 Z" stroke="currentColor" strokeWidth="2.5" fill="none" opacity=".6"/>
        <path d="M35 25 L45 35 M45 25 L35 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      </svg>
    ),
    cyanAccent: false,
  },
  {
    slug: "bjj",
    name: "BJJ",
    tag: "Ground",
    glyph: (
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
        <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="2.5" fill="none" opacity=".5"/>
        <path d="M28 28 L52 52 M52 28 L28 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
        <circle cx="40" cy="40" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity=".6"/>
      </svg>
    ),
    cyanAccent: false,
  },
  {
    slug: "muay-thai",
    name: "Muay Thai",
    tag: "Stand-Up",
    glyph: (
      <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
        <path d="M40 15 L40 55 M20 35 L60 35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".6"/>
        <path d="M25 20 L40 35 L55 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" opacity=".5"/>
        <path d="M25 50 L40 35 L55 50" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" opacity=".5"/>
      </svg>
    ),
    cyanAccent: true,
  },
];

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  sub: string;
  href: string;
  pink: boolean;
}

const guestQuickActions: QuickAction[] = [
  { icon: <IcoTimer />, title: "Timer", sub: "Runde starten", href: "/timer", pink: false },
  { icon: <IcoWorkout />, title: "Workout", sub: "Generator", href: "/workout/generator", pink: false },
  { icon: <IcoBook />, title: "Techniken", sub: "Bibliothek", href: "/techniques", pink: true },
  { icon: <IcoQuiz />, title: "Regeln", sub: "Quiz & Wissen", href: "/regeln", pink: true },
];

const userQuickActions: QuickAction[] = [
  { icon: <IcoTimer />, title: "Timer", sub: "Runde starten", href: "/timer", pink: false },
  { icon: <IcoWorkout />, title: "Workout", sub: "Generator", href: "/workout/generator", pink: false },
  { icon: <IcoBook />, title: "Techniken", sub: "Bibliothek", href: "/techniques", pink: true },
  { icon: <IcoDash />, title: "Verlauf", sub: "Statistiken", href: "/dashboard", pink: true },
];

const features = [
  {
    icon: <IcoTimer />,
    title: "Smarter Timer",
    desc: "Professioneller Interval-Timer mit Runden, Pausen und Audio-Cues — für jeden Kampfsport konfigurierbar.",
    cyan: true,
  },
  {
    icon: <IcoBook />,
    title: "Technik-Bibliothek",
    desc: "Hunderte Techniken aus Boxing, BJJ, Wrestling und Muay Thai — mit Erklärungen, Variationen und Kurszuordnung.",
    cyan: false,
  },
  {
    icon: <IcoWorkout />,
    title: "Workout-Generator",
    desc: "Strukturierte Workouts nach Disziplin und Ausrüstung — automatisch generiert, sofort startbereit.",
    cyan: true,
  },
];

// ─── Shared Components ────────────────────────────────────────────────────────

function DisciplineGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {disciplines.map((d) => (
        <Link
          key={d.slug}
          href={`/workout/plans/${d.slug}`}
          className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
          style={{
            height: "240px",
            border: "1px solid var(--ink-5)",
            background: d.cyanAccent
              ? "radial-gradient(180px 140px at 85% 10%, rgba(220,38,38,.32), transparent 60%), linear-gradient(160deg, #200808, #060308)"
              : "radial-gradient(180px 140px at 85% 10%, rgba(245,158,11,.24), transparent 60%), linear-gradient(160deg, #1A1208, #06040A)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = d.cyanAccent ? "rgba(220,38,38,.6)" : "rgba(245,158,11,.5)";
            el.style.boxShadow = d.cyanAccent ? "0 4px 40px rgba(220,38,38,.2)" : "0 4px 40px rgba(245,158,11,.15)";
            el.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--ink-5)";
            el.style.boxShadow = "none";
            el.style.transform = "none";
          }}
        >
          {/* Grid overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              WebkitMaskImage: "linear-gradient(145deg, #000 20%, transparent 70%)",
              maskImage: "linear-gradient(145deg, #000 20%, transparent 70%)",
            }}
          />
          {/* Bottom scrim */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(0deg, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 50%, transparent 80%)" }}
          />
          {/* Large background glyph */}
          <div
            className="absolute right-[-24px] top-[-24px] h-44 w-44 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
            style={{ color: d.cyanAccent ? "var(--blood)" : "var(--amber)" }}
          >
            {d.glyph}
          </div>
          {/* Badge */}
          <div className="absolute right-3 top-3 z-10">
            <span className={d.cyanAccent ? "badge-red" : "badge-amber"}>{d.tag}</span>
          </div>
          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
            <div
              className="font-mono-ta text-[9px] uppercase"
              style={{ letterSpacing: "0.22em", color: "var(--fg-3)" }}
            >
              {d.tag}
            </div>
            <div
              className="font-display-ta mt-1 font-black uppercase leading-none"
              style={{ fontSize: "clamp(22px, 3.5vw, 28px)", letterSpacing: "0.04em" }}
            >
              {d.name}
            </div>
            <div
              className="font-mono-ta mt-2 flex items-center gap-1 text-[9px] uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ letterSpacing: "0.18em", color: d.cyanAccent ? "var(--blood)" : "var(--amber)" }}
            >
              Training starten →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuickActionCards({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((qa) => (
        <Link
          key={qa.href}
          href={qa.href}
          className="group flex items-center gap-3.5 rounded-2xl p-4 transition-all duration-200 cursor-pointer"
          style={{
            border: "1px solid var(--ink-4)",
            background: "linear-gradient(180deg, var(--ink-3), var(--ink-2))",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = qa.pink ? "rgba(245,158,11,.4)" : "rgba(220,38,38,.4)";
            el.style.boxShadow = qa.pink ? "0 4px 28px rgba(245,158,11,.08)" : "0 4px 28px rgba(220,38,38,.1)";
            el.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--ink-4)";
            el.style.boxShadow = "none";
            el.style.transform = "none";
          }}
        >
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: qa.pink ? "rgba(245,158,11,.08)" : "rgba(220,38,38,.08)",
              border: `1px solid ${qa.pink ? "rgba(245,158,11,.2)" : "rgba(220,38,38,.2)"}`,
              color: qa.pink ? "var(--amber)" : "var(--blood)",
            }}
          >
            {qa.icon}
          </div>
          <div>
            <div
              className="font-display-ta font-black uppercase"
              style={{ fontSize: "15px", letterSpacing: "0.07em" }}
            >
              {qa.title}
            </div>
            <div
              className="font-mono-ta mt-0.5 text-[9px] uppercase"
              style={{ letterSpacing: "0.15em", color: "var(--fg-4)" }}
            >
              {qa.sub}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Guest Landing Page ────────────────────────────────────────────────────────

function GuestHome() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "calc(100svh - 64px)" }}>
        <Image
          src="/background_pictures/Gemini_Generated_Image_oxsx04oxsx04oxsx.png"
          alt=""
          fill
          className="pointer-events-none object-cover object-center"
          style={{ opacity: 0.72 }}
          priority
        />
        {/* Gradient overlay — deeper and more cinematic */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 400px at 90% -10%, rgba(220,38,38,.13), transparent 55%), radial-gradient(500px 400px at 0% 110%, rgba(245,158,11,.08), transparent 60%), linear-gradient(170deg, rgba(3,4,6,.65) 0%, rgba(3,4,6,.35) 50%, rgba(3,4,6,.80) 100%)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,.035) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 55% at 25% 35%, #000, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 75% 55% at 25% 35%, #000, transparent 75%)",
          }}
        />
        {/* Bottom fade to body */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{ background: "linear-gradient(0deg, var(--ink-0), transparent)" }}
        />
        <div className="relative flex min-h-[inherit] flex-col justify-end px-4 pb-16 pt-20 sm:px-6 sm:pb-24 lg:pb-32">
          <div className="mx-auto w-full max-w-7xl">
            <div
              className="font-mono-ta mb-4 inline-flex items-center gap-2 text-[10px] uppercase"
              style={{ letterSpacing: "0.3em", color: "var(--blood)" }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-dot-pulse"
                style={{ background: "var(--blood)" }}
              />
              IronFight MMA — Training Platform
            </div>
            <h1
              className="font-display-ta font-black uppercase leading-none"
              style={{
                fontSize: "clamp(60px, 11vw, 108px)",
                letterSpacing: "0.01em",
                lineHeight: 0.84,
              }}
            >
              Train
              <br />
              <span style={{ color: "var(--blood)", textShadow: "0 0 40px rgba(220,38,38,.4)" }}>Hard.</span>
              <br />
              <span
                style={{
                  WebkitTextStroke: "2px var(--amber)",
                  color: "transparent",
                }}
              >
                Fight Smart.
              </span>
            </h1>
            <p
              className="mt-7 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--fg-2)" }}
            >
              Die Trainings-App für Kampfsportler. Strukturierte Pläne, smarter Timer,
              Technik-Bibliothek und Fortschritts-Tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-8 py-3.5">
                Kostenlos starten
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-3.5">
                Einloggen
              </Link>
            </div>

            {/* Stat strip */}
            <div
              className="mt-12 grid max-w-xs grid-cols-3 overflow-hidden rounded-xl"
              style={{ background: "var(--ink-5)", border: "1px solid var(--ink-5)", gap: "1px" }}
            >
              {[
                { v: "4", l: "Disziplinen" },
                { v: "120+", l: "Workouts" },
                { v: "24/7", l: "Verfügbar" },
              ].map((stat) => (
                <div
                  key={stat.l}
                  className="flex flex-col items-center py-4 text-center"
                  style={{ background: "rgba(7,9,12,.95)" }}
                >
                  <div
                    className="font-display-ta font-black text-3xl leading-none"
                    style={{ color: "var(--blood)", textShadow: "0 0 16px rgba(220,38,38,.55)" }}
                  >
                    {stat.v}
                  </div>
                  <div
                    className="font-mono-ta mt-1.5 text-[9px] uppercase"
                    style={{ letterSpacing: "0.2em", color: "var(--fg-4)" }}
                  >
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-14 sm:py-20" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center sm:text-left">
            <div
              className="font-mono-ta text-[10px] uppercase"
              style={{ letterSpacing: "0.25em", color: "var(--amber)" }}
            >
              Was dich erwartet
            </div>
            <h2
              className="font-display-ta mt-2 font-black uppercase text-3xl sm:text-4xl"
              style={{ letterSpacing: "0.06em" }}
            >
              Alles für dein Training.
              <span style={{ color: "var(--blood)" }}> An einem Ort.</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl p-7 transition-all duration-300"
                style={{
                  background: f.cyan
                    ? "radial-gradient(220px 160px at 95% 0%, rgba(220,38,38,.1), transparent 60%), linear-gradient(180deg, var(--ink-3), var(--ink-2))"
                    : "radial-gradient(220px 160px at 95% 0%, rgba(245,158,11,.07), transparent 60%), linear-gradient(180deg, var(--ink-3), var(--ink-2))",
                  border: "1px solid var(--ink-4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = f.cyan ? "rgba(220,38,38,.3)" : "rgba(245,158,11,.25)";
                  (e.currentTarget as HTMLElement).style.boxShadow = f.cyan ? "0 4px 32px rgba(220,38,38,.08)" : "0 4px 32px rgba(245,158,11,.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--ink-4)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300"
                  style={{
                    background: f.cyan ? "rgba(220,38,38,.1)" : "rgba(245,158,11,.1)",
                    border: `1px solid ${f.cyan ? "rgba(220,38,38,.25)" : "rgba(245,158,11,.25)"}`,
                    color: f.cyan ? "var(--blood)" : "var(--amber)",
                    boxShadow: f.cyan ? "0 0 16px rgba(220,38,38,.15)" : "0 0 16px rgba(245,158,11,.12)",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  className="font-display-ta mt-5 font-black uppercase"
                  style={{ fontSize: "20px", letterSpacing: "0.06em" }}
                >
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--fg-3)", lineHeight: "1.65" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISZIPLINEN ── */}
      <section className="py-14 sm:py-20" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div
                className="font-mono-ta text-[10px] uppercase"
                style={{ letterSpacing: "0.25em", color: "var(--blood)" }}
              >
                Disziplinen
              </div>
              <h2
                className="font-display-ta mt-2 font-black uppercase text-3xl sm:text-4xl"
                style={{ letterSpacing: "0.06em" }}
              >
                Jede Distanz.
                <span style={{ color: "var(--blood)" }}> Jede Position.</span>
              </h2>
            </div>
            <Link
              href="/workout/generator"
              className="hidden font-mono-ta text-[10px] uppercase transition-colors md:block"
              style={{ letterSpacing: "0.2em", color: "var(--blood)" }}
            >
              Alle Workouts →
            </Link>
          </div>
          <DisciplineGrid />
        </div>
      </section>

      {/* ── QUICK ACCESS ── */}
      <section className="py-10 sm:py-16" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className="font-mono-ta mb-6 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--fg-3)" }}
          >
            Schnellzugriff
          </div>
          <QuickActionCards actions={guestQuickActions} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative overflow-hidden py-20 sm:py-32"
        style={{ borderTop: "1px solid var(--ink-4)" }}
      >
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "700px", height: "350px",
              background: "radial-gradient(ellipse, rgba(220,38,38,.07) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
        </div>
        {/* Ring decoration */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%)",
            width: "600px", height: "600px",
            border: "1px solid rgba(220,38,38,.06)",
            borderRadius: "50%",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%)",
            width: "400px", height: "400px",
            border: "1px solid rgba(220,38,38,.09)",
            borderRadius: "50%",
          }}
        />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div
            className="font-mono-ta inline-flex items-center gap-2 text-[10px] uppercase"
            style={{ letterSpacing: "0.3em", color: "var(--blood)" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full animate-dot-pulse" style={{ background: "var(--blood)" }} />
            Kostenlos · Kein Abo
          </div>
          <h2
            className="font-display-ta mt-4 font-black uppercase"
            style={{
              fontSize: "clamp(36px, 6.5vw, 60px)",
              letterSpacing: "0.04em",
              lineHeight: 0.88,
            }}
          >
            Bereit für die
            <br />
            <span style={{ color: "var(--blood)", textShadow: "0 0 40px rgba(220,38,38,.35)" }}>erste Runde?</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed" style={{ color: "var(--fg-3)" }}>
            Erstelle deinen kostenlosen Account und starte heute mit dem Training.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-8 py-4 text-base">
              Jetzt registrieren
            </Link>
            <Link href="/timer" className="btn-secondary px-8 py-4 text-base">
              Timer ausprobieren
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Personalized Home (eingeloggt) ───────────────────────────────────────────

function UserHome() {
  const { profile, profileLoading } = useAuth();
  const greeting = greetingFor(profile?.displayName);

  return (
    <>
      {/* ── GREETING HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "340px" }}>
        <Image
          src="/background_pictures/Gemini_Generated_Image_oxsx04oxsx04oxsx.png"
          alt=""
          fill
          className="pointer-events-none object-cover object-center"
          style={{ opacity: 0.65 }}
          priority
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 300px at 90% -10%, rgba(220,38,38,.12), transparent 55%), linear-gradient(170deg, rgba(3,4,6,.7) 0%, rgba(3,4,6,.4) 50%, rgba(3,4,6,.85) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,.03) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 45% at 15% 50%, #000, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 65% 45% at 15% 50%, #000, transparent 75%)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(0deg, var(--ink-0), transparent)" }}
        />
        <div className="relative flex min-h-[340px] flex-col justify-end px-4 pb-10 pt-20 sm:px-6 sm:pb-14">
          <div className="mx-auto w-full max-w-7xl">
            {profileLoading ? (
              <div>
                <div className="h-3 w-32 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
                <div className="mt-3 h-14 w-72 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
                <div className="mt-3 h-3 w-48 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
              </div>
            ) : (
              <>
                <div
                  className="font-mono-ta inline-flex items-center gap-2 text-[10px] uppercase"
                  style={{ letterSpacing: "0.28em", color: "var(--blood)" }}
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full animate-dot-pulse" style={{ background: "var(--blood)" }} />
                  Willkommen zurück
                </div>
                <h1
                  className="font-display-ta mt-2 font-black uppercase leading-none"
                  style={{
                    fontSize: "clamp(40px, 8vw, 80px)",
                    letterSpacing: "0.02em",
                    lineHeight: 0.86,
                  }}
                >
                  {greeting}
                </h1>
                <p className="mt-4 text-sm" style={{ color: "var(--fg-3)", letterSpacing: "0.02em" }}>
                  Was trainierst du heute?
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="py-10 sm:py-14" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className="font-mono-ta mb-6 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--fg-3)" }}
          >
            Schnellzugriff
          </div>
          <QuickActionCards actions={userQuickActions} />
        </div>
      </section>

      {/* ── TRAININGSPLÄNE ── */}
      <section className="py-14 sm:py-20" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div
                className="font-mono-ta text-[10px] uppercase"
                style={{ letterSpacing: "0.25em", color: "var(--blood)" }}
              >
                Trainingspläne
              </div>
              <h2
                className="font-display-ta mt-2 font-black uppercase text-3xl sm:text-4xl"
                style={{ letterSpacing: "0.06em" }}
              >
                Jede Distanz.
                <span style={{ color: "var(--blood)" }}> Jede Position.</span>
              </h2>
            </div>
            <Link
              href="/workout/generator"
              className="hidden font-mono-ta text-[10px] uppercase transition-colors md:block"
              style={{ letterSpacing: "0.2em", color: "var(--blood)" }}
            >
              Alle Workouts →
            </Link>
          </div>
          <DisciplineGrid />
        </div>
      </section>

      {/* ── DASHBOARD TEASER ── */}
      <section className="py-8 sm:py-12" style={{ borderTop: "1px solid var(--ink-4)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className="flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background:
                "radial-gradient(300px 200px at 90% -20%, rgba(220,38,38,.1), transparent 60%), linear-gradient(180deg, var(--ink-3), var(--ink-2))",
              border: "1px solid var(--ink-4)",
            }}
          >
            <div>
              <div
                className="font-mono-ta text-[9px] uppercase"
                style={{ letterSpacing: "0.2em", color: "var(--fg-3)" }}
              >
                Mein Training
              </div>
              <div
                className="font-display-ta mt-1 font-black uppercase"
                style={{ fontSize: "20px", letterSpacing: "0.04em" }}
              >
                Statistiken & Verlauf
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--fg-4)" }}>
                Streak, Workouts, Lieblings-Disziplin und alle Sessions auf einen Blick.
              </p>
            </div>
            <Link href="/dashboard" className="btn-secondary whitespace-nowrap text-sm">
              Zum Dashboard →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function HomeLoading() {
  return (
    <div style={{ minHeight: "70vh" }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="h-3 w-24 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
        <div className="mt-4 h-16 w-80 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
        <div className="mt-3 h-5 w-96 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
        <div className="mt-6 flex gap-3">
          <div className="h-10 w-36 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
          <div className="h-10 w-28 animate-pulse rounded" style={{ background: "var(--ink-4)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <HomeLoading />;
  return user ? <UserHome /> : <GuestHome />;
}
