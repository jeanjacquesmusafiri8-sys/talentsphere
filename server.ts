import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY workspace environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API: Analyze CV
app.post("/api/gemini/analyze-cv", async (req, res) => {
  try {
    const { resumeText, jobTitle } = req.body;
    if (!resumeText) {
      return res.status(400).json({ error: "Missing resumeText parameters" });
    }

    const ai = getGemini();
    const prompt = `Please analyze the following candidate resume text. ${
      jobTitle ? `Target role/position is: ${jobTitle}.` : ""
    }
Extract key parameters structured precisely to the response schema:
1. title: Profession or current targeted level (e.g., Senior Full-Stack Engineer)
2. skills: Core technical skills/frameworks and hard tools parsed
3. strengths: Highlights, certifications, or major impact statements
4. gaps: Competency gaps or nice-to-have skillsets missing
5. aiSummary: 2-3 sentences max summarizing candidate suitability and professional overview

Resume Content:
${resumeText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite Tech Recruiter and AI Talent Sourcing specialist.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Professional title matched or suggested." },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of parsed technical skills."
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key professional highlights or areas of strength."
            },
            gaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Missing skills or growth points parsed."
            },
            aiSummary: { type: Type.STRING, description: "A highly concise 2-3 sentence summary of the profile." }
          },
          required: ["title", "skills", "strengths", "gaps", "aiSummary"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Model returned empty payload response.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error analyzing CV:", error);
    res.status(500).json({ error: error.message || "Failed to analyze CV." });
  }
});

// 2. API: Generate Tailored Technical Questions
app.post("/api/gemini/generate-questions", async (req, res) => {
  try {
    const { skills, jobRequirement } = req.body;
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Missing valid skills array" });
    }

    const ai = getGemini();
    const prompt = `Create a list of 3 highly tailored technical assessment questions.
We want to test the candidate on these technologies: ${skills.join(", ")}.
${jobRequirement ? `The target job requirements or description: ${jobRequirement}` : ""}

Ensure the output conforms exactly to the JSON schema:
For each question:
- questionText: A specific technical question (no simple trivia, test practical problems, system design, or code patterns).
- expectedConceptDescription: Critical keys or terms expected in the ideal response.
- difficulty: 'Easy', 'Medium', or 'Hard'.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Tech Lead conducting a rigorous coding and technical concepts interview.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: { type: Type.STRING, description: "Specific theoretical or practical tech interview question." },
                  expectedConceptDescription: { type: Type.STRING, description: "Primary technical concept or keywords expected in the user answer." },
                  difficulty: { type: Type.STRING, description: "Assessment difficulty level." }
                },
                required: ["questionText", "expectedConceptDescription", "difficulty"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Model returned empty prompt payload.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: error.message || "Failed to generate evaluation questions." });
  }
});

// 3. API: Evaluate Technical Answer
app.post("/api/gemini/evaluate-answer", async (req, res) => {
  try {
    const { questionText, candidateAnswer, expectedConcept } = req.body;
    if (!questionText || !candidateAnswer) {
      return res.status(400).json({ error: "Missing questionText or candidateAnswer parameters" });
    }

    const ai = getGemini();
    const prompt = `Evaluate the candidate's answer for the following question:
Question: ${questionText}
Ideal Core Concept: ${expectedConcept || "Relevant technical precision."}
Candidate's Answer: ${candidateAnswer}

Rate the answer on:
- score: an integer from 0 to 10 (be fair but rigorous)
- isCorrect: boolean (true if candidate demonstrated understanding of the core concept)
- feedback: a constructive, precise, professional review (limit to 2 paragraphs)
- modelProposedCorrection: a complete, concise code snippet or ideal response explanation showing how to answer perfectly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Senior Principal Architect grading computer science and software development answers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Rating score from 0 to 10." },
            isCorrect: { type: Type.BOOLEAN, description: "True if the answer matches correct engineering standards." },
            feedback: { type: Type.STRING, description: "Detailed grading feedback." },
            modelProposedCorrection: { type: Type.STRING, description: "Optimal corrected example or reference code explanation." }
          },
          required: ["score", "isCorrect", "feedback", "modelProposedCorrection"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Model returned empty text.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate technical answer." });
  }
});

// 4. API: Generate Tailored Technical Challenge (Coding Arena)
app.post("/api/gemini/generate-challenge", async (req, res) => {
  try {
    const { skills, gaps, difficulty } = req.body;
    const skillsList = Array.isArray(skills) ? skills : [];
    const gapsList = Array.isArray(gaps) ? gaps : [];
    const diff = difficulty || "Medium";

    const ai = getGemini();
    const prompt = `Generate a coding or software design challenge tailored to students with the following profile:
Skills/Acquisitions: ${skillsList.join(", ") || "General Programming"}
Gaps / Growth points: ${gapsList.join(", ") || "Advanced algorithms or practices"}
Target Difficulty: ${diff}

Please generate:
1. A captivating Title (title)
2. A detailed markdown formulation of the technical problem (description) containing the problem statement, constraints, expected inputs/outputs, and evaluation criteria.
3. A list of expected concepts/technologies (expectedConcepts)
4. A minimal boilerplate starter code (starterCode) matching the context (prefer TypeScript/JavaScript or pseudocode).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Coding Interview Architect who crafts creative, highly educational coding assignments and design puzzles.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Captivating title for the coding challenge." },
            description: { type: Type.STRING, description: "Comprehensive problem description and parameters in markdown format." },
            expectedConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Core algorithms, patterns, or tools tested."
            },
            starterCode: { type: Type.STRING, description: "Optional starting file template code." }
          },
          required: ["title", "description", "expectedConcepts", "starterCode"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI for challenge creation.");
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error generating technical challenge:", error);
    res.status(500).json({ error: error.message || "Failed to generate challenge." });
  }
});

