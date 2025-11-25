import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit2, UserPlus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Principal {
  id: string;
  email: string;
  full_name: string;
}

const PrincipalManagement = () => {
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [loading, setLoading] = useState(true);
  const [singleEmail, setSingleEmail] = useState("");
  const [singlePassword, setSinglePassword] = useState("");
  const [singleName, setSingleName] = useState("");
  const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchPrincipals = async () => {
    try {
      setLoading(true);
      
      const { data: principalRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'principal');

      if (rolesError) throw rolesError;

      const principalIds = principalRoles?.map(r => r.user_id) || [];

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name
        `)
        .in('id', principalIds);

      if (error) throw error;
      setPrincipals(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading principals",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const handleCreatePrincipal = async () => {
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`https://irtesgmumggpjxyfajnl.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: singleEmail,
          password: singlePassword,
          fullName: singleName,
          role: 'principal',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create principal');
      }

      toast({
        title: "Principal created",
        description: `${singleName} has been added successfully`,
      });

      setSingleEmail("");
      setSinglePassword("");
      setSingleName("");
      fetchPrincipals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating principal",
        description: error.message,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePrincipal = async (principalId: string, name: string) => {
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
        body: JSON.stringify({ userId: principalId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete principal');
      }

      toast({
        title: "Principal deleted",
        description: `${name} has been removed`,
      });

      fetchPrincipals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting principal",
        description: error.message,
      });
    }
  };

  const handleEditPrincipal = async () => {
    if (!editingPrincipal || !editName.trim() || !editEmail.trim()) {
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
        .eq('id', editingPrincipal.id);

      if (error) throw error;

      toast({
        title: "Principal updated",
        description: "Changes saved successfully",
      });

      setEditingPrincipal(null);
      fetchPrincipals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating principal",
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
            <Shield className="h-5 w-5" />
            Principal Management
          </CardTitle>
          <CardDescription>Create, edit, and manage principals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Principal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Principal</DialogTitle>
                <DialogDescription>Create a principal account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal-name">Full Name</Label>
                  <Input
                    id="principal-name"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal-email">Email</Label>
                  <Input
                    id="principal-email"
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="principal@school.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principal-password">Password</Label>
                  <Input
                    id="principal-password"
                    type="password"
                    value={singlePassword}
                    onChange={(e) => setSinglePassword(e.target.value)}
                    placeholder="Secure password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePrincipal} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Principal"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Principals ({principals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {principals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No principals found.</p>
          ) : (
            <div className="space-y-3">
              {principals.map((principal) => (
                <div key={principal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{principal.full_name}</p>
                    <p className="text-sm text-muted-foreground">{principal.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPrincipal(principal);
                            setEditName(principal.full_name);
                            setEditEmail(principal.email);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Principal</DialogTitle>
                          <DialogDescription>Update principal information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-principal-name">Full Name</Label>
                            <Input
                              id="edit-principal-name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-principal-email">Email</Label>
                            <Input
                              id="edit-principal-email"
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleEditPrincipal}>Save Changes</Button>
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
                          <AlertDialogTitle>Delete {principal.full_name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this principal account. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePrincipal(principal.id, principal.full_name)}>
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

export default PrincipalManagement;
