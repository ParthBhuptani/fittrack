# FitTrack

FitTrack is a full-stack web app that generates personalized weekly workout and diet plans based on a user's body stats, goals, dietary needs, and physical limitations, then lets them track progress and chat with an AI coach for ongoing support.

## Features

- **Personalized 7-day plans** — Generates a full week of workouts and meals tailored to age, weight, goal (e.g. weight loss, muscle gain), activity level, diet type, allergies, injuries, and available equipment.
- **Exercise variations** — Every exercise includes an easier and harder variation, so the plan adapts as the user's fitness level changes.
- **Full recipes, not just meal names** — Each meal comes with an ingredient list and step-by-step cooking instructions.
- **AI fitness coach chat** — Users can ask follow-up questions about their specific plan and get contextual answers.
- **Progress tracking** — Logs workouts and weight over time, visualized with interactive charts.
- **Workout timers** — Built-in play/pause/reset timers for guided workout sessions.
- **Dark mode** — Full light/dark theme support.
- **Account system** — Sign up, log in, and edit your profile at any time to regenerate a plan that matches your current stats.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **AI:** Google Gemini API, called through a serverless backend function so API keys are never exposed to the browser
- **Reliability:** Automatic fallback between two Gemini API keys if the primary one hits a rate limit or quota

## Architecture Notes

All Gemini API calls are routed through a serverless function (`/api/gemini.ts`) rather than being called directly from the client. This keeps the API key server-side only and allows for automatic failover to a backup key if the primary request fails.

## Running Locally

**Prerequisites:** Node.js

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Create a `.env.local` file in the project root with your Gemini API key(s):
   \`\`\`
   GEMINI_API_KEY=your_key_here
   GEMINI_API_KEY_2=your_backup_key_here
   \`\`\`
3. Run the app:
   \`\`\`bash
   npm run dev
   \`\`\`

> Note: AI plan generation and the AI chat coach rely on the serverless function in `/api`, which only runs on a deployed environment (e.g. Vercel). Running locally lets you test the UI, but AI features require deployment.

## Deployment

This project is set up to deploy on [Vercel](https://vercel.com). Add `GEMINI_API_KEY` and `GEMINI_API_KEY_2` as environment variables in your Vercel project settings before deploying.
