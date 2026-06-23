import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
  rol: "paciente" | "medico" | "admin";
};

const ProtectedRoute = ({ children, rol }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-muted-foreground">Verificando acceso...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.tipo_usuario !== rol) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;