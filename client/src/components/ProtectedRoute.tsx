import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Caricamento...</div>;
  }

  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
