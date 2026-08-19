import React, { useState, useEffect, Suspense, lazy } from 'react';
import { User, UserProfile, WeeklyPlan, ProgressLog } from './types';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import LandingPage from './components/LandingPage';
import { Activity } from 'lucide-react';

// Lazy-loaded: these are only fetched once a user actually needs them,
// keeping the initial landing page load small and fast.
const AuthFlow = lazy(() => import('./components/AuthFlow'));
const Dashboard = lazy(() => import('./components/Dashboard'));

const SuspenseFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping"></div>
      <div className="relative bg-brand-100 dark:bg-brand-900 rounded-full w-full h-full flex items-center justify-center">
        <Activity className="w-8 h-8 text-brand-600" />
      </div>
    </div>
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');

  // Initialization
  useEffect(() => {
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    StorageService.setTheme(savedTheme);

    // Check for active session
    const init = async () => {
      const currentUser = await StorageService.getCurrentUser();
      if (currentUser) {
        await loadUserData(currentUser);
      }
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

  const handleUserAuthComplete = async (userData: User) => {
    // If it's a new user (just registered), we might need to generate the plan
    // If it's a login, we just load.
    
    const existingPlan = await StorageService.getPlan(userData.id);
    
    if (existingPlan) {
      await loadUserData(userData);
    } else if (userData.profile) {
      // Generate new plan
      try {
        const generatedPlan = await GeminiService.generateWeeklyPlan(userData.profile);
        await StorageService.savePlan(userData.id, generatedPlan);
        await loadUserData(userData);
      } catch (error) {
        console.error("Failed to generate plan", error);
        alert("Something went wrong generating your plan. Please try again.");
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
      {view === 'landing' && <LandingPage onAuth={() => setView('auth')} />}
      
      {view === 'auth' && (
        <Suspense fallback={<SuspenseFallback />}>
          <AuthFlow onComplete={handleUserAuthComplete} />
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
    </div>
  );
}
