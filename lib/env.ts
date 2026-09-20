/** Required server configuration. Error messages contain names, never values. */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the server environment.`);
  }
  return value;
}

export function getAuthSecret(): string {
  const secret = requireEnv("AUTH_SECRET");
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return secret;
}
