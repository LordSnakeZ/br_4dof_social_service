import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Thermometer, Battery, Zap } from "lucide-react";

interface ArmStatus {
  connected: boolean;
  moving: boolean;
  temperature: number;
  power: number;
  emergency: boolean;
}

interface Props {
  status: ArmStatus;
}

export const StatusDashboard = ({ status }: Props) => {
  /* helpers */
  const statusVariant = (() => {
    if (status.emergency) return "destructive";
    if (!status.connected) return "secondary";
    if (status.moving) return "default";
    return "default";
  })();

  const statusText = (() => {
    if (status.emergency) return "EMERGENCIA";
    if (!status.connected) return "DESCONECTADO";
    if (status.moving) return "MOVIENDOSE";
    return "LISTO";
  })();

  return (
    <Card className="border border-border/20 bg-card/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Activity className="h-5 w-5" />
          Estado del Sistema
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* MAIN STATUS */}
        <div className="flex items-center justify-between rounded-lg bg-card/100 p-3">
          <span className="text-sm font-medium text-secondary-foreground">
            Estado
          </span>
          <Badge variant={statusVariant as any} className="font-semibold">
            {statusText}
          </Badge>
        </div>

        {/* METRICS */}
        <div className="grid gap-3">
          {/* Temperature */}
          <div className="flex items-center justify-between rounded-lg bg-card/100 p-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-secondary-foreground">
                Temperatura
              </span>
            </div>
            <span
              className={`font-mono font-bold ${
                status.temperature > 60
                  ? "text-destructive"
                  : status.temperature > 45
                  ? "text-yellow-400"
                  : "text-green-500"
              }`}
            >
              {status.temperature}°C
            </span>
          </div>

          {/* Power */}
          <div className="flex items-center justify-between rounded-lg bg-card/100 p-3">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-green-500" />
              <span className="text-sm text-secondary-foreground">
                Batería
                </span>
            </div>
            <span
              className={`font-mono font-bold ${
                status.power < 20
                  ? "text-destructive"
                  : status.power < 40
                  ? "text-yellow-400"
                  : "text-green-500"
              }`}
            >
              {status.power}%
            </span>
          </div>

          {/* Connection */}
          <div className="flex items-center justify-between rounded-lg bg-card/100 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-secondary-foreground">
                Conexión
              </span>
            </div>
            <span
              className={`h-3 w-3 rounded-full shadow-lg ${
                status.connected
                  ? "bg-green-400 shadow-green-400/40"
                  : "bg-red-400 shadow-red-400/40"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
