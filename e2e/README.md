# End-to-End-Tests (Playwright + Firebase-Emulatoren)

Zwei Laufmodi — der erste braucht **kein Java**, der zweite einen **JDK**.

## 1. Nur Routen-Schutz (kein Java, kein Emulator)

Prüft das Middleware-Gate (`middleware.ts`) für nicht eingeloggte Nutzer:
`/admin/*` → 404, geschützte Bereiche → Redirect auf `/login`.

```bash
npm run test:e2e:routes
```

Startet nur den Next-Dev-Server und fährt `e2e/route-protection.spec.ts`.
Das Seeding wird über `E2E_SKIP_SEED=1` übersprungen.

## 2. Voll: Auth + Daten (braucht ein JDK)

Fährt **alle** Specs gegen die Firebase-Emulatoren (Auth + Firestore). Die
Emulatoren sind eine Java-Anwendung — ohne JDK startet `firebase emulators:exec`
nicht.

```bash
npm run test:e2e
```

Das wrappt `playwright test` in `firebase emulators:exec` (Projekt
`demo-ironfight` → vollständig offline, keine echten Credentials). `globalSetup`
seedet die Testnutzer via Admin SDK in den Auth-Emulator und legt die
gespiegelten `users/{uid}`-Dokumente an.

### JDK ohne root installieren (portabel)

Falls kein `java` vorhanden ist, reicht ein portables Temurin-JRE im Home-Verzeichnis:

```bash
mkdir -p ~/.jdks
curl -fL -o /tmp/jre.tar.gz \
  "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse"
tar -xzf /tmp/jre.tar.gz -C ~/.jdks
export JAVA_HOME="$HOME/.jdks/$(ls ~/.jdks | grep jdk-21 | head -1)"
export PATH="$JAVA_HOME/bin:$PATH"
java -version   # erwartet: openjdk version "21..."
```

`JAVA_HOME`/`PATH` müssen in der Shell gesetzt sein, in der `npm run test:e2e`
läuft (z. B. in `~/.bashrc` aufnehmen). Für andere Plattformen den passenden
Adoptium-Build wählen (`.../linux/aarch64/...`, `.../mac/x64/...`, …).

## Testnutzer (vom Seeding angelegt)

| E-Mail            | Passwort   | Rolle (Custom Claim) |
|-------------------|------------|----------------------|
| `athlete@test.dev`| `test1234` | `user`               |
| `coach@test.dev`  | `test1234` | `trainer`            |

Rollen werden — wie in Produktion — **ausschließlich serverseitig** über das
Admin SDK als Custom Claim gesetzt (`e2e/global-setup.ts`). Kein Client-Pfad
schreibt `role`.

## Wie der Browser-Client die Emulatoren findet

`playwright.config.ts` injiziert dem Dev-Server `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`
plus eine Demo-Firebase-Config. `lib/firebase.ts` verbindet sich dann lazy gegen
`127.0.0.1:9099` (Auth) bzw. `127.0.0.1:8080` (Firestore). In Produktion ist das
Flag nie gesetzt — die Emulator-Pfade sind dann toter Code.

## Ports

| Dienst    | Port |
|-----------|------|
| Auth      | 9099 |
| Firestore | 8080 |
| Next-Dev  | 3000 |
