import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceTrendsProps {
  isPrincipal: boolean;
  userId?: string;
}

interface TrendData {
  date: string;
  [key: string]: number | string;
}

const COLORS = [
  "hsl(142, 100%, 50%)",
  "hsl(162, 100%, 50%)",
  "hsl(182, 100%, 50%)",
  "hsl(202, 100%, 50%)",
  "hsl(222, 100%, 50%)",
  "hsl(242, 100%, 50%)",
  "hsl(262, 100%, 50%)",
  "hsl(282, 100%, 50%)",
];

const AttendanceTrends = ({ isPrincipal, userId }: AttendanceTrendsProps) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [classNames, setClassNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrendData();
  }, [isPrincipal, userId]);

  const fetchTrendData = async () => {
    try {
      // Get last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      let classIds: string[] = [];

      // If teacher, get their assigned classes
      if (!isPrincipal && userId) {
        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", userId);

        if (assignments && assignments.length > 0) {
          classIds = assignments.map((a) => a.class_id);
        } else {
          setTrendData([]);
          setLoading(false);
          return;
        }
      }

      // Fetch attendance records for date range
      let query = supabase
        .from("attendance_records")
        .select(`
          attendance_date,
          present_count,
          class_id,
          classes (
            class_number,
            section,
            total_students
          )
        `)
        .gte("attendance_date", startDate.toISOString().split("T")[0])
        .lte("attendance_date", endDate.toISOString().split("T")[0])
        .order("attendance_date", { ascending: true });

      if (!isPrincipal && classIds.length > 0) {
        query = query.in("class_id", classIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data for chart
      const dateMap: { [date: string]: TrendData } = {};
      const classSet = new Set<string>();

      data?.forEach((record: any) => {
        const date = new Date(record.attendance_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const className = `Class ${record.classes.class_number}${record.classes.section}`;
        const percentage = Math.round((record.present_count / record.classes.total_students) * 100);

        if (!dateMap[date]) {
          dateMap[date] = { date };
        }

        dateMap[date][className] = percentage;
        classSet.add(className);
      });

      const chartData = Object.values(dateMap);
      const classes = Array.from(classSet).sort();

      setTrendData(chartData);
      setClassNames(classes);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading trends",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
          <CardDescription>Last 7 days attendance percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No attendance data available for the last 7 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trends</CardTitle>
        <CardDescription>
          {isPrincipal ? "All classes" : "Your assigned classes"} - Last 7 days (%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {classNames.map((className, index) => (
              <Line
                key={className}
                type="monotone"
                dataKey={className}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AttendanceTrends;
