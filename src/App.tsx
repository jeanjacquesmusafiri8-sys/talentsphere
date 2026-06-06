import React, { useState, useEffect } from "react";
import { 
  Sparkles, Cpu, CheckCircle, AlertCircle, Award, Terminal, 
  MapPin, Check, GraduationCap, ArrowRight, ShieldCheck, HelpCircle 
} from "lucide-react";
import { StudentProfile } from "./types";
import { isFirebaseMock } from "./firebase";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MyProfileSettings from "./components/MyProfileSettings";

import StudentNavbar from "./components/StudentNavbar";
import ProfileUploadSection from "./components/ProfileUploadSection";
import ChallengeArenaSection from "./components/ChallengeArenaSection";
import CareerRoadmapSection from "./components/CareerRoadmapSection";
import TalentDashboardSection from "./components/TalentDashboardSection";
import AiCoachChatSection from "./components/AiCoachChatSection";
import MainLayout from "./components/MainLayout";
import { translations } from "./dictionary";

function AppContent({
  theme,
  onToggleTheme,
  lang,
  onToggleLang,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  lang: "fr" | "en";
  onToggleLang: () => void;
}) {
  const { user, studentProfile, logout, updateProfileState } = useAuth();
  
  // App notification state
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Global tab navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "challenges" | "coach" | "career" | "iam">("dashboard");
  const [focusMode, setFocusMode] = useState(false);

  // Reset focus mode if tab changes
  useEffect(() => {
    setFocusMode(false);
  }, [activeTab]);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleProfileUpdated = (profile: StudentProfile) => {
    updateProfileState(profile);
    showNotification("success", "Profil étudiant synchronisé avec le Cloud Firestore !");
  };

  const t = translations[lang];
  const isDark = theme === "dark";

  return (
    <div id="talentsphere-app" className="min-h-screen">
      
      {/* GLOBAL HEAD NAVIGATION CONTROL NAVBAR */}
      {!focusMode && (
        <StudentNavbar 
          currentUser={user}
          isFirebaseMock={isFirebaseMock}
          onLogin={() => {}} // Flow pre-managed by ProtectedRoute
          onLogout={logout}
          theme={theme}
          onToggleTheme={onToggleTheme}
          lang={lang}
          onToggleLang={onToggleLang}
        />
      )}

      {/* FIXED METADATA DOCK & NOTIFIER */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-lg shadow-2xl flex items-center gap-2.5 border text-xs max-w-sm font-mono ${
            notification.type === "success" 
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
              : "bg-rose-950/90 text-rose-300 border-rose-800"
          }`}>
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <div>
              <p className="font-extrabold">{notification.type === "success" ? "DONE" : "ALERT"}</p>
              <p className="text-[10px] opacity-80 mt-0.5">{notification.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* CORE STRUCTURAL WRAPPER */}
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        lang={lang}
        headerContent={null} // Already mounted at root level
        focusMode={focusMode}
      >
        {/* VIEW SELECTOR */}

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            {/* Left/Middle core analytic reports (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <TalentDashboardSection 
                currentUser={user}
                currentProfile={studentProfile}
                onProfileUpdated={handleProfileUpdated}
                onNotification={showNotification}
                theme={theme}
                lang={lang}
              />
            </div>

            {/* Sourcing drag-and-drop cv extraction right pane (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              <div className={`p-5 rounded-none border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}>
                <h4 className="text-[11px] font-mono tracking-widest font-extrabold uppercase text-indigo-400 mb-3 block pb-1 border-b border-zinc-800">
                  {t.uploadTitle}
                </h4>
                <ProfileUploadSection 
                  currentUser={user}
                  currentProfile={studentProfile}
                  onProfileUpdated={handleProfileUpdated}
                />
              </div>

              {/* Secure Firebase information details */}
              <div className={`p-4 rounded-none border text-[10.5px] leading-relaxed font-mono ${
                isDark ? "bg-zinc-900/40 border-zinc-800 text-zinc-400" : "bg-zinc-50 border-zinc-200 text-zinc-600"
              }`}>
                <span className="text-emerald-400 font-extrabold block uppercase tracking-wide mb-1">✔ Firestore Security Mode</span>
                <p>
                  {lang === "fr" 
                    ? "Règles firestore de production actives. Accès aux documents uniquement sécurisé par UID Google."
                    : "Production security rules active. Document access strictly authorized based on Google UID."}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "challenges" && (
          <div className={`${focusMode ? "w-full max-w-none px-2" : "w-full max-w-4xl mx-auto"} animate-fadeIn`}>
            <ChallengeArenaSection 
              currentUser={user}
              currentProfile={studentProfile}
              onNotification={showNotification}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode(!focusMode)}
            />
          </div>
        )}

        {activeTab === "coach" && (
          <div className="w-full max-w-4xl mx-auto animate-fadeIn">
            <AiCoachChatSection 
              currentProfile={studentProfile}
              onNotification={showNotification}
              lang={lang}
              theme={theme}
              onTriggerRoadmapUpgrade={() => {
                setActiveTab("career");
                showNotification("success", lang === "fr" ? "Feuille de route générée par l'IA !" : "Career roadmap loaded!");
              }}
            />
          </div>
        )}

        {activeTab === "career" && (
          <div className="w-full max-w-4xl mx-auto animate-fadeIn">
            <CareerRoadmapSection 
              currentUser={user}
              currentProfile={studentProfile}
              onNotification={showNotification}
            />
          </div>
        )}

        {activeTab === "iam" && (
          <div className="w-full max-w-4xl mx-auto animate-fadeIn">
            <MyProfileSettings 
              theme={theme}
              lang={lang}
            />
          </div>
        )}

      </MainLayout>

    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<"fr" | "en">("fr");

  // Load preferences
  useEffect(() => {
    const cachedTheme = localStorage.getItem("talentsphere-theme") as "dark" | "light" | null;
    const cachedLang = localStorage.getItem("talentsphere-lang") as "fr" | "en" | null;
    
    if (cachedTheme) {
      setTheme(cachedTheme);
      document.documentElement.classList.toggle("dark", cachedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    if (cachedLang) {
      setLang(cachedLang);
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("talentsphere-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleToggleLang = () => {
    const next = lang === "fr" ? "en" : "fr";
    setLang(next);
    localStorage.setItem("talentsphere-lang", next);
  };

  return (
    <AuthProvider>
      <ProtectedRoute theme={theme} lang={lang}>
        <AppContent 
          theme={theme} 
          onToggleTheme={handleToggleTheme}
          lang={lang}
          onToggleLang={handleToggleLang}
        />
      </ProtectedRoute>
    </AuthProvider>
  );
}
