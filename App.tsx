import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  UserProfile, 
  WeeklyPlan, 
  Gender, 
  Goal, 
  ActivityLevel, 
  DietType,
  ProgressLog 
} from './types';
import { StorageService } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { 
  Activity, 
  Utensils, 
  MessageSquare, 
  LogOut, 
  Moon, 
  Sun, 
  TrendingUp, 
  Download,
  PlayCircle,
  Search,
  CheckCircle2,
  Circle,
  Dumbbell,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Lock,
  Settings,
  RefreshCw,
  ChefHat,
  Video,
  Scale,
  X,
  Plus,
  Shuffle,
  AlertCircle,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Droplets,
  BarChart2,
  Calendar as CalendarIcon,
  ChevronLeft,
  Ruler,
  Clock,
  Hourglass,
  Printer,
  Flame,
  FileText,
  Ban
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

// --- CONSTANTS ---
const DIETARY_RESTRICTIONS = [
  "Gluten-Free", "Dairy-Free", "Nut-Free", "Soy-Free", 
  "Shellfish-Free", "Low-Sodium", "Sugar-Free", "Halal", "Kosher", "Low-Carb"
];

const DAILY_WATER_GOAL = 2500; // ml

// --- UTILS ---
const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const getPlanDayIndex = (date: Date) => {
  // Map Sunday (0) -> 6, Monday (1) -> 0
  let day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

// Unit Conversion Utils
const toDisplayWeight = (kg: number, units: 'metric' | 'imperial') => {
  return units === 'imperial' ? Math.round(kg * 2.20462) : kg;
};

const fromDisplayWeight = (val: number, units: 'metric' | 'imperial') => {
  return units === 'imperial' ? val / 2.20462 : val;
};

const getWeightLabel = (units: 'metric' | 'imperial') => units === 'imperial' ? 'lbs' : 'kg';

const toDisplayHeight = (cm: number, units: 'metric' | 'imperial') => {
  if (units === 'metric') return { text: `${cm} cm`, val: cm };
  const realFeet = (cm * 0.393700787) / 12;
  const feet = Math.floor(realFeet);
  const inches = Math.round((realFeet - feet) * 12);
  return { text: `${feet}' ${inches}"`, val: cm };
};


// --- SUB-COMPONENTS --- //

// 1. Landing Page
const LandingPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => (
  <div className="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
    <div className="absolute top-0 right-0 w-2/3 h-full bg-brand-50 dark:bg-brand-900/10 skew-x-12 translate-x-1/4 pointer-events-none" />
    
    <div className="flex-1 flex flex-col md:flex-row items-center justify-center container mx-auto px-6 relative z-10">
      <div className="md:w-1/2 space-y-8 animate-fade-in text-center md:text-left py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium text-sm">
          <Activity className="w-4 h-4" /> AI-Powered Fitness
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Your Health, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-500">Perfectly Planned.</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-lg mx-auto md:mx-0 leading-relaxed">
          FitTrack creates hyper-personalized workout and diet plans that adapt to your goals, injuries, and lifestyle using advanced AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
          <Button onClick={onAuth} className="text-lg px-8 py-4 shadow-xl shadow-brand-500/20">
            Get Started Free
          </Button>
        </div>
      </div>

      <div className="md:w-1/2 flex justify-center p-8 animate-fade-in delay-100">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
          <div className="absolute -top-6 -right-6 bg-brand-500 text-white p-4 rounded-2xl shadow-lg animate-bounce delay-700">
            <Utensils className="w-6 h-6" />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-teal-500 text-white p-4 rounded-2xl shadow-lg animate-bounce">
            <Dumbbell className="w-6 h-6" />
          </div>
          
          <div className="space-y-4">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-32 w-full bg-gradient-to-br from-brand-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-16 h-16 text-brand-500/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 2. Auth & Onboarding Wrapper
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
const SettingsView: React.FC<{ 
  user: User; 
  onUpdateProfile: (updatedProfile: UserProfile) => void; 
  onLogout: () => void;
}> = ({ user, onUpdateProfile, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile>(user.profile!);
  const [isSaving, setIsSaving] = useState(false);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const [customRestriction, setCustomRestriction] = useState('');

  // Local state for input handling (converted values)
  const [displayWeight, setDisplayWeight] = useState(toDisplayWeight(user.profile?.weight || 0, user.profile?.units || 'metric'));
  const [displayHeight, setDisplayHeight] = useState(user.profile?.height || 0); 
  
  // When unit changes, update the local display values
  useEffect(() => {
    setDisplayWeight(toDisplayWeight(profile.weight, profile.units));
  }, [profile.units, profile.weight]);

  useEffect(() => {
    if (!user.profile) return;
    const criticalFields: (keyof UserProfile)[] = ['goal', 'injuries', 'dietType', 'allergies', 'equipment', 'restrictions'];
    
    const r1 = (user.profile.restrictions || []).sort().join(',');
    const r2 = (profile.restrictions || []).sort().join(',');

    const hasChanged = criticalFields.some(field => {
      if (field === 'restrictions') return r1 !== r2;
      return user.profile![field] !== profile[field];
    });

    setNeedsRegeneration(hasChanged);
  }, [profile, user.profile]);

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

  const addCustomRestriction = () => {
    if (customRestriction && !profile.restrictions?.includes(customRestriction)) {
      setProfile(prev => ({
        ...prev,
        restrictions: [...(prev.restrictions || []), customRestriction]
      }));
      setCustomRestriction('');
    }
  };

  const handleSave = async (regenerate: boolean) => {
    setIsSaving(true);
    if (regenerate) {
      try {
        const newPlan = await GeminiService.generateWeeklyPlan(profile);
        await StorageService.savePlan(user.id, newPlan);
      } catch (e) {
        alert("Failed to regenerate plan");
      }
    }
    
    onUpdateProfile(profile);
    
    if (regenerate) {
       window.location.reload();
    }
    setIsSaving(false);
    alert("Profile saved!");
  };

  const handleWeightChange = (val: number) => {
    setDisplayWeight(val);
    // Convert back to KG for storage
    const kg = fromDisplayWeight(val, profile.units);
    setProfile({...profile, weight: parseFloat(kg.toFixed(2))});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold dark:text-white mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-500" /> Account Settings
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            <Input label="Email" value={user.email} disabled className="opacity-50 cursor-not-allowed" />
          </div>

           <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
              <h3 className="font-semibold text-sm uppercase text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Unit Preferences
              </h3>
              <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="units" 
                      checked={profile.units === 'metric'} 
                      onChange={() => setProfile({...profile, units: 'metric'})}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">Metric (kg / cm)</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="units" 
                      checked={profile.units === 'imperial'} 
                      onChange={() => setProfile({...profile, units: 'imperial'})}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">Imperial (lbs / ft)</span>
                 </label>
              </div>
           </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
             <h3 className="font-semibold text-lg dark:text-white mb-4">Fitness & Diet Preferences</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label={`Weight (${getWeightLabel(profile.units)})`}
                  type="number"
                  value={displayWeight}
                  onChange={e => handleWeightChange(Number(e.target.value))}
                />
                 {/* Height edit simplified for now, prompting user it is CM */}
                 <Input 
                  label="Height (cm)" 
                  type="number" 
                  value={profile.height} 
                  onChange={e => setProfile({...profile, height: Number(e.target.value)})} 
                  helperText={profile.units === 'imperial' ? `Currently: ${toDisplayHeight(profile.height, 'imperial').text}` : ''}
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Input 
                  label="Goal" 
                  as="select" 
                  value={profile.goal} 
                  onChange={e => setProfile({...profile, goal: e.target.value as Goal})} 
                  options={Object.values(Goal).map(v => ({ label: v, value: v }))}
                />
                <Input 
                  label="Diet Type" 
                  as="select" 
                  value={profile.dietType} 
                  onChange={e => setProfile({...profile, dietType: e.target.value as DietType})} 
                  options={Object.values(DietType).map(v => ({ label: v, value: v }))}
                />
             </div>
             
             {/* Enhanced Dietary Restrictions Section */}
             <div className="mt-6 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <ChefHat className="w-4 h-4" /> Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DIETARY_RESTRICTIONS.map(r => (
                    <button
                      key={r}
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
                  {/* Custom Restrictions Display */}
                  {profile.restrictions?.filter(r => !DIETARY_RESTRICTIONS.includes(r)).map(r => (
                    <button
                      key={r}
                      onClick={() => toggleRestriction(r)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-brand-600 border-brand-600 text-white flex items-center gap-1"
                    >
                      {r} <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    label="Add Custom Restriction"
                    placeholder="e.g. No Cilantro"
                    value={customRestriction}
                    onChange={(e) => setCustomRestriction(e.target.value)}
                    className="mb-0"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomRestriction()}
                  />
                  <Button onClick={addCustomRestriction} variant="secondary" className="mt-6 h-[42px]">
                    Add
                  </Button>
                </div>
              </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Input 
                  label="Injuries" 
                  value={profile.injuries} 
                  onChange={e => setProfile({...profile, injuries: e.target.value})} 
                />
                 <Input 
                  label="Equipment" 
                  value={profile.equipment} 
                  onChange={e => setProfile({...profile, equipment: e.target.value})} 
                />
             </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row gap-4">
             <Button 
                onClick={() => handleSave(false)} 
                isLoading={isSaving}
                className="flex-1"
             >
                Save Changes
             </Button>
             
             {needsRegeneration && (
               <Button 
                onClick={() => handleSave(true)}
                isLoading={isSaving}
                variant="outline"
                className="flex-1 border-brand-500 text-brand-600 hover:bg-brand-50"
               >
                 <RefreshCw className="w-4 h-4 mr-2" /> Save & Regenerate Plan
               </Button>
             )}
          </div>

          {/* Logout Button (Especially for Mobile) */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-8 mt-4">
             <Button 
              onClick={onLogout} 
              className="w-full bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 border-none font-bold"
            >
               <LogOut className="w-4 h-4 mr-2" /> Log Out
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Analytics Component
const AnalyticsView: React.FC<{ logs: ProgressLog[], profile: UserProfile, plan: WeeklyPlan }> = ({ logs, profile, plan }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const units = profile.units || 'metric';

  // Process logs for charts based on timeRange
  const chartData = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Map to display units & percentages
    const processedLogs = sortedLogs.map(log => {
      // Calculate Adherence
      const d = new Date(log.date);
      const dayIndex = getPlanDayIndex(d);
      const dayPlan = plan.days?.[dayIndex];
      const details = log.details || {};
      
      const totalExercises = dayPlan?.workout?.exercises?.length || 1;
      const completedExercises = dayPlan?.workout?.exercises?.filter((_, idx) => details[`exercise-${idx}`]).length || 0;
      
      const totalMeals = dayPlan?.diet?.meals?.length || 1;
      const completedMeals = dayPlan?.diet?.meals?.filter((_, idx) => details[`meal-${idx}`]).length || 0;

      return {
        ...log,
        displayWeight: toDisplayWeight(log.weight, units),
        workoutPct: Math.round((completedExercises / totalExercises) * 100),
        dietPct: Math.round((completedMeals / totalMeals) * 100)
      };
    });

    if (timeRange === 'daily') {
      return processedLogs.slice(-30).map(log => ({
        name: log.date.slice(5), // MM-DD
        weight: log.displayWeight,
        water: log.waterIntake || 0,
        workoutPct: log.workoutPct,
        dietPct: log.dietPct
      }));
    } else if (timeRange === 'weekly') {
      // Group by week
      const weeklyGroups: {[key: string]: {weightSum: number, waterSum: number, workoutPctSum: number, dietPctSum: number, count: number}} = {};
      processedLogs.forEach(log => {
        const d = new Date(log.date);
        const startOfWeek = new Date(d.setDate(d.getDate() - d.getDay()));
        const weekKey = startOfWeek.toISOString().split('T')[0];
        if (!weeklyGroups[weekKey]) weeklyGroups[weekKey] = { weightSum: 0, waterSum: 0, workoutPctSum: 0, dietPctSum: 0, count: 0 };
        weeklyGroups[weekKey].weightSum += log.displayWeight;
        weeklyGroups[weekKey].waterSum += (log.waterIntake || 0);
        weeklyGroups[weekKey].workoutPctSum += log.workoutPct;
        weeklyGroups[weekKey].dietPctSum += log.dietPct;
        weeklyGroups[weekKey].count++;
      });
      return Object.entries(weeklyGroups).map(([date, data]) => ({
        name: date.slice(5),
        weight: parseFloat((data.weightSum / data.count).toFixed(1)),
        water: Math.round(data.waterSum / data.count),
        workoutPct: Math.round(data.workoutPctSum / data.count),
        dietPct: Math.round(data.dietPctSum / data.count)
      }));
    } else {
      // Monthly
      const monthlyGroups: {[key: string]: {weightSum: number, waterSum: number, workoutPctSum: number, dietPctSum: number, count: number}} = {};
      processedLogs.forEach(log => {
        const monthKey = log.date.slice(0, 7); // YYYY-MM
        if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = { weightSum: 0, waterSum: 0, workoutPctSum: 0, dietPctSum: 0, count: 0 };
        monthlyGroups[monthKey].weightSum += log.displayWeight;
        monthlyGroups[monthKey].waterSum += (log.waterIntake || 0);
        monthlyGroups[monthKey].workoutPctSum += log.workoutPct;
        monthlyGroups[monthKey].dietPctSum += log.dietPct;
        monthlyGroups[monthKey].count++;
      });
      return Object.entries(monthlyGroups).map(([date, data]) => ({
        name: date,
        weight: parseFloat((data.weightSum / data.count).toFixed(1)),
        water: Math.round(data.waterSum / data.count),
        workoutPct: Math.round(data.workoutPctSum / data.count),
        dietPct: Math.round(data.dietPctSum / data.count)
      }));
    }
  }, [logs, timeRange, units, plan]);

  // Calculate stats based on 50% threshold for "completed workout"
  const totalWorkouts = logs.filter(log => {
      const d = new Date(log.date);
      const dayPlan = plan.days?.[getPlanDayIndex(d)];
      if (!dayPlan?.workout?.exercises) return false;
      const totalEx = dayPlan.workout.exercises.length || 1;
      const completedEx = dayPlan.workout.exercises.filter((_, idx) => log.details?.[`exercise-${idx}`]).length;
      return (completedEx / totalEx) >= 0.5;
  }).length;

  const avgWater = logs.reduce((acc, l) => acc + (l.waterIntake || 0), 0) / (logs.length || 1);
  
  const currentStreak = (() => {
    if (!logs.length) return 0;
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const uniqueDates = Array.from(new Set(logs.map(l => l.date)));
    const today = formatDate(new Date());
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = formatDate(yesterday);
    
    // Check if active (logged today or yesterday)
    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterdayStr)) return 0;

    let streak = 0;
    let checkDate = uniqueDates.includes(today) ? new Date() : yesterday;
    
    while (true) {
        if (uniqueDates.includes(formatDate(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  })();

  const CustomTooltip = ({ active, payload, label, unitStr }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
             <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                <p className="text-sm dark:text-white">
                  <span className="font-bold">{entry.value}</span> {entry.name.includes('%') ? '%' : unitStr}
                </p>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* Time Range Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1">
          {(['daily', 'weekly', 'monthly'] as const).map((r) => (
             <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  timeRange === r 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
             >
               {r}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Dumbbell size={80} />
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg text-brand-600">
               <Dumbbell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Workouts</h3>
          </div>
          <p className="text-3xl font-bold dark:text-white relative z-10">{totalWorkouts}</p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">Days with &gt;50% completion</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <Droplets size={80} />
          </div>
           <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600">
               <Droplets className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Water</h3>
          </div>
          <p className="text-3xl font-bold dark:text-white relative z-10">{Math.round(avgWater)} <span className="text-sm font-normal text-slate-400">ml</span></p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
             <Activity size={80} />
          </div>
           <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg text-orange-600">
               <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold dark:text-white relative z-10">{currentStreak} <span className="text-sm font-normal text-slate-400">days</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adherence Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-500" /> Consistency (0-100%)
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length > 0 ? chartData : [{name: 'Start', workoutPct: 0, dietPct: 0}]}>
                        <defs>
                            <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="workoutPct" name="Workout %" stroke="#10b981" strokeWidth={3} fill="url(#colorWorkout)" />
                        <Area type="monotone" dataKey="dietPct" name="Diet %" stroke="#f59e0b" strokeWidth={3} fill="url(#colorDiet)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Weight Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
             <Scale className="w-5 h-5 text-brand-500" /> Weight Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [{name: 'Start', weight: toDisplayWeight(profile.weight, units)}]}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip content={<CustomTooltip unitStr={getWeightLabel(units)} />} cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  name="Weight"
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hydration Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
             <Droplets className="w-5 h-5 text-blue-500" /> Hydration History
          </h3>
           <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{name: 'Today', water: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip unitStr="ml" />} cursor={{fill: 'rgba(59, 130, 246, 0.05)'}} />
                <Bar 
                  dataKey="water" 
                  name="Water" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={24}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Dashboard Component
const Dashboard: React.FC<{ 
  user: User; 
  plan: WeeklyPlan; 
  onLogout: () => void;
  logs: ProgressLog[];
  onLogProgress: (log: ProgressLog) => void;
  onUpdatePlan: (updatedPlan: WeeklyPlan) => void;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}> = ({ user, plan, onLogout, logs, onLogProgress, onUpdatePlan, onUpdateUser, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workout' | 'diet' | 'chat' | 'settings' | 'analytics'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  // Header Dropdown State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

  // Calendar Popover State
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const reportMenuRef = useRef<HTMLDivElement>(null);

  // Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeight, setLogWeight] = useState(toDisplayWeight(user.profile?.weight || 0, user.profile?.units || 'metric'));
  const [logWorkout, setLogWorkout] = useState(false);

  // Hydration State
  const [waterIntake, setWaterIntake] = useState(0);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [initialTimerTime, setInitialTimerTime] = useState(0);

  // Load chat history on mount
  useEffect(() => {
    const loadChat = async () => {
      const savedChat = await StorageService.getChatHistory(user.id);
      if (savedChat && savedChat.length > 0) {
        setChatHistory(savedChat);
      } else {
        setChatHistory([{ role: 'model', text: `Hi ${user.profile?.name}! I'm your AI coach. How can I help you today?` }]);
      }
    };
    loadChat();
  }, [user.id]);

  // Click outside listener for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
       if (reportMenuRef.current && !reportMenuRef.current.contains(event.target as Node)) {
        setShowReportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // --- COMPUTED DATE STATE ---
  const isToday = useMemo(() => formatDate(selectedDate) === formatDate(new Date()), [selectedDate]);
  
  // Mapping current date to one of the 7 plan days
  const planDayIndex = useMemo(() => getPlanDayIndex(selectedDate), [selectedDate]);
  
  // Get existing log for selected date to show checked state
  const selectedDateLog = useMemo(() => 
    logs.find(l => l.date === formatDate(selectedDate)), 
  [logs, selectedDate]);

  // Streak Calculation
  const streakCount = useMemo(() => {
    if (!logs.length) return 0;
    
    // Sort unique dates descending
    const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const today = formatDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let streak = 0;
    let checkDate = new Date(); // Start checking from today

    const hasToday = uniqueDates.includes(today);
    const hasYesterday = uniqueDates.includes(yesterdayStr);

    if (!hasToday && !hasYesterday) return 0;

    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
       const dateStr = formatDate(checkDate);
       if (uniqueDates.includes(dateStr)) {
         streak++;
         checkDate.setDate(checkDate.getDate() - 1);
       } else {
         break;
       }
    }
    return streak;
  }, [logs]);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'timer') {
            if (prev <= 0) {
              setIsTimerActive(false);
              return 0;
            }
            return prev - 1;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTimer = (amount: number) => {
    if (!isTimerActive) {
      setTimerSeconds(prev => Math.max(0, prev + amount));
      setInitialTimerTime(prev => Math.max(0, prev + amount));
    }
  };

  const handleTimerStart = (mode: 'stopwatch' | 'timer', seconds?: number) => {
    setTimerMode(mode);
    if (seconds !== undefined) {
      setTimerSeconds(seconds);
      setInitialTimerTime(seconds);
    } else if (mode === 'stopwatch') {
      // Keep existing seconds if switching back to stopwatch
    }
    setIsTimerActive(true);
  };

  // Initialize Log Data based on today or existing logs
  useEffect(() => {
     const dateStr = formatDate(selectedDate);
     const entry = logs.find(l => l.date === dateStr);
     
     if (entry) {
       setLogWeight(toDisplayWeight(entry.weight, user.profile?.units || 'metric'));
       setLogWorkout(entry.workoutCompleted);
       setWaterIntake(entry.waterIntake || 0);
     } else {
       const lastLog = logs[logs.length - 1];
       const weightToUse = lastLog ? lastLog.weight : (user.profile?.weight || 0);
       setLogWeight(toDisplayWeight(weightToUse, user.profile?.units || 'metric'));
       setLogWorkout(false);
       setWaterIntake(0);
     }
  }, [logs, user.profile, selectedDate]);

  const handleSaveLog = (partialLog: Partial<ProgressLog> = {}) => {
    if (!isToday) {
        alert("You can only log stats for today.");
        return;
    }

    const dateStr = formatDate(selectedDate);
    const existing = logs.find(l => l.date === dateStr) || { details: {} };

    const weightToSaveKg = fromDisplayWeight(logWeight, user.profile?.units || 'metric');

    onLogProgress({
      date: dateStr,
      weight: weightToSaveKg, 
      workoutCompleted: logWorkout,
      waterIntake: waterIntake,
      details: existing.details,
      ...partialLog
    });
    setShowLogModal(false);
  };

  const updateWater = (amount: number) => {
    if (!isToday) {
         alert("You can only log water for today.");
         return;
    }
    const newAmount = Math.max(0, waterIntake + amount);
    setWaterIntake(newAmount);
    handleSaveLog({ waterIntake: newAmount });
  };

  const getSearchLink = (query: string, type: 'video' | 'recipe') => {
    const q = encodeURIComponent(query + (type === 'video' ? ' exercise form' : ' recipe'));
    return type === 'video' 
      ? `https://www.youtube.com/results?search_query=${q}`
      : `https://www.google.com/search?q=${q}`;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    const newHistory: { role: 'user' | 'model', text: string }[] = [...chatHistory, { role: 'user', text: userMsg }];
    setChatHistory(newHistory);
    await StorageService.saveChatHistory(user.id, newHistory);
    setIsChatting(true);

    try {
      const response = await GeminiService.chatWithCoach(newHistory, userMsg, user.profile!);
      const updatedHistory: { role: 'user' | 'model', text: string }[] = [...newHistory, { role: 'model', text: response }];
      setChatHistory(updatedHistory);
      await StorageService.saveChatHistory(user.id, updatedHistory);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I had trouble connecting. Try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const generatePDFReport = (range: 'daily' | 'weekly' | 'monthly') => {
    setShowReportMenu(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to view the report.");
      return;
    }

    const today = new Date();
    let filteredLogs = [...logs].reverse();
    let titleRange = "";

    if (range === 'daily') {
        const todayStr = formatDate(today);
        filteredLogs = filteredLogs.filter(l => l.date === todayStr);
        titleRange = "Daily Report";
    } else if (range === 'weekly') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
        titleRange = "Weekly Report (Last 7 Days)";
    } else {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
        titleRange = "Monthly Report (Last 30 Days)";
    }

    const logsHtml = filteredLogs.length > 0 ? filteredLogs.map(l => {
         const dayPlan = plan.days?.[getPlanDayIndex(new Date(l.date))];
         
         let workoutPct = 0;
         if (dayPlan?.workout?.exercises) {
             const totalEx = dayPlan.workout.exercises.length || 1;
             const completedEx = dayPlan.workout.exercises.filter((_, idx) => l.details?.[`exercise-${idx}`]).length;
             workoutPct = Math.round((completedEx/totalEx)*100);
         }

         return `
          <tr class="border-b">
            <td class="py-2">${l.date}</td>
            <td class="py-2">${toDisplayWeight(l.weight, user.profile?.units || 'metric')} ${getWeightLabel(user.profile?.units || 'metric')}</td>
            <td class="py-2">${workoutPct}% Completed</td>
            <td class="py-2">${l.waterIntake || 0} ml</td>
          </tr>
        `;
    }).join('') : `<tr><td colspan="4" class="text-center py-4">No data recorded for this period.</td></tr>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FitTrack Report - ${user.profile?.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="p-10 font-sans text-slate-800">
          <div class="flex justify-between items-center mb-10 border-b pb-6">
            <div>
              <h1 class="text-4xl font-bold text-brand-600">FitTrack</h1>
              <p class="text-slate-500 mt-1">Personal Fitness Report</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold">${user.profile?.name}</h2>
              <p class="text-sm text-slate-500">Generated on ${today.toLocaleDateString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-10">
            <div class="bg-slate-50 p-6 rounded-xl">
              <h3 class="font-bold text-lg mb-4 text-brand-700">User Profile</h3>
              <ul class="space-y-2 text-sm">
                <li><strong>Age:</strong> ${user.profile?.age}</li>
                <li><strong>Height:</strong> ${toDisplayHeight(user.profile?.height || 170, user.profile?.units || 'metric').text}</li>
                <li><strong>Current Weight:</strong> ${toDisplayWeight(user.profile?.weight || 70, user.profile?.units || 'metric')} ${getWeightLabel(user.profile?.units || 'metric')}</li>
                <li><strong>Goal:</strong> ${user.profile?.goal}</li>
                <li><strong>Diet Type:</strong> ${user.profile?.dietType}</li>
              </ul>
            </div>
            <div class="bg-slate-50 p-6 rounded-xl">
              <h3 class="font-bold text-lg mb-4 text-brand-700">Plan Summary</h3>
              <p class="text-sm italic mb-2">"${plan.weeklySummary}"</p>
              <ul class="space-y-2 text-sm mt-4">
                 <li><strong>Equipment:</strong> ${user.profile?.equipment}</li>
                 <li><strong>Injuries:</strong> ${user.profile?.injuries}</li>
              </ul>
            </div>
          </div>

          <h3 class="text-2xl font-bold mb-4">${titleRange}</h3>
          <table class="w-full text-left mb-10 text-sm">
            <thead>
              <tr class="border-b-2 border-slate-200 text-slate-500">
                <th class="py-2">Date</th>
                <th class="py-2">Weight</th>
                <th class="py-2">Workout Adherence</th>
                <th class="py-2">Hydration</th>
              </tr>
            </thead>
            <tbody>
              ${logsHtml}
            </tbody>
          </table>
          
          <div class="text-center text-sm text-slate-400 mt-20">
            Generated by FitTrack - Your AI Fitness Companion
          </div>

          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const toggleItemCompletion = (type: 'exercise' | 'meal', index: number) => {
    if (!isToday) {
        alert("You cannot modify past or future records.");
        return;
    }

    const itemId = `${type}-${index}`;
    const dateStr = formatDate(selectedDate);
    const existingLog = logs.find(l => l.date === dateStr);
    const details = existingLog?.details || {};
    const newStatus = !details[itemId];
    
    // We save current state values, ensuring weight is consistent
    handleSaveLog({ details: { ...details, [itemId]: newStatus } });
  };

  const dailyProgress = (() => {
    // Calculate progress for SELECTED date based on Logs
    const dayPlan = plan.days?.[planDayIndex];
    if (!dayPlan) return 0;
    
    const totalTasks = (dayPlan.workout?.exercises?.length || 0) + (dayPlan.diet?.meals?.length || 0);
    
    const details = selectedDateLog?.details || {};
    const completedTasks = Object.values(details).filter(v => v).length;
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  })();

  const handleProfileClick = () => {
    if (window.innerWidth < 768) {
       setActiveTab('settings');
    } else {
       setShowUserMenu(!showUserMenu);
    }
  };

  const CalendarPopover = () => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    // Generate days for the grid
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayIndex = firstDay.getDay(); 

    const days = [];
    for (let i = 0; i < startingDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div ref={calendarRef} className="absolute top-14 left-0 z-50 animate-fade-in w-72 sm:w-80">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-slate-700">
           <div className="flex justify-between items-center mb-4">
              <span className="font-bold dark:text-white">
                {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
           </div>

           <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
           </div>

           <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                
                const dateStr = formatDate(d);
                const hasLog = logs.some(l => l.date === dateStr);
                const isSelected = formatDate(d) === formatDate(selectedDate);
                const isTodayDate = formatDate(d) === formatDate(new Date());

                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(d); setShowCalendar(false); }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-xs
                      ${isSelected ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                      ${isTodayDate && !isSelected ? 'border border-brand-500' : ''}
                    `}
                  >
                    {d.getDate()}
                    {hasLog && (
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-brand-500'}`}></div>
                    )}
                  </button>
                );
              })}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Log Progress Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-brand-500" /> Log Today's Stats
                </h3>
                <button 
                  onClick={() => setShowLogModal(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                   <X className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </button>
             </div>
             
             <div className="space-y-4">
                <Input 
                  label={`Current Weight (${getWeightLabel(user.profile?.units || 'metric')})`} 
                  type="number" 
                  value={logWeight} 
                  onChange={(e) => setLogWeight(Number(e.target.value))}
                  icon={<Scale size={18} />}
                />
                
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer" onClick={() => setLogWorkout(!logWorkout)}>
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${logWorkout ? 'bg-brand-500 border-brand-500' : 'border-slate-300 dark:border-slate-500'}`}>
                      {logWorkout && <CheckCircle2 className="w-4 h-4 text-white" />}
                   </div>
                   <span className="font-medium text-slate-700 dark:text-slate-300">Workout Completed?</span>
                </div>

                <Button onClick={() => handleSaveLog()} className="w-full mt-4">
                  Save Progress
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center z-10 shadow-sm relative">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold dark:text-white hidden md:block tracking-tight">FitTrack</h1>
        </div>
        <div className="flex items-center gap-3">
          
          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 mr-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-100 dark:border-orange-800/30">
            <Flame className={`w-4 h-4 text-orange-500 ${streakCount > 0 ? 'animate-pulse' : ''} fill-current`} />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streakCount}</span>
          </div>

          <div className="relative" ref={reportMenuRef}>
             <Button variant="outline" onClick={() => setShowReportMenu(!showReportMenu)} className="hidden sm:flex text-sm py-2 h-9">
               <Printer className="w-4 h-4 mr-2" /> Report
             </Button>
             {showReportMenu && (
                 <div className="absolute top-10 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-fade-in">
                    <button onClick={() => generatePDFReport('daily')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Daily Report</button>
                    <button onClick={() => generatePDFReport('weekly')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Weekly Report</button>
                    <button onClick={() => generatePDFReport('monthly')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Monthly Report</button>
                 </div>
             )}
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          
           <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Toggle Dark Mode"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={handleProfileClick}
              className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-slate-700 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-sm border-2 border-transparent hover:border-brand-200 dark:hover:border-slate-500 transition-all">
                {user.profile?.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                 <span className="block text-sm font-medium dark:text-slate-300 leading-none">{user.profile?.name}</span>
                 <span className="text-[10px] text-slate-400">View Profile</span>
              </div>
            </button>

            {/* Dropdown Menu (Desktop) */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 animate-fade-in z-50 hidden md:block">
                 <button 
                   onClick={() => { setActiveTab('settings'); setShowUserMenu(false); }}
                   className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                 >
                    <Settings className="w-4 h-4" /> Settings
                 </button>
                 <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                 <button 
                   onClick={onLogout}
                   className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                 >
                    <LogOut className="w-4 h-4" /> Log Out
                 </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
        <nav className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-row md:flex-col fixed md:relative bottom-0 z-20 md:z-0 h-16 md:h-full justify-around md:justify-start md:pt-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          {[
            { id: 'overview', icon: TrendingUp, label: 'Overview' },
            { id: 'analytics', icon: BarChart2, label: 'Progress' },
            { id: 'workout', icon: Dumbbell, label: 'Workouts' },
            { id: 'diet', icon: Utensils, label: 'Diet Plan' },
            { id: 'chat', icon: MessageSquare, label: 'AI Coach' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col md:flex-row items-center md:px-6 py-2 md:py-3 w-full transition-all duration-200 group
                ${activeTab === item.id 
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/10 border-t-2 md:border-t-0 md:border-r-4 border-brand-600 dark:border-brand-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-t-2 md:border-t-0 md:border-r-4 border-transparent'}`}
            >
              <item.icon className={`w-6 h-6 md:mr-3 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} />
              <span className="text-[10px] md:text-sm font-semibold mt-1 md:mt-0">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 md:p-8 pb-24 md:pb-8 relative">
          
          {/* Day Selector (Common for Workout/Diet/Overview) */}
          {(activeTab === 'workout' || activeTab === 'diet' || activeTab === 'overview') && (
            <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative">
                   <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                      <ChevronLeft className="w-5 h-5" />
                   </button>
                   
                   <div className="flex flex-col items-center cursor-pointer px-2" onClick={() => setShowCalendar(!showCalendar)}>
                      <div className="flex items-center gap-2">
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{getDayName(selectedDate)}</p>
                         <CalendarIcon className="w-3 h-3 text-brand-500" />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{formatDate(selectedDate)}</p>
                   </div>
                   
                   <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                      <ChevronRight className="w-5 h-5" />
                   </button>

                   {/* Calendar Dropdown */}
                   {showCalendar && <CalendarPopover />}
               </div>

               <div className="flex items-center gap-2">
                 <button 
                  onClick={() => { setSelectedDate(new Date()); }}
                  className="text-sm text-brand-600 font-medium hover:underline"
                 >
                   Jump to Today
                 </button>
               </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              {/* Hero Card */}
              <div className="bg-gradient-to-r from-brand-600 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                  <Activity size={140} />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">
                    {isToday ? "Let's crush today," : "Plan for"} {user.profile?.name.split(' ')[0]}!
                  </h2>
                  <p className="text-brand-100 text-lg mb-6 max-w-xl">
                    Focus for {getDayName(selectedDate)}: <span className="font-bold text-white">{plan.days?.[planDayIndex]?.focus || 'Rest'}</span>. 
                    {isToday ? "Stay consistent!" : "Prepare ahead."}
                  </p>
                  
                  <div className="flex flex-wrap items-end gap-6">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 relative">
                      {!isToday && <div className="absolute top-2 right-2 opacity-50"><Lock className="w-3 h-3"/></div>}
                      <p className="text-brand-100 text-sm mb-1">Daily Progress</p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">{dailyProgress}%</span>
                        <span className="text-sm mb-1 opacity-80">completed</span>
                      </div>
                      <div className="w-32 h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${dailyProgress}%` }}></div>
                      </div>
                    </div>
                    
                    <div 
                      className={`bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 transition-colors group relative ${isToday ? 'hover:bg-white/20 cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                      onClick={() => isToday && setShowLogModal(true)}
                    >
                      {!isToday && <div className="absolute top-2 right-2 opacity-50"><Lock className="w-3 h-3"/></div>}
                      <p className="text-brand-100 text-sm mb-1 flex items-center gap-1">
                        Current Weight <span className={`bg-white/20 p-0.5 rounded text-[10px] transition-colors px-1 ${isToday ? 'group-hover:bg-brand-500' : ''}`}>LOG</span>
                      </p>
                      <p className="text-3xl font-bold flex items-center gap-2">
                        {logWeight} {getWeightLabel(user.profile?.units || 'metric')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Quick Workout / Diet Links */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                     <Activity className="w-5 h-5 text-brand-500" /> Daily Snapshot
                  </h3>
                  {plan.days?.[planDayIndex] && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setActiveTab('workout')}>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <Dumbbell className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Workout Focus</p>
                            <p className="font-bold text-slate-900 dark:text-white text-lg">{plan.days[planDayIndex].focus || 'Rest'}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-brand-500" />
                      </div>

                       <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors" onClick={() => setActiveTab('diet')}>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-200 transition-colors">
                            <Utensils className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Nutrition Goal</p>
                            <p className="font-bold text-slate-900 dark:text-white text-lg">{plan.days[planDayIndex].diet?.totalCalories || 0} kcal</p>
                          </div>
                        </div>
                         <ChevronRight className="text-slate-300 group-hover:text-brand-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hydration Widget */}
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between relative overflow-hidden`}>
                   <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                      <Droplets size={120} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold dark:text-white flex items-center gap-2 mb-1">
                        <Droplets className="w-5 h-5 text-blue-500" /> Hydration
                      </h3>
                      <p className="text-slate-500 text-sm">Daily Goal: {DAILY_WATER_GOAL}ml</p>
                   </div>
                   
                   <div className="py-6 flex flex-col items-center">
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        {waterIntake} <span className="text-lg text-slate-400 font-medium">ml</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (waterIntake / DAILY_WATER_GOAL) * 100)}%` }}
                        />
                      </div>
                   </div>

                    <div className="flex gap-3 justify-center relative z-10">
                        <button onClick={() => updateWater(-250)} disabled={!isToday} className={`w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-colors ${!isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                          <span className="text-xl font-bold text-slate-500 dark:text-slate-400">-</span>
                        </button>
                        <button onClick={() => updateWater(250)} disabled={!isToday} className={`px-6 py-2 rounded-full bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 ${!isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}>
                          {isToday ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4"/>} 250ml
                        </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
             <AnalyticsView logs={logs} profile={user.profile!} plan={plan} />
          )}

          {/* WORKOUT TAB */}
          {activeTab === 'workout' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative pb-20">
              
              {/* Sticky Workout Timer Header */}
               <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 mb-6 transition-all duration-300">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      
                      {/* Mode Selector */}
                      <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex w-full md:w-auto">
                         <button 
                            onClick={() => { setIsTimerActive(false); setTimerMode('stopwatch'); setTimerSeconds(0); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${timerMode === 'stopwatch' ? 'bg-white dark:bg-slate-600 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                         >
                            STOPWATCH
                         </button>
                         <button 
                            onClick={() => { setIsTimerActive(false); setTimerMode('timer'); setTimerSeconds(60); setInitialTimerTime(60); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${timerMode === 'timer' ? 'bg-white dark:bg-slate-600 text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                         >
                            TIMER
                         </button>
                      </div>

                      {/* Time Display & Controls */}
                      <div className="flex items-center gap-6">
                          {/* Adjusters (Timer only, Paused only) */}
                          {timerMode === 'timer' && !isTimerActive && (
                             <button onClick={() => adjustTimer(-10)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold">-10</button>
                          )}

                          <div className={`text-5xl font-mono font-bold tracking-wider tabular-nums ${
                             isTimerActive 
                               ? (timerMode === 'timer' ? 'text-orange-500' : 'text-brand-600')
                               : 'text-slate-400'
                          }`}>
                             {formatTime(timerSeconds)}
                          </div>

                          {timerMode === 'timer' && !isTimerActive && (
                             <button onClick={() => adjustTimer(10)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold">+10</button>
                          )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                           <button 
                             onClick={() => {
                               if (timerSeconds === 0 && timerMode === 'timer') {
                                 handleTimerStart('timer', 60); 
                               } else {
                                 setIsTimerActive(!isTimerActive);
                               }
                             }}
                             className={`h-12 px-6 rounded-xl flex items-center gap-2 font-bold transition-all ${
                               isTimerActive 
                               ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' 
                               : 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30'
                             }`}
                           >
                              {isTimerActive ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5" />}
                              {isTimerActive ? 'PAUSE' : 'START'}
                           </button>
                           
                           <button 
                             onClick={() => { setIsTimerActive(false); setTimerSeconds(timerMode === 'timer' ? initialTimerTime : 0); }}
                             className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 transition-all"
                             title="Reset"
                           >
                              <RotateCcw className="w-5 h-5" />
                           </button>
                      </div>
                  </div>
                  
                  {/* Presets Row (Timer Mode Only) */}
                  {timerMode === 'timer' && (
                     <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide self-center mr-2">Quick Set:</span>
                         {[30, 45, 60, 90, 120, 300].map(s => (
                            <button 
                               key={s}
                               onClick={() => handleTimerStart('timer', s)} 
                               className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-600"
                            >
                               {s < 60 ? `${s}s` : `${s/60}m`}
                            </button>
                         ))}
                     </div>
                  )}
               </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                       {plan.days?.[planDayIndex]?.focus || 'Rest'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Tap exercises to mark as complete</p>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Activity className="w-4 h-4" /> {plan.days?.[planDayIndex]?.workout?.durationMinutes || 0} min
                  </span>
                </div>

                <div className="space-y-4">
                  {plan.days?.[planDayIndex]?.workout?.exercises?.map((exercise, idx) => {
                    const isCompleted = selectedDateLog?.details?.[`exercise-${idx}`] || false;

                    return (
                      <div 
                        key={idx} 
                        className={`relative overflow-hidden flex flex-col p-5 rounded-2xl gap-4 transition-all duration-300 border-2
                          ${isCompleted 
                            ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-900 opacity-75' 
                            : 'bg-white dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 shadow-sm hover:shadow-md'
                          } ${!isToday ? 'opacity-80' : ''}`}
                      >
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isToday ? 'cursor-pointer' : 'cursor-not-allowed'}`} onClick={() => toggleItemCompletion('exercise', idx)}>
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-brand-500' : 'text-slate-300'}`}>
                              {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-bold text-lg dark:text-white transition-all ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                                {exercise.name}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300 mt-2">
                                <span className="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-md font-medium">
                                  {exercise.sets} Sets
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-md font-medium">
                                  {exercise.reps} Reps
                                </span>
                              </div>
                              {!isCompleted && (
                                <p className="text-sm text-slate-500 italic mt-2 border-l-2 border-brand-200 pl-3">
                                  "{exercise.tips}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 mt-2 sm:mt-0">
                            {exercise.variations && exercise.variations.length > 0 && (
                              <button
                                  onClick={() => setExpandedExercise(expandedExercise === idx ? null : idx)}
                                  className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                                  title="See Variations"
                              >
                                  <Shuffle className="w-4 h-4" />
                              </button>
                            )}
                            <a 
                              href={getSearchLink(exercise.name, 'video')} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                              <PlayCircle className="w-4 h-4" /> <span className="hidden sm:inline">Watch Demo</span>
                            </a>
                          </div>
                        </div>

                        {/* Variations Panel */}
                        {expandedExercise === idx && exercise.variations && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 animate-fade-in pl-10">
                            <h5 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Alternative Exercises
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {exercise.variations.map((variation, vIdx) => (
                                <div key={vIdx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                        variation.difficulty === 'Easier' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {variation.difficulty}
                                      </span>
                                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{variation.name}</p>
                                    </div>
                                    <a 
                                      href={getSearchLink(variation.name, 'video')} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                      title="Watch Video"
                                    >
                                      <PlayCircle className="w-5 h-5" />
                                    </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* DIET TAB */}
          {activeTab === 'diet' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold dark:text-white">Daily Meal Plan</h2>
                    <p className="text-slate-500 text-sm mt-1">Tap meal to track • Expand for recipe</p>
                  </div>
                  <span className="text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-full">
                    {plan.days?.[planDayIndex]?.diet?.totalCalories || 0} kcal
                  </span>
                </div>

                <div className="grid gap-4">
                  {plan.days?.[planDayIndex]?.diet?.meals?.map((meal, idx) => {
                    const isCompleted = selectedDateLog?.details?.[`meal-${idx}`] || false;

                    return (
                      <div 
                        key={idx}
                        className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all
                          ${isCompleted
                            ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-900'
                            : 'bg-white dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500 shadow-sm'
                          } ${!isToday ? 'opacity-80' : ''}`}
                      >
                        {/* Meal Header */}
                        <div 
                          className={`flex flex-col md:flex-row md:items-center justify-between ${isToday ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          onClick={() => toggleItemCompletion('meal', idx)}
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-brand-500' : 'text-slate-300'}`}>
                              {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{meal.type}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-xs font-medium text-slate-500">{meal.calories} kcal</span>
                              </div>
                              <h4 className={`text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                                {meal.name}
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-2">
                                {meal.recipeStub}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setExpandedMeal(expandedMeal === idx ? null : idx)}
                              className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium text-sm bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                            >
                              <ChefHat className="w-4 h-4" /> 
                              {expandedMeal === idx ? 'Hide Recipe' : 'View Recipe'}
                              {expandedMeal === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Recipe Dropdown */}
                        {expandedMeal === idx && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-600 animate-fade-in pl-10">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Ingredients</h5>
                                  <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
                                    {meal.ingredients?.map((ing, i) => (
                                      <li key={i}>{ing}</li>
                                    )) || <li>Ingredients not available.</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Instructions</h5>
                                  <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-300 space-y-2">
                                    {meal.instructions?.map((inst, i) => (
                                      <li key={i}>{inst}</li>
                                    )) || <li>Instructions not available.</li>}
                                  </ol>

                                  <div className="mt-6">
                                    <a 
                                      href={getSearchLink(meal.name, 'video')} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                      <Video className="w-4 h-4" /> Watch Cooking Video
                                    </a>
                                  </div>
                                </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in relative">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                <h2 className="font-bold flex items-center gap-2 dark:text-white">
                  <div className="bg-brand-100 dark:bg-brand-900/50 p-2 rounded-lg text-brand-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                   AI Fitness Coach
                </h2>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 md:p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-100 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}>
                      <div className="markdown" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 dark:bg-slate-700 dark:border-slate-600 p-4 rounded-3xl rounded-bl-none flex gap-2 items-center shadow-sm">
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <div className="flex gap-3 items-center">
                  <input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    placeholder="Ask about exercises, food, or tips..." 
                    className="flex-1 px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                  />
                  <Button type="submit" disabled={isChatting || !chatInput.trim()} className="px-6 py-3 rounded-xl">
                    <span className="hidden sm:inline">Send</span>
                    <span className="sm:hidden"><MessageSquare className="w-4 h-4" /></span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <SettingsView user={user} onUpdateProfile={onUpdateUser} onLogout={onLogout} />
          )}

        </main>
      </div>
    </div>
  );
}

// 5. Main App Container
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
      
      {view === 'auth' && <AuthFlow onComplete={handleUserAuthComplete} />}
      
      {view === 'dashboard' && user && plan && (
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
      )}
    </div>
  );
}