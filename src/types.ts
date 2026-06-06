export interface SubmittedAsset {
  id: string;
  type: "project" | "certificate";
  title: string;
  description: string;
  linkOrUrl?: string;
  skillsAwarded: string[];
  aiFeedback: string;
  verifiedAt: string;
}

export interface StudentProfile {
  id: string; // matches auth UID
  name: string;
  email: string;
  extractedSkills: string[];
  aiScores?: { [discipline: string]: number };
  profileVector?: number[]; // [frontend, backend, cloud/devops] representations
  careerInterests?: string;
  createdAt: string;
  resumeText?: string;
  aiSummary?: string;
  strengths?: string[];
  gaps?: string[];
  hiddenTalents?: string[];
  submittedAssets?: SubmittedAsset[];
}

export interface CodingChallenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  expectedConcepts: string[];
  starterCode?: string;
  status: "assigned" | "completed";
  createdAt: string;
}

export interface ChallengeSubmission {
  id: string;
  userId: string;
  challengeId: string;
  submittedCode: string;
  submittedReport?: string;
  evaluationScore: number;
  aiFeedback: string;
  strengthsIdentified?: string[];
  gapsIdentified?: string[];
  status: "pending_review" | "graded";
  submittedAt: string;
}

export interface RoadmapStep {
  title: string;
  description: string;
  skillsAcquired: string[];
  estimatedDuration: string;
  status: "not_started" | "in_progress" | "completed";
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  targetJob: string;
  steps: RoadmapStep[];
  estimatedTimeline: string;
  aiAdvice: string;
  createdAt: string;
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salary: string;
  location: string;
  createdAt: string;
}
