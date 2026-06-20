import { api } from "./api";

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

