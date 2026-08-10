import { Router } from "express";
import { storage } from "../storage";
import { insertTodoSchema, updateTodoSchema } from "@shared/schema";
import { requireAuth } from "../auth";

export function createTodosRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req, res) => {
    const todos = await storage.listTodos(req.session.userId!);
    res.json(todos);
  });

  router.post("/", async (req, res) => {
    const parsed = insertTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Dati non validi" });
    }
    const todo = await storage.createTodo(req.session.userId!, parsed.data);
    res.status(201).json(todo);
  });

  router.patch("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const parsed = updateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Dati non validi" });
    }
    const todo = await storage.updateTodo(req.session.userId!, id, parsed.data);
    if (!todo) {
      return res.status(404).json({ message: "Attività non trovata" });
    }
    res.json(todo);
  });

  router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteTodo(req.session.userId!, id);
    if (!deleted) {
      return res.status(404).json({ message: "Attività non trovata" });
    }
    res.status(204).end();
  });

  return router;
}
