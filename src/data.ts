import { JobOffer } from "./types";

export const PRESET_RESUMES = [
  {
    name: "Jean-Pascal Laurent",
    title: "Ingénieur Cloud & DevOps",
    email: "jean.pascal@example.com",
    text: `EXPÉRIENCE PROFESSIONNELLE
- Senior Cloud Engineer | Octo Technology (2023 - Présent)
  * Migration d'applications critiques de conteneurs de VM locales vers Google Kubernetes Engine (GKE).
  * Automatisation complète de l'infrastructure via Terraform et Cloud Build. Réduction de 45% des temps de déploiement.
  * Mise en œuvre de politiques de sécurité renforcées avec GCP IAM et Secret Manager.
- Admin Sys & DevOps | Capgemini (2020 - 2023)
  * Gestion de serveurs Debian/RedHat et automatisation Ansible.
  * Configuration de pipelines de CI/CD GitLab CI.

COMPÉTENCES TECHNIQUES
Cloud: Google Cloud Platform (GKE, Cloud Run, Cloud Functions, Pub/Sub), AWS
DevOps / IAC: Terraform, Docker, Kubernetes, Ansible, GitLab CI, GitHub Actions
Langages: Bash, Python, Go, SQL

LANGUES & CERTIFICATIONS
Certifications: Google Cloud Professional Cloud Architect, Associate Cloud Engineer
Français (Natif), Anglais (Courant)`
  },
  {
    name: "Amina Al-Mansour",
    title: "Lead Front-End Developer",
    email: "amina.mansour@example.com",
    text: `SUMMARY
Passionate Front-End Engineer with 6+ years of expertise crafting sophisticated, responsive web applications in React and TypeScript. Focus on state optimization, animation, and accessibility (WCAG).

PROFESSIONAL EXPERIENCE
- Lead Front-End Engineer | BlaBlaCar (2022 - Present)
  * Spearheaded the migration of legacy client panels to React 18 and Vite.
  * Implemented an internal design system leveraging Tailwind CSS and Headless UI, reducing front-end development cycle by 30%.
  * Optimized rendering performance, boosting Google Lighthouse Performance score from 68 to 96.
- Senior Software Engineer | Deezer (2019 - 2022)
  * Designed complex state flows with Redux Saga and engineered customized React context wrappers.
  * Mentored 4 junior developer apprentices.

CORE SKILLS
Frontend: React, Next.js, TypeScript, Tailwind CSS, Redux Toolkit, React-Query, HTML5/CSS3
Build/Tools: Vite, Webpack, Jest, Cypress, ESLint, Git, Docker, Node.js`
  }
];

export const PRESET_JOBS: JobOffer[] = [
  {
    id: "job-1",
    title: "Architecte de Solutions Cloud et IA d'élite",
    company: "Google Cloud Partner",
    location: "Paris / Télétravail Hybride",
    salary: "75k€ - 90k€",
    description: "Conception, structuration et mise en œuvre d'applications web modernes hautement scalables intégrant l'IA générative Google Cloud GenAI (Gemini) et des pipelines DevOps rigoureux.",
    requirements: ["Google Cloud Platform", "GKE", "Terraform", "Docker", "Python or Go", "DevOps et CI/CD"],
    createdAt: new Date().toISOString()
  },
  {
    id: "job-2",
    title: "Ingénieur Principal Front-End React & UI-UX",
    company: "TalentSphere Technology",
    location: "Rennes / Remote flexible",
    salary: "60k€ - 70k€",
    description: "Création d'interfaces web réactives, élégantes et ultra-rapides. Prise en charge de l'identité visuelle de notre plateforme d'évaluation technique interactive en SaaS.",
    requirements: ["React", "TypeScript", "Tailwind CSS", "Vite", "Responsive Design", "Optimization de bundle"],
    createdAt: new Date().toISOString()
  }
];
