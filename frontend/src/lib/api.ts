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
    const contentType = res.headers.get("content-type") || "";
    let error: any;
    if (contentType.includes("application/json")) {
      error = await res.json();
    } else {
      const text = await res.text();
      error = { detail: `Error del servidor (${res.status})`, raw: text.slice(0, 200) };
    }
    throw error;
  }

  return res.json();
};

//funcion para un refresh automatico de token
export const downloadBlob = async (endpoint: string): Promise<Blob> => {
  const token = localStorage.getItem("access");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { headers });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      navigateTo("/login");
      throw new Error("Sesión expirada");
    }
    const retry = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (!retry.ok) throw new Error("Error al descargar");
    return retry.blob();
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al descargar (${res.status}): ${text.slice(0, 100)}`);
  }
  return res.blob();
};