# IronFight — Cowork Setup

## Dateien

| Datei | Verwendung |
|---|---|
| `../CLAUDE.md` | Root-Context — in Cowork als Projektbeschreibung einfügen |
| `agent-feature-dev.md` | Agent "Feature Development" — neue Seiten, Hooks, Features |
| `agent-firebase.md` | Agent "Firebase & Backend" — Auth, Firestore, Rules |
| `agent-ui-design.md` | Agent "UI, Design & 3D" — Komponenten, Tailwind, Three.js |
| `agent-payments.md` | Agent "Stripe & Payments" — Checkout, Webhook, Premium |

## Cowork Setup (einmalig)

1. Neues Projekt anlegen → `CLAUDE.md` Inhalt als Projektbeschreibung einfügen
2. 4 Agenten anlegen → jeweilige `.md` Datei als System-Prompt einfügen
3. Fertig — jeder neue Chat wählt den passenden Agenten

## Token-Effizienz

- **Einen Chat pro Feature** — nicht alles in einen langen Chat
- **Richtigen Agenten wählen** — nicht den General-Agent
- **Zwei-Schritt bei neuen Features die DB berühren:**
  1. `@firebase`: Datenmodell + Rules klären
  2. `@feature-dev`: Seite/Komponente bauen

## Aktueller Stand

Zuletzt gebaut: Workout-Logging + Dashboard + Three.js Hero
Nächste Priorität: Stripe Pro-Membership → Agent @payments starten
