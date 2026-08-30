export function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('replace_with_')) {
    throw new Error(`${name} must be explicitly configured`);
  }
  return value;
}
