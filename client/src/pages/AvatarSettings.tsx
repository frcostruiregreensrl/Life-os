import { useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { extractPalette } from "@/lib/avatarColors";
import { useAvatarColors } from "@/lib/useAvatarColors";
import { Robot, type Action } from "@/components/Robot";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AvatarSettings() {
  const queryClient = useQueryClient();
  const current = useAvatarColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [palette, setPalette] = useState<string[]>([]);
  const [skinColor, setSkinColor] = useState<string | undefined>(current.skinColor);
  const [accentColor, setAccentColor] = useState<string | undefined>(current.accentColor);
  const [previewAction, setPreviewAction] = useState<Action>("idle");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (data: { avatarSkinColor: string | null; avatarAccentColor: string | null }) => {
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
      const colors = await extractPalette(file);
      if (colors.length === 0) {
        setError("Non sono riuscito a trovare colori chiari in questa foto. Provane un'altra, magari più luminosa.");
      } else {
        setPalette(colors);
        setSkinColor(colors[0]);
        setAccentColor(colors[1] ?? colors[0]);
      }
    } catch (err) {
      setError("Non sono riuscito a leggere questa immagine.");
    } finally {
      setExtracting(false);
    }
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
          Carica una foto: ne leggo solo i colori dominanti, qui nel browser — la foto non viene mai inviata né salvata.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <Robot action={previewAction} size={100} skinColor={skinColor} accentColor={accentColor} />
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
        {extracting ? "Leggo i colori..." : "Carica una foto"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {palette.length > 0 && (
        <>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Colore corpo</p>
            <div className="flex gap-2">
              {palette.map((color) => (
                <button
                  key={`skin-${color}`}
                  onClick={() => setSkinColor(color)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-transform",
                    skinColor === color ? "scale-110 border-primary" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Usa ${color} come colore corpo`}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Colore accento (occhi)</p>
            <div className="flex gap-2">
              {palette.map((color) => (
                <button
                  key={`accent-${color}`}
                  onClick={() => setAccentColor(color)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition-transform",
                    accentColor === color ? "scale-110 border-primary" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Usa ${color} come colore accento`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2"
          disabled={saveMutation.isPending || (!skinColor && !accentColor)}
          onClick={() =>
            saveMutation.mutate({ avatarSkinColor: skinColor ?? null, avatarAccentColor: accentColor ?? null })
          }
        >
          <Sparkles className="h-4 w-4" />
          {saveMutation.isPending ? "Salvo..." : "Salva"}
        </Button>
        {(current.skinColor || current.accentColor) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSkinColor(undefined);
              setAccentColor(undefined);
              setPalette([]);
              saveMutation.mutate({ avatarSkinColor: null, avatarAccentColor: null });
            }}
          >
            Ripristina
          </Button>
        )}
      </div>
    </div>
  );
}
