import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TodaysAttendance from "./TodaysAttendance";
import AttendanceTrends from "./AttendanceTrends";
import TeacherManagement from "./TeacherManagement";

interface SuperadminDashboardProps {
  user: User;
}

const SuperadminDashboard = ({ user }: SuperadminDashboardProps) => {
  return (
    <DashboardLayout user={user} role="superadmin">
      <div className="space-y-6">
        <TeacherManagement />
        <TodaysAttendance isPrincipal={true} />
        <AttendanceTrends isPrincipal={true} />
      </div>
    </DashboardLayout>
  );
};

export default SuperadminDashboard;
