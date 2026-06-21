import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";

vi.mock("@/lib/auth", () => ({ login: vi.fn(), getProfile: vi.fn() }));
vi.mock("@/lib/authContext", () => ({ useAuth: () => ({ setUser: vi.fn() }) }));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>
  );
}

describe("Login", () => {
  it("renderiza los campos de email y password y el titulo", () => {
    renderLogin();
    expect(screen.getAllByText("Iniciar Sesión").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("correo@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Crear una cuenta")).toBeInTheDocument();
  });

  it.skip("muestra mensaje de error si se intenta enviar vacio", async () => {
    renderLogin();
    const { default: userEvent } = await import("@testing-library/user-event");
    const btn = screen.getByText("Iniciar Sesión");
    await userEvent.click(btn);
    expect(screen.getByText("Por favor completa todos los campos.")).toBeInTheDocument();
  });
});
