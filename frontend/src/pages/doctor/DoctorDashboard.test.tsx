import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DoctorDashboard from "./DoctorDashboard";

const mockUseAuth = vi.fn();
vi.mock("@/lib/authContext", () => ({ useAuth: () => mockUseAuth() }));

const mockApi = vi.fn();
vi.mock("@/lib/api", () => ({ api: (...args: any[]) => mockApi(...args) }));

function renderDoctorDashboard() {
  return render(
    <MemoryRouter>
      <DoctorDashboard />
    </MemoryRouter>
  );
}

describe("DoctorDashboard", () => {
  it.skip("renderiza el panel con el nombre del doctor", async () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Luis Fernández", email: "luis@hospital.com", tipo_usuario: "medico" },
      loading: false,
    });
    mockApi.mockResolvedValue([]);
    renderDoctorDashboard();
    expect(await screen.findByText("Bienvenido, Dr. Luis Fernández")).toBeInTheDocument();
  });

  it.skip("muestra las estadisticas del dashboard medico", async () => {
    mockUseAuth.mockReturnValue({
      user: { nombre: "Dr. Test", email: "t@t.com", tipo_usuario: "medico" },
      loading: false,
    });
    mockApi.mockImplementation((url: string) => {
      if (url.includes("citas")) return Promise.resolve([]);
      if (url.includes("diagnosticos")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    renderDoctorDashboard();
    expect(await screen.findByText("Citas por Atender")).toBeInTheDocument();
    expect(await screen.findByText("Pacientes Atendidos")).toBeInTheDocument();
  });
});
