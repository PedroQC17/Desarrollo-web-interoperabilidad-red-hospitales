import { refreshAccessToken } from "./auth";
import config from "@/config/env";
import { navigateTo } from "./navigate";

const API_URL = config.api.baseUrl;

// Variable para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const api = async (
  endpoint: string,
  options: RequestInit = {},
  isPublic = false
): Promise<any> => {
  const token = localStorage.getItem("access");

  const headers: any = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (!isPublic && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // ── Si el token expiró (401), intentar renovarlo ──────────────────────
  if (res.status === 401 && !isPublic) {

    // Si ya hay un refresco en curso, esperar al mismo (no hacer dos llamadas)
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (!newToken) {
      // Refresh falló → limpiar sesión y redirigir al login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigateTo("/login");
      throw new Error("Sesión expirada. Por favor inicia sesión de nuevo.");
    }

    // Reintentar la petición original con el nuevo token
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };

    const retry = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: retryHeaders,
    });

    if (!retry.ok) {
      const error = await retry.json();
      throw error;
    }

    return retry.json();
  }
  // ──────────────────────────────────────────────────────────────────────

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};