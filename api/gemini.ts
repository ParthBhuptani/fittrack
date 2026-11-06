import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

let primaryAi: any = null;
let backupAi: any = null;

function getPrimaryAi() {
  if (!primaryAi) {
    primaryAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return primaryAi;
}

function getBackupAi() {
  // Only set this up if a second key was actually provided
  if (!process.env.GEMINI_API_KEY_2) return null;
  if (!backupAi) {
    backupAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_2 });
  }
  return backupAi;
}

const PRIMARY_MODEL = 'gemini-3.5-flash';
// Optional second model, used only if the primary keeps failing (e.g. Google-side overload,
// which affects every API key equally). Set GEMINI_FALLBACK_MODEL in Vercel to turn it on.
// Use a model WITHOUT the "Paid" badge in AI Studio if your keys are on the free tier.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || '';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Errors that are usually temporary: overloaded (503), rate limited (429), internal (500)
const isTransient = (err: any) => {
  const status = err?.status ?? err?.code;
  return status === 503 || status === 429 || status === 500;
};

// Tries each model in turn. For each model: every API key, then (if the failure
// looked temporary) a short pause and one more round, before moving on to the next model.
async function withFallback<T>(operation: (ai: any, model: string) => Promise<T>): Promise<T> {
  const clients = [getPrimaryAi(), getBackupAi()].filter(Boolean);
  const models = FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL ? [PRIMARY_MODEL, FALLBACK_MODEL] : [PRIMARY_MODEL];
  let lastError: any;

  for (const model of models) {
    for (let round = 1; round <= 2; round++) {
      for (const ai of clients) {
        try {
          return await operation(ai, model);
        } catch (err) {
          lastError = err;
          console.error(`Gemini call failed (model=${model}, round=${round}):`, err);
        }
      }
      // A non-temporary error (bad request, retired model) won't fix itself — move on.
      if (!isTransient(lastError)) break;
      if (round === 1) await sleep(2000);
    }
    console.log(`Giving up on model ${model}, trying next...`);
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Access control: who may call this endpoint, and how often
// ---------------------------------------------------------------------------

// Per-user limits. Change the numbers here to loosen or tighten them.
const LIMITS: Record<string, { max: number; windowMs: number; message: string }> = {
  generatePlan: {
    max: 10,
    windowMs: 24 * 60 * 60 * 1000,
    message: "You've reached today's limit of 10 plan generations. Please try again tomorrow.",
  },
  chat: {
    max: 40,
    windowMs: 60 * 60 * 1000,
    message: "You've reached the limit of 40 coach messages per hour. Please try again a little later.",
  },
};

// Verifies the Supabase login token sent by the browser. Returns the real user plus a
// Supabase client that acts AS that user (so database row-level security still applies).
async function authenticate(req: any) {
  const header: string = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase environment variables are missing on the server');

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // getUser asks Supabase Auth to validate the token — it is not just decoded locally.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { user: data.user, supabase };
}

// Counts this user's recent calls; if under the limit, records this one. Returns false when over.
// If the database can't be reached this throws, so the endpoint fails closed (no free calls).
async function checkAndRecordUsage(supabase: any, userId: string, action: string): Promise<boolean> {
  const { max, windowMs } = LIMITS[action];
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', since);
  if (error) throw error;
  if ((count ?? 0) >= max) return false;

  const { error: insertError } = await supabase.from('api_usage').insert({ user_id: userId, action });
  if (insertError) throw insertError;
  return true;
}

// Returns an error message if the request body is not acceptable, otherwise null.
function validatePayload(action: string, payload: any): string | null {
  if (!payload || typeof payload !== 'object') return 'Invalid request.';
  const profile = payload.profile;
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return 'Invalid request.';
  if (JSON.stringify(profile).length > 5000) return 'Profile is too large.';
  if (profile.restrictions !== undefined && !Array.isArray(profile.restrictions)) return 'Invalid request.';

  if (action === 'chat') {
    if (typeof payload.newMessage !== 'string' || payload.newMessage.length === 0) return 'Invalid request.';
    if (payload.newMessage.length > 2000) return 'Message is too long (2000 characters max).';
    if (!Array.isArray(payload.history) || payload.history.length > 1000) return 'Invalid request.';
  }
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = req.body ?? {};

    if (action !== 'generatePlan' && action !== 'chat') {
      return res.status(400).json({ error: 'Unknown action' });
    }

    // 1) Who is calling? Anonymous callers are rejected before anything costs money.
    const auth = await authenticate(req);
    if (!auth) {
      return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    }

    // 2) Is the request well-formed and a sensible size?
    const invalid = validatePayload(action, payload);
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    // 3) Has this user used up their allowance?
    const allowed = await checkAndRecordUsage(auth.supabase, auth.user.id, action);
    if (!allowed) {
      return res.status(429).json({ error: LIMITS[action].message });
    }

    if (action === 'generatePlan') {
      const profile = payload.profile;
      const prompt = `
        Create a 7-day fitness and diet plan for a user with the following profile:
        - Age: ${profile.age}
        - Gender: ${profile.gender}
        - Height: ${profile.height}cm
        - Weight: ${profile.weight}kg
        - Goal: ${profile.goal}
        - Activity Level: ${profile.activityLevel}
        - Diet Type: ${profile.dietType}
        - Dietary Restrictions: ${profile.restrictions?.join(', ') || 'None'}
        - Specific Dietary Preferences/Dislikes: ${profile.dietaryPreferences}
        - Injuries/Conditions: ${profile.injuries}
        - Allergies: ${profile.allergies}
        - Available Equipment: ${profile.equipment}

        The output must be a strictly structured JSON object.
        The diet plan MUST STRICTLY follow the "${profile.dietType}" requirement and avoid any items in "Dietary Restrictions" or "Allergies".
        For every meal, provide a list of ingredients and step-by-step cooking instructions.
        The workout plan should be safe considering injuries.
        For each exercise, provide 2 variations: one that is "Easier" (regression) and one that is "Harder" (progression).
      `;

      const parsed = await withFallback(async (ai, model) => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                weeklySummary: { type: Type.STRING, description: "A motivational summary of the plan" },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayName: { type: Type.STRING },
                      focus: { type: Type.STRING, description: "Main focus, e.g., Upper Body, Cardio" },
                      workout: {
                        type: Type.OBJECT,
                        properties: {
                          durationMinutes: { type: Type.NUMBER },
                          exercises: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                name: { type: Type.STRING },
                                sets: { type: Type.STRING },
                                reps: { type: Type.STRING },
                                tips: { type: Type.STRING, description: "Form cue or safety tip" },
                                variations: {
                                  type: Type.ARRAY,
                                  items: {
                                    type: Type.OBJECT,
                                    properties: {
                                      name: { type: Type.STRING },
                                      difficulty: { type: Type.STRING, enum: ["Easier", "Harder"] }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      },
                      diet: {
                        type: Type.OBJECT,
                        properties: {
                          totalCalories: { type: Type.NUMBER },
                          meals: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                type: { type: Type.STRING, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
                                name: { type: Type.STRING },
                                calories: { type: Type.NUMBER },
                                recipeStub: { type: Type.STRING, description: "Brief description" },
                                ingredients: {
                                  type: Type.ARRAY,
                                  items: { type: Type.STRING },
                                  description: "List of ingredients with quantities"
                                },
                                instructions: {
                                  type: Type.ARRAY,
                                  items: { type: Type.STRING },
                                  description: "Step by step cooking instructions"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("Failed to generate plan");
        return JSON.parse(jsonText);
      });

      return res.status(200).json({ ...parsed, generatedAt: Date.now() });
    }

    if (action === 'chat') {
      const { history, newMessage, profile } = payload;
      const recentHistory = history.slice(-5).map((m: any) => ({
        role: m?.role === 'model' ? 'model' : 'user',
        text: String(m?.text ?? '').slice(0, 2000),
      }));

      const text = await withFallback(async (ai, model) => {
        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction: `You are a supportive, expert fitness coach named FitTrack AI. 
            You have access to the user's profile: ${JSON.stringify(profile)}.
            Answer their questions about their specific workout plan, diet, or general health.
            Keep answers concise and encouraging. Use markdown for formatting.`
          }
        });

        const response = await chat.sendMessage({
          message: `User asked: "${newMessage}". \n\n Context(Previous conversation): ${JSON.stringify(recentHistory)}`
        });

        return response.text || "I'm sorry, I couldn't process that.";
      });

      return res.status(200).json({ text });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}