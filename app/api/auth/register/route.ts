export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";

const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await bcrypt.hash(parsed.password, 10);
    db.prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)").run(
      parsed.email,
      parsed.name,
      hash
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
