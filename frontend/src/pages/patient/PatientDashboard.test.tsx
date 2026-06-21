import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PatientDashboard from "./PatientDashboard";

const mockUseAuth = vi.fn();
vi.mock("@/lib/authContext", () => ({ useAuth: () => mockUseAuth() }));

const mockApi = vi.fn();
vi.mock("@/lib/api", () => ({ api: (...args: any[]) => mockApi(...args) }));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <PatientDashboard />
    </MemoryRouter>
  );
}

describe("PatientDashboard", () => {
  it("muestra el nombre del usuario en la bienvenida", async () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "María Rojas", email: "maria@test.com", tipo_usuario: "paciente" },
      loading: false,
    });
    mockApi.mockResolvedValue([]);
    renderDashboard();
    expect(await screen.findByText("Bienvenido, María Rojas")).toBeInTheDocument();
  });

  it.skip("muestra las tarjetas de estadisticas despues de cargar datos", async () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Test", email: "t@t.com", tipo_usuario: "paciente" },
      loading: false,
    });
    mockApi.mockImplementation((url: string) => {
      if (url.includes("mis-citas")) return Promise.resolve([{ id: 1, estado: "pendiente" }]);
      if (url.includes("diagnosticos")) return Promise.resolve([]);
      if (url.includes("recetas")) return Promise.resolve([]);
      if (url.includes("facturacion")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    renderDashboard();
    expect(await screen.findByText("Citas Pendientes")).toBeInTheDocument();
    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it.skip("muestra los accesos rapidos", () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Test", email: "t@t.com", tipo_usuario: "paciente" },
      loading: false,
    });
    mockApi.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Solicitar Cita")).toBeInTheDocument();
    expect(screen.getByText("Ver Historial")).toBeInTheDocument();
    expect(screen.getByText("Facturación")).toBeInTheDocument();
  });
});
