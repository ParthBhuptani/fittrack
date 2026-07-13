<div align="center">
  <img src="./public/logo-512.png" alt="FitTrack logo" width="96" height="96" />

  # FitTrack

  **AI-powered, personalized workout and diet planning.**

  [![Live Demo](https://img.shields.io/badge/demo-live-10b981?style=flat-square)](https://fittrack-planner.vercel.app)
  [![Built with React](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-3178c6?style=flat-square)](https://react.dev)
  [![Powered by Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square)](https://ai.google.dev)
  [![Deployed on Vercel](https://img.shields.io/badge/hosted%20on-Vercel-000000?style=flat-square)](https://vercel.com)

  [**Live App →**](https://fittrack-planner.vercel.app)
</div>

---

## Overview

FitTrack generates a complete, personalized 7-day workout and diet plan from a single user profile — age, weight, goal, activity level, dietary restrictions, injuries, and available equipment — then lets users track progress and ask an AI coach follow-up questions along the way.

## Features

**AI-Generated Plans**
- Full 7-day plan covering workouts and meals, tailored to the user's body stats, goals, and constraints
- Every exercise includes an easier and a harder variation, so the plan scales with fitness level
- Every meal includes a real ingredient list and step-by-step cooking instructions
- Injuries and allergies are factored directly into what gets generated

**AI Coach**
- In-app chat with context on the user's specific profile and current plan
- Answers follow-up questions about exercises, nutrition, and general fitness

**Progress Tracking**
- Workout completion and weight logged over time
- Visualized with interactive charts
- Daily water intake tracked against a goal

**Workout Experience**
- Built-in play / pause / reset timers for guided sessions
- Quick links to exercise demo videos and recipe videos

**Account & UX**
- Sign up / log in, with per-user saved plans, logs, and chat history
- Editable profile — regenerate a plan any time stats or goals change
- Full light/dark theme support, responsive on desktop and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Google Gemini API |
| Hosting | Vercel (frontend + serverless functions) |

## Architecture & Security

AI calls are never made directly from the browser:

- A serverless function (`/api/gemini.ts`) holds the Gemini API key server-side and handles both plan generation and chat requests.
- The frontend calls this internal endpoint rather than Google's API directly, so the key is never exposed in the client bundle or visible via dev tools.
- **Automatic key fallback:** the app is configured with a primary and backup Gemini API key. If a request fails on the primary key (rate limit, quota, etc.), it automatically retries on the backup — transparent to the user.

> **Known limitation:** accounts, plans, and progress logs currently live in browser `localStorage`, not a persistent database — data is local to a single browser/device. A migration to a real backend (Firebase or Supabase) with proper authentication is planned. See [Roadmap](#roadmap).

## Running Locally

**Prerequisites:** Node.js

```bash
npm install
```

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_primary_key_here
GEMINI_API_KEY_2=your_backup_key_here
```

```bash
npm run dev
```

> AI plan generation and the AI chat coach depend on the serverless function in `/api`, which only runs in a deployed environment. Locally you can test the UI and flows; AI responses require a deployed instance.

## Deployment

Deployed on [Vercel](https://vercel.com), connected to this repository's `main` branch — every push triggers an automatic redeploy.

Required environment variables (Vercel project settings):
- `GEMINI_API_KEY`
- `GEMINI_API_KEY_2`

## Roadmap

- [ ] Migrate from `localStorage` to a real database (Firebase or Supabase) for persistent, cross-device accounts
- [ ] Proper authentication (replacing current local credential storage)
- [ ] UI refinements
- [ ] Custom domain

---

<div align="center">
  <sub>Built by Parth Bhuptani</sub>
</div>
