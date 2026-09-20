import bcrypt from "bcryptjs";

// Cost factor 12: the current recommended minimum. Higher costs slow down
// brute-force attempts but also slow down every real login — 12 is the
// standard balance.
const SALT_ROUNDS = 12;

export function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export function verifyPassword(plainTextPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hash);
}
