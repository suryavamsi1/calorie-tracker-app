import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import foodsRoutes from "./routes/foods.routes";
import entriesRoutes from "./routes/entries.routes";
import historyRoutes from "./routes/history.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/", authRoutes);
  app.use("/me", meRoutes);
  app.use("/foods", foodsRoutes);
  app.use("/entries", entriesRoutes);
  app.use("/history", historyRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
