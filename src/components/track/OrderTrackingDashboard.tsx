import { useEffect, useRef, useState } from "react";
import { Check, Truck, Package, ClipboardList, Home, ChevronRight, ChevronDown, MapPin, XCircle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  status: string;
  created_at: string;
  total_amount: number;
  rider_name: string | null;
  rider_assigned_at: string | null;
  items: TrackedItem[];
}

const STEPS = [
  { key: "pending", label: "Order Placed", icon: ClipboardList },
  { key: "confirmed", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const taka = (n: number) => `৳${n.toLocaleString()}`;

export function OrderTrackingDashboard({ order, children }: { order: TrackedOrder; children?: React.ReactNode }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cancelled = order.status === "cancelled";
  const current = Math.max(0, STEPS.findIndex((s) => s.key === order.status));
  const trackingNo = `CHB-${order.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const first = order.items[0];
  const eta = new Date(new Date(order.created_at).getTime() + 3 * 864e5);
  const daysLeft = Math.max(0, Math.ceil((eta.getTime() - Date.now()) / 864e5));

  // Real events only: placement, rider assignment, and current status
  const history = [
    { title: "Order placed", note: `By ${order.customer_name}`, at: order.created_at },
    ...(order.rider_assigned_at
      ? [{ title: "Rider assigned", note: order.rider_name || "Delivery partner", at: order.rider_assigned_at }]
      : []),
    ...(current > 0 || cancelled
      ? [{ title: cancelled ? "Cancelled" : STEPS[current].label, note: "Latest status update", at: null as string | null }]
      : []),
  ].reverse();
  const latest = history[0];

  const stepTime = (i: number) =>
    i === 0 ? fmtTime(order.created_at) : i === 2 && order.rider_assigned_at ? fmtTime(order.rider_assigned_at) : i <= current ? "Done" : "Pending";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNo);
      toast({ title: "Copied", description: "Tracking number copied to clipboard." });
    } catch {
      toast({ title: "Couldn't copy", description: trackingNo });
    }
  };

  const progressPct = cancelled ? 0 : (current / (STEPS.length - 1)) * 100;
  const pathRef = useRef<SVGPathElement>(null);
  const [truckPt, setTruckPt] = useState({ x: 50, y: 130 });
  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const pt = p.getPointAtLength((p.getTotalLength() * progressPct) / 100);
    setTruckPt({ x: pt.x, y: pt.y });
  }, [progressPct]);
  const mapMessage =
    order.status === "delivered" ? "Your package was delivered"
    : order.status === "shipped" ? "Your package is on the way"
    : order.status === "confirmed" ? "Your order is being prepared"
    : "Order received";

  return (
    <div className="animate-fade-up space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7 shadow-card space-y-7">
        {/* Product overview */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
              {first?.image ? (
                <img src={first.image} alt={first.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Package className="m-auto mt-6 h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground truncate">
                {first?.name || "Your order"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {[first?.color, first?.size].filter(Boolean).join(" / ") || `Qty ${first?.quantity ?? 1}`}
                {order.items.length > 1 && ` · +${order.items.length - 1} more item${order.items.length > 2 ? "s" : ""}`}
              </p>
              <p className="mt-1 text-lg font-semibold text-primary">{taka(order.total_amount)}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-medium text-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">Placed on {fmtDate(order.created_at)}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Stepper */}
        {cancelled ? (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">This order has been cancelled</span>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[12.5%] right-[12.5%] top-5 h-0.5 bg-muted">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <ol className="relative grid grid-cols-4 gap-1">
              {STEPS.map((s, i) => {
                const done = i < current || (i === current && s.key === "delivered");
                const active = i === current && !done;
                const Icon = s.icon;
                return (
                  <li key={s.key} className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && "border-primary bg-primary/15 text-primary shadow-gold scale-110",
                        !done && !active && "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {done ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={cn("mt-2 text-[11px] sm:text-sm leading-tight", done || active ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                    <span className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground/70">{stepTime(i)}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Route map */}
        {!cancelled && (
          <div className="relative overflow-hidden rounded-xl border border-border bg-background">
            <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="h-40 w-full sm:h-48" aria-hidden="true">
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0H0V24" fill="none" className="stroke-border" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="600" height="180" fill="url(#grid)" opacity="0.6" />
              <path ref={pathRef} d="M50 130 C150 40, 250 160, 340 90 S500 40, 550 70" fill="none" className="stroke-muted" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
              <path d="M50 130 C150 40, 250 160, 340 90 S500 40, 550 70" fill="none" className="stroke-primary" strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${progressPct} 100`} style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }} />
              <circle cx="50" cy="130" r="7" className="fill-primary" />
            </svg>
            <div className="absolute right-[6%] top-[22%] text-primary"><MapPin className="h-7 w-7" /></div>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-2 text-primary-foreground shadow-gold transition-all duration-700"
              style={{ left: `${(truckPt.x / 600) * 100}%`, top: `${(truckPt.y / 180) * 100}%` }}
            >
              <Truck className="h-4 w-4" />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs sm:text-sm backdrop-blur">
              <span className="text-foreground">{mapMessage}</span>
              {order.status !== "delivered" && (
                <span className="text-muted-foreground"> | {daysLeft > 0 ? `Arriving in ${daysLeft} day${daysLeft > 1 ? "s" : ""}` : "Arriving soon"}</span>
              )}
            </div>
          </div>
        )}

        {/* Tracking number */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Tracking Number</p>
            <p className="font-mono text-sm sm:text-base text-foreground truncate">{trackingNo}</p>
          </div>
          <button onClick={copy} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline active:scale-95 transition">
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>

        {/* Latest update */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="group flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition hover:border-primary/50 hover:bg-muted/30"
        >
          <div>
            <p className="font-medium text-foreground">{latest.title}</p>
            <p className="text-xs text-muted-foreground">{latest.note}{latest.at ? ` · ${fmtTime(latest.at)}` : ""}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
        </button>

        {/* History accordion */}
        <div className="rounded-xl border border-border">
          <button onClick={() => setHistoryOpen((o) => !o)} aria-expanded={historyOpen} className="flex w-full items-center justify-between p-4 text-left">
            <span>
              <span className="font-medium text-foreground">Tracking History</span>
              <span className="ml-2 text-xs text-muted-foreground">(View all status updates)</span>
            </span>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", historyOpen && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-300", historyOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <ol className="overflow-hidden">
              {history.map((h, i) => (
                <li key={i} className="flex gap-3 border-t border-border px-4 py-3">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                  <div>
                    <p className="text-sm text-foreground">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.note}{h.at ? ` · ${fmtTime(h.at)}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Order details */}
        <div className={cn("grid transition-all duration-300", detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
          <div className="overflow-hidden space-y-3">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                {it.image && <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{taka(it.price * it.quantity)}</p>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Total · {order.customer_name}</span>
              <span className="font-semibold text-primary">{taka(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDetailsOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.99]"
        >
          {detailsOpen ? "Hide Order Details" : "View Order Details"}
          <ChevronRight className={cn("h-5 w-5 transition-transform", detailsOpen && "rotate-90")} />
        </button>
      </section>
      {children}
    </div>
  );
}
