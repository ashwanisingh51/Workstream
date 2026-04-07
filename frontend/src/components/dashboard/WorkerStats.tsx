// frontend/src/components/dashboard/WorkerStats.tsx
import React, { useState, useEffect, useRef } from 'react';
import { apiService, WorkerStatus, WorkerDetail } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cpu, Server, Activity, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkerStatsProps {
  isConnected: boolean;
}

const WorkerStats: React.FC<WorkerStatsProps> = ({ isConnected }) => {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const initialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // Reset initial load state when re-mounting
    initialLoadRef.current = true;
  }, []);

  useEffect(() => {
    const fetchWorkerStats = async () => {
      if (!isConnected) {
        if (initialLoadRef.current) {
          setLoading(false);
        }
        return;
      }

      try {
        if (initialLoadRef.current) {
          setLoading(true);
        } else {
          setIsUpdating(true);
        }
        setError(null);

        const response = await apiService.getWorkerStatus();
        setWorkerStatus(response);

        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        }
      } catch (err) {
        console.error('Failed to fetch worker stats:', err);
        setError('Failed to load worker statistics');
        setWorkerStatus(null);
      } finally {
        setLoading(false);
        setIsUpdating(false);
      }
    };

    fetchWorkerStats();

    // Refresh worker stats every 30 seconds if connected
    const interval = isConnected ? setInterval(fetchWorkerStats, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-success bg-success/10 border-success/20';
      case 'stale':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'no_heartbeat':
      case 'error':
      case 'unhealthy':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const formatLastHeartbeat = (worker: WorkerDetail) => {
    const heartbeat = worker.last_heartbeat || worker.timestamp;
    if (!heartbeat) return 'Never';
    try {
      const timestamp = isNaN(Number(heartbeat)) ? heartbeat : Number(heartbeat) * 1000;
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'closed':
        return 'text-success bg-success/10 border-success/20';
      case 'half-open':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'open':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-surface/30 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Cpu className="w-5 h-5" />
            Worker Nodes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Server className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">Connect to view worker metrics</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !workerStatus) {
    return (
      <Card className="bg-surface/30 backdrop-blur-md border-white/10 h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Activity className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading worker fleet...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-surface/30 backdrop-blur-md border-error/20 h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-error">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-surface/30 backdrop-blur-md border-white/10 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Cpu className="h-5 w-5 text-secondary" />
          Worker Fleet
        </CardTitle>
        {isUpdating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3 animate-spin" />
            Syncing...
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {/* Overall Status Summary */}
        {workerStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Workers', value: workerStatus.total_workers, color: 'text-primary' },
              { label: 'Healthy', value: workerStatus.healthy_workers, color: 'text-success' },
              { label: 'Stale', value: workerStatus.stale_workers, color: 'text-yellow-500' },
              { label: 'Status', value: workerStatus.overall_status, color: workerStatus.overall_status === 'healthy' ? 'text-success' : 'text-yellow-500', isBadge: true }
            ].map((stat, i) => (
              <div key={i} className="bg-surface/50 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${stat.color} ${stat.isBadge ? 'capitalize' : ''}`}>
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {workerStatus?.worker_details.map((worker: WorkerDetail) => {
              return (
                <motion.div
                  key={worker.worker_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group relative overflow-hidden rounded-lg bg-surface/40 border border-white/5 p-4 hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${worker.status === 'healthy' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          {worker.worker_name || worker.worker_id}
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(worker.status)}`}>
                            {worker.status}
                          </span>
                        </h4>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Activity className="w-3 h-3" />
                          Last seen: {formatLastHeartbeat(worker)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getCircuitBreakerColor(worker.circuit_breaker.state)}`}>
                          CB: {worker.circuit_breaker.state.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-bold text-success text-lg">{worker.circuit_breaker.success_count}</div>
                          <div className="text-muted-foreground">Pass</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-error text-lg">{worker.circuit_breaker.fail_count}</div>
                          <div className="text-muted-foreground">Fail</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {worker.error && (
                    <div className="mt-4 p-2 bg-error/10 border border-error/20 rounded text-xs text-error font-mono flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      {worker.error}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(!workerStatus || workerStatus.worker_details.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active workers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkerStats;

