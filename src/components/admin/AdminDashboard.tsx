import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package, ShoppingBag, Banknote, ShieldQuestion, BadgeCheck, BadgeX,
  Loader2, Truck, Clock, ArrowRight
} from "lucide-react";

export interface DashboardOrderItem {
  name?: string;
  product_name?: string;
  price?: number;
  product_price?: number;
  quantity: number;
}

export interface DashboardOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: DashboardOrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  transaction_id?: string;
  payment_status?: string;
}

interface AdminDashboardProps {
  orders: DashboardOrder[];
  loading: boolean;
  updatingStatus: string | null;
  updatingPayment: string | null;
  onUpdateStatus: (orderId: string, status: string) => void;
  onUpdatePaymentStatus: (orderId: string, paymentStatus: string) => void;
  onViewAllOrders: () => void;
}

const STATUS_OPTIONS = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned",
];

const statusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "confirmed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "processing": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "shipped": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "delivered": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const money = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });

export const AdminDashboard = ({
  orders,
  loading,
  updatingStatus,
  updatingPayment,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onViewAllOrders,
}: AdminDashboardProps) => {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const paid = orders.filter((o) => (o.payment_status || "unpaid") === "verified");
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      awaitingPayment: orders.filter((o) => (o.payment_status || "unpaid") === "pending_verification").length,
      inDelivery: orders.filter((o) => ["confirmed", "processing", "shipped"].includes(o.status)).length,
      todayOrders: orders.filter((o) => new Date(o.created_at).toDateString() === today).length,
      revenue: paid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      total: orders.length,
    };
  }, [orders]);

  const paymentQueue = useMemo(
    () => orders.filter((o) => (o.payment_status || "unpaid") === "pending_verification").slice(0, 8),
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status)).slice(0, 10),
    [orders]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "Pending orders", value: stats.pending, icon: Clock },
    { label: "Payments to verify", value: stats.awaitingPayment, icon: ShieldQuestion },
    { label: "In delivery", value: stats.inDelivery, icon: Truck },
    { label: "Orders today", value: stats.todayOrders, icon: ShoppingBag },
    { label: "Verified revenue", value: money(stats.revenue), icon: Banknote },
    { label: "All orders", value: stats.total, icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-card/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
                <card.icon className="w-4 h-4 text-gold shrink-0" />
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-foreground break-words">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments awaiting verification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldQuestion className="w-4 h-4 text-yellow-400" />
            Payments awaiting verification
            {paymentQueue.length > 0 && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {stats.awaitingPayment}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments waiting. You're all caught up.</p>
          ) : (
            paymentQueue.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    #{order.id.slice(0, 8)} · {order.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {money(order.total_amount)} · {(order.payment_method || "cod").toUpperCase()}
                    {order.transaction_id ? ` · TxID ${order.transaction_id}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={updatingPayment === order.id}
                    onClick={() => onUpdatePaymentStatus(order.id, "verified")}
                  >
                    {updatingPayment === order.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <BadgeCheck className="w-3.5 h-3.5 mr-1" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-red-400 hover:text-red-300"
                    disabled={updatingPayment === order.id}
                    onClick={() => onUpdatePaymentStatus(order.id, "rejected")}
                  >
                    <BadgeX className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Open orders with inline status update */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-gold" />
            Open orders
          </CardTitle>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={onViewAllOrders}>
            All orders
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open orders right now.</p>
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background/50"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">#{order.id.slice(0, 8)}</p>
                    <Badge variant="outline" className={statusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.customer_name} · {order.customer_phone} · {money(order.total_amount)} ·{" "}
                    {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {updatingStatus === order.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Select
                    value={order.status}
                    onValueChange={(value) => onUpdateStatus(order.id, value)}
                    disabled={updatingStatus === order.id}
                  >
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize text-xs">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
