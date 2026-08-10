import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { UserSettings } from "@shared/schema";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: onboarding, isLoading: onboardingLoading } = useQuery<{ settings: UserSettings }>({
    queryKey: ["/api/onboarding/status"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
      return;
    }
    if (user && onboarding && !onboarding.settings.onboardingCompleted) {
      setLocation("/onboarding");
    }
  }, [isLoading, user, onboarding, setLocation]);

  if (isLoading || (user && onboardingLoading)) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Caricamento...</div>;
  }

  if (!user || (onboarding && !onboarding.settings.onboardingCompleted)) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
