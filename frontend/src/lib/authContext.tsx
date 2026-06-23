import { createContext, useContext, useEffect, useState } from "react";
import { getProfile } from "./auth";
import { hideGlobalLoader } from "./loader";

type User = {
  email: string;
  nombre: string;
  tipo_usuario: "paciente" | "medico" | "admin";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setLoading(false);
      hideGlobalLoader();
      return;
    }
    getProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        setLoading(false);
        hideGlobalLoader();
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);