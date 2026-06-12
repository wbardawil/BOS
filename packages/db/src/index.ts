// @bos/db — typed client factories. THE TWO-CLIENT LAW (see README.md):
// anonClient is the default everywhere; serviceClient only inside jobs, with an
// explicit orgId and a logged reason. Never bypass RLS in a user-facing path.

export {
  createAnonClient,
  createServiceClient,
  type AnonClientOptions,
  type BosClient,
  type ServiceClientLogEntry,
  type ServiceClientOptions,
} from "./clients";

export type {
  Database,
  MembershipRole,
  MembershipRow,
  OrganizationRow,
  OrgKind,
  UsageLedgerRow,
  UsageLedgerStatus,
  WorkspaceRow,
} from "./types";

export const PACKAGE_NAME = "@bos/db" as const;
