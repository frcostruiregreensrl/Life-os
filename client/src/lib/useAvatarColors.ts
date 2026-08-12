import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { UserSettings } from "@shared/schema";

export function useAvatarColors() {
  const { user } = useAuth();
  const { data } = useQuery<{ settings: UserSettings }>({ queryKey: ["/api/onboarding/status"], enabled: !!user });
  return {
    skinColor: data?.settings?.avatarSkinColor ?? undefined,
    accentColor: data?.settings?.avatarAccentColor ?? undefined,
    hairColor: data?.settings?.avatarHairColor ?? undefined,
    faceWidthRatio: data?.settings?.avatarFaceWidthRatio ?? undefined,
  };
}
