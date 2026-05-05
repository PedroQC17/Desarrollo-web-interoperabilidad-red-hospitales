import { Outlet } from "react-router-dom";
import PatientSidebar from "@/components/patient/PatientSidebar";
import PatientMobileNav from "@/components/patient/PatientMobileNav";

const PatientLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <PatientSidebar />
      <div className="flex-1 flex flex-col">
        <PatientMobileNav />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;
