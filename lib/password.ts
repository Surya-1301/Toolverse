import crypto from "crypto";

const secret = process.env.PASTE_PASSWORD_SECRET || "ToolverseX-local-secret";

export function hashEditPassword(password: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(password)
    .digest("hex");
}

export function verifyEditPassword(
  password: string,
  hash: string | null | undefined
) {
  if (!hash) return true;

  const inputHash = hashEditPassword(password);

  const inputBuffer = Buffer.from(inputHash);
  const hashBuffer = Buffer.from(hash);

  if (inputBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, hashBuffer);
}