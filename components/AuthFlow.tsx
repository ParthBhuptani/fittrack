import React, { useState, useEffect } from 'react';
import { User, UserProfile, Gender, Goal, ActivityLevel, DietType } from '../types';
import { StorageService } from '../services/storageService';
import { Button } from './Button';
import { Input } from './Input';
import { Activity, Lock, TrendingUp, User as UserIcon, Utensils } from 'lucide-react';
import { DIETARY_RESTRICTIONS } from '../utils';

const AuthFlow: React.FC<{ onComplete: (user: User) => void }> = ({ onComplete }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [error, setError] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Profile Form State
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    gender: Gender.Male,
    height: 170, // cm
    weight: 70, // kg
    units: 'metric',
    goal: Goal.WeightLoss,
    activityLevel: ActivityLevel.Sedentary,
    dietType: DietType.NonVeg,
    restrictions: [],
    dietaryPreferences: '',
    injuries: 'None',
    allergies: 'None',
    equipment: 'Gym',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = [
    "Analyzing your profile...",
    "Calculating your calorie needs...",
    "Designing your workout split...",
    "Picking safe exercises for your body...",
    "Building your weekly meal plan...",
    "Writing recipes and instructions...",
    "Double-checking your restrictions and allergies...",
    "Putting the final touches on your plan...",
  ];

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      const user = await StorageService.login(email, password);
      if (user) {
        onComplete(user);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } else {
      setProfile(prev => ({ ...prev, name }));
      setStep('profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const newUser = await StorageService.register(email, password, profile);

    if (!newUser) {
      setError('That email may already be registered. Please try logging in instead.');
      setIsGenerating(false);
      setStep('auth');
      setAuthMode('login');
      return;
    }

    onComplete(newUser);
  };

  const toggleRestriction = (r: string) => {
    setProfile(prev => {
      const current = prev.restrictions || [];
      if (current.includes(r)) {
        return { ...prev, restrictions: current.filter(item => item !== r) };
      } else {
        return { ...prev, restrictions: [...current, r] };
      }
    });
  };

  // Auth Step
  if (step === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {authMode === 'login' ? 'Enter your details to access your plan.' : 'Start your fitness journey today.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'signup' && (
              <Input 
                label="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="John Doe"
                icon={<UserIcon size={18} />}
              />
            )}
            <Input 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              icon={<Lock size={18} />}
            />
            
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            <Button type="submit" className="w-full py-3 text-lg">
              {authMode === 'login' ? 'Sign In' : 'Continue'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-brand-600 font-bold hover:underline"
              >
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Profile Step
  return (
    <div className="min-h-screen py-12 px-4 bg-slate-50 dark:bg-slate-900 flex justify-center transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Build Your Profile</h2>
          <p className="text-slate-500 mt-1">Help our AI design the perfect plan for your body and goals.</p>
        </div>
        
        {isGenerating ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-brand-100 dark:bg-brand-900 rounded-full w-full h-full flex items-center justify-center">
                <Activity className="w-10 h-10 text-brand-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white transition-all duration-300">
              {loadingMessages[loadingMessageIndex]}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              This usually takes 30-60 seconds. Please don't close this tab.
            </p>
            <div className="mt-6 max-w-xs mx-auto h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-brand-500 animate-pulse rounded-full" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Age" type="number" value={profile.age} onChange={e => setProfile({...profile, age: Number(e.target.value)})} required />
              <Input 
                label="Gender" 
                as="select" 
                value={profile.gender} 
                onChange={e => setProfile({...profile, gender: e.target.value as Gender})} 
                options={Object.values(Gender).map(v => ({ label: v, value: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                   label="Height (cm)" 
                   type="number" 
                   value={profile.height} 
                   onChange={e => setProfile({...profile, height: Number(e.target.value)})} 
                   required 
                />
                <Input 
                   label="Weight (kg)" 
                   type="number" 
                   value={profile.weight} 
                   onChange={e => setProfile({...profile, weight: Number(e.target.value)})} 
                   required 
                />
              </div>
              <Input 
                label="Activity Level" 
                as="select" 
                value={profile.activityLevel} 
                onChange={e => setProfile({...profile, activityLevel: e.target.value as ActivityLevel})} 
                options={Object.values(ActivityLevel).map(v => ({ label: v, value: v }))}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" /> Goals & Equipment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Primary Goal" 
                  as="select" 
                  value={profile.goal} 
                  onChange={e => setProfile({...profile, goal: e.target.value as Goal})} 
                  options={Object.values(Goal).map(v => ({ label: v, value: v }))}
                />
                <Input 
                  label="Available Equipment" 
                  placeholder="e.g. Full Gym, Dumbbells only, None" 
                  value={profile.equipment} 
                  onChange={e => setProfile({...profile, equipment: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-500" /> Diet & Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Diet Type" 
                  as="select" 
                  value={profile.dietType} 
                  onChange={e => setProfile({...profile, dietType: e.target.value as DietType})} 
                  options={Object.values(DietType).map(v => ({ label: v, value: v }))}
                />
                 <Input 
                  label="Preferences / Dislikes" 
                  placeholder="e.g. No mushrooms, love spicy food" 
                  value={profile.dietaryPreferences} 
                  onChange={e => setProfile({...profile, dietaryPreferences: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_RESTRICTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRestriction(r)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        (profile.restrictions || []).includes(r)
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-brand-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Injuries/Limitations" 
                  placeholder="e.g. Bad knees, Lower back pain" 
                  value={profile.injuries} 
                  onChange={e => setProfile({...profile, injuries: e.target.value})} 
                />
                <Input 
                  label="Allergies (Specific)" 
                  placeholder="e.g. Peanuts, Strawberries" 
                  value={profile.allergies} 
                  onChange={e => setProfile({...profile, allergies: e.target.value})} 
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full text-lg py-4 shadow-xl shadow-brand-500/20">
                Generate My Personalized Plan
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// 3. Settings Component

export default AuthFlow;
