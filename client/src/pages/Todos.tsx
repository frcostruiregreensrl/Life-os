import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { FormCompanion } from "@/components/FormCompanion";
import { cn } from "@/lib/utils";
import type { Todo } from "@shared/schema";

const priorityLabels: Record<string, string> = { low: "Bassa", medium: "Media", high: "Alta" };
const priorityStripe: Record<string, string> = {
  low: "before:bg-success",
  medium: "before:bg-warning",
  high: "before:bg-destructive",
};

function isToday(date: string | Date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

export default function Todos() {
  const queryClient = useQueryClient();
  const { data: todos, isLoading } = useQuery<Todo[]>({ queryKey: ["/api/todos"] });
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [activeField, setActiveField] = useState<HTMLElement | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/todos", {
        title,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      setTitle("");
      setDueDate("");
      setPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      await apiRequest("PATCH", `/api/todos/${id}`, { completed });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  return (
    <div className="relative flex flex-col gap-4 py-2">
      <FormCompanion activeField={activeField} />
      <h2 className="font-display text-2xl text-foreground">To-do</h2>

      <form
        className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) createMutation.mutate();
        }}
      >
        <Input
          ref={inputRef}
          placeholder="Cosa devi fare?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={(e) => setActiveField(e.currentTarget)}
        />
        <div className="flex gap-2">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            onFocus={(e) => setActiveField(e.currentTarget)}
            className="flex-1"
          >
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </Select>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onFocus={(e) => setActiveField(e.currentTarget)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={createMutation.isPending || !title.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {isLoading && <p className="text-sm text-muted-foreground">Caricamento...</p>}

      <div className="flex flex-col gap-2">
        {todos?.map((todo) => (
          <div
            key={todo.id}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3.5 pl-4",
              "before:absolute before:inset-y-0 before:left-0 before:w-1",
              priorityStripe[todo.priority],
              todo.completed && "opacity-50",
            )}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={(checked) => toggleMutation.mutate({ id: todo.id, completed: checked === true })}
            />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", todo.completed && "line-through")}>{todo.title}</p>
              {todo.dueDate && (
                <span
                  className={cn(
                    "font-data mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[0.65rem]",
                    isToday(todo.dueDate) && !todo.completed && "bg-destructive/15 text-destructive",
                  )}
                >
                  {isToday(todo.dueDate)
                    ? "Oggi"
                    : new Date(todo.dueDate).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteMutation.mutate(todo.id)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Elimina attività"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {todos && todos.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nessuna attività. Aggiungine una per iniziare.</p>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30">
        <div className="relative mx-auto max-w-lg px-4">
          <button
            onClick={() => inputRef.current?.focus()}
            className="pointer-events-auto absolute right-4 flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            style={{ width: 52, height: 52 }}
            aria-label="Nuova attività"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
