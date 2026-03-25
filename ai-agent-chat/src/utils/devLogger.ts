const warnedKeys = new Set<string>();

function isDevEnv(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function warnDevOnce(key: string, message: string): void {
  if (!isDevEnv()) return;
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
}

