import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TodaysAttendance from "./TodaysAttendance";
import MarkAttendance from "./MarkAttendance";
import AttendanceTrends from "./AttendanceTrends";

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  return (
    <DashboardLayout user={user} role="teacher">
      <div className="space-y-6">
        <MarkAttendance userId={user.id} />
        <TodaysAttendance isPrincipal={false} userId={user.id} />
        <AttendanceTrends isPrincipal={false} userId={user.id} />
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
