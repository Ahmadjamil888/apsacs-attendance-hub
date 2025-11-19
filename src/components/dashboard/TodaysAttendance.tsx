import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  class_id: string;
  class_number: number;
  section: string;
  present_count: number;
  total_students: number;
  marked_at: string;
}

interface TodaysAttendanceProps {
  isPrincipal: boolean;
  userId?: string;
}

const TodaysAttendance = ({ isPrincipal, userId }: TodaysAttendanceProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [isPrincipal, userId]);

  const fetchAttendance = async () => {
    try {
      let query = supabase
        .from("attendance_records")
        .select(`
          class_id,
          present_count,
          marked_at,
          classes (
            class_number,
            section,
            total_students
          )
        `)
        .eq("attendance_date", new Date().toISOString().split("T")[0])
        .order("classes(class_number)", { ascending: true });

      // If teacher, filter by assigned classes
      if (!isPrincipal && userId) {
        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id")
          .eq("teacher_id", userId);

        if (assignments && assignments.length > 0) {
          const classIds = assignments.map((a) => a.class_id);
          query = query.in("class_id", classIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map((record: any) => ({
        class_id: record.class_id,
        class_number: record.classes.class_number,
        section: record.classes.section,
        present_count: record.present_count,
        total_students: record.classes.total_students,
        marked_at: record.marked_at,
      }));

      setAttendance(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading attendance",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Attendance</CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {attendance.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No attendance has been marked yet for today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="hidden md:table-cell">Marked At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.class_id}>
                    <TableCell className="font-medium">{record.class_number}</TableCell>
                    <TableCell>{record.section}</TableCell>
                    <TableCell className="text-right text-primary font-semibold">
                      {record.present_count}
                    </TableCell>
                    <TableCell className="text-right">{record.total_students}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {record.total_students - record.present_count}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(record.marked_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysAttendance;
