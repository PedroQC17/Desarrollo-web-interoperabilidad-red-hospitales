import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar";

function renderNavbar() {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
}

describe("Navbar", () => {
  it("renderiza el logo SIEHC y los botones de autenticacion", () => {
    renderNavbar();
    expect(screen.getByText("SIEHC")).toBeInTheDocument();
    expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
    expect(screen.getByText("Registrarse")).toBeInTheDocument();
  });

  it.skip("renderiza los enlaces de navegacion del menu desktop", () => {
    renderNavbar();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Funcionalidades")).toBeInTheDocument();
    expect(screen.getByText("Hospitales")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();
  });
});
