import { Outlet } from "react-router-dom";
import { Sidebar } from "../ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MainHeader } from "./MainHeader";

export default function RootLayout() {
  return (
    <Sidebar>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <MainHeader />
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </Sidebar>
  );
}
