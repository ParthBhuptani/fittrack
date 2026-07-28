import { supabase } from './supabaseClient';
import { User, UserProfile, WeeklyPlan, ProgressLog } from '../types';

const THEME_KEY = 'fittrack_theme';

export const StorageService = {
  // --- AUTH METHODS ---

  // Creates a new account. Returns the created User on success, or null if it fails
  // (e.g. email already registered). Profile is optional at signup time — it can be
  // saved afterward with saveProfile().
  register: async (email: string, password: string, profile?: UserProfile): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      console.error('Registration failed:', error?.message);
      return null;
    }

    const newUser: User = {
      id: data.user.id,
      email: data.user.email || email,
      profile,
      createdAt: Date.now(),
    };

    // Create the matching profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUser.id,
      email: newUser.email,
      name: profile?.name || null,
      profile_data: profile || null,
    });

    if (profileError) {
      console.error('Failed to create profile row:', profileError.message);
    }

    return newUser;
  },

  login: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      console.error('Login failed:', error?.message);
      return null;
    }

    return StorageService.getCurrentUser();
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  // Fetches the currently logged-in user (from Supabase's active session) plus
  // their saved profile row, combined into one User object.
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      profile: profileRow?.profile_data || undefined,
      createdAt: profileRow?.created_at ? new Date(profileRow.created_at).getTime() : Date.now(),
    };
  },

  // Saves/updates a user's profile (used after onboarding, or when editing profile later)
  saveProfile: async (userId: string, profile: UserProfile): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ name: profile.name, profile_data: profile })
      .eq('id', userId);

    if (error) {
      console.error('Failed to save profile:', error.message);
      return false;
    }
    return true;
  },

  // --- DATA METHODS (User Scoped) ---

  savePlan: async (userId: string, plan: WeeklyPlan): Promise<void> => {
    const { error } = await supabase
      .from('plans')
      .upsert({ user_id: userId, plan_data: plan, updated_at: new Date().toISOString() });

    if (error) console.error('Failed to save plan:', error.message);
  },

  getPlan: async (userId: string): Promise<WeeklyPlan | null> => {
    const { data, error } = await supabase
      .from('plans')
      .select('plan_data')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.plan_data as WeeklyPlan;
  },

  saveLog: async (userId: string, log: ProgressLog): Promise<void> => {
    const { error } = await supabase.from('logs').upsert(
      {
        user_id: userId,
        date: log.date,
        weight: log.weight,
        calories_consumed: log.caloriesConsumed,
        workout_completed: log.workoutCompleted,
        water_intake: log.waterIntake,
        details: log.details || {},
      },
      { onConflict: 'user_id,date' }
    );

    if (error) console.error('Failed to save log:', error.message);
  },

  getLogs: async (userId: string): Promise<ProgressLog[]> => {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      date: row.date,
      weight: row.weight,
      caloriesConsumed: row.calories_consumed,
      workoutCompleted: row.workout_completed,
      waterIntake: row.water_intake,
      details: row.details || {},
    }));
  },

  // --- CHAT HISTORY ---

  saveChatHistory: async (
    userId: string,
    history: { role: 'user' | 'model'; text: string }[]
  ): Promise<void> => {
    const { error } = await supabase
      .from('chat_history')
      .upsert({ user_id: userId, messages: history, updated_at: new Date().toISOString() });

    if (error) console.error('Failed to save chat history:', error.message);
  },

  getChatHistory: async (userId: string): Promise<{ role: 'user' | 'model'; text: string }[]> => {
    const { data, error } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (error || !data) return [];
    return data.messages || [];
  },

  // --- SETTINGS (kept local — just a UI preference, no need for a database round-trip) ---

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },
};