import { describe, expect, it } from "vitest";

import { PACKAGE_NAME } from "./index";

describe("@bos/db", () => {
  it("exports its package name (placeholder until real extraction lands)", () => {
    expect(PACKAGE_NAME).toBe("@bos/db");
  });
});
