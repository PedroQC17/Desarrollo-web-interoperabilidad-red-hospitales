import { useState } from "react";
import { register, getProfile } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import logo from "../../assets/logo-siehc.png";

function Register() {
  const navigate = useNavigate();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    telecom: "",
    genero: "",
    fec_nac: "",
    tipo_usuario: "paciente",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { email, password, nombre, telecom, genero, fec_nac } = form;

    if (!email || !password || !nombre || !telecom || !genero || !fec_nac) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 🔥 REGISTRO REAL
      await register(form);

      // 🔥 TRAER PERFIL (desde backend)
      const user = await getProfile();

      // 🔥 REDIRECCIÓN SEGÚN ROL REAL
      if (user.tipo_usuario === "paciente") {
        navigate("/paciente");
      } else if (user.tipo_usuario === "medico") {
        navigate("/medico");
      } else {
        navigate("/admin");
      }

    } catch (err: any) {
      console.error(err);
      setError("Error en el registro. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Panel izquierdo */}
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <img src={logo} alt="SIEHC" className="auth-panel-logo" />
          <h2>SIEHC</h2>
          <p>Sistema de Integración de Expedientes Hospitalarios Clínicos</p>

          <div className="auth-panel-features">
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Crea tu historial médico
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Agenda citas en la red
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Acceso seguro y protegido
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="auth-panel-right">
        <div className="auth-card auth-card-register">

          {/* Header */}
          <div className="auth-card-header">
            <div className="auth-badge">Nuevo en SIEHC</div>
            <h1 className="auth-title">Crear Cuenta</h1>
            <p className="auth-subtitle">Completa tus datos para registrarte</p>
          </div>

          {/* Error */}
          {error && <div className="auth-error">{error}</div>}

          {/* Campos */}
          <div className="auth-fields auth-fields-grid">

            <div className="auth-field auth-field-full">
              <label>Nombre completo</label>
              <input name="nombre" placeholder="Juan Pérez" onChange={handleChange} />
            </div>

            <div className="auth-field auth-field-full">
              <label>Correo electrónico</label>
              <input name="email" type="email" placeholder="correo@ejemplo.com" onChange={handleChange} />
            </div>

            <div className="auth-field auth-field-full">
              <label>Contraseña</label>
              <input name="password" type="password" placeholder="••••••••" onChange={handleChange} />
            </div>

            <div className="auth-field">
              <label>Teléfono</label>
              <input name="telecom" placeholder="+51 999 999 999" onChange={handleChange} />
            </div>

            <div className="auth-field">
              <label>Fecha de nacimiento</label>
              <input name="fec_nac" type="date" onChange={handleChange} />
            </div>

            <div className="auth-field">
              <label>Género</label>
              <select name="genero" onChange={handleChange} className="auth-select">
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>

            <div className="auth-field">
              <label>Tipo de usuario</label>
              <select name="tipo_usuario" onChange={handleChange} className="auth-select">
                <option value="paciente">Paciente</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

          </div>

          {/* Botón */}
          <button
            className="auth-btn-primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>¿Ya tienes cuenta?</span>
          </div>

          {/* Login */}
          <button
            className="auth-btn-secondary"
            onClick={() => navigate("/login")}
          >
            Iniciar Sesión
          </button>

          {/* Volver */}
          <button className="auth-back" onClick={() => navigate("/")}>
            ← Volver al inicio
          </button>

        </div>
      </div>
    </div>
  );
}

export default Register;