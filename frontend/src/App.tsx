import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "./lib/authContext";



import ProtectedRoute from "./components/ProtectedRoute.tsx"

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";

import PatientLayout from "./layouts/PatientLayout.tsx";
import PatientDashboard from "./pages/patient/PatientDashboard.tsx";
import PatientHistorial from "./pages/patient/PatientHistorial.tsx";
import PatientCitas from "./pages/patient/PatientCitas.tsx";
import PatientConsentimiento from "./pages/patient/PatientConsentimiento.tsx";
import PatientFacturacion from "./pages/patient/PatientFacturacion.tsx";
import PatientSoporte from "./pages/patient/PatientSoporte.tsx";

import DoctorLayout from "./layouts/DoctorLayout.tsx";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.tsx";
import DoctorCitas from "./pages/doctor/DoctorCitas.tsx";
import DoctorHistoriales from "./pages/doctor/DoctorHistoriales.tsx";
import DoctorDiagnosticos from "./pages/doctor/DoctorDiagnosticos.tsx";
import DoctorRecetas from "./pages/doctor/DoctorRecetas.tsx";
import DoctorMedicamentos from "./pages/doctor/DoctorMedicamentos.tsx";
import DoctorAtencion from "./pages/doctor/DoctorAtencion.tsx";

import AdminLayout from "./layouts/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminHospitales from "./pages/admin/AdminHospitales.tsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.tsx";
import AdminVentas from "./pages/admin/AdminVentas.tsx";
import AdminReportes from "./pages/admin/AdminReportes.tsx";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Paciente */}
            <Route path="/paciente" element={
              <ProtectedRoute rol="paciente"><PatientLayout /></ProtectedRoute>
            }>
              <Route index element={<PatientDashboard />} />
              <Route path="historial" element={<PatientHistorial />} />
              <Route path="citas" element={<PatientCitas />} />
              <Route path="consentimiento" element={<PatientConsentimiento />} />
              <Route path="facturacion" element={<PatientFacturacion />} />
              <Route path="soporte" element={<PatientSoporte />} />
            </Route>

            {/* Médico */}
            <Route path="/medico" element={
              <ProtectedRoute rol="medico"><DoctorLayout /></ProtectedRoute>
            }>
              <Route index element={<DoctorDashboard />} />
              <Route path="citas" element={<DoctorCitas />} />
              <Route path="historiales" element={<DoctorHistoriales />} />
              <Route path="diagnosticos" element={<DoctorDiagnosticos />} />
              <Route path="recetas" element={<DoctorRecetas />} />
              <Route path="medicamentos" element={<DoctorMedicamentos />} />
              <Route path="atencion/:citaId" element={<DoctorAtencion />} />
            </Route>

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute rol="admin"><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="hospitales" element={<AdminHospitales />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="ventas" element={<AdminVentas />} />
              <Route path="reportes" element={<AdminReportes />} />
              <Route path="configuracion" element={<AdminConfiguracion />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;