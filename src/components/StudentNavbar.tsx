import React from "react";
import { Moon, Sun, Cpu, LogOut, Database, UserCheck, Languages } from "lucide-react";
import { translations } from "../dictionary";

interface StudentNavbarProps {
  currentUser: any;
  isFirebaseMock: boolean;
  onLogin: (fallbackDefault?: boolean) => void;
  onLogout: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  lang: "fr" | "en";
  onToggleLang: () => void;
}

export default function StudentNavbar({
  currentUser,
  isFirebaseMock,
  onLogin,
  onLogout,
  theme,
  onToggleTheme,
  lang,
  onToggleLang,
}: StudentNavbarProps) {
  const t = translations[lang];

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
      theme === "dark" 
        ? "bg-zinc-900/90 border-zinc-800 text-zinc-100" 
        : "bg-white/90 border-zinc-200 text-zinc-950"
    } backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
        
        {/* LOGO & TITLE */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-2 rounded-lg text-white shadow-sm flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 font-display">
              {t.title}
              <span className="text-[9px] bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">
                {lang === "fr" ? "ÉTUDIANT" : "STUDENT"}
              </span>
            </h1>
            <p className="text-[10px] font-mono text-zinc-400 font-medium tracking-wide">
              {lang === "fr" ? "Sourcing & Upskilling IA" : "AI Talent Assessment"}
            </p>
          </div>
        </div>

        {/* CONTROLS & USER DATA */}
        <div className="flex items-center gap-3">
          
          {/* DB Indicator badge - highly compact */}
          <div className={`hidden sm:flex items-center gap-1 text-[10px] font-mono border rounded-md px-2.5 py-1 ${
            theme === "dark" 
              ? "bg-zinc-950/40 border-zinc-800 text-zinc-400" 
              : "bg-zinc-50 border-zinc-200 text-zinc-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseMock ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
            <span>{isFirebaseMock ? "Sandbox" : "Firestore"}</span>
          </div>

          {/* LANGUAGE SWITCHER */}
          <button
            onClick={onToggleLang}
            type="button"
            title={t.langLabel}
            className={`p-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
              theme === "dark" 
                ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200" 
                : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* THEME TOGGLE (Sun / Moon) */}
          <button
            onClick={onToggleTheme}
            type="button"
            title={t.themeLabel}
            className={`p-1.5 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
              theme === "dark" 
                ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-amber-400" 
                : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700"
            }`}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="h-4 w-px bg-zinc-700/30 dark:bg-zinc-800" />

          {/* USER PROFILE & STATS BADGE */}
          {currentUser ? (
            <div className={`flex items-center gap-2 p-1 pr-3.5 rounded-lg border transition-colors ${
              theme === "dark" 
                ? "bg-zinc-900 border-zinc-800" 
                : "bg-zinc-100 border-zinc-200"
            }`}>
              <div className="relative">
                <img
                  src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                  alt="Student Avatar"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded object-cover border border-zinc-700/50"
                />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
              </div>
              
              <div className="text-left hidden md:block">
                <p className="text-[11px] font-black tracking-tight truncate max-w-[120px]">
                  {currentUser.displayName || "Jean-Jacques"}
                </p>
                <p className="text-[9px] text-zinc-400 font-mono select-none">
                  {t.online}
                </p>
              </div>

              <button
                onClick={onLogout}
                type="button"
                title={t.logout}
                className="ml-1 p-1 text-zinc-400 hover:text-rose-500 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => onLogin(false)}
                type="button"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm cursor-pointer transition-all"
              >
                {t.googleConn}
              </button>
              <button
                onClick={() => onLogin(true)}
                type="button"
                className={`hidden sm:block border text-[10.5px] font-bold py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                  theme === "dark" 
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" 
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Demo
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
