import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Phone, Mail, MapPin, Calendar, ExternalLink } from "lucide-react";
import { Layout } from "@/components/Layout";
import type { Json } from "@/integrations/supabase/types";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

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
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to realtime updates
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
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
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
      .map((item) => `• ${item.name} x${item.quantity} - ৳${item.price.toLocaleString()}`)
      .join('\n');

    const message = `Hi ${order.customer_name}, regarding your order #${order.id.slice(0, 8)}:\n\n${itemsList}\n\nTotal: ৳${order.total_amount.toLocaleString()}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
  };

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
            <Badge variant="outline" className="text-lg px-4 py-2">
              {orders.length} Orders
            </Badge>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.created_at)}
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
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-foreground">
                                {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                              </span>
                              <span className="text-primary font-medium">৳{item.price.toLocaleString()}</span>
                            </div>
                          ))}
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
