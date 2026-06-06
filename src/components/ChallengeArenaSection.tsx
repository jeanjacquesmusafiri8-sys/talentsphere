import React, { useState, useEffect } from "react";
import { 
  Terminal, Sparkles, Loader2, Play, Send, Award, BookOpen, Check, HelpCircle, 
  RefreshCw, ChevronRight, AlertCircle, Layout, Database, FileCode, CheckCircle2 
} from "lucide-react";
import { StudentProfile, CodingChallenge, ChallengeSubmission } from "../types";
import { 
  saveCodingChallenge, 
  listCodingChallenges, 
  saveChallengeSubmission, 
  listChallengeSubmissions 
} from "../firebase";

interface ChallengeArenaSectionProps {
  currentUser: any;
  currentProfile: StudentProfile | null;
  onNotification: (type: "success" | "error", text: string) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export default function ChallengeArenaSection({
  currentUser,
  currentProfile,
  onNotification,
  focusMode = false,
  onToggleFocusMode,
}: ChallengeArenaSectionProps) {
  // Arena State
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  const [challengesHistory, setChallengesHistory] = useState<CodingChallenge[]>([]);
  const [submissionsHistory, setSubmissionsHistory] = useState<ChallengeSubmission[]>([]);

  // Timer attributes
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Generation preferences
  const [targetDifficulty, setTargetDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [customTechnology, setCustomTechnology] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [typedReport, setTypedReport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<ChallengeSubmission | null>(null);
  
  // Loading past lists
  useEffect(() => {
    async function loadHistory() {
      const uId = currentUser ? currentUser.uid : "offline-hackathon-student-id";
      try {
        const challenges = await listCodingChallenges(uId);
        const submissions = await listChallengeSubmissions(uId);
        setChallengesHistory(challenges);
        setSubmissionsHistory(submissions);

        // Auto select first challenge if active
        if (challenges.length > 0) {
          const assigned = challenges.find(c => c.status === "assigned");
          setActiveChallenge(assigned || challenges[0]);
        }
      } catch (err) {
        console.error("Error loading challenge lists", err);
      }
    }
    loadHistory();
  }, [currentUser, currentProfile]);

  // Handle setting initial starter code when switching active challenge
  useEffect(() => {
    if (activeChallenge) {
      setTypedCode(activeChallenge.starterCode || "/* Écrivez votre code ici */\n");
      setTypedReport("");
      setLatestSubmission(null);
      // Look up if this challenge is already graded in our submissions history
      const matchedGraded = submissionsHistory.find(s => s.challengeId === activeChallenge.id);
      if (matchedGraded) {
        setLatestSubmission(matchedGraded);
        setTypedCode(matchedGraded.submittedCode);
        setTypedReport(matchedGraded.submittedReport || "");
        setTimeLeft(null);
        setIsTimerRunning(false);
      } else {
        const defaultSecs = activeChallenge.difficulty === "Hard" ? 2700 : activeChallenge.difficulty === "Medium" ? 1800 : 900;
        setTimeLeft(defaultSecs);
        setIsTimerRunning(true);
      }
    }
  }, [activeChallenge, submissionsHistory]);

  // Tick-down interval logic
  useEffect(() => {
    let timerId: any = null;
    if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else {
            clearInterval(timerId);
            return 0;
          }
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTimerRunning, timeLeft]);

  const formatTime = (secs: number | null) => {
    if (secs === null) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Generate personalized challenge via Gemini
  const handleGenerateChallenge = async () => {
    setIsGenerating(true);
    setLatestSubmission(null);
    try {
      const skills = currentProfile?.extractedSkills || ["JavaScript", "TypeScript"];
      const gaps = currentProfile?.gaps || ["System Design"];
      const finalTechList = customTechnology.trim() 
        ? [customTechnology.trim(), ...skills] 
        : skills;

      const response = await fetch("/api/gemini/generate-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: finalTechList,
          gaps: gaps,
          difficulty: targetDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("L'API Arène Gemini a rencontré un échec de conception.");
      }

      const rawChallenge = await response.json();
      const uId = currentUser ? currentUser.uid : "offline-hackathon-student-id";

      const createdChallenge: CodingChallenge = {
        id: "challenge-" + Date.now().toString(),
        userId: uId,
        title: rawChallenge.title || "Défi Technique Structuré",
        description: rawChallenge.description || "Résolvez le problème d'ingénierie proposé.",
        difficulty: targetDifficulty,
        expectedConcepts: rawChallenge.expectedConcepts || [],
        starterCode: rawChallenge.starterCode || "function handleFlow() {\n  // Write logic here\n}",
        status: "assigned",
        createdAt: new Date().toISOString(),
      };

      // Persistence
      await saveCodingChallenge(createdChallenge);
      setChallengesHistory(prev => [createdChallenge, ...prev]);
      setActiveChallenge(createdChallenge);
      setCustomTechnology("");
      onNotification("success", "Défi technique sur-mesure modélisé par Gemini !");

    } catch (err: any) {
      console.error(err);
      onNotification("error", "Échec de génération : " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Evaluate candidate's submission via Gemini
  const handleSubmitSubmission = async () => {
    if (!activeChallenge) return;
    if (!typedCode.trim()) {
      onNotification("error", "Veuillez écrire du code avant de soumettre.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/gemini/evaluate-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeTitle: activeChallenge.title,
          challengeDescription: activeChallenge.description,
          submittedCode: typedCode,
          submittedReport: typedReport,
        }),
      });

      if (!response.ok) {
        throw new Error("L'évaluation dynamique par Gemini a échoué.");
      }

      const evaluation = await response.json();
      const uId = currentUser ? currentUser.uid : "offline-hackathon-student-id";

      const submission: ChallengeSubmission = {
        id: "submission-" + Date.now().toString(),
        userId: uId,
        challengeId: activeChallenge.id,
        submittedCode: typedCode,
        submittedReport: typedReport,
        evaluationScore: evaluation.evaluationScore ?? 5,
        aiFeedback: evaluation.aiFeedback || "Code évalué avec succès.",
        strengthsIdentified: evaluation.strengthsIdentified || [],
        gapsIdentified: evaluation.gapsIdentified || [],
        status: "graded",
        submittedAt: new Date().toISOString(),
      };

      // Save submission
      await saveChallengeSubmission(submission);
      setSubmissionsHistory(prev => [submission, ...prev]);
      setLatestSubmission(submission);

      // Update parent challenge status to completed
      const updatedChallenge: CodingChallenge = {
        ...activeChallenge,
        status: "completed",
      };
      await saveCodingChallenge(updatedChallenge);
      setChallengesHistory(prev => prev.map(c => c.id === activeChallenge.id ? updatedChallenge : c));
      setActiveChallenge(updatedChallenge);

      // Sync user tech scores if they perform wonderfully
      if (currentProfile) {
        const firstConcept = activeChallenge.expectedConcepts[0] || "General";
        const updatedScores = {
          ...(currentProfile.aiScores || {}),
          [firstConcept]: evaluation.evaluationScore ?? 6,
        };
        const updatedProfile = {
          ...currentProfile,
          aiScores: updatedScores,
        };
        onNotification("success", `Excellent ! Retours reçus. Note : ${evaluation.evaluationScore}/10 !`);
      }

    } catch (err: any) {
      console.error(err);
      onNotification("error", "Erreur de notation : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCodeDemo = () => {
    if (!activeChallenge) return;
    setTypedCode(`// Solution d'Élite par l'étudiant
export function solveChallenge() {
  console.log("Exécuté de manière optimisée");
  // Utilisation de maps au lieu de complex imbrication pour un temps d'exécution O(N)
  const lookupStore = new Map();
  
  // Validation des données pour des opérations de production sécurisées
  const handleValidation = (data) => {
    return data && typeof data === "object";
  };
  
  return { success: true, processedKeys: Array.from(lookupStore.keys()) };
}`);
    setTypedReport("J'ai implémenté une solution asynchrone évitant les verrous d'infrastructure. Les tests de charge passeraient en O(N) en mémoire constante.");
  };

  return (
    <div id="coding-arena-card" className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden">
      
      {/* Dark Theme Header Block */}
      <div className="bg-slate-950 border-b border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Terminal className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h3 className="font-extrabold text-white font-display text-base tracking-tight">
                2. AI Arena : Défis & Évaluation de Code
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Option C - Épreuves générées d'après votre profil et gaps
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {onToggleFocusMode && (
              <button
                onClick={onToggleFocusMode}
                type="button"
                className={`flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  focusMode 
                    ? "bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-500 text-white border-transparent shadow shadow-indigo-600/30 animate-pulse" 
                    : "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>{focusMode ? "Focus: ON" : "Mode Focus"}</span>
              </button>
            )}
            
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
              Arène Live
            </span>
          </div>
        </div>

        {/* Tailor preferences control panel */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
          <div className="md:col-span-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 font-mono">Difficulté du défi :</label>
            <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
              {(["Easy", "Medium", "Hard"] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTargetDifficulty(d)}
                  className={`flex-1 text-[10px] py-1.5 px-2 font-black rounded-md font-mono transition-all ${
                    targetDifficulty === d 
                      ? "bg-slate-800 text-white shadow-inner" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-4">
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 font-mono">Focus ou Package spécifique ? (Optionnel)</label>
            <input
              type="text"
              value={customTechnology}
              onChange={e => setCustomTechnology(e.target.value)}
              placeholder="Ex: GraphQL, Dockerfile, BigQuery..."
              className="w-full text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-4">
            <button
              onClick={handleGenerateChallenge}
              disabled={isGenerating}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Compilation de l'énoncé...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Générer Défi Sur-Mesure</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeChallenge ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-800">
          
          {/* PROBLEM SPECIFICATIONS PANEL (LEFT - 5 COLS) */}
          <div className="lg:col-span-5 p-6 border-r border-slate-800 bg-slate-950/40 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-indigo-400 shrink-0">
                  ÉNONCÉ TECHNIQUE
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                  activeChallenge.difficulty === "Hard" 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : activeChallenge.difficulty === "Medium"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {activeChallenge.difficulty}
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-3 font-display">{activeChallenge.title}</h4>
            </div>

            {/* COMPTE À REBOURS CHRONO */}
            {timeLeft !== null && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isTimerRunning ? (timeLeft < 300 ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-pulse") : "bg-slate-600"}`} />
                  <div>
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tight font-extrabold">Compte à Rebours</p>
                    <p className={`font-mono font-black text-sm transition-colors ${timeLeft < 300 ? "text-rose-400" : timeLeft < 600 ? "text-amber-400" : "text-emerald-400"}`}>
                      {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    type="button"
                    className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 rounded font-mono text-[9px] font-bold text-slate-300 cursor-pointer transition-all"
                  >
                    {isTimerRunning ? "Pause" : "Démarrer"}
                  </button>
                  <button
                    onClick={() => {
                      const defaultSecs = activeChallenge.difficulty === "Hard" ? 2700 : activeChallenge.difficulty === "Medium" ? 1800 : 900;
                      setTimeLeft(defaultSecs);
                      setIsTimerRunning(true);
                    }}
                    type="button"
                    className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 rounded font-mono text-[9px] font-bold text-slate-300 cursor-pointer transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {timeLeft === 0 && (
              <div className="bg-rose-950/40 border border-rose-900/30 text-rose-300 p-3 rounded-xl flex items-center gap-2 text-[10px] font-mono">
                <span className="shrink-0 font-bold">⚠️ TEMPS ÉCOULÉ :</span>
                <span>Finalisez et soumettez votre évaluation dynamique.</span>
              </div>
            )}

            {/* Problem markdown representation */}
            <div className="prose prose-invert text-xs text-slate-300 leading-relaxed font-sans max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-white">
              <div className="whitespace-pre-wrap">{activeChallenge.description}</div>
            </div>

            {/* Target concept pills */}
            <div className="border-t border-slate-800 pt-3">
              <label className="text-[10px] uppercase text-slate-500 font-bold block mb-2 font-mono">
                Compétences / concepts ciblés :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeChallenge.expectedConcepts.map((ec, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono text-[9px]">
                    {ec}
                  </span>
                ))}
              </div>
            </div>

            {/* History selection details */}
            {challengesHistory.length > 1 && (
              <div className="border-t border-slate-800 pt-4">
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1.5 font-mono">Défis générés récents :</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {challengesHistory.map(hist => (
                    <button
                      key={hist.id}
                      onClick={() => setActiveChallenge(hist)}
                      className={`px-2.5 py-1 text-[9px] font-mono rounded shrink-0 border transition-all ${
                        hist.id === activeChallenge.id 
                          ? "bg-indigo-600/20 border-indigo-500 text-white" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {hist.title.substring(0, 16)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE IDE / INPUT PANEL (RIGHT - 7 COLS) */}
          <div className="lg:col-span-7 p-6 bg-slate-950/80 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-4">
                <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                  <FileCode className="w-4 h-4 text-emerald-500" /> SOURCE_PLAYGROUND.TS
                </span>

                <button 
                  onClick={handleFillCodeDemo}
                  type="button"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] py-1 px-2.5 rounded-md font-mono"
                >
                  Charger Code Démo (WOW 🚀)
                </button>
              </div>

              {/* Advanced interactive simulated code editor input */}
              <div className="space-y-4">
                <div>
                  <textarea
                    value={typedCode}
                    onChange={e => setTypedCode(e.target.value)}
                    placeholder="/* Saisissez votre code TypeScript ou réponse d'architecte logicielle */"
                    rows={12}
                    className="w-full font-mono text-[11px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-inner"
                    style={{ lineHeight: '1.5' }}
                  />
                  <p className="text-[9px] text-slate-500 mt-1 font-mono">
                    La soumission accepte du code ou des descriptions de structures d'architecture.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 font-mono">
                    Rapport de conception de l'exercice (Optionnel) :
                  </label>
                  <textarea
                    value={typedReport}
                    onChange={e => setTypedReport(e.target.value)}
                    placeholder="Expliquez brièvement votre choix algorithmique, structures mémoires utilisées..."
                    rows={2}
                    className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* RESULTS VIEW AND TRIGGERS */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              
              {/* Submission results display if already evaluated */}
              {latestSubmission && (
                <div className="bg-slate-900 border border-indigo-700/20 p-4 rounded-xl animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-mono font-extrabold text-slate-400">Noté par Gemini 3.5-flash :</p>
                    <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded">
                      {latestSubmission.evaluationScore} / 10
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-lg text-xs leading-relaxed text-slate-300 border border-slate-800/80">
                    <div className="font-sans whitespace-pre-wrap">{latestSubmission.aiFeedback}</div>
                  </div>

                  {latestSubmission.strengthsIdentified && latestSubmission.strengthsIdentified.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div className="text-emerald-400 bg-slate-950/20 p-2 rounded">
                        <span className="font-bold block text-[10px] uppercase mb-1">✓ Points d'Excellence :</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                          {latestSubmission.strengthsIdentified.map((st, i) => <li key={i}>{st}</li>)}
                        </ul>
                      </div>
                      <div className="text-amber-400 bg-slate-950/20 p-2 rounded">
                        <span className="font-bold block text-[10px] uppercase mb-1">⚠ Axes de Remédiation :</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                          {latestSubmission.gapsIdentified?.map((st, i) => <li key={i}>{st}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitSubmission}
                  disabled={isSubmitting || isGenerating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Analyse et qualification par Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-300" />
                      <span>Soumettre à l'Évaluation IA</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="p-16 text-center text-slate-500 space-y-3.5 bg-slate-950/20">
          <Terminal className="w-12 h-12 text-slate-700 mx-auto" />
          <div>
            <p className="text-xs font-mono">Aucun exercice n'est configuré dans l'arène.</p>
            <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed mt-1">
              Soumettez ou présélectionnez votre CV d'étudiant pour identifier vos compétences clés et cliquez sur le bouton vert **Générer Défi Sur-Mesure** ci-dessus.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
