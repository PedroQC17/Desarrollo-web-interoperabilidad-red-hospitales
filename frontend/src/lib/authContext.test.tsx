import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./authContext";

const mockGetProfile = vi.fn();
vi.mock("./auth", () => ({ getProfile: (...args: any[]) => mockGetProfile(...args) }));

function TestComponent() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user</div>;
  return <div>{user.nombre} - {user.email} - {user.tipo_usuario}</div>;
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthProvider", () => {
  it.skip("muestra loading mientras no hay token", () => {
    renderWithProvider();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it.skip("carga el perfil si hay token en localStorage", async () => {
    localStorage.setItem("access", "some_token");
    mockGetProfile.mockResolvedValue({
      nombre: "Juan Pérez",
      email: "juan@test.com",
      tipo_usuario: "paciente",
    });
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByText("Juan Pérez - juan@test.com - paciente")).toBeInTheDocument();
    });
  });

  it.skip("muestra No user si el token es invalido", async () => {
    localStorage.setItem("access", "bad_token");
    mockGetProfile.mockRejectedValue(new Error("Invalid token"));
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByText("No user")).toBeInTheDocument();
    });
  });
});
