
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Thermometer, Battery, Zap } from 'lucide-react';

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
  const getStatusColor = () => {
    if (status.emergency) return 'destructive';
    if (!status.connected) return 'secondary';
    if (status.moving) return 'default';
    return 'default';
  };

  const getStatusText = () => {
    if (status.emergency) return 'EMERGENCY';
    if (!status.connected) return 'DISCONNECTED';
    if (status.moving) return 'MOVING';
    return 'READY';
  };

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Activity className="w-5 h-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span className="text-slate-300 text-sm font-medium">Status</span>
          <Badge variant={getStatusColor()} className="font-semibold">
            {getStatusText()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-slate-300 text-sm">Temperature</span>
            </div>
            <span className={`font-mono font-bold ${
              status.temperature > 60 ? 'text-red-400' : 
              status.temperature > 45 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {status.temperature}°C
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-400" />
              <span className="text-slate-300 text-sm">Power</span>
            </div>
            <span className={`font-mono font-bold ${
              status.power < 20 ? 'text-red-400' : 
              status.power < 40 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {status.power}%
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm">Connection</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              status.connected ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'
            } shadow-lg`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
