import { defineConfig } from "@playwright/test";

// Adversarial RLS suite (architecture law #1). API-only — no browser binaries
// needed. Requires a running local Supabase stack: `pnpm exec supabase start`.
export default defineConfig({
  testDir: "./rls",
  globalSetup: "./rls/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
});
