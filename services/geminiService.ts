import { UserProfile, WeeklyPlan } from '../types';

async function callApi(action: string, payload: any) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) {
    throw new Error('Request failed');
  }
  return res.json();
}

export const GeminiService = {
  async generateWeeklyPlan(profile: UserProfile): Promise<WeeklyPlan> {
    return callApi('generatePlan', { profile });
  },

  async chatWithCoach(history: { role: 'user' | 'model'; text: string }[], newMessage: string, profile: UserProfile): Promise<string> {
    const data = await callApi('chat', { history, newMessage, profile });
    return data.text;
  }
};
