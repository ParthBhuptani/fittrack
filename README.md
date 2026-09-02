<p align="center">
  <img src="./public/favicon.png" width="110" alt="FitTrack logo" />
</p>

<h1 align="center">FitTrack</h1>

<p align="center"><i>AI-powered, personalized workout and diet planning.</i></p>

<p align="center">
  <a href="https://fittrack-planner.vercel.app"><img src="https://img.shields.io/badge/demo-live-10b981?style=flat-square" alt="Live Demo" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-3178c6?style=flat-square&logo=react" alt="React" /></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google" alt="Gemini AI" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/backend-Supabase-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/hosted%20on-Vercel-000000?style=flat-square&logo=vercel" alt="Vercel" /></a>
</p>

> FitTrack generates a complete, personalized 7-day workout and diet plan from a single user profile — age, weight, goal, activity level, dietary restrictions, injuries, and available equipment — then lets users track progress and ask an AI coach follow-up questions along the way.

**🔗 Live app:** [fittrack-planner.vercel.app](https://fittrack-planner.vercel.app)

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture & Security](#-architecture--security)
- [Performance](#-performance)
- [Running Locally](#-running-locally)
- [Deployment](#️-deployment)
- [Roadmap](#️-roadmap)
- [License](#-license)

---

## 🧠 About the Project

**FitTrack** is a full-stack web app that turns a single fitness profile into a complete, AI-generated weekly plan — no generic templates, no one-size-fits-all workouts. It's built to actually adapt to the person using it: their injuries, their allergies, their equipment, their goals.

Everything from the workout structure to the meal recipes is generated fresh per user, with a chat-based AI coach available for follow-up questions once the plan is live. Accounts, plans, and progress are backed by a real database with proper authentication — not just stored in the browser.

---

## 🌐 Live Demo

**🔗 [https://fittrack-planner.vercel.app](https://fittrack-planner.vercel.app)**

> 💡 Sign up (email or Google), fill out your profile, and watch a full 7-day plan get generated in real time — try the AI coach chat afterward too.

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🧬 | **Personalized 7-Day Plans** | Full week of workouts and meals tailored to age, weight, gender, goal, activity level, diet type, allergies, injuries, and available equipment |
| 🔄 | **Exercise Variations** | Every exercise includes an easier and harder variation, so the plan scales with fitness level |
| 🍳 | **Full Recipes** | Every meal includes a real ingredient list and step-by-step cooking instructions |
| 🩹 | **Injury-Aware** | Workouts are generated with the user's stated injuries/conditions factored in |
| 🤖 | **AI Coach Chat** | In-app chat with context on the user's specific profile and current plan |
| 📊 | **Progress Tracking** | Workout completion and weight logged over time, visualized with interactive charts |
| 💧 | **Water Tracking** | Daily water intake tracked against a set goal |
| ⏱️ | **Workout Timers** | Built-in play / pause / reset timers for guided sessions |
| 🌗 | **Per-Account Dark Mode** | Theme preference saved to each account, follows the user across devices |
| 👤 | **Real Accounts** | Secure sign up / log in via email/password or Google, backed by Supabase Auth |
| 👁️ | **Password Visibility Toggle** | Show/hide password fields on login and signup |
| 🔑 | **Google Sign-In** | One-click sign-in/sign-up via Google OAuth, with automatic profile-setup routing for first-time Google users |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Google Gemini API |
| Auth & Database | Supabase (Postgres + Authentication + Row Level Security), Google OAuth |
| Hosting | Vercel (frontend + serverless functions) |

---

## 📁 Project Structure

```
fittrack/
├── api/
│   └── gemini.ts               # Serverless function — holds the Gemini API keys server-side,
│                                # handles plan generation + AI chat requests, with automatic
│                                # fallback to a backup key on failure
│
├── components/
│   ├── Button.tsx
│   ├── Input.tsx                # Includes show/hide toggle for password fields
│   ├── LandingPage.tsx          # First-paint view — not lazy-loaded
│   ├── AuthFlow.tsx             # Login / signup / Google sign-in / profile setup (lazy-loaded)
│   ├── Dashboard.tsx            # Main app shell after login (lazy-loaded)
│   ├── SettingsView.tsx         # Profile editing, rendered inside Dashboard
│   └── AnalyticsView.tsx        # Progress charts, rendered inside Dashboard
│
├── services/
│   ├── geminiService.ts         # Frontend client — calls /api/gemini, never touches the real key
│   ├── supabaseClient.ts        # Supabase connection setup
│   └── storageService.ts        # All auth + database logic — accounts, profiles, plans,
│                                 # logs, chat history, per-account theme, Google sign-in
│
├── public/                      # Static assets: favicon, logo, OG image, robots.txt, sitemap.xml
│
├── App.tsx                      # Lean orchestrator — session check, routing, top-level state
├── utils.ts                     # Shared constants and helper functions
├── index.html                   # Page shell, favicon, title, meta/OG tags
├── index.tsx                    # React entry point
├── types.ts                     # Shared TypeScript types
└── vite.config.ts / tsconfig.json / package.json
```

---

## 🔒 Architecture & Security

**AI calls are never made directly from the browser.**

- A serverless function (`/api/gemini.ts`) holds the Gemini API keys server-side and handles both plan generation and chat requests.
- The frontend calls this internal endpoint rather than Google's API directly, so the keys are never exposed in the client bundle or visible via dev tools.
- **Automatic key fallback:** if a request fails on the primary key (rate limit, quota, temporary outage), it automatically retries on a backup key — transparent to the user.

**Authentication and data are handled by Supabase, not the browser.**

- Real authentication via Supabase Auth — email/password and Google OAuth — replaces browser-stored credentials.
- All user data (profiles, plans, progress logs, chat history) lives in Postgres, structured across dedicated tables, and follows the account across devices and browsers.
- **Row Level Security (RLS)** is enabled on every table, enforcing at the database level that a user can only ever read or write their own rows.
- **Google sign-in users** skip the normal signup form (since OAuth authenticates immediately), so the app detects a first-time Google user (authenticated, no profile yet) and routes them straight to the profile-setup step before generating their plan.

---

## ⚡ Performance

- The app is **code-split**: the initial bundle only includes the landing page. The login/signup flow and the full dashboard (including the charts library) are fetched on demand via `React.lazy` + `Suspense`, cutting the first-load bundle size roughly in half.
- A session-check guard prevents the landing page from briefly flashing for returning, already-logged-in users while their session is being verified.

---

## 🚀 Running Locally

**Prerequisites:** Node.js, a Supabase project, a Google OAuth client (for Google sign-in)

```bash
npm install
```

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_primary_key_here
GEMINI_API_KEY_2=your_backup_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

> AI plan generation and the AI chat coach depend on the serverless function in `/api`, which only runs in a deployed environment. Locally you can test the UI, auth, and database flows; AI responses require a deployed instance.

---

## ☁️ Deployment

Deployed on [Vercel](https://vercel.com), connected to this repository's `main` branch — every push triggers an automatic redeploy.

Required environment variables (Vercel project settings):
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

New features are developed on separate branches and tested on Vercel's auto-generated branch preview deployments before merging to `main`.

---

## 🗺️ Roadmap

**Security & Robustness**
- [ ] Password reset / "Forgot password" flow
- [ ] Rate limiting on `/api/gemini` to prevent quota abuse
- [ ] Re-enable email confirmation before wider public sharing

**Performance**
- [ ] Split `AnalyticsView` (charts) out of the Dashboard bundle so `recharts` only loads when the Progress tab is opened

**New Features**
- [ ] Submit login form on Enter key press
- [ ] Add real charts to the printed workout/diet report
- [ ] Photo-based meal logging — upload a food photo, Gemini estimates calories automatically
- [ ] Support longer plan durations (beyond the current fixed 7 days)

**UX Polish**
- [ ] General UI refinements
- [ ] Dedicated mobile responsiveness pass

**Nice-to-Haves**
- [ ] Custom domain
- [ ] Basic automated tests
- [ ] Error tracking (e.g. Sentry)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<p align="center"><sub>Built by Parth Bhuptani</sub></p>
