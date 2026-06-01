import { useGetStatsOverview, useGetLogVolume, useGetLevelBreakdown, useGetTopSources, useGetRecentErrors } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Cell } from "recharts";
import { format } from "date-fns";
import { LogLevelBadge } from "@/components/log-level-badge";
import { Activity, AlertTriangle, Terminal, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStatsOverview();
  const { data: volume, isLoading: volumeLoading } = useGetLogVolume();
  const { data: levels, isLoading: levelsLoading } = useGetLevelBreakdown();
  const { data: topSources, isLoading: sourcesLoading } = useGetTopSources();
  const { data: recentErrors, isLoading: errorsLoading } = useGetRecentErrors();

  const formatNumber = (num?: number) => {
    if (num === undefined) return "0";
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{formatNumber(stats?.totalLogs)}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold text-destructive">{(stats?.errorRate || 0).toFixed(2)}%</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Logs / 24h</CardTitle>
              <Activity className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{formatNumber(stats?.logsLast24h)}</div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Sources</CardTitle>
              <Database className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{stats?.totalSources || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card">
            <CardHeader>
              <CardTitle>Log Volume (Last 24h)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {volumeLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volume || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hour" tickFormatter={(val) => format(new Date(val), "HH:mm")} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} labelFormatter={(val) => format(new Date(val), "MMM d, HH:mm")} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#colorCount)" name="Total" />
                    <Area type="monotone" dataKey="errorCount" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorError)" name="Errors" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader><CardTitle>Level Breakdown</CardTitle></CardHeader>
            <CardContent>
              {levelsLoading ? <Skeleton className="h-[250px] w-full" /> : (
                <div className="space-y-4">
                  {levels?.map((item) => (
                    <div key={item.level} className="flex items-center justify-between">
                      <LogLevelBadge level={item.level} />
                      <div className="text-sm font-medium">{formatNumber(item.count)}</div>
                    </div>
                  ))}
                  <div className="pt-4 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={levels || []} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="level" type="category" hide />
                        <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {levels?.map((entry, index) => {
                            const colorMap: Record<string, string> = {
                              error: "hsl(var(--destructive))",
                              warn: "hsl(var(--warning))",
                              info: "hsl(var(--info))",
                              debug: "hsl(var(--muted-foreground))",
                            };
                            return <Cell key={`cell-${index}`} fill={colorMap[entry.level.toLowerCase()] || "hsl(var(--primary))"} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card">
            <CardHeader><CardTitle>Recent Errors</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {errorsLoading ? (
                  <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : recentErrors?.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No recent errors</div>
                ) : (
                  <div className="space-y-3">
                    {recentErrors?.map((log) => (
                      <div key={log.id} className="flex flex-col gap-1 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                          <span className="text-xs font-medium text-destructive">{log.sourceName}</span>
                        </div>
                        <div className="font-mono text-destructive truncate" title={log.message}>{log.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader><CardTitle>Top Sources</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {sourcesLoading ? (
                  <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {topSources?.map((source) => (
                      <div key={source.sourceId} className="flex items-center justify-between p-3 rounded-md bg-accent/50 border border-border">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{source.sourceName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{formatNumber(source.count)} logs</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
