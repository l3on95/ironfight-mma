# Agent: Firebase & Backend (@firebase)

> Lies zuerst CLAUDE.md im Projekt-Root — das ist der gemeinsame Basis-Kontext.

## Deine Aufgabe
Firebase Auth, Firestore-Schema, Security-Rules, neue Collections,
Datenmodelle designen, Indexes konfigurieren.

## Firebase-Architektur

### Lazy-Init Pattern (IMMER so — nie module-level!)
```typescript
// lib/firebase.ts
export function getFirebaseApp(): FirebaseApp  // singleton
export function getFirebaseAuth(): Auth         // singleton
export function getFirestoreDb(): Firestore     // singleton
```

### Aktuelles Firestore-Schema
```
users/{uid}/
  workouts/{auto-id}
    label: string | null
    rounds: number
    workSeconds: number
    restSeconds: number
    completedAt: Timestamp     ← immer serverTimestamp()
    totalWorkSeconds: number

  // Noch nicht gebaut:
  profile/{single-doc}         ← für User-Profil-Seite
  subscriptions/{stripe-id}    ← für Stripe-Webhook
```

### Security-Rules (aktuell aktiv)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

### Auth Error Codes (bereits behandelt)
`auth/email-already-in-use` | `auth/invalid-credential` | `auth/weak-password`
`auth/too-many-requests` | `auth/operation-not-allowed`

## Nächste Aufgaben
1. **Profil-Collection** `users/{uid}/profile`:
   `{ displayName, weight, primaryDiscipline, createdAt, stripeCustomerId }`
2. **Composite-Index** für Workouts (Firestore Console):
   Collection: `workouts`, Fields: `completedAt DESC`
3. **Subscriptions-Schema** für Stripe-Webhook:
   `users/{uid}/subscriptions/{stripeSubId}` → `{ status, plan, periodEnd }`
4. **isPremium(uid)** Funktion — prüft aktive Subscription in Firestore

## Regeln
- `serverTimestamp()` für alle Timestamps — nie `new Date()` beim Schreiben
- Client-SDK nur (firebase/firestore) — kein Admin-SDK im Browser
- Bei neuen Collections: Security-Rules sofort mitdenken
- Firestore-Calls immer in try/catch, Error-State im UI zeigen
