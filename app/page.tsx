import Hero3D from "@/components/Hero3D";
import Link from "next/link";

const disciplines = [
  {
    name: "Boxing",
    tag: "Stand-Up",
    desc: "Footwork, Combinations, Defense. Lerne die süße Wissenschaft.",
    accent: "from-red-700/40",
  },
  {
    name: "Wrestling",
    tag: "Grappling",
    desc: "Takedowns, Sprawls, Kontrolle. Diktiere wo der Kampf stattfindet.",
    accent: "from-orange-700/40",
  },
  {
    name: "BJJ",
    tag: "Ground",
    desc: "Submissions, Sweeps, Guards. Schach mit Knochen und Sehnen.",
    accent: "from-blue-700/40",
  },
  {
    name: "Muay Thai",
    tag: "Stand-Up",
    desc: "Knie, Ellbogen, Clinch. Die Kunst der acht Gliedmaßen.",
    accent: "from-yellow-700/40",
  },
];

const features = [
  {
    title: "Strukturierte Pläne",
    desc: "Wochenpläne pro Disziplin — vom Anfänger bis zum Profikämpfer.",
  },
  {
    title: "Runden-Timer",
    desc: "Konfigurierbare Runden, Pausen, Rest-Intervalle. Wie im Cage.",
  },
  {
    title: "Fortschritts-Tracking",
    desc: "Trainings-Logs, Streaks und Statistiken. Sieh deinen Progress.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-grid-pattern opacity-40"
          style={{ backgroundSize: "50px 50px" }}
        />
        <div className="absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[1.1fr_1fr] lg:py-40">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-blood/40 bg-blood/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blood">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" />
              Neue Saison gestartet
            </div>
            <h1 className="heading-display text-5xl font-black leading-none sm:text-7xl lg:text-8xl">
              Train Hard.
              <br />
              <span className="text-blood">Fight Smart.</span>
              <br />
              Become Unbreakable.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/70">
              IronFight ist deine komplette MMA Trainings-App.
              Strukturierte Pläne, smarter Timer und Fortschritts-Tracking
              — alles was du brauchst, um im Cage zu dominieren.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary">
                Jetzt starten
              </Link>
              <Link href="/training" className="btn-secondary">
                Trainingspläne ansehen
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-carbon-500/60 pt-8">
              {[
                { v: "4", l: "Disziplinen" },
                { v: "120+", l: "Workouts" },
                { v: "24/7", l: "Verfügbar" },
              ].map((stat) => (
                <div key={stat.l}>
                  <div className="font-display text-3xl font-black text-blood sm:text-4xl">
                    {stat.v}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-foreground/60">
                    {stat.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
            <Hero3D />
          </div>
        </div>
      </section>

      <section className="border-t border-carbon-500/60 bg-carbon-800/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blood">
                Disziplinen
              </div>
              <h2 className="heading-display mt-2 text-4xl font-black sm:text-5xl">
                Jede Distanz. Jede Position.
              </h2>
            </div>
            <Link
              href="/training"
              className="hidden text-sm font-bold uppercase tracking-wider text-foreground/70 hover:text-blood md:block"
            >
              Alle ansehen →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {disciplines.map((d) => (
              <Link
                key={d.name}
                href="/training"
                className="group relative overflow-hidden rounded-sm border border-carbon-500 bg-carbon-700/60 p-6 transition-all hover:border-blood/60"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${d.accent} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative">
                  <div className="text-xs font-bold uppercase tracking-widest text-blood">
                    {d.tag}
                  </div>
                  <h3 className="heading-display mt-2 text-2xl font-black">
                    {d.name}
                  </h3>
                  <p className="mt-3 text-sm text-foreground/60">{d.desc}</p>
                  <div className="mt-6 inline-flex items-center text-sm font-bold uppercase tracking-wider text-foreground/70 group-hover:text-blood">
                    Plan ansehen →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-carbon-500/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-blood/15 text-blood">
                  ●
                </div>
                <h3 className="heading-display text-xl font-black">{f.title}</h3>
                <p className="mt-2 text-sm text-foreground/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-carbon-500/60 bg-carbon-800/30">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
          <h2 className="heading-display text-4xl font-black sm:text-5xl">
            Bereit für die <span className="text-blood">erste Runde?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground/70">
            Erstelle deinen kostenlosen Account, wähle deine Disziplin und
            starte heute deinen Trainingsplan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-primary">
              Account erstellen
            </Link>
            <Link href="/timer" className="btn-secondary">
              Timer testen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
