import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAnonClient,
  createServiceClient,
  type ServiceClientLogEntry,
} from "./clients";

const FAKE_URL = "https://fictional-project.supabase.co";
const FAKE_ANON_KEY = "eyJhbGciOiJIUzI1NiJ9.fictional-anon-key";
const FAKE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiJ9.fictional-service-role-key";
const noToken = async () => null;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createAnonClient", () => {
  it("throws when Supabase URL / anon key are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => createAnonClient({ accessToken: noToken })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("throws when the accessToken callback is missing — anon client must carry the Clerk JWT", () => {
    expect(() =>
      createAnonClient({
        supabaseUrl: FAKE_URL,
        supabaseAnonKey: FAKE_ANON_KEY,
        // deliberate misuse: an untyped caller forgetting the callback
        accessToken: undefined as unknown as () => Promise<string | null>,
      }),
    ).toThrow(/accessToken/);
  });

  it("builds a client from explicit options", () => {
    const client = createAnonClient({
      supabaseUrl: FAKE_URL,
      supabaseAnonKey: FAKE_ANON_KEY,
      accessToken: noToken,
    });
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("falls back to NEXT_PUBLIC_* env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", FAKE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", FAKE_ANON_KEY);
    const client = createAnonClient({ accessToken: noToken });
    expect(typeof client.from).toBe("function");
  });
});

describe("createServiceClient", () => {
  const base = {
    supabaseUrl: FAKE_URL,
    serviceRoleKey: FAKE_SERVICE_KEY,
    logger: () => {},
  };

  it("throws without an explicit orgId — service role must be org-scoped", () => {
    expect(() =>
      createServiceClient({ ...base, orgId: "", reason: "test" }),
    ).toThrow(/orgId/);
  });

  it("throws without a reason — RLS bypass must be attributable", () => {
    expect(() =>
      createServiceClient({ ...base, orgId: "org_123", reason: "  " }),
    ).toThrow(/reason/);
  });

  it("throws when the service-role key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() =>
      createServiceClient({ orgId: "org_123", reason: "test", logger: () => {} }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("logs every instantiation with orgId and reason", () => {
    const entries: ServiceClientLogEntry[] = [];
    createServiceClient({
      ...base,
      orgId: "org_123",
      reason: "inngest:fictional-job",
      logger: (entry) => entries.push(entry),
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: "service_role_client_created",
      orgId: "org_123",
      reason: "inngest:fictional-job",
    });
    expect(entries[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns a usable client when fully specified", () => {
    const client = createServiceClient({
      ...base,
      orgId: "org_123",
      reason: "inngest:fictional-job",
    });
    expect(typeof client.from).toBe("function");
  });
});
