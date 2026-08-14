import { PrismaClient } from "@prisma/client";

const ITERATIONS = 210_000;

async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `pbkdf2$sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

const [email, password, ...nameParts] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run admin:create -- <email> <password> [name]");
  process.exit(1);
}

if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const admin = await prisma.adminUser.create({
    data: {
      email: email.trim().toLowerCase(),
      name: nameParts.join(" ") || email.split("@")[0],
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Created admin ${admin.email}`);
} catch (err) {
  if (err.code === "P2002") {
    console.error(`An admin with email ${email} already exists.`);
    process.exit(1);
  }
  throw err;
} finally {
  await prisma.$disconnect();
}
