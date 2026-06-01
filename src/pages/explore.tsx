import { useGetLogs, useGetSources, type GetLogsLevel } from "@/api";
import { useState } from "react";
import { LogList } from "@/components/log-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, ArrowLeft, ArrowRight } from "lucide-react";

export default function ExplorePage() {
  const [page, setPage] = useState(1);
  const limit = 50;
  const [level, setLevel] = useState<string>("all");
  const [sourceId, setSourceId] = useState<string>("all");

  const { data: sources } = useGetSources();

  const queryParams = {
    page,
    limit,
    ...(level !== "all" ? { level: level as GetLogsLevel } : {}),
    ...(sourceId !== "all" ? { sourceId: parseInt(sourceId) } : {}),
  };

  const { data, isLoading, isFetching } = useGetLogs(queryParams, {
    query: { queryKey: ["getLogs", queryParams] },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border shrink-0 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Explore Logs</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Any Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Level</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Any Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Source</SelectItem>
              {sources?.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-4 py-3 border-b border-border bg-accent/30 flex justify-between items-center text-sm">
            <div className="text-muted-foreground">
              {isLoading
                ? "Loading logs..."
                : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, data?.total || 0)} of ${data?.total || 0}`}
              {isFetching && !isLoading && <span className="ml-2 text-primary animate-pulse">Updating...</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages || isLoading}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <LogList logs={data?.entries} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
