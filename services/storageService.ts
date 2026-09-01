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

  // Starts the Google sign-in flow. This redirects the whole page to Google,
  // then back to the app — Supabase handles reading the session from the
  // returned URL automatically once the page reloads.
  signInWithGoogle: async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
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
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
    };
  },

  // Saves/updates a user's profile (used after onboarding, or when editing profile later).
  // Uses upsert rather than update: email/password users already have a profile row
  // (created at registration), but Google sign-in users won't have one yet the first
  // time they save their profile — upsert creates it if missing, updates it if not.
  saveProfile: async (userId: string, profile: UserProfile): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email: user?.email || null, name: profile.name, profile_data: profile });

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

  // --- SETTINGS ---

  // Theme for the logged-in user's account — follows them across devices/browsers
  getUserTheme: async (userId: string): Promise<'light' | 'dark'> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('theme')
      .eq('id', userId)
      .single();

    if (error || !data?.theme) return 'light';
    return data.theme as 'light' | 'dark';
  },

  setUserTheme: async (userId: string, theme: 'light' | 'dark'): Promise<void> => {
    const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId);
    if (error) console.error('Failed to save theme:', error.message);
  },

  // Local theme — only used before anyone is logged in (landing/auth screens),
  // just a sensible default with no account to attach it to yet.
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
