
import React, { useState } from 'react';
import { RobotArmVisualization } from '@/components/RobotArmVisualization';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusDashboard } from '@/components/StatusDashboard';
import { CommandHistory } from '@/components/CommandHistory';
import { EmergencyControls } from '@/components/EmergencyControls';
import { DynamixelDashboard } from '@/components/DynamixelDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [armPosition, setArmPosition] = useState({
    base: 0,
    shoulder: 45,
    elbow: -30,
    gripper: 0,
  });

  const [armStatus, setArmStatus] = useState({
    connected: true,
    moving: false,
    temperature: 42,
    power: 85,
    emergency: false
  });

  const [commands, setCommands] = useState<Array<{
    id: number;
    timestamp: string;
    command: string;
    status: 'completed' | 'failed' | 'emergency' | 'pending';
  }>>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), command: 'Initialize arm', status: 'completed' },
    { id: 2, timestamp: new Date().toLocaleTimeString(), command: 'Move to home position', status: 'completed' },
  ]);

  // Add DYNAMIXEL servo data
  const [servos, setServos] = useState([
    {
      id: 1,
      name: 'Base',
      presentPosition: armPosition.base,
      goalPosition: armPosition.base,
      moving: armStatus.moving,
      presentSpeed: armStatus.moving ? 15 : 0,
      presentLoad: 25,
      torqueEnable: !armStatus.emergency,
      torqueLimit: 100,
      presentVoltage: 11.8,
      presentTemperature: 42,
      ledState: true
    },
    {
      id: 2,
      name: 'Shoulder',
      presentPosition: armPosition.shoulder,
      goalPosition: armPosition.shoulder,
      moving: armStatus.moving,
      presentSpeed: armStatus.moving ? -8 : 0,
      presentLoad: 45,
      torqueEnable: !armStatus.emergency,
      torqueLimit: 80,
      presentVoltage: 11.7,
      presentTemperature: 38,
      ledState: true
    },
    {
      id: 3,
      name: 'Elbow',
      presentPosition: armPosition.elbow,
      goalPosition: armPosition.elbow,
      moving: armStatus.moving,
      presentSpeed: armStatus.moving ? 12 : 0,
      presentLoad: 30,
      torqueEnable: !armStatus.emergency,
      torqueLimit: 90,
      presentVoltage: 11.9,
      presentTemperature: 35,
      ledState: true
    },
    {
      id: 4,
      name: 'Gripper',
      presentPosition: armPosition.gripper,
      goalPosition: armPosition.gripper,
      moving: armStatus.moving,
      presentSpeed: armStatus.moving ? 5 : 0,
      presentLoad: 15,
      torqueEnable: !armStatus.emergency,
      torqueLimit: 60,
      presentVoltage: 12.0,
      presentTemperature: 32,
      ledState: true
    }
  ]);

  const handlePositionChange = (joint: string, value: number) => {
    setArmPosition(prev => ({
      ...prev,
      [joint]: value
    }));
    
    setArmStatus(prev => ({ ...prev, moving: true }));
    
    // Simulate command completion
    setTimeout(() => {
      setArmStatus(prev => ({ ...prev, moving: false }));
      setCommands(prev => [
        ...prev,
        {
          id: prev.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          command: `Move ${joint} to ${value}°`,
          status: 'completed' as const
        }
      ]);
    }, 1500);
  };

  const handleEmergencyStop = () => {
    setArmStatus(prev => ({ ...prev, emergency: true, moving: false }));
    setCommands(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: 'EMERGENCY STOP',
        status: 'emergency' as const
      }
    ]);
  };

  const handleReset = () => {
    setArmStatus(prev => ({ ...prev, emergency: false }));
    setCommands(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: 'System reset',
        status: 'completed' as const
      }
    ]);
  };

  const handleServoRefresh = async () => {
    // Simulate fetching fresh data from DYNAMIXEL servos
    console.log('Refreshing servo data...');
    // In real implementation, this would fetch from your backend/hardware
  };

  const handleServoTorqueEnable = (servoId: number, enabled: boolean) => {
    setServos(prev => prev.map(servo => 
      servo.id === servoId ? { ...servo, torqueEnable: enabled } : servo
    ));
    
    setCommands(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: `Servo ${servoId}: Torque ${enabled ? 'Enabled' : 'Disabled'}`,
        status: 'completed' as const
      }
    ]);
  };

  const handleServoTorqueLimit = (servoId: number, limit: number) => {
    setServos(prev => prev.map(servo => 
      servo.id === servoId ? { ...servo, torqueLimit: limit } : servo
    ));
    
    setCommands(prev => [
      ...prev,
      {
        id: prev.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        command: `Servo ${servoId}: Torque Limit ${limit}%`,
        status: 'completed' as const
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 light:from-slate-50 light:via-slate-100 light:to-indigo-100 light:text-slate-900">
      {/* Modern Header with Glass Effect */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                RoboArm Pro
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-light">4-DOF Industrial Automation Control</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${
                  armStatus.emergency ? 'bg-red-400 animate-pulse' : 
                  armStatus.moving ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                }`} />
                <span className="text-sm font-medium">
                  {armStatus.emergency ? 'EMERGENCY' : armStatus.moving ? 'ACTIVE' : 'READY'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="control" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="control" className="data-[state=active]:bg-white/20">
              Arm Control
            </TabsTrigger>
            <TabsTrigger value="servos" className="data-[state=active]:bg-white/20">
              DYNAMIXEL Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-0">
            <div className="space-y-8">
              {/* Top Row - 3D Visualization and Joint Control */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 3D Visualization */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      3D Visualization
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                      Live Feed
                    </div>
                  </div>
                  <div className="h-[28rem] rounded-xl overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-800/50 border border-white/5">
                    <RobotArmVisualization position={armPosition} status={armStatus} />
                  </div>
                </div>

                {/* Joint Control */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                    Joint Control
                  </h2>
                  <ControlPanel 
                    position={armPosition} 
                    onPositionChange={handlePositionChange}
                    disabled={armStatus.emergency}
                  />
                </div>
              </div>

              {/* Bottom Row - Emergency Controls, Status, and Command History */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EmergencyControls 
                  onEmergencyStop={handleEmergencyStop}
                  onReset={handleReset}
                  emergency={armStatus.emergency}
                />

                <StatusDashboard status={armStatus} />

                <CommandHistory commands={commands} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="servos" className="space-y-0">
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
