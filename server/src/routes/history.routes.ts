import { Router } from "express";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

interface DaySummaryRow {
  entry_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

interface UserRow {
  daily_calorie_goal: number | null;
}

// GET /history - list of previous days with totals
router.get("/", requireAuth, (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT daily_calorie_goal FROM users WHERE id = ?").get(req.userId) as
    | UserRow
    | undefined;
  const goal = user?.daily_calorie_goal ?? null;

  const rows = db
    .prepare(
      `SELECT me.entry_date as entry_date,
              SUM(COALESCE(f.calories, me.custom_calories, 0) * me.quantity) as total_calories,
              SUM(COALESCE(f.protein_g, 0) * me.quantity) as total_protein,
              SUM(COALESCE(f.carbs_g, 0) * me.quantity) as total_carbs,
              SUM(COALESCE(f.fat_g, 0) * me.quantity) as total_fat
       FROM meal_entries me
       LEFT JOIN foods f ON f.id = me.food_id
       WHERE me.user_id = ?
       GROUP BY me.entry_date
       ORDER BY me.entry_date DESC`
    )
    .all(req.userId) as DaySummaryRow[];

  const days = rows.map((row) => {
    const total = Math.round(row.total_calories);
    return {
      date: row.entry_date,
      totalCalories: total,
      totalProteinG: roundMacro(row.total_protein),
      totalCarbsG: roundMacro(row.total_carbs),
      totalFatG: roundMacro(row.total_fat),
      calorieGoal: goal,
      remainingCalories: goal !== null ? goal - total : null,
      overGoal: goal !== null ? total > goal : null,
    };
  });

  res.json({ days });
});

// GET /history/:date - detail for a single day
router.get("/:date", requireAuth, (req: AuthedRequest, res) => {
  const { date } = req.params;

  const user = db.prepare("SELECT daily_calorie_goal FROM users WHERE id = ?").get(req.userId) as
    | UserRow
    | undefined;
  const goal = user?.daily_calorie_goal ?? null;

  const rows = db
    .prepare(
      `SELECT me.*, f.name as food_name, f.calories as food_calories,
              f.serving_size as serving_size, f.serving_unit as serving_unit,
              f.protein_g as protein_g, f.carbs_g as carbs_g, f.fat_g as fat_g
       FROM meal_entries me
       LEFT JOIN foods f ON f.id = me.food_id
       WHERE me.user_id = ? AND me.entry_date = ?
       ORDER BY me.created_at ASC`
    )
    .all(req.userId, date) as Array<{
    id: string;
    meal_type: string;
    quantity: number;
    food_id: string | null;
    custom_food_name: string | null;
    custom_calories: number | null;
    food_name: string | null;
    food_calories: number | null;
    serving_size: number | null;
    serving_unit: string | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  }>;

  const entries = rows.map((row) => {
    const caloriesPerServing = row.food_calories ?? row.custom_calories ?? 0;
    const hasMacros = row.food_id !== null;
    return {
      id: row.id,
      foodId: row.food_id,
      foodName: row.food_name ?? row.custom_food_name ?? "Unknown food",
      mealType: row.meal_type,
      quantity: row.quantity,
      servingSize: row.serving_size ?? 1,
      servingUnit: row.serving_unit ?? "serving",
      calories: Math.round(caloriesPerServing * row.quantity),
      proteinG: hasMacros ? roundMacro((row.protein_g ?? 0) * row.quantity) : null,
      carbsG: hasMacros ? roundMacro((row.carbs_g ?? 0) * row.quantity) : null,
      fatG: hasMacros ? roundMacro((row.fat_g ?? 0) * row.quantity) : null,
    };
  });

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProteinG = roundMacro(entries.reduce((sum, e) => sum + (e.proteinG ?? 0), 0));
  const totalCarbsG = roundMacro(entries.reduce((sum, e) => sum + (e.carbsG ?? 0), 0));
  const totalFatG = roundMacro(entries.reduce((sum, e) => sum + (e.fatG ?? 0), 0));

  res.json({
    date,
    totalCalories,
    totalProteinG,
    totalCarbsG,
    totalFatG,
    calorieGoal: goal,
    remainingCalories: goal !== null ? goal - totalCalories : null,
    entries,
  });
});

export default router;
