import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseMock, googleProvider, handleFirestoreError, OperationType } from "./firebase";
import { StudentProfile } from "./types";

interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  studentProfile: StudentProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileState: (profile: StudentProfile) => void;
  updateUserProfile: (
    displayName: string,
    photoURL: string,
    careerInterests: string,
    email: string,
    resumeText: string,
    extractedSkills: string[]
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick initial check of local auth state (e.g. for mock persistency)
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseMock) {
      // Initialize from localStorage mock session
      const savedSession = localStorage.getItem("talentsphere_mock_active_session");
      if (savedSession) {
        try {
          const mockUser = JSON.parse(savedSession);
          setUser(mockUser);
          
          // Load profile or initialize a robust default
          const profileKey = `talentsphere_student_profile_${mockUser.uid}`;
          const rawProfile = localStorage.getItem(profileKey);
          if (rawProfile) {
            setStudentProfile(JSON.parse(rawProfile));
          } else {
            const defaultProf = getInitialProfile(mockUser.uid, mockUser.displayName || "Étudiant", mockUser.email || "");
            localStorage.setItem(profileKey, JSON.stringify(defaultProf));
            setStudentProfile(defaultProf);
          }
        } catch (e) {
          console.error("Error restoring mock session", e);
        }
      } else {
        // Fallback default Jean-Jacques profile to not break mock display
        const fallbackUser: AuthUser = {
          uid: "hackathon-student-jeanjacques",
          displayName: "Jean-Jacques Musafiri",
          email: "jeanjacquesmusafiri8@gmail.com",
          photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
          emailVerified: true
        };
        setUser(fallbackUser);
        const profileKey = `talentsphere_student_profile_${fallbackUser.uid}`;
        const rawProfile = localStorage.getItem(profileKey);
        if (rawProfile) {
          setStudentProfile(JSON.parse(rawProfile));
        } else {
          const defaultProf = getInitialProfile(fallbackUser.uid, fallbackUser.displayName || "Jean-Jacques Musafiri", fallbackUser.email || "");
          localStorage.setItem(profileKey, JSON.stringify(defaultProf));
          setStudentProfile(defaultProf);
        }
      }
      setLoading(false);
    } else {
      // Connect to real Firebase Auth
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser: AuthUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          };
          setUser(mappedUser);

          // Retrieve or construct their student document in Firestore
          try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              setStudentProfile(docSnap.data() as StudentProfile);
            } else {
              // Create default fields in Firestore automatically
              const defaultProf = getInitialProfile(
                firebaseUser.uid,
                firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Étudiant",
                firebaseUser.email || ""
              );
              await setDoc(docRef, defaultProf);
              setStudentProfile(defaultProf);
            }
          } catch (err) {
            console.error("Error synchronizing profile with Firestore:", err);
            // Non-blocking fallback to state in case permissions are not open yet
            const defaultProf = getInitialProfile(
              firebaseUser.uid,
              firebaseUser.displayName || "Étudiant",
              firebaseUser.email || ""
            );
            setStudentProfile(defaultProf);
          }
        } else {
          setUser(null);
          setStudentProfile(null);
        }
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, []);

  const getInitialProfile = (uid: string, name: string, email: string): StudentProfile => {
    return {
      id: uid,
      name,
      email,
      extractedSkills: ["React.js", "TypeScript", "Node.js (Express)", "Tailwind CSS", "Git"],
      aiScores: {
        "Programming": 78,
        "Systems": 60,
        "UX Design": 72,
        "Leadership": 65,
        "Data & AI Models": 55
      },
      profileVector: [0.75, 0.6, 0.45],
      careerInterests: "Ingénieur Full-Stack & Solutions Cloud",
      createdAt: new Date().toISOString(),
      resumeText: `Fichier profil synchronisé pour ${name}. Actuellement en cours de formation cloud.`,
      aiSummary: "Candidat avec un excellent bagage technique initial en développement Web moderne. Prêt à acquérir des compétences avancées sur GCP et l'IA générative Google Gemini.",
      strengths: [
        "Maîtrise complète de l'écosystème React et du typage TypeScript",
        "Expérience universitaire robuste de la conception d'APIs asynchrones",
        "Pratique rigoureuse des commits Git et de l'architecture découplée"
      ],
      gaps: [
        "Familiarisation initiale nécessaire avec les outils d'orchestration (Docker, Kubernetes)",
        "Absence d'expérience concrète de déploiement Cloud (Google Cloud Run/Functions)",
        "Pratique limitée de l'intégration asynchrone des modèles d'IA générative (Gemini SDK)"
      ],
      hiddenTalents: ["System Optimizer", "Modern UI Catalyst"],
      submittedAssets: []
    };
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (isFirebaseMock) {
      // Simulated Email Sign-In
      const registeredListRaw = localStorage.getItem("talentsphere_mock_registered_users");
      const usersList = registeredListRaw ? JSON.parse(registeredListRaw) : [];
      
      const foundUser = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!foundUser || foundUser.password !== password) {
        throw new Error("Identifiants incorrects ou utilisateur introuvable en base.");
      }

      const mockUser: AuthUser = {
        uid: foundUser.uid,
        displayName: foundUser.displayName,
        email: foundUser.email,
        photoURL: null,
        emailVerified: true
      };

      setUser(mockUser);
      localStorage.setItem("talentsphere_mock_active_session", JSON.stringify(mockUser));
      
      const profileKey = `talentsphere_student_profile_${mockUser.uid}`;
      const rawProfile = localStorage.getItem(profileKey);
      if (rawProfile) {
        setStudentProfile(JSON.parse(rawProfile));
      } else {
        const defaultProf = getInitialProfile(mockUser.uid, mockUser.displayName, mockUser.email);
        localStorage.setItem(profileKey, JSON.stringify(defaultProf));
        setStudentProfile(defaultProf);
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    if (isFirebaseMock) {
      // Simulated Email Sign-Up
      const registeredListRaw = localStorage.getItem("talentsphere_mock_registered_users");
      const usersList = registeredListRaw ? JSON.parse(registeredListRaw) : [];

      if (usersList.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Cet email est déjà lié à un compte existant.");
      }

      const newUid = `mock-uid-${Math.random().toString(36).substring(2, 11)}`;
      const newMockUser = { uid: newUid, email, password, displayName };
      usersList.push(newMockUser);
      localStorage.setItem("talentsphere_mock_registered_users", JSON.stringify(usersList));

      const mockUserObj: AuthUser = {
        uid: newUid,
        displayName,
        email,
        photoURL: null,
        emailVerified: true
      };

      setUser(mockUserObj);
      localStorage.setItem("talentsphere_mock_active_session", JSON.stringify(mockUserObj));

      const defaultProf = getInitialProfile(newUid, displayName, email);
      localStorage.setItem(`talentsphere_student_profile_${newUid}`, JSON.stringify(defaultProf));
      setStudentProfile(defaultProf);
    } else {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      if (credentials.user) {
        await updateProfile(credentials.user, { displayName });
        
        // Ensure student document is generated
        const defaultProf = getInitialProfile(credentials.user.uid, displayName, email);
        try {
          await setDoc(doc(db, "users", credentials.user.uid), defaultProf);
          setStudentProfile(defaultProf);
        } catch (e) {
          console.error("Failing to write initial profile", e);
          setStudentProfile(defaultProf);
        }
      }
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseMock) {
      // Simulated Google Single Sign-On
      const googleMockUser: AuthUser = {
        uid: "mock-google-uid-jeanjacques",
        displayName: "Jean-Jacques Musafiri",
        email: "jeanjacquesmusafiri8@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        emailVerified: true
      };

      setUser(googleMockUser);
      localStorage.setItem("talentsphere_mock_active_session", JSON.stringify(googleMockUser));

      const profileKey = `talentsphere_student_profile_${googleMockUser.uid}`;
      const rawProfile = localStorage.getItem(profileKey);
      if (rawProfile) {
        setStudentProfile(JSON.parse(rawProfile));
      } else {
        const defaultProf = getInitialProfile(googleMockUser.uid, googleMockUser.displayName || "", googleMockUser.email || "");
        localStorage.setItem(profileKey, JSON.stringify(defaultProf));
        setStudentProfile(defaultProf);
      }
    } else {
      const response = await signInWithPopup(auth, googleProvider);
      // Synchronized onAuthStateChanged listener handles document creation
    }
  };

  const logout = async () => {
    if (isFirebaseMock) {
      setUser(null);
      setStudentProfile(null);
      localStorage.removeItem("talentsphere_mock_active_session");
    } else {
      await signOut(auth);
    }
  };

  const updateProfileState = (profile: StudentProfile) => {
    setStudentProfile(profile);
    if (isFirebaseMock) {
      localStorage.setItem(`talentsphere_student_profile_${profile.id}`, JSON.stringify(profile));
    } else {
      setDoc(doc(db, "users", profile.id), profile).catch(err => {
        console.error("Error setting document in Firestore during updateProfileState:", err);
      });
    }
  };

  const updateUserProfile = async (
    displayName: string,
    photoURL: string,
    careerInterests: string,
    email: string,
    resumeText: string,
    extractedSkills: string[]
  ) => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      displayName,
      photoURL,
      email
    };
    setUser(updatedUser);

    if (isFirebaseMock) {
      localStorage.setItem("talentsphere_mock_active_session", JSON.stringify(updatedUser));
    } else {
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName, photoURL });
        } catch (authErr) {
          console.error("Error updating auth user profile info:", authErr);
        }
      }
    }

    if (studentProfile) {
      const updatedProfile: StudentProfile = {
        ...studentProfile,
        name: displayName,
        email,
        careerInterests,
        resumeText,
        extractedSkills
      };
      setStudentProfile(updatedProfile);

      if (isFirebaseMock) {
        localStorage.setItem(`talentsphere_student_profile_${studentProfile.id}`, JSON.stringify(updatedProfile));
      } else {
        try {
          await setDoc(doc(db, "users", studentProfile.id), updatedProfile);
        } catch (dbErr) {
          console.error("Error updating db user profile info:", dbErr);
        }
      }
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      studentProfile, 
      loading, 
      isAuthenticated, 
      loginWithEmail, 
      registerWithEmail, 
      loginWithGoogle, 
      logout,
      updateProfileState,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth strictly must be invoked inside AuthProvider context bounds.");
  }
  return context;
}
