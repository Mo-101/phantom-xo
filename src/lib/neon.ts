import { neon } from "@neondatabase/serverless";

const DATABASE_URL = import.meta.env.VITE_NEON_DATABASE_URL as string | undefined;

if (!DATABASE_URL) {
  console.warn("[neon] VITE_NEON_DATABASE_URL not set");
}

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export async function queryNeon<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!sql) {
    console.warn("[neon] No database connection");
    return [];
  }
  try {
    // neon() expects tagged template usage, but we use the raw query overload
    const result = await sql.call(null, [query] as unknown as TemplateStringsArray, ...params);
    return result as T[];
  } catch (err) {
    console.error("[neon] Query error:", err);
    return [];
  }
}
