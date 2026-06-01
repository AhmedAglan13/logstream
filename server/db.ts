import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export const sourcesTable = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("http"),
  status: text("status").notNull().default("active"),
  token: text("token"),
  description: text("description"),
  lastSeenAt: timestamp("last_seen_at"),
  logCount: integer("log_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  sourceId: integer("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
  tags: text("tags"),
  metadata: text("metadata"),
  host: text("host"),
}, (table) => [
  index("logs_level_idx").on(table.level),
  index("logs_source_id_idx").on(table.sourceId),
  index("logs_timestamp_idx").on(table.timestamp),
]);
