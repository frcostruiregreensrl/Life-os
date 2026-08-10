import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mic, Send, SkipForward } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { getSpeechRecognition, speak, stopSpeaking } from "@/lib/speech";
import { Button } from "@/components/ui/button";
import { Robot, type RobotState } from "@/components/Robot";
import { cn } from "@/lib/utils";
import type { Place, UserSettings, NutritionTargets } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface OnboardingResponse {
  reply: string;
  messages: unknown[];
  done: boolean;
  settings: UserSettings;
  places: Place[];
  nutritionTargets: NutritionTargets | null;
}

export default function Onboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState("");
  const [snapshot, setSnapshot] = useState<{ settings: UserSettings | null; places: Place[]; nutritionTargets: NutritionTargets | null }>({
    settings: null,
    places: [],
    nutritionTargets: null,
  });
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const prevDoneCountRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, user, setLocation]);

  const sendMutation = useMutation({
    mutationFn: async (payload: { messages: unknown[]; text?: string }) => {
      const res = await apiRequest("POST", "/api/onboarding/message", payload);
      return (await res.json()) as OnboardingResponse;
    },
    onSuccess: (data) => {
      setError(null);
      setHistory(data.messages);
      setSnapshot({ settings: data.settings, places: data.places, nutritionTargets: data.nutritionTargets });
      if (data.reply) {
        setChat((prev) => [...prev, { role: "assistant", text: data.reply }]);
        speak(
          data.reply,
          () => setSpeaking(true),
          () => setSpeaking(false),
        );
      }
      if (data.done) {
        queryClient.setQueryData(["/api/onboarding/status"], {
          settings: data.settings,
          places: data.places,
          nutritionTargets: data.nutritionTargets,
        });
        setTimeout(() => setLocation("/"), 1800);
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "L'assistente non è al momento disponibile.");
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/skip");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/onboarding/status"], data);
      setLocation("/");
    },
  });

  useEffect(() => {
    if (startedRef.current || !user) return;
    startedRef.current = true;
    sendMutation.mutate({ messages: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => () => stopSpeaking(), []);

  function handleSend(text: string) {
    if (!text.trim() || sendMutation.isPending) return;
    setChat((prev) => [...prev, { role: "user", text }]);
    setInput("");
    sendMutation.mutate({ messages: history, text });
  }

  function toggleMic() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    if (listening) {
      setListening(false);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "it-IT";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  const micAvailable = !!getSpeechRecognition();

  const chips = [
    { label: "Orario lavoro", done: !!snapshot.settings?.workEndTime },
    { label: "Obiettivo", done: !!snapshot.settings?.generalGoals },
    { label: "Moduli", done: !!(snapshot.settings?.dietModuleEnabled || snapshot.settings?.healthModuleEnabled || snapshot.settings?.agendaModuleEnabled || snapshot.settings?.expensesModuleEnabled) },
    { label: "Luoghi", done: snapshot.places.length > 0 },
  ];

  const doneCount = chips.filter((c) => c.done).length;
  const currentFocus = chips.find((c) => !c.done)?.label;

  useEffect(() => {
    if (doneCount > prevDoneCountRef.current) {
      setCelebrate(true);
      const timeout = setTimeout(() => setCelebrate(false), 650);
      prevDoneCountRef.current = doneCount;
      return () => clearTimeout(timeout);
    }
    prevDoneCountRef.current = doneCount;
  }, [doneCount]);

  const robotState: RobotState = listening
    ? "listening"
    : speaking
      ? "speaking"
      : sendMutation.isPending
        ? "thinking"
        : "idle";

  if (authLoading || !user) return null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Robot state={robotState} celebrate={celebrate} size={52} />
          <div>
            <span className="font-display block text-sm text-foreground">Configurazione Life OS</span>
            <span className="font-data block text-[0.65rem] text-muted-foreground">
              {celebrate
                ? "fatto!"
                : listening
                  ? "ti ascolto..."
                  : speaking
                    ? "sto parlando..."
                    : sendMutation.isPending
                      ? "sto pensando..."
                      : currentFocus
                        ? `ora: ${currentFocus.toLowerCase()}`
                        : "pronto"}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => skipMutation.mutate()}
          disabled={skipMutation.isPending}
        >
          Salta per ora
          <SkipForward className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className={cn(
              "font-data shrink-0 rounded-full border px-3 py-1 text-xs",
              chip.done ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground",
            )}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "self-start rounded-tl-sm bg-card text-foreground"
                  : "self-end rounded-tr-sm bg-primary text-primary-foreground",
              )}
            >
              {msg.text}
            </div>
          ))}
          {sendMutation.isPending && (
            <div className="self-start rounded-2xl rounded-tl-sm bg-card px-4 py-2.5 text-sm text-muted-foreground">
              Sto scrivendo...
            </div>
          )}
          {error && (
            <div className="self-center rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-center text-sm text-warning">
              {error}
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={() => skipMutation.mutate()}>
                  Salta e vai alla dashboard
                </Button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="border-t border-border bg-background/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Scrivi o usa il microfono..."
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {micAvailable && (
            <Button
              type="button"
              size="icon"
              variant={listening ? "default" : "secondary"}
              className="shrink-0 rounded-full"
              onClick={toggleMic}
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
