import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Zap,
  Thermometer,
  Target,
  Gauge,
  Battery,
  AlertCircle,
} from "lucide-react";

interface ServoData {
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
  servoData: ServoData;
  onTorqueEnableChange: (id: number, enabled: boolean) => void;
  onTorqueLimitChange: (id: number, limit: number) => void;
}

export const ServoMonitor = ({
  servoData,
  onTorqueEnableChange,
  onTorqueLimitChange,
}: Props) => {
  /* status helpers */
  const healthStatus = (() => {
    if (servoData.presentTemperature > 70)
      return { color: "destructive", text: "CALIENTE" };
    if (servoData.presentVoltage < 10)
      return { color: "destructive", text: "VOLTAJE BAJO" };
    if (servoData.presentLoad > 80)
      return { color: "secondary", text: "CARGA ALTA" };
    return { color: "default", text: "BUEN ESTADO" };
  })();

  const positionError = Math.abs(
    servoData.presentPosition - servoData.goalPosition,
  );

  return (
    <Card className="border border-border/20 bg-card/100 backdrop-blur-sm transition-all hover:bg-card/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-cyan-400">
            <span
              className={`h-3 w-3 rounded-full shadow-lg ${
                servoData.ledState
                  ? "bg-green-400 animate-pulse shadow-green-400/40"
                  : "bg-muted"
              }`}
            />
            Servo {servoData.id} – {servoData.name}
          </CardTitle>
          <Badge variant={healthStatus.color as any} className="text-xs">
            {healthStatus.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── POSITION ─────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-500">
            <Target className="h-4 w-4" />
            Posición y Movimiento
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Present */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Posición&nbsp;Actual
              </Label>
              <div className="font-mono text-2xl font-bold text-foreground">
                {servoData.presentPosition}°
              </div>
              <Progress
                value={(Math.abs(servoData.presentPosition) / 360) * 100}
                className="h-2 bg-border/30"
              />
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Posición&nbsp;Final
              </Label>
              <div className="font-mono text-2xl font-bold text-secondary-foreground">
                {servoData.goalPosition}°
              </div>
              <div className="text-xs text-muted-foreground">
                Error: {positionError.toFixed(1)}°
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-card/30 p-3">
            <span className="text-sm text-secondary-foreground">
              Estado de&nbsp;Movimiento
            </span>
            <Badge
              variant={servoData.moving ? "secondary" : "default"}
              className="text-xs"
            >
              {servoData.moving ? "MOVIENDOSE" : "DETENIDO"}
            </Badge>
          </div>
        </section>

        {/* ── PERFORMANCE ──────────────────────────── */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-500">
            <Gauge className="h-4 w-4" />
            Rendimiento
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Speed */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Velocidad Angular&nbsp;Actual
              </Label>
              <div className="font-mono text-xl font-bold text-foreground">
                {servoData.presentSpeed > 0 ? "+" : ""}
                {servoData.presentSpeed} RPM
              </div>
              <div className="text-xs text-muted-foreground">
                {servoData.presentSpeed > 0
                  ? "CW"
                  : servoData.presentSpeed < 0
                  ? "CCW"
                  : "Detenido"}
              </div>
            </div>

            {/* Load */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Carga&nbsp;Actual
              </Label>
              <div className="font-mono text-xl font-bold text-foreground">
                {servoData.presentLoad}%
              </div>
              <Progress
                value={servoData.presentLoad}
                className="h-2 bg-border/30"
              />
            </div>
          </div>

          {/* Torque */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-secondary-foreground">
                Habilitar&nbsp;Torque
              </Label>
              <Switch
                checked={servoData.torqueEnable}
                onCheckedChange={(v) =>
                  onTorqueEnableChange(servoData.id, v)
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-secondary-foreground">
                  Límite de&nbsp;Torque
                </Label>
                <span className="font-mono text-sm text-foreground">
                  {servoData.torqueLimit}%
                </span>
              </div>
              <Slider
                value={[servoData.torqueLimit]}
                onValueChange={([v]) =>
                  onTorqueLimitChange(servoData.id, v)
                }
                max={100}
                step={1}
                disabled={!servoData.torqueEnable}
              />
            </div>
          </div>
        </section>

        {/* ── HEALTH ──────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-green-500">
            <Activity className="h-4 w-4" />
            Salud
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Voltage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-blue-500" />
                <Label className="text-xs text-muted-foreground">Voltaje</Label>
              </div>
              <div className="font-mono text-xl font-bold text-foreground">
                {servoData.presentVoltage.toFixed(1)}V
              </div>
              <Progress
                value={(servoData.presentVoltage / 12) * 100}
                className="h-2 bg-border/30"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <Label className="text-xs text-muted-foreground">
                  Temperatura
                </Label>
              </div>
              <div className="font-mono text-xl font-bold text-foreground">
                {servoData.presentTemperature}°C
              </div>
              <Progress
                value={(servoData.presentTemperature / 100) * 100}
                className="h-2 bg-border/30"
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};
