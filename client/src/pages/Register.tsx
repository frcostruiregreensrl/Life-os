import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormCompanion } from "@/components/FormCompanion";

export default function Register() {
  const { user, register } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeField, setActiveField] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Errore di registrazione");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <FormCompanion activeField={activeField} />
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => setActiveField(e.currentTarget)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => setActiveField(e.currentTarget)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => setActiveField(e.currentTarget)}
              />
            </div>
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
