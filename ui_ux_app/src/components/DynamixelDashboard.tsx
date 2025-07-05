
import React, { useState } from 'react';
import { ServoMonitor } from './ServoMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Power, AlertTriangle } from 'lucide-react';

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
  servos: ServoData[];
  onRefresh: () => void;
  onEmergencyStop: () => void;
  onTorqueEnableChange: (servoId: number, enabled: boolean) => void;
  onTorqueLimitChange: (servoId: number, limit: number) => void;
}

export const DynamixelDashboard = ({ 
  servos, 
  onRefresh, 
  onEmergencyStop,
  onTorqueEnableChange, 
  onTorqueLimitChange 
}: Props) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getChainStatus = () => {
    const movingCount = servos.filter(servo => servo.moving).length;
    const unhealthyCount = servos.filter(servo => 
      servo.presentTemperature > 70 || servo.presentVoltage < 10 || servo.presentLoad > 80
    ).length;

    if (unhealthyCount > 0) return { color: 'destructive', text: `${unhealthyCount} UNHEALTHY` };
    if (movingCount > 0) return { color: 'secondary', text: `${movingCount} MOVING` };
    return { color: 'default', text: 'ALL READY' };
  };

  const chainStatus = getChainStatus();

  return (
    <div className="space-y-6">
      {/* Chain Overview */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              DYNAMIXEL Chain Monitor
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant={chainStatus.color as any} className="text-sm font-semibold">
                {chainStatus.text}
              </Badge>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  onClick={onEmergencyStop}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  E-Stop
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white">{servos.length}</div>
              <div className="text-xs text-slate-400">Total Servos</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {servos.filter(s => s.torqueEnable).length}
              </div>
              <div className="text-xs text-slate-400">Torque Enabled</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {servos.filter(s => s.moving).length}
              </div>
              <div className="text-xs text-slate-400">Moving</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {(servos.reduce((sum, s) => sum + s.presentVoltage, 0) / servos.length).toFixed(1)}V
              </div>
              <div className="text-xs text-slate-400">Avg Voltage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Servo Monitors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
