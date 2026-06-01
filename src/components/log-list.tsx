import { type LogEntry, useGetLog } from "@/api";
import { format } from "date-fns";
import { LogLevelBadge } from "./log-level-badge";
import { Database, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ExpandedLogDetails({ logId, initialLog }: { logId: number; initialLog: LogEntry }) {
  const { data: log, isLoading } = useGetLog(logId);
  const displayLog = log || initialLog;

  return (
    <div className="p-4 pl-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs relative">
      {isLoading && (
        <div className="absolute top-4 right-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      <div>
        <h4 className="font-semibold text-muted-foreground mb-2">Details</h4>
        <table className="w-full">
          <tbody>
            <tr><td className="py-1 text-muted-foreground w-24">ID</td><td>{displayLog.id}</td></tr>
            <tr><td className="py-1 text-muted-foreground">Source ID</td><td>{displayLog.sourceId}</td></tr>
            <tr><td className="py-1 text-muted-foreground">Host</td><td>{displayLog.host || "-"}</td></tr>
            <tr><td className="py-1 text-muted-foreground">Tags</td><td>{displayLog.tags || "-"}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h4 className="font-semibold text-muted-foreground mb-2">Metadata</h4>
        <pre className="bg-accent/20 p-2 rounded border border-border/50 whitespace-pre-wrap overflow-auto max-h-40">
          {displayLog.metadata ? JSON.stringify(JSON.parse(displayLog.metadata), null, 2) : "{}"}
        </pre>
      </div>
    </div>
  );
}

export function LogList({ logs, isLoading }: { logs?: LogEntry[]; isLoading?: boolean }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="h-10 w-full bg-accent/20 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Database className="h-10 w-10 mb-4 opacity-20" />
        <p>No logs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-sm font-mono border-t border-border">
      {logs.map((log) => {
        const isExpanded = expandedId === log.id;
        return (
          <div key={log.id} className="flex flex-col border-b border-border/50 hover:bg-accent/30 transition-colors">
            <div
              className="flex items-start p-2 gap-3 cursor-pointer group"
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              <div className="flex-shrink-0 pt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
              <div className="flex-shrink-0 text-muted-foreground pt-0.5 w-[140px]">
                {format(new Date(log.timestamp), "MMM d, HH:mm:ss.SSS")}
              </div>
              <div className="flex-shrink-0 w-16">
                <LogLevelBadge level={log.level} />
              </div>
              <div className="flex-shrink-0 w-32 truncate text-muted-foreground pt-0.5" title={log.sourceName ?? ""}>
                {log.sourceName}
              </div>
              <div
                className="flex-1 break-all pt-0.5"
                style={{
                  color:
                    log.level === "error"
                      ? "hsl(var(--destructive))"
                      : log.level === "warn"
                      ? "hsl(var(--warning))"
                      : "inherit",
                }}
              >
                {log.message}
              </div>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-background border-t border-border/30"
                >
                  <ExpandedLogDetails logId={log.id} initialLog={log} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
