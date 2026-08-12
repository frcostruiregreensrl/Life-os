import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { UserSettings } from "@shared/schema";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20;
const RECHECK_MS = 5 * 60 * 1000;

/**
 * Applies the "centro di controllo" dark theme at night and a light theme during the day,
 * unless the user has explicitly forced light/dark in their settings. Re-checks periodically
 * so a session left open across the day/night boundary switches without a reload.
 */
export function useAutoTheme() {
  const { user } = useAuth();
  const { data } = useQuery<{ settings: UserSettings }>({ queryKey: ["/api/onboarding/status"], enabled: !!user });
  const themePref = data?.settings?.theme ?? "system";

  useEffect(() => {
    function apply() {
      let effective: "light" | "dark";
      if (themePref === "light" || themePref === "dark") {
        effective = themePref;
      } else {
        const hour = new Date().getHours();
        effective = hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? "light" : "dark";
      }
      document.documentElement.dataset.theme = effective;
    }
    apply();
    const interval = setInterval(apply, RECHECK_MS);
    return () => clearInterval(interval);
  }, [themePref]);
}
