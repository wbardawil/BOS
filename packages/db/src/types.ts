// Hand-written DB types for migration 0001 (tenancy). When the schema grows,
// regenerate with `supabase gen types typescript --local` and reconcile.

export type OrgKind = "practice" | "company";

export type MembershipRole =
  | "owner"
  | "consultant"
  | "executive"
  | "contributor"
  | "viewer";

export type OrganizationRow = {
  id: string;
  name: string;
  kind: OrgKind;
  stripe_customer_id: string | null;
  created_at: string;
}

export type MembershipRow = {
  org_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
}

export type WorkspaceRow = {
  id: string;
  org_id: string;
  client_name: string;
  created_at: string;
  archived_at: string | null;
}

export type UsageLedgerStatus = "success" | "error";

export type UsageLedgerRow = {
  id: string;
  org_id: string;
  workspace_id: string | null;
  action: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
  status: UsageLedgerStatus;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: {
          id?: string;
          name: string;
          kind?: OrgKind;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          kind?: OrgKind;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: MembershipRow;
        Insert: {
          org_id: string;
          user_id: string;
          role: MembershipRole;
          created_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: MembershipRole;
          created_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: WorkspaceRow;
        Insert: {
          id?: string;
          org_id: string;
          client_name: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          client_name?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      usage_ledger: {
        Row: UsageLedgerRow;
        Insert: {
          id?: string;
          org_id: string;
          workspace_id?: string | null;
          action: string;
          model: string;
          tokens_in?: number;
          tokens_out?: number;
          cost_cents?: number;
          status?: UsageLedgerStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          workspace_id?: string | null;
          action?: string;
          model?: string;
          tokens_in?: number;
          tokens_out?: number;
          cost_cents?: number;
          status?: UsageLedgerStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { org_name: string; org_kind?: OrgKind };
        Returns: OrganizationRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
