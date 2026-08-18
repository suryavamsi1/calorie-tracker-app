import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateId } from "../utils/id";

const router = Router();

interface WeightLogRow {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_date: string;
  created_at: string;
}

function toPublicWeightLog(row: WeightLogRow) {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    loggedDate: row.logged_date,
    createdAt: row.created_at,
  };
}

// GET /weight-logs?limit=7 - most recent logs first N days, returned oldest-first for charting.
router.get("/", requireAuth, (req: AuthedRequest, res) => {
  const limit = Math.min(90, Math.max(1, Number(req.query.limit) || 7));

  const rows = db
    .prepare(
      `SELECT * FROM weight_logs WHERE user_id = ? ORDER BY logged_date DESC LIMIT ?`
    )
    .all(req.userId, limit) as WeightLogRow[];

  const logs = rows.reverse().map(toPublicWeightLog);
  res.json({ logs });
});

const upsertWeightLogSchema = z.object({
  weightKg: z.number().positive().max(1000),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .optional(),
});

// POST /weight-logs - logs (or updates) the user's weight for a given day (defaults to today).
router.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = upsertWeightLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid body" });
  }

  const { weightKg, date } = parsed.data;
  const loggedDate = date ?? new Date().toISOString().slice(0, 10);

  const existing = db
    .prepare("SELECT * FROM weight_logs WHERE user_id = ? AND logged_date = ?")
    .get(req.userId, loggedDate) as WeightLogRow | undefined;

  if (existing) {
    db.prepare("UPDATE weight_logs SET weight_kg = ? WHERE id = ?").run(weightKg, existing.id);
  } else {
    db.prepare(
      "INSERT INTO weight_logs (id, user_id, weight_kg, logged_date) VALUES (?, ?, ?, ?)"
    ).run(generateId(), req.userId, weightKg, loggedDate);
  }

  db.prepare("UPDATE users SET weight_kg = ? WHERE id = ?").run(weightKg, req.userId);

  const row = db
    .prepare("SELECT * FROM weight_logs WHERE user_id = ? AND logged_date = ?")
    .get(req.userId, loggedDate) as WeightLogRow;

  res.status(existing ? 200 : 201).json({ log: toPublicWeightLog(row) });
});

export default router;
