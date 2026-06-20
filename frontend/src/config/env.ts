/**
 * Configuración centralizada de variables de entorno
 * Importa desde import.meta.env de Vite
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
    timeout: import.meta.env.VITE_API_TIMEOUT ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10) : 30000,
  },

  // Environment
  env: import.meta.env.VITE_ENV || "development",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

export default config;
