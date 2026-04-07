// frontend/src/components/dashboard/CustomNodes.tsx
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Layers, Clock, AlertOctagon } from 'lucide-react';

// Define a more specific type for the node data
interface StatusNodeData {
  count: number;
  label: string;
}

// Define the props for a handle
interface HandleProps {
  type: 'source' | 'target';
  position: Position;
  id: string;
  style?: React.CSSProperties;
}

// Props for the generic StatusNode component
interface StatusNodeProps {
  data: StatusNodeData;
  handles: HandleProps[];
  className?: string;
  icon?: React.ElementType;
  colorClass?: string; // e.g. "green", "blue", "red" for dynamic glows
}

// Generic Status Node component with Neon/Dark Theme
const StatusNode: React.FC<StatusNodeProps> = ({ data, handles, className, icon: Icon, colorClass = "blue" }) => {
  return (
    <div className={cn(
      "relative rounded-xl p-4 w-[180px] min-h-[90px] flex flex-col justify-between",
      "bg-black/40 backdrop-blur-xl border border-white/10",
      "shadow-[0_0_15px_rgba(0,0,0,0.5)]",
      "transition-all duration-300 group hover:scale-105",
      className
    )}>
      {/* Animated Glow Gradient Background */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-10 group-hover:opacity-20 transition-opacity",
        `bg-${colorClass}-500/50`
      )} />

      {handles.map((handle) => (
        <Handle
          key={handle.id}
          type={handle.type}
          position={handle.position}
          id={handle.id}
          className={cn(
            "!w-3 !h-3 !border-2 !border-black/50 transition-all",
            handle.style?.background ? "" : `!bg-${colorClass}-500`
          )}
          style={{
            ...handle.style,
            // Override handle styles for better theme integration if needed, 
            // but keeping handle.style logic for specific colors is fine.
          }}
        />
      ))}

      <div className="flex items-center gap-3 relative z-10">
        <div className={cn(
          "p-2 rounded-lg bg-white/5 border border-white/10",
          `text-${colorClass}-400 group-hover:text-${colorClass}-300 transition-colors`
        )}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{data.label}</span>
        </div>
      </div>

      <div className="mt-3 relative z-10">
        <div className={cn(
          "text-2xl font-bold tracking-tight",
          `text-${colorClass}-500 group-hover:text-${colorClass}-400 group-hover:drop-shadow-[0_0_8px_rgba(var(--${colorClass}-rgb),0.5)]`
        )}>
          {data.count || 0}
        </div>
      </div>
    </div>
  );
};

// Handle Colors
const successHandleStyle = { background: '#22c55e' }; // green-500
const warningHandleStyle = { background: '#eab308' }; // yellow-500
const errorHandleStyle = { background: '#ef4444' };   // red-500
const infoHandleStyle = { background: '#3b82f6' };    // blue-500

// Specific node components
export const ActiveNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-green-500/30 hover:border-green-500/60"
    colorClass="green"
    icon={Activity}
    handles={[
      { type: 'target', position: Position.Top, id: 'top-target', style: successHandleStyle },
      { type: 'target', position: Position.Bottom, id: 'bottom-target', style: successHandleStyle },
      { type: 'source', position: Position.Left, id: 'left-source', style: successHandleStyle },
      { type: 'source', position: Position.Right, id: 'right-source', style: warningHandleStyle },
    ]}
  />
);

export const CompletedNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-green-500/30 hover:border-green-500/60"
    colorClass="green"
    icon={CheckCircle2}
    handles={[{ type: 'target', position: Position.Right, id: 'right-target', style: successHandleStyle }]}
  />
);

export const PrimaryQueueNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-blue-500/30 hover:border-blue-500/60"
    colorClass="blue"
    icon={Layers}
    handles={[
      { type: 'target', position: Position.Top, id: 'top-target', style: infoHandleStyle },
      { type: 'source', position: Position.Bottom, id: 'bottom-source', style: successHandleStyle },
    ]}
  />
);

export const ScheduledQueueNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-purple-500/30 hover:border-purple-500/60"
    colorClass="purple"
    icon={Clock}
    handles={[
      { type: 'target', position: Position.Top, id: 'top-target', style: warningHandleStyle },
      { type: 'source', position: Position.Left, id: 'left-source', style: warningHandleStyle },
    ]}
  />
);

export const RetryNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-yellow-500/30 hover:border-yellow-500/60"
    colorClass="yellow"
    icon={AlertTriangle}
    handles={[
      { type: 'target', position: Position.Right, id: 'right-target', style: warningHandleStyle },
      { type: 'source', position: Position.Top, id: 'top-source', style: warningHandleStyle },
    ]}
  />
);

export const FailedNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-red-500/30 hover:border-red-500/60"
    colorClass="red"
    icon={XCircle}
    handles={[
      { type: 'target', position: Position.Left, id: 'left-target', style: warningHandleStyle },
      { type: 'source', position: Position.Right, id: 'right-source', style: errorHandleStyle },
      { type: 'source', position: Position.Bottom, id: 'bottom-source', style: warningHandleStyle },
    ]}
  />
);

export const DeadLetterNode: React.FC<NodeProps> = ({ data }) => (
  <StatusNode
    data={data as unknown as StatusNodeData}
    className="border-red-600/50 hover:border-red-500/80"
    colorClass="red"
    icon={AlertOctagon}
    handles={[{ type: 'target', position: Position.Left, id: 'left-target', style: errorHandleStyle }]}
  />
);
