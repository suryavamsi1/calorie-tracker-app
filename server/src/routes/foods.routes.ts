import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateId } from "../utils/id";
import { resolveProviderFood } from "../utils/foodImport";
import { searchEdamamFoods, ProviderUnavailableError } from "../services/edamamClient";

const router = Router();

interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: string;
  provider: string | null;
  external_id: string | null;
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
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
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

// GET /foods/search?query=apple - unified search: local (curated/custom/
// already-imported provider) foods, plus live external provider results for
// anything not already in our DB. Provider results that haven't been logged
// or favorited yet don't get a real DB row (see resolveProviderFood) - they
// carry a synthetic `provider:<name>:<externalId>` id plus the full
// normalized snapshot, so the client can still show/log/favorite them; the
// snapshot is only persisted on first actual use.
router.get("/search", requireAuth, async (req: AuthedRequest, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  if (!query) {
    return res.json({ foods: [], providerError: false });
  }

  const localRows = db
    .prepare(
      `SELECT * FROM foods
       WHERE (created_by_user_id IS NULL OR created_by_user_id = ?)
       AND (name LIKE ? OR brand LIKE ?)
       ORDER BY name ASC LIMIT 30`
    )
    .all(req.userId, `%${query}%`, `%${query}%`) as FoodRow[];

  const favoriteIdsForSearch = getFavoriteIds(req.userId!);
  const localFoods = localRows.map((row) => toPublicFood(row, favoriteIdsForSearch));
  const importedExternalIds = new Set(
    localRows.filter((r) => r.provider && r.external_id).map((r) => `${r.provider}:${r.external_id}`)
  );

  let providerError = false;
  let providerFoods: Array<ReturnType<typeof toPublicFood> & { provider?: string; externalId?: string }> = [];
  try {
    const results = await searchEdamamFoods(query);
    providerFoods = results
      .filter((r) => !importedExternalIds.has(`${r.provider}:${r.externalId}`))
      .map((r) => ({
        id: `provider:${r.provider}:${r.externalId}`,
        name: r.name,
        brand: r.brand,
        servingSize: r.servingSize,
        servingUnit: r.servingUnit,
        calories: r.calories,
        proteinG: r.proteinG,
        carbsG: r.carbsG,
        fatG: r.fatG,
        source: "provider" as const,
        provider: r.provider,
        externalId: r.externalId,
        isFavorite: false,
      }));
  } catch (err) {
    providerError = true;
    if (!(err instanceof ProviderUnavailableError)) {
      console.error("Unexpected error searching Edamam:", err);
    }
  }

  res.json({ foods: [...localFoods, ...providerFoods], providerError });
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

// POST /foods/:id/favorite - star a food. If :id is a not-yet-imported
// provider reference (provider:<name>:<externalId>), the request body must
// include the full providerFood snapshot so it can be imported first.
const providerFoodSchema = z.object({
  provider: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().nullable().optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
});

router.post("/:id/favorite", requireAuth, (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  let food = db.prepare("SELECT * FROM foods WHERE id = ?").get(id) as FoodRow | undefined;

  if (!food && id.startsWith("provider:")) {
    const parsed = providerFoodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "providerFood snapshot is required to favorite an unimported provider food" });
    }
    const realId = resolveProviderFood(parsed.data);
    food = db.prepare("SELECT * FROM foods WHERE id = ?").get(realId) as FoodRow;
  }

  if (!food) {
    return res.status(404).json({ error: "Food not found" });
  }

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
  proteinG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
});
// POST /foods/custom
router.post("/custom", requireAuth, (req: AuthedRequest, res) => {
  const parsed = customFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { name, brand, servingSize, servingUnit, calories, proteinG, carbsG, fatG } = parsed.data;

  const id = generateId();
  db.prepare(
    `INSERT INTO foods (id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, source, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'custom', ?)`
  ).run(id, name, brand ?? null, servingSize, servingUnit, calories, proteinG, carbsG, fatG, req.userId);

  const row = db.prepare("SELECT * FROM foods WHERE id = ?").get(id) as FoodRow;
  res.status(201).json({ food: toPublicFood(row) });
});

export default router;
