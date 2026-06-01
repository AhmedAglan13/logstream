import { Router } from "express";
import { db, logsTable, sourcesTable } from "../db.js";
import { eq, count, sql, gte } from "drizzle-orm";

const router = Router();

router.get("/stats/overview", async (_req, res) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalLogsRes, sourcesRes, levelCountsRes, lastHourRes, lastDayRes] = await Promise.all([
    db.select({ total: count() }).from(logsTable),
    db.select({ total: count() }).from(sourcesTable),
    db.select({ level: logsTable.level, cnt: count() }).from(logsTable).groupBy(logsTable.level),
    db.select({ cnt: count() }).from(logsTable).where(gte(logsTable.timestamp, oneHourAgo)),
    db.select({ cnt: count() }).from(logsTable).where(gte(logsTable.timestamp, oneDayAgo)),
  ]);

  const totalLogs = Number(totalLogsRes[0]?.total ?? 0);
  const totalSources = Number(sourcesRes[0]?.total ?? 0);
  const levelMap: Record<string, number> = {};
  for (const row of levelCountsRes) levelMap[row.level] = Number(row.cnt);
  const errorCount = levelMap["error"] ?? 0;
  const errorRate = totalLogs > 0 ? Math.round((errorCount / totalLogs) * 10000) / 100 : 0;

  res.json({
    totalLogs,
    totalSources,
    errorCount,
    warnCount: levelMap["warn"] ?? 0,
    infoCount: levelMap["info"] ?? 0,
    debugCount: levelMap["debug"] ?? 0,
    errorRate,
    logsLastHour: Number(lastHourRes[0]?.cnt ?? 0),
    logsLast24h: Number(lastDayRes[0]?.cnt ?? 0),
  });
});

router.get("/stats/volume", async (_req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db.select({
    hour: sql<string>`date_trunc('hour', ${logsTable.timestamp})::text`,
    count: count(),
    errorCount: sql<number>`SUM(CASE WHEN ${logsTable.level} = 'error' THEN 1 ELSE 0 END)::int`,
  })
    .from(logsTable)
    .where(gte(logsTable.timestamp, oneDayAgo))
    .groupBy(sql`date_trunc('hour', ${logsTable.timestamp})`)
    .orderBy(sql`date_trunc('hour', ${logsTable.timestamp})`);
  res.json(rows.map(r => ({ hour: r.hour, count: Number(r.count), errorCount: Number(r.errorCount) })));
});

router.get("/stats/levels", async (_req, res) => {
  const rows = await db.select({ level: logsTable.level, count: count() }).from(logsTable).groupBy(logsTable.level);
  res.json(rows.map(r => ({ level: r.level, count: Number(r.count) })));
});

router.get("/stats/top-sources", async (_req, res) => {
  const rows = await db.select({
    sourceId: logsTable.sourceId,
    sourceName: sourcesTable.name,
    count: count(),
  })
    .from(logsTable)
    .leftJoin(sourcesTable, eq(logsTable.sourceId, sourcesTable.id))
    .groupBy(logsTable.sourceId, sourcesTable.name)
    .orderBy(sql`count(*) DESC`)
    .limit(10);
  res.json(rows.map(r => ({ sourceId: r.sourceId, sourceName: r.sourceName ?? "Unknown", count: Number(r.count) })));
});

router.get("/stats/recent-errors", async (_req, res) => {
  const rows = await db.select({
    id: logsTable.id, timestamp: logsTable.timestamp, level: logsTable.level,
    message: logsTable.message, sourceId: logsTable.sourceId, sourceName: sourcesTable.name,
    tags: logsTable.tags, metadata: logsTable.metadata, host: logsTable.host,
  })
    .from(logsTable)
    .leftJoin(sourcesTable, eq(logsTable.sourceId, sourcesTable.id))
    .where(eq(logsTable.level, "error"))
    .orderBy(sql`${logsTable.timestamp} DESC`)
    .limit(20);
  res.json(rows);
});

export default router;
