import React, { useState, useEffect } from "react";
import { 
  Award, Sparkles, Loader2, Send, ExternalLink, ShieldCheck, 
  Plus, RefreshCw, Flame, Briefcase, Star, Cpu, ArrowUpRight, 
  Check, Trash2, Info, Moon, Sun, AlertCircle
} from "lucide-react";
import { StudentProfile, SubmittedAsset } from "../types";
import { setStudentProfile } from "../firebase";
import { translations } from "../dictionary";

interface TalentDashboardSectionProps {
  currentUser: any;
  currentProfile: StudentProfile | null;
  onProfileUpdated: (profile: StudentProfile) => void;
  onNotification: (type: "success" | "error", text: string) => void;
  theme: "dark" | "light";
  lang: "fr" | "en";
}

export default function TalentDashboardSection({
  currentUser,
  currentProfile,
  onProfileUpdated,
  onNotification,
  theme,
  lang,
}: TalentDashboardSectionProps) {
  const t = translations[lang];

  // Asset Submission Form State
  const [assetType, setAssetType] = useState<"project" | "certificate">("project");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkOrUrl, setLinkOrUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulation loading state for Demo purposes
  const [isSimulatingLoading, setIsSimulatingLoading] = useState(false);

  // Default fallback scores if not initialized
  const rawScores = currentProfile?.aiScores || {};
  const currentScores = {
    programming: rawScores["programming"] ?? rawScores["Programmation & Algorithmes"] ?? 8,
    systems: rawScores["systems"] ?? rawScores["Architecture & Systèmes"] ?? 6,
    ux: rawScores["ux"] ?? rawScores["Créativité & Design UX"] ?? 7,
    leadership: rawScores["leadership"] ?? rawScores["Leadership & Initiative"] ?? 6,
    data_ai: rawScores["data_ai"] ?? rawScores["Data & Modèles d'IA"] ?? 5,
  };

  const getScoreValue = (key: string): number => {
    return (currentScores as any)[key] || 5;
  };

  // Handle asset submission
  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      onNotification("error", lang === "fr" ? "Veuillez d'abord initialiser un profil." : "Please initialize a profile first.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      onNotification("error", lang === "fr" ? "Le titre et la description technique sont requis." : "Title and description are required.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/gemini/analyze-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: assetType,
          title,
          description,
          linkOrUrl
        })
      });

      if (!response.ok) {
        throw new Error("L'évaluateur IA d'assets Gemini a retourné un code d'erreur.");
      }

      const report = await response.json();

      // Formulate the asset representation
      const newAsset: SubmittedAsset = {
        id: "asset-" + Date.now().toString(),
        type: assetType,
        title: report.verifiedTitle || title,
        description,
        linkOrUrl: linkOrUrl || undefined,
        skillsAwarded: report.skillsAwarded || [],
        aiFeedback: report.aiFeedback || "Asset validé.",
        verifiedAt: new Date().toISOString()
      };

      // Boost scores based on Gemini response
      const updatedScores = {
        programming: Math.min(10, currentScores.programming + Math.ceil((report.programming || 1) / 3)),
        systems: Math.min(10, currentScores.systems + Math.ceil((report.systems || 1) / 3)),
        ux: Math.min(10, currentScores.ux + Math.ceil((report.ux || 1) / 3)),
        leadership: Math.min(10, currentScores.leadership + Math.ceil((report.leadership || 1) / 3)),
        data_ai: Math.min(10, currentScores.data_ai + Math.ceil((report.data_ai || 1) / 3)),
      };

      // Add skills and hidden talents safely
      const mergedSkills = Array.from(new Set([
        ...(currentProfile.extractedSkills || []),
        ...(report.skillsAwarded || [])
      ]));

      // Get new dynamic hidden talent or pick random/fallback
      const freshTalent = report.hiddenTalents?.[0] || report.recommendedCareers?.[0] || (assetType === "project" ? "Architecte Container" : "Security Architect");
      
      const mergedHiddenTalents = Array.from(new Set([
        ...(currentProfile.hiddenTalents || ["Full Stack Catalyst", "Clean Coder"]),
        freshTalent
      ]));

      const nextAssets = [newAsset, ...(currentProfile.submittedAssets || [])];

      const updatedProfile: StudentProfile = {
        ...currentProfile,
        aiScores: updatedScores,
        extractedSkills: mergedSkills,
        hiddenTalents: mergedHiddenTalents,
        submittedAssets: nextAssets
      };

      // Persist values in Firestore / LocalStorage
      await setStudentProfile(updatedProfile);
      onProfileUpdated(updatedProfile);

      // Clean up form
      setTitle("");
      setDescription("");
      setLinkOrUrl("");
      onNotification("success", lang === "fr" ? "Asset analysé et validé !" : "Asset analyzed and validated!");

    } catch (err: any) {
      console.error(err);
      onNotification("error", "Failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Remove a submitted asset
  const handleDeleteAsset = async (assetId: string) => {
    if (!currentProfile || !currentProfile.submittedAssets) return;
    
    const filtered = currentProfile.submittedAssets.filter(a => a.id !== assetId);
    const updatedProfile: StudentProfile = {
      ...currentProfile,
      submittedAssets: filtered
    };

    await setStudentProfile(updatedProfile);
    onProfileUpdated(updatedProfile);
    onNotification("success", lang === "fr" ? "Asset retiré." : "Asset removed.");
  };

  const handleLoadDemoAsset = (idx: number) => {
    if (idx === 1) {
      setTitle("Microservice Docker Cloud Run");
      setDescription("Serveur d'APIs asynchrone déployé sur Docker et orchestré sur un container GCP Cloud Run avec intégration continue.");
      setLinkOrUrl("https://github.com/talent/cloud-run-docker");
      setAssetType("project");
    } else {
      setTitle("Google Cloud Leader License");
      setDescription("Atteste d'aptitudes avancées sur IAM, BigQuery, microservices et infrastructures Cloud.");
      setLinkOrUrl("https://credentials.gcp.edu/cloud-digital-leader");
      setAssetType("certificate");
    }
  };

  // Shimmer Trigger Demo
  const triggerShimmerSimulation = () => {
    setIsSimulatingLoading(true);
    setTimeout(() => {
      setIsSimulatingLoading(false);
      onNotification("success", lang === "fr" ? "Scores recalculés avec succès !" : "Scores recalculated successfully!");
    }, 2800);
  };

  const categoriesToShow = [
    { key: "programming", label: t.scoreCode, val: getScoreValue("programming") },
    { key: "systems", label: t.scoreSystems, val: getScoreValue("systems") },
    { key: "ux", label: t.scoreDesign, val: getScoreValue("ux") },
    { key: "leadership", label: t.scoreLead, val: getScoreValue("leadership") },
    { key: "data_ai", label: t.scoreData, val: getScoreValue("data_ai") },
  ];

  // Visual classes configuration
  const cardBg = theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-zinc-100 border-zinc-200 text-zinc-950";
  const innerCardBg = theme === "dark" ? "bg-zinc-950/60 border-zinc-800" : "bg-white border-zinc-200/60";
  const isDark = theme === "dark";

  return (
    <div className="space-y-6">

      {/* DASHBOARD HEADER & SIMULATION CONTROLIER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-cyan-400/5 p-4 rounded-xl border border-indigo-500/10">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest font-black text-indigo-500 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
            {lang === "fr" ? "Analyse Multi-Critères IA" : "AI Sourcing Analytics"}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {lang === "fr" ? "Visualisation synthétique des aptitudes" : "Visual multi-factor student score assessment"}
          </p>
        </div>

        <button
          onClick={triggerShimmerSimulation}
          disabled={isSimulatingLoading}
          type="button"
          className="bg-indigo-600 hover:bg-indigo-500 font-mono font-bold text-[10px] uppercase text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all active:scale-95 shadow-sm text-center self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingLoading ? "animate-spin" : ""}`} />
          <span>{lang === "fr" ? "Calculer Scores IA" : "Recalculate Skills"}</span>
        </button>
      </div>

      {/* THREE-COLUMN ANALYTICAL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. WIDGET "SCORES" - strictly labels and percents (No extra words) */}
        <div id="scores-widget-card" className={`p-5 rounded-xl border flex flex-col justify-between ${cardBg} shadow-sm`}>
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-400">
                {lang === "fr" ? "Scores Aptitudes" : "Aptitude Scores"}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {isSimulatingLoading ? (
              // Shimmer version of scores
              <div className="space-y-4 animate-pulse py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-3 bg-zinc-700/60 rounded w-1/3" />
                      <div className="h-3 bg-zinc-700/60 rounded w-10" />
                    </div>
                    <div className="h-2 bg-zinc-700/30 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : (
              // Real compact scores
              <div className="space-y-4 py-1.5">
                {categoriesToShow.map((cat) => {
                  const percent = cat.val * 10;
                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                        <span className="text-zinc-400">{cat.label}</span>
                        <span className="text-indigo-400">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>Index Moyen:</span>
            <span className="font-bold text-indigo-400">
              {Math.round(categoriesToShow.reduce((acc, curr) => acc + curr.val, 0) / 5 * 10)}%
            </span>
          </div>
        </div>

        {/* 2. WIDGET "TALENT CACHÉ" - Animated Glow with Dynamic Badges */}
        <div 
          id="hidden-talent-widget-card" 
          className={`p-5 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${cardBg} shadow-sm group`}
        >
          {/* Pulsing glow background vector */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-tr from-cyan-400 via-indigo-600 to-blue-500 opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity" />
          
          {/* Outer glowing borderline trick */}
          <div className="absolute inset-0 border border-transparent bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 rounded-xl opacity-0 hover:opacity-10 transition-opacity pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-cyan-400">
                {lang === "fr" ? "Talent Caché" : "Hidden Talent"}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
            </div>

            {isSimulatingLoading ? (
              // Shimmer version of Talent discovery
              <div className="space-y-4 animate-pulse py-2">
                <div className="h-6 bg-zinc-700/60 rounded w-3/4 mb-4" />
                <div className="h-3 bg-zinc-700/40 rounded w-full" />
                <div className="h-3 bg-zinc-700/40 rounded w-5/6" />
                <div className="h-8 bg-zinc-700/30 rounded w-1/2 mt-4" />
              </div>
            ) : (
              // Real data with active physical design
              <div className="space-y-3.5">
                <div className="inline-block p-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-lg">
                  <div className="bg-zinc-950 p-2 rounded-md">
                    <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest">
                      [{currentProfile?.hiddenTalents?.[0] || "Cybersecurity Pro"}]
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-normal">
                  {lang === "fr" 
                    ? "Inférences d'ingénierie avancées analysées à partir du comportement de code, des certifications et de l'architecture."
                    : "Advanced design inference extracted from portfolio assets inputs and challenge results."}
                </p>

                <div className="pt-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold mb-1">Inférences secondaires :</span>
                  <div className="flex flex-wrap gap-1">
                    {(currentProfile?.hiddenTalents || []).slice(1, 4).map((tal, ind) => (
                      <span key={ind} className="bg-zinc-800/80 border border-zinc-700 px-1.5 py-0.5 rounded text-[9px] text-zinc-300 font-mono">
                        {tal}
                      </span>
                    ))}
                    {(!currentProfile?.hiddenTalents || currentProfile.hiddenTalents.length <= 1) && (
                      <>
                        <span className="bg-zinc-850 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] text-zinc-400 font-mono">Autonome DevOps</span>
                        <span className="bg-zinc-850 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] text-zinc-400 font-mono">Frugal Code</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span>Certifications matching:</span>
            <span className="text-cyan-400 font-bold">✔ Premium Certified</span>
          </div>
        </div>

        {/* 3. SIMULATED SKELETON LOADERS DEMO / RECOGNITIONS */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between ${cardBg} shadow-sm relative overflow-hidden`}>
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-amber-400">
                {lang === "fr" ? "Recrutement Match" : "Hiring Priority"}
              </span>
              <Award className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            </div>

            {isSimulatingLoading ? (
              // Shimmer version
              <div className="space-y-4 animate-pulse py-2">
                <div className="h-4 bg-zinc-700/60 rounded w-1/2" />
                <div className="h-6 bg-zinc-700/60 rounded w-full" />
                <div className="h-3 bg-zinc-700/40 rounded w-4/5" />
                <div className="h-3 bg-zinc-700/40 rounded w-3/4" />
              </div>
            ) : (
              // Content presentation
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold leading-tight font-display text-white">
                  {lang === "fr" ? "Profil Recommandé GCP Cloud" : "Recommended GCP Role"}
                </h4>
                
                <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-lg">
                  <p className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">
                    ⚡ GCP CLOUD RUN ARCHITECT
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-1 leading-normal">
                    {lang === "fr" ? "Adapté pour déployer des conteneurs sécurisés." : "Fitted for secure container orchestration."}
                  </p>
                </div>

                <div className="bg-zinc-800/30 p-2.5 rounded-lg border border-zinc-800/60 text-[10px] leading-relaxed text-zinc-400">
                  {lang === "fr" 
                    ? "Défiez l'Arène de Code pour améliorer cet indice asymétrique."
                    : "Complete active coding tasks to strengthen selection."}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
            <span className="text-zinc-500">Recruiter Visibility:</span>
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">● Public</span>
          </div>
        </div>

      </div>

      {/* QUICK CONTRIBUTIONS - ASSETS FORM & LIST */}
      <div className={`p-6 rounded-xl border ${cardBg} shadow-sm`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600/15 text-indigo-400 p-2 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black font-display tracking-tight text-white">{t.quickSubmit}</h4>
              <p className="text-[10.5px] text-zinc-400">{lang === "fr" ? "Valorisez vos projets GitHub et examens passés" : "Let Gemini analyze and rate your achievements"}</p>
            </div>
          </div>

          {/* Quick presets loaders */}
          <div className="flex bg-zinc-950 p-1 border border-zinc-800 rounded-lg">
            <button
              onClick={() => handleLoadDemoAsset(1)}
              type="button"
              className="px-2.5 py-1 text-[9px] font-mono bg-zinc-900 rounded font-bold hover:bg-zinc-800 text-cyan-400 cursor-pointer border border-zinc-800"
            >
              Preset: Cloud Run
            </button>
            <button
              onClick={() => handleLoadDemoAsset(2)}
              type="button"
              className="ml-1 px-2.5 py-1 text-[9px] font-mono bg-zinc-900 rounded font-bold hover:bg-zinc-800 text-cyan-400 cursor-pointer border border-zinc-800"
            >
              Preset: GCP Leader
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmitAsset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Asset Type */}
            <div>
              <label className="text-[10px] uppercase font-extrabold text-zinc-400 font-mono block mb-1.5">{t.typeTitle} :</label>
              <div className="flex bg-zinc-950/80 border border-zinc-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAssetType("project")}
                  className={`flex-1 text-[11px] py-1 px-2 rounded font-bold transition-all ${
                    assetType === "project" 
                      ? "bg-zinc-900 text-white shadow-sm border border-zinc-700/55" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  💻 {lang === "fr" ? "Projet GitHub" : "GitHub Project"}
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType("certificate")}
                  className={`flex-1 text-[11px] py-1 px-2 rounded font-bold transition-all ${
                    assetType === "certificate" 
                      ? "bg-zinc-900 text-white shadow-sm border border-zinc-700/55" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  📜 {lang === "fr" ? "Certification" : "Certification"}
                </button>
              </div>
            </div>

            {/* Official Title */}
            <div>
              <label className="text-[10px] uppercase font-extrabold text-zinc-400 font-mono block mb-1.5">{t.officialTitle} :</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Cloud Digital Leader, Microservice Dock..."
                className="w-full text-xs p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

          </div>

          <div>
            <label className="text-[10px] uppercase font-extrabold text-zinc-400 font-mono block mb-1.5">{t.descTitle} :</label>
            <textarea
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === "fr" ? "Langages, apports cloud, architecture de services..." : "Languages, GCP servers, tools..."}
              rows={2}
              className="w-full text-xs p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-extrabold text-zinc-400 font-mono block mb-1.5">{t.urlTitle} (Optional) :</label>
            <input
              type="url"
              value={linkOrUrl}
              onChange={e => setLinkOrUrl(e.target.value)}
              placeholder="https://github.com/profile/repo..."
              className="w-full text-xs p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md disabled:opacity-40"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.analyzingText}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t.submitBtn}</span>
              </>
            )}
          </button>
        </form>

        {/* ACTIONS HISTORY CONTAINER */}
        {currentProfile?.submittedAssets && currentProfile.submittedAssets.length > 0 && (
          <div className="mt-6 border-t border-zinc-800 pt-5 space-y-3">
            <h5 className="text-[10px] font-mono font-extrabold uppercase text-zinc-500 tracking-wider">
              {t.historyTitle} ({currentProfile.submittedAssets.length}) :
            </h5>

            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {currentProfile.submittedAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950 transition-colors text-left flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-black border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                        {asset.type === "project" ? "💻 Code" : "📜 Certif"}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        Validé {new Date(asset.verifiedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h6 className="text-[12px] font-bold text-white flex items-center gap-1">
                      {asset.title}
                      {asset.linkOrUrl && (
                        <a href={asset.linkOrUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </h6>

                    <p className="text-[10.5px] text-zinc-400 leading-tight">
                      {asset.description}
                    </p>

                    <div className="border-l-2 border-cyan-500 bg-zinc-900/60 p-2 rounded text-[10px] italic text-cyan-300 mt-2">
                      <strong>AI Review:</strong> {asset.aiFeedback}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    type="button"
                    className="p-1 text-zinc-600 hover:text-rose-500 hover:bg-zinc-900 rounded cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
