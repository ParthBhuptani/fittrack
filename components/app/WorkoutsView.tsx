import React, { useState } from 'react';
import { Check, ChevronDown, Info, Play, RotateCcw, Repeat } from 'lucide-react';
import { ProgressLog, WeeklyPlan } from '../../types';
import { formatDate, getPlanDayIndex } from '../../utils';
import WeekStrip, { DAYNAMES } from './WeekStrip';
import './views.css';

export type TimerMode = 'stopwatch' | 'timer';

interface Props {
  plan: WeeklyPlan;
  logs: ProgressLog[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  isToday: boolean;
  onToggleExercise: (idx: number) => void;
  onSwap: (exerciseIdx: number, variationIdx: number) => void;
  searchLink: (query: string) => string;
  // Timer (state lives in the dashboard so the top bar can show it too)
  timerMode: TimerMode;
  timerSeconds: number;
  timerTarget: number;
  timerActive: boolean;
  onTimerMode: (mode: TimerMode) => void;
  onTimerPreset: (seconds: number) => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const PRESETS = [30, 60, 90];

// Plan names sometimes carry a long explanation in brackets, e.g. "Knee Plank (supported on knees)".
// Show the short name in the list and keep the explanation for the open view.
const splitName = (name: string) => {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m && m[1] ? { title: m[1], note: m[2] } : { title: name, note: '' };
};
// Sets and reps may already include words ("3 sets", "45 seconds"), so only add words to bare numbers.
const withWord = (v: string, word: string) => (/[a-z]/i.test(String(v)) ? String(v) : `${v} ${word}`);

const WorkoutsView: React.FC<Props> = ({
  plan, logs, selectedDate, onSelectDate, isToday, onToggleExercise, onSwap, searchLink,
  timerMode, timerSeconds, timerTarget, timerActive, onTimerMode, onTimerPreset, onTimerToggle, onTimerReset,
}) => {
  const [open, setOpen] = useState<number | null>(null);
  const dayIdx = getPlanDayIndex(selectedDate);
  const day = plan.days?.[dayIdx];
  const exercises = day?.workout?.exercises || [];
  const hasEx = exercises.length > 0;
  const details = logs.find(l => l.date === formatDate(selectedDate))?.details || {};
  const doneCount = exercises.filter((_, i) => details[`exercise-${i}`]).length;
  const isTodaySel = formatDate(selectedDate) === formatDate(new Date());

  const shown = timerMode === 'timer' && timerSeconds === 0 && !timerActive ? timerTarget : timerSeconds;
  const toggleLabel = timerActive ? 'Pause' : timerMode === 'stopwatch' && timerSeconds > 0 ? 'Resume' : 'Start';
  const durationMin = day?.workout?.durationMinutes;

  return (
    <div className="av">
      <div className="view">
        <div className="head">
          <div>
            <h1 className="disp h1">Workouts</h1>
            <p className="sub">{DAYNAMES[dayIdx]}{isTodaySel ? ', today' : ''}. {day?.focus || 'Rest day'}{hasEx && durationMin ? `, ${durationMin} minutes` : ''}</p>
          </div>
        </div>

        <WeekStrip plan={plan} logs={logs} selectedDate={selectedDate} onSelect={(d) => { onSelectDate(d); setOpen(null); }} />

        {hasEx ? (
          <>
            <div className="timer" role="group" aria-label="Timer">
              <div className="tm-l">
                <div className="seg">
                  <button type="button" aria-pressed={timerMode === 'stopwatch'} onClick={() => onTimerMode('stopwatch')}>Stopwatch</button>
                  <button type="button" aria-pressed={timerMode === 'timer'} onClick={() => onTimerMode('timer')}>Timer</button>
                </div>
                <div className={`presets ${timerMode === 'timer' ? '' : 'off'}`}>
                  {PRESETS.map(v => (
                    <button key={v} type="button" aria-pressed={timerTarget === v} onClick={() => onTimerPreset(v)}>{v} s</button>
                  ))}
                </div>
              </div>
              <div className={`t ${timerActive ? 'on' : ''}`} aria-live="off">{fmt(shown)}</div>
              <div className="tm-r">
                <button type="button" className="icon-btn" onClick={onTimerReset} aria-label="Reset timer"><RotateCcw size={18} aria-hidden="true" /></button>
                <button type="button" className="btn" onClick={onTimerToggle}>{toggleLabel}</button>
              </div>
            </div>

            <div className="sticky-sum">
              <span className="muted">{doneCount} of {exercises.length} exercises done</span>
              <span className="muted">{isToday ? 'Tap a circle to mark done' : 'You can tick exercises for today only'}</span>
            </div>

            <div className="list">
              {exercises.map((ex, i) => {
                const done = !!details[`exercise-${i}`];
                const isOpen = open === i;
                const nm = splitName(ex.name);
                return (
                  <div key={`${i}-${ex.name}`} className={`ex ${done ? 'done' : ''} ${isOpen ? 'open' : ''}`}>
                    <div className="ex-head">
                      <button type="button" className="chk" aria-pressed={done} aria-label={`Mark ${nm.title} done`} onClick={() => onToggleExercise(i)}>
                        <span><Check size={16} aria-hidden="true" /></span>
                      </button>
                      <button type="button" className="ex-main" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                        <span className="nm">{nm.title}{ex.swappedFrom && <em className="tag">swapped</em>}</span>
                        <span className="sc">{withWord(ex.sets, 'sets')} × {withWord(ex.reps, 'reps')}</span>
                      </button>
                      <button type="button" className="chev" aria-label={`Show details for ${nm.title}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                        <ChevronDown size={20} aria-hidden="true" />
                      </button>
                    </div>
                    <div className={`xp ${isOpen ? 'open' : ''}`}>
                      <div>
                        <div className="xp-in">
                          {nm.note && <p className="aka">{nm.note}</p>}
                          {ex.tips && <p className="tip">{ex.tips}</p>}
                          {ex.variations && ex.variations.length > 0 && (
                            <>
                              <p className="swaph">Swap for another version</p>
                              <div className="alts">
                                {ex.variations.map((v, k) => (
                                  <div className="alt" key={`${v.name}-${k}`}>
                                    <b className={v.difficulty === 'Easier' ? 'e' : 'h'}>{v.difficulty}</b>
                                    <span className="an">{splitName(v.name).title}</span>
                                    {splitName(v.name).note && <span className="an-note">{splitName(v.name).note}</span>}
                                    <div className="aa">
                                      <button type="button" className="mini" onClick={() => { onSwap(i, k); setOpen(null); }}><Repeat aria-hidden="true" />Use this</button>
                                      <a className="mini" href={searchLink(splitName(v.name).title)} target="_blank" rel="noopener noreferrer" aria-label={`Watch a demo of ${splitName(v.name).title}`}><Play aria-hidden="true" />Demo</a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {ex.swappedFrom && <p className="note-line">Originally planned: {splitName(ex.swappedFrom).title}</p>}
                          <div className="acts">
                            <a className="link" href={searchLink(nm.title)} target="_blank" rel="noopener noreferrer"><Play size={16} aria-hidden="true" />Watch demo</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card empty">
            <h3 className="disp">Rest day</h3>
            <p className="muted" style={{ maxWidth: '30em', margin: '10px auto 0' }}>Recovery is part of the plan. A relaxed walk and plenty of water is plenty today.</p>
          </div>
        )}

        <p className="legal"><Info size={18} aria-hidden="true" /><span>Stop if anything hurts. Not medical advice: check with your doctor first if you have an injury or a health condition.</span></p>
      </div>
    </div>
  );
};

export default WorkoutsView;