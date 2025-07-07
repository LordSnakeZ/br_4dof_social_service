import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Square, RotateCcw } from "lucide-react";

interface Props {
  onEmergencyStop: () => void;
  onReset: () => void;
  emergency: boolean;
}

export const EmergencyControls = ({
  onEmergencyStop,
  onReset,
  emergency,
}: Props) => (
  <Card className="border border-border/20 bg-card/20 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="h-5 w-5" />
        Controles de Emergencia
      </CardTitle>
    </CardHeader>

    <CardContent className="space-y-5">
      {/* E-STOP */}
      <Button
        onClick={onEmergencyStop}
        disabled={emergency}
        size="lg"
        className="
          w-full
          bg-gradient-to-r from-red-600 to-red-700
          hover:from-red-700 hover:to-red-800
          text-white font-bold py-4 text-lg
          shadow-lg hover:shadow-red-500/25
          transition-all
        "
      >
        <Square className="mr-2 h-5 w-5" />
        Paro de Emergencia
      </Button>

      {/* RESET */}
      {emergency && (
        <Button
          onClick={onReset}
          size="lg"
          className="
            w-full
            bg-gradient-to-r from-orange-600 to-orange-700
            hover:from-orange-700 hover:to-orange-800
            text-white font-semibold py-3
            shadow-lg hover:shadow-orange-500/25
            transition-all
          "
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar Sistema
        </Button>
      )}

      {/* Status banner */}
      <div className="rounded-lg bg-card/100 p-3 text-center text-xs">
        {emergency ? (
          <span className="flex items-center justify-center gap-2 font-semibold text-destructive">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
            SISTEMA EN ESTADO DE EMERGENCIA
          </span>
        ) : (
          <span className="text-muted-foreground">
            El paro de emergencia detendrá inmediatamente todos los movimientos del brazo
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);