// 5. API: Evaluate Code Challenge Submission
app.post("/api/gemini/evaluate-submission", async (req, res) => {
  try {
    const { challengeTitle, challengeDescription, submittedCode, submittedReport } = req.body;
    if (!submittedCode) {
      return res.status(400).json({ error: "No submitted code provided for review." });
    }

    const ai = getGemini();
    const prompt = `Review the student's submission for the following coding challenge:
Challenge Title: ${challengeTitle || "Custom Coding Task"}
Challenge Description: ${challengeDescription || "General system development"}

Student's Submitted Code:
\`\`\`
${submittedCode}
\`\`\`

Student's Optional Explanatory Report/Design:
${submittedReport || "None provided."}

Please grade and review the code. Be detailed, fair, rigorous, and highly educational. Give:
- evaluationScore: From 0 to 10.
- aiFeedback: constructive markdown feedback explaining correct approaches, bugs, and design recommendations.
- strengthsIdentified: list of positive points identified.
- gapsIdentified: list of issues or room for improvement detected.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Principal Software Engineer and Technical Educator grading student code submissions with maximum precision.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluationScore: { type: Type.NUMBER, description: "Technical score from 0 to 10." },
            aiFeedback: { type: Type.STRING, description: "Clear, detailed diagnostic feedback in markdown format." },
            strengthsIdentified: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strengths found in code formatting, execution, or logic."
            },
            gapsIdentified: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Areas/concepts requiring remediation."
            }
          },
          required: ["evaluationScore", "aiFeedback", "strengthsIdentified", "gapsIdentified"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty evaluation response from AI.");
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error reviewing code submission:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate code submission." });
  }
});

// 6. API: Generate Interactive Career Learning Roadmap ("Construire ma carrière")
app.post("/api/gemini/generate-roadmap", async (req, res) => {
  try {
    const { currentSkills, targetJob } = req.body;
    if (!targetJob) {
      return res.status(400).json({ error: "Missing targetJob parameter." });
    }

    const ai = getGemini();
    const prompt = `Formulate a detailed, highly action-oriented career roadmap to assist a student in transitioning into the position: "${targetJob}".
Their current parsed skills: ${Array.isArray(currentSkills) ? currentSkills.join(", ") : "None/Junior level"}.

Please output an arranged list of 4 structured phases/steps to reach this goal.
Each step should have:
- title: clear stage name (e.g. Master React and State Management, Deploy to GCP and set up CI/CD)
- description: what specifically the student must learn or build to complete this step
- skillsAcquired: specific tools/frameworks learned in this stage
- estimatedDuration: time period (e.g. '3 semaines', '1 mois')

Also provide an overarching estimated timeline (estimatedTimeline) and strategic career advices (aiAdvice) formatted in clean markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite Career Coach and Developer Advocate who builds technical training paths for modern industry demands.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetJob: { type: Type.STRING, description: "The confirmed target occupation." },
            estimatedTimeline: { type: Type.STRING, description: "Total duration of the roadmap." },
            aiAdvice: { type: Type.STRING, description: "Strategic career advice and industry tips in markdown." },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Step title." },
                  description: { type: Type.STRING, description: "In-depth training details and hands-on milestones." },
                  skillsAcquired: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Explicit list of skills gained."
                  },
                  estimatedDuration: { type: Type.STRING, description: "Duration of this specific phase." }
                },
                required: ["title", "description", "skillsAcquired", "estimatedDuration"]
              }
            }
          },
          required: ["targetJob", "estimatedTimeline", "aiAdvice", "steps"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty career path response.");
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error designing learning career path:", error);
    res.status(500).json({ error: error.message || "Failed to generate learning roadmap." });
  }
});

