import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  // Initial mount: set scroll restoration to manual (no DOM read/write that causes reflow)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Use requestAnimationFrame to batch scroll operation and avoid forced reflow
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

  // Route changes: smooth scroll (but skip the very first render).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Use requestAnimationFrame to prevent forced reflow
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [pathname]);

  return null;
};

