# Agent: UI, Design & 3D (@ui-design)

> Lies zuerst CLAUDE.md im Projekt-Root — das ist der gemeinsame Basis-Kontext.

## Deine Aufgabe
Tailwind-Komponenten, Design-System-Erweiterungen, Three.js-Szenen,
Animationen, responsive Layouts, Dark-Theme konsistent halten.

## Design-System Details

### Tailwind Custom Tokens
```typescript
// tailwind.config.ts
colors: {
  blood: { DEFAULT:"#dc2626", dark:"#991b1b", light:"#ef4444" },
  carbon: { 900:"#050505", 800:"#0a0a0a", 700:"#111111",
            600:"#1a1a1a", 500:"#262626", 400:"#404040" }
}
backgroundImage: {
  "grid-pattern": "linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), ...",
  "radial-fade":  "radial-gradient(ellipse at top, rgba(220,38,38,0.15), transparent 60%)"
}
```

### Component-Klassen (globals.css @layer components)
```
.btn-primary     → bg-blood hover:bg-blood-dark hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]
.btn-secondary   → border border-carbon-400 hover:border-blood hover:text-blood
.card            → border border-carbon-500 bg-carbon-700/60 rounded-sm backdrop-blur
.heading-display → font-display uppercase tracking-tight
```

### Bestehende Komponenten
- `PageHeader`      → `{ eyebrow?, title, description? }` — konsistent auf allen Seiten
- `Navbar`          → sticky, responsive, auth-aware, mobile-burger
- `ProtectedRoute`  → loading/redirect wrapper
- `HeroScene`       → R3F: Octagon-Cage + Glove + Sparkles
- `Hero3D`          → next/dynamic ssr:false Wrapper

## Three.js — KRITISCHE Versions-Info
**`@react-three/fiber@8` + `@react-three/drei@9`** — React 18 kompatibel.
**NIEMALS auf v9/v10 upgraden** ohne gleichzeitiges React-19-Upgrade!
(Fehler: `Cannot read properties of undefined (reading 'S')`)

### Aktuelle Szene (HeroScene.tsx)
```
Canvas (alpha:true, dpr:[1,1.5], fov:45)
├── Fog (#050505, near:6, far:14)
├── ambientLight(0.25) + directionalLight + 2× pointLight(blood-rot)
├── <Float> → Glove (sphere + cylinder + emissive torus)
├── OctagonCage (cylinderGeometry radialSegments=8 wireframe + 2 torus rings)
└── <Sparkles count=60 color="#dc2626" scale=6 />
```

### R3F Patterns
```typescript
// Dynamic Import (immer ssr:false für Canvas)
const Scene = dynamic(() => import("./MyScene"), { ssr: false })

// Aspect-Ratio Container
<div className="relative aspect-square w-full"> <Scene /> </div>

// Rotation via useFrame
const ref = useRef<THREE.Group>(null)
useFrame((_, delta) => { ref.current!.rotation.y += delta * 0.3 })
```

## Nächste UI-Aufgaben
1. **Kalender-Heatmap** für `/history` — GitHub-style Grid, blood-Farbskala nach Intensity
2. **Exercise-Tracker** auf Training-Detail — Checkbox-Liste, Progress-Bar, "Nächste Übung"
3. **Toast-Notifications** — eigene Komponente mit Framer Motion (kein externes Package)
   ```typescript
   // Pattern: Context + useToast()
   useToast().success("Session gespeichert ✓")
   useToast().error("Fehler beim Laden")
   ```
4. **Loading-Skeleton** Pattern statt "Lade…" Text

## Konventionen
- Keine Icon-Libraries — Unicode oder inline SVG
- Framer Motion installiert — für Micro-Animations (fadeUp, scale on mount)
- Mobile-first: `sm:` → `md:` → `lg:`
- Kein light mode, immer dark
