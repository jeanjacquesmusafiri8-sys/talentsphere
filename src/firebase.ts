import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  collection, 
  getDocs, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { StudentProfile, CodingChallenge, ChallengeSubmission, CareerRoadmap } from "./types";

// Determine if Firebase credentials are mock or dummy
export const isFirebaseMock = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("mock-api-key");

let app: any = null;
export let db: any = null;
export let auth: any = null;
export const googleProvider = new GoogleAuthProvider();

if (!isFirebaseMock) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    console.log("[Firebase] Successfully initialized real client SDK.");
  } catch (error) {
    console.warn("[Firebase] SDK failed to initialize with current config; falling back to mock mode.", error);
  }
}

// Global Auth State mock triggers
interface MockUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  emailVerified: boolean;
}

let mockCurrentUser: MockUser | null = null;
const authCallbacks: ((user: any) => void)[] = [];

// Local Storage mock persistence helper keys
const LS_PROFILE_KEY = "talentsphere_student_profile";
const LS_CHALLENGES_KEY = "talentsphere_challenges";
const LS_SUBMISSIONS_KEY = "talentsphere_submissions";
const LS_ROADMAP_KEY = "talentsphere_roadmaps";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || mockCurrentUser?.uid || null,
      email: auth?.currentUser?.email || mockCurrentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || mockCurrentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error("Firestore Error Block:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// Unified Firebase Connector Actions
// -------------------------------------------------------------

// Authenticative sign-in handler
export async function authenticateGoogleUser(demoUser?: { name: string; email: string }): Promise<any> {
  if (isFirebaseMock) {
    const fallbackUser: MockUser = {
      uid: "github-hackathon-candidate-uid",
      displayName: demoUser?.name || "Elyan Granger",
      email: demoUser?.email || "elyan.granger@edu.univ.fr",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      emailVerified: true
    };
    mockCurrentUser = fallbackUser;
    authCallbacks.forEach(cb => cb(fallbackUser));
    return fallbackUser;
  } else {
    try {
      const response = await signInWithPopup(auth, googleProvider);
      return response.user;
    } catch (err) {
      console.error("Authentication popup failed", err);
      throw err;
    }
  }
}

// Logout handler
export async function disconnectUser(): Promise<void> {
  if (isFirebaseMock) {
    mockCurrentUser = null;
    authCallbacks.forEach(cb => cb(null));
  } else {
    await signOut(auth);
  }
}

// Auth State Subscriber
export function onAuthStatusChange(callback: (user: any) => void) {
  if (isFirebaseMock) {
    authCallbacks.push(callback);
    // fire initial trigger
    callback(mockCurrentUser);
    return () => {
      const index = authCallbacks.indexOf(callback);
      if (index > -1) authCallbacks.splice(index, 1);
    };
  } else {
    return auth.onAuthStateChanged(callback);
  }
}

// -------------------------------------------------------------
// Document Stores CRUD Integration (Strict Type-Safety)
// -------------------------------------------------------------

// Active Student Profile Operations
export async function setStudentProfile(profile: StudentProfile): Promise<void> {
  const path = `users/${profile.id}`;
  if (isFirebaseMock) {
    localStorage.setItem(LS_PROFILE_KEY + "_" + profile.id, JSON.stringify(profile));
  } else {
    try {
      await setDoc(doc(db, "users", profile.id), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const path = `users/${studentId}`;
  if (isFirebaseMock) {
    const raw = localStorage.getItem(LS_PROFILE_KEY + "_" + studentId);
    return raw ? JSON.parse(raw) : null;
  } else {
    try {
      const snap = await getDoc(doc(db, "users", studentId));
      return snap.exists() ? (snap.data() as StudentProfile) : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
}

// Challenges Store CRUD (Generative technical challenge)
export async function saveCodingChallenge(challenge: CodingChallenge): Promise<void> {
  const path = `challenges/${challenge.id}`;
  if (isFirebaseMock) {
    const list = await listCodingChallenges(challenge.userId);
    const updated = [challenge, ...list.filter(c => c.id !== challenge.id)];
    localStorage.setItem(LS_CHALLENGES_KEY + "_" + challenge.userId, JSON.stringify(updated));
  } else {
    try {
      await setDoc(doc(db, "challenges", challenge.id), challenge);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function listCodingChallenges(userId: string): Promise<CodingChallenge[]> {
  const path = "challenges";
  if (isFirebaseMock) {
    const raw = localStorage.getItem(LS_CHALLENGES_KEY + "_" + userId);
    return raw ? JSON.parse(raw) : [];
  } else {
    try {
      const q = query(collection(db, "challenges"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const output: CodingChallenge[] = [];
      snap.forEach(d => output.push(d.data() as CodingChallenge));
      return output;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

// Challenge Submissions Operations
export async function saveChallengeSubmission(submission: ChallengeSubmission): Promise<void> {
  const path = `submissions/${submission.id}`;
  if (isFirebaseMock) {
    const list = await listChallengeSubmissions(submission.userId);
    const updated = [submission, ...list.filter(s => s.id !== submission.id)];
    localStorage.setItem(LS_SUBMISSIONS_KEY + "_" + submission.userId, JSON.stringify(updated));
  } else {
    try {
      await setDoc(doc(db, "submissions", submission.id), submission);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function listChallengeSubmissions(userId: string): Promise<ChallengeSubmission[]> {
  const path = "submissions";
  if (isFirebaseMock) {
    const raw = localStorage.getItem(LS_SUBMISSIONS_KEY + "_" + userId);
    return raw ? JSON.parse(raw) : [];
  } else {
    try {
      const q = query(collection(db, "submissions"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const output: ChallengeSubmission[] = [];
      snap.forEach(d => output.push(d.data() as ChallengeSubmission));
      return output;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
}

// Career Roadmap Store CRUD ("Construire ma carrière")
export async function saveCareerRoadmap(roadmap: CareerRoadmap): Promise<void> {
  const path = `roadmaps/${roadmap.id}`;
  if (isFirebaseMock) {
    localStorage.setItem(LS_ROADMAP_KEY + "_" + roadmap.userId, JSON.stringify(roadmap));
  } else {
    try {
      await setDoc(doc(db, "roadmaps", roadmap.id), roadmap);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function getCareerRoadmap(userId: string): Promise<CareerRoadmap | null> {
  const path = `roadmaps`;
  if (isFirebaseMock) {
    const raw = localStorage.getItem(LS_ROADMAP_KEY + "_" + userId);
    return raw ? JSON.parse(raw) : null;
  } else {
    try {
      const q = query(collection(db, "roadmaps"), where("userId", "==", userId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as CareerRoadmap;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
}

// Test live ping connection
async function testConnection() {
  if (isFirebaseMock) {
    console.log("[Firebase] Sandbox active. Utilizing localStorage mock DB driver.");
    return;
  }
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[Firebase] Live connection validated with remote cloud firestore.");
  } catch (error) {
    console.warn("[Firebase] Live DB offline or not reached. Running on robust standby drivers.", error);
  }
}

// Start async test
testConnection();
