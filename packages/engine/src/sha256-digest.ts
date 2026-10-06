import { sha256 } from "@noble/hashes/sha2.js";

/** Content identities also work in HTTP panels where SubtleCrypto is unavailable. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  const digest = subtle
    ? new Uint8Array(await subtle.digest("SHA-256", new Uint8Array(bytes).buffer))
    : sha256(bytes);
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
