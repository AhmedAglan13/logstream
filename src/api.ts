import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "error" | "warn" | "info" | "debug";
export type GetLogsLevel = LogLevel;
export type LogSourceInputType = "http" | "agent" | "syslog" | "file";
export type LogSourceUpdateStatus = "active" | "inactive";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  sourceId: number;
  sourceName: string | null;
  tags: string | null;
  metadata: string | null;
  host: string | null;
}

export interface LogSource {
  id: number;
  name: string;
  type: LogSourceInputType;
  status: "active" | "inactive" | "error";
  token: string | null;
  description: string | null;
  lastSeenAt: string | null;
  logCount: number;
  createdAt: string;
}

export interface LogPage {
  entries: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface LogSearchResult {
  entries: LogEntry[];
  total: number;
  query: string;
  page: number;
  limit: number;
}

export interface StatsOverview {
  totalLogs: number;
  totalSources: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  errorRate: number;
  logsLastHour: number;
  logsLast24h: number;
}

export interface VolumeBucket {
  hour: string;
  count: number;
  errorCount: number;
}

export interface LevelCount {
  level: string;
  count: number;
}

export interface SourceVolume {
  sourceId: number;
  sourceName: string;
  count: number;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── API functions ────────────────────────────────────────────────────────────

export const fetchStatsOverview = () => apiFetch<StatsOverview>("/stats/overview");
export const fetchLogVolume = () => apiFetch<VolumeBucket[]>("/stats/volume");
export const fetchLevelBreakdown = () => apiFetch<LevelCount[]>("/stats/levels");
export const fetchTopSources = () => apiFetch<SourceVolume[]>("/stats/top-sources");
export const fetchRecentErrors = () => apiFetch<LogEntry[]>("/stats/recent-errors");

export interface GetLogsParams {
  page?: number;
  limit?: number;
  level?: string;
  sourceId?: number;
  from?: string;
  to?: string;
}

export const fetchLogs = (params?: GetLogsParams) =>
  apiFetch<LogPage>(`/logs${buildQuery({ ...params })}`);

export const fetchLog = (id: number) => apiFetch<LogEntry>(`/logs/${id}`);

export interface SearchLogsParams extends GetLogsParams {
  q: string;
}

export const fetchSearchLogs = (params: SearchLogsParams) =>
  apiFetch<LogSearchResult>(`/logs/search${buildQuery({ ...params })}`);

export const fetchSources = () => apiFetch<LogSource[]>("/sources");
export const fetchSource = (id: number) => apiFetch<LogSource>(`/sources/${id}`);

// ─── Query Hooks ──────────────────────────────────────────────────────────────

export function useGetStatsOverview(options?: { query?: Partial<UseQueryOptions<StatsOverview>> }) {
  return useQuery({ queryKey: ["/api/stats/overview"], queryFn: fetchStatsOverview, ...options?.query });
}

export function useGetLogVolume(options?: { query?: Partial<UseQueryOptions<VolumeBucket[]>> }) {
  return useQuery({ queryKey: ["/api/stats/volume"], queryFn: fetchLogVolume, ...options?.query });
}

export function useGetLevelBreakdown(options?: { query?: Partial<UseQueryOptions<LevelCount[]>> }) {
  return useQuery({ queryKey: ["/api/stats/levels"], queryFn: fetchLevelBreakdown, ...options?.query });
}

export function useGetTopSources(options?: { query?: Partial<UseQueryOptions<SourceVolume[]>> }) {
  return useQuery({ queryKey: ["/api/stats/top-sources"], queryFn: fetchTopSources, ...options?.query });
}

export function useGetRecentErrors(options?: { query?: Partial<UseQueryOptions<LogEntry[]>> }) {
  return useQuery({ queryKey: ["/api/stats/recent-errors"], queryFn: fetchRecentErrors, ...options?.query });
}

export function useGetLogs(params?: GetLogsParams, options?: { query?: Partial<UseQueryOptions<LogPage>> }) {
  return useQuery({
    queryKey: ["getLogs", params],
    queryFn: () => fetchLogs(params),
    ...options?.query,
  });
}

export function useGetLog(id: number, options?: { query?: Partial<UseQueryOptions<LogEntry>> }) {
  return useQuery({
    queryKey: ["/api/logs", id],
    queryFn: () => fetchLog(id),
    enabled: !!id,
    ...options?.query,
  });
}

export function useSearchLogs(params?: SearchLogsParams, options?: { query?: Partial<UseQueryOptions<LogSearchResult>> }) {
  return useQuery({
    queryKey: ["searchLogs", params],
    queryFn: () => fetchSearchLogs(params!),
    enabled: !!params?.q,
    ...options?.query,
  });
}

export function useGetSources(options?: { query?: Partial<UseQueryOptions<LogSource[]>> }) {
  return useQuery({ queryKey: ["/api/sources"], queryFn: fetchSources, ...options?.query });
}

export function useGetSource(id: number, options?: { query?: Partial<UseQueryOptions<LogSource>> }) {
  return useQuery({
    queryKey: [`/api/sources/${id}`],
    queryFn: () => fetchSource(id),
    enabled: !!id,
    ...options?.query,
  });
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreateSource() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; type: LogSourceInputType; description?: string | null } }) =>
      apiFetch<LogSource>("/sources", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateSource() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; status?: LogSourceUpdateStatus; description?: string | null } }) =>
      apiFetch<LogSource>(`/sources/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeleteSource() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch<void>(`/sources/${id}`, { method: "DELETE" }),
  });
}

export function useIngestLog() {
  return useMutation({
    mutationFn: ({ data }: { data: { level: LogLevel; message: string; sourceId: number; host?: string; tags?: string; metadata?: string } }) =>
      apiFetch<LogEntry>("/logs", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useIngestLogBatch() {
  return useMutation({
    mutationFn: ({ data }: { data: { entries: Array<{ level: LogLevel; message: string; sourceId: number; host?: string }> } }) =>
      apiFetch<{ inserted: number; failed: number }>("/logs/batch", { method: "POST", body: JSON.stringify(data) }),
  });
}
