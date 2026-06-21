import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockNavigateTo = vi.fn();
vi.mock("./navigate", () => ({ navigateTo: (...args: any[]) => mockNavigateTo(...args) }));

const mockRefreshAccessToken = vi.fn();
vi.mock("./auth", () => ({ refreshAccessToken: (...args: any[]) => mockRefreshAccessToken(...args) }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("api", () => {
  it("agrega header Authorization Bearer cuando hay token", async () => {
    localStorage.setItem("access", "my_token");
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    });
    await api("/test/");
    const call = mockFetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBe("Bearer my_token");
  });

  it.skip("no agrega Authorization si es endpoint publico", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await api("/public/", {}, true);
    const call = mockFetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBeUndefined();
  });

  it.skip("lanza error si la respuesta no es ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Error" }),
    });
    await expect(api("/fail/")).rejects.toEqual({ detail: "Error" });
  });

  it.skip("intenta refrescar el token en 401 y reintenta la peticion", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ status: 401, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: "retry_ok" }) });
    });
    mockRefreshAccessToken.mockResolvedValue("new_token");
    localStorage.setItem("access", "old_token");
    const result = await api("/test/");
    expect(result).toEqual({ data: "retry_ok" });
    expect(localStorage.getItem("access")).toBe("new_token");
  });

  it.skip("redirige a /login si el refresh falla en 401", async () => {
    mockFetch.mockResolvedValue({ status: 401, json: () => Promise.resolve({}) });
    mockRefreshAccessToken.mockResolvedValue(null);
    localStorage.setItem("access", "old_token");
    await expect(api("/test/")).rejects.toThrow("Sesión expirada");
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
  });
});
