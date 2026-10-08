import { useState, lazy, Suspense } from "react";
import { Check, Truck, Package, ClipboardList, Bike, MapPin, Copy, ChevronRight, ChevronDown, ArrowRight, Phone, XCircle, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DeliveryMap = lazy(() => import("@/components/DeliveryMap"));

export interface TrackedItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

export interface TrackedOrder {
  id: string;
  customer_name: string;
  items: TrackedItem[];
  total_amount: number;
  status: string;
  created_at: string;
  rider_id: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_vehicle_type: string | null;
  rider_assigned_at: string | null;
}

interface Props {
  order: TrackedOrder;
  onETAUpdate?: (minutes: number, distanceKm: number) => void;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtStamp = (d: string) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const taka = (n: number) => `৳${n.toLocaleString()}`;

/** Maps the order status onto the 4-stage stepper (0..4, 4 = all done). */
const progressIndex = (o: TrackedOrder) => {
  switch (o.status) {
    case "pending": return 0;
    case "confirmed":
    case "processing": return 1;
    case "shipped": return o.rider_assigned_at ? 3 : 2;
    case "delivered": return 4;
    default: return 0;
  }
};

const STAGES = [
  { label: "Order Placed", icon: ClipboardList },
  { label: "Processing", icon: Package },
  { label: "Shipped", icon: Truck },
  { label: "Out for Delivery", icon: Bike },
];

export function TrackingDashboard({ order, onETAUpdate }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cancelled = order.status === "cancelled";
  const current = progressIndex(order);
  const first = order.items[0];
  const trackingNo = `CHB-${order.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const shortId = order.id.slice(0, 8).toUpperCase();

  const stamps: (string | null)[] = [
    order.created_at,
    current >= 1 ? null : null,
    null,
    order.rider_assigned_at,
  ];

  const history = [
    { title: "Order placed", note: `Received from ${order.customer_name}`, at: order.created_at, done: true },
    { title: "Processing", note: "Your jewellery is being prepared and packed", at: null, done: current >= 1 },
    { title: "Shipped", note: "Handed over to our delivery partner", at: null, done: current >= 2 },
    { title: "Out for delivery", note: order.rider_name ? `With ${order.rider_name}` : "Rider on the way", at: order.rider_assigned_at, done: current >= 3 },
    { title: "Delivered", note: "Enjoy your Chitraboli piece", at: null, done: current >= 4 },
  ].filter((h) => h.done).reverse();

  const latest = cancelled
    ? { title: "Cancelled", note: "This order has been cancelled" }
    : history[0];

  const statusLine = cancelled
    ? "This order was cancelled"
    : current >= 4
      ? "Your package has been delivered"
      : current >= 2
        ? "Your package is on the way"
        : "We're preparing your order";
  const arrival = current >= 4 ? "Delivered" : current >= 3 ? "Arriving today" : current >= 2 ? "Arriving in 1–2 days" : "Arriving in 3–5 days";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNo);
      toast({ title: "Copied", description: "Tracking number copied to clipboard" });
    } catch {
      toast({ title: "Couldn't copy", description: trackingNo, variant: "destructive" });
    }
  };

  const card = "rounded-xl border border-border bg-card shadow-card";
  const truckPos = Math.min(current, 3) / 3; // 0..1 along the route

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header & product summary */}
      <section className={cn(card, "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4")}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-20 h-20 shrink-0 rounded-xl bg-muted overflow-hidden">
            {first?.image ? (
              <img src={first.image} alt={first.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <Package className="w-8 h-8 m-6 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground truncate">{first?.name ?? "Your order"}</h2>
            <p className="text-sm text-muted-foreground">
              {[first?.color, first?.size].filter(Boolean).join(" / ") || `Qty ${first?.quantity ?? 1}`}
              {order.items.length > 1 && ` · +${order.items.length - 1} more`}
            </p>
            <p className="text-primary font-semibold mt-1">{taka(order.total_amount)}</p>
          </div>
        </div>
        <div className="flex sm:flex-col justify-between sm:items-end gap-1 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
          <p className="font-semibold text-foreground">Order #{shortId}</p>
          <p className="text-xs text-muted-foreground">Placed on {fmtDate(order.created_at)}</p>
        </div>
      </section>

      {/* Progress timeline */}
      <section className={cn(card, "p-4 sm:p-6")} aria-label="Order progress">
        {cancelled ? (
          <div className="flex items-center gap-3 text-destructive bg-destructive/10 p-4 rounded-xl">
            <XCircle className="w-6 h-6" aria-hidden />
            <span className="font-medium">This order has been cancelled</span>
          </div>
        ) : (
          <ol className="grid grid-cols-4 relative">
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-purple-accent transition-all duration-700"
                style={{ width: `${(Math.min(current, 3) / 3) * 100}%` }}
              />
            </div>
            {STAGES.map((s, i) => {
              const done = i < current || current >= 4;
              const active = i === current && current < 4;
              const Icon = active ? (i >= 2 ? Truck : s.icon) : s.icon;
              return (
                <li key={s.label} className="relative flex flex-col items-center text-center px-1">
                  <span
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10",
                      done && "bg-purple-accent border-purple-accent text-foreground",
                      active && "bg-primary border-primary text-primary-foreground shadow-gold ring-4 ring-primary/20",
                      !done && !active && "bg-card border-muted text-muted-foreground",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? <Check className="w-5 h-5" aria-hidden /> : <Icon className="w-5 h-5" aria-hidden />}
                  </span>
                  <span className={cn("mt-2 text-[11px] sm:text-sm font-medium leading-tight", done || active ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                  <span className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground leading-tight">
                    {stamps[i] ? fmtStamp(stamps[i]!) : done ? "Completed" : active ? "In progress" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Route map */}
      <section className={cn(card, "relative overflow-hidden")} aria-label="Delivery route">
        {order.status === "shipped" && order.rider_id ? (
          <div className="p-2">
            <Suspense fallback={<Skeleton className="w-full h-64 rounded-xl" />}>
              <DeliveryMap
                riderId={order.rider_id}
                riderName={order.rider_name || "Delivery Rider"}
                riderVehicleType={order.rider_vehicle_type || "motorcycle"}
                onETAUpdate={onETAUpdate}
              />
            </Suspense>
          </div>
        ) : (
          <div className="relative h-56 sm:h-64 bg-background">
            <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0H0V24" fill="none" className="stroke-border" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="200" fill="url(#grid)" />
              <path d="M0 140 Q120 90 200 120 T400 70" fill="none" className="stroke-muted" strokeWidth="10" />
              <path d="M40 60 L150 180 M260 0 L320 200" fill="none" className="stroke-muted" strokeWidth="6" />
              <path id="route" d="M50 150 C130 150 140 70 220 90 S320 60 350 50" fill="none" className="stroke-muted-foreground/40" strokeWidth="3" strokeDasharray="6 6" />
              <path
                d="M50 150 C130 150 140 70 220 90 S320 60 350 50"
                fill="none"
                className="stroke-purple-accent transition-all duration-700"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={`${truckPos} 1`}
              />
              <circle cx="50" cy="150" r="7" className="fill-purple-accent" />
            </svg>
            {/* Truck along route (approximate positions) */}
            {!cancelled && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                style={{
                  left: `${[12.5, 35, 55, 80][Math.min(current, 3)]}%`,
                  top: `${[75, 55, 45, 30][Math.min(current, 3)]}%`,
                }}
              >
                <span className="flex w-10 h-10 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-gold ring-4 ring-primary/25">
                  <Truck className="w-5 h-5" aria-hidden />
                </span>
              </div>
            )}
            <MapPin className="absolute w-8 h-8 text-primary -translate-x-1/2 -translate-y-full" style={{ left: "87.5%", top: "25%" }} aria-hidden />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 sm:right-auto rounded-xl bg-card/95 backdrop-blur border border-border px-3 py-2 text-sm shadow-card flex flex-wrap items-center gap-x-2 z-10">
          <span className="font-medium text-foreground">{statusLine}</span>
          <span className="text-muted-foreground" aria-hidden>|</span>
          <span className="text-primary font-medium">{arrival}</span>
        </div>
      </section>

      {/* Info & history */}
      <section className={cn(card, "divide-y divide-border")}>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Tracking Number</p>
            <p className="font-mono font-medium text-foreground truncate">{trackingNo}</p>
          </div>
          <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-gold-light transition-colors rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Copy className="w-4 h-4" aria-hidden /> Copy
          </button>
        </div>

        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Latest Update</p>
            <p className="font-medium text-foreground truncate">
              {latest.title} – {latest.note}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden />
        </button>

        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors">
            <span>
              <span className="font-medium text-foreground">Tracking History</span>
              <span className="block text-xs text-muted-foreground">View all status updates</span>
            </span>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", historyOpen && "rotate-180")} aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="px-4 pb-4 space-y-4">
              {(cancelled ? [{ title: "Cancelled", note: "This order has been cancelled", at: null, done: true }, ...history] : history).map((h, i) => (
                <li key={h.title} className="flex gap-3">
                  <span className={cn("mt-1 w-3 h-3 rounded-full shrink-0", i === 0 ? "bg-primary" : "bg-purple-accent")} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.note}</p>
                    {h.at && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" aria-hidden />{fmtStamp(h.at)}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>

        {order.rider_name && !cancelled && current >= 2 && (
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Delivery Rider</p>
              <p className="font-medium text-foreground">{order.rider_name}</p>
            </div>
            {order.rider_phone && (
              <a href={`tel:${order.rider_phone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-gold-light">
                <Phone className="w-4 h-4" aria-hidden /> Call
              </a>
            )}
          </div>
        )}
      </section>

      {/* Order details */}
      {detailsOpen && (
        <section className={cn(card, "p-4 sm:p-5 space-y-3 animate-fade-in")} id="order-details">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              {it.image && <img src={it.image} alt={it.name} className="w-12 h-12 rounded-xl object-cover" loading="lazy" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
              </div>
              <p className="text-sm font-medium text-foreground">{taka(it.price * it.quantity)}</p>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-primary">{taka(order.total_amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground break-all">Order ID: {order.id}</p>
        </section>
      )}

      <button
        onClick={() => setDetailsOpen((v) => !v)}
        className="group w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-gold-light hover:shadow-gold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={detailsOpen}
      >
        {detailsOpen ? "Hide Order Details" : "View Order Details"}
        <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", detailsOpen && "-rotate-90")} aria-hidden />
      </button>
    </div>
  );
}

export default TrackingDashboard;
