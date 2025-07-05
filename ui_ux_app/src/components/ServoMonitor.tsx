
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Activity, Zap, Thermometer, Target, Gauge, Battery } from 'lucide-react';

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
  onTorqueEnableChange: (servoId: number, enabled: boolean) => void;
  onTorqueLimitChange: (servoId: number, limit: number) => void;
}

export const ServoMonitor = ({ servoData, onTorqueEnableChange, onTorqueLimitChange }: Props) => {
  const getHealthStatus = () => {
    if (servoData.presentTemperature > 70) return { color: 'destructive', text: 'HOT' };
    if (servoData.presentVoltage < 10) return { color: 'destructive', text: 'LOW VOLTAGE' };
    if (servoData.presentLoad > 80) return { color: 'secondary', text: 'HIGH LOAD' };
    return { color: 'default', text: 'HEALTHY' };
  };

  const healthStatus = getHealthStatus();
  const positionError = Math.abs(servoData.presentPosition - servoData.goalPosition);

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/8 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-cyan-400">
            <div className={`w-3 h-3 rounded-full ${
              servoData.ledState ? 'bg-green-400 animate-pulse shadow-green-400/50' : 'bg-gray-600'
            } shadow-lg`} />
            <span>Servo {servoData.id} - {servoData.name}</span>
          </CardTitle>
          <Badge variant={healthStatus.color as any} className="text-xs font-semibold">
            {healthStatus.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Where is it and is it done moving? */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Position & Movement
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Present Position</Label>
              <div className="text-2xl font-bold text-white font-mono">
                {servoData.presentPosition}°
              </div>
              <Progress value={Math.abs(servoData.presentPosition) / 360 * 100} className="h-2 bg-white/10" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Goal Position</Label>
              <div className="text-2xl font-bold text-slate-300 font-mono">
                {servoData.goalPosition}°
              </div>
              <div className="text-xs text-slate-500">
                Error: {positionError.toFixed(1)}°
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-slate-300">Moving Status</span>
            <Badge variant={servoData.moving ? "secondary" : "default"} className="text-xs">
              {servoData.moving ? "MOVING" : "STOPPED"}
            </Badge>
          </div>
        </div>

        {/* How hard is it working? */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Performance
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Present Speed</Label>
              <div className="text-xl font-bold text-white font-mono">
                {servoData.presentSpeed > 0 ? '+' : ''}{servoData.presentSpeed} RPM
              </div>
              <div className="text-xs text-slate-500">
                {servoData.presentSpeed > 0 ? 'CW' : servoData.presentSpeed < 0 ? 'CCW' : 'Stopped'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Present Load</Label>
              <div className="text-xl font-bold text-white font-mono">
                {servoData.presentLoad}%
              </div>
              <Progress 
                value={Math.abs(servoData.presentLoad)} 
                className="h-2 bg-white/10"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Torque Enable</Label>
              <Switch
                checked={servoData.torqueEnable}
                onCheckedChange={(checked) => onTorqueEnableChange(servoData.id, checked)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-300">Torque Limit</Label>
                <span className="text-sm font-mono text-white">{servoData.torqueLimit}%</span>
              </div>
              <Slider
                value={[servoData.torqueLimit]}
                onValueChange={([value]) => onTorqueLimitChange(servoData.id, value)}
                max={100}
                step={1}
                className="w-full"
                disabled={!servoData.torqueEnable}
              />
            </div>
          </div>
        </div>

        {/* Is it healthy? */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Health
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-blue-400" />
                <Label className="text-xs text-slate-400">Voltage</Label>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {servoData.presentVoltage.toFixed(1)}V
              </div>
              <Progress 
                value={servoData.presentVoltage / 12 * 100} 
                className="h-2 bg-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <Label className="text-xs text-slate-400">Temperature</Label>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {servoData.presentTemperature}°C
              </div>
              <Progress 
                value={servoData.presentTemperature / 100 * 100} 
                className="h-2 bg-white/10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
