
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ArmPosition {
  base: number;
  shoulder: number;
  elbow: number;
  gripper: number;
}

interface Props {
  position: ArmPosition;
  onPositionChange: (joint: string, value: number) => void;
  disabled: boolean;
}

const jointConfigs = [
  { key: 'base', label: 'Base Rotation', min: -180, max: 180, icon: '🔄', color: 'from-blue-500 to-cyan-500' },
  { key: 'shoulder', label: 'Shoulder', min: -90, max: 90, icon: '💪', color: 'from-purple-500 to-pink-500' },
  { key: 'elbow', label: 'Elbow', min: -135, max: 135, icon: '🦾', color: 'from-green-500 to-emerald-500' },
  { key: 'gripper', label: 'Gripper', min: -180, max: 180, icon: '🤏', color: 'from-orange-500 to-red-500' },
];

export const ControlPanel = ({ position, onPositionChange, disabled }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {jointConfigs.map((joint) => (
        <Card key={joint.key} className="p-6 bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 group">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-3 text-slate-200 group-hover:text-white transition-colors">
                <div className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${joint.color} shadow-lg`}>
                  {joint.icon}
                </div>
                <div>
                  <div className="font-semibold text-lg">{joint.label}</div>
                  <div className="text-xs text-slate-400">DOF {jointConfigs.indexOf(joint) + 1}</div>
                </div>
              </Label>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-bold text-white font-mono">
                    {position[joint.key as keyof ArmPosition]}°
                  </div>
                  <div className="text-xs text-slate-400">Current</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  disabled ? 'bg-red-500 shadow-red-500/50' : 'bg-green-400 shadow-green-400/50'
                } shadow-lg ${disabled ? '' : 'animate-pulse'}`} />
              </div>
            </div>
            
            <div className="space-y-3">
              <Slider
                value={[position[joint.key as keyof ArmPosition]]}
                onValueChange={([value]) => onPositionChange(joint.key, value)}
                min={joint.min}
                max={joint.max}
                step={1}
                disabled={disabled}
                className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-white/20 [&_[role=slider]]:shadow-lg"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span className="px-2 py-1 bg-white/5 rounded">{joint.min}°</span>
                <span className="px-2 py-1 bg-white/5 rounded">{joint.max}°</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
