import { useGetSources, useCreateSource, useDeleteSource, type LogSourceInputType } from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Trash2, Key, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SourcesPage() {
  const { data: sources, isLoading } = useGetSources();
  const createSource = useCreateSource();
  const deleteSource = useDeleteSource();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<LogSourceInputType>("http");

  const handleCreate = () => {
    if (!newSourceName) return;
    createSource.mutate(
      { data: { name: newSourceName, type: newSourceType } },
      {
        onSuccess: () => {
          toast({ title: "Source created successfully" });
          setIsCreateOpen(false);
          setNewSourceName("");
          queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
        },
        onError: (err: unknown) => {
          toast({ title: "Failed to create source", description: (err as Error).message, variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this source? All its logs will also be removed.")) return;
    deleteSource.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Source deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      },
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Log Sources</h1>
            <p className="text-muted-foreground mt-1">Manage where your logs are coming from.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Source</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Source</DialogTitle>
                <DialogDescription>Create a new log source to generate an ingestion token.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} className="col-span-3" placeholder="e.g. Production API" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Type</Label>
                  <Select value={newSourceType} onValueChange={(v: LogSourceInputType) => setNewSourceType(v)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP Endpoint</SelectItem>
                      <SelectItem value="agent">Agent (FluentBit/Vector)</SelectItem>
                      <SelectItem value="syslog">Syslog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createSource.isPending || !newSourceName}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card opacity-50"><CardContent className="h-40 animate-pulse" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources?.map((source) => (
              <Card key={source.id} className="bg-card flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      {source.name}
                    </CardTitle>
                    <Badge variant={source.status === "active" ? "default" : "secondary"} className={source.status === "active" ? "bg-success text-success-foreground" : ""}>
                      {source.status}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs pt-1">{source.type.toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Key className="h-3 w-3" /> Token
                      </div>
                      <code className="text-xs bg-accent p-1.5 rounded block truncate text-foreground border border-border/50">
                        {source.token || "Hidden"}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Logs</div>
                        <div className="text-sm font-semibold">{new Intl.NumberFormat().format(source.logCount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Last Seen
                        </div>
                        <div className="text-sm">
                          {source.lastSeenAt ? formatDistanceToNow(new Date(source.lastSeenAt), { addSuffix: true }) : "Never"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <Link href={`/sources/${source.id}`}>
                        <ExternalLink className="h-3 w-3 mr-2" /> View Logs
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(source.id)} disabled={deleteSource.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sources?.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-accent/20 border border-dashed border-border rounded-lg">
                <Database className="h-12 w-12 mb-4 opacity-20" />
                <p>No sources created yet.</p>
                <Button variant="link" onClick={() => setIsCreateOpen(true)}>Create your first source</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
