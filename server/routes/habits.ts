import { Router } from "express";
import { storage } from "../storage";
import { insertHabitSchema } from "@shared/schema";
import { requireAuth } from "../auth";

function computeStreak(dates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && key === new Date().toISOString().slice(0, 10)) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function createHabitsRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req, res) => {
    const userId = req.session.userId!;
    const habits = await storage.listHabits(userId);
    const withStreaks = await Promise.all(
      habits.map(async (habit) => {
        const logs = await storage.listHabitLogs(userId, habit.id);
        const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
        return { ...habit, streak: computeStreak(completedDates), logs };
      }),
    );
    res.json(withStreaks);
  });

  router.post("/", async (req, res) => {
    const parsed = insertHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Dati non validi" });
    }
    const habit = await storage.createHabit(req.session.userId!, parsed.data);
    res.status(201).json(habit);
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteHabit(req.session.userId!, id);
    if (!deleted) {
      return res.status(404).json({ message: "Routine non trovata" });
    }
    res.status(204).end();
  });

  router.post("/:id/log", async (req, res) => {
    const userId = req.session.userId!;
    const habitId = Number(req.params.id);
    const date: string = req.body.date || new Date().toISOString().slice(0, 10);
    const completed: boolean = req.body.completed ?? true;

    const habit = await storage.getHabit(userId, habitId);
    if (!habit) {
      return res.status(404).json({ message: "Routine non trovata" });
    }

    const log = await storage.setHabitLog(userId, habitId, date, completed);
    res.json(log);
  });

  return router;
}
