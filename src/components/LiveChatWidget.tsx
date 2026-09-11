import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "8801308697630";

const QUICK_TOPICS = [
  "I want to order a piece of jewellery",
  "Question about an existing order",
  "Do you make custom designs?",
  "Delivery & payment info",
];

const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/**
 * Live chat inbox on the homepage. Visitors type a message (or pick a quick
 * topic) and are handed off to a real WhatsApp chat with the shop, with their
 * message pre-filled. Bottom-left so it never overlaps the AI assistant
 * launcher (bottom-right) or the back-to-top button.
 */
export const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus after the open animation starts so mobile keyboards behave
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const sendViaWhatsApp = (message: string) => {
    const text = message.trim();
    if (!text) return;
    window.open(buildWhatsAppUrl(text), "_blank", "noopener,noreferrer");
    setDraft("");
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50">
      {/* Inbox panel */}
      <div
        className={cn(
          "absolute bottom-14 sm:bottom-16 left-0 w-[calc(100vw-2rem)] max-w-[340px]",
          "rounded-2xl border border-border bg-card shadow-2xl overflow-hidden",
          "origin-bottom-left transition-all duration-300",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}
        role="dialog"
        aria-label="Live chat inbox"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-gold" />
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-semibold text-foreground">Chitraboli Support</p>
            <p className="text-xs text-muted-foreground">Typically replies within minutes</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close live chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3 max-h-[45vh] overflow-y-auto">
          <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-foreground">
            Hi there! 👋 Welcome to Chitraboli. How can we help you today?
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => sendViaWhatsApp(topic)}
                className="text-xs rounded-full border border-gold/40 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>

          <a
            href={`tel:+${WHATSAPP_NUMBER}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5 text-primary" /> +880 1636-665467
          </a>
          <a
            href="mailto:info.chitraboli@gmail.com"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-primary" /> info.chitraboli@gmail.com
          </a>
        </div>

        {/* Composer */}
        <form
          className="border-t border-border p-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendViaWhatsApp(draft);
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message…"
            aria-label="Type your message"
            className="flex-1 min-w-0 rounded-full bg-muted px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message via WhatsApp"
            className="h-9 w-9 shrink-0 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="px-4 pb-3 text-[10px] text-muted-foreground text-center">
          Your message opens in WhatsApp so we can reply directly.
        </p>
      </div>

      {/* Launcher button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center justify-center gap-2 rounded-full",
          "h-11 w-11 sm:h-auto sm:w-auto sm:px-4 sm:py-2",
          "bg-[#25D366] text-white shadow-lg",
          "transition-all duration-300 hover:scale-105 active:scale-95",
          "text-sm font-medium"
        )}
        aria-label={isOpen ? "Close live chat" : "Open live chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5 shrink-0" /> : <MessageCircle className="h-5 w-5 shrink-0" />}
        <span className="hidden sm:inline">{isOpen ? "Close" : "Live Chat"}</span>
        {!isOpen && (
          <span className="absolute top-0 right-0 sm:static w-2 h-2 bg-gold rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
};
