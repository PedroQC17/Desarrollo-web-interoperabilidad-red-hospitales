export const parseError = (error: any): string => {
  if (!error) return "Ocurrió un error inesperado.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Ocurrió un error inesperado.";
  if (Array.isArray(error)) return error.join(" ");
  if (typeof error === "object") {
    const first = Object.values(error)[0];
    if (first === undefined) return error.error || error.detail || "Ocurrió un error inesperado.";
    return Array.isArray(first) ? first.join(" ") : String(first) || error.error || error.detail || "Ocurrió un error inesperado.";
  }
  return "Ocurrió un error inesperado.";
};
