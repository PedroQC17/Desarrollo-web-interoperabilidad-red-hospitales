import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  rol: "paciente" | "medico" | "admin";
};

const ProtectedRoute = ({ children, rol }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.tipo_usuario !== rol) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;