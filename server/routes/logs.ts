import { Router } from "express";
import { db, logsTable, sourcesTable } from "../db.js";
import { eq, and, gte, lte, ilike, count, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function buildFilters(level?: string, sourceId?: number, from?: string, to?: string) {
  const filters = [];
  if (level) filters.push(eq(logsTable.level, level));
  if (sourceId) filters.push(eq(logsTable.sourceId, sourceId));
  if (from) filters.push(gte(logsTable.timestamp, new Date(from)));
  if (to) filters.push(lte(logsTable.timestamp, new Date(to)));
  return filters;
}

const logSelect = {
  id: logsTable.id,
  timestamp: logsTable.timestamp,
  level: logsTable.level,
  message: logsTable.message,
  sourceId: logsTable.sourceId,
  sourceName: sourcesTable.name,
  tags: logsTable.tags,
  metadata: logsTable.metadata,
  host: logsTable.host,
};

router.get("/logs", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const level = req.query.level as string | undefined;
  const sourceId = req.query.sourceId ? Number(req.query.sourceId) : undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const filters = buildFilters(level, sourceId, from, to);
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [entries, [{ total }]] = await Promise.all([
    db.select(logSelect).from(logsTable)
      .leftJoin(sourcesTable, eq(logsTable.sourceId, sourcesTable.id))
      .where(whereClause)
      .orderBy(sql`${logsTable.timestamp} DESC`)
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(logsTable).where(whereClause),
  ]);
  res.json({ entries, total: Number(total), page, limit });
});

router.post("/logs/batch", async (req, res) => {
  const itemSchema = z.object({
    level: z.enum(["error", "warn", "info", "debug"]),
    message: z.string().min(1),
    sourceId: z.number().int(),
    timestamp: z.string().nullish(),
    tags: z.string().nullish(),
    metadata: z.string().nullish(),
    host: z.string().nullish(),
  });
  const schema = z.object({ entries: z.array(itemSchema) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  let inserted = 0, failed = 0;
  const sourceIds = new Set<number>();
  for (const e of parsed.data.entries) {
    try {
      await db.insert(logsTable).values({
        level: e.level, message: e.message, sourceId: e.sourceId,
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
        tags: e.tags ?? null, metadata: e.metadata ?? null, host: e.host ?? null,
      });
      sourceIds.add(e.sourceId);
      inserted++;
    } catch { failed++; }
  }
  for (const sid of sourceIds) {
    await db.update(sourcesTable).set({
      logCount: sql`${sourcesTable.logCount} + ${inserted}`,
      lastSeenAt: new Date(),
    }).where(eq(sourcesTable.id, sid));
  }
  res.status(201).json({ inserted, failed });
});

router.get("/logs/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const level = req.query.level as string | undefined;
  const sourceId = req.query.sourceId ? Number(req.query.sourceId) : undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const filters = buildFilters(level, sourceId, from, to);
  filters.push(ilike(logsTable.message, `%${q}%`));
  const whereClause = and(...filters);

  const [entries, [{ total }]] = await Promise.all([
    db.select(logSelect).from(logsTable)
      .leftJoin(sourcesTable, eq(logsTable.sourceId, sourcesTable.id))
      .where(whereClause)
      .orderBy(sql`${logsTable.timestamp} DESC`)
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(logsTable).where(whereClause),
  ]);
  res.json({ entries, total: Number(total), query: q, page, limit });
});

router.post("/logs", async (req, res) => {
  const schema = z.object({
    level: z.enum(["error", "warn", "info", "debug"]),
    message: z.string().min(1),
    sourceId: z.number().int(),
    timestamp: z.string().nullish(),
    tags: z.string().nullish(),
    metadata: z.string().nullish(),
    host: z.string().nullish(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const ts = parsed.data.timestamp ? new Date(parsed.data.timestamp) : new Date();
  const [entry] = await db.insert(logsTable).values({
    level: parsed.data.level, message: parsed.data.message,
    sourceId: parsed.data.sourceId, timestamp: ts,
    tags: parsed.data.tags ?? null, metadata: parsed.data.metadata ?? null,
    host: parsed.data.host ?? null,
  }).returning();
  await db.update(sourcesTable).set({
    logCount: sql`${sourcesTable.logCount} + 1`,
    lastSeenAt: new Date(),
  }).where(eq(sourcesTable.id, parsed.data.sourceId));
  res.status(201).json(entry);
});

router.get("/logs/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [entry] = await db.select(logSelect).from(logsTable)
    .leftJoin(sourcesTable, eq(logsTable.sourceId, sourcesTable.id))
    .where(eq(logsTable.id, id));
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  res.json(entry);
});

export default router;
