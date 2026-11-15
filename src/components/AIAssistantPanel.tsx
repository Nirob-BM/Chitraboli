import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, User, Loader2, Globe, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Language = "bn" | "en" | "hi";

const languageConfig = {
  bn: {
    name: "বাংলা",
    flag: "🇧🇩",
    welcome: "হ্যালো! 👋 চিত্রাবলীতে স্বাগতম! আমি আপনার AI সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    placeholder: "আপনার বার্তা লিখুন...",
    online: "অনলাইন",
    listening: "শুনছি...",
    processing: "প্রক্রিয়াকরণ...",
    speaking: "বলছি..."
  },
  en: {
    name: "English",
    flag: "🇬🇧",
    welcome: "Hello! 👋 Welcome to Chitraboli চিত্রাবলী! I'm your AI assistant. How can I help you today?",
    placeholder: "Type your message...",
    online: "Online",
    listening: "Listening...",
    processing: "Processing...",
    speaking: "Speaking..."
  },
  hi: {
    name: "हिंदी",
    flag: "🇮🇳",
    welcome: "नमस्ते! 👋 चित्राबोली में आपका स्वागत है! मैं आपका AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
    placeholder: "अपना संदेश लिखें...",
    online: "ऑनलाइन",
    listening: "सुन रहा हूं...",
    processing: "प्रोसेसिंग...",
    speaking: "बोल रहा हूं..."
  }
};

