import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, ShieldCheck, History, ArrowRight, Phone, User, Bike, Car, MapPin, Timer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeliveryNotifications } from "@/hooks/useDeliveryNotifications";

// Lazy load the map component
const DeliveryMap = lazy(() => import("@/components/DeliveryMap"));

interface OrderItem {
  name?: string;
  product_name?: string;
  price?: number;
  product_price?: number;
  quantity: number;
  image?: string;
  product_image?: string;
}

interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  rider_id: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_vehicle_type: string | null;
  rider_assigned_at: string | null;
}

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const normalizeOrderItem = (item: OrderItem) => ({
  name: item.name || item.product_name || 'Unknown',
  price: item.price || item.product_price || 0,
  quantity: item.quantity || 1,
  image: item.image || item.product_image
});

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
  { value: 'confirmed', label: 'Confirmed', icon: Package, color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500/20 text-red-600 border-red-500/30' },
];

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [etaMinutes, setETAMinutes] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const { sendNearbyNotification } = useDeliveryNotifications();

  // Handle ETA updates from map
  const handleETAUpdate = useCallback((minutes: number, distance: number) => {
    setETAMinutes(minutes);
    setDistanceKm(distance);

    // Send notification if rider is near (within 500m)
    if (order && distance <= 0.5) {
      sendNearbyNotification(
        {
          orderId: order.id,
          customerPhone: phoneNumber,
          customerName: order.customer_name,
          riderName: order.rider_name || "Delivery Rider",
          thresholdKm: 0.5,
        },
        distance,
        minutes
      );
    }
  }, [order, phoneNumber, sendNearbyNotification]);

  // Load order history when phone number has 11 digits (Bangladesh format)
  useEffect(() => {
    const loadOrderHistory = async () => {
      if (phoneNumber.trim().length >= 11) {
        setLoadingRecent(true);
        try {
          // Try to fetch recent orders for this phone number using the RPC
          const { data, error } = await supabase.rpc('track_order', {
            order_id: '00000000-0000-0000-0000-000000000000', // Dummy ID to get validation error
            phone_number: phoneNumber.trim()
          });
          
          // This will fail validation but we're just checking connectivity
          // Real order history needs to be fetched after a successful track
        } catch (e) {
          // Expected to fail
        } finally {
          setLoadingRecent(false);
        }
      } else {
        setRecentOrders([]);
      }
    };

    loadOrderHistory();
  }, [phoneNumber]);

  // Store found order in recent orders list
  useEffect(() => {
    if (order) {
      setRecentOrders(prev => {
        const exists = prev.find(o => o.id === order.id);
        if (exists) return prev;
        const newOrder: RecentOrder = {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount,
          created_at: order.created_at
        };
        return [newOrder, ...prev].slice(0, 5); // Keep last 5 orders
      });
    }
  }, [order]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim() || !phoneNumber.trim()) {
      toast({
        title: "Both fields required",
        description: "Please enter both your order ID and phone number for verification",
        variant: "destructive"
      });
      return;
    }

    if (phoneNumber.trim().length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number (at least 10 digits)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Use edge function with server-side rate limiting
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/track-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          phoneNumber: phoneNumber.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Too many attempts",
            description: result.error || "Please wait a few minutes before trying again.",
            variant: "destructive"
          });
          setOrder(null);
          return;
        }
        throw new Error(result.error || 'Order not found');
      }

      if (result.success && result.order) {
        const orderData = result.order;
        setOrder({
          id: orderData.id,
          customer_name: orderData.customer_name,
          status: orderData.status,
          created_at: orderData.created_at,
          total_amount: orderData.total_amount,
          items: Array.isArray(orderData.items) ? (orderData.items as unknown as OrderItem[]) : [],
          rider_id: orderData.rider_id,
          rider_name: orderData.rider_name,
          rider_phone: orderData.rider_phone,
          rider_vehicle_type: orderData.rider_vehicle_type,
          rider_assigned_at: orderData.rider_assigned_at
        });
      } else {
        setOrder(null);
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setOrder(null);
      toast({
        title: "Order not found",
        description: error.message || "No order found with the provided details. Please verify your order ID and phone number.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  };

  const getStatusSteps = (currentStatus: string) => {
    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (currentStatus === 'cancelled') {
      return statusOrder.map((status) => ({
        ...ORDER_STATUSES.find(s => s.value === status)!,
        completed: false,
        current: false,
        cancelled: true
      }));
    }

    return statusOrder.map((status, index) => ({
      ...ORDER_STATUSES.find(s => s.value === status)!,
      completed: index < currentIndex,
      current: index === currentIndex,
      cancelled: false
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      {/* Track Order Section */}
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Enter your order ID and phone number to check your order status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>For your security, both order ID and phone number are required</span>
              </div>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="Enter your order ID..."
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter the phone number used for this order..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  {loading ? 'Searching...' : 'Track Order'}
                </Button>
              </form>

              {/* Recent Orders History */}
              {recentOrders.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Recent Orders</span>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map((recentOrder) => {
                      const statusInfo = ORDER_STATUSES.find(s => s.value === recentOrder.status) || ORDER_STATUSES[0];
                      return (
                        <button
                          key={recentOrder.id}
                          type="button"
                          onClick={() => setOrderId(recentOrder.id)}
                          className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <p className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                              {recentOrder.id}
                            </p>
                            <p className="text-sm font-medium">
                              ৳{recentOrder.total_amount.toLocaleString()}
                            </p>
                          </div>
                          <Badge className={`${statusInfo.color} text-xs`}>
                            {statusInfo.label}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Result */}
          {searched && !loading && (
            <>
              {order ? (
                <div className="space-y-6">
                  {/* Status Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order Status</span>
                        <Badge className={getStatusInfo(order.status).color}>
                          {getStatusInfo(order.status).label}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {order.status === 'cancelled' ? (
                        <div className="flex items-center gap-3 text-red-500 bg-red-500/10 p-4 rounded-lg">
                          <XCircle className="w-6 h-6" />
                          <span className="font-medium">This order has been cancelled</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex justify-between">
                            {getStatusSteps(order.status).map((step) => {
                              const Icon = step.icon;
                              return (
                                <div key={step.value} className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                      step.completed || step.current
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <span className={`text-xs mt-2 text-center ${
                                    step.completed || step.current ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          {/* Progress line */}
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10 mx-8">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${
                                  (ORDER_STATUSES.findIndex(s => s.value === order.status) / 
                                  (ORDER_STATUSES.length - 2)) * 100
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Delivery Rider Info with Live Map */}
                  {order.rider_name && (order.status === 'shipped' || order.status === 'confirmed') && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-primary" />
                          Delivery Rider
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                            {order.rider_vehicle_type === 'motorcycle' ? (
                              <Bike className="w-7 h-7 text-primary" />
                            ) : order.rider_vehicle_type === 'car' ? (
                              <Car className="w-7 h-7 text-primary" />
                            ) : (
                              <User className="w-7 h-7 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{order.rider_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {order.rider_vehicle_type || 'Delivery Partner'}
                            </p>
                          </div>
                        </div>
                        
                        {order.rider_phone && (
                          <a 
                            href={`tel:${order.rider_phone}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call Rider: {order.rider_phone}
                          </a>
                        )}

                        {/* ETA Display */}
                        {etaMinutes !== null && distanceKm !== null && (
                          <div className="flex items-center justify-center gap-4 p-3 bg-primary/10 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Timer className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-lg font-bold text-primary">
                                  {etaMinutes < 60 ? `${etaMinutes} min` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`}
                                </p>
                                <p className="text-xs text-muted-foreground">Estimated arrival</p>
                              </div>
                            </div>
                            <div className="w-px h-10 bg-border" />
                            <div className="text-center">
                              <p className="text-lg font-bold text-foreground">{distanceKm} km</p>
                              <p className="text-xs text-muted-foreground">Distance</p>
                            </div>
                          </div>
                        )}

                        {/* Live Tracking Map */}
                        {order.status === 'shipped' && order.rider_id && (
                          <div className="pt-2">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">Live Location</span>
                            </div>
                            <Suspense fallback={
                              <Skeleton className="w-full h-64 rounded-lg" />
                            }>
                              <DeliveryMap 
                                riderId={order.rider_id} 
                                riderName={order.rider_name || 'Delivery Rider'}
                                riderVehicleType={order.rider_vehicle_type || 'motorcycle'}
                                onETAUpdate={handleETAUpdate}
                              />
                            </Suspense>
                          </div>
                        )}
                        
                        {order.rider_assigned_at && (
                          <p className="text-xs text-center text-muted-foreground">
                            Assigned on {formatDate(order.rider_assigned_at)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Order ID</span>
                          <p className="font-mono text-xs break-all">{order.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Order Date</span>
                          <p>{formatDate(order.created_at)}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Customer Name</span>
                          <p>{order.customer_name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items.map((item, index) => {
                          const normalized = normalizeOrderItem(item);
                          return (
                            <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                              {normalized.image && (
                                <img
                                  src={normalized.image}
                                  alt={normalized.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{normalized.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {normalized.quantity}
                                </p>
                              </div>
                              <p className="font-medium">
                                ₹{(normalized.price * normalized.quantity).toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t mt-4 pt-4 flex justify-between items-center">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{order.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Order Found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find an order matching both the order ID and phone number.
                      <br />
                      Please verify your details and try again.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* About Chitraboli Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Gradient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-background to-gold-light/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent opacity-50" />
        
        {/* Decorative sparkles */}
        <div className="absolute top-8 left-[10%] w-2 h-2 bg-gold/60 rounded-full animate-pulse" />
        <div className="absolute top-16 left-[25%] w-1.5 h-1.5 bg-gold-light/50 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-12 right-[15%] w-2.5 h-2.5 bg-gold/40 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
        <div className="absolute top-20 right-[30%] w-1 h-1 bg-gold-light/60 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
        <div className="absolute bottom-12 left-[20%] w-1.5 h-1.5 bg-gold/50 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-8 right-[20%] w-2 h-2 bg-gold-light/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-16 left-[35%] w-1 h-1 bg-gold/70 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
        <div className="absolute bottom-20 right-[35%] w-1.5 h-1.5 bg-gold-light/50 rounded-full animate-pulse" style={{ animationDelay: '1.1s' }} />
        
        {/* Decorative diamond pattern */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2 w-3 h-3 border border-gold/30 rotate-45" />
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-3 h-3 border border-gold/30 rotate-45" />
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 border border-gold-light/20 rotate-45" />
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-2 h-2 border border-gold-light/20 rotate-45" />
        
        <div className="container mx-auto px-4 text-center max-w-2xl relative z-10">
          <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-2">
            About <span className="text-gold">Chitraboli</span>
          </h2>
          <p className="font-display text-lg text-gold-light mb-4">চিত্রাবলী ✨</p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Chitraboli – চিত্রাবলী creates handmade jewellery inspired by art, tradition and passion. 
            Every piece is crafted with love to make you shine. We believe that jewellery is not just 
            an accessory, but a reflection of your unique personality and style.
          </p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/about">
              Learn More About Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default TrackOrder;