import React from "react";
import { 
  LayoutDashboard, Terminal, MessageSquare, Milestone, Shield,
  ChevronRight, Sparkles, Cpu, Award, Zap, HelpCircle
} from "lucide-react";
import { translations } from "../dictionary";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: "dashboard" | "challenges" | "coach" | "career" | "iam";
  setActiveTab: (tab: "dashboard" | "challenges" | "coach" | "career" | "iam") => void;
  theme: "dark" | "light";
  lang: "fr" | "en";
  headerContent: React.ReactNode;
  focusMode?: boolean;
}

export default function MainLayout({
  children,
  activeTab,
  setActiveTab,
  theme,
  lang,
  headerContent,
  focusMode = false,
}: MainLayoutProps) {
  const t = translations[lang];

  // Sidebar items
  const menuItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "challenges", label: t.challenges, icon: Terminal },
    { id: "coach", label: t.coach, icon: MessageSquare },
    { id: "career", label: t.career, icon: Milestone },
    { id: "iam", label: t.iam || "Sûreté & IAM", icon: Shield },
  ] as const;

  const isDark = theme === "dark";

  return (
    <div id="main-layout-container" className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
    }`}>
      
      {/* FIXED NAVBAR HEADER */}
      <div className="shrink-0">
        {headerContent}
      </div>

      {/* HORIZONTAL WRAPPER */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* FIXED LEFT SIDEBAR */}
        {!focusMode && (
          <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r transition-colors duration-200 shrink-0 ${
            isDark 
              ? "bg-zinc-900/40 border-zinc-800" 
              : "bg-zinc-50 border-zinc-200"
          }`}>
            <div className="p-4 space-y-5">
              
              {/* Quick Summary Pitch (No fluff, extremely clean) */}
              <div className="p-3 bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-cyan-400/5 border border-indigo-500/10 rounded-lg">
                <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-extrabold uppercase block">
                  {lang === "fr" ? "IA CONTRÔLE" : "AI ENGINE"}
                </span>
                <p className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">
                  {lang === "fr" 
                    ? "Sourcing prédictif & coaching technologique asynchrone."
                    : "Predictive student sourcing & expert tutoring sessions."}
                </p>
              </div>

              {/* Sidebar Main Links */}
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      type="button"
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold font-mono tracking-tight transition-all cursor-pointer ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" 
                          : isDark
                            ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                            : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 animate-pulse" />}
                    </button>
                  );
                })}
              </nav>

              {/* Micro Hackathon info badge */}
              <div className="pt-8 hidden md:block">
                <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block mb-1">
                  {lang === "fr" ? "Statut de Déploiement" : "Deployment Status"}
                </span>
                <div className="p-2 border border-zinc-800 bg-zinc-950/60 rounded flex items-center gap-2 text-[9px] font-mono font-medium text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Run Ready</span>
                </div>
              </div>

            </div>
          </aside>
        )}

        {/* CONTENT ZONE FRAME */}
        <main className={`flex-1 p-5 sm:p-8 w-full overflow-x-hidden md:overflow-y-auto duration-200 transition-all ${
          focusMode ? "max-w-none px-4 py-4" : "max-w-7xl mx-auto"
        }`}>
          {children}
        </main>

      </div>

    </div>
  );
}
