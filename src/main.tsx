import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force the app to start at the top on hard refresh / first load.
// (Some browsers restore scroll position on reload unless this is set very early.)
if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const forceTop = () => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  };

  // Run ASAP and again after load (some browsers restore late)
  forceTop();
  window.addEventListener("load", forceTop, { once: true });
}

createRoot(document.getElementById("root")!).render(<App />);
