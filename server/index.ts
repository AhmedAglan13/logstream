import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import healthRouter from "./routes/health.js";
import logsRouter from "./routes/logs.js";
import sourcesRouter from "./routes/sources.js";
import statsRouter from "./routes/stats.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", sourcesRouter);
app.use("/api", logsRouter);
app.use("/api", statsRouter);

if (isProd) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPublic = path.join(__dirname, "..", "dist", "public");
  app.use(express.static(distPublic));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPublic, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
