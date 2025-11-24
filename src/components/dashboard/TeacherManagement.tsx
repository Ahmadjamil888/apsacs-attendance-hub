import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit2, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface Teacher {
  id: string;
  email: string;
  full_name: string;
}

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePassword, setSinglePassword] = useState("");
  const [singleName, setSingleName] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      
      // First get all teacher IDs
      const { data: teacherRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      if (rolesError) throw rolesError;

      const teacherIds = teacherRoles?.map(r => r.user_id) || [];

      // Then get profiles for those IDs
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name
        `)
        .in('id', teacherIds
        );

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading teachers",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleBulkCreate = async () => {
    if (!bulkEmails.trim() || !bulkPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide emails and password",
      });
      return;
    }

    setCreating(true);
    const emails = bulkEmails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    let successCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: bulkPassword,
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0],
          },
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'teacher',
          });
          successCount++;
        }
      } catch (error: any) {
        console.error(`Failed to create ${email}:`, error);
        errorCount++;
      }
    }

    setCreating(false);
    setBulkEmails("");
    setBulkPassword("");

    toast({
      title: "Bulk creation complete",
      description: `Created ${successCount} teacher(s). ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`,
    });

    fetchTeachers();
  };

  const handleSingleCreate = async () => {
    if (!singleEmail.trim() || !singlePassword.trim() || !singleName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: singleEmail,
        password: singlePassword,
        email_confirm: true,
        user_metadata: {
          full_name: singleName,
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'teacher',
        });

        toast({
          title: "Teacher created",
          description: `${singleName} has been added successfully`,
        });

        setSingleEmail("");
        setSinglePassword("");
        setSingleName("");
        fetchTeachers();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating teacher",
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      for (const teacher of teachers) {
      const response = await fetch(`https://irtesgmumggpjxyfajnl.supabase.co/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: teacher.id }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(`Failed to delete ${teacher.email}:`, result.error);
        }
      }

      toast({
        title: "All teachers deleted",
        description: `Removed ${teachers.length} teacher(s)`,
      });

      fetchTeachers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting teachers",
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`https://irtesgmumggpjxyfajnl.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: teacherId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete teacher');
      }

      toast({
        title: "Teacher deleted",
        description: `${name} has been removed`,
      });

      fetchTeachers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting teacher",
        description: error.message,
      });
    }
  };

  const handleEditTeacher = async () => {
    if (!editingTeacher || !editName.trim() || !editEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          email: editEmail,
        })
        .eq('id', editingTeacher.id);

      if (error) throw error;

      toast({
        title: "Teacher updated",
        description: "Changes saved successfully",
      });

      setEditingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating teacher",
        description: error.message,
      });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Management
          </CardTitle>
          <CardDescription>Create, edit, and manage teachers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Single Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>Create a single teacher account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="single-name">Full Name</Label>
                    <Input
                      id="single-name"
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="single-email">Email</Label>
                    <Input
                      id="single-email"
                      type="email"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      placeholder="teacher@school.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="single-password">Password</Label>
                    <Input
                      id="single-password"
                      type="password"
                      value={singlePassword}
                      onChange={(e) => setSinglePassword(e.target.value)}
                      placeholder="Secure password"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSingleCreate} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Teacher"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Bulk Add Teachers
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Add Teachers</DialogTitle>
                  <DialogDescription>
                    Enter one email per line. All accounts will use the same password.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-emails">Email Addresses (one per line)</Label>
                    <Textarea
                      id="bulk-emails"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="teacher1@school.edu&#10;teacher2@school.edu&#10;teacher3@school.edu"
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-password">Default Password</Label>
                    <Input
                      id="bulk-password"
                      type="password"
                      value={bulkPassword}
                      onChange={(e) => setBulkPassword(e.target.value)}
                      placeholder="Shared password for all accounts"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleBulkCreate} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create All Teachers"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {teachers.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Teachers
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {teachers.length} teacher account(s). This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} disabled={deleting}>
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete All"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Teachers ({teachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No teachers found. Create some to get started.</p>
          ) : (
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{teacher.full_name}</p>
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setEditName(teacher.full_name);
                            setEditEmail(teacher.email);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Teacher</DialogTitle>
                          <DialogDescription>Update teacher information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                              id="edit-name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleEditTeacher}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {teacher.full_name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this teacher account. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id, teacher.full_name)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherManagement;
