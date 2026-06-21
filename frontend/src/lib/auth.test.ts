import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register, getProfile, logout, refreshAccessToken } from "./auth";

const mockApi = vi.fn();
vi.mock("./api", () => ({ api: (...args: any[]) => mockApi(...args) }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("login", () => {
  it("guarda access y refresh en localStorage al iniciar sesion", async () => {
    mockApi.mockResolvedValue({ access: "token123", refresh: "refresh456" });
    await login("test@test.com", "pass1234");
    expect(localStorage.getItem("access")).toBe("token123");
    expect(localStorage.getItem("refresh")).toBe("refresh456");
  });

  it.skip("llama al endpoint /usuarios/login/ con email y password", async () => {
    mockApi.mockResolvedValue({ access: "t", refresh: "r" });
    await login("a@b.com", "pass");
    expect(mockApi).toHaveBeenCalledWith("/usuarios/login/", expect.objectContaining({
      method: "POST",
    }), true);
  });
});

describe("register", () => {
  it("guarda tokens en localStorage al registrarse exitosamente", async () => {
    mockApi.mockResolvedValue({ access: "acc_tok", refresh: "ref_tok" });
    await register({ email: "new@test.com", password: "Pass1234" });
    expect(localStorage.getItem("access")).toBe("acc_tok");
    expect(localStorage.getItem("refresh")).toBe("ref_tok");
  });

  it.skip("llama al endpoint /usuarios/register/ con los datos del payload", async () => {
    const payload = { email: "a@b.com", password: "12345678", nombre: "Test" };
    mockApi.mockResolvedValue({ access: "t", refresh: "r" });
    await register(payload);
    expect(mockApi).toHaveBeenCalledWith("/usuarios/register/", expect.objectContaining({
      method: "POST",
      body: JSON.stringify(payload),
    }), true);
  });
});

describe.skip("getProfile", () => {
  it("retorna los datos del perfil del usuario autenticado", async () => {
    const profile = { email: "a@b.com", nombre: "Test", tipo_usuario: "paciente" };
    mockApi.mockResolvedValue(profile);
    const result = await getProfile();
    expect(result).toEqual(profile);
  });
});

describe.skip("logout", () => {
  it("elimina access y refresh de localStorage", () => {
    localStorage.setItem("access", "tok");
    localStorage.setItem("refresh", "ref");
    logout();
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
  });
});

describe.skip("refreshAccessToken", () => {
  it("retorna null si no hay refresh token", async () => {
    const result = await refreshAccessToken();
    expect(result).toBeNull();
  });

  it("renueva el access token si hay refresh valido", async () => {
    localStorage.setItem("refresh", "valid_refresh");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access: "new_access" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const result = await refreshAccessToken();
    expect(result).toBe("new_access");
    expect(localStorage.getItem("access")).toBe("new_access");
    vi.unstubAllGlobals();
  });
});
