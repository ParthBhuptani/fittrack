import { GoogleGenAI, Type } from "@google/genai";

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

// Runs `operation` using the primary key. If it fails for any reason
// (quota exceeded, rate limited, key disabled, etc.), automatically
// retries the exact same operation using the backup key, if one is configured.
async function withFallback<T>(operation: (ai: any) => Promise<T>): Promise<T> {
  try {
    return await operation(getPrimaryAi());
  } catch (primaryError) {
    console.error('Primary Gemini key failed:', primaryError);
    const backup = getBackupAi();
    if (!backup) {
      throw primaryError; // no backup key configured, surface the original error
    }
    console.log('Retrying with backup Gemini key...');
    return await operation(backup);
  }
}

const modelName = 'gemini-3.5-flash';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = req.body;

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

      const parsed = await withFallback(async (ai) => {
        const response = await ai.models.generateContent({
        model: modelName,
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

      const text = await withFallback(async (ai) => {
        const chat = ai.chats.create({
          model: modelName,
          config: {
            systemInstruction: `You are a supportive, expert fitness coach named FitTrack AI. 
            You have access to the user's profile: ${JSON.stringify(profile)}.
            Answer their questions about their specific workout plan, diet, or general health.
            Keep answers concise and encouraging. Use markdown for formatting.`
          }
        });

        const response = await chat.sendMessage({
          message: `User asked: "${newMessage}". \n\n Context(Previous conversation): ${JSON.stringify(history.slice(-5))}`
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
