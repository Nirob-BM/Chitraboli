import { useState } from "react";
import { useUserOrders, UserOrder } from "@/hooks/useUserOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  FileText,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  confirmed: { color: "bg-blue-500", icon: <CheckCircle2 className="w-4 h-4" />, label: "Confirmed" },
  processing: { color: "bg-purple-500", icon: <Package className="w-4 h-4" />, label: "Processing" },
  shipped: { color: "bg-indigo-500", icon: <Truck className="w-4 h-4" />, label: "Shipped" },
  delivered: { color: "bg-green-500", icon: <CheckCircle2 className="w-4 h-4" />, label: "Delivered" },
  cancelled: { color: "bg-red-500", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
  returned: { color: "bg-orange-500", icon: <RotateCcw className="w-4 h-4" />, label: "Returned" }
};

function OrderCard({ order }: { order: UserOrder }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Product Images */}
          <div className="flex -space-x-3">
            {order.items.slice(0, 3).map((item, i) => (
              <div 
                key={i}
                className="w-14 h-14 rounded-lg border-2 border-background overflow-hidden bg-muted"
              >
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-14 h-14 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Order #{order.id.slice(0, 8)}</span>
              <Badge className={`${status.color} text-white flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
            </p>
            <p className="text-sm">
              {order.items.length} item{order.items.length > 1 ? 's' : ''} • 
              <span className="font-semibold text-primary ml-1">৳{order.total_amount.toLocaleString()}</span>
            </p>
          </div>

          {/* Actions */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order #{order.id.slice(0, 8)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge className={`${status.color} text-white`}>
                    {status.icon}
                    <span className="ml-1">{status.label}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Items</h4>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category && <span className="capitalize">{item.category}</span>}
                          {item.size && <span> • Size: {item.size}</span>}
                          {item.color && <span> • {item.color}</span>}
                        </p>
                        <p className="text-sm mt-1">
                          ৳{item.price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Delivery Address</h4>
                  <p className="text-sm text-muted-foreground">{order.customer_address}</p>
                </div>

                {/* Payment Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Payment</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {order.payment_method || 'Cash on Delivery'}
                    {order.transaction_id && <span> • TxnID: {order.transaction_id}</span>}
                  </p>
                </div>

                {/* Rider Info */}
                {order.rider && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Delivery Rider</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>{order.rider.name}</span>
                      <span className="text-muted-foreground">({order.rider.phone})</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-primary">
                    ৳{order.total_amount.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-4 h-4 mr-1" />
                    Download Invoice
                  </Button>
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Request Return
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileOrders() {
  const { orders, loading, getActiveOrders, getCompletedOrders, getOrdersByStatus } = useUserOrders();
  const [filter, setFilter] = useState("all");

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const filteredOrders = filter === "all" 
    ? orders 
    : filter === "active" 
      ? getActiveOrders() 
      : filter === "completed" 
        ? getCompletedOrders()
        : getOrdersByStatus(filter as UserOrder['status']);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{orders.length}</div>
            <div className="text-xs text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{getActiveOrders().length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{getCompletedOrders().length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{getOrdersByStatus('cancelled').length}</div>
            <div className="text-xs text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No orders found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === "all" 
                ? "You haven't placed any orders yet." 
                : `No ${filter} orders.`}
            </p>
            <Button asChild>
              <a href="/shop">Start Shopping</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
