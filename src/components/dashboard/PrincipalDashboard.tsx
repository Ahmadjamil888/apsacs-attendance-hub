import { User } from "@supabase/supabase-js";
import DashboardLayout from "./DashboardLayout";
import TodaysAttendance from "./TodaysAttendance";
import AttendanceTrends from "./AttendanceTrends";

interface PrincipalDashboardProps {
  user: User;
}

const PrincipalDashboard = ({ user }: PrincipalDashboardProps) => {
  return (
    <DashboardLayout user={user} role="principal">
      <div className="space-y-6">
        <TodaysAttendance isPrincipal={true} />
        <AttendanceTrends isPrincipal={true} />
      </div>
    </DashboardLayout>
  );
};

export default PrincipalDashboard;
