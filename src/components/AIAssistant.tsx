import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
interface Message {
  role: "user" | "assistant";
  content: string;
}
export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! 👋 Welcome to Chitraboli চিত্রাবলী! I'm your AI assistant. How can I help you today?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      role: "user",
      content: input.trim()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    let assistantContent = "";
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: ""
      }]);
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, {
          stream: true
        });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again or contact us via WhatsApp."
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  return <>
      {/* Floating Button */}
      <button onClick={() => setIsOpen(true)} className={cn("fixed bottom-24 right-6 z-50", "w-16 h-16 rounded-full", "bg-gradient-to-br from-purple-accent to-purple-accent/80", "shadow-[0_0_30px_rgba(139,92,246,0.5)]", "flex items-center justify-center", "transition-all duration-300 hover:scale-110", "animate-float", isOpen && "hidden")} aria-label="Open AI Assistant">
        <Sparkles className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full animate-pulse" />
      </button>

      {/* Chat Window */}
      <div className={cn("fixed bottom-6 right-6 z-50", "w-[380px] h-[550px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-100px)]", "bg-card/95 backdrop-blur-xl rounded-2xl", "border border-purple-accent/30", "shadow-[0_0_50px_rgba(139,92,246,0.3)]", "flex flex-col overflow-hidden", "transition-all duration-500", isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none")}>
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-accent/20 to-gold/10 border-b border-purple-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display text-foreground">Chitraboli - চিত্রাবলী </h3>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => <div key={index} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
              <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center", message.role === "assistant" ? "bg-gradient-to-br from-purple-accent to-gold" : "bg-gold/20")}>
                {message.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-gold" />}
              </div>
              <div className={cn("max-w-[80%] p-3 rounded-2xl", message.role === "assistant" ? "bg-muted/50 rounded-tl-sm" : "bg-gradient-to-r from-purple-accent/20 to-gold/20 rounded-tr-sm")}>
                <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>)}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-5 h-5 animate-spin text-purple-accent" />
              </div>
            </div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-purple-accent/20">
          <div className="flex gap-2">Chitraboli - চিত্রাবলী ✨<input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type your message..." className="flex-1 bg-muted/50 border border-purple-accent/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-accent/50 transition-colors" />
            <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center disabled:opacity-50 transition-opacity">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>;
};