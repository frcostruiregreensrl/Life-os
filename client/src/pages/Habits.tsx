import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { celebrateCompanion } from "@/lib/companionBus";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@shared/schema";

type HabitWithStreak = Habit & { streak: number; logs: HabitLog[] };

const today = () => new Date().toISOString().slice(0, 10);
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];

export default function Habits() {
  const queryClient = useQueryClient();
  const { data: habits, isLoading } = useQuery<HabitWithStreak[]>({ queryKey: ["/api/habits"] });
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const prevStreaksRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!habits) return;
    for (const habit of habits) {
      const prevStreak = prevStreaksRef.current[habit.id];
      if (prevStreak !== undefined && habit.streak > prevStreak) {
        const milestone = STREAK_MILESTONES.includes(habit.streak);
        celebrateCompanion(milestone ? `${habit.streak} giorni! 🔥` : undefined);
      }
      prevStreaksRef.current[habit.id] = habit.streak;
    }
  }, [habits]);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/habits", { name });
    },
    onSuccess: () => {
      setName("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      celebrateCompanion();
    },
  });

  const logMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      await apiRequest("POST", `/api/habits/${id}/log`, { date: today(), completed });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/habits"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/habits"] }),
  });

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Routine</h2>
        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Nuova
        </Button>
      </div>

      {showForm && (
        <form
          className="flex gap-2 rounded-2xl border border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate();
          }}
        >
          <Input
            autoFocus
            placeholder="Es. Bere 2L di acqua"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
            Aggiungi
          </Button>
        </form>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Caricamento...</p>}

      <div className="grid grid-cols-2 gap-3">
        {habits?.map((habit) => {
          const doneToday = habit.logs.some((l) => l.date === today() && l.completed);
          const fraction = Math.min(habit.streak / 14, 1);
          return (
            <div key={habit.id} className="group relative flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center">
              <button
                onClick={() => deleteMutation.mutate(habit.id)}
                className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Elimina routine"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => logMutation.mutate({ id: habit.id, completed: !doneToday })}
                className="relative flex items-center justify-center"
                aria-label={doneToday ? "Segna come non fatto" : "Segna come fatto"}
              >
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r={RADIUS} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                  <circle
                    cx="30"
                    cy="30"
                    r={RADIUS}
                    fill="none"
                    stroke={doneToday ? "hsl(var(--success))" : "hsl(var(--warning))"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
                    transform="rotate(-90 30 30)"
                    className="transition-all"
                  />
                </svg>
                <span className="font-data absolute text-xs font-bold">{habit.streak}</span>
              </button>
              <p className="text-xs font-medium leading-snug">{habit.name}</p>
              <p className="font-data text-[0.65rem] text-muted-foreground">
                {doneToday ? "fatto oggi" : "tocca per segnare"}
              </p>
            </div>
          );
        })}
      </div>
      {habits && habits.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nessuna routine ancora. Aggiungine una per iniziare.</p>
      )}
    </div>
  );
}
