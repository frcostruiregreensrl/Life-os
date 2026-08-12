import { useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { extractFaceProfile, type FaceProfile } from "@/lib/faceExtract";
import { useAvatarColors } from "@/lib/useAvatarColors";
import { Robot, type Action } from "@/components/Robot";
import { Button } from "@/components/ui/button";

export default function AvatarSettings() {
  const queryClient = useQueryClient();
  const current = useAvatarColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<FaceProfile | null>(
    current.skinColor
      ? { skinColor: current.skinColor, hairColor: current.hairColor ?? "#3a2c22", faceWidthRatio: current.faceWidthRatio ?? 0.85 }
      : null,
  );
  const [previewAction, setPreviewAction] = useState<Action>("idle");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      avatarSkinColor: string | null;
      avatarAccentColor: string | null;
      avatarHairColor: string | null;
      avatarFaceWidthRatio: number | null;
    }) => {
      const res = await apiRequest("PATCH", "/api/settings/avatar", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      setPreviewAction("dance");
      setTimeout(() => setPreviewAction("idle"), 2300);
    },
  });

  async function handleFile(file: File) {
    setError(null);
    setExtracting(true);
    try {
      const detected = await extractFaceProfile(file);
      if (!detected) {
        setError("Non sono riuscito a riconoscere un volto in questa foto. Provane un'altra, con il viso ben visibile e illuminato.");
      } else {
        setProfile(detected);
      }
    } catch (err) {
      setError("Non sono riuscito a leggere questa immagine.");
    } finally {
      setExtracting(false);
    }
  }

  function save() {
    saveMutation.mutate({
      avatarSkinColor: profile?.skinColor ?? null,
      avatarAccentColor: profile?.hairColor ?? null,
      avatarHairColor: profile?.hairColor ?? null,
      avatarFaceWidthRatio: profile?.faceWidthRatio ?? null,
    });
  }

  function reset() {
    setProfile(null);
    saveMutation.mutate({ avatarSkinColor: null, avatarAccentColor: null, avatarHairColor: null, avatarFaceWidthRatio: null });
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <Link href="/more" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Altro
      </Link>

      <div>
        <h2 className="font-display text-2xl text-foreground">Personalizza il tuo avatar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carica una foto del tuo viso: lo riconosco e ne ricavo una versione stilizzata — forma del viso, carnagione e
          capelli — tutto qui nel browser. La foto non viene mai inviata né salvata da nessuna parte.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <Robot
          action={previewAction}
          size={100}
          skinColor={profile?.skinColor}
          accentColor={profile?.hairColor}
          hairColor={profile?.hairColor}
          faceWidthRatio={profile?.faceWidthRatio}
        />
        <p className="font-data text-xs text-muted-foreground">anteprima</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button variant="secondary" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={extracting}>
        <Upload className="h-4 w-4" />
        {extracting ? "Riconosco il volto..." : "Carica una foto"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button className="flex-1 gap-2" disabled={saveMutation.isPending || !profile} onClick={save}>
          <Sparkles className="h-4 w-4" />
          {saveMutation.isPending ? "Salvo..." : "Salva"}
        </Button>
        {(current.skinColor || current.hairColor) && (
          <Button variant="ghost" onClick={reset}>
            Ripristina
          </Button>
        )}
      </div>
    </div>
  );
}
