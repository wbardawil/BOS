import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type BosClient = SupabaseClient<Database>;

export interface AnonClientOptions {
  /**
   * Returns the caller's Clerk session token (Supabase third-party auth).
   * Supabase validates it and RLS policies read auth.jwt()->>'sub'.
   * Returning null means "unauthenticated" — every table denies anon, so
   * such a client can read nothing.
   */
  accessToken: () => Promise<string | null>;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * THE default client (architecture law #1). RLS-bound by construction: it
 * carries the anon API key plus the caller's Clerk JWT, so Postgres — not app
 * code — decides what rows exist.
 */
export function createAnonClient(options: AnonClientOptions): BosClient {
  const url = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    options.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "@bos/db createAnonClient: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (typeof options.accessToken !== "function") {
    throw new Error(
      "@bos/db createAnonClient: accessToken callback is required — the anon client must carry the caller's Clerk JWT",
    );
  }

  return createClient<Database>(url, anonKey, {
    accessToken: options.accessToken,
  });
}

export interface ServiceClientLogEntry {
  event: "service_role_client_created";
  orgId: string;
  reason: string;
  createdAt: string;
}

export interface ServiceClientOptions {
  /**
   * The single org this client is allowed to touch. The service role BYPASSES
   * RLS, so callers must declare scope up front and filter every query by it.
   */
  orgId: string;
  /** Why RLS bypass is needed (e.g. "inngest:weekly-cadence-digest"). Logged. */
  reason: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  logger?: (entry: ServiceClientLogEntry) => void;
}

/**
 * JOBS ONLY (architecture law #1). Never import this in a user-facing path.
 * Requires an explicit orgId + reason and logs every instantiation so RLS
 * bypass is always attributable.
 */
export function createServiceClient(options: ServiceClientOptions): BosClient {
  const url = options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!options.orgId || options.orgId.trim() === "") {
    throw new Error(
      "@bos/db createServiceClient: orgId is required — service-role access must be explicitly org-scoped",
    );
  }
  if (!options.reason || options.reason.trim() === "") {
    throw new Error(
      "@bos/db createServiceClient: reason is required — RLS bypass must be attributable",
    );
  }
  if (!url || !serviceRoleKey) {
    throw new Error(
      "@bos/db createServiceClient: missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const entry: ServiceClientLogEntry = {
    event: "service_role_client_created",
    orgId: options.orgId,
    reason: options.reason,
    createdAt: new Date().toISOString(),
  };
  const log = options.logger ?? defaultServiceLogger;
  log(entry);

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Traceability: shows up in PostgREST/Supabase logs next to the queries.
      headers: { "x-bos-service-org": options.orgId },
    },
  });
}

function defaultServiceLogger(entry: ServiceClientLogEntry): void {
  console.warn(`[@bos/db] ${JSON.stringify(entry)}`);
}
