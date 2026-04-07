import React, { useEffect, useState } from 'react';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api';
import { Loader2, ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaskBackpressureChartProps {
    pollingInterval?: number;
    className?: string;
}

interface BackpressureData {
    timestamp: string;
    time: string;
    created: number;
    completed: number;
    netFlow: number;
    backlogTrend: number;
}

const TaskBackpressureChart: React.FC<TaskBackpressureChartProps> = ({
    pollingInterval = 5000,
    className,
}) => {
    const [data, setData] = useState<BackpressureData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // KPI states
    const [currentBacklogRate, setCurrentBacklogRate] = useState<number>(0);

    const fetchData = async () => {
        try {
            const response = await apiService.fetchTaskMetrics(360); // Last 6 hours for trend

            let cumulative = 0;
            const formattedData = response.metrics.map((m) => {
                const net = m.created_count - m.completed_count;
                cumulative += net;
                return {
                    timestamp: m.timestamp,
                    time: new Date(m.timestamp).toLocaleTimeString([], {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    created: m.created_count,
                    completed: m.completed_count,
                    netFlow: net,
                    backlogTrend: cumulative,
                };
            });

            setData(formattedData);

            // Calculate current rate (avg of last 3 data points)
            if (formattedData.length > 0) {
                const lastPoints = formattedData.slice(-3);
                const avgNet = lastPoints.reduce((sum, p) => sum + p.netFlow, 0) / lastPoints.length;
                setCurrentBacklogRate(avgNet);
            }

            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('Failed to fetch backpressure metrics:', err);
            setError('Failed to load backpressure data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval]);

    const getTrendIcon = () => {
        if (currentBacklogRate > 0.5) return <ArrowUpRight className="h-4 w-4 text-error animate-pulse" />;
        if (currentBacklogRate < -0.5) return <ArrowDownRight className="h-4 w-4 text-success animate-bounce" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const getTrendText = () => {
        if (currentBacklogRate > 0.5) return "Accumulating Backlog";
        if (currentBacklogRate < -0.5) return "Clearing Backlog";
        return "Stable";
    };

    const getTrendColor = () => {
        if (currentBacklogRate > 0.5) return "text-error";
        if (currentBacklogRate < -0.5) return "text-success";
        return "text-muted-foreground";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={className}
        >
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-primary/50 blur-[20px] rounded-full" />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/20">
                    <div className="flex flex-col space-y-1">
                        <CardTitle className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Backpressure Analysis
                        </CardTitle>
                        <motion.div
                            key={currentBacklogRate}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center text-sm gap-2"
                        >
                            <span className={cn("font-medium flex items-center gap-1", getTrendColor())}>
                                {getTrendIcon()}
                                {getTrendText()}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">Net Flow Rate: {currentBacklogRate.toFixed(2)}/min</span>
                        </motion.div>
                    </div>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                        <div className="text-xs text-muted-foreground font-mono bg-surface p-1.5 rounded border border-border/50">
                            UPDATED: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[350px] w-full">
                        {error ? (
                            <div className="flex h-full items-center justify-center text-error font-medium bg-error/5 rounded-lg border border-error/10">
                                {error}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={data}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorNetFlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#ef4444" />
                                            <stop offset="100%" stopColor="#f87171" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        minTickGap={40}
                                        tick={{ fontSize: 11, fill: '#737373' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#737373' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: 'Net Flow', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 10 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#737373' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: 'Cumulative Backlog', angle: 90, position: 'insideRight', fill: '#737373', fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0a0a',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ fontSize: '12px' }}
                                        labelStyle={{ color: '#a3a3a3', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value) => <span className="text-sm text-foreground/80 font-medium">{value}</span>}
                                    />
                                    <ReferenceLine y={0} yAxisId="left" stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />

                                    <Bar
                                        yAxisId="left"
                                        dataKey="netFlow"
                                        name="Net Flow"
                                        fill="#00f0ff"
                                        opacity={0.8}
                                        radius={[2, 2, 0, 0]}
                                        barSize={6}
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="backlogTrend"
                                        name="Backlog Trend"
                                        stroke="#7000ff"
                                        strokeWidth={3}
                                        fill="url(#colorNetFlow)" // Reusing gradient
                                        fillOpacity={0.1}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TaskBackpressureChart;
