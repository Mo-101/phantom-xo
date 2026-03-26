/**
 * MoStar Phantom XO — Backend Endpoints
 * moscript://codex/v1
 * sass: "All roads lead to Neon now."
 *
 * API endpoint configuration — Supabase removed, Neon direct queries preferred.
 * External API URLs retained for any future server-side proxy.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "");

function pickUrl(explicit: string | undefined, routeName: string): string {
  if (explicit) return explicit;
  if (API_BASE) return `${API_BASE}/${routeName}`;
  // No more Supabase fallback — use Neon direct queries instead
  console.warn(`[endpoints] No URL for ${routeName}. Using Neon direct queries.`);
  return "";
}

export function getTemporalApiUrl(): string {
  return pickUrl(import.meta.env.VITE_API_TEMPORAL_URL as string | undefined, "api-temporal");
}

export function getComputeScoresApiUrl(): string {
  return pickUrl(import.meta.env.VITE_API_COMPUTE_SCORES_URL as string | undefined, "compute-scores");
}

export function getOllamChatApiUrl(): string {
  return pickUrl(import.meta.env.VITE_API_OLLAM_CHAT_URL as string | undefined, "ollam-chat");
}

export function getPhantomMcpApiUrl(): string {
  return pickUrl(import.meta.env.VITE_API_PHANTOM_MCP_URL as string | undefined, "phantom-mcp");
}

/** @deprecated Supabase removed — always returns false */
export function isSupabaseFunctionUrl(_url: string): boolean {
  return false;
}

export function getPublicApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const publicKey = import.meta.env.VITE_API_PUBLIC_KEY as string | undefined;
  if (publicKey) headers["x-api-key"] = publicKey;
  return headers;
}
