import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateId } from "../utils/id";

const router = Router();

const eventSchema = z.object({
  name: z.string().min(1).max(100),
  properties: z.record(z.string(), z.unknown()).optional(),
});

// POST /events - lightweight product analytics event logging.
// Fire-and-forget from the client at key funnel points (signup, onboarding
// completed, food logged, search performed, etc). Not user-facing; powers
// basic funnel/retention queries directly against the `events` table.
router.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const { name, properties } = parsed.data;
  db.prepare(`INSERT INTO events (id, user_id, name, properties) VALUES (?, ?, ?, ?)`).run(
    generateId(),
    req.userId,
    name,
    properties ? JSON.stringify(properties) : null
  );

  res.status(204).send();
});

export default router;
