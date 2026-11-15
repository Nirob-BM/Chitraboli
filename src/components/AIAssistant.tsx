import { Suspense, lazy, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { cn } from "@/lib/utils";

// The chat panel carries the language-model streaming logic, voice input and the
// TTS stack. It lives in its own chunk and is only fetched when the user clicks
// the widget, so it never touches the initial page load.
const AIAssistantPanel = lazy(() =>
  import("./AIAssistantPanel").then((m) => ({ default: m.AIAssistantPanel }))
);

export const AIAssistant = () => {
  const {pathname}=useLocation();
  const [isOpen, setIsOpen] = useState(false);
  // Once loaded, keep the panel mounted so chat history survives close/open.
  const [hasLoaded, setHasLoaded] = useState(false);

  const toggle = () => {
    setHasLoaded(true);
    setIsOpen((prev) => !prev);
  };

  if (pathname === "/localhost-69") return null;
  return (
    <div className="fixed bottom-4 right-4 max-sm:static max-sm:flex max-sm:justify-end max-sm:bg-background sm:bottom-6 sm:right-6 z-50">
      {/* Toggle Button - floating on the right side of every device */}
      <Button type="button"
        onClick={toggle}
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-full",
          "h-11 w-11 max-sm:rounded-none sm:h-auto sm:w-auto sm:px-4 sm:py-2",
          "bg-gradient-to-br from-purple-accent to-purple-accent/80",
          "shadow-glow",
          "transition-all duration-300 hover:scale-105 active:scale-95",
          "text-secondary-foreground text-sm font-medium"
        )}
        aria-label="Toggle AI Assistant"
        aria-expanded={isOpen}
      >
        <Sparkles className="w-5 h-5 shrink-0" />
        <span className="hidden sm:inline">AI Assistant</span>
        {!isOpen && (
          <span className="absolute top-0 right-0 sm:static w-2 h-2 bg-gold rounded-full animate-pulse" />
        )}
      </Button>


      {hasLoaded && (
        <ErrorBoundary><Suspense fallback={<p role="status" className="bg-card text-foreground p-3">Opening assistant…</p>}>
          <AIAssistantPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense></ErrorBoundary>
      )}
    </div>
  );
};
