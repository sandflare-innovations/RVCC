import { type ScryptOptions, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/*
 * Hand-rolled rather than promisify(): promisify resolves to the 3-argument
 * scrypt overload and silently drops the options object.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) =>
      err ? reject(err) : resolve(derived)
    );
  });
}

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

/** Encoded as `scrypt$N$r$p$salt$hash` so cost can be raised later. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(plain.normalize("NFKC"), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const params = { N: Number(nStr), r: Number(rStr), p: Number(pStr) };
  if (!Number.isFinite(params.N) || !Number.isFinite(params.r) || !Number.isFinite(params.p)) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  let derived: Buffer;
  try {
    derived = await scrypt(
      plain.normalize("NFKC"),
      Buffer.from(saltHex, "hex"),
      expected.length,
      params
    );
  } catch {
    return false;
  }

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Initial vendor credentials. Avoids look-alike characters (0/O, 1/l/I). */
export function generateTempPassword(length = 14): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
