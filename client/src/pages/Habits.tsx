import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Habit, HabitLog } from "@shared/schema";

type HabitWithStreak = Habit & { streak: number; logs: HabitLog[] };

const today = () => new Date().toISOString().slice(0, 10);

export default function Habits() {
  const queryClient = useQueryClient();
  const { data: habits, isLoading } = useQuery<HabitWithStreak[]>({ queryKey: ["/api/habits"] });
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/habits", { name });
    },
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
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
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Routine</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuova routine</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) createMutation.mutate();
            }}
          >
            <Input
              placeholder="Es. Bere 2L di acqua"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              Aggiungi
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Caricamento...</p>}

      <div className="flex flex-col gap-2">
        {habits?.map((habit) => {
          const doneToday = habit.logs.some((l) => l.date === today() && l.completed);
          return (
            <Card key={habit.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Checkbox
                  checked={doneToday}
                  onCheckedChange={(checked) => logMutation.mutate({ id: habit.id, completed: checked === true })}
                />
                <div className="flex-1">
                  <p className="font-medium">{habit.name}</p>
                  {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                </div>
                <div className="flex items-center gap-1 text-sm text-orange-500">
                  <Flame className="h-4 w-4" />
                  {habit.streak}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(habit.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {habits && habits.length === 0 && (
          <p className="text-center text-muted-foreground">Nessuna routine ancora. Aggiungine una per iniziare.</p>
        )}
      </div>
    </div>
  );
}
