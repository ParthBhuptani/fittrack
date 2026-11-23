import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserProfile, WeeklyPlan, ProgressLog } from './types';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import LandingPage from './components/LandingPage';
import Loader from './components/ui/Loader';

// Lazy-loaded: these are only fetched once a user actually needs them,
// keeping the initial landing page load small and fast.
const AuthFlow = lazy(() => import('./components/AuthFlow'));
const Dashboard = lazy(() => import('./components/Dashboard'));

const SuspenseFallback = Loader;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  // True until we've checked whether there's an active session. Keeping this
  // separate from `view` avoids briefly flashing the landing page for a
  // returning, already-logged-in user before we know they're logged in.
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  // Set when a user is authenticated (e.g. via Google) but hasn't filled out
  // their fitness profile yet — AuthFlow uses this to skip straight to the
  // profile step instead of showing the login form again.
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Initialization
  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    StorageService.setTheme(savedTheme);

    // Check for active session
    const init = async () => {
      const currentUser = await StorageService.getCurrentUser();
      if (currentUser) {
        import('./components/Dashboard'); // kick off the download in parallel with loadUserData below
        await loadUserData(currentUser);
      }
      setIsCheckingSession(false);
    };
    init();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    StorageService.setTheme(newTheme); // applies the visual change + local fallback

    if (user) {
      await StorageService.setUserTheme(user.id, newTheme); // persist to their account
    }
  };

  const loadUserData = async (userData: User) => {
    setUser(userData);

    // Apply this account's saved theme
    const userTheme = await StorageService.getUserTheme(userData.id);
    setTheme(userTheme);
    StorageService.setTheme(userTheme);

    if (!userData.profile) {
      // Authenticated (e.g. via Google) but hasn't completed their fitness
      // profile yet — send them straight to the profile step, not the login form.
      setPendingUser(userData);
      setView('auth');
      return;
    }

    // Load Plan specific to this user
    const savedPlan = await StorageService.getPlan(userData.id);
    const savedLogs = await StorageService.getLogs(userData.id);
    
    setLogs(savedLogs);

    if (savedPlan) {
      setPlan(savedPlan);
      setView('dashboard');
    } else {
      // User exists but has no plan (edge case)
      setView('auth'); 
    }
  };

  // Called by the auth screens once the user is signed in. Returns an error message
  // when the plan could not be built, so the form can show it instead of getting stuck.
  const handleUserAuthComplete = async (userData: User): Promise<string | void> => {
    setPendingUser(null);

    const existingPlan = await StorageService.getPlan(userData.id);

    if (existingPlan) {
      await loadUserData(userData);
    } else if (userData.profile) {
      try {
        const generatedPlan = await GeminiService.generateWeeklyPlan(userData.profile);
        await StorageService.savePlan(userData.id, generatedPlan);
        await loadUserData(userData);
      } catch (error) {
        console.error("Failed to generate plan", error);
        return error instanceof Error ? error.message : "Something went wrong generating your plan. Please try again.";
      }
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
    setPlan(null);
    setLogs([]);
    setView('landing');
  };

  const handleLogProgress = async (log: ProgressLog) => {
    if (!user) return;
    await StorageService.saveLog(user.id, log);
    setLogs(await StorageService.getLogs(user.id));
  };

  const handleUpdatePlan = async (updatedPlan: WeeklyPlan) => {
    if (!user) return;
    setPlan(updatedPlan);
    await StorageService.savePlan(user.id, updatedPlan);
  };

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    if (!user) return;
    const updatedUser = { ...user, profile: updatedProfile };
    setUser(updatedUser);
    await StorageService.saveProfile(user.id, updatedProfile);
  };

  return (
    <div className={`min-h-screen ${theme} font-sans selection:bg-brand-500 selection:text-white`}>
      {isCheckingSession ? (
        <SuspenseFallback />
      ) : (
        <>
          {view === 'landing' && <LandingPage onAuth={(mode) => { setAuthMode(mode); setView('auth'); }} theme={theme} onToggleTheme={toggleTheme} />}

          {view === 'auth' && (
            <Suspense fallback={<SuspenseFallback />}>
              <AuthFlow onComplete={handleUserAuthComplete} existingUser={pendingUser || undefined} initialMode={authMode} onBack={() => setView('landing')} theme={theme} onToggleTheme={toggleTheme} />
            </Suspense>
          )}

          {view === 'dashboard' && user && plan && (
            <Suspense fallback={<SuspenseFallback />}>
              <Dashboard 
                user={user} 
                plan={plan} 
                logs={logs}
                onLogout={handleLogout}
                onLogProgress={handleLogProgress}
                onUpdatePlan={handleUpdatePlan}
                onUpdateUser={handleUpdateUser}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}