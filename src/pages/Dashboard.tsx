import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import PrincipalDashboard from "@/components/dashboard/PrincipalDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import SuperadminDashboard from "@/components/dashboard/SuperadminDashboard";
import { Loader2 } from "lucide-react";
const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);

      // Fetch user role
      const {
        data: roleData,
        error,
      } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
      }

      const role = (roleData?.role as string | null) ?? "teacher";
      setUserRole(role);
      setLoading(false);
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user || !userRole) {
    return <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">            Accessdenied. Please contact the administrator.</p>
      </div>;
  }
  const renderDashboard = () => {
    switch (userRole) {
      case "superadmin":
        return <SuperadminDashboard user={user} />;
      case "principal":
        return <PrincipalDashboard user={user} />;
      case "teacher":
        return <TeacherDashboard user={user} />;
      default:
        return <TeacherDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {renderDashboard()}
    </div>
  );
};
export default Dashboard;