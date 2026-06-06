import React, { useState, useEffect } from "react";
import { FileText, Sparkles, Loader2, CheckCircle, Database, Plus, Check, ChevronRight, AlertCircle, RefreshCw, User, Award } from "lucide-react";
import { StudentProfile } from "../types";
import { setStudentProfile, getStudentProfile } from "../firebase";

const STUDENT_RESUME_PRESETS = [
  {
    name: "Elyan Granger",
    email: "elyan.granger@edu.univ.fr",
    title: "Conseiller ou Apprenti Développeur React & Node.js",
    text: `PROFIL ÉTUDIANT
- Master 1 en Informatique Générale | Université de Nantes
- Autodidacte passionné de JavaScript/TypeScript et de logique UI réactive.
- À la recherche d'une alternance de 12 mois dans le développement Fullstack.

PROJETS ET ENTRAÎNEMENT INDIVIDUEL:
* Kanban Board Interactif: Réalisé entièrement sous React 18, Tailwind CSS, gestion de drag-and-drop complexe.
* API REST eCommerce: Serveur Node.js avec Express, connexion à MongoDB Atlas, persistance de paniers de sessions.
* Script d'automatisation Node: Réparation d'arborescences de fichiers corrompus en JS.

COMPÉTENCES DE DÉPART:
Langages & Web: JavaScript, TypeScript, HTML5, CSS3, SQL de base, Python académique.
Frameworks: React.js, Tailwind CSS, Node.js (Express), Git, Jest pour tests unitaires.`
  },
  {
    name: "Julie Dubois",
    email: "julie.dubois@polytech.org",
    title: "Étudiante Master 2 Data Science & IA Cloud",
    text: `ÉDUCATION ET OBJECTIFS:
- Master 2 de Spécialisation en Intelligence Artificielle | Polytech Paris
- Solide bagage mathématique (algèbre linéaire, statistiques descriptives, régression de modèles).
- Projet de fin d'étude : Détection de vulnérabilités réseau par classification automatique de flux IP.

COMPÉTENCES TECHNIQUES FORMELLES:
Langages: Python (Expert), SQL, R, Bash
Librairies ML: NumPy, Jupyter Pandas, Scikit-Learn, TensorFlow basique, PyTorch (entraînement simple).
Outils & Cloud: Docker, requêtes d'APIs tierces, familiarisation académique avec GCP BigQuery.`
  }
];

interface ProfileUploadSectionProps {
  currentUser: any;
  onProfileUpdated: (profile: StudentProfile) => void;
  currentProfile: StudentProfile | null;
}