const quickReplies = {
  bn: [
    { label: "📦 পণ্য দেখুন", message: "আপনার জনপ্রিয় পণ্যগুলো দেখান" },
    { label: "🔍 অর্ডার ট্র্যাক", message: "আমি আমার অর্ডার ট্র্যাক করতে চাই" },
    { label: "📞 যোগাযোগ", message: "আপনাদের সাথে কিভাবে যোগাযোগ করব?" },
    { label: "💳 পেমেন্ট", message: "কি কি পেমেন্ট অপশন আছে?" }
  ],
  en: [
    { label: "📦 Show Products", message: "Show me your popular products" },
    { label: "🔍 Track Order", message: "I want to track my order" },
    { label: "📞 Contact Us", message: "How can I contact you?" },
    { label: "💳 Payment", message: "What payment options do you have?" }
  ],
  hi: [
    { label: "📦 उत्पाद देखें", message: "अपने लोकप्रिय उत्पाद दिखाएं" },
    { label: "🔍 ऑर्डर ट्रैक", message: "मैं अपना ऑर्डर ट्रैक करना चाहता हूं" },
    { label: "📞 संपर्क", message: "आपसे कैसे संपर्क करें?" },
    { label: "💳 भुगतान", message: "आपके पास कौन से भुगतान विकल्प हैं?" }
  ]
};

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantPanel = ({ isOpen, onClose }: AIAssistantPanelProps) => {
  const [language, setLanguage] = useState<Language>("bn");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: languageConfig.bn.welcome
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache TTS audio URLs by content hash to avoid repeated API calls
  const ttsCache = useRef<Map<string, string>>(new Map());

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguageMenu(false);
    setMessages([{
      role: "assistant",
      content: languageConfig[lang].welcome
    }]);
  };

  useEffect(() => {
    // Only auto-scroll within the chat container, never the whole window.
    const el = messagesEndRef.current;
    if (!el) return;
    const scrollParent = el.closest('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto') as HTMLElement | null;
    if (scrollParent) {
      scrollParent.scrollTop = scrollParent.scrollHeight;
    }
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      // Revoke cached audio URLs
      ttsCache.current.forEach((url) => URL.revokeObjectURL(url));
      ttsCache.current.clear();
    };
  }, []);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    
    const userMessage: Message = {
      role: "user",
      content: textToSend
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
          language,
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
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
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

      setMessages(prev => [...prev, {
        role: "assistant",
        content: language === "bn" 
          ? "দুঃখিত, এখন সাড়া দিতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন বা WhatsApp-এ যোগাযোগ করুন।"
          : language === "hi"
          ? "क्षमा करें, अभी जवाब देने में समस्या हो रही है। कृपया पुनः प्रयास करें या WhatsApp पर संपर्क करें।"
          : "I apologize, but I'm having trouble responding right now. Please try again or contact us via WhatsApp."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) return;
        
        setIsProcessingVoice(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
                },
                body: JSON.stringify({ audio: base64Audio, language })
              });
              
              if (!response.ok) {
                throw new Error('Failed to transcribe audio');
              }
              
              const { text, error } = await response.json();
              
              if (error) {
                throw new Error(error);
              }
              
              if (text && text.trim()) {
                setInput(text);
                // Auto-send the transcribed message
                await sendMessage(text);
              } else {
                toast.error(language === "bn" ? "কোনো কথা বোঝা যায়নি" : language === "hi" ? "कोई बात समझ नहीं आई" : "Could not understand speech");
              }
            } catch (error) {

              toast.error(language === "bn" ? "ভয়েস প্রসেস করতে সমস্যা" : language === "hi" ? "आवाज प्रोसेस करने में समस्या" : "Failed to process voice");
            } finally {
              setIsProcessingVoice(false);
            }
          };
        } catch (error) {

          setIsProcessingVoice(false);
          toast.error("Failed to process audio");
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {

      toast.error(language === "bn" ? "মাইক্রোফোন অ্যাক্সেস দিন" : language === "hi" ? "माइक्रोफोन एक्सेस दें" : "Please allow microphone access");
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const speakWithBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error(language === "bn" ? "এই ব্রাউজারে TTS সাপোর্ট নেই" : language === "hi" ? "इस ब्राउज़र में TTS सपोर्ट नहीं है" : "TTS is not supported in this browser");
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'bn' ? 'bn-BD' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingIndex(null);
      toast.error(language === "bn" ? "স্পিচ চালাতে সমস্যা" : language === "hi" ? "स्पीच चलाने में समस्या" : "Failed to play speech");
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text: string, messageIndex: number) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop any currently speaking browser TTS
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // If clicking the same message that's speaking, stop it
    if (speakingIndex === messageIndex && isSpeaking) {
      setIsSpeaking(false);
      setSpeakingIndex(null);
      return;
    }

    // Create a cache key from text + language
    const cacheKey = `${language}:${text}`;
    const cachedUrl = ttsCache.current.get(cacheKey);

    // Helper to play audio from a URL
    const playFromUrl = (audioUrl: string, revokeOnEnd: boolean) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingIndex(null);
        audioRef.current = null;
        if (revokeOnEnd) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeakingIndex(null);
        audioRef.current = null;
        if (revokeOnEnd) {
          URL.revokeObjectURL(audioUrl);
        }
        toast.error(language === "bn" ? "অডিও প্লে করতে সমস্যা" : language === "hi" ? "ऑडियो चलाने में समस्या" : "Failed to play audio");
      };

      audio.play();
    };

    // If cached, play directly
    if (cachedUrl) {
      setIsSpeaking(true);
      setSpeakingIndex(messageIndex);
      playFromUrl(cachedUrl, false);
      return;
    }

    try {
      setIsSpeaking(true);
      setSpeakingIndex(messageIndex);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ text, language })
      });

      const contentType = response.headers.get('content-type') || '';

      // ElevenLabs may return JSON (even with HTTP 200) when Free Tier is blocked.
      if (contentType.includes('application/json')) {
        let err: any = null;
        try {
          err = await response.json();
        } catch {
          // ignore
        }

        const msg = (err?.error as string | undefined) || (language === "bn" ? "ভয়েস সার্ভিস সাময়িকভাবে উপলব্ধ নয়" : language === "hi" ? "वॉयस सेवा अभी उपलब्ध नहीं है" : "Voice service is temporarily unavailable");
        const code = err?.code as string | undefined;

        const isUnusualActivity =
          code === 'detected_unusual_activity' ||
          (typeof msg === 'string' && msg.toLowerCase().includes('unusual activity'));

        if (isUnusualActivity) {
          toast.error(
            language === "bn"
              ? "ElevenLabs ফ্রি টিয়ার ব্লক হয়েছে (VPN/প্ল্যান সমস্যা)। বেসিক ভয়েস ব্যবহার করা হচ্ছে।"
              : language === "hi"
              ? "ElevenLabs फ्री टियर ब्लॉक है (VPN/प्लान)। बेसिक वॉयस इस्तेमाल हो रहा है।"
              : "ElevenLabs Free Tier is blocked (VPN/plan). Using basic voice instead."
          );

          speakWithBrowserTTS(text);
          return;
        }

        throw new Error(msg);
      }

      if (!response.ok) {
        throw new Error(language === "bn" ? "ভয়েস সার্ভিস সাময়িকভাবে উপলব্ধ নয়" : language === "hi" ? "वॉयस सेवा अभी उपलब्ध नहीं है" : "Voice service is temporarily unavailable");
      }

      // Audio success path (binary response)
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the audio URL for future playback
      ttsCache.current.set(cacheKey, audioUrl);

      playFromUrl(audioUrl, false);
    } catch (error) {

      // Last-resort fallback for any other error
      setIsSpeaking(true);
      setSpeakingIndex(messageIndex);
      speakWithBrowserTTS(text);
    }
  };

  return (
    <>
      {/* Chat Window - floats above the launcher button, responsive and fully visible */}
      <div
        className={cn(
          "absolute bottom-full right-0 mb-3",
          "w-[calc(100vw-2rem)] max-w-[380px]",
          "h-[60vh] max-h-[450px] sm:h-[450px]",
          "bg-card/95 backdrop-blur-xl rounded-2xl",
          "border border-purple-accent/30",
          "shadow-[0_0_40px_rgba(139,92,246,0.3)]",
          "flex flex-col overflow-hidden",
          "transition-all duration-300",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-3 bg-gradient-to-r from-purple-accent/20 to-gold/10 border-b border-purple-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-display text-sm text-foreground">Chitraboli AI</h3>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {isRecording 
                    ? languageConfig[language].listening 
                    : isProcessingVoice 
                    ? languageConfig[language].processing 
                    : languageConfig[language].online}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors text-xs"
                  title="Change Language"
                  aria-label="Change Language"
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-purple-accent/30 rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
                    {(Object.keys(languageConfig) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted/50 transition-colors",
                          language === lang && "bg-purple-accent/20 text-purple-accent"
                        )}
                      >
                        <span>{languageConfig[lang].flag}</span>
                        <span>{languageConfig[lang].name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={cn("flex gap-2", message.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center",
                message.role === "assistant" ? "bg-gradient-to-br from-purple-accent to-gold" : "bg-gold/20"
              )}>
                {message.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-gold" />}
              </div>
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  message.role === "assistant" ? "bg-muted/50 rounded-tl-sm" : "bg-gradient-to-r from-purple-accent/20 to-gold/20 rounded-tr-sm"
                )}>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{message.content}</p>
                </div>
                {/* TTS button for assistant messages */}
                {message.role === "assistant" && message.content && (
                  <button
                    onClick={() => speakText(message.content, index)}
                    disabled={isLoading}
                    className={cn(
                      "self-start flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                      speakingIndex === index && isSpeaking
                        ? "bg-purple-accent/30 text-purple-accent"
                        : "bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                    title={speakingIndex === index && isSpeaking 
                      ? (language === "bn" ? "থামান" : language === "hi" ? "रोकें" : "Stop") 
                      : (language === "bn" ? "শুনুন" : language === "hi" ? "सुनें" : "Listen")}
                  >
                    {speakingIndex === index && isSpeaking ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>{language === "bn" ? "থামান" : language === "hi" ? "रोकें" : "Stop"}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>{language === "bn" ? "শুনুন" : language === "hi" ? "सुनें" : "Listen"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-muted/50 p-2.5 rounded-xl rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-purple-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          
          {/* Quick Reply Buttons */}
          {messages.length <= 2 && !isLoading && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {quickReplies[language].map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(reply.message)}
                  className="px-2.5 py-1.5 text-xs bg-purple-accent/10 hover:bg-purple-accent/20 border border-purple-accent/30 rounded-full transition-colors text-foreground"
                >
                  {reply.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-purple-accent/20">
          <div className="flex gap-2">
            {/* Voice Input Button */}
            <button
              onClick={toggleRecording}
              disabled={isLoading || isProcessingVoice}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isRecording 
                  ? "bg-red-500 animate-pulse" 
                  : isProcessingVoice
                  ? "bg-yellow-500"
                  : "bg-muted/50 hover:bg-purple-accent/30",
                (isLoading || isProcessingVoice) && "opacity-50 cursor-not-allowed"
              )}
              title={isRecording ? "Stop recording" : "Voice input"}
              aria-label={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? (
                <MicOff className="w-3.5 h-3.5 text-white" />
              ) : isProcessingVoice ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-foreground" />
              )}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={languageConfig[language].placeholder}
              className="flex-1 bg-muted/50 border border-purple-accent/20 rounded-full px-3 py-2 text-xs focus:outline-none focus:border-purple-accent/50 transition-colors"
              disabled={isRecording || isProcessingVoice}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || isRecording || isProcessingVoice}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-accent to-gold flex items-center justify-center disabled:opacity-50 transition-opacity"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
