import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Todo } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: todos } = useQuery<Todo[]>({ queryKey: ["/api/todos"] });

  const pending = todos?.filter((t) => !t.completed) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Ciao, {user?.name}</h2>
        <p className="text-muted-foreground">Ecco un riepilogo della tua giornata.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/todos">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base">To-do da completare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pending.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/habits">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-base">Routine di oggi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Vai al modulo Routine per tracciare le tue abitudini.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
