import React, { useState, useMemo } from 'react';
import { ProgressLog, UserProfile, WeeklyPlan } from '../types';
import { Activity, CheckCircle2, Droplets, Dumbbell, Scale } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { getPlanDayIndex, toDisplayWeight, getWeightLabel, formatDate } from '../utils';

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

export default AnalyticsView;
