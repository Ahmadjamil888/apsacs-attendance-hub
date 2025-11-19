import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface AssignedClass {
  class_id: string;
  class_number: number;
  section: string;
  total_students: number;
  is_incharge: boolean;
}

interface MarkAttendanceProps {
  userId: string;
}

const MarkAttendance = ({ userId }: MarkAttendanceProps) => {
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignedClasses();
  }, [userId]);

  const fetchAssignedClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select(`
          class_id,
          is_incharge,
          classes (
            class_number,
            section,
            total_students
          )
        `)
        .eq("teacher_id", userId)
        .eq("is_incharge", true);

      if (error) throw error;

      const formattedData = data.map((assignment: any) => ({
        class_id: assignment.class_id,
        class_number: assignment.classes.class_number,
        section: assignment.classes.section,
        total_students: assignment.classes.total_students,
        is_incharge: assignment.is_incharge,
      }));

      setAssignedClasses(formattedData);

      // Check if attendance already marked today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingAttendance } = await supabase
        .from("attendance_records")
        .select("class_id, present_count")
        .eq("attendance_date", today)
        .in(
          "class_id",
          formattedData.map((c) => c.class_id)
        );

      if (existingAttendance) {
        const existing: { [key: string]: number } = {};
        existingAttendance.forEach((record: any) => {
          existing[record.class_id] = record.present_count;
        });
        setAttendanceData(existing);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading classes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (classItem: AssignedClass) => {
    const presentCount = attendanceData[classItem.class_id];

    if (presentCount === undefined || presentCount < 0 || presentCount > classItem.total_students) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: `Please enter a number between 0 and ${classItem.total_students}`,
      });
      return;
    }

    setSubmitting(classItem.class_id);

    try {
      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("attendance_records").upsert(
        {
          class_id: classItem.class_id,
          attendance_date: today,
          present_count: presentCount,
          marked_by: userId,
        },
        {
          onConflict: "class_id,attendance_date",
        }
      );

      if (error) throw error;

      toast({
        title: "Attendance marked successfully",
        description: `Class ${classItem.class_number}${classItem.section}: ${presentCount} students present`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error marking attendance",
        description: error.message,
      });
    } finally {
      setSubmitting(null);
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

  if (assignedClasses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            You are not assigned as a class incharge for any class.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mark Today's Attendance</CardTitle>
          <CardDescription>Enter the number of students present in each class</CardDescription>
        </CardHeader>
      </Card>

      {assignedClasses.map((classItem) => {
        const alreadyMarked = attendanceData[classItem.class_id] !== undefined;

        return (
          <Card key={classItem.class_id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Class {classItem.class_number}{classItem.section}
                {alreadyMarked && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardTitle>
              <CardDescription>
                Total Students: {classItem.total_students}
                {alreadyMarked && " • Attendance already marked today"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor={`present-${classItem.class_id}`}>Students Present</Label>
                  <Input
                    id={`present-${classItem.class_id}`}
                    type="number"
                    min="0"
                    max={classItem.total_students}
                    value={attendanceData[classItem.class_id] ?? ""}
                    onChange={(e) =>
                      setAttendanceData({
                        ...attendanceData,
                        [classItem.class_id]: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter number"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleMarkAttendance(classItem)}
                    disabled={submitting === classItem.class_id}
                    className="w-full sm:w-auto"
                  >
                    {submitting === classItem.class_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : alreadyMarked ? (
                      "Update Attendance"
                    ) : (
                      "Mark Attendance"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MarkAttendance;
