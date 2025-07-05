
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Square, RotateCcw } from 'lucide-react';

interface Props {
  onEmergencyStop: () => void;
  onReset: () => void;
  emergency: boolean;
}

export const EmergencyControls = ({ onEmergencyStop, onReset, emergency }: Props) => {
  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Emergency Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button
          onClick={onEmergencyStop}
          disabled={emergency}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 text-lg shadow-lg hover:shadow-red-500/25 transition-all duration-300"
          size="lg"
        >
          <Square className="w-5 h-5 mr-2" />
          EMERGENCY STOP
        </Button>

        {emergency && (
          <Button
            onClick={onReset}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-3 shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset System
          </Button>
        )}

        <div className="text-xs text-center p-3 bg-white/5 rounded-lg">
          {emergency ? (
            <span className="text-red-400 font-semibold flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              SYSTEM IN EMERGENCY STATE
            </span>
          ) : (
            <span className="text-slate-400">
              Emergency stop will immediately halt all arm movement
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
