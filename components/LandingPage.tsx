import React from 'react';
import { Activity, Dumbbell, TrendingUp, Utensils } from 'lucide-react';
import { Button } from './Button';

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

export default LandingPage;
