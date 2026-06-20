import { Outlet } from "react-router-dom";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";
import DoctorMobileNav from "@/components/doctor/DoctorMobileNav";

const DoctorLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col">
        <DoctorMobileNav />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
