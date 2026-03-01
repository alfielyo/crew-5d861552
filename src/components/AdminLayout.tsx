import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center border-b border-border px-4">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-medium text-muted-foreground">Admin Panel</span>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
