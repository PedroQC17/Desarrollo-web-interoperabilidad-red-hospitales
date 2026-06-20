import { api } from "./api";
import config from "@/config/env";

export const login = async (email: string, password: string) => {
  const data = await api("/usuarios/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, true); // 👈 público

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
};

export const register = async (payload: any) => {
  const data = await api("/usuarios/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true); // 👈 público

  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);

  return data;
};
export const getProfile = async () => {
  return api("/usuarios/profile/");
};

export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

// Renueva el access token usando el refresh token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(`${config.api.baseUrl}/usuarios/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem("access", data.access);
    return data.access;
  } catch {
    return null;
  }
};