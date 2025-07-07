import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Command {
  id: number;
  timestamp: string;
  command: string;
  status: "completado" | "fallido" | "emergencia" | "pendiente";
}

interface Props {
  commands: Command[];
}

/* helpers */
const iconFor = (s: Command["status"]) =>
  ({
    completado: <CheckCircle className="h-3 w-3 text-green-400" />,
    fallido: <XCircle className="h-3 w-3 text-red-400" />,
    emergencia: <AlertTriangle className="h-3 w-3 text-red-400" />,
    pendiente: <Clock className="h-3 w-3 text-yellow-400" />,
  }[s]);

const badgeVariant = (s: Command["status"]) =>
  s === "completado" ? "default" : s === "pendiente" ? "secondary" : "destructive";

export const CommandHistory = ({ commands }: Props) => {
  const history = [...commands].reverse(); // newest first

  return (
    <Card className="border border-border/20 bg-card/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Clock className="h-5 w-5" />
          Historial de Comandos
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-3">
            {history.map((c) => (
              <div
                key={c.id}
                className="
                  flex items-start gap-3 rounded-xl border border-border/10
                  bg-card/100 p-4 transition-all hover:bg-card/40
                "
              >
                <div className="mt-1 flex-shrink-0">{iconFor(c.status)}</div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-secondary-foreground">
                      {c.command}
                    </p>
                    <Badge
                      variant={badgeVariant(c.status) as any}
                      className="flex-shrink-0 text-xs font-semibold capitalize"
                    >
                      {c.status}
                    </Badge>
                  </div>

                  <p className="font-mono text-xs text-muted-foreground">
                    {c.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
