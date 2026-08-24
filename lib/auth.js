import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "lykos_session";
const SESSION_DAYS = 30;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random value in your environment."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function createSession({ id, email, name }) {
  const token = await new SignJWT({ id, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Returns { id, email, name } for the signed-in staff user, or null.
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

// Throws if there's no valid staff session. Call at the top of every
// CRM Server Action and CRM page/layout before touching data.
export async function requireStaff() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Throws unless the signed-in user is currently an admin. Checks the role
// fresh from the database rather than trusting the session cookie, so a
// demotion takes effect immediately instead of waiting for the JWT to expire.
export async function requireAdmin() {
  const session = await requireStaff();
  const user = await db.staffUser.findUnique({ where: { id: session.id }, select: { role: true } });
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return session;
}
