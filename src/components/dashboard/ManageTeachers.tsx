import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Class {
  id: string;
  class_number: number;
  section: string;
}

const ManageTeachers = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [inchargeClasses, setInchargeClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("class_number", { ascending: true })
      .order("section", { ascending: true });

    if (!error && data) {
      setClasses(data);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !fullName) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (selectedClasses.length === 0) {
      toast({
        variant: "destructive",
        title: "No classes selected",
        description: "Please assign at least one class to the teacher",
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Add teacher role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "teacher",
      });

      if (roleError) throw roleError;

      // Add class assignments
      const assignments = selectedClasses.map((classId) => ({
        teacher_id: authData.user!.id,
        class_id: classId,
        is_incharge: inchargeClasses.includes(classId),
      }));

      const { error: assignError } = await supabase
        .from("teacher_assignments")
        .insert(assignments);

      if (assignError) throw assignError;

      toast({
        title: "Teacher added successfully",
        description: `${fullName} has been added with ${selectedClasses.length} class assignment(s)`,
      });

      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setSelectedClasses([]);
      setInchargeClasses([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding teacher",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleIncharge = (classId: string) => {
    setInchargeClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add New Teacher
        </CardTitle>
        <CardDescription>Create teacher account and assign classes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTeacher} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Teacher's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@apsacs.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Assign Classes *</Label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedClasses.includes(classItem.id)}
                      onCheckedChange={() => toggleClassSelection(classItem.id)}
                    />
                    <span className="font-medium">
                      Class {classItem.class_number}
                      {classItem.section}
                    </span>
                  </div>
                  {selectedClasses.includes(classItem.id) && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={inchargeClasses.includes(classItem.id)}
                        onCheckedChange={() => toggleIncharge(classItem.id)}
                      />
                      <span className="text-sm text-muted-foreground">Class Incharge</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Teacher...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Teacher
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManageTeachers;
