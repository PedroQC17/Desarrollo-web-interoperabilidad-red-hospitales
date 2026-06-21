import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("mergea clases tailwind correctamente", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resuelve conflictos de tailwind-merge (ultima gana)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("filtra valores falsy", () => {
    expect(cn("px-4", false && "hidden", undefined, null, "py-2")).toBe("px-4 py-2");
  });

  it("acepta arrays", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });
});
