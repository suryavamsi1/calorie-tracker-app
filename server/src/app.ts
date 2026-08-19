import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import foodsRoutes from "./routes/foods.routes";
import entriesRoutes from "./routes/entries.routes";
import historyRoutes from "./routes/history.routes";
import eventsRoutes from "./routes/events.routes";
import weightRoutes from "./routes/weight.routes";

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => process.env.NODE_ENV === "test" || req.path.startsWith("/events"),
});

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  }
  app.use(apiLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // authLimiter is applied per-route inside auth.routes.ts (login/signup
  // only) - it must NOT be mounted here, since app.use("/", ...) matches
  // every request path in the app, not just the auth routes.
  app.use("/", authRoutes);
  app.use("/me", meRoutes);
  app.use("/foods", foodsRoutes);
  app.use("/entries", entriesRoutes);
  app.use("/history", historyRoutes);
  app.use("/events", eventsRoutes);
  app.use("/weight-logs", weightRoutes);

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
