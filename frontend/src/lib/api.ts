const API_URL = "http://127.0.0.1:8000/api";

export const api = async (
  endpoint: string,
  options: RequestInit = {},
  isPublic = false 
) => {
  const token = localStorage.getItem("access");

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (!isPublic && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};