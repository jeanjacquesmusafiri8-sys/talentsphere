import React, { useState, useEffect } from "react";
import { 
  Compass, Sparkles, Loader2, BookOpen, Check, Award, Hourglass, HelpCircle, 
  ChevronRight, ArrowUpRight, CheckSquare, Square, RefreshCw, Layout, Database, Milestone 
} from "lucide-react";
import { StudentProfile, CareerRoadmap, RoadmapStep } from "../types";
import { saveCareerRoadmap, getCareerRoadmap } from "../firebase";

interface CareerRoadmapSectionProps {
  currentUser: any;
  currentProfile: StudentProfile | null;
  onNotification: (type: "success" | "error", text: string) => void;
}

export default function CareerRoadmapSection({
  currentUser,
  currentProfile,
  onNotification,
}: CareerRoadmapSectionProps) {
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync / Load existing roadmap when profile loads
  useEffect(() => {
    async function loadRoadmap() {
      const uId = currentUser ? currentUser.uid : "offline-hackathon-student-id";
      try {
        const stored = await getCareerRoadmap(uId);
        if (stored) {
          setRoadmap(stored);
        } else {
          setRoadmap(null);
        }
      } catch (err) {
        console.error("Error loading roadmap from db", err);
      }
    }
    loadRoadmap();
  }, [currentUser, currentProfile]);

  const handleGenerateRoadmap = async () => {
    if (!currentProfile) {
      onNotification("error", "Veuillez d'abord analyser ou configurer un profil étudiant.");
      return;
    }

    setIsBuilding(true);
    try {
      const response = await fetch("/api/gemini/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSkills: currentProfile.extractedSkills || [],
          targetJob: currentProfile.careerInterests || "Software Engineer",
        }),
      });

      if (!response.ok) {
        throw new Error("L'API de génération de feuilles de route a rencontré un problème.");
      }

      const generatedData = await response.json();
      const uId = currentUser ? currentUser.uid : "offline-hackathon-student-id";

      // Form the database roadmap entity exactly conforming to CareerRoadmap in src/types.ts
      const newRoadmap: CareerRoadmap = {
        id: "roadmap-" + Date.now().toString(),
        userId: uId,
        targetJob: generatedData.targetJob || currentProfile.careerInterests || "Junior Web Developer",
        steps: (generatedData.steps || []).map((step: any) => ({
          title: step.title || "Phase d'apprentissage",
          description: step.description || "Étape d'apprentissage.",
          skillsAcquired: step.skillsAcquired || [],
          estimatedDuration: step.estimatedDuration || "2 semaines",
          status: "not_started" as const,
        })),
        estimatedTimeline: generatedData.estimatedTimeline || "6 mois",
        aiAdvice: generatedData.aiAdvice || "Continuez vos projets pratiques régulièrement !",
        createdAt: new Date().toISOString(),
      };

      setIsSaving(true);
      await saveCareerRoadmap(newRoadmap);
      setRoadmap(newRoadmap);
      setIsSaving(false);
      onNotification("success", "Votre feuille de route de carrière a été modélisée et enregistrée !");

    } catch (err: any) {
      console.error(err);
      onNotification("error", "Échec d'upskilling : " + err.message);
    } finally {
      setIsBuilding(false);
      setIsSaving(false);
    }
  };

  // Toggle step completion and save to DB
  const handleToggleStep = async (stepIndex: number) => {
    if (!roadmap) return;

    const updatedSteps = roadmap.steps.map((step, idx) => {
      if (idx === stepIndex) {
        const nextStatus = step.status === "completed" ? "not_started" as const : "completed" as const;
        onNotification("success", nextStatus === "completed" ? "Félicitations pour avoir validé cette étape !" : "Étape réinitialisée.");
        return { ...step, status: nextStatus };
      }
      return step;
    });

    const updatedRoadmap: CareerRoadmap = {
      ...roadmap,
      steps: updatedSteps,
    };

    setRoadmap(updatedRoadmap);

    try {
      await saveCareerRoadmap(updatedRoadmap);
    } catch (err) {
      console.error("Failed to sync roadmap status to Firestore", err);
    }
  };

  // Compute stats
  const totalSteps = roadmap?.steps.length || 0;
  const completedSteps = roadmap?.steps.filter(s => s.status === "completed").length || 0;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div id="career-roadmap-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      
      {/* Header element */}
      <div className="flex items-center justify-between border-b border-indigo-50/50 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 font-display text-sm sm:text-base tracking-tight">
              3. Feuille de Route d'Upskilling Professionnel
            </h3>
            <p className="text-[11px] text-slate-500">
              Générez un plan d'action personnalisé basé sur les prérequis d'un recruteur
            </p>
          </div>
        </div>
        
        {roadmap && (
          <span className="bg-indigo-50 text-indigo-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded">
            Score d'Avancement : {progressPercentage}%
          </span>
        )}
      </div>

      {!roadmap ? (
        <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-slate-100 mb-3">
            <Compass className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Prêt à construire votre carrière ?</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1.5 mb-5">
            Comparez vos forces et de combler activement vos lacunes techniques d'ingénierie grâce à une feuille de route sur-mesure validée par l'IA Google Gemini.
          </p>

          <button
            onClick={handleGenerateRoadmap}
            disabled={isBuilding}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-102 cursor-pointer"
          >
            {isBuilding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Conception de votre plan d'action par Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Construire ma carrière</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div id="active-roadmap-layout" className="space-y-6">
          
          {/* Progress dashboard metrics bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest">Cible d'upskilling</p>
              <p className="text-[12px] font-black text-slate-900 mt-0.5">{roadmap.targetJob}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest">Durée Globale Estimée</p>
              <p className="text-[12px] font-black text-slate-900 mt-0.5 flex items-center gap-1">
                <Hourglass className="w-3.5 h-3.5 text-indigo-600" /> {roadmap.estimatedTimeline} d'études
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-widest">Compte des Jalons</p>
              <p className="text-[12px] font-black text-indigo-700 mt-0.5 font-mono">
                {completedSteps} / {totalSteps} consolidés
              </p>
            </div>
          </div>

          {/* AI Strategy Advice Block */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
            <Milestone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider font-mono">Conseils stratégiques pour le Hackathon :</h5>
              <p className="text-xs text-indigo-900 mt-1 leading-relaxed font-medium">
                {roadmap.aiAdvice}
              </p>
            </div>
          </div>

          {/* Timeline list of steps */}
          <div className="relative border-l-2 border-indigo-100 pl-6 ml-3 space-y-6">
            {roadmap.steps.map((step, index) => {
              const isChecked = step.status === "completed";
              return (
                <div key={index} className="relative group">
                  {/* Timeline dot accent */}
                  <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                    isChecked 
                      ? "bg-emerald-500 border-white scale-110 shadow-md shadow-emerald-500/20" 
                      : "bg-white border-indigo-500 group-hover:scale-110"
                  }`} />

                  {/* Step container card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    isChecked 
                      ? "bg-emerald-50/20 border-emerald-100 animate-fadeIn" 
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-100/85 hover:border-slate-200"
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold font-mono text-indigo-600 bg-indigo-50 py-0.5 px-1.5 rounded">
                            Phase {index + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Durée : {step.estimatedDuration}
                          </span>
                        </div>
                        <h4 className={`text-xs sm:text-sm font-bold text-slate-900 mt-1.5 ${isChecked ? "line-through text-slate-400" : ""}`}>
                          {step.title}
                        </h4>
                        <p className={`text-xs text-slate-600 leading-relaxed mt-1 ${isChecked ? "text-slate-400" : ""}`}>
                          {step.description}
                        </p>
                      </div>

                      {/* Interactive completion toggle */}
                      <button
                        onClick={() => handleToggleStep(index)}
                        type="button"
                        className="p-1 px-2 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-500 animate-pulse" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* Skills/Tools listed */}
                    {step.skillsAcquired && step.skillsAcquired.length > 0 && !isChecked && (
                      <div className="border-t border-slate-200/55 pt-2.5 mt-3">
                        <label className="text-[9px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Compétences associées :
                        </label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {step.skillsAcquired.map((skill, sIdx) => (
                            <span key={sIdx} className="bg-white border border-slate-100 text-indigo-950 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 shadow-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Regenerate Action */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-5">
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-300" /> Progression persistée et synchronisée en temps réel
            </p>

            <button
              onClick={handleGenerateRoadmap}
              disabled={isBuilding}
              className="text-xs bg-slate-950 text-white font-bold py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBuilding ? 'animate-spin' : ''}`} />
              Re-générer Plan
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
