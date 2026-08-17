import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { calculateCalorieGoal, ActivityLevel, GoalType, Sex } from "../utils/calorieGoal";

const router = Router();

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  target_weight_kg: number | null;
  daily_calorie_goal: number | null;
  created_at: string;
}

function toPublicUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    age: row.age,
    sex: row.sex,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level,
    goalType: row.goal_type,
    targetWeightKg: row.target_weight_kg,
    dailyCalorieGoal: row.daily_calorie_goal,
    createdAt: row.created_at,
  };
}

router.get("/", requireAuth, (req: AuthedRequest, res) => {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow | undefined;
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json({ user: toPublicUser(row) });
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().min(10).max(120).optional(),
  sex: z.enum(["male", "female"]).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(400).optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  goalType: z.enum(["lose", "maintain", "gain"]).optional(),
  targetWeightKg: z.number().min(20).max(400).optional(),
  recalculateGoal: z.boolean().optional(),
});

router.put("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow | undefined;
  if (!existing) return res.status(404).json({ error: "User not found" });

  const merged = { ...existing, ...mapUpdatesToColumns(parsed.data) };

  let dailyCalorieGoal = existing.daily_calorie_goal;
  const canCalculate =
    merged.sex && merged.age && merged.height_cm && merged.weight_kg && merged.activity_level && merged.goal_type;

  if (parsed.data.recalculateGoal && canCalculate) {
    dailyCalorieGoal = calculateCalorieGoal({
      sex: merged.sex as Sex,
      age: merged.age as number,
      heightCm: merged.height_cm as number,
      weightKg: merged.weight_kg as number,
      activityLevel: merged.activity_level as ActivityLevel,
      goalType: merged.goal_type as GoalType,
    });
  }

  db.prepare(
    `UPDATE users SET name = ?, age = ?, sex = ?, height_cm = ?, weight_kg = ?,
     activity_level = ?, goal_type = ?, target_weight_kg = ?, daily_calorie_goal = ?
     WHERE id = ?`
  ).run(
    merged.name,
    merged.age,
    merged.sex,
    merged.height_cm,
    merged.weight_kg,
    merged.activity_level,
    merged.goal_type,
    merged.target_weight_kg,
    dailyCalorieGoal,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow;
  res.json({ user: toPublicUser(updated) });
});

const updateGoalSchema = z.object({
  dailyCalorieGoal: z.number().int().min(800).max(10000),
});

router.put("/goal", requireAuth, (req: AuthedRequest, res) => {
  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  db.prepare("UPDATE users SET daily_calorie_goal = ? WHERE id = ?").run(
    parsed.data.dailyCalorieGoal,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow;
  res.json({ user: toPublicUser(updated) });
});

function mapUpdatesToColumns(data: z.infer<typeof updateProfileSchema>) {
  const columns: Record<string, unknown> = {
    name: data.name,
    age: data.age,
    sex: data.sex,
    height_cm: data.heightCm,
    weight_kg: data.weightKg,
    activity_level: data.activityLevel,
    goal_type: data.goalType,
    target_weight_kg: data.targetWeightKg,
  };
  // Drop undefined entries so spreading over `existing` doesn't null out
  // fields the caller didn't intend to change.
  for (const key of Object.keys(columns)) {
    if (columns[key] === undefined) delete columns[key];
  }
  return columns;
}

export default router;
