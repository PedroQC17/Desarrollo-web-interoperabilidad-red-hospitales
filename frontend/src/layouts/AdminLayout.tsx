import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { hideGlobalLoader } from "@/lib/loader";

const AdminLayout = () => {
  useEffect(() => {
    const t = setTimeout(() => hideGlobalLoader(), 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminMobileNav />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
