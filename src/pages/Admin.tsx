import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Phone, Mail, MapPin, Calendar, ExternalLink, LogOut, Loader2, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";
import type { User, Session } from "@supabase/supabase-js";

interface OrderItem {
  name?: string;
  product_name?: string;
  price?: number;
  product_price?: number;
  quantity: number;
  image?: string;
  product_image?: string;
}

// Helper to normalize order item data
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
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const navigate = useNavigate();

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
      
      // Send email notification
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
          console.error('Email notification failed:', emailError);
          toast.success(`Status updated to ${newStatus} (email notification failed)`);
        } else {
          toast.success(`Status updated to ${newStatus} - Email sent to customer`);
        }
      } catch (emailErr) {
        console.error('Email notification error:', emailErr);
        toast.success(`Status updated to ${newStatus} (email notification failed)`);
      }
      
      fetchOrders();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
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

  // Auth checking state
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

  // Not logged in
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-card border-border max-w-md w-full mx-4">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-display text-foreground mb-2">Admin Access Required</h3>
              <p className="text-muted-foreground text-center mb-6">
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

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="bg-card border-border max-w-md w-full mx-4">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-red-400 mb-4" />
              <h3 className="text-xl font-display text-foreground mb-2">Access Denied</h3>
              <p className="text-muted-foreground text-center mb-6">
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
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl text-foreground">Order Management</h1>
              <p className="text-muted-foreground mt-1">View and manage all customer orders</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {orders.length} Orders
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-display text-foreground mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground">Orders will appear here when customers place them.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="bg-card border-border overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <CardTitle className="font-display text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger className="w-[160px]">
                            {updatingStatus === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <SelectValue placeholder="Update status" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            👤
                          </span>
                          Customer Details
                        </h4>
                        <div className="space-y-2 pl-10">
                          <p className="text-foreground font-medium">{order.customer_name}</p>
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${order.customer_phone}`} className="hover:text-primary transition-colors">
                              {order.customer_phone}
                            </a>
                          </p>
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${order.customer_email}`} className="hover:text-primary transition-colors">
                              {order.customer_email}
                            </a>
                          </p>
                          <p className="text-muted-foreground flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                            <span>{order.customer_address}</span>
                          </p>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-4 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 text-sm">
                            {order.payment_method === 'bkash' ? (
                              <Smartphone className="w-4 h-4 text-pink-500" />
                            ) : order.payment_method === 'nagad' ? (
                              <Smartphone className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Banknote className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="font-medium capitalize">
                              {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || 'COD'}
                            </span>
                          </div>
                          {order.transaction_id && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">TxID:</span>
                              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                {order.transaction_id}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            🛍️
                          </span>
                          Order Items
                        </h4>
                        <div className="space-y-2 pl-10">
                          {order.items.map((item, idx) => {
                            const normalized = normalizeOrderItem(item);
                            return (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-foreground">
                                  {normalized.name} <span className="text-muted-foreground">x{normalized.quantity}</span>
                                </span>
                                <span className="text-primary font-medium">৳{normalized.price.toLocaleString()}</span>
                              </div>
                            );
                          })}
                          <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                            <span className="font-semibold text-foreground">Total</span>
                            <span className="font-display text-xl text-primary">৳{order.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openWhatsApp(order)}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Contact on WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${order.customer_phone}`, '_self')}
                        className="gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Call Customer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
