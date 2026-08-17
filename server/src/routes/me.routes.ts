import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { calculateCalorieGoal, ActivityLevel, GoalType, Sex } from "../utils/calorieGoal";

const router = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
  target_weight_kg: number | null;
  daily_calorie_goal: number | null;
  daily_protein_goal: number | null;
  daily_carbs_goal: number | null;
  daily_fat_goal: number | null;
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
    dailyProteinGoal: row.daily_protein_goal,
    dailyCarbsGoal: row.daily_carbs_goal,
    dailyFatGoal: row.daily_fat_goal,
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
  dailyProteinGoal: z.number().min(0).max(1000).nullable().optional(),
  dailyCarbsGoal: z.number().min(0).max(1000).nullable().optional(),
  dailyFatGoal: z.number().min(0).max(1000).nullable().optional(),
});

router.put("/goal", requireAuth, (req: AuthedRequest, res) => {
  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow | undefined;
  if (!existing) return res.status(404).json({ error: "User not found" });

  const { dailyCalorieGoal, dailyProteinGoal, dailyCarbsGoal, dailyFatGoal } = parsed.data;

  db.prepare(
    `UPDATE users SET daily_calorie_goal = ?, daily_protein_goal = ?, daily_carbs_goal = ?, daily_fat_goal = ?
     WHERE id = ?`
  ).run(
    dailyCalorieGoal,
    dailyProteinGoal !== undefined ? dailyProteinGoal : existing.daily_protein_goal,
    dailyCarbsGoal !== undefined ? dailyCarbsGoal : existing.daily_carbs_goal,
    dailyFatGoal !== undefined ? dailyFatGoal : existing.daily_fat_goal,
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// PUT /me/password - change password (requires the current password)
router.put("/password", requireAuth, (req: AuthedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as UserRow | undefined;
  if (!existing) return res.status(404).json({ error: "User not found" });

  const { currentPassword, newPassword } = parsed.data;
  if (!bcrypt.compareSync(currentPassword, existing.password_hash)) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, req.userId);

  res.json({ success: true });
});

// DELETE /me - permanently delete the account and all associated data
// (meal entries, custom foods, favorites cascade via ON DELETE CASCADE).
router.delete("/", requireAuth, (req: AuthedRequest, res) => {
  const existing = db.prepare("SELECT id FROM users WHERE id = ?").get(req.userId);
  if (!existing) return res.status(404).json({ error: "User not found" });

  db.prepare("DELETE FROM users WHERE id = ?").run(req.userId);
  res.status(204).send();
});

export default router;
