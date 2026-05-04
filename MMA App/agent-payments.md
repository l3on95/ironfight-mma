# Agent: Stripe & Payments (@payments)

> Lies zuerst CLAUDE.md im Projekt-Root — das ist der gemeinsame Basis-Kontext.

## Deine Aufgabe
Stripe-Integration: Checkout Session, Webhook-Handler, Premium-Gate,
Abo-Verwaltung im Dashboard.

## Installierte Packages
```json
"@stripe/stripe-js": "^9.4.0"   // Client-Side (loadStripe)
"stripe": "^22.1.0"              // Server-Side (API Routes)
```

## .env.local — muss noch ergänzt werden
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

## Geplante Feature-Trennung
```
Gratis:  Timer, 4 Basis-Pläne, letzte 5 Sessions im Dashboard
Pro:     Unbegrenzte History, Kalender-Heatmap, Profil-Export, erweiterte Pläne
```

## Zu bauende Datei-Struktur
```
app/api/stripe/
  checkout/route.ts    — POST: erstellt Checkout Session → gibt URL zurück
  webhook/route.ts     — POST: verarbeitet Stripe-Events (subscription.*)

app/pricing/page.tsx   — Free vs. Pro Vergleich + Checkout-Button

lib/
  stripe.ts            — Server: lazy Stripe-Client init
  stripe-client.ts     — Client: loadStripe() lazy
  subscription.ts      — isPremium(uid), getSubscription(uid) aus Firestore
```

## Checkout Route (Muster)
```typescript
// app/api/stripe/checkout/route.ts
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { uid, email } = await req.json()
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?upgraded=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    metadata: { uid },
  })
  return Response.json({ url: session.url })
}
```

## Webhook Route (Muster)
```typescript
// app/api/stripe/webhook/route.ts
// WICHTIG: raw body — kein req.json()!
export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")!
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created") {
    const sub = event.data.object as Stripe.Subscription
    const uid = sub.metadata.uid
    // → schreibe users/{uid}/subscriptions/{sub.id} in Firestore
  }
  return Response.json({ received: true })
}
```

## Premium-Gate Component (Muster)
```typescript
// components/PremiumGate.tsx
// Wraps content, zeigt Upgrade-CTA wenn kein Premium
// <PremiumGate feature="Unbegrenzte History">
//   <WorkoutHistoryFull />
// </PremiumGate>
```

## Schritte in dieser Reihenfolge
1. Stripe Dashboard: Produkt „IronFight Pro" + Preis (~9,99€/Monat) anlegen
2. `.env.local` mit Stripe-Keys + `NEXT_PUBLIC_BASE_URL=http://localhost:3003` ergänzen
3. `lib/stripe.ts` + `lib/subscription.ts` bauen
4. `/pricing` Seite
5. Checkout-Route + Client-Button
6. Webhook-Route + Firestore-Schreiblogik
7. `PremiumGate` Komponente
8. History-Seite hinter Gate stellen

## Wichtige Regeln
- Webhook-Signatur IMMER verifizieren: `stripe.webhooks.constructEvent()`
- raw body für Webhook: `req.text()` — NICHT `req.json()`
- `sk_test_` für Dev, Live-Keys erst für Production-Deploy
- Lokale Webhook-Tests via Stripe CLI: `stripe listen --forward-to localhost:3003/api/stripe/webhook`
