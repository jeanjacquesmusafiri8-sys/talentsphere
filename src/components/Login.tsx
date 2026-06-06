import React, { useState } from "react";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../AuthContext";

interface LoginProps {
  onSwitchToRegister: () => void;
  theme: "dark" | "light";
  lang: "fr" | "en";
}

export default function Login({ onSwitchToRegister, theme, lang }: LoginProps) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === "fr" ? "Veuillez remplir tous les champs." : "Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err?.message || (lang === "fr" ? "Échec de la connexion." : "Failed to log in."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || (lang === "fr" ? "Connexion Google annulée." : "Google login canceled."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const text = {
    fr: {
      title: "Connexion",
      subtitle: "Accédez à votre espace TalentSphere IA",
      emailLabel: "Email Professionnel",
      passwordLabel: "Mot de passe",
      btnAction: "Se connecter",
      googleBtn: "Se connecter avec Google",
      noAccount: "Pas encore de compte ?",
      signUpLink: "S'inscrire",
      errorPrefix: "Erreur"
    },
    en: {
      title: "Sign In",
      subtitle: "Access your TalentSphere AI workspace",
      emailLabel: "Professional Email",
      passwordLabel: "Password",
      btnAction: "Sign In",
      googleBtn: "Connect with Google",
      noAccount: "Don't have an account?",
      signUpLink: "Sign Up",
      errorPrefix: "Error"
    }
  }[lang];

  return (
    <div className={`w-full max-w-md mx-auto transition-colors duration-200 ${
      isDark ? "text-zinc-100" : "text-zinc-900"
    }`}>
      {/* Central Asymmetrical premium modular box */}
      <div className={`p-8 border rounded-none shadow-2xl relative overflow-hidden ${
        isDark 
          ? "bg-zinc-950 border-zinc-800" 
          : "bg-white border-zinc-200"
      }`}>
        {/* Subtle decorative linear border accent */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />

        {/* Header section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 px-1.5 bg-indigo-600 text-white rounded-none text-[10px] font-mono font-bold tracking-widest uppercase">
              TS_SYS
            </div>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-mono tracking-tight uppercase">
            {text.title}
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            {text.subtitle}
          </p>
        </div>

        {/* Error message slot */}
        {error && (
          <div className="mb-4 p-3 border border-rose-800/20 bg-rose-950/10 text-rose-400 text-[10px] font-mono flex items-center gap-2 rounded-none">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 mb-1.5">
              {text.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-3 py-2 text-xs font-mono rounded-none border transition-all focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600"
                  : "bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400"
              }`}
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 mb-1.5">
              {text.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 text-xs font-mono rounded-none border transition-all focus:outline-none focus:ring-1 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-600"
                  : "bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400"
              }`}
            />
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className={`w-full py-2 px-4 rounded-none font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
            }`}
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{text.btnAction}</span>
                <ArrowRight className="w-3 h-3 text-white/80" />
              </>
            )}
          </button>
        </form>

        {/* Separator line */}
        <div className="my-5 flex items-center justify-between gap-3">
          <div className={`flex-1 h-[1px] ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">OR</span>
          <div className={`flex-1 h-[1px] ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />
        </div>

        {/* Premium Google Unified Sign-In Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className={`w-full py-2 px-4 rounded-none border font-mono text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            isDark
              ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200"
              : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800"
          }`}
        >
          {googleLoading ? (
            <span className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${isDark ? "border-zinc-700 border-t-zinc-300" : "border-zinc-300 border-t-zinc-700"}`} />
          ) : (
            <>
              {/* Clean minimal Google G Identity Vector icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22c-.74-.6-1.19-1.48-1.19-2.7z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l2.85 2.22c.87-2.6 3.3-4.53 6.16-4.53y" fill="#EA4335"/>
              </svg>
              <span>{text.googleBtn}</span>
            </>
          )}
        </button>

        {/* Footer Account toggle */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-mono text-zinc-500">
            {text.noAccount}{" "}
            <button
              onClick={onSwitchToRegister}
              type="button"
              className="text-indigo-500 hover:text-indigo-400 font-bold underline transition-colors cursor-pointer"
            >
              {text.signUpLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
