import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { generateId } from "../utils/id";
import { signToken } from "../utils/jwt";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

router.post("/signup", (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password, name } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const id = generateId();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`
  ).run(id, email, passwordHash, name ?? null);

  const token = signToken({ userId: id });
  res.status(201).json({ token, user: { id, email, name: name ?? null } });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string; email: string; name: string | null }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Stateless JWT auth: nothing to invalidate server-side for MVP.
// Client is responsible for discarding the token.
router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
