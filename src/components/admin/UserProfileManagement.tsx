import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, Search, Phone, Mail, MapPin, ShoppingBag, Ban, Download,
  CheckCircle, Loader2, RefreshCw, Shield, Crown, Eye, EyeOff,
  UserX, UserCheck, Calendar, DollarSign, Tag, Edit, Key, Link2,
  Star, Wallet, History, AlertTriangle, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_status: string | null;
  loyalty_tier: string | null;
  wallet_balance: number | null;
  store_credit: number | null;
  two_factor_enabled: boolean | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  updated_at: string;
}

interface LinkedAccount {
  id: string;
  user_id: string;
  provider: string;
  email: string | null;
  is_primary: boolean | null;
  linked_at: string;
}

interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: any[];
}

const LOYALTY_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'vip'];
const ACCOUNT_STATUSES = ['active', 'suspended', 'deactivated', 'pending'];
const USER_TAGS = ['VIP', 'Repeat Buyer', 'High Value', 'Wholesale', 'New Customer'];

export const UserProfileManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  
  const [editingUser, setEditingUser] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  
  const [userToSuspend, setUserToSuspend] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user: UserProfile) => {
    setUserDetailLoading(true);
    setSelectedUser(user);
    setEditForm(user);
    
    try {
      // Fetch linked accounts
      const { data: accountsData } = await supabase
        .from('linked_accounts')
        .select('*')
        .eq('user_id', user.id);
      setLinkedAccounts(accountsData || []);

      // Fetch addresses
      const { data: addressData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id);
      setAddresses(addressData || []);

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, items')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const formattedOrders = (orderData || []).map(order => ({
        id: order.id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: Array.isArray(order.items) ? order.items : []
      }));
      setOrders(formattedOrders);

    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          loyalty_tier: editForm.loyalty_tier,
          account_status: editForm.account_status,
          wallet_balance: editForm.wallet_balance,
          store_credit: editForm.store_credit,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toast.success("User profile updated");
      setEditingUser(false);
      fetchUsers();
      
      // Update selected user
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend) return;
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          account_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', userToSuspend.id);

      if (error) throw error;
      
      // Log the action
      await supabase.from('profile_audit_logs').insert({
        user_id: userToSuspend.id,
        action: 'account_suspended',
        field_changed: 'account_status',
        old_value: userToSuspend.account_status,
        new_value: 'suspended'
      });
      
      toast.success(`${userToSuspend.full_name || 'User'} has been suspended`);
      setUserToSuspend(null);
      setSuspendReason("");
      fetchUsers();
      
      if (selectedUser?.id === userToSuspend.id) {
        setSelectedUser(prev => prev ? { ...prev, account_status: 'suspended' } : null);
      }
    } catch (err: any) {
      toast.error("Failed to suspend user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateUser = async (user: UserProfile) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          account_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success(`${user.full_name || 'User'} has been reactivated`);
      fetchUsers();
      
      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, account_status: 'active' } : null);
      }
    } catch (err: any) {
      toast.error("Failed to reactivate user");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddWalletCredit = async (userId: string, amount: number, description: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newBalance = (user.wallet_balance || 0) + amount;
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

      if (error) throw error;
      
      // Record the transaction
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        transaction_type: 'credit',
        amount: amount,
        balance_after: newBalance,
        description: description
      });
      
      toast.success(`Added ৳${amount} to wallet`);
      fetchUsers();
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, wallet_balance: newBalance } : null);
      }
    } catch (err: any) {
      toast.error("Failed to add credit");
    }
  };

  const exportUserData = async (user: UserProfile) => {
    try {
      const exportData = {
        profile: user,
        linkedAccounts,
        addresses,
        orders,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${user.id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("User data exported");
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
    const matchesTier = tierFilter === 'all' || user.loyalty_tier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'deactivated': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTierIcon = (tier: string | null) => {
    switch (tier) {
      case 'platinum':
      case 'vip':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'gold':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">User Profile Management</h2>
            <p className="text-sm text-muted-foreground">
              {users.length} registered users
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card/80 border-border/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-12 bg-card/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {ACCOUNT_STATUSES.map(status => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[160px] h-12 bg-card/80">
            <SelectValue placeholder="Loyalty Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {LOYALTY_TIERS.map(tier => (
              <SelectItem key={tier} value={tier} className="capitalize">
                {tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-display text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery ? "Try adjusting your search" : "Users will appear when they register"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fetchUserDetails(user)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || ''} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        {getTierIcon(user.loyalty_tier)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); fetchUserDetails(user); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); fetchUserDetails(user); setEditingUser(true); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.account_status === 'suspended' ? (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReactivateUser(user); }}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setUserToSuspend(user); }}
                          className="text-destructive"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className={getStatusColor(user.account_status)}>
                    {user.account_status || 'active'}
                  </Badge>
                  {user.loyalty_tier && (
                    <Badge variant="secondary" className="capitalize">
                      {user.loyalty_tier}
                    </Badge>
                  )}
                  {user.email_verified && (
                    <Badge variant="outline" className="text-green-500 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    ৳{(user.wallet_balance || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => { setSelectedUser(null); setEditingUser(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {selectedUser?.avatar_url ? (
                    <img 
                      src={selectedUser.avatar_url} 
                      alt={selectedUser.full_name || ''} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedUser?.full_name || 'Unnamed User'}
                    {getTierIcon(selectedUser?.loyalty_tier)}
                  </DialogTitle>
                  <DialogDescription>{selectedUser?.email}</DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectedUser && exportUserData(selectedUser)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant={editingUser ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditingUser(!editingUser)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {editingUser ? 'Cancel Edit' : 'Edit'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {userDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4 space-y-4">
                  {editingUser ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={editForm.full_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Loyalty Tier</Label>
                          <Select 
                            value={editForm.loyalty_tier || ''} 
                            onValueChange={(v) => setEditForm(prev => ({ ...prev, loyalty_tier: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              {LOYALTY_TIERS.map(tier => (
                                <SelectItem key={tier} value={tier} className="capitalize">
                                  {tier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Account Status</Label>
                          <Select 
                            value={editForm.account_status || 'active'} 
                            onValueChange={(v) => setEditForm(prev => ({ ...prev, account_status: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACCOUNT_STATUSES.map(status => (
                                <SelectItem key={status} value={status} className="capitalize">
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Wallet Balance (৳)</Label>
                          <Input
                            type="number"
                            value={editForm.wallet_balance || 0}
                            onChange={(e) => setEditForm(prev => ({ ...prev, wallet_balance: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Store Credit (৳)</Label>
                          <Input
                            type="number"
                            value={editForm.store_credit || 0}
                            onChange={(e) => setEditForm(prev => ({ ...prev, store_credit: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingUser(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveUser} disabled={saving}>
                          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedUser?.email}
                            {selectedUser?.email_verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedUser?.phone || 'Not set'}
                            {selectedUser?.phone_verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-sm text-muted-foreground">Wallet Balance</p>
                          <p className="text-2xl font-bold text-primary">
                            ৳{(selectedUser?.wallet_balance || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                          <p className="text-sm text-muted-foreground">Store Credit</p>
                          <p className="text-2xl font-bold text-green-500">
                            ৳{(selectedUser?.store_credit || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                          <p className="text-sm text-muted-foreground">Loyalty Tier</p>
                          <p className="text-2xl font-bold text-accent capitalize flex items-center gap-2">
                            {selectedUser?.loyalty_tier || 'Bronze'}
                            {getTierIcon(selectedUser?.loyalty_tier)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="text-sm text-muted-foreground">Last Login</p>
                          <p className="font-medium">
                            {selectedUser?.last_login_at 
                              ? format(new Date(selectedUser.last_login_at), 'MMM d, yyyy h:mm a')
                              : 'Never'
                            }
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {format(new Date(selectedUser?.created_at || ''), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedUser?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <Badge variant={selectedUser?.two_factor_enabled ? 'default' : 'secondary'}>
                          {selectedUser?.two_factor_enabled ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="accounts" className="mt-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Linked Social Accounts
                  </h4>
                  {linkedAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No linked accounts
                    </p>
                  ) : (
                    linkedAccounts.map(account => (
                      <div 
                        key={account.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          {account.provider === 'google' && (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          {account.provider === 'facebook' && (
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )}
                          {account.provider === 'email' && <Key className="w-5 h-5" />}
                          <div>
                            <p className="font-medium capitalize">{account.provider}</p>
                            <p className="text-xs text-muted-foreground">{account.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.is_primary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                          <Badge variant="default">Connected</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="addresses" className="mt-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Saved Addresses
                  </h4>
                  {addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No saved addresses
                    </p>
                  ) : (
                    addresses.map(address => (
                      <div 
                        key={address.id}
                        className="p-4 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{address.label}</Badge>
                              {address.is_default && <Badge>Default</Badge>}
                            </div>
                            <p className="font-medium">{address.full_name}</p>
                            {address.phone && <p className="text-sm text-muted-foreground">{address.phone}</p>}
                          </div>
                        </div>
                        <p className="text-sm mt-2">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}
                          {address.state && `, ${address.state}`}
                          {address.postal_code && ` ${address.postal_code}`}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="orders" className="mt-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Recent Orders
                  </h4>
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No orders yet
                    </p>
                  ) : (
                    orders.map(order => (
                      <div 
                        key={order.id}
                        className="p-4 rounded-lg bg-muted/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ৳{order.total_amount.toLocaleString()}
                          </p>
                          <Badge variant="outline" className="capitalize">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <AlertDialog open={!!userToSuspend} onOpenChange={() => setUserToSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Suspend User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend {userToSuspend?.full_name || 'this user'}'s account. They will not be able to log in or place orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for suspension (optional)"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={2}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Suspend Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
