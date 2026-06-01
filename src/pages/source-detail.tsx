import { useGetSource, useGetLogs, useUpdateSource, type LogSourceUpdateStatus, useIngestLog, useIngestLogBatch } from "@/api";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogList } from "@/components/log-list";
import { Database, Clock, Key, Activity, Power, Send, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SourceDetailPage() {
  const { id } = useParams();
  const sourceId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: source, isLoading: sourceLoading } = useGetSource(sourceId);
  const { data: logsData, isLoading: logsLoading } = useGetLogs({ sourceId, limit: 25 });
  const updateSource = useUpdateSource();
  const ingestLog = useIngestLog();
  const ingestBatch = useIngestLogBatch();

  const toggleStatus = () => {
    if (!source) return;
    const newStatus: LogSourceUpdateStatus = source.status === "active" ? "inactive" : "active";
    updateSource.mutate({ id: sourceId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: `Source ${newStatus === "active" ? "activated" : "deactivated"}` });
        queryClient.invalidateQueries({ queryKey: [`/api/sources/${sourceId}`] });
      },
    });
  };

  const handleSimulateLog = () => {
    ingestLog.mutate({ data: { sourceId, level: "info", message: "Simulated log event for testing", host: "test-host" } }, {
      onSuccess: () => {
        toast({ title: "Simulated log ingested" });
        queryClient.invalidateQueries({ queryKey: ["getLogs"] });
        queryClient.invalidateQueries({ queryKey: [`/api/sources/${sourceId}`] });
      },
    });
  };

  const handleSimulateBatch = () => {
    ingestBatch.mutate({
      data: {
        entries: [
          { sourceId, level: "warn", message: "High memory usage detected", host: "test-host" },
          { sourceId, level: "error", message: "Connection timeout to database", host: "test-host" },
        ],
      },
    }, {
      onSuccess: () => {
        toast({ title: "Simulated batch ingested" });
        queryClient.invalidateQueries({ queryKey: ["getLogs"] });
        queryClient.invalidateQueries({ queryKey: [`/api/sources/${sourceId}`] });
      },
    });
  };

  if (sourceLoading) return <div className="p-8 text-center animate-pulse">Loading source details...</div>;
  if (!source) return <div className="p-8 text-center text-destructive">Source not found</div>;

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-card rounded-md border border-border">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{source.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={source.status === "active" ? "default" : "secondary"} className={source.status === "active" ? "bg-success text-success-foreground" : ""}>
                  {source.status}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground uppercase">{source.type}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSimulateLog} disabled={ingestLog.isPending || source.status !== "active"}>
              <Send className="h-4 w-4 mr-2" /> Simulate Event
            </Button>
            <Button variant="outline" size="sm" onClick={handleSimulateBatch} disabled={ingestBatch.isPending || source.status !== "active"}>
              <Zap className="h-4 w-4 mr-2" /> Simulate Batch
            </Button>
            <Button
              variant={source.status === "active" ? "outline" : "default"}
              onClick={toggleStatus}
              disabled={updateSource.isPending}
              className={source.status === "active" ? "text-warning hover:bg-warning hover:text-warning-foreground border-warning/50" : "bg-success hover:bg-success/90"}
            >
              <Power className="h-4 w-4 mr-2" />
              {source.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4" /> Ingestion Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-accent p-2 rounded block break-all text-foreground border border-border/50">
                {source.token || "No token available"}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Use this token in your Authorization header: <code>Bearer {source.token}</code>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{new Intl.NumberFormat().format(source.logCount || 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {source.lastSeenAt ? formatDistanceToNow(new Date(source.lastSeenAt), { addSuffix: true }) : "Never"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Recent Logs from {source.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LogList logs={logsData?.entries} isLoading={logsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
