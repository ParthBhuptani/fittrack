import React, { useState, useEffect } from 'react';
import { User, UserProfile, Goal, DietType } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Button } from './Button';
import { Input } from './Input';
import { ChefHat, LogOut, RefreshCw, Ruler, Settings, X } from 'lucide-react';
import { DIETARY_RESTRICTIONS, toDisplayWeight, fromDisplayWeight, getWeightLabel, toDisplayHeight } from '../utils';

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

export default SettingsView;
