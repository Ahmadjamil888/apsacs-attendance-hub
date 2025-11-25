import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AssignedClass {
  class_id: string;
  class_number: number;
  section: string;
  total_students: number;
  is_incharge: boolean;
}

interface AttendanceRecord {
  attendance_date: string;
  present_count: number;
  marked_at: string;
}

interface TeacherClassTabsProps {
  userId: string;
}

const TeacherClassTabs = ({ userId }: TeacherClassTabsProps) => {
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: number }>({});
  const [weekAttendance, setWeekAttendance] = useState<{ [key: string]: AttendanceRecord[] }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignedClasses();

    // Subscribe to realtime attendance updates
    const channel = supabase
      .channel('attendance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          fetchAssignedClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        .eq("teacher_id", userId);

      if (error) throw error;

      const formattedData = data.map((assignment: any) => ({
        class_id: assignment.class_id,
        class_number: assignment.classes.class_number,
        section: assignment.classes.section,
        total_students: assignment.classes.total_students,
        is_incharge: assignment.is_incharge,
      }));

      setAssignedClasses(formattedData);

      // Fetch today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: todayAttendance } = await supabase
        .from("attendance_records")
        .select("class_id, present_count")
        .eq("attendance_date", today)
        .in("class_id", formattedData.map(c => c.class_id));

      if (todayAttendance) {
        const existing: { [key: string]: number } = {};
        todayAttendance.forEach((record: any) => {
          existing[record.class_id] = record.present_count;
        });
        setAttendanceData(existing);
      }

      // Fetch week attendance for each class
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      
      for (const cls of formattedData) {
        const { data: weekData } = await supabase
          .from("attendance_records")
          .select("attendance_date, present_count, marked_at")
          .eq("class_id", cls.class_id)
          .gte("attendance_date", weekStart.toISOString().split("T")[0])
          .order("attendance_date", { ascending: false });

        if (weekData) {
          setWeekAttendance(prev => ({
            ...prev,
            [cls.class_id]: weekData as AttendanceRecord[]
          }));
        }
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

      // Refresh attendance data
      fetchAssignedClasses();
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
            You are not assigned to any classes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Classes</CardTitle>
        <CardDescription>View and manage attendance for your assigned classes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={assignedClasses[0]?.class_id} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${assignedClasses.length}, 1fr)` }}>
            {assignedClasses.map((cls) => (
              <TabsTrigger key={cls.class_id} value={cls.class_id}>
                <div className="flex items-center gap-2">
                  Class {cls.class_number}{cls.section}
                  {cls.is_incharge && <Badge variant="secondary" className="text-xs">Incharge</Badge>}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {assignedClasses.map((classItem) => {
            const alreadyMarked = attendanceData[classItem.class_id] !== undefined;
            const classWeekData = weekAttendance[classItem.class_id] || [];

            return (
              <TabsContent key={classItem.class_id} value={classItem.class_id} className="space-y-4">
                {/* Mark Attendance Section - Only for Incharge */}
                {classItem.is_incharge && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mark Today's Attendance</CardTitle>
                      <CardDescription>
                        Total Students: {classItem.total_students}
                        {alreadyMarked && " • Already marked today"}
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
                )}

                {/* Attendance History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Attendance (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classWeekData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No attendance records found for this class.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Present</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">Absent</TableHead>
                              <TableHead className="text-right">Attendance %</TableHead>
                              <TableHead className="hidden md:table-cell">Marked At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classWeekData.map((record) => {
                              const attendancePercent = ((record.present_count / classItem.total_students) * 100).toFixed(1);
                              return (
                                <TableRow key={record.attendance_date}>
                                  <TableCell className="font-medium">
                                    {new Date(record.attendance_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </TableCell>
                                  <TableCell className="text-right text-primary font-semibold">
                                    {record.present_count}
                                  </TableCell>
                                  <TableCell className="text-right">{classItem.total_students}</TableCell>
                                  <TableCell className="text-right text-destructive">
                                    {classItem.total_students - record.present_count}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={parseFloat(attendancePercent) >= 75 ? "default" : "destructive"}>
                                      {attendancePercent}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                    {new Date(record.marked_at).toLocaleTimeString()}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeacherClassTabs;
