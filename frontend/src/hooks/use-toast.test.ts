import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "./use-toast";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("use-toast", () => {
  it.skip("muestra un toast con el mensaje y titulo proporcionados", () => {
    const result = toast({ title: "Éxito", description: "Operación completada" });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it.skip("descarta el toast si se llama a dismiss", () => {
    const { id, dismiss } = toast({ title: "Test" });
    dismiss();
    expect(id).toBeDefined();
  });
});
