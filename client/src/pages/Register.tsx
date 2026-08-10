import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormGuide, type Waypoint } from "@/components/FormGuide";
import { RevealSection } from "@/components/RevealSection";
import { celebrateCompanion } from "@/lib/companionBus";

export default function Register() {
  const { user, register } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [sectionRevealed, setSectionRevealed] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const sectionAnchorRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const waypoints: Waypoint[] = [
    { ref: nameRef },
    { ref: sectionAnchorRef, reveal: () => setSectionRevealed(true) },
    { ref: passwordRef },
  ];

  function completeStep(index: number, value: string) {
    if (value.trim() && index === completedCount) {
      setCompletedCount(index + 1);
    }
  }

  // safety net: never let a broken animation permanently hide required fields
  useEffect(() => {
    const timer = setTimeout(() => setSectionRevealed(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name);
      celebrateCompanion();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Errore di registrazione");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <FormGuide waypoints={waypoints} step={completedCount} />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crea il tuo account</CardTitle>
          <CardDescription>Inizia a organizzare la tua vita con Life OS.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                ref={nameRef}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={(e) => completeStep(0, e.target.value)}
              />
            </div>

            <div ref={sectionAnchorRef} />
            <RevealSection revealed={sectionRevealed}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  required={sectionRevealed}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => completeStep(1, e.target.value)}
                  tabIndex={sectionRevealed ? undefined : -1}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  ref={passwordRef}
                  type="password"
                  required={sectionRevealed}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  tabIndex={sectionRevealed ? undefined : -1}
                />
              </div>
            </RevealSection>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creazione account..." : "Registrati"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Hai già un account?{" "}
            <Link href="/login" className="text-primary underline">
              Accedi
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
