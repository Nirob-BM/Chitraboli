import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { BackToTop } from "@/components/BackToTop";
import { AdSense } from "@/components/AdSense";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipToContent } from "@/components/SkipToContent";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Defer the AI Assistant chunk (TTS/voice/chat state) until the browser is idle,
// so it never blocks the homepage's initial paint, TBT, or LCP. Rendered globally
// so the floating widget appears on the right side of every page/device.
const AIAssistant = lazy(() =>
  import("./components/AIAssistant").then((m) => ({ default: m.AIAssistant }))
);

function DeferredAIAssistant() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const trigger = () => setReady(true);
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(trigger, { timeout: 2500 });
    } else {
      const id = setTimeout(trigger, 2500);
      return () => clearTimeout(id);
    }
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <AIAssistant />
    </Suspense>
  );
}

// Lazy load pages for better performance (code splitting)
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const Collections = lazy(() => import("./pages/Collections"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const PaymentReturn = lazy(() => import("./pages/PaymentReturn"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Trust = lazy(() => import("./pages/Trust"));
const BlogIdentifyingHandcraftedJewelry = lazy(
  () => import("./pages/BlogIdentifyingHandcraftedJewelry")
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// AdSense Publisher ID from environment/secrets
const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || "";

const AppContent = () => {
  return (
    <>
      <SkipToContent />
      <AdSense publisherId={ADSENSE_PUBLISHER_ID} />
      <ScrollToTop />
      <main id="main-content">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/localhost-69" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/trust" element={<Trust />} />
            <Route
              path="/blog/identifying-handcrafted-jewelry"
              element={<BlogIdentifyingHandcraftedJewelry />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <CartDrawer />
      <BackToTop />
      <DeferredAIAssistant />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
