
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Command {
  id: number;
  timestamp: string;
  command: string;
  status: 'completed' | 'failed' | 'emergency' | 'pending';
}

interface Props {
  commands: Command[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-3 h-3 text-green-400" />;
    case 'failed':
      return <XCircle className="w-3 h-3 text-red-400" />;
    case 'emergency':
      return <AlertTriangle className="w-3 h-3 text-red-400" />;
    default:
      return <Clock className="w-3 h-3 text-yellow-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'emergency':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const CommandHistory = ({ commands }: Props) => {
  const sortedCommands = [...commands].reverse();

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Clock className="w-5 h-5" />
          Command History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-3">
            {sortedCommands.map((command) => (
              <div
                key={command.id}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(command.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm text-slate-200 truncate font-medium">
                      {command.command}
                    </p>
                    <Badge 
                      variant={getStatusColor(command.status) as any} 
                      className="text-xs flex-shrink-0 font-semibold"
                    >
                      {command.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{command.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
