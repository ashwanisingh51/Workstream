
import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService, TaskLatencyMetrics } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface TaskLatencyChartProps {
    pollingInterval?: number;
    className?: string;
}

const TaskLatencyChart: React.FC<TaskLatencyChartProps> = ({
    pollingInterval = 5000,
    className,
}) => {
    const [data, setData] = useState<TaskLatencyMetrics[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            const response = await apiService.fetchTaskLatencyMetrics(360); // Last 6 hours
            // Transform timestamp to readable time
            const formattedData = response.metrics.map((m) => ({
                ...m,
                time: new Date(m.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                timestampObj: new Date(m.timestamp),
            }));
            setData(formattedData);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('Failed to fetch latency metrics:', err);
            setError('Failed to load latency data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval]);

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-normal">
                    Task Latency (P50/P95/P99)
                </CardTitle>
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {error ? (
                        <div className="flex h-full items-center justify-center text-red-500">
                            {error}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 10,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="time"
                                    minTickGap={30}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                    labelStyle={{ color: '#64748b' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="p50"
                                    name="P50"
                                    stroke="#10b981" // emerald-500
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="p95"
                                    name="P95"
                                    stroke="#f59e0b" // amber-500
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="p99"
                                    name="P99"
                                    stroke="#ef4444" // red-500
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskLatencyChart;
