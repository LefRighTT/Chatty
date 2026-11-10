import crypto from "crypto";

// 32 characters, no 0/O or 1/I, so codes are easy to read aloud and type.
// 256 % 32 === 0, so picking by byte value has no modulo bias.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
