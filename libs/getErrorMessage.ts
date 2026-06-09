// Extracts a human-readable message from anything thrown — Error instances,
// Supabase PostgrestErrors ({ message, details, hint, code }), or plain values.
// Supabase errors are NOT Error instances, so an `instanceof Error` check alone
// misses them and they serialize to "{}" in the console.
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const e = error as { message?: unknown; details?: unknown };
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.details === "string" && e.details) return e.details;
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }

  return "Something went wrong.";
}
