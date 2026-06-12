// @bos/ai — prompt-cache helper (architecture law #4: workspace context blocks
// are prompt-cached; the state is repetitive, ~90% input savings).
//
// Anthropic prompt caching is a PREFIX match: stable bytes first, the
// cache_control marker on the LAST stable block, volatile content after it.
// A timestamp or per-request id inside the stable block silently kills the
// cache — keep anything that changes per request in `volatile`.

export interface SystemTextBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: "5m" | "1h" };
}

export interface WorkspaceContextInput {
  /**
   * The persona/instructions + workspace context block (aspiration, choices,
   * assumptions, initiative statuses…). Identical bytes across requests for
   * the same workspace state — this is what gets cached.
   */
  stable: string;
  /** Anything that changes per request (today's date, the user's focus). */
  volatile?: string;
  /** Cache TTL — default 5 minutes; use "1h" for slow cadences. */
  ttl?: "5m" | "1h";
}

/**
 * Build the `system` array for an Anthropic call with the workspace context
 * block marked for prompt caching.
 */
export function buildWorkspaceContextSystem(
  input: WorkspaceContextInput,
): SystemTextBlock[] {
  if (!input.stable || input.stable.trim() === "") {
    throw new Error(
      "@bos/ai buildWorkspaceContextSystem: stable context is required — an empty cached block is a misconfiguration",
    );
  }
  const stableBlock: SystemTextBlock = {
    type: "text",
    text: input.stable,
    cache_control:
      input.ttl === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" },
  };
  if (input.volatile && input.volatile.trim() !== "") {
    return [stableBlock, { type: "text", text: input.volatile }];
  }
  return [stableBlock];
}
