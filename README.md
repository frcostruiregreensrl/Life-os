# Life OS

Life OS è una web app personale (PWA) per gestire la vita quotidiana a 360 gradi: attività, abitudini, dieta, salute, agenda intelligente, spese e riepiloghi periodici — pensata per un piccolo gruppo di amici in beta test, con l'obiettivo futuro di diventare un'app nativa su App Store / Play Store.

## Stack tecnico

- **Frontend**: React + Vite + TypeScript + Tailwind CSS, componenti shadcn/ui su Radix UI
- **Backend**: Express + TypeScript
- **Database**: Drizzle ORM su SQLite (better-sqlite3)
- **PWA**: manifest + service worker via `vite-plugin-pwa`, installabile su smartphone
- **Deploy**: Railway (`railway.json` / `nixpacks.toml`)

## Setup locale

Requisiti: Node.js 22+.

```bash
npm install
npm run db:push   # crea/aggiorna lo schema del database SQLite locale (data.db)
npm run dev        # avvia backend Express + frontend Vite su http://localhost:5000
```

`npm run dev` avvia un unico processo Express (porta `5000` di default, configurabile con `PORT`) che serve sia le API sotto `/api` sia il frontend React in modalità Vite dev (con HMR).

Altri script utili:

```bash
npm run check   # type-check con tsc
npm run build   # build di produzione (client + server) in dist/
npm run start   # avvia la build di produzione
```

### Variabili d'ambiente

| Variabile        | Obbligatoria         | Descrizione                                             |
| ----------------- | --------------------- | -------------------------------------------------------- |
| `PORT`            | No (default `5000`)   | Porta su cui il server ascolta                           |
| `DATABASE_URL`    | No (default `./data.db`) | Percorso del file SQLite                               |
| `SESSION_SECRET`  | Sì in produzione       | Segreto per firmare i cookie di sessione                 |
| `NODE_ENV`        | No                     | `development` / `production`                             |

## Autenticazione

Autenticazione multi-utente con email + password, hashing con `scrypt` (nativo Node, salted) e sessioni server-side (`express-session`, cookie httpOnly). Ogni riga di dati nel database è collegata a `userId`: ogni utente vede e modifica solo i propri dati.

## Stato di avanzamento moduli

| Modulo                     | Stato                                     |
| --------------------------- | ------------------------------------------ |
| Autenticazione multi-utente | ✅ Completo                                |
| Dashboard / shell           | ✅ Completo                                |
| To-do list                  | ✅ Completo (CRUD, priorità, scadenza)     |
| Routine / abitudini         | ✅ MVP (tracking giornaliero + streak semplice) |
| Dieta                       | 🕓 Schema dati pronto, UI non ancora implementata |
| Salute (sonno, ciclo)       | 🕓 Schema dati pronto, UI non ancora implementata |
| Agenda intelligente         | 🕓 Schema dati pronto, UI non ancora implementata |
| Spese e risparmi            | 🕓 Schema dati pronto, UI non ancora implementata |
| Gamification avanzata       | 🕓 Schema dati pronto (streak con salvagenti, sfide) |
| Riepiloghi settimanali/mensili | 🕓 Schema dati pronto, UI non ancora implementata |

I moduli non ancora implementati sono visibili nella sidebar come "in arrivo".

## Schema dati

Lo schema Drizzle (`shared/schema.ts`) copre già tutte le tabelle previste dalla Fase 2 della roadmap (dieta, dispensa, lista spesa, sonno, ciclo mestruale, luoghi, eventi/agenda, obiettivi, reminder, spese, risparmi, streak con salvagenti, sfide, riepiloghi settimanali/mensili), tutte collegate a `userId` per l'isolamento multi-utente. Questo evita migrazioni dolorose quando questi moduli verranno implementati lato UI.

## Struttura del progetto

```
client/       Frontend React (Vite)
  src/
    components/   Componenti condivisi (shell, ui/ in stile shadcn)
    pages/        Pagine dell'app
    lib/          Query client, contesto auth, utility
server/       Backend Express
  routes/        Router per singolo modulo (todos, habits)
  auth.ts        Router di autenticazione + middleware requireAuth
  db.ts          Connessione Drizzle/SQLite
  storage.ts      Data access layer
shared/       Codice condiviso tra client e server
  schema.ts       Schema Drizzle + validazione Zod
```

## Roadmap

Vedi la board del progetto per il dettaglio delle fasi successive (Fase 2: dieta, salute, agenda intelligente, spese, gamification, riepiloghi, comandi vocali, export dati; Fase 3: integrazione HealthKit e assistente vocale always-on, che richiedono la migrazione ad app nativa).
