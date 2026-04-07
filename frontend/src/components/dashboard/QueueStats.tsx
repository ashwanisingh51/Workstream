// frontend/src/components/dashboard/QueueStats.tsx
import React from 'react';
import { QueueStatus } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers, RotateCcw, Calendar, AlertOctagon } from 'lucide-react';

interface QueueStatsProps {
  queueStatus: QueueStatus | null;
  isConnected: boolean;
}

const QueueStats: React.FC<QueueStatsProps> = ({ queueStatus }) => {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const StatItem = ({ label, value, icon: Icon, colorClass, subtext }: any) => (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-surface/50 border border-white/5 backdrop-blur-sm group hover:border-${colorClass} transition-colors duration-300`}>
      {/* Glow Effect */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 bg-${colorClass}/20 blur-xl rounded-full group-hover:bg-${colorClass}/30 transition-all`} />

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 text-${colorClass}`} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full bg-surface/30 backdrop-blur-md border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Queue Depth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            label="Primary"
            value={queueStatus ? formatNumber(queueStatus.queues.primary) : '-'}
            icon={Layers}
            colorClass="primary"
          />
          <StatItem
            label="Retry"
            value={queueStatus ? formatNumber(queueStatus.queues.retry) : '-'}
            icon={RotateCcw}
            colorClass="yellow-500"
            subtext={queueStatus ? `Ratio: ${(queueStatus.retry_ratio * 100).toFixed(1)}%` : null}
          />
          <StatItem
            label="Scheduled"
            value={queueStatus ? formatNumber(queueStatus.queues.scheduled) : '-'}
            icon={Calendar}
            colorClass="purple-500"
          />
          <StatItem
            label="DLQ"
            value={queueStatus ? formatNumber(queueStatus.queues.dlq) : '-'}
            icon={AlertOctagon}
            colorClass="red-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QueueStats;
