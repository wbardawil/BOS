import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface LocalStack {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..", "..");
const CACHE_FILE = resolve(HERE, ".local-stack.json");

// Well-known supabase-cli local development defaults (public demo values, not
// secrets) — used only if `supabase status` cannot be parsed.
const LOCAL_DEFAULTS: LocalStack = {
  url: "http://127.0.0.1:54321",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  serviceRoleKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
  jwtSecret: "super-secret-jwt-token-with-at-least-32-characters-long",
};

function parseEnvOutput(output: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of output.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)="?([^"]*)"?\s*$/.exec(line.trim());
    if (match && match[1] && match[2] !== undefined) {
      map.set(match[1], match[2]);
    }
  }
  return map;
}

function pick(map: Map<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = map.get(key);
    if (value) return value;
  }
  return undefined;
}

/** Resolve the running local stack via `supabase status` and cache to disk. */
export function resolveLocalStack(): LocalStack {
  let output: string;
  try {
    output = execSync("pnpm exec supabase status -o env", {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    throw new Error(
      "Could not read local Supabase status. Is the stack running? Start it with `pnpm exec supabase start` (requires Docker).\n" +
        String(error),
    );
  }

  const env = parseEnvOutput(output);
  const stack: LocalStack = {
    url: pick(env, "API_URL", "SUPABASE_URL") ?? LOCAL_DEFAULTS.url,
    anonKey: pick(env, "ANON_KEY", "SUPABASE_ANON_KEY") ?? LOCAL_DEFAULTS.anonKey,
    serviceRoleKey:
      pick(env, "SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY") ??
      LOCAL_DEFAULTS.serviceRoleKey,
    jwtSecret: pick(env, "JWT_SECRET") ?? LOCAL_DEFAULTS.jwtSecret,
  };
  writeFileSync(CACHE_FILE, JSON.stringify(stack, null, 2));
  return stack;
}

/** Read the stack info cached by global-setup (specs run in worker processes). */
export function readCachedStack(): LocalStack {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf8")) as LocalStack;
  } catch {
    throw new Error(
      "rls/.local-stack.json missing — global-setup did not run. Run the suite via `pnpm test:rls`.",
    );
  }
}

// ── Fixed fixture identities (obviously fictional — confidentiality law) ─────

export const ORG_A = "11111111-1111-4111-8111-111111111111";
export const ORG_B = "22222222-2222-4222-8222-222222222222";
export const WS_A = "33333333-3333-4333-8333-333333333333";
export const WS_B = "44444444-4444-4444-8444-444444444444";

export const USER_A = "user_rls_suite_alpha"; // owner of ORG_A
export const USER_B = "user_rls_suite_bravo"; // owner of ORG_B
export const VIEWER_A = "user_rls_suite_viewer"; // viewer in ORG_A (read-only role)
export const OUTSIDER = "user_rls_suite_outsider"; // authenticated, member of nothing
