import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import Login from "./Login";
import Register from "./Register";
import { Cpu, Sparkles } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  theme: "dark" | "light";
  lang: "fr" | "en";
}

export default function ProtectedRoute({ children, theme, lang }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");

  const isDark = theme === "dark";

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-mono transition-colors duration-200 ${
        isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
      }`}>
        <div className="relative flex flex-col items-center">
          {/* Pulsating system loading ring */}
          <div className="absolute w-24 h-24 border-2 border-dashed border-indigo-500/30 rounded-full animate-spin duration-[10s]" />
          <div className="absolute w-16 h-16 border border-indigo-500/10 rounded-full animate-pulse" />
          
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-none relative">
            <Cpu className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>

          <div className="mt-8 text-center space-y-2">
            <h3 className="text-xs font-bold tracking-widest uppercase">
              {lang === "fr" ? "Authentification Chiffrée" : "Encrypted Authentication"}
            </h3>
            <p className="text-[9px] text-zinc-500">
              {lang === "fr" 
                ? "Synchronisation de la session avec le cloud firestore..." 
                : "Synchronizing active token verification..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-200 ${
        isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-950"
      }`}>
        {/* Decorative background branding element for credentials screen */}
        <div className="mb-6 text-center space-y-1">
          <h1 className="text-3xl font-extrabold font-mono tracking-tighter uppercase flex items-center justify-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-blue-500">
              TalentSphere
            </span>
            <span className="text-[12px] align-super bg-indigo-500/15 border border-indigo-500/35 px-1.5 py-0.5 rounded-none font-bold text-indigo-400">
              AI
            </span>
          </h1>
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            {lang === "fr" 
              ? "Sourcing prédictif & coaching technologique" 
              : "Predictive Talent Acquisition & Cognitive Coaching"}
          </p>
        </div>

        {authScreen === "login" ? (
          <Login 
            onSwitchToRegister={() => setAuthScreen("register")} 
            theme={theme} 
            lang={lang} 
          />
        ) : (
          <Register 
            onSwitchToLogin={() => setAuthScreen("login")} 
            theme={theme} 
            lang={lang} 
          />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
