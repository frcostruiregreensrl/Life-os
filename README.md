# Life OS

Life OS è una web app personale (PWA) per gestire la vita quotidiana a 360 gradi: attività, abitudini, dieta, salute, agenda intelligente, spese e riepiloghi periodici — pensata per un piccolo gruppo di amici in beta test, con l'obiettivo futuro di diventare un'app nativa su App Store / Play Store.

## Stack tecnico

- **Frontend**: React + Vite + TypeScript + Tailwind CSS, componenti shadcn/ui su Radix UI
- **Backend**: Express + TypeScript
- **Database**: Drizzle ORM su SQLite (better-sqlite3)
- **PWA**: manifest + service worker via `vite-plugin-pwa`, installabile su smartphone
- **Deploy**: Railway (`railway.json` / `nixpacks.toml`)

## Identità visiva

Layout mobile-first stile app nativa (tab bar in basso, niente sidebar da dashboard web), tema
"centro di controllo": ciano come colore d'azione primario, ambra per gli stati di media
priorità/attenzione. Tipografia a tre ruoli: **Tektur** per titoli e numeri grandi,
**Instrument Sans** per l'interfaccia, **Red Hat Mono** per dati tabulari (streak, date, orari).
I font sono self-hosted in `client/public/fonts` (licenza OFL, vedi i rispettivi `*-OFL.txt`) per
funzionare offline da PWA installata.

Il tema passa automaticamente da scuro (sera/notte) a chiaro (giorno, 7:00–20:00 ora locale del
dispositivo) senza bisogno di ricaricare la pagina (`client/src/lib/useAutoTheme.ts`, ricontrollato
ogni 5 minuti). L'utente può forzare uno dei due tramite `userSettings.theme`
(`system` | `light` | `dark` — di default `system`, cioè automatico); al momento non c'è ancora un
selettore in UI per cambiarlo, va impostato via API.

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

Copia `.env.example` in `.env` (viene caricato in automatico da `npm run dev`/`npm run start`,
e non va mai committato):

```bash
cp .env.example .env
```

| Variabile        | Obbligatoria         | Descrizione                                             |
| ----------------- | --------------------- | -------------------------------------------------------- |
| `PORT`            | No (default `5000`)   | Porta su cui il server ascolta                           |
| `DATABASE_URL`    | No (default `./data.db`) | Percorso del file SQLite                               |
| `SESSION_SECRET`  | Sì in produzione       | Segreto per firmare i cookie di sessione                 |
| `NODE_ENV`        | No                     | `development` / `production`                             |
| `ANTHROPIC_API_KEY` | Sì, per l'onboarding vocale | Chiave API Claude usata dall'assistente di configurazione al primo avvio. Senza questa variabile l'onboarding mostra un errore e l'utente può comunque saltarlo. |
| `ANTHROPIC_ONBOARDING_MODEL` | No (default `claude-sonnet-5`) | Modello Claude usato per la conversazione di onboarding |

**Come ottenere `ANTHROPIC_API_KEY`** (è una chiave API a consumo, diversa dall'abbonamento a
Claude.ai — se non l'hai mai usata dovrai registrare una carta, l'onboarding costa pochi centesimi
a conversazione):

