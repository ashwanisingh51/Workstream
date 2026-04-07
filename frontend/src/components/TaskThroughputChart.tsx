import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { apiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TaskThroughputChartProps {
    refreshInterval?: number; // in milliseconds, default 5000
}

export function TaskThroughputChart({ refreshInterval = 5000 }: TaskThroughputChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = async () => {
        try {
            // Get last 6 hours of data for a better historical view
            const response = await apiService.fetchTaskMetrics(360);

            // Format data for display
            const formattedData = response.metrics.map(m => ({
                ...m,
                time: new Date(m.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                fullDate: new Date(m.timestamp).toLocaleString()
            }));

            setData(formattedData);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch task metrics:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);



    return (
        <Card className="w-full mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                    Task Throughput (Tasks/sec)
                </CardTitle>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchData()}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis
                                    dataKey="time" // Use pre-formatted local time
                                    minTickGap={30}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullDate;
                                        }
                                        return label;
                                    }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="created_count"
                                    name="Created"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    isAnimationActive={false} // Disable animation for smoother real-time updates
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed_count"
                                    name="Completed"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="failed_count"
                                    name="Failed"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            {loading ? "Loading metrics..." : "No data available"}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
