import { UserProfile, WeeklyPlan } from '../types';
import { supabase } from './supabaseClient';

// Sends a request to our own serverless function. The user's login token goes along in the
// Authorization header so the server can check who is asking. Every error thrown from here
// carries a message that is safe to show to the user as-is.
async function callApi(action: string, payload: any) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let res: Response;
  try {
    res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = await res.json();
      if (body?.error && res.status < 500) message = body.error;
    } catch {
      // response had no JSON body — keep the generic message
    }
    throw new Error(message);
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