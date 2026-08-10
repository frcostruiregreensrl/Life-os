import { Link } from "wouter";
import { Utensils, HeartPulse, CalendarClock, Wallet, BarChart3, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  { href: "/dieta", label: "Dieta", icon: Utensils },
  { href: "/salute", label: "Salute", icon: HeartPulse },
  { href: "/agenda", label: "Agenda intelligente", icon: CalendarClock },
  { href: "/spese", label: "Spese e risparmi", icon: Wallet },
  { href: "/riepiloghi", label: "Riepiloghi", icon: BarChart3 },
];

export default function More() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-6 py-2">
      <div>
        <p className="font-data text-xs uppercase tracking-wider text-muted-foreground">Altro</p>
        <h2 className="font-display text-2xl text-foreground">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="flex flex-col gap-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href}>
              <Card className="border-border/80 transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{mod.label}</span>
                  <Badge variant="secondary" className="text-[0.65rem]">
                    In arrivo
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => logout()}
        className="flex items-center justify-center gap-2 rounded-xl border border-border/80 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  );
}
