import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <Link href="/more" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Altro
      </Link>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="font-display text-xl">{title}</CardTitle>
            <Badge variant="secondary">In arrivo</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Questo modulo è in fase di sviluppo e sarà disponibile in un prossimo aggiornamento di Life OS.
        </CardContent>
      </Card>
    </div>
  );
}