export default function ProfileUploadSection({
  currentUser,
  onProfileUpdated,
  currentProfile,
}: ProfileUploadSectionProps) {
  const [resumeText, setResumeText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (currentUser) {
      setErrorText(null);
      // Try to load online profile
      async function loadDbProfile() {
        try {
          const profile = await getStudentProfile(currentUser.uid);
          if (profile) {
            onProfileUpdated(profile);
          } else {
            // Setup a default initial profile using user details
            const defaultProf: StudentProfile = {
              id: currentUser.uid,
              name: currentUser.displayName || "Étudiant",
              email: currentUser.email || "student@univer.edu",
              extractedSkills: ["Git", "TypeScript"],
              createdAt: new Date().toISOString(),
              aiSummary: "Compte configuré. Veuillez coller votre CV / lettre technique pour lancer l'évaluation et l'extraction Gemini API."
            };
            onProfileUpdated(defaultProf);
          }
        } catch (e: any) {
          console.error("Error loading student database profile", e);
        }
      }
      loadDbProfile();
    }
  }, [currentUser]);

  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setResumeText(STUDENT_RESUME_PRESETS[idx].text);
  };

  const handleExtractAndSave = async () => {
    if (!resumeText.trim()) {
      setErrorText("Veuillez saisir votre parcours académique, projets ou coller votre CV d'abord.");
      return;
    }

    setIsAnalyzing(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/gemini/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle: "Orientations Étudiant / Junior Tech",
        }),
      });

      if (!response.ok) {
        throw new Error("L'extraction de métadonnées par l'IA Gemini a rencontré une anomalie.");
      }

      const rawResult = await response.json();
      
      const profileName = currentUser 
        ? currentUser.displayName 
        : (selectedPreset !== null ? STUDENT_RESUME_PRESETS[selectedPreset].name : "Étudiant Démo");

      const profileEmail = currentUser 
        ? currentUser.email 
        : (selectedPreset !== null ? STUDENT_RESUME_PRESETS[selectedPreset].email : "demo@talentsphere.ai");

      const newProfile: StudentProfile = {
        id: currentUser ? currentUser.uid : "offline-hackathon-student-id",
        name: profileName,
        email: profileEmail,
        extractedSkills: rawResult.skills || [],
        aiScores: currentProfile?.aiScores || { Algorithms: 6, Frontend: 5 },
        profileVector: [0.7, 0.4, 0.6], // static mock conceptual vector frontend, backend, analytical science
        careerInterests: rawResult.title || "Développeur Logiciel",
        resumeText: resumeText,
        aiSummary: rawResult.aiSummary,
        strengths: rawResult.strengths || [],
        gaps: rawResult.gaps || [],
        createdAt: currentProfile?.createdAt || new Date().toISOString(),
      };

      // Save to Firestore / local storage if logged in
      setIsSaving(true);
      await setStudentProfile(newProfile);
      onProfileUpdated(newProfile);
      setIsSaving(false);

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Erreur d'analyse.");
    } finally {
      setIsAnalyzing(false);
      setIsSaving(false);
    }
  };

  return (
    <div id="cv-upload-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header and subtitle */}
      <div className="flex items-center justify-between border-b border-rose-50/50 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 font-display text-sm tracking-tight sm:text-base">
              1. Sourcing & Analyse du Profil
            </h3>
            <p className="text-[11px] text-slate-500">
              Extraction de métadonnées et hard skills par Gemini 3.5-flash
            </p>
          </div>
        </div>
        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1 font-mono hover:scale-105 transition-transform duration-200">
          <Database className="w-3 h-3 text-emerald-600 animate-pulse" /> Firestore Sync
        </span>
      </div>

      {errorText && (
        <div id="upload-error-banner" className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5 mb-4 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p>{errorText}</p>
        </div>
      )}

      {/* Profile summary banner if parsed */}
      {currentProfile && currentProfile.extractedSkills && currentProfile.extractedSkills.length > 2 && (
        <div id="parsed-summary" className="bg-gradient-to-tr from-indigo-50/75 to-indigo-50/30 border border-indigo-100 p-4 rounded-xl mb-5">
          <div className="flex items-start gap-3">
            <div className="bg-white p-2 border border-indigo-100 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Orientations Profil Détectées :</h4>
              <p className="text-[13px] font-black text-indigo-950 mt-0.5">
                {currentProfile.name} • <span className="text-slate-600 font-normal text-xs">{currentProfile.careerInterests || "Junior Software Engineer"}</span>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium italic">
                "{currentProfile.aiSummary}"
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3 border-t border-indigo-100/40 pt-3">
            {currentProfile.extractedSkills.map((s, idx) => (
              <span key={idx} className="bg-white border border-indigo-100/50 text-indigo-950 font-semibold px-2.5 py-0.5 rounded-md text-[10px] font-mono shadow-sm flex items-center gap-1 hover:bg-slate-50">
                <Check className="w-3 h-3 text-emerald-500" /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pasting area */}
      <div className="space-y-4">
        {/* Preset quick buttons */}
        <div>
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2 font-mono">
            Modèles d'entraînement de départ (Presets Hackathon) :
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STUDENT_RESUME_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === idx 
                    ? "bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.title}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 self-center" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CV Pasting text */}
        <div>
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2 font-mono">
            Texte de votre CV, diplômes ou projets académiques :
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setSelectedPreset(null);
            }}
            placeholder="Écrivez ou collez votre parcours ici... (e.g., formations, projets clés, langages programmation préférés...)"
            rows={6}
            className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-colors shadow-inner"
          />
        </div>

        {/* Submit processing triggers */}
        <button
          onClick={handleExtractAndSave}
          disabled={isAnalyzing || isSaving}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
        >
          {isAnalyzing || isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyse & synchronisation Firestore en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Lancer l'Analyse Inteligente & Enregistrer le Profil</span>
            </>
          )}
        </button>

        {/* Login warning */}
        {!currentUser && (
          <p className="text-[10px] text-slate-500 text-center font-mono italic">
            💡 Astuce : Connectez-vous d'abord à votre compte étudiant pour sauvegarder ce profil de façon persistante dans Firestore.
          </p>
        )}
      </div>

      {/* Strengths & Gaps display if we have them parsed */}
      {currentProfile && currentProfile.strengths && currentProfile.gaps && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 mt-5 pt-4">
          <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl">
            <h5 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Points Excellence Détectés
            </h5>
            <ul className="space-y-1">
              {currentProfile.strengths.slice(0, 3).map((st, i) => (
                <li key={i} className="text-[11px] text-emerald-950 flex items-start gap-1 leading-relaxed">
                  <span className="font-bold text-emerald-500">•</span>
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl">
            <h5 className="text-[11px] font-bold text-amber-800 uppercase tracking-widest font-mono flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Axes de Remédiation & Gaps
            </h5>
            <ul className="space-y-1">
              {currentProfile.gaps.slice(0, 3).map((gp, i) => (
                <li key={i} className="text-[11px] text-amber-950 flex items-start gap-1 leading-relaxed">
                  <span className="font-bold text-amber-500">•</span>
                  <span>{gp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
