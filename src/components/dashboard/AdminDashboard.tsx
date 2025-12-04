import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TeacherManagement from "./TeacherManagement";
import TodaysAttendance from "./TodaysAttendance";
import AttendanceTrends from "./AttendanceTrends";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  return (
    <DashboardLayout user={user} role="admin">
      <div className="space-y-6">
        <TeacherManagement />
        <TodaysAttendance isPrincipal={true} />
        <AttendanceTrends isPrincipal={true} />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
