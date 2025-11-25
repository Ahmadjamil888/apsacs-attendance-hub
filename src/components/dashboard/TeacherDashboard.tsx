import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TeacherClassTabs from "./TeacherClassTabs";
import AttendanceTrends from "./AttendanceTrends";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  return (
    <DashboardLayout user={user} role="teacher">
      <div className="space-y-6">
        <TeacherClassTabs userId={user.id} />
        <AttendanceTrends isPrincipal={false} userId={user.id} />
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
