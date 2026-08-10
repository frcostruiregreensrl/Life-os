import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">In arrivo</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Questo modulo è in fase di sviluppo e sarà disponibile in un prossimo aggiornamento di Life OS.
      </CardContent>
    </Card>
  );
}
