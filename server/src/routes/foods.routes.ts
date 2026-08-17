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

function toPublicFood(row: FoodRow, favoriteIds?: Set<string>) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    source: row.source,
    isFavorite: favoriteIds?.has(row.id) ?? false,
  };
}

function getFavoriteIds(userId: string): Set<string> {
  const rows = db.prepare("SELECT food_id FROM favorite_foods WHERE user_id = ?").all(userId) as Array<{
    food_id: string;
  }>;
  return new Set(rows.map((r) => r.food_id));
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

  const favoriteIds = getFavoriteIds(req.userId!);
  res.json({ foods: rows.map((row) => toPublicFood(row, favoriteIds)) });
});

// GET /foods/recent - foods this user has logged most recently, deduped,
// newest use first. Powers the "Recent foods" section of the add-food screen.
router.get("/recent", requireAuth, (req: AuthedRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 30);

  const rows = db
    .prepare(
      `SELECT f.*, MAX(me.created_at) as last_used
       FROM meal_entries me
       JOIN foods f ON f.id = me.food_id
       WHERE me.user_id = ?
       GROUP BY f.id
       ORDER BY last_used DESC
       LIMIT ?`
    )
    .all(req.userId, limit) as FoodRow[];

  const favoriteIds = getFavoriteIds(req.userId!);
  res.json({ foods: rows.map((row) => toPublicFood(row, favoriteIds)) });
});

// GET /foods/favorites - foods this user has starred, newest favorite first.
router.get("/favorites", requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT f.*
       FROM favorite_foods ff
       JOIN foods f ON f.id = ff.food_id
       WHERE ff.user_id = ?
       ORDER BY ff.created_at DESC`
    )
    .all(req.userId) as FoodRow[];

  res.json({ foods: rows.map((row) => toPublicFood(row, new Set(rows.map((r) => r.id)))) });
});

// POST /foods/:id/favorite - star a food
router.post("/:id/favorite", requireAuth, (req: AuthedRequest, res) => {
  const food = fetchFoodOr404(req, res, String(req.params.id));
  if (!food) return;

  db.prepare(
    `INSERT OR IGNORE INTO favorite_foods (user_id, food_id) VALUES (?, ?)`
  ).run(req.userId, food.id);

  res.status(201).json({ food: toPublicFood(food, new Set([food.id])) });
});

// DELETE /foods/:id/favorite - unstar a food
router.delete("/:id/favorite", requireAuth, (req: AuthedRequest, res) => {
  db.prepare("DELETE FROM favorite_foods WHERE user_id = ? AND food_id = ?").run(
    req.userId,
    req.params.id
  );
  res.status(204).send();
});

function fetchFoodOr404(req: AuthedRequest, res: import("express").Response, id: string): FoodRow | undefined {
  const food = db.prepare("SELECT * FROM foods WHERE id = ?").get(id) as FoodRow | undefined;
  if (!food) {
    res.status(404).json({ error: "Food not found" });
    return undefined;
  }
  return food;
}

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
