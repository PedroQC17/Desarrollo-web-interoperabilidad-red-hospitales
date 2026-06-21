import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

const mockUseAuth = vi.fn();
vi.mock("@/lib/authContext", () => ({ useAuth: () => mockUseAuth() }));

function renderAdminDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
}

describe("AdminDashboard", () => {
  it.skip("muestra el nombre del administrador en la bienvenida", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Rodrigo Morales", email: "rodrigo@siehc.com", tipo_usuario: "admin" },
      loading: false,
    });
    renderAdminDashboard();
    expect(screen.getByText("Bienvenido, Rodrigo Morales")).toBeInTheDocument();
  });

  it.skip("renderiza las tarjetas de estadisticas del sistema", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Admin", email: "a@s.com", tipo_usuario: "admin" },
      loading: false,
    });
    renderAdminDashboard();
    expect(screen.getByText("Hospitales en Red")).toBeInTheDocument();
    expect(screen.getByText("Usuarios Activos")).toBeInTheDocument();
    expect(screen.getByText("Ventas del Mes")).toBeInTheDocument();
    expect(screen.getByText("Citas Atendidas")).toBeInTheDocument();
  });

  it.skip("muestra el ranking de hospitales con mayor actividad", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Admin", email: "a@s.com", tipo_usuario: "admin" },
      loading: false,
    });
    renderAdminDashboard();
    expect(screen.getByText("Hospitales con Mayor Actividad")).toBeInTheDocument();
    expect(screen.getByText("Hospital Nacional Loayza")).toBeInTheDocument();
  });
});
