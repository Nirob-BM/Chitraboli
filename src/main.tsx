import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force the app to start at the top on hard refresh / first load.
// Using requestAnimationFrame to avoid forced reflow issues.
if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  // Scroll to top without forcing reflow by batching in rAF
  const forceTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  forceTop();
  window.addEventListener("load", forceTop, { once: true });
}

createRoot(document.getElementById("root")!).render(<App />);
