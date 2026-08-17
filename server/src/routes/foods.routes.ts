import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateId } from "../utils/id";

const router = Router();

interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  source: string;
  created_by_user_id: string | null;
}

function toPublicFood(row: FoodRow) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    source: row.source,
  };
}

// GET /foods?query=apple
router.get("/", requireAuth, (req: AuthedRequest, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

  const rows = query
    ? (db
        .prepare(
          `SELECT * FROM foods
           WHERE (created_by_user_id IS NULL OR created_by_user_id = ?)
           AND (name LIKE ? OR brand LIKE ?)
           ORDER BY name ASC LIMIT 30`
        )
        .all(req.userId, `%${query}%`, `%${query}%`) as FoodRow[])
    : (db
        .prepare(
          `SELECT * FROM foods
           WHERE (created_by_user_id IS NULL OR created_by_user_id = ?)
           ORDER BY name ASC LIMIT 30`
        )
        .all(req.userId) as FoodRow[]);

  res.json({ foods: rows.map(toPublicFood) });
});

const customFoodSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.number().positive().default(1),
  servingUnit: z.string().min(1).default("serving"),
  calories: z.number().int().min(0),
});

// POST /foods/custom
router.post("/custom", requireAuth, (req: AuthedRequest, res) => {
  const parsed = customFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { name, brand, servingSize, servingUnit, calories } = parsed.data;

  const id = generateId();
  db.prepare(
    `INSERT INTO foods (id, name, brand, serving_size, serving_unit, calories, source, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, 'custom', ?)`
  ).run(id, name, brand ?? null, servingSize, servingUnit, calories, req.userId);

  const row = db.prepare("SELECT * FROM foods WHERE id = ?").get(id) as FoodRow;
  res.status(201).json({ food: toPublicFood(row) });
});

export default router;
