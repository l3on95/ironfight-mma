import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(220,38,38,.1)",
        background: "linear-gradient(180deg, var(--ink-1), var(--ink-0))",
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg font-display-ta text-xs font-black"
              style={{
                background: "linear-gradient(135deg, var(--blood), var(--blood-deep))",
                color: "#fff",
                boxShadow: "0 0 12px rgba(220,38,38,.3)",
                letterSpacing: "0.06em",
              }}
            >
              IF
            </div>
            <div
              className="font-display-ta text-lg font-black uppercase leading-none"
              style={{ letterSpacing: "0.1em" }}
            >
              <span style={{ color: "#fff" }}>Iron</span>
              <span style={{ color: "var(--blood)" }}>Fight</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--fg-4)" }}>
            Train hard. Fight smart.<br />Become unbreakable.
          </p>
        </div>

        {/* Training */}
        <div>
          <h4
            className="font-mono-ta mb-3 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--blood)" }}
          >
            Training
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: "var(--fg-3)" }}>
            {[
              { href: "/workout/generator", label: "Workouts" },
              { href: "/schedule",          label: "Kursplan" },
              { href: "/workout/plans/boxing",    label: "Boxing Plan" },
              { href: "/workout/plans/wrestling", label: "Wrestling Plan" },
              { href: "/workout/plans/bjj",       label: "BJJ Plan" },
              { href: "/workout/plans/muay-thai", label: "Muay Thai Plan" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-colors duration-150 hover:text-blood"
                  style={{ color: "var(--fg-3)" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Lernen */}
        <div>
          <h4
            className="font-mono-ta mb-3 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--blood)" }}
          >
            Lernen
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/techniques", label: "Techniken" },
              { href: "/regeln",     label: "Regeln" },
              { href: "/quiz",       label: "Quiz" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-colors duration-150 hover:text-blood"
                  style={{ color: "var(--fg-3)" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <h4
            className="font-mono-ta mb-2 mt-5 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--fg-4)" }}
          >
            Timer
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/timer"
                className="transition-colors duration-150 hover:text-blood"
                style={{ color: "var(--fg-3)" }}
              >
                Workout-Timer
              </Link>
            </li>
          </ul>
        </div>

        {/* Profil */}
        <div>
          <h4
            className="font-mono-ta mb-3 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--blood)" }}
          >
            Profil
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/library",   label: "Sammlung" },
              { href: "/dashboard", label: "Verlauf" },
              { href: "/profile",   label: "Account" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-colors duration-150 hover:text-blood"
                  style={{ color: "var(--fg-3)" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h4
            className="font-mono-ta mb-2 mt-5 text-[10px] uppercase"
            style={{ letterSpacing: "0.25em", color: "var(--fg-4)" }}
          >
            Account
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/login",    label: "Login" },
              { href: "/register", label: "Registrieren" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="transition-colors duration-150 hover:text-blood"
                  style={{ color: "var(--fg-3)" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="px-4 py-4 text-center font-mono-ta text-[10px] uppercase sm:px-6"
        style={{
          borderTop: "1px solid var(--ink-4)",
          letterSpacing: "0.2em",
          color: "var(--fg-4)",
        }}
      >
        © {new Date().getFullYear()} IronFight MMA. All rights reserved.
      </div>
    </footer>
  );
}
