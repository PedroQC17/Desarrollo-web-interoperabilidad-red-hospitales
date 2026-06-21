import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const mockUseAuth = vi.fn();
vi.mock("@/lib/authContext", () => ({ useAuth: () => mockUseAuth() }));

function renderProtected(rol: "paciente" | "medico" | "admin") {
  return render(
    <MemoryRouter>
      <ProtectedRoute rol={rol}>
        <div>Contenido protegido</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("redirige a /login si no hay usuario autenticado", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderProtected("paciente");
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it.skip("muestra loading mientras se verifica la autenticacion", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderProtected("paciente");
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it.skip("muestra el contenido si el rol coincide", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Test", email: "a@b.com", tipo_usuario: "medico" },
      loading: false,
    });
    renderProtected("medico");
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it.skip("redirige a /login si el rol no coincide", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Test", email: "a@b.com", tipo_usuario: "paciente" },
      loading: false,
    });
    renderProtected("admin");
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });
});
