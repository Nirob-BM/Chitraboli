import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { preloadRoute, routeLoaders } from "@/lib/routePreload";

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
const Index = lazy(routeLoaders.home);
const Shop = lazy(routeLoaders.shop);
const Collections = lazy(routeLoaders.collections);
const About = lazy(routeLoaders.about);
const Contact = lazy(routeLoaders.contact);
const Admin = lazy(routeLoaders.admin);
const Auth = lazy(routeLoaders.auth);
const ResetPassword = lazy(routeLoaders.resetPassword);
const TrackOrder = lazy(routeLoaders.trackOrder);
const PaymentReturn = lazy(routeLoaders.paymentReturn);
const ProductDetail = lazy(routeLoaders.product);
const Profile = lazy(routeLoaders.profile);
const NotFound = lazy(routeLoaders.notFound);
const Trust = lazy(routeLoaders.trust);
const BlogIdentifyingHandcraftedJewelry = lazy(routeLoaders.blog);

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
  const location = useLocation();

  useEffect(() => {
    const preloadLink = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.origin !== window.location.origin) return;

      preloadRoute(anchor.pathname);
    };

    document.addEventListener("pointerover", preloadLink, { passive: true });
    document.addEventListener("focusin", preloadLink);
    document.addEventListener("touchstart", preloadLink, { passive: true });

    return () => {
      document.removeEventListener("pointerover", preloadLink);
      document.removeEventListener("focusin", preloadLink);
      document.removeEventListener("touchstart", preloadLink);
    };
  }, []);

  return (
    <>
      <SkipToContent />
      <AdSense publisherId={ADSENSE_PUBLISHER_ID} />
      <ScrollToTop />
      <main id="main-content">
        <Suspense fallback={<PageSkeleton />}>
          <div key={location.pathname} className="route-enter">
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
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
          </div>
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
