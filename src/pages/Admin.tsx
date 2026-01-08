import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Phone, Mail, MapPin, Calendar, ExternalLink, LogOut, Loader2, 
  CreditCard, Smartphone, Banknote, Search, Filter, Trash2, X, BarChart3,
  MessageSquare, Bell, ShoppingBag, Shield, Tag, FolderOpen, Settings,
  FileText, Menu, Users, Activity, BellRing
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";
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
import { OrderStatistics } from "@/components/admin/OrderStatistics";
import { ContactMessages } from "@/components/admin/ContactMessages";
import { ProductManagement } from "@/components/admin/ProductManagement";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { CollectionManagement } from "@/components/admin/CollectionManagement";
import { SiteSettings } from "@/components/admin/SiteSettings";
import { PageContentEditor } from "@/components/admin/PageContentEditor";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { CustomerManagement } from "@/components/admin/CustomerManagement";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { NotificationSettings } from "@/components/admin/NotificationSettings";
import { BackupManagement } from "@/components/admin/BackupManagement";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

interface OrderItem {
  name?: string;
  product_name?: string;
  price?: number;
  product_price?: number;
  quantity: number;
  image?: string;
  product_image?: string;
}

const normalizeOrderItem = (item: OrderItem) => ({
  name: item.name || item.product_name || 'Unknown',
  price: item.price || item.product_price || 0,
  quantity: item.quantity || 1,
  image: item.image || item.product_image
});

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  transaction_id?: string;
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders', color: 'bg-muted text-muted-foreground' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const PAYMENT_FILTERS = [
  { value: 'all', label: 'All Payments' },
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
];

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const navigate = useNavigate();

  // Notification hook
  const { newOrderCount, clearNotifications } = useOrderNotifications(isAdmin);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
        setAuthChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      
      const channel = supabase
        .channel('orders-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  // Clear notifications when viewing orders tab
  useEffect(() => {
    if (activeTab === 'orders' && newOrderCount > 0) {
      clearNotifications();
    }
  }, [activeTab, newOrderCount, clearNotifications]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      if (data && !error) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        toast.error("You don't have admin access");
      }
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedOrders = data.map(order => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || []
      }));
      setOrders(formattedOrders);
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      try {
        const { error: emailError } = await supabase.functions.invoke('send-order-status-email', {
          body: {
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            orderId: order.id,
            newStatus,
            items: order.items.map(item => {
              const normalized = normalizeOrderItem(item);
              return {
                name: normalized.name,
                price: normalized.price,
                quantity: normalized.quantity
              };
            }),
            totalAmount: order.total_amount,
            paymentMethod: order.payment_method || 'cod',
            transactionId: order.transaction_id || null
          }
        });

        if (emailError) {
          toast.success(`Status updated to ${newStatus} (email notification failed)`);
        } else {
          toast.success(`Status updated to ${newStatus} - Email sent`);
        }
      } catch (emailErr) {
        toast.success(`Status updated to ${newStatus} (email notification failed)`);
      }
      
      fetchOrders();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteOrder = async (order: Order) => {
    setDeletingOrder(order.id);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;
      
      toast.success(`Order #${order.id.slice(0, 8)} deleted successfully`);
      fetchOrders();
    } catch (error: any) {
      toast.error(`Failed to delete order: ${error.message}`);
    } finally {
      setDeletingOrder(null);
      setOrderToDelete(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getStatusColor = (status: string) => {
    const statusObj = ORDER_STATUSES.find(s => s.value === status);
    return statusObj?.color || 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const openWhatsApp = (order: Order) => {
    const itemsList = order.items
      .map((item) => {
        const normalized = normalizeOrderItem(item);
        return `• ${normalized.name} x${normalized.quantity} - ৳${normalized.price.toLocaleString()}`;
      })
      .join('\n');

    const message = `Hi ${order.customer_name}, regarding your order #${order.id.slice(0, 8)}:\n\n${itemsList}\n\nTotal: ৳${order.total_amount.toLocaleString()}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      order.customer_name.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      order.customer_phone.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.transaction_id?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || 
      (order.payment_method || 'cod') === paymentFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || paymentFilter !== "all" || dateFilter !== "all";

  if (authChecking) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="bg-card border-border max-w-md w-full">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-display text-foreground mb-2 text-center">Admin Access Required</h3>
              <p className="text-muted-foreground text-center text-sm sm:text-base mb-6">
                Please login to access the order management panel.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Login to Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="bg-card border-border max-w-md w-full">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-display text-foreground mb-2 text-center">Access Denied</h3>
              <p className="text-muted-foreground text-center text-sm sm:text-base mb-6">
                You don't have admin privileges to access this page.
              </p>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8 scroll-smooth bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage orders, view analytics, and handle inquiries
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Badge */}
              {newOrderCount > 0 && (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 animate-pulse">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{newOrderCount} new</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">{orders.length}</span>
                <span className="text-muted-foreground text-sm hidden sm:inline">total orders</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto w-full lg:w-auto bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-1.5">
              <TabsTrigger 
                value="orders" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
                {newOrderCount > 0 && (
                  <Badge className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5">
                    {newOrderCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Categories</span>
              </TabsTrigger>
              <TabsTrigger 
                value="collections" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Collections</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="statistics" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Statistics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="site-settings" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Site Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="page-editor" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="menu-editor" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Menus</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BellRing className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity-logs" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <ProductManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <CategoryManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collections Tab */}
            <TabsContent value="collections">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <CollectionManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <SecurityDashboard />
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <CustomerManagement />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Site Settings Tab */}
            <TabsContent value="site-settings">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <SiteSettings />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Page Editor Tab */}
            <TabsContent value="page-editor">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <PageContentEditor />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Editor Tab */}
            <TabsContent value="menu-editor">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <MenuEditor />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <NotificationSettings />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Logs Tab */}
            <TabsContent value="activity-logs">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <ActivityLogs />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              {/* Filters Section */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Search orders by name, email, phone, ID, or transaction..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-base bg-background/50 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="rounded-lg">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Payment" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {PAYMENT_FILTERS.map((payment) => (
                            <SelectItem key={payment.value} value={payment.value} className="rounded-lg">
                              {payment.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="h-11 bg-background/50 border-border/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Date" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all" className="rounded-lg">All Time</SelectItem>
                          <SelectItem value="today" className="rounded-lg">Today</SelectItem>
                          <SelectItem value="week" className="rounded-lg">This Week</SelectItem>
                          <SelectItem value="month" className="rounded-lg">This Month</SelectItem>
                        </SelectContent>
                      </Select>

                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          onClick={clearFilters} 
                          className="h-11 gap-2 text-muted-foreground hover:text-foreground rounded-xl border border-dashed border-border/50"
                        >
                          <X className="w-4 h-4" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16 sm:py-24">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display text-foreground mb-2">
                      {hasActiveFilters ? "No Matching Orders" : "No Orders Yet"}
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {hasActiveFilters 
                        ? "Try adjusting your filters to see more orders." 
                        : "Orders will appear here when customers place them."}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="mt-6 rounded-full">
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="font-display text-lg">
                                  #{order.id.slice(0, 8)}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 sm:hidden">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(order.status)} rounded-full px-3`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                              disabled={updatingStatus === order.id}
                            >
                              <SelectTrigger className="w-[140px] sm:w-[160px] h-10 rounded-xl bg-background/50">
                                {updatingStatus === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <SelectValue placeholder="Update status" />
                                )}
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {ORDER_STATUSES.filter(s => s.value !== 'all').map((status) => (
                                  <SelectItem key={status.value} value={status.value} className="rounded-lg">
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                          {/* Customer Info */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <span className="text-lg">👤</span>
                              </div>
                              <h4 className="font-semibold text-foreground">Customer Details</h4>
                            </div>
                            <div className="space-y-3 pl-[52px]">
                              <p className="text-foreground font-medium text-lg">{order.customer_name}</p>
                              <div className="grid gap-2">
                                <a 
                                  href={`tel:${order.customer_phone}`} 
                                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Phone className="w-4 h-4" />
                                  </div>
                                  {order.customer_phone}
                                </a>
                                <a 
                                  href={`mailto:${order.customer_email}`} 
                                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Mail className="w-4 h-4" />
                                  </div>
                                  <span className="truncate">{order.customer_email}</span>
                                </a>
                                <div className="flex items-start gap-3 text-muted-foreground">
                                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <span className="break-words">{order.customer_address}</span>
                                </div>
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div className="pt-4 border-t border-border/50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  order.payment_method === 'bkash' ? 'bg-pink-500/10' : 
                                  order.payment_method === 'nagad' ? 'bg-orange-500/10' : 'bg-green-500/10'
                                }`}>
                                  {order.payment_method === 'bkash' ? (
                                    <Smartphone className="w-5 h-5 text-pink-500" />
                                  ) : order.payment_method === 'nagad' ? (
                                    <Smartphone className="w-5 h-5 text-orange-500" />
                                  ) : (
                                    <Banknote className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Payment Method</p>
                                  <p className="font-medium capitalize">
                                    {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || 'COD'}
                                  </p>
                                </div>
                              </div>
                              {order.transaction_id && (
                                <div className="flex items-center gap-3 pl-[52px]">
                                  <span className="text-sm text-muted-foreground">TxID:</span>
                                  <code className="font-mono text-xs bg-muted/50 px-3 py-1.5 rounded-full truncate max-w-[180px] sm:max-w-none">
                                    {order.transaction_id}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <span className="text-lg">🛍️</span>
                              </div>
                              <h4 className="font-semibold text-foreground">Order Items</h4>
                            </div>
                            <div className="space-y-3 pl-[52px]">
                              {order.items.map((item, idx) => {
                                const normalized = normalizeOrderItem(item);
                                return (
                                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-foreground">{normalized.name}</span>
                                      <Badge variant="secondary" className="rounded-full text-xs">
                                        x{normalized.quantity}
                                      </Badge>
                                    </div>
                                    <span className="text-primary font-semibold">৳{normalized.price.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                              <div className="pt-4 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent -mx-4 px-4 py-3 rounded-xl">
                                <span className="font-semibold text-foreground">Total Amount</span>
                                <span className="font-display text-2xl text-primary">৳{order.total_amount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWhatsApp(order)}
                            className="gap-2 rounded-full hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${order.customer_phone}`, '_self')}
                            className="gap-2 rounded-full hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50 transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderToDelete(order)}
                            disabled={deletingOrder === order.id}
                            className="gap-2 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50 ml-auto transition-all"
                          >
                            {deletingOrder === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics">
              <OrderStatistics orders={orders} />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <ContactMessages />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #{orderToDelete?.id.slice(0, 8)}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteOrder(orderToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Admin;
