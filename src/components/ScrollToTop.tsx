import { useEffect, useRef, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  // Disable browser scroll restoration immediately
  if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  // Force scroll to top BEFORE paint on initial load/refresh
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Also force on mount with useEffect as fallback
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle route changes - smooth scroll after first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
};
