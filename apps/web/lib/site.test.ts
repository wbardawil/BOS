import { describe, expect, it } from "vitest";

import { SITE_DESCRIPTION, SITE_NAME } from "./site";

describe("site constants", () => {
  it("carries the decided brand (placeholder until real UI lands)", () => {
    expect(SITE_NAME).toContain("Business Design Shop");
    expect(SITE_DESCRIPTION).toContain("Digital Chief of Staff");
  });
});
