import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  todos,
  habits,
  habitLogs,
  userSettings,
  places,
  nutritionTargets,
  type InsertTodo,
  type InsertHabit,
} from "@shared/schema";

export const storage = {
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async createUser(data: { email: string; passwordHash: string; name: string }) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async listTodos(userId: number) {
    return db.select().from(todos).where(eq(todos.userId, userId)).orderBy(desc(todos.createdAt));
  },

  async getTodo(userId: number, id: number) {
    const [todo] = await db.select().from(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return todo;
  },

  async createTodo(userId: number, data: InsertTodo) {
    const [todo] = await db.insert(todos).values({ ...data, userId }).returning();
    return todo;
  },

  async updateTodo(userId: number, id: number, data: Partial<InsertTodo>) {
    const [todo] = await db
      .update(todos)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    return todo;
  },

  async deleteTodo(userId: number, id: number) {
    const result = await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId))).returning();
    return result.length > 0;
  },

  async listHabits(userId: number) {
    return db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.archived, false)));
  },

  async createHabit(userId: number, data: InsertHabit) {
    const [habit] = await db.insert(habits).values({ ...data, userId }).returning();
    return habit;
  },

  async deleteHabit(userId: number, id: number) {
    const result = await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId))).returning();
    return result.length > 0;
  },

  async getHabit(userId: number, id: number) {
    const [habit] = await db.select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));
    return habit;
  },

  async listHabitLogs(userId: number, habitId: number) {
    return db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, userId), eq(habitLogs.habitId, habitId)))
      .orderBy(desc(habitLogs.date));
  },

  async getHabitLogForDate(userId: number, habitId: number, date: string) {
    const [log] = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.userId, userId), eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
    return log;
  },

  async setHabitLog(userId: number, habitId: number, date: string, completed: boolean) {
    const existing = await this.getHabitLogForDate(userId, habitId, date);
    if (existing) {
      const [log] = await db
        .update(habitLogs)
        .set({ completed })
        .where(eq(habitLogs.id, existing.id))
        .returning();
      return log;
    }
    const [log] = await db.insert(habitLogs).values({ userId, habitId, date, completed }).returning();
    return log;
  },

  async getUserSettings(userId: number) {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (settings) return settings;
    const [created] = await db.insert(userSettings).values({ userId }).returning();
    return created;
  },

  async updateUserSettings(userId: number, data: Partial<typeof userSettings.$inferInsert>) {
    await this.getUserSettings(userId);
    const [settings] = await db
      .update(userSettings)
      .set(data)
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  },

  async addPlace(userId: number, data: { name: string; category?: string; address?: string }) {
    const [place] = await db.insert(places).values({ ...data, userId }).returning();
    return place;
  },

  async listPlaces(userId: number) {
    return db.select().from(places).where(eq(places.userId, userId));
  },

  async getNutritionTargets(userId: number) {
    const [row] = await db.select().from(nutritionTargets).where(eq(nutritionTargets.userId, userId));
    return row ?? null;
  },

  async upsertNutritionTargets(userId: number, data: Partial<typeof nutritionTargets.$inferInsert>) {
    const [existing] = await db.select().from(nutritionTargets).where(eq(nutritionTargets.userId, userId));
    if (existing) {
      const [updated] = await db
        .update(nutritionTargets)
        .set(data)
        .where(eq(nutritionTargets.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(nutritionTargets).values({ ...data, userId }).returning();
    return created;
  },
};
