import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";

vi.mock("@/lib/auth", () => ({ register: vi.fn(), getProfile: vi.fn() }));
vi.mock("@/lib/authContext", () => ({ useAuth: () => ({ setUser: vi.fn() }) }));
vi.mock("../../assets/logo-siehc.png", () => ({ default: "logo.png" }));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe("Register", () => {
  it("renderiza el formulario de registro con todos los campos", () => {
    renderRegister();
    expect(screen.getAllByText("Crear Cuenta").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("correo@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
    expect(screen.getByText("Fecha de nacimiento")).toBeInTheDocument();
    expect(screen.getByText("Género")).toBeInTheDocument();
    expect(screen.getByText("Tipo de usuario")).toBeInTheDocument();
    expect(screen.getAllByText("Crear Cuenta").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra error si el email no termina en .com al hacer submit", async () => {
    renderRegister();
    const { default: userEvent } = await import("@testing-library/user-event");
    const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
    await userEvent.type(emailInput, "correo@gmail.net");
    const btn = screen.getByRole("button", { name: /Crear Cuenta/i });
    await userEvent.click(btn);
    expect(screen.getByText("El correo debe tener '@' y terminar en '.com'.")).toBeInTheDocument();
  });

  it("muestra error si la contrasena es menor a 8 caracteres", async () => {
    renderRegister();
    const { default: userEvent } = await import("@testing-library/user-event");
    const nombreInput = screen.getByPlaceholderText("Juan Pérez");
    await userEvent.type(nombreInput, "Juan Pérez");
    const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
    await userEvent.type(emailInput, "juan@test.com");
    const passwordInput = screen.getByPlaceholderText("Mínimo 8 caracteres");
    await userEvent.type(passwordInput, "Abc12");
    const btn = screen.getByRole("button", { name: /Crear Cuenta/i });
    await userEvent.click(btn);
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeInTheDocument();
  });

  it.skip("muestra error si el nombre esta vacio", async () => {
    renderRegister();
    const { default: userEvent } = await import("@testing-library/user-event");
    const btn = screen.getByRole("button", { name: /Crear Cuenta/i });
    await userEvent.click(btn);
    expect(screen.getByText("El nombre completo es obligatorio.")).toBeInTheDocument();
  });

  it.skip("muestra error si el telefono tiene menos de 9 digitos", async () => {
    renderRegister();
    const { default: userEvent } = await import("@testing-library/user-event");
    const nombreInput = screen.getByPlaceholderText("Juan Pérez");
    await userEvent.type(nombreInput, "Juan Pérez");
    const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
    await userEvent.type(emailInput, "juan@test.com");
    const passwordInput = screen.getByPlaceholderText("Mínimo 8 caracteres");
    await userEvent.type(passwordInput, "Password123");
    const telefonoInput = screen.getByPlaceholderText("999999999");
    await userEvent.type(telefonoInput, "123");
    const btn = screen.getByRole("button", { name: /Crear Cuenta/i });
    await userEvent.click(btn);
    expect(screen.getByText("El teléfono debe tener exactamente 9 dígitos.")).toBeInTheDocument();
  });

  it.skip("muestra error si la fecha de nacimiento es menor a 18 años", async () => {
    renderRegister();
    const { default: userEvent } = await import("@testing-library/user-event");
    const nombreInput = screen.getByPlaceholderText("Juan Pérez");
    await userEvent.type(nombreInput, "Juan Pérez");
    const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
    await userEvent.type(emailInput, "juan@test.com");
    const passwordInput = screen.getByPlaceholderText("Mínimo 8 caracteres");
    await userEvent.type(passwordInput, "Password123");
    const telefonoInput = screen.getByPlaceholderText("999999999");
    await userEvent.type(telefonoInput, "999888777");
    const fechaInput = screen.getByLabelText("Fecha de nacimiento");
    await userEvent.type(fechaInput, "2023-01-01");
    const btn = screen.getByRole("button", { name: /Crear Cuenta/i });
    await userEvent.click(btn);
    expect(screen.getByText(/Debes tener al menos 18 años/)).toBeInTheDocument();
  });
});