// 7. API: Analyze and Grade Student Submitted Project or Certificate
app.post("/api/gemini/analyze-asset", async (req, res) => {
  try {
    const { type, title, description, linkOrUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and Description are required parameters." });
    }

    const ai = getGemini();
    const prompt = `Formulate a rigorous technical evaluation of the following student contribution:
Contribution Type: ${type || "project"}
Title: ${title}
Details/Description: ${description}
${linkOrUrl ? `Supporting reference link: ${linkOrUrl}` : ""}

Evaluate this contribution and output how it strengthens the student's technical index.
Score each category on a scale from 1 to 10 (be fair, realistic, and highly professional):
- programming: Programming & Algorithms (Programmation & Algorithmes)
- systems: Architecture & Systems (Architecture & Systèmes)
- ux: Creativity & UX Design (Créativité & Design UX)
- leadership: Leadership & Initiative (Leadership & Initiative)
- data_ai: Data & AI Models (Data & Modèles d'IA)

Provide:
- verifiedTitle: Standardized or polished title
- skillsAwarded: up to 3 hard skills acquired / demonstrated
- hiddenTalents: up to 2 "hidden talents" or soft qualities (e.g., 'Capacité d'exploration technique en profondeur') suitable for highlighting to recruiters/engineering leads
- aiFeedback: a concise 2-sentence encouraging expert code review or appraisal feedback`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a Senior Principal Architect and elite technological advisor identifying potential in young developer contributions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verifiedTitle: { type: Type.STRING, description: "Polished reference title." },
            programming: { type: Type.NUMBER, description: "Score boost for programming (1-10)." },
            systems: { type: Type.NUMBER, description: "Score boost for system architecture (1-10)." },
            ux: { type: Type.NUMBER, description: "Score boost for UX and custom design (1-10)." },
            leadership: { type: Type.NUMBER, description: "Score boost for initiative / stewardship (1-10)." },
            data_ai: { type: Type.NUMBER, description: "Score boost for deep mathematical AI analytics (1-10)." },
            skillsAwarded: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Parsed tech skills learned or exhibited."
            },
            hiddenTalents: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Discovered qualities, soft skills, or unexpected capacities."
            },
            aiFeedback: { type: Type.STRING, description: "Short professional expert assessment feedback." }
          },
          required: ["verifiedTitle", "programming", "systems", "ux", "leadership", "data_ai", "skillsAwarded", "hiddenTalents", "aiFeedback"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Received empty asset evaluation payload.");
    }
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Error analyzing student asset:", error);
    res.status(500).json({ error: error.message || "Failed to analyze submitted asset." });
  }
});

// 8. API: Personal AI Coach Chatbot
app.post("/api/gemini/coach-chat", async (req, res) => {
  try {
    const { messages, studentContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array." });
    }

    const ai = getGemini();
    
    const currentSkills = studentContext?.extractedSkills || [];
    const interests = studentContext?.careerInterests || "Software Engineering";
    const strengths = studentContext?.strengths || [];
    const gaps = studentContext?.gaps || [];

    const systemInstruction = `You are "Coach IA TalentSphere", an elite Google Cloud and Generative AI technical career coach. 
Your role is to guide the student towards excellence. Be encouraging, precise, and practical. 
Avoid generic answers. Suggest concrete architectures, tech stacks, or code patterns where relevant to help them learn.
The student profile details:
- Name: ${studentContext?.name || "Student"}
- Career Interests: ${interests}
- Current Stated Skills: ${currentSkills.join(", ")}
- Strengths: ${strengths.join(" ; ")}
- Critical Areas to Improve: ${gaps.join(" ; ")}

Provide a direct, natural text reply. Keep your response highly structured (using Markdown list items and short paragraphs if needed) and professional yet warm. Keep it moderately concise (under 250 words) to fit the chat design beautifully.`;

    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
      }
    });

    const reply = response.text || "Je suis là pour vous aider dans votre parcours d'upskilling ! Dites-moi quel sujet vous aimeriez aborder.";
    res.json({ reply });

  } catch (error: any) {
    console.error("Error in Coach Chat:", error);
    res.status(500).json({ error: error.message || "Failed to contact your Personal AI Coach." });
  }
});


// Serve frontend with Vite dev middleware in development, and static in production
async function runServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TalentSphere AI Server] running on http://localhost:${PORT}`);
  });
}

runServer();
