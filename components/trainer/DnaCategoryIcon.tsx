"use client";

/**
 * Custom Line-Icons für die Gegner-DNA-Kategorien.
 *
 * Bewusst im Stil der Navbar-Icons gehalten (stroke, currentColor, 24er
 * viewBox) — keine Emoji/„Chat-Smileys". Die Farbe kommt über `color` des
 * Eltern-Elements (Kategorie-Akzent).
 */
export default function DnaCategoryIcon({
  id,
  size = 18,
}: {
  id: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (id) {
    // Real Habits — wiederkehrender Kreislauf
    case "real-habits":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      );

    // Entry Patterns — Zielvisier / Einstieg
    case "entry-patterns":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    // Preferred Weapons — gekreuzte Klingen
    case "preferred-weapons":
      return (
        <svg {...common}>
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" y1="19" x2="19" y2="13" />
          <line x1="16" y1="16" x2="20" y2="20" />
          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
          <line x1="5" y1="14" x2="9" y2="18" />
          <line x1="7" y1="17" x2="4" y2="20" />
        </svg>
      );

    // Defensive Reactions — Schild
    case "defensive-reactions":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );

    // Cage- und Raumverhalten — Octagon mit Zentrum
    case "cage-space":
      return (
        <svg {...common}>
          <polygon points="8 2.5 16 2.5 21.5 8 21.5 16 16 21.5 8 21.5 2.5 16 2.5 8" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );

    // Schwächen — Lupe / Analyse
    case "weaknesses":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );

    // Exploit-Möglichkeiten — Blitz / gezielter Treffer
    case "exploits":
      return (
        <svg {...common}>
          <polygon points="13 2 4 14 11 14 10 22 19 10 12 10 13 2" />
        </svg>
      );

    // Gameplan — Flagge / Ziel
    case "gameplan":
      return (
        <svg {...common}>
          <path d="M4 22V3" />
          <path d="M4 4h13l-2.2 4L17 12H4" />
        </svg>
      );

    // Drills — Hantel / Training
    case "drills":
      return (
        <svg {...common}>
          <path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M3.5 9v6M20.5 9v6" />
        </svg>
      );

    default:
      // Fallback — schlichter Kreis (sollte nie greifen)
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
