import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { storage } from "./storage";

const MODEL = process.env.ANTHROPIC_ONBOARDING_MODEL || "claude-sonnet-5";
const MAX_TOOL_ROUNDS = 6;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurata: l'assistente di onboarding richiede questa variabile d'ambiente per funzionare.",
    );
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `Sei l'assistente di configurazione di Life OS, una PWA personale per organizzare la vita quotidiana (attività, abitudini, dieta, salute, agenda, spese).

Il tuo compito è condurre una breve conversazione vocale (le tue risposte verranno lette ad alta voce) per configurare l'app per il nuovo utente. Regole:
- Rispondi SEMPRE in italiano, con frasi brevi (1-3 frasi), tono amichevole e naturale, senza elenchi puntati o markdown: verranno lette ad alta voce.
- Inizia presentandoti brevemente e spiegando cosa fa Life OS (gestione di to-do, abitudini, e in arrivo dieta/salute/agenda/spese), poi chiedi una cosa alla volta.
- Chiedi: orario tipico di fine lavoro, un obiettivo generale che ha in mente, quali moduli tra dieta/salute/agenda/spese vuole attivare da subito.
- Per ogni modulo che l'utente vuole attivare, fai UNA domanda di follow-up pertinente: dieta → target calorico approssimativo o "decido dopo"; salute → obiettivo ore di sonno, e chiedi ESPLICITAMENTE e con delicatezza se vuole attivare il tracciamento del ciclo mestruale (è opzionale, di default disattivato, dati sensibili); agenda → chiedi 1-2 luoghi chiave (casa, lavoro, palestra) con indirizzo se lo sa.
- Usa sempre gli strumenti a disposizione per salvare le informazioni man mano che l'utente le fornisce, non solo alla fine.
- Se l'utente vuole saltare o dice che ha fretta, rispetta la richiesta e concludi subito.
- Quando hai raccolto abbastanza (o l'utente vuole fermarsi), chiama finish_onboarding e saluta con una frase breve.
- Non inventare dati: se l'utente non risponde a una domanda, vai avanti senza forzare.`;

const tools: Tool[] = [
  {
    name: "update_profile",
    description: "Salva dati di profilo raccolti durante la conversazione.",
    input_schema: {
      type: "object",
      properties: {
        workEndTime: { type: "string", description: "Orario tipico di fine lavoro, formato HH:MM" },
        generalGoals: { type: "string", description: "Obiettivo generale espresso dall'utente, in una frase" },
      },
    },
  },
  {
    name: "set_enabled_modules",
    description: "Attiva o disattiva i moduli Fase 2 in base a cosa vuole l'utente.",
    input_schema: {
      type: "object",
      properties: {
        diet: { type: "boolean" },
        health: { type: "boolean" },
        agenda: { type: "boolean" },
        expenses: { type: "boolean" },
      },
    },
  },
  {
    name: "add_place",
    description: "Aggiunge un luogo chiave (casa, lavoro, palestra, altro) usato dal modulo Agenda.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string", enum: ["casa", "lavoro", "palestra", "altro"] },
        address: { type: "string" },
      },
      required: ["name", "category"],
    },
  },
  {
    name: "set_nutrition_targets",
    description: "Imposta i target nutrizionali giornalieri per il modulo Dieta.",
    input_schema: {
      type: "object",
      properties: {
        calories: { type: "number" },
        proteinG: { type: "number" },
        carbsG: { type: "number" },
        fatG: { type: "number" },
        waterMl: { type: "number" },
      },
    },
  },
  {
    name: "set_sleep_goal",
    description: "Imposta l'obiettivo di ore di sonno per il modulo Salute.",
    input_schema: {
      type: "object",
      properties: { minutes: { type: "number", description: "Obiettivo di sonno in minuti" } },
      required: ["minutes"],
    },
  },
  {
    name: "enable_cycle_tracking",
    description: "Attiva o disattiva il tracciamento del ciclo mestruale (opzionale, sensibile).",
    input_schema: {
      type: "object",
      properties: { enabled: { type: "boolean" } },
      required: ["enabled"],
    },
  },
  {
    name: "finish_onboarding",
    description: "Segna la configurazione iniziale come completata e chiude la conversazione.",
    input_schema: { type: "object", properties: {} },
  },
];

async function executeTool(userId: number, name: string, input: any): Promise<unknown> {
  switch (name) {
    case "update_profile": {
      const data: Record<string, unknown> = {};
      if (input.workEndTime) data.workEndTime = input.workEndTime;
      if (input.generalGoals) data.generalGoals = input.generalGoals;
      return storage.updateUserSettings(userId, data);
    }
    case "set_enabled_modules": {
      const data: Record<string, unknown> = {};
      if (typeof input.diet === "boolean") data.dietModuleEnabled = input.diet;
      if (typeof input.health === "boolean") data.healthModuleEnabled = input.health;
      if (typeof input.agenda === "boolean") data.agendaModuleEnabled = input.agenda;
      if (typeof input.expenses === "boolean") data.expensesModuleEnabled = input.expenses;
      return storage.updateUserSettings(userId, data);
    }
    case "add_place":
      return storage.addPlace(userId, { name: input.name, category: input.category, address: input.address });
    case "set_nutrition_targets":
      return storage.upsertNutritionTargets(userId, input);
    case "set_sleep_goal":
      return storage.updateUserSettings(userId, { sleepGoalMinutes: input.minutes });
    case "enable_cycle_tracking":
      return storage.updateUserSettings(userId, { cycleTrackingEnabled: input.enabled });
    case "finish_onboarding":
      return storage.updateUserSettings(userId, { onboardingCompleted: true });
    default:
      throw new Error(`Strumento sconosciuto: ${name}`);
  }
}

export async function runOnboardingTurn(userId: number, history: MessageParam[]) {
  const messages: MessageParam[] = [...history];
  let done = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) {
      const reply = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n");
      return { reply, messages, done };
    }

    const toolResults: ContentBlockParam[] = [];
    for (const toolUse of toolUses) {
      if (toolUse.type !== "tool_use") continue;
      if (toolUse.name === "finish_onboarding") done = true;
      let result: unknown;
      try {
        result = await executeTool(userId, toolUse.name, toolUse.input);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Errore sconosciuto" };
      }
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { reply: "Ok, ho salvato tutto quello che mi hai detto finora.", messages, done: true };
}

export async function getOnboardingSnapshot(userId: number) {
  const [settings, userPlaces, nutrition] = await Promise.all([
    storage.getUserSettings(userId),
    storage.listPlaces(userId),
    storage.getNutritionTargets(userId),
  ]);
  return { settings, places: userPlaces, nutritionTargets: nutrition };
}
