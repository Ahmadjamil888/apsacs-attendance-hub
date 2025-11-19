import { useState } from "react";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TodaysAttendance from "./TodaysAttendance";
import MarkAttendance from "./MarkAttendance";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"view" | "mark">("view");

  return (
    <DashboardLayout
      user={user}
      role="teacher"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {activeTab === "view" && <TodaysAttendance isPrincipal={false} userId={user.id} />}
      {activeTab === "mark" && <MarkAttendance userId={user.id} />}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
