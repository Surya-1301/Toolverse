export const expiryOptions: Record<string, number | null> = {
  never: null,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function getExpiresAt(expiry: string) {
  if (!(expiry in expiryOptions)) {
    return {
      error: "Invalid expiry option.",
      expiresAt: null,
    };
  }

  const expiresIn = expiryOptions[expiry];

  return {
    error: "",
    expiresAt:
      expiresIn === null
        ? null
        : new Date(Date.now() + expiresIn).toISOString(),
  };
}

export function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}