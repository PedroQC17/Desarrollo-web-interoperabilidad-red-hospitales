import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { register, getProfile } from "@/lib/auth";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import logo from "../../assets/logo-siehc.png";
import { showGlobalLoader } from "@/lib/loader";

// ── Tipos ─────────────────────────────────────────────────
type FormFields = {
  email: string;
  password: string;
  nombre: string;
  telecom: string;
  genero: string;
  fec_nac: string;
  tipo_usuario: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

// ── Constantes de validación ──────────────────────────────
const SOLO_LETRAS     = /^[\p{L}\s]+$/u;
const SOLO_NUMEROS    = /^[0-9]+$/;
const EMAIL_VALIDO    = /^[^\s@]+@[^\s@]+\.com$/i;   // debe terminar en .com
const AÑO_MIN        = 1950;
const EDAD_MIN       = 18;

function calcularEdad(fechaStr: string): number {
  const hoy       = new Date();
  const nacimiento = new Date(fechaStr);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m  = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

// ── Validador ─────────────────────────────────────────────
function validate(form: FormFields): FormErrors {
  const err: FormErrors = {};

  /* Nombre */
  if (!form.nombre.trim()) {
    err.nombre = "El nombre completo es obligatorio.";
  } else if (!SOLO_LETRAS.test(form.nombre.trim())) {
    err.nombre = "El nombre solo debe contener letras y espacios.";
  } else if (form.nombre.trim().split(/\s+/).length < 2) {
    err.nombre = "Ingresa tu nombre y apellido.";
  }

  /* Email */
  if (!form.email.trim()) {
    err.email = "El correo electrónico es obligatorio.";
  } else if (!EMAIL_VALIDO.test(form.email.trim())) {
    err.email = "El correo debe tener '@' y terminar en '.com'.";
  }

  /* Contraseña */
  if (!form.password) {
    err.password = "La contraseña es obligatoria.";
  } else if (form.password.length < 8) {
    err.password = "La contraseña debe tener al menos 8 caracteres.";
  } else if (!/[a-zA-Z]/.test(form.password)) {
    err.password = "La contraseña debe incluir al menos una letra.";
  } else if (!/[0-9]/.test(form.password)) {
    err.password = "La contraseña debe incluir al menos un número.";
  }

  /* Teléfono */
  if (!form.telecom.trim()) {
    err.telecom = "El teléfono es obligatorio.";
  } else if (!SOLO_NUMEROS.test(form.telecom.trim())) {
    err.telecom = "El teléfono solo debe contener números.";
  } else if (!form.telecom.trim().startsWith("9")) {
    err.telecom = "El teléfono debe empezar con 9.";
  } else if (form.telecom.trim().length !== 9) {
    err.telecom = "El teléfono debe tener exactamente 9 dígitos.";
  }

  /* Fecha de nacimiento */
  if (!form.fec_nac) {
    err.fec_nac = "La fecha de nacimiento es obligatoria.";
  } else {
    const año  = new Date(form.fec_nac).getFullYear();
    const edad = calcularEdad(form.fec_nac);

    if (año < AÑO_MIN) {
      err.fec_nac = `El año mínimo permitido es ${AÑO_MIN}.`;
    } else if (edad < EDAD_MIN) {
      err.fec_nac = `Debes tener al menos ${EDAD_MIN} años para registrarte.`;
    }
  }

  /* Género */
  if (!form.genero) {
    err.genero = "Selecciona un género.";
  }

  /* Tipo de usuario */
  if (!form.tipo_usuario) {
    err.tipo_usuario = "Selecciona un tipo de usuario.";
  }

  return err;
}

// ── Componente ────────────────────────────────────────────
function Register() {
  const navigate    = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<FormFields>({
    email: "",
    password: "",
    nombre: "",
    telecom: "",
    genero: "",
    fec_nac: "",
    tipo_usuario: "",
  });

  // Limpia el error del campo al escribir
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormFields]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Bloquea teclas no numéricas en el teléfono y obliga a empezar con 9
  const handleTelecomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const permitidas = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab"];
    if (!permitidas.includes(e.key) && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (/^[0-9]$/.test(e.key) && e.currentTarget.selectionStart === 0 && e.key !== "9") {
      e.preventDefault();
    }
  };

  // Bloquea teclas que no sean letras Unicode; espacio solo después de escribir algo
  const handleNombreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const permitidas = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab"];
    if (!permitidas.includes(e.key) && !/^[\p{L}\s]$/u.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === " " && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
    }
  };

  const handleRegister = async () => {
    const formErrors = validate(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return; // 🚫 no continúa si hay errores
    }

    setServerError("");
    setLoading(true);

    try {
      await register(form);
      const user = await getProfile();
      setUser(user);
      showGlobalLoader();

      if (user.tipo_usuario === "paciente")      navigate("/paciente");
      else if (user.tipo_usuario === "medico")   navigate("/medico");
      else                                        navigate("/admin");

    } catch (err: any) {
      console.error(err);
      const msg = err?.confirmar || err?.email || err?.password || err?.detail || "Error en el registro. Verifica los datos.";
      setServerError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // Fecha máxima: año actual - 18 años
  const maxFecha = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - EDAD_MIN);
    return d.toISOString().split("T")[0];
  })();

  // Fecha mínima: 1 enero 1950
  const minFecha = `${AÑO_MIN}-01-01`;

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <img src={logo} alt="SIEHC" className="auth-panel-logo" />
          <h2>SIEHC</h2>
          <p>Sistema de Integración de Expedientes Hospitalarios Clínicos</p>
          <div className="auth-panel-features">
            <div className="auth-feature"><span className="auth-feature-dot" />Crea tu historial médico</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Agenda citas en la red</div>
            <div className="auth-feature"><span className="auth-feature-dot" />Acceso seguro y protegido</div>
          </div>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card auth-card-register">
          <div className="auth-card-header">
            <div className="auth-badge">Nuevo en SIEHC</div>
            <h1 className="auth-title">Crear Cuenta</h1>
            <p className="auth-subtitle">Completa tus datos para registrarte</p>
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}

          <div className="auth-fields auth-fields-grid">

            {/* Nombre */}
            <div className="auth-field auth-field-full">
              <label>Nombre completo</label>
              <input
                name="nombre"
                  placeholder="Juan Pérez"
                  value={form.nombre}
                  onChange={handleChange}
                  onKeyDown={handleNombreKeyDown}
                className={errors.nombre ? "input-error" : ""}
              />
              {errors.nombre && <span className="field-error">{errors.nombre}</span>}
            </div>

            {/* Email */}
            <div className="auth-field auth-field-full">
              <label>Correo electrónico</label>
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* Contraseña */}
            <div className="auth-field auth-field-full">
              <label>Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres, incluye letras y números"
                  value={form.password}
                  onChange={handleChange}
                  maxLength={15}
                  style={{ paddingRight: "40px" }}
                  className={errors.password ? "input-error" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {/* Teléfono */}
            <div className="auth-field">
              <label>Teléfono</label>
              <input
                name="telecom"
                placeholder="999999999"
                value={form.telecom}
                onChange={handleChange}
                onKeyDown={handleTelecomKeyDown}
                maxLength={9}
                inputMode="numeric"
                className={errors.telecom ? "input-error" : ""}
              />
              {errors.telecom && <span className="field-error">{errors.telecom}</span>}
            </div>

            {/* Fecha de nacimiento */}
            <div className="auth-field">
              <label>Fecha de nacimiento</label>
              <input
                name="fec_nac"
                type="date"
                min={minFecha}
                max={maxFecha}
                value={form.fec_nac}
                onChange={handleChange}
                className={errors.fec_nac ? "input-error" : ""}
              />
              {errors.fec_nac && <span className="field-error">{errors.fec_nac}</span>}
            </div>

            {/* Género */}
            <div className="auth-field">
              <label>Género</label>
              <select
                name="genero"
                onChange={handleChange}
                value={form.genero}
                className={`auth-select${errors.genero ? " input-error" : ""}`}
              >
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              {errors.genero && <span className="field-error">{errors.genero}</span>}
            </div>

            {/* Tipo de usuario */}
            <div className="auth-field">
              <label>Tipo de usuario</label>
              <select
                name="tipo_usuario"
                onChange={handleChange}
                value={form.tipo_usuario}
                className={`auth-select${errors.tipo_usuario ? " input-error" : ""}`}
              >
                <option value="">Seleccionar...</option>
                <option value="paciente">Paciente</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.tipo_usuario && <span className="field-error">{errors.tipo_usuario}</span>}
            </div>

          </div>

          <button
            className="auth-btn-primary"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>

          <div className="auth-divider"><span>¿Ya tienes cuenta?</span></div>

          <button className="auth-btn-secondary" onClick={() => navigate("/login")}>
            Iniciar Sesión
          </button>

          <button className="auth-back" onClick={() => navigate("/")}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;