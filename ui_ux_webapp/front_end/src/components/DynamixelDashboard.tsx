import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

import { ServoMonitor } from "@/components/ServoMonitor";

/* ---------- Tipos ---------- */
export interface ServoData {
  id: number;
  name: string;
  presentPosition: number;
  goalPosition: number;
  moving: boolean;
  presentSpeed: number;
  presentLoad: number;
  torqueEnable: boolean;
  torqueLimit: number;
  presentVoltage: number;
  presentTemperature: number;
  ledState: boolean;
}

interface Props {
  servos: ServoData[];
  onRefresh: () => Promise<void>;                // ← debe devolver una promesa
  onEmergencyStop: () => void;
  onTorqueEnableChange: (id: number, enable: boolean) => void;
  onTorqueLimitChange: (id: number, limit: number) => void;
}

export const DynamixelDashboard: React.FC<Props> = ({
  servos,
  onRefresh,
  onEmergencyStop,
  onTorqueEnableChange,
  onTorqueLimitChange,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* Llama a onRefresh y muestra un spinner 1 s */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1_000);
  };

  /* ---------- Helpers ---------- */
  const getChainStatus = () => {
    const moving     = servos.filter(s => s.moving).length;
    const unhealthy  = servos.filter(s =>
          s.presentTemperature > 70 ||
          s.presentVoltage     < 10 ||
          s.presentLoad        > 80
    ).length;

    if (unhealthy) return { color: "destructive" as const, text: `${unhealthy} DAÑADO` };
    if (moving)    return { color: "secondary"   as const, text: `${moving} MOVIENDOSE` };
    return           { color: "default"      as const, text: "TODO LISTO" };
  };

  const chainStatus = getChainStatus();

  /* ---------- Render ---------- */
  return (
    <div className="space-y-6">
      {/* ---------- RESUMEN DE CADENA ---------- */}
      <Card className="bg-card/20 border border-border/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent text-2xl font-bold">
              DYNAMIXEL: Monitor de Cadena
            </CardTitle>

            <div className="flex items-center gap-4">
              <Badge variant={chainStatus.color} className="text-sm">
                {chainStatus.text}
              </Badge>

              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="bg-card/40 hover:bg-card/60"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </Button>

                <Button
                  onClick={onEmergencyStop}
                  variant="destructive"
                  size="sm"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Detener
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            {/* Total servos */}
            <MetricCard value={servos.length} label="Total Servos" color="text-foreground" />

            {/* Torque ON */}
            <MetricCard
              value={servos.filter(s => s.torqueEnable).length}
              label="Torque Activado"
              color="text-green-500"
            />

            {/* Moviéndose */}
            <MetricCard
              value={servos.filter(s => s.moving).length}
              label="Moviéndose"
              color="text-yellow-400"
            />

            {/* Voltaje promedio */}
            <MetricCard
              value={`${(servos.reduce((sum, s) => sum + s.presentVoltage, 0) / servos.length).toFixed(1)} V`}
              label="Voltaje Promedio"
              color="text-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------- MONITOR INDIVIDUAL ---------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {servos.map((servo) => (
          <ServoMonitor
            key={servo.id}
            servoData={servo}
            onTorqueEnableChange={onTorqueEnableChange}
            onTorqueLimitChange={onTorqueLimitChange}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------- Pequeño sub-componente métrico ---------- */
const MetricCard: React.FC<{value: React.ReactNode; label: string; color: string}> = ({ value, label, color }) => (
  <div className="rounded-lg bg-card/100 p-3">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);
