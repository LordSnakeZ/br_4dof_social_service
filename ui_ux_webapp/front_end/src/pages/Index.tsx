import React, { useState, useEffect } from "react";

import { RobotArmVisualization } from "@/components/RobotArmVisualization";
import { ControlPanel } from "@/components/ControlPanel";
import { StatusDashboard } from "@/components/StatusDashboard";
import { CommandHistory } from "@/components/CommandHistory";
import { EmergencyControls } from "@/components/EmergencyControls";
import { DynamixelDashboard, ServoData } from "@/components/DynamixelDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";

import { api, InspectData } from "@/lib/api";
import { jointToServo } from "@/lib/utils";

/* ─────── Tipos ─────── */
type CommandStatus = "completado" | "fallido" | "emergencia" | "pendiente";
interface Command   { id:number; timestamp:string; command:string; status:CommandStatus; }
interface ArmPosition { base:number; hombro:number; codo:number; gripper:number; }

/* ─────── Constantes ─────── */
const PRESET_POS: ArmPosition = { base: 80, hombro: 64, codo: 64, gripper: 120 };
const SERVO_IDS  = [1, 2, 3, 4];

/* Mapa ID → Nombre visible */
const NAME_MAP: Record<number,string> = {
  1: "AX-18A",
  2: "AX-12A",
  3: "AX-12A",
  4: "AX-12W",
};

const Index: React.FC = () => {
  /* ── Estado global ── */
  const [armPosition, setArmPosition] = useState<ArmPosition>(PRESET_POS);
  const [armStatus,   setArmStatus]   = useState({ connected:true, moving:false, temperature:0, power:0, emergency:false });
  const [commands,    setCommands]    = useState<Command[]>([]);
  const [servos, setServos] = useState<ServoData[]>(() =>
    SERVO_IDS.map(id => ({
      id,
      name: NAME_MAP[id] ?? `Servo ${id}`,
      presentPosition: 0,
      goalPosition: 0,
      moving: false,
      presentSpeed: 0,
      presentLoad: 0,
      torqueEnable: true,
      torqueLimit: 100,
      presentVoltage: 0,
      presentTemperature: 0,
      ledState: true,
    }))
  );

  const log = (text:string, st:CommandStatus) =>
    setCommands(p => [
      ...p,
      { id:p.length+1, timestamp:new Date().toLocaleTimeString(), command:text, status:st },
    ]);

  /* ── Handlers de Juntas ── */
  const handlePositionChange = (joint:keyof ArmPosition, val:number) => {
    setArmPosition(p => ({ ...p, [joint]: val }));
    setArmStatus(s => ({ ...s, moving: true }));

    api.move(jointToServo[joint], val)
       .then(() => setArmStatus(s => ({ ...s, moving: false })))
       .catch(console.error);

    log(`Mover ${joint} a ${val}°`, "completado");
  };

  const handleEmergencyStop = () => {
    api.stop().catch(console.error);
    setArmStatus(s => ({ ...s, emergency: true, moving:false }));
    log("PARO DE EMERGENCIA", "emergencia");
  };

  const handleResume = () => {
    api.resume().catch(console.error);
    setArmStatus(s => ({ ...s, emergency: false }));
    log("Reanudar sistema", "completado");
  };

  const handlePreset = () => {
    api.reset().catch(console.error);
    setArmPosition(PRESET_POS);
    log("Preset 80-64-64-120", "completado");
  };

  /* ── Polling de servos ── */
  const refreshServos = async () => {
    try {
      const data: InspectData[] = await api.inspectAll(SERVO_IDS);
      setServos(prev => prev.map(s => {
        const d = data.find(x => x.servo_id === s.id);
        if (!d) return s;
        return {
          ...s,
          presentPosition: d.position_deg,
          moving: Math.abs(d.position_deg - s.goalPosition) > 2,
          presentSpeed: d.speed_rpm ?? 0,
          presentLoad: d.load ? parseFloat(d.load) : 0,
          torqueEnable: d.torque_enabled ?? s.torqueEnable,
          presentVoltage: d.voltage_v ?? 0,
          presentTemperature: d.temperature_c ?? 0,
        };
      }));
    } catch (err) { console.error("inspectAll", err); }
  };

  useEffect(() => {
    refreshServos();
    const id = setInterval(refreshServos, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Handlers torque / límite ── */
const handleTorqueEnableChange = (id: number, enable: boolean) => {
  /* 1. Optimista: actualiza UI al instante */
  setServos(p => p.map(s => (s.id === id ? { ...s, torqueEnable: enable } : s)));
  log(`Servo ${id}: torque ${enable ? "ON" : "OFF"}`, "pendiente");

  /* 2. Envía al backend */
  api.torque(id, enable)
     .then(() => log(`Servo ${id}: torque ${enable ? "ON" : "OFF"}`, "completado"))
     .catch(err => {
       console.error(err);
       /* revierte si falló */
       setServos(p => p.map(s => (s.id === id ? { ...s, torqueEnable: !enable } : s)));
       log(`Servo ${id}: torque fallido`, "fallido");
     });
};

  const handleTorqueLimitChange  = (id:number, lim:number) =>
    setServos(p => p.map(s => s.id===id ? { ...s, torqueLimit:lim } : s));

  /* ── UI ── */
  return (
    <div className="min-h-screen text-foreground bg-gradient-to-br from-[hsl(210_12%_94%)] to-[hsl(210_12%_90%)]
                    dark:from-[hsl(220_5%_8%)] dark:to-[hsl(220_5%_3%)]">

      {/* ───── HEADER ───── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/20 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Control Automático
              </h1>
              <p className="mt-1 text-sm font-light text-secondary-foreground">
                Brazo Robótico Dynamixel de 4 GDL
              </p>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 rounded-full bg-card/30 px-4 py-2 backdrop-blur-sm">
                <div className={`h-2 w-2 rounded-full ${
                  armStatus.emergency ? "bg-red-400 animate-pulse"
                  : armStatus.moving ? "bg-yellow-400 animate-pulse"
                  : "bg-green-400"
                }`} />
                <span className="text-sm font-medium text-secondary-foreground">
                  {armStatus.emergency ? "EMERGENCIA" : armStatus.moving ? "ACTIVO" : "LISTO"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ───── MAIN ───── */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="control" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-sm">
            <TabsTrigger value="control">Controlador</TabsTrigger>
            <TabsTrigger value="servos">Monitor DYNAMIXEL</TabsTrigger>
          </TabsList>

          {/* ─── CONTROL TAB ─── */}
          <TabsContent value="control">
            <div className="space-y-8">
              {/* fila superior */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                {/* Visualización 3-D */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 shadow-xl ring-1 ring-border/40 backdrop-blur-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      Visualización 3D
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <div className="h-1 w-1 animate-pulse rounded-full bg-red-600" />
                      En vivo
                    </div>
                  </div>

                  <div className="h-[28rem] overflow-hidden rounded-xl border border-white/5
                                  bg-gradient-to-b from-[hsl(220_5%_6%)/.5] to-[hsl(220_5%_4%)/.5]">
                    <RobotArmVisualization position={armPosition} status={armStatus} />
                  </div>
                </div>

                {/* Panel de juntas */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 shadow-xl ring-1 ring-border/40 backdrop-blur-xl">
                  <h2 className="mb-6 text-2xl font-bold bg-gradient-to-r from-purple-500 to-yellow-900 bg-clip-text text-transparent">
                    Control de Juntas
                  </h2>

                  <ControlPanel
                    position={armPosition}
                    onPositionChange={handlePositionChange}
                    disabled={armStatus.emergency}
                  />

                                 <div className="mt-6 flex flex-wrap gap-4">
                    {/* Preset verde */}
                  <Button
                    onClick={handlePreset}
                    size="lg"
                    className="
                      w-full
                      bg-gradient-to-r from-emerald-500 to-emerald-600
                      hover:from-emerald-600 hover:to-emerald-700
                      text-white font-bold py-4 text-lg
                      shadow-lg hover:shadow-emerald-500/25
                      transition-all
                    "
                  >
                    <Sparkle className="mr-2 h-5 w-5" />
                    Posición Inicial
                  </Button>
                  </div>
                </div>
              </div>

              {/* Dashboards */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <StatusDashboard status={armStatus} />
                <CommandHistory commands={commands} />
                <EmergencyControls
                  onEmergencyStop={handleEmergencyStop}
                  onReset={handleResume}
                  emergency={armStatus.emergency}
                />
              </div>
            </div>
          </TabsContent>

          {/* ─── SERVOS TAB ─── */}
          <TabsContent value="servos">
            <DynamixelDashboard
              servos={servos}
              onRefresh={refreshServos}
              onEmergencyStop={handleEmergencyStop}
              onTorqueEnableChange={handleTorqueEnableChange}
              onTorqueLimitChange={handleTorqueLimitChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
