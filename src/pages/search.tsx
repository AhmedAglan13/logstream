import { useSearchLogs, useGetSources } from "@/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import { LogList } from "@/components/log-list";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [level, setLevel] = useState<string>("all");
  const [sourceId, setSourceId] = useState<string>("all");

  const { data: sources } = useGetSources();

  const searchParams = {
    q: debouncedQuery,
    ...(level !== "all" ? { level } : {}),
    ...(sourceId !== "all" ? { sourceId: parseInt(sourceId) } : {}),
    limit: 100,
  };

  const { data, isLoading } = useSearchLogs(
    searchParams,
    { query: { enabled: debouncedQuery.length > 0, queryKey: ["searchLogs", searchParams] } }
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border shrink-0 bg-card">
        <div className="max-w-5xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Search</h1>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search logs... (e.g., 'connection refused' or 'user_id: 123')"
              className="pl-10 h-14 text-lg bg-background border-primary/20 focus-visible:ring-primary font-mono shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
            </div>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[150px] h-9">
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
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Any Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Source</SelectItem>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(level !== "all" || sourceId !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setLevel("all"); setSourceId("all"); }} className="h-9 px-2">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-7xl mx-auto p-6">
          {!debouncedQuery ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded-lg bg-accent/10">
              Enter a query to start searching
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-accent/30 flex justify-between items-center text-sm text-muted-foreground">
                <span>{isLoading ? "Searching..." : `Found ${data?.total || 0} results`}</span>
              </div>
              <LogList logs={data?.entries} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
