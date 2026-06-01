import { Router } from "express";
import { db, sourcesTable } from "../db.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";

const router = Router();

router.get("/sources", async (_req, res) => {
  const sources = await db.select().from(sourcesTable).orderBy(sourcesTable.createdAt);
  res.json(sources);
});

router.post("/sources", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    type: z.enum(["http", "agent", "syslog", "file"]),
    description: z.string().nullish(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const token = randomBytes(24).toString("hex");
  const [source] = await db.insert(sourcesTable).values({
    name: parsed.data.name,
    type: parsed.data.type,
    description: parsed.data.description ?? null,
    token,
    status: "active",
  }).returning();
  res.status(201).json(source);
});

router.get("/sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [source] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, id));
  if (!source) { res.status(404).json({ error: "Not found" }); return; }
  res.json(source);
});

router.patch("/sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  const schema = z.object({
    name: z.string().min(1).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    description: z.string().nullish(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [updated] = await db.update(sourcesTable).set(parsed.data).where(eq(sourcesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/sources/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(sourcesTable).where(eq(sourcesTable.id, id));
  res.status(204).send();
});

export default router;