1. Vai su [console.anthropic.com](https://console.anthropic.com) e crea un account (o accedi).
2. Nel menu a sinistra apri **Settings → Billing** e aggiungi un metodo di pagamento — l'API è a
   consumo, senza billing attivo le richieste falliscono.
3. Vai su **API Keys → Create Key**, dalle un nome (es. "Life OS locale") e copiala: viene
   mostrata **una sola volta**.
4. Incollala in `.env` come `ANTHROPIC_API_KEY=sk-ant-...`.
5. In produzione (Railway) imposta la stessa variabile nelle **Variables** del servizio, non nel
   file `.env` (che resta solo per lo sviluppo locale).

## Autenticazione

Autenticazione multi-utente con email + password, hashing con `scrypt` (nativo Node, salted) e sessioni server-side (`express-session`, cookie httpOnly). Ogni riga di dati nel database è collegata a `userId`: ogni utente vede e modifica solo i propri dati.

## Onboarding con assistente vocale

Al primo accesso (subito dopo la registrazione, prima di vedere la dashboard) l'utente viene guidato in `/onboarding`: un assistente conversazionale basato su Claude (Anthropic, con tool use) fa qualche domanda a voce — orario di fine lavoro, obiettivi, quali moduli attivare tra dieta/salute/agenda/spese, luoghi chiave, target nutrizionali, obiettivo di sonno, ed eventuale tracking del ciclo mestruale (opzionale, disattivato di default) — e configura davvero l'app scrivendo nel database mentre parla, non solo a fine conversazione.

Dettagli tecnici:
- Riconoscimento vocale in ingresso (`SpeechRecognition`, con fallback a testo se il browser non lo supporta) e sintesi vocale in uscita (`speechSynthesis`) — nessun servizio esterno per voce, tutto nel browser.
- Il "cervello" della conversazione è server-side (`server/onboarding.ts`), usa il tool use di Claude per chiamare funzioni tipizzate (`update_profile`, `set_enabled_modules`, `add_place`, `set_nutrition_targets`, `set_sleep_goal`, `enable_cycle_tracking`, `finish_onboarding`) che scrivono su `userSettings`, `places`, `nutritionTargets`.
- L'utente può sempre saltare (`Salta per ora`) e completare la configurazione più avanti; se `ANTHROPIC_API_KEY` non è configurata, l'onboarding mostra un messaggio chiaro e offre lo skip invece di bloccare l'accesso all'app.
- Finché l'onboarding non è completato (o saltato), ogni route protetta reindirizza automaticamente a `/onboarding`.

## Mascotte animata e avatar personalizzato

Un piccolo compagno a corpo intero (testa, busto, braccia, gambe) vive nell'app: cammina, salta,
punta i campi da compilare, balla la macarena sui traguardi, e guida l'utente nei form a due
tempi (Registrazione, nuovo To-do) con una vera coreografia — punta il campo, festeggia quando lo
completi, corre e "tira giù" per rivelare i campi successivi (nascosti finché non serve, con un
fallback di sicurezza che li mostra comunque entro pochi secondi anche se l'animazione fallisce).

Da **Altro → Personalizza il tuo avatar** l'utente può caricare una foto del proprio viso: il
riconoscimento facciale (face-api.js, rete tiny-face-detector + landmark a 68 punti, pesi
self-hosted in `client/public/models`) gira interamente nel browser via tensorflow.js — nessun
servizio esterno, nessun upload. Dal volto rilevato vengono ricavati carnagione, colore capelli e
proporzioni del viso, applicati al personaggio al posto del vecchio aspetto da robottino generico
(niente più antenna/orecchie robotiche: testa modellata sulla forma rilevata, capelli stilizzati,
occhi con lo stesso sistema di espressioni di prima — incluso lo stato "in ascolto" quando l'utente
parla con l'assistente vocale in onboarding). **La foto non viene mai inviata al server né salvata**
— solo i valori derivati (`avatarSkinColor`, `avatarHairColor`, `avatarAccentColor`,
`avatarFaceWidthRatio`) finiscono in `userSettings`. La libreria di riconoscimento (~600kB) è
caricata solo su questa pagina (`React.lazy`), non pesa sul resto dell'app.

## Stato di avanzamento moduli

| Modulo                     | Stato                                     |
| --------------------------- | ------------------------------------------ |
| Autenticazione multi-utente | ✅ Completo                                |
| Onboarding con assistente vocale | ✅ Completo (richiede `ANTHROPIC_API_KEY`) |
| Mascotte animata + avatar personalizzato | ✅ Completo                    |
| Dashboard / shell           | ✅ Completo                                |
| To-do list                  | ✅ Completo (CRUD, priorità, scadenza)     |
| Routine / abitudini         | ✅ MVP (tracking giornaliero + streak semplice) |
| Dieta                       | 🕓 Schema dati pronto (+ target impostabili in onboarding), UI non ancora implementata |
| Salute (sonno, ciclo)       | 🕓 Schema dati pronto (+ obiettivo sonno/ciclo impostabili in onboarding), UI non ancora implementata |
| Agenda intelligente         | 🕓 Schema dati pronto (+ luoghi chiave impostabili in onboarding), UI non ancora implementata |
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
    pages/        Pagine dell'app (incl. Onboarding.tsx, chat immersiva)
    lib/          Query client, contesto auth, speech.ts (TTS/STT), utility
server/       Backend Express
  routes/        Router per singolo modulo (todos, habits, onboarding)
  auth.ts        Router di autenticazione + middleware requireAuth
  onboarding.ts   Conversazione con Claude (tool use) per l'onboarding
  db.ts          Connessione Drizzle/SQLite
  storage.ts      Data access layer
shared/       Codice condiviso tra client e server
  schema.ts       Schema Drizzle + validazione Zod
```

## Roadmap

Vedi la board del progetto per il dettaglio delle fasi successive (Fase 2: dieta, salute, agenda intelligente, spese, gamification, riepiloghi, comandi vocali, export dati; Fase 3: integrazione HealthKit e assistente vocale always-on, che richiedono la migrazione ad app nativa).
