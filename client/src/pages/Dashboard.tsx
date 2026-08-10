import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { it } from "date-fns/locale";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import type { Todo, Habit, HabitLog } from "@shared/schema";

type HabitWithStreak = Habit & { streak: number; logs: HabitLog[] };

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const upcomingModules = [
  { href: "/dieta", label: "Dieta" },
  { href: "/salute", label: "Salute" },
  { href: "/agenda", label: "Agenda" },
  { href: "/spese", label: "Spese" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: todos } = useQuery<Todo[]>({ queryKey: ["/api/todos"] });
  const { data: habits } = useQuery<HabitWithStreak[]>({ queryKey: ["/api/habits"] });

  const pending = todos?.filter((t) => !t.completed) ?? [];
  const dueToday = pending.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString());
  const topHabit = habits?.length ? habits.reduce((a, b) => (b.streak > a.streak ? b : a)) : null;
  const ringFraction = topHabit ? Math.min(topHabit.streak / 30, 1) : 0;
  const today = format(new Date(), "EEEE d MMMM", { locale: it });

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <p className="font-data text-xs uppercase tracking-wider text-muted-foreground">
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </p>
        <h2 className="font-display text-2xl text-foreground">Bentornato, {user?.name?.split(" ")[0]}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/todos" className="rounded-2xl border border-border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Da fare oggi</p>
          <p className="font-data text-3xl font-bold text-primary">{pending.length}</p>
          <p className="text-[0.68rem] text-muted-foreground">
            {dueToday.length > 0 ? `${dueToday.length} scade oggi` : "nessuna scadenza oggi"}
          </p>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Routine attive</p>
          <p className="font-data text-3xl font-bold text-foreground">{habits?.length ?? 0}</p>
          <p className="text-[0.68rem] text-muted-foreground">tracciate ogni giorno</p>
        </div>

        {topHabit && (
          <Link
            href="/habits"
            className="col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-secondary to-card p-4"
          >
            <svg width="56" height="56" viewBox="0 0 60 60" className="shrink-0">
              <circle cx="30" cy="30" r={RING_RADIUS} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
              <circle
                cx="30"
                cy="30"
                r={RING_RADIUS}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringFraction)}
                transform="rotate(-90 30 30)"
              />
            </svg>
            <div>
              <p className="text-xs text-muted-foreground">Serie più lunga</p>
              <p className="font-data text-xl font-bold text-foreground">{topHabit.streak} giorni</p>
              <p className="text-xs text-muted-foreground">{topHabit.name}</p>
            </div>
          </Link>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Moduli in arrivo</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {upcomingModules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
