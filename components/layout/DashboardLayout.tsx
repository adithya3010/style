
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { useIsMobile } from "../../hooks/use-mobile";
import { MobileSidebar } from "../MobileSidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <header className="h-16 border-b bg-card flex items-center px-4 shadow-sm sticky top-0 z-40">
          <MobileSidebar />
          <div className="flex items-center ml-4">
            <h2 className="text-lg font-semibold text-foreground">Nirvaha Dashboard</h2>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card flex items-center px-4 shadow-sm">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-foreground">Nirvaha Dashboard</h2>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;