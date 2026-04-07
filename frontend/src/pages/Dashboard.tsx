// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { QueueStatus, SSEMessage, OpenRouterStatus, apiService } from '../lib/api';
import TaskFlowGraph from '../components/dashboard/TaskFlowGraph';
import QueueStats from '../components/dashboard/QueueStats';
import WorkerStats from '../components/dashboard/WorkerStats';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [openRouterStatus, setOpenRouterStatus] = useState<OpenRouterStatus | null>(null);

  // Fetch OpenRouter status on component mount and periodically
  useEffect(() => {
    const fetchOpenRouterStatus = async () => {
      try {
        const status = await apiService.getOpenRouterStatus();
        setOpenRouterStatus(status);
      } catch (error) {
        console.error('Failed to fetch OpenRouter status:', error);
        setOpenRouterStatus({
          status: 'error',
          message: 'Status check failed'
        });
      }
    };

    // Initial fetch
    fetchOpenRouterStatus();

    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(fetchOpenRouterStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = apiService.createSSEConnection(
          (data: SSEMessage) => {
            setLastUpdate(new Date());

            switch (data.type) {
              case 'initial_status':
              case 'queue_update':
                if (data.queue_depths && data.state_counts && data.retry_ratio !== undefined) {
                  setQueueStatus({
                    queues: data.queue_depths,
                    states: data.state_counts,
                    retry_ratio: data.retry_ratio
                  });
                }
                setIsConnected(true);
                break;

              case 'heartbeat':
                setLastUpdate(new Date());
                setIsConnected(true);
                break;

              case 'error':
                console.error('SSE Error:', data.message);
                break;

              case 'fatal_error':
                console.error('SSE Fatal Error:', data.message);
                setIsConnected(false);
                break;
            }
          },
          (error) => {
            console.error('SSE Connection Error:', error);
            setIsConnected(false);

            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
              if (eventSource?.readyState === EventSource.CLOSED) {
                connectSSE();
              }
            }, 5000);
          }
        );

        // Handle connection open
        eventSource.onopen = () => {
          setIsConnected(true);
        };

      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
        setIsConnected(false);
      }
    };

    // Initial connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const getConnectionStatus = () => {
    if (isConnected) return { text: 'Connected', color: 'text-success', icon: Wifi };
    if (lastUpdate) return { text: 'Reconnecting...', color: 'text-yellow-500', icon: Activity };
    return { text: 'Disconnected', color: 'text-error', icon: WifiOff };
  };

  const getOpenRouterStatus = () => {
    if (!openRouterStatus) {
      return { text: 'Loading...', color: 'text-muted-foreground', icon: Activity, details: null };
    }

    let details = null;
    if (openRouterStatus.circuit_breaker_open) {
      details = `Circuit breaker open (${openRouterStatus.consecutive_failures || 0} failures)`;
    } else if (openRouterStatus.consecutive_failures && openRouterStatus.consecutive_failures > 0) {
      details = `${openRouterStatus.consecutive_failures} consecutive failures`;
    }

    switch (openRouterStatus.status) {
      case 'active':
        return { text: 'Service Active', color: 'text-success', icon: CheckCircle2, details };
      case 'rate_limited':
      case 'credits_exhausted':
        return { text: 'Service Limited', color: 'text-yellow-500', icon: AlertTriangle, details };
      default:
        return { text: 'Service Issue', color: 'text-error', icon: AlertTriangle, details };
    }
  };

  const connectionStatus = getConnectionStatus();
  const openRouterStatusBadge = getOpenRouterStatus();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with compact status pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>

          <div className="flex items-center gap-3">
            {/* Connection Status Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface border border-border/50">
              <connectionStatus.icon className={`w-4 h-4 ${connectionStatus.color} animate-pulse`} />
              <span className="text-sm font-medium text-foreground/80">
                {connectionStatus.text}
              </span>
            </div>

            {/* OpenRouter Status Pill */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-surface border border-border/50">
              <openRouterStatusBadge.icon className={`w-4 h-4 ${openRouterStatusBadge.color}`} />
              <span className="text-sm font-medium text-foreground/80">
                OpenRouter: {openRouterStatusBadge.text}
              </span>
              {openRouterStatusBadge.details && (
                <span className="text-xs text-muted-foreground ml-1 border-l border-border pl-2">
                  {openRouterStatusBadge.details}
                </span>
              )}
            </div>
          </div>
        </div>

        {lastUpdate && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last updated</p>
            <p className="text-sm font-mono text-primary/80">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3"
        >
          <WifiOff className="h-5 w-5 text-red-500" />
          <div>
            <h3 className="text-sm font-medium text-red-500">Connection Lost</h3>
            <p className="text-xs text-red-400/80">Real-time updates are currently unavailable. Auto-reconnecting...</p>
          </div>
        </motion.div>
      )}

      {/* Grid Layout for Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Flow Graph - Takes 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <TaskFlowGraph queueStatus={queueStatus} />
        </motion.div>

        {/* Queue Stats - Takes 1 col */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <QueueStats queueStatus={queueStatus} isConnected={isConnected} />
        </motion.div>
      </div>

      {/* Worker Stats */}
      <motion.div variants={itemVariants}>
        <WorkerStats isConnected={isConnected} />
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;

