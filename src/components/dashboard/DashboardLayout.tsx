import { ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  user: User;
  role: "principal" | "teacher";
  activeTab: string;
  setActiveTab: (tab: any) => void;
  children: ReactNode;
}

const DashboardLayout = ({ user, role, activeTab, setActiveTab, children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">APSACS</h1>
                <p className="text-xs md:text-sm opacity-90">
                  {role === "principal" ? "Principal Portal" : "Teacher Portal"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs opacity-80 capitalize">{role}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`bg-card border-b ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 py-3">
            {role === "principal" ? (
              <>
                <Button
                  variant={activeTab === "attendance" ? "default" : "ghost"}
                  onClick={() => {
                    setActiveTab("attendance");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  View Today's Attendance
                </Button>
                <Button
                  variant={activeTab === "teachers" ? "default" : "ghost"}
                  onClick={() => {
                    setActiveTab("teachers");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  Manage Teachers
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={activeTab === "view" ? "default" : "ghost"}
                  onClick={() => {
                    setActiveTab("view");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  View Attendance
                </Button>
                <Button
                  variant={activeTab === "mark" ? "default" : "ghost"}
                  onClick={() => {
                    setActiveTab("mark");
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  Mark Attendance
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
