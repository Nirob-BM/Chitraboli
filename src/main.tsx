import { createRoot } from "react-dom/client";
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

// Older privacy modes may throw even when accessing the Storage property.
for (const name of ["localStorage", "sessionStorage"] as const) {
  try { window[name].getItem("chitraboli-storage-check"); }
  catch {
    const data = new Map<string,string>();
    const storage: Storage = {get length(){return data.size;},clear:()=>data.clear(),getItem:k=>data.get(k)??null,key:i=>Array.from(data.keys())[i]??null,removeItem:k=>{data.delete(k);},setItem:(k,v)=>{data.set(k,String(v));}};
    try { Object.defineProperty(window,name,{value:storage,configurable:true}); } catch { /* app error boundary handles unsupported environments */ }
  }
}
const root = document.getElementById("root");
if (root) {
  import("./App.tsx").then(({default:App})=>createRoot(root).render(<App />)).catch(()=>{
    root.textContent="The page could not load. Please refresh and try again.";
  });
}
