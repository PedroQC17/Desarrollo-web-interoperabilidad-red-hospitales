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
export const updateProfile = async (data: Record<string, any>) => {
  return api("/usuarios/profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const uploadProfilePhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("foto", file);
  return api("/usuarios/profile/photo/", {
    method: "POST",
    body: formData,
  });
};

export const deleteProfilePhoto = async () => {
  return api("/usuarios/profile/photo/", {
    method: "DELETE",
  });
};

export const getNotifPrefs = async () => {
  return api("/usuarios/profile/notificaciones/");
};

export const updateNotifPrefs = async (data: Record<string, boolean>) => {
  return api("/usuarios/profile/notificaciones/", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

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