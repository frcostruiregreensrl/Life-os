import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Todo } from "@shared/schema";

const priorityLabels: Record<string, string> = { low: "Bassa", medium: "Media", high: "Alta" };
const priorityVariants: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

export default function Todos() {
  const queryClient = useQueryClient();
  const { data: todos, isLoading } = useQuery<Todo[]>({ queryKey: ["/api/todos"] });

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

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
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">To-do</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuova attività</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) createMutation.mutate();
            }}
          >
            <Input
              placeholder="Cosa devi fare?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-32">
              <option value="low">Bassa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </Select>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:w-40" />
            <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
              Aggiungi
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Caricamento...</p>}

      <div className="flex flex-col gap-2">
        {todos?.map((todo) => (
          <Card key={todo.id} className={cn(todo.completed && "opacity-60")}>
            <CardContent className="flex items-center gap-3 p-4">
              <Checkbox
                checked={todo.completed}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ id: todo.id, completed: checked === true })
                }
              />
              <div className="flex-1">
                <p className={cn("font-medium", todo.completed && "line-through")}>{todo.title}</p>
                {todo.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    Scadenza: {new Date(todo.dueDate).toLocaleDateString("it-IT")}
                  </p>
                )}
              </div>
              <Badge variant={priorityVariants[todo.priority]}>{priorityLabels[todo.priority]}</Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(todo.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {todos && todos.length === 0 && (
          <p className="text-center text-muted-foreground">Nessuna attività. Aggiungine una per iniziare.</p>
        )}
      </div>
    </div>
  );
}
