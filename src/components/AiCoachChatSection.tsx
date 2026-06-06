import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, User, Send, RefreshCw, Loader2, Sparkles, ChevronRight, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudentProfile } from "../types";
import { translations } from "../dictionary";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AiCoachChatSectionProps {
  currentProfile: StudentProfile | null;
  onNotification: (type: "success" | "error", text: string) => void;
  lang: "fr" | "en";
  theme: "dark" | "light";
  onTriggerRoadmapUpgrade?: () => void; // callback to build/improve career roadmap
}

const PRESET_CHIPS_FR = [
  "Comment combler mes lacunes Cloud Run ?",
  "Simule une mini interview Kubernetes",
  "Conseille-moi une stack DevOps modern",
  "Comment optimiser mes requêtes Firebase ?"
];

const PRESET_CHIPS_EN = [
  "How to bridge my Cloud Run gaps?",
  "Simulate a short Kubernetes interview",
  "Recommend a modern DevOps stack",
  "How to optimize code for Firebase?"
];

export default function AiCoachChatSection({
  currentProfile,
  onNotification,
  lang,
  theme,
  onTriggerRoadmapUpgrade,
}: AiCoachChatSectionProps) {
  const t = translations[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chips = lang === "fr" ? PRESET_CHIPS_FR : PRESET_CHIPS_EN;

  // Auto-init with first coach message
  useEffect(() => {
    const saved = localStorage.getItem("talentsphere-coach-conversation");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed to parse stored conversation, starting fresh.", e);
      }
    }

    const mentorName = currentProfile?.name || "Talent";
    const welcomeFr = `Bonjour ${mentorName} ! Je suis votre Coach IA Personnel de TalentSphere. 
Je suis connecté à vos compétences Firestore. Nous pouvons simuler ensemble des scénarios GCP Cloud, consolider votre Code moderne ou concevoir des architectures résilientes Docker.

Comment puis-je vous guider ?`;
    
    const welcomeEn = `Hello ${mentorName}! I am your TalentSphere Personal AI Coach. 
I am connected to your skills. We can simulate GCP Cloud scenarios, review modern clean code, or design robust Docker systems.

How can I help you today?`;

    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        content: lang === "fr" ? welcomeFr : welcomeEn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentProfile, lang]);

  // Keep saved of history in local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("talentsphere-coach-conversation", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to latest
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    const userMsg: ChatMessage = {
      id: "user-msg-" + Date.now().toString(),
      role: "user",
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          studentContext: currentProfile
        })
      });

      if (!response.ok) {
        throw new Error("L'intercepteur du Coach IA Gemini a échoué.");
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: "reply-msg-" + Date.now().toString(),
        role: "assistant",
        content: data.reply || "Diagnostic technique complété. Prêt pour de nouvelles questions !",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      onNotification("error", "Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem("talentsphere-coach-conversation");
    const initName = currentProfile?.name || "Talent";
    const welcome = lang === "fr" ? "Historique réinitialisé. Démarrons notre perfectionnement !" : "History cleared. Let's begin our upskilling!";
    setMessages([
      {
        id: "welcome-msg-reset-" + Date.now().toString(),
        role: "assistant",
        content: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-zinc-100 border-zinc-200 text-zinc-950";
  const innerCardBg = isDark ? "bg-zinc-950/60 border-zinc-850" : "bg-white border-zinc-200/60";
  const chatBubbleUser = "bg-indigo-600 text-white rounded-none border-zinc-800";
  const chatBubbleCoach = isDark ? "bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-none font-medium" : "bg-white text-zinc-900 border border-zinc-200 rounded-none font-medium";

  return (
    <div id="tech-coach-chat" className={`rounded-xl border shadow-sm flex flex-col h-[540px] overflow-hidden ${cardBg}`}>
      
      {/* COCH CHAT HEADER - FIXED */}
      <div className="bg-zinc-950 text-white p-4 px-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Gemini Gradient Highlight Ring */}
          <div className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-2 rounded-lg text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs tracking-wide uppercase font-mono text-white flex items-center gap-1.5">
              {t.coach}
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </h4>
            <p className="text-[9px] font-mono text-zinc-400">
              {lang === "fr" ? "GCP Architecture & Code • Évaluation" : "GCP Architecture & Code • Assessment"}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          type="button"
          className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer text-[9px] font-mono border border-zinc-800 flex items-center gap-1"
        >
          <RefreshCw className="w-3" />
          <span>{t.resetChat}</span>
        </button>
      </div>

      {/* THREE-COLUMN SUB HEADER ACTION FOR "CONSTRUIRE MA CARRIÈRE" GRADIMENT BUTTON */}
      <div className="p-3 bg-zinc-950/40 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <p className="text-[10px] font-mono text-zinc-400 font-medium">
            {lang === "fr" ? "Prêt à propulser votre employabilité ?" : "Ready to align with cloud roles?"}
          </p>
        </div>

        {/* THE FAMOUS GRADIENT "CONSTRUIRE MA CARRIÈRE" ACTION BUTTON */}
        <button
          onClick={() => {
            if (onTriggerRoadmapUpgrade) {
              onTriggerRoadmapUpgrade();
            } else {
              onNotification("success", lang === "fr" ? "Accès à l'onglet Carrière !" : "Navigating to Career Tool!");
            }
          }}
          type="button"
          className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 hover:opacity-90 active:scale-95 transition-all text-white font-mono font-black text-[10px] uppercase px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.buildCareerBtn}</span>
        </button>
      </div>

      {/* MESSAGES PORT - SCROLLABLE FLUID */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/20 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isCoach = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isCoach ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
              >
                {/* Avatar Icon */}
                <div className={`w-7.5 h-7.5 rounded flex items-center justify-center shrink-0 border uppercase font-mono text-[9px] font-extrabold ${
                  isCoach 
                    ? "bg-zinc-950 border-zinc-800 text-cyan-400" 
                    : "bg-indigo-600 border-indigo-700 text-white"
                }`}>
                  {isCoach ? "IA" : "JJ"}
                </div>

                {/* Bubble - strictly square with fine border */}
                <div className="space-y-1 text-left">
                  <div className={`p-3 text-xs leading-relaxed transition-all shadow-xs overflow-x-auto ${
                    isCoach ? chatBubbleCoach : chatBubbleUser
                  }`}>
                    <pre className="font-sans whitespace-pre-wrap text-xs font-normal leading-normal">{msg.content}</pre>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </AnimatePresence>

        {/* FINE DOTS BOUNCING / TYPING INDICATOR */}
        {isLoading && (
          <div className="flex items-center gap-2 mr-auto max-w-[80%] text-left mt-2">
            <div className="w-7.5 h-7.5 rounded text-zinc-400 bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono text-[9px] font-black shrink-0">
              IA
            </div>
            <div className={`p-3 border border-zinc-800/80 rounded-none flex items-center gap-2 ${isDark ? "bg-zinc-900" : "bg-white"}`}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[9.5px] font-mono text-zinc-500">{t.coachTyping}</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* QUICK CHIP SUGGESTIONS */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-950/10 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              type="button"
              className={`px-3 py-1 border rounded font-bold text-[9.5px] whitespace-nowrap transition-all cursor-pointer ${
                isDark 
                  ? "bg-zinc-950 border-zinc-850 hover:bg-zinc-800 text-zinc-300" 
                  : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* CHAT INPUT CONTAINER */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/30 shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={t.coachPlaceholder}
            className={`flex-1 text-xs p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDark 
                ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600" 
                : "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400"
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-lg shadow cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
