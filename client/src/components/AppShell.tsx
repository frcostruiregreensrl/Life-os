import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Utensils,
  HeartPulse,
  CalendarClock,
  Wallet,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/todos", label: "To-do", icon: CheckSquare },
  { href: "/habits", label: "Routine", icon: Repeat },
  { href: "/dieta", label: "Dieta", icon: Utensils },
  { href: "/salute", label: "Salute", icon: HeartPulse },
  { href: "/agenda", label: "Agenda", icon: CalendarClock },
  { href: "/spese", label: "Spese", icon: Wallet },
  { href: "/riepiloghi", label: "Riepiloghi", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card p-4 sm:flex">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold">Life OS</h1>
          {user && <p className="truncate text-sm text-muted-foreground">{user.name}</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="justify-start gap-3" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
