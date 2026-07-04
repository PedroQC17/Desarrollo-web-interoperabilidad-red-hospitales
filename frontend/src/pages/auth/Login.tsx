import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, getProfile } from "@/lib/auth";
import { useAuth } from "@/lib/authContext";
import "./auth.css";
import logo from "../../assets/logo-siehc.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showGlobalLoader, hideGlobalLoader } from "@/lib/loader";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rol = searchParams.get("rol") || "";

  const rolLabel: Record<string, string> = {
    paciente:      "👤 Accediendo como Paciente",
    medico:        "🩺 Accediendo como Médico",
    administrador: "⚙️ Accediendo como Administrador",
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const user = await getProfile();

      setUser(user);
      showGlobalLoader();

      if (user.tipo_usuario === "paciente") {
        navigate("/paciente");
      } else if (user.tipo_usuario === "medico") {
        navigate("/medico");
      } else {
        navigate("/admin");
      }

    } catch (err: any) {
      console.error(err);
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <img src={logo} alt="SIEHC" className="auth-panel-logo" />
          <h2>SIEHC</h2>
          <p>Sistema de Integración de Expedientes Hospitalarios Clínicos</p>
          <div className="auth-panel-features">
            <div className="auth-feature"><span className="auth-feature-dot" />Red hospitalaria integrada</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Expedientes clínicos seguros</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Gestión de citas en línea</div>
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-badge">
              {rol && rolLabel[rol] ? rolLabel[rol] : "Bienvenido de vuelta"}
            </div>
            <h1 className="auth-title">Iniciar Sesión</h1>
            <p className="auth-subtitle">Accede a tu cuenta de SIEHC</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-fields">
            <div className="auth-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="auth-field">
              <label>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ paddingRight: "40px", width: "100%" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            </div>
          </div>

          <button className="auth-btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="auth-divider"><span>¿No tienes cuenta?</span></div>

          <button className="auth-btn-secondary" onClick={() => navigate("/register")}>
            Crear una cuenta
          </button>

          <button className="auth-back" onClick={() => navigate("/")}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;