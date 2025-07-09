import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

/* ---------- Tipado ---------- */
export interface ArmPosition {
  base: number;
  hombro: number;
  codo: number;
  gripper: number;
}

interface Props {
  position: ArmPosition;
  onPositionChange: (joint: keyof ArmPosition, value: number) => void;
  disabled?: boolean;
}

/* ---------- Config de juntas (0-300°) ---------- */
const jointConfigs = [
  { key: "base",    label: "Base",    icon: "🔄", color: "from-blue-400 to-cyan-700" },
  { key: "hombro",  label: "Hombro",  icon: "💪", color: "from-purple-500 to-pink-500" },
  { key: "codo",    label: "Codo",    icon: "🦾", color: "from-green-500 to-emerald-700" },
  { key: "gripper", label: "Gripper", icon: "🤏", color: "from-red-700 to-orange-500" },
] as const;

const MIN_ANGLE = 0;
const MAX_ANGLE = 300;

/* ---------- Componente ---------- */
export const ControlPanel: React.FC<Props> = ({
  position,
  onPositionChange,
  disabled = false,
}) => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    {jointConfigs.map(({ key, label, icon, color }, idx) => (
      <Card
        key={key}
        className="
          p-6 bg-card/100 hover:bg-card/30
          border border-border/20 backdrop-blur-sm
          transition-all duration-300 group
        "
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-3 text-secondary-foreground group-hover:text-foreground transition-colors">
              <span className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg select-none`}>
                {icon}
              </span>
              <span>
                <div className="text-lg font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground">GDL {idx + 1}</div>
              </span>
            </Label>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono text-xl font-bold text-foreground">
                  {position[key]}°
                </div>
                <div className="text-xs text-muted-foreground">Actual</div>
              </div>
              <span
                className={`
                  h-3 w-3 rounded-full shadow-lg
                  ${disabled
                    ? "bg-red-500 shadow-red-500/50"
                    : "bg-green-400 shadow-green-400/50 animate-pulse"}
                `}
              />
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <Slider
              value={[position[key]]}
              onValueChange={([v]) => onPositionChange(key, v)}
              min={MIN_ANGLE}
              max={MAX_ANGLE}
              step={1}
              disabled={disabled}
              className="
                w-full
                [&_[role=slider]]:bg-foreground
                [&_[role=slider]]:border-2
                [&_[role=slider]]:border-border/40
                [&_[role=slider]]:shadow-lg
              "
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="rounded bg-card/30 px-2 py-1">{MIN_ANGLE}°</span>
              <span className="rounded bg-card/30 px-2 py-1">{MAX_ANGLE}°</span>
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);
