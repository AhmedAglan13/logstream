import { Badge } from "@/components/ui/badge";

type LogLevel = "error" | "warn" | "info" | "debug" | string;

export function LogLevelBadge({ level, className = "" }: { level: LogLevel; className?: string }) {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error": return "bg-destructive/20 text-destructive border-destructive/50";
      case "warn":  return "bg-warning/20 text-warning border-warning/50";
      case "info":  return "bg-info/20 text-info border-info/50";
      case "debug": return "bg-muted text-muted-foreground border-muted/50";
      default:      return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Badge
      variant="outline"
      className={`font-mono text-[10px] tracking-wider uppercase px-1.5 py-0 rounded ${getLevelColor(level)} ${className}`}
    >
      {level}
    </Badge>
  );
}
