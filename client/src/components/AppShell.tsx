import { Link, useLocation } from "wouter";
import { Home, CheckSquare, Flame, Grid2x2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/todos", label: "To-do", icon: CheckSquare },
  { href: "/habits", label: "Routine", icon: Flame },
  { href: "/more", label: "Altro", icon: Grid2x2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
