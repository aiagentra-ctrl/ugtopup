import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Search, Edit, Users } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  balance: number;
  provider: string | null;
  created_at: string;
  full_name: string | null;
}

export function UserData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedBalance, setEditedBalance] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    const channel = supabase
      .channel("user-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    setEditedBalance(user.balance.toString());
    setShowEditModal(true);
  };

  const handleSaveClick = () => {
    if (!selectedUser) return;
    
    const newBalance = parseFloat(editedBalance);
    if (isNaN(newBalance) || newBalance < 0) {
      toast.error("Please enter a valid balance");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const newBalance = parseFloat(editedBalance);
      
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User balance updated successfully");
      setShowEditModal(false);
      setShowConfirmModal(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error updating balance:", error);
      toast.error(error.message || "Failed to update balance");
    } finally {
      setProcessing(false);
    }
  };

  const getProviderBadge = (provider: string | null) => {
    if (provider === "google") {
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Google</Badge>;
    }
    return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">Email</Badge>;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardHeader>
        <CardTitle className="text-foreground">User Data Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, username, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <Button onClick={loadUsers} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Username</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Full Name</TableHead>
                    <TableHead className="text-muted-foreground">Balance</TableHead>
                    <TableHead className="text-muted-foreground">Provider</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {user.username || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm text-foreground">{user.full_name || "-"}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-400">₹{user.balance.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{getProviderBadge(user.provider)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 px-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{user.username || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {getProviderBadge(user.provider)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-semibold text-green-400">₹{user.balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-sm text-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {user.full_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm text-foreground">{user.full_name}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(user)}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Balance
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit User Balance</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the balance for {selectedUser?.username || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-balance" className="text-foreground">Current Balance</Label>
              <Input
                id="current-balance"
                value={`₹${selectedUser?.balance.toFixed(2)}`}
                disabled
                className="bg-muted/30 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-balance" className="text-foreground">
                New Balance <span className="text-red-400">*</span>
              </Label>
              <Input
                id="new-balance"
                type="number"
                step="0.01"
                min="0"
                value={editedBalance}
                onChange={(e) => setEditedBalance(e.target.value)}
                placeholder="Enter new balance..."
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Balance Update</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to update the balance?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium text-foreground">{selectedUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-semibold text-foreground">₹{selectedUser?.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-semibold text-green-400">₹{parseFloat(editedBalance).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-orange-400">
              ⚠️ This action will immediately update the user's balance in the database.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={processing}
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
