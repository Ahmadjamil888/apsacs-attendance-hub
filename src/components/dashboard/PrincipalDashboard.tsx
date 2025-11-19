import { useState } from "react";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TodaysAttendance from "./TodaysAttendance";
import ManageTeachers from "./ManageTeachers";

interface PrincipalDashboardProps {
  user: User;
}

const PrincipalDashboard = ({ user }: PrincipalDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"attendance" | "teachers">("attendance");

  return (
    <DashboardLayout
      user={user}
      role="principal"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {activeTab === "attendance" && <TodaysAttendance isPrincipal={true} />}
      {activeTab === "teachers" && <ManageTeachers />}
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
