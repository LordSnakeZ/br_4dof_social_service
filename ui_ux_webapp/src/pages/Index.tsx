import React, { useState } from "react";

import { RobotArmVisualization } from "@/components/RobotArmVisualization";
import { ControlPanel } from "@/components/ControlPanel";
import { StatusDashboard } from "@/components/StatusDashboard";
import { CommandHistory } from "@/components/CommandHistory";
import { EmergencyControls } from "@/components/EmergencyControls";
import { DynamixelDashboard } from "@/components/DynamixelDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Index = () => {
  /* ─────────────── STATE ─────────────── */
  const [armPosition, setArmPosition] = useState({
    base: 0,
    hombro: 45,
    codo: -30,
    gripper: 0,
  });

  const [armStatus, setArmStatus] = useState({
    connected: true,
    moving: false,
    temperature: 42,
    power: 85,
    emergency: false,
  });

  const [commands, setCommands] = useState<
    Array<{
      id: number;
      timestamp: string;
      command: string;
      status: "completado" | "fallido" | "emergencia" | "pendiente";
    }>
  >([
    {
      id: 1,
      timestamp: new Date().toLocaleTimeString(),
      command: "Brazo inicializado",
      status: "completado",
    },
    {
      id: 2,
      timestamp: new Date().toLocaleTimeString(),
      command: "Mover hacia posición inicial",
      status: "completado",
    },
  ]);

 /* --------------- ✔ AQUÍ restauramos el arreglo --------------- */
  const [servos, setServos] = useState([
    {
      id: 1,
      name: "AX-18A",
      presentPosition: 0,
      goalPosition: 0,
      moving: false,
      presentSpeed: 0,
      presentLoad: 25,
      torqueEnable: true,
      torqueLimit: 100,
      presentVoltage: 11.8,
      presentTemperature: 42,
      ledState: true,
    },
    {
      id: 2,
      name: "AX-12A",
      presentPosition: 45,
      goalPosition: 45,
      moving: false,
      presentSpeed: 0,
      presentLoad: 45,
      torqueEnable: true,
      torqueLimit: 80,
      presentVoltage: 11.7,
      presentTemperature: 38,
      ledState: true,
    },
    {
      id: 3,
      name: "AX-12A",
      presentPosition: -30,
      goalPosition: -30,
      moving: false,
      presentSpeed: 0,
      presentLoad: 30,
      torqueEnable: true,
      torqueLimit: 90,
      presentVoltage: 11.9,
      presentTemperature: 35,
      ledState: true,
    },
    {
      id: 4,
      name: "AX12-W",
      presentPosition: 0,
      goalPosition: 0,
      moving: false,
      presentSpeed: 0,
      presentLoad: 15,
      torqueEnable: true,
      torqueLimit: 60,
      presentVoltage: 12.0,
      presentTemperature: 32,
      ledState: true,
    },
  ]);

  /* ─────────────── HANDLERS ─────────────── */
  const handlePositionChange = (joint: string, value: number) => {
    setArmPosition((prev) => ({ ...prev, [joint]: value }));
    setArmStatus((prev) => ({ ...prev, moving: true }));

    setTimeout(() => {
      setArmStatus((prev) => ({ ...prev, moving: false }));
      setCommands((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          command: `Mover ${joint} hacia ${value}°`,
          status: "completado",
        },
      ]);
    }, 1500);
  };

  const handleEmergencyStop = () => {
    setArmStatus((prev) => ({ ...prev, emergency: true, moving: false }));
    setCommands((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: "PARO DE EMERGENCIA",
        status: "emergencia",
      },
    ]);
  };

  const handleReset = () => {
    setArmStatus((prev) => ({ ...prev, emergency: false }));
    setCommands((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: "Reinicio de Sistema",
        status: "completado",
      },
    ]);
  };

  const handleServoRefresh = async () => {
    console.log("Actualizando información de servos…");
  };

  const handleServoTorqueEnable = (id: number, enabled: boolean) =>
    setServos((p) => p.map((s) => (s.id === id ? { ...s, torqueEnable: enabled } : s)));

  const handleServoTorqueLimit = (id: number, limit: number) =>
    setServos((p) => p.map((s) => (s.id === id ? { ...s, torqueLimit: limit } : s)));

  /* ─────────────── LAYOUT ─────────────── */
  return (
    <div
      className="
        min-h-screen text-foreground
        bg-gradient-to-br from-[hsl(210_12%_94%)] to-[hsl(210_12%_90%)]
        dark:bg-gradient-to-br dark:from-[hsl(220_5%_8%)]
        dark:to-[hsl(220_5%_3%)]
      "
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/20 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Control Automatico
              </h1>
              <p className="mt-1 text-sm font-light text-secondary-foreground">
                Brazo Robotico Dynamixel de 4-GDL 
              </p>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 rounded-full bg-card/30 px-4 py-2 backdrop-blur-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    armStatus.emergency
                      ? "bg-red-400 animate-pulse"
                      : armStatus.moving
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-green-400"
                  }`}
                />
                <span className="text-sm font-medium text-secondary-foreground">
                  {armStatus.emergency
                    ? "EMERGENCIA"
                    : armStatus.moving
                    ? "ACTIVO"
                    : "LISTO"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="control" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-sm">
            <TabsTrigger value="control" className="text-secondary-foreground data-[state=active]:bg-card/100">
              Controlador
            </TabsTrigger>
            <TabsTrigger value="servos" className="text-secondary-foreground data-[state=active]:bg-card/100">
              Monitor DYNAMIXEL
            </TabsTrigger>
          </TabsList>

          {/* CONTROL TAB */}
          <TabsContent value="control">
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* 3D VISUALIZATION */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 shadow-xl ring-1 ring-border/40 backdrop-blur-xl">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      Visualización 3D
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <div className="h-1 w-1 animate-pulse rounded-full bg-red-600" />
                      En Vivo
                    </div>
                  </div>
                  <div className="h-[28rem] overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[hsl(220_5%_6%)/.5] to-[hsl(220_5%_4%)/.5]">
                    <RobotArmVisualization position={armPosition} status={armStatus} />
                  </div>
                </div>

                {/* JOINT CONTROL */}
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 shadow-xl ring-1 ring-border/40 backdrop-blur-xl">
                  <h2 className="mb-6 text-2xl font-bold bg-gradient-to-r from-purple-500 to-yellow-900 bg-clip-text text-transparent">
                    Control de Juntas
                  </h2>
                  <ControlPanel position={armPosition} onPositionChange={handlePositionChange} disabled={armStatus.emergency} />
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <StatusDashboard status={armStatus} />
                <CommandHistory commands={commands} />
                <EmergencyControls onEmergencyStop={handleEmergencyStop} onReset={handleReset} emergency={armStatus.emergency} />
              </div>
            </div>
          </TabsContent>

          {/* SERVOS TAB */}
          <TabsContent value="servos">
            <DynamixelDashboard
              servos={servos}
              onRefresh={handleServoRefresh}
              onEmergencyStop={handleEmergencyStop}
              onTorqueEnableChange={handleServoTorqueEnable}
              onTorqueLimitChange={handleServoTorqueLimit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
