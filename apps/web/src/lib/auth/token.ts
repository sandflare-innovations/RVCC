function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 32 bytes of CSPRNG output, hex encoded. Use for session tokens. */
export function randomToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** SHA-256 of a token, hex encoded. Only the hash is ever stored. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}
