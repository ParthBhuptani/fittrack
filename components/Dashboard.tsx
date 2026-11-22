import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { User, UserProfile, WeeklyPlan, ProgressLog, Goal } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Button } from './Button';
import { Input } from './Input';
import SettingsView from './SettingsView';
import AppShell, { TabId } from './app/AppShell';
import { Sheet } from './ui/Sheet';
import { useToast } from './ui/Toast';
import TodayView from './app/TodayView';
import MealsView from './app/MealsView';
import WorkoutsView, { TimerMode } from './app/WorkoutsView';

import {
  Activity,
  Utensils,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  TrendingUp,
  PlayCircle,
  CheckCircle2,
  Circle,
  Dumbbell,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  Settings,
  ChefHat,
  Video,
  Scale,
  X,
  Plus,
  Shuffle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Droplets,
  BarChart2,
  Calendar as CalendarIcon,
  ChevronLeft,
  FileText,
  Flame,
  Timer
} from 'lucide-react';
import {
  DAILY_WATER_GOAL,
  getDayName,
  formatDate,
  getPlanDayIndex,
  toDisplayWeight,
  fromDisplayWeight,
  getWeightLabel,
  toDisplayHeight
} from '../utils';
// Loaded only when the Progress tab opens, so the charts library stays out of the first download.
const AnalyticsView = lazy(() => import('./AnalyticsView'));

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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Report sheet
  const [showReport, setShowReport] = useState(false);

  // Calendar Popover State
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Log Modal State
  const [logWeight, setLogWeight] = useState(toDisplayWeight(user.profile?.weight || 0, user.profile?.units || 'metric'));
  const [logWorkout, setLogWorkout] = useState(false);

  // Hydration State
  const [waterIntake, setWaterIntake] = useState(0);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [initialTimerTime, setInitialTimerTime] = useState(60);

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

  const handleTimerMode = (mode: TimerMode) => {
    setIsTimerActive(false);
    setTimerMode(mode);
    setTimerSeconds(mode === 'timer' ? initialTimerTime : 0);
  };

  const handleTimerPreset = (seconds: number) => {
    setIsTimerActive(false);
    setTimerMode('timer');
    setTimerSeconds(seconds);
    setInitialTimerTime(seconds);
  };

  const handleTimerToggle = () => {
    if (isTimerActive) { setIsTimerActive(false); return; }
    if (timerMode === 'timer' && timerSeconds === 0) setTimerSeconds(initialTimerTime);
    setIsTimerActive(true);
  };

  const handleTimerReset = () => {
    setIsTimerActive(false);
    setTimerSeconds(timerMode === 'timer' ? initialTimerTime : 0);
  };

  // Tell the user when a countdown finishes.
  const wasTimerActive = useRef(false);
  useEffect(() => {
    if (wasTimerActive.current && !isTimerActive && timerMode === 'timer' && timerSeconds === 0) {
      toast.show("Time's up", 'info');
    }
    wasTimerActive.current = isTimerActive;
  }, [isTimerActive, timerMode, timerSeconds]);

  // Replace an exercise with one of its easier or harder versions and save the plan.
  const handleSwap = (exerciseIdx: number, variationIdx: number) => {
    const dayIdx = getPlanDayIndex(selectedDate);
    const day = plan.days?.[dayIdx];
    const ex = day?.workout?.exercises?.[exerciseIdx];
    const variation = ex?.variations?.[variationIdx];
    if (!day || !ex || !variation) return;
    const swapped = {
      ...ex,
      name: variation.name,
      swappedFrom: ex.swappedFrom || ex.name,
      // The exercise we leave becomes a version you can switch back to.
      variations: [
        ...(ex.variations || []).filter((_, k) => k !== variationIdx),
        { name: ex.name, difficulty: variation.difficulty === 'Easier' ? 'Harder' as const : 'Easier' as const },
      ],
    };
    const days = plan.days.map((d, i) => i !== dayIdx ? d : {
      ...d,
      workout: { ...d.workout, exercises: d.workout.exercises.map((e, k) => k === exerciseIdx ? swapped : e) },
    });
    onUpdatePlan({ ...plan, days });
    toast.show(variation.difficulty === 'Easier' ? 'Swapped to easier' : 'Swapped to harder', 'success');
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
      toast.show("You can only log stats for today.", "info");
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
  };

  const updateWater = (amount: number) => {
    if (!isToday) {
      toast.show("You can only log water for today.", "info");
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
      setChatHistory(prev => [...prev, { role: 'model', text: error instanceof Error ? error.message : "Sorry, I had trouble connecting. Try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const generatePDFReport = (range: 'daily' | 'weekly' | 'monthly') => {
    setShowReport(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.show("Please allow pop-ups to view the report.", "error");
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
        workoutPct = Math.round((completedEx / totalEx) * 100);
      }

      return `
          <tr class="border-b">
            <td class="py-2">${l.date}</td>
            <td class="py-2">${toDisplayWeight(l.weight, user.profile?.units || 'metric')} ${getWeightLabel(user.profile?.units || 'metric')}</td>
            <td class="py-2">${workoutPct}% Completed</td>
            <td class="py-2">${l.waterIntake || 0} ml</td>
          </tr>
        `;
    }).join('') : `<tr><td colspan="4" class="text-center py-4">Nothing logged for this period yet.</td></tr>`;

    // Chronological order (oldest to newest) for the charts below — the table above
    // stays newest-first, but a chart reading left-to-right should go forward in time.
    const chronoLogs = [...filteredLogs].reverse();
    const units = user.profile?.units || 'metric';

    const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
    const shortDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const weightUnit = getWeightLabel(units);

    // Shared chart frame: gridlines, y-axis ticks, x-axis date labels and both axis titles.
    const chartFrame = (opts: { yTicks: { value: string; frac: number }[]; xLabels: { text: string; x: number }[]; yTitle: string; xTitle: string; body: string }) => {
      const W = 700, H = 280, L = 56, R = 20, T = 16, B = 56;
      const plotH = H - T - B;
      const grid = opts.yTicks.map(t => {
        const y = T + plotH - t.frac * plotH;
        return `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-dasharray="3 3" />
                <text x="${L - 8}" y="${(y + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="#64748b">${t.value}</text>`;
      }).join('');
      const xl = opts.xLabels.map(l => `<text x="${l.x.toFixed(1)}" y="${T + plotH + 18}" font-size="11" text-anchor="middle" fill="#64748b">${l.text}</text>`).join('');
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">
          ${grid}
          <line x1="${L}" y1="${T + plotH}" x2="${W - R}" y2="${T + plotH}" stroke="#cbd5e1" />
          ${opts.body}
          ${xl}
          <text x="${(L + W - R) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#475569">${opts.xTitle}</text>
          <text transform="translate(14 ${T + plotH / 2}) rotate(-90)" font-size="12" text-anchor="middle" fill="#475569">${opts.yTitle}</text>
        </svg>`;
    };
    const CH = { W: 700, L: 56, R: 20, T: 16, B: 56, H: 280 };
    const plotW = CH.W - CH.L - CH.R, plotH = CH.H - CH.T - CH.B;
    // Pick up to ~6 evenly spaced indices so date labels never collide.
    const labelIdx = (n: number) => {
      const max = Math.min(n, 6);
      if (n <= 1) return [0];
      return Array.from(new Set(Array.from({ length: max }, (_, k) => Math.round((k * (n - 1)) / (max - 1)))));
    };

    const buildWeightChartSvg = () => {
      if (chronoLogs.length < 2) {
        return `<p class="text-sm text-slate-400">Log your weight on at least two days to see a trend.</p>`;
      }
      const weights = chronoLogs.map(l => toDisplayWeight(l.weight, units));
      let lo = Math.floor(Math.min(...weights) - 1), hi = Math.ceil(Math.max(...weights) + 1);
      if (hi === lo) hi = lo + 1;
      const n = chronoLogs.length;
      const xAt = (i: number) => CH.L + (plotW * i) / (n - 1);
      const yAt = (w: number) => CH.T + plotH - ((w - lo) / (hi - lo)) * plotH;
      const pts = weights.map((w, i) => ({ x: xAt(i), y: yAt(w) }));
      const line = pts.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
      const area = `${CH.L},${CH.T + plotH} ${line} ${CH.L + plotW},${CH.T + plotH}`;
      const dots = pts.map((c, i) => {
        const label = `${shortDate(chronoLogs[i].date)}: ${weights[i]} ${weightUnit}`;
        return `<circle class="chart-point" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" fill="#fff" stroke="#10b981" stroke-width="2.5" onmouseenter="showChartTooltip(event, '${label}')" onmouseleave="hideChartTooltip()" />`;
      }).join('');
      const body = `<polygon points="${area}" fill="#10b981" fill-opacity="0.12" /><polyline points="${line}" fill="none" stroke="#10b981" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />${dots}`;
      return chartFrame({
        yTicks: [0, 0.25, 0.5, 0.75, 1].map(f => ({ frac: f, value: (lo + f * (hi - lo)).toFixed(1) })),
        xLabels: labelIdx(n).map(i => ({ x: xAt(i), text: shortDate(chronoLogs[i].date) })),
        yTitle: `Weight (${weightUnit})`, xTitle: 'Date', body,
      });
    };

    const adherencePct = (l: any) => {
      const dayPlan = plan.days?.[getPlanDayIndex(new Date(l.date))];
      const ex = dayPlan?.workout?.exercises;
      if (!ex) return 0;
      const total = ex.length || 1;
      return Math.round((ex.filter((_: any, idx: number) => l.details?.[`exercise-${idx}`]).length / total) * 100);
    };

    const buildAdherenceChartSvg = () => {
      if (chronoLogs.length === 0) {
        return `<p class="text-sm text-slate-400">No workout data in this period yet.</p>`;
      }
      const n = chronoLogs.length;
      const slot = plotW / n;
      const barW = Math.max(6, Math.min(40, slot * 0.6));
      const bars = chronoLogs.map((l, i) => {
        const pct = adherencePct(l);
        const h = (plotH * pct) / 100;
        const x = CH.L + slot * i + (slot - barW) / 2;
        const label = `${shortDate(l.date)}: ${pct}% of workout done`;
        return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${(CH.T + plotH - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" rx="3" fill="#10b981" onmouseenter="showChartTooltip(event, '${label}')" onmouseleave="hideChartTooltip()" />`;
      }).join('');
      return chartFrame({
        yTicks: [0, 0.25, 0.5, 0.75, 1].map(f => ({ frac: f, value: `${Math.round(f * 100)}%` })),
        xLabels: labelIdx(n).map(i => ({ x: CH.L + slot * i + slot / 2, text: shortDate(chronoLogs[i].date) })),
        yTitle: 'Workout completed (%)', xTitle: 'Date', body: bars,
      });
    };

    const showCharts = range !== 'daily';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FitTrack Report - ${esc(user.profile?.name)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = { theme: { extend: { colors: { brand: { 50:'#ecfdf5', 100:'#d1fae5', 500:'#10b981', 600:'#059669', 700:'#047857' } } } } };
          </script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              #chart-tooltip, .no-print { display: none !important; }
              .report-card { break-inside: avoid; }
            }
            .print-bar { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 40px; margin: -40px -40px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
            .print-btn { background: #059669; color: #ffffff; border: 0; border-radius: 10px; padding: 10px 18px; font-weight: 700; font-size: 14px; cursor: pointer; }
            .print-btn:hover { background: #047857; }
            .chart-point, .chart-bar {
              cursor: pointer;
              transition: r 0.15s ease, opacity 0.15s ease;
            }
            .chart-point:hover { r: 6; }
            .chart-bar:hover { opacity: 0.75; }
            #chart-tooltip {
              position: fixed;
              display: none;
              pointer-events: none;
              background: #1e293b;
              color: white;
              font-size: 12px;
              font-weight: 600;
              padding: 6px 10px;
              border-radius: 6px;
              white-space: nowrap;
              z-index: 50;
              transform: translate(-50%, -130%);
            }
          </style>
        </head>
        <body class="p-10 font-sans text-slate-800">
          <div id="chart-tooltip"></div>
          <div class="print-bar no-print">
            <span style="font-size:13px;color:#64748b;">Report preview${showCharts ? ' · hover a chart point for exact values' : ''}</span>
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="flex justify-between items-center mb-10 border-b pb-6">
            <div>
              <h1 class="text-4xl font-bold text-brand-600">FitTrack</h1>
              <p class="text-slate-500 mt-1">Personal Fitness Report</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-bold">${esc(user.profile?.name)}</h2>
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
              <p class="text-sm italic mb-2">"${esc(plan.weeklySummary)}"</p>
              <ul class="space-y-2 text-sm mt-4">
                 <li><strong>Equipment:</strong> ${esc(user.profile?.equipment)}</li>
                 <li><strong>Injuries:</strong> ${esc(user.profile?.injuries)}</li>
              </ul>
            </div>
          </div>

          ${showCharts ? `
          <h3 class="text-2xl font-bold mb-4">Progress</h3>
          <div class="grid grid-cols-1 gap-8 mb-10">
            <div class="report-card bg-slate-50 p-6 rounded-xl">
              <h4 class="font-bold text-base text-slate-700 mb-1">Weight over time</h4>
              <p class="text-xs text-slate-400 mb-3">Each point is a day you logged your weight.</p>
              ${buildWeightChartSvg()}
            </div>
            <div class="report-card bg-slate-50 p-6 rounded-xl">
              <h4 class="font-bold text-base text-slate-700 mb-1">Workout completion</h4>
              <p class="text-xs text-slate-400 mb-3">Share of each day's planned exercises you ticked off.</p>
              ${buildAdherenceChartSvg()}
            </div>
          </div>` : ''}

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
            function showChartTooltip(evt, text) {
              const tooltip = document.getElementById('chart-tooltip');
              tooltip.textContent = text;
              tooltip.style.left = evt.clientX + 'px';
              tooltip.style.top = evt.clientY + 'px';
              tooltip.style.display = 'block';
            }
            function hideChartTooltip() {
              document.getElementById('chart-tooltip').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const toggleItemCompletion = (type: 'exercise' | 'meal', index: number) => {
    if (!isToday) {
      toast.show("You can only change today's records.", "info");
      return;
    }

    const itemId = `${type}-${index}`;
    const dateStr = formatDate(selectedDate);
    const existingLog = logs.find(l => l.date === dateStr);
    const details = existingLog?.details || {};
    const newStatus = !details[itemId];

    const newDetails = { ...details, [itemId]: newStatus };
    const exercises = plan.days?.[planDayIndex]?.workout?.exercises || [];
    const workoutCompleted = exercises.length > 0 && exercises.every((_, i) => newDetails[`exercise-${i}`]);

    handleSaveLog({ details: newDetails, workoutCompleted });
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

  const reportOptions: { range: 'daily' | 'weekly' | 'monthly'; title: string; hint: string }[] = [
    { range: 'daily', title: 'Today', hint: 'Just today\'s numbers' },
    { range: 'weekly', title: 'Last 7 days', hint: 'With weight and workout charts' },
    { range: 'monthly', title: 'Last 30 days', hint: 'With weight and workout charts' },
  ];

  return (
    <>

      <AppShell
        name={user.profile?.name || ''}
        email={user.email}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onTab={setActiveTab}
        streak={streakCount}
        timerText={isTimerActive ? formatTime(timerSeconds) : null}
        onReport={() => setShowReport(true)}
        onLogout={onLogout}
      >
        <div className={(activeTab === 'overview' || activeTab === 'workout' || activeTab === 'diet') ? 'relative min-h-full' : 'p-4 md:p-8 relative min-h-full'}>

          {/* TODAY TAB */}
          {activeTab === 'overview' && (
            <TodayView
              firstName={(user.profile?.name || '').split(' ')[0]}
              plan={plan}
              logs={logs}
              units={user.profile?.units || 'metric'}
              profileWeightKg={user.profile?.weight || 0}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              isToday={isToday}
              waterIntake={waterIntake}
              onWater={updateWater}
              onSaveWeight={(kg) => handleSaveLog({ weight: kg })}
              onOpenWorkouts={() => setActiveTab('workout')}
              onOpenMeals={() => setActiveTab('diet')}
            />
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <Suspense fallback={<div className="py-20 text-center text-slate-400 text-sm">Loading your progress...</div>}>
              <AnalyticsView logs={logs} profile={user.profile!} plan={plan} />
            </Suspense>
          )}

          {/* WORKOUTS TAB */}
          {activeTab === 'workout' && (
            <WorkoutsView
              plan={plan}
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              isToday={isToday}
              onToggleExercise={(idx) => toggleItemCompletion('exercise', idx)}
              onSwap={handleSwap}
              searchLink={(q) => getSearchLink(q, 'video')}
              timerMode={timerMode}
              timerSeconds={timerSeconds}
              timerTarget={initialTimerTime}
              timerActive={isTimerActive}
              onTimerMode={handleTimerMode}
              onTimerPreset={handleTimerPreset}
              onTimerToggle={handleTimerToggle}
              onTimerReset={handleTimerReset}
            />
          )}

          {/* MEALS TAB */}
          {activeTab === 'diet' && (
            <MealsView
              plan={plan}
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              isToday={isToday}
              onToggleMeal={(idx) => toggleItemCompletion('meal', idx)}
              searchLink={(q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' recipe')}`}
            />
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
                    <div className={`max-w-[85%] p-4 md:p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
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
            <SettingsView user={user} onUpdateProfile={onUpdateUser} onUpdatePlan={onUpdatePlan} onLogout={onLogout} />
          )}

        </div>
      </AppShell>

      <Sheet open={showReport} onClose={() => setShowReport(false)} title="Download report" description="Opens a printable report you can save as a PDF.">
        <div className="flex flex-col gap-2">
          {reportOptions.map(o => (
            <button
              key={o.range}
              type="button"
              onClick={() => generatePDFReport(o.range)}
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2 text-left transition-colors hover:bg-soft"
            >
              <span><b className="block font-bold text-ink">{o.title}</b><span className="text-sm text-muted">{o.hint}</span></span>
              <FileText className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

// 5. Main App Container

export default Dashboard;