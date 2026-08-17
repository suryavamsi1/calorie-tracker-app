import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { generateId } from "../utils/id";

const router = Router();

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"] as const;

interface EntryRow {
  id: string;
  user_id: string;
  food_id: string | null;
  custom_food_name: string | null;
  custom_calories: number | null;
  quantity: number;
  meal_type: string;
  entry_date: string;
  created_at: string;
}

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
}

// Macros are only known for foods with a stored nutrition profile (linked
// catalog/custom Food rows). Quick-add entries (customFoodName/
// customCalories, no food_id) have no macro data, so they report null.
function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function toPublicEntry(row: EntryRow, food?: FoodRow) {
  const name = food?.name ?? row.custom_food_name ?? "Unknown food";
  const caloriesPerServing = food?.calories ?? row.custom_calories ?? 0;
  return {
    id: row.id,
    foodId: row.food_id,
    foodName: name,
    servingSize: food?.serving_size ?? 1,
    servingUnit: food?.serving_unit ?? "serving",
    quantity: row.quantity,
    calories: Math.round(caloriesPerServing * row.quantity),
    proteinG: food ? roundMacro(food.protein_g * row.quantity) : null,
    carbsG: food ? roundMacro(food.carbs_g * row.quantity) : null,
    fatG: food ? roundMacro(food.fat_g * row.quantity) : null,
    mealType: row.meal_type,
    entryDate: row.entry_date,
    createdAt: row.created_at,
  };
}

function fetchFood(foodId: string | null): FoodRow | undefined {
  if (!foodId) return undefined;
  return db.prepare("SELECT * FROM foods WHERE id = ?").get(foodId) as FoodRow | undefined;
}

// GET /entries?date=2026-08-17
router.get("/", requireAuth, (req: AuthedRequest, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  if (!date) {
    return res.status(400).json({ error: "Query param 'date' (YYYY-MM-DD) is required" });
  }

  const rows = db
    .prepare(
      `SELECT * FROM meal_entries WHERE user_id = ? AND entry_date = ? ORDER BY created_at ASC`
    )
    .all(req.userId, date) as EntryRow[];

  const entries = rows.map((row) => toPublicEntry(row, fetchFood(row.food_id)));
  res.json({ entries });
});

const createEntrySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    mealType: z.enum(MEAL_TYPES),
    quantity: z.number().positive().default(1),
    foodId: z.string().optional(),
    customFoodName: z.string().optional(),
    customCalories: z.number().int().min(0).optional(),
  })
  .refine((data) => data.foodId || (data.customFoodName && data.customCalories !== undefined), {
    message: "Either foodId or (customFoodName and customCalories) must be provided",
  });

// POST /entries
router.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { date, mealType, quantity, foodId, customFoodName, customCalories } = parsed.data;

  if (foodId) {
    const food = fetchFood(foodId);
    if (!food) return res.status(404).json({ error: "Food not found" });
  }

  const id = generateId();
  db.prepare(
    `INSERT INTO meal_entries
     (id, user_id, food_id, custom_food_name, custom_calories, quantity, meal_type, entry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    foodId ?? null,
    foodId ? null : customFoodName ?? null,
    foodId ? null : customCalories ?? null,
    quantity,
    mealType,
    date
  );

  const row = db.prepare("SELECT * FROM meal_entries WHERE id = ?").get(id) as EntryRow;
  res.status(201).json({ entry: toPublicEntry(row, fetchFood(row.food_id)) });
});

const updateEntrySchema = z.object({
  mealType: z.enum(MEAL_TYPES).optional(),
  quantity: z.number().positive().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "entryDate must be YYYY-MM-DD").optional(),
  foodId: z.string().optional(),
  customFoodName: z.string().min(1).optional(),
  customCalories: z.number().int().min(0).optional(),
});

// PUT /entries/:id
// Supports editing meal type, quantity, date, and correcting the logged
// food itself: pass `foodId` to switch to a catalog food, or
// `customFoodName`/`customCalories` to switch to (or edit) a custom entry.
router.put("/:id", requireAuth, (req: AuthedRequest, res) => {
  const parsed = updateEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = db
    .prepare("SELECT * FROM meal_entries WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId) as EntryRow | undefined;
  if (!existing) return res.status(404).json({ error: "Entry not found" });

  const { mealType, quantity, entryDate, foodId, customFoodName, customCalories } = parsed.data;

  let nextFoodId = existing.food_id;
  let nextCustomName = existing.custom_food_name;
  let nextCustomCalories = existing.custom_calories;

  if (foodId !== undefined) {
    const food = fetchFood(foodId);
    if (!food) return res.status(404).json({ error: "Food not found" });
    nextFoodId = foodId;
    nextCustomName = null;
    nextCustomCalories = null;
  } else if (customFoodName !== undefined || customCalories !== undefined) {
    nextFoodId = null;
    nextCustomName = customFoodName ?? existing.custom_food_name ?? "Custom food";
    nextCustomCalories = customCalories ?? existing.custom_calories ?? 0;
  }

  const finalMealType = mealType ?? existing.meal_type;
  const finalQuantity = quantity ?? existing.quantity;
  const finalDate = entryDate ?? existing.entry_date;

  db.prepare(
    `UPDATE meal_entries
     SET meal_type = ?, quantity = ?, entry_date = ?, food_id = ?, custom_food_name = ?, custom_calories = ?
     WHERE id = ?`
  ).run(finalMealType, finalQuantity, finalDate, nextFoodId, nextCustomName, nextCustomCalories, existing.id);

  const updated = db.prepare("SELECT * FROM meal_entries WHERE id = ?").get(existing.id) as EntryRow;
  res.json({ entry: toPublicEntry(updated, fetchFood(updated.food_id)) });
});

// DELETE /entries/:id
router.delete("/:id", requireAuth, (req: AuthedRequest, res) => {
  const existing = db
    .prepare("SELECT id FROM meal_entries WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Entry not found" });

  db.prepare("DELETE FROM meal_entries WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

export default router;
