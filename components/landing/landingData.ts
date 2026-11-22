export const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const DAYNAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// x(name, scheme, easier, harder, kneeSwap, homeSwap, bothSwap)
export interface Exercise { n: string; s: string; e: string; h: string; k?: string | null; g?: string | null; kh?: string | null }
const x = (n: string, s: string, e: string, h: string, k?: string | null, g?: string | null, kh?: string | null): Exercise => ({ n, s, e, h, k, g, kh });

export interface Focus { title: string; mins: number; ex: Exercise[] }
export const FOCUS: Record<string, Focus> = {
  full: { title: 'full body', mins: 40, ex: [
    x('Goblet squat', '3 × 12', 'Box squat', 'Add a 3-second lowering', 'Glute bridge', 'Bodyweight squat'),
    x('Push-ups', '3 × 10', 'Incline push-ups', 'Slow 3-second lowering'),
    x('Dumbbell row', '3 × 12', 'Lighter weight, one hand on a bench', 'Pause for 2 seconds at the top', null, 'Backpack row'),
    x('Plank', '3 × 40 s', 'Plank on your knees', 'Plank with shoulder taps')
  ]},
  cardio: { title: 'cardio intervals', mins: 30, ex: [
    x('Easy warm-up walk', '5 min', 'Slow the pace', 'Walk briskly'),
    x('Run intervals', '6 × 1 min fast, 1 min easy', 'Jog or fast-walk the fast minutes', 'Make the fast minutes faster', 'Bike intervals', null, 'Fast-walk intervals'),
    x('Dead bug', '3 × 10', 'Smaller range of motion', 'Hold a light weight'),
    x('Hamstring and calf stretch', '2 × 45 s', 'Hold for 30 s', 'Hold for 60 s')
  ]},
  lower: { title: 'lower body', mins: 45, ex: [
    x('Back squat', '4 × 8', 'Goblet squat', 'Add a pause at the bottom', 'Hip thrust', 'Slow bodyweight squat', 'Glute bridge'),
    x('Romanian deadlift', '3 × 10', 'Lighter weight', 'Slow 3-second lowering', null, 'Single-leg deadlift, bodyweight'),
    x('Walking lunge', '3 × 12 each leg', 'Reverse lunge to a bench', 'Hold dumbbells', 'Glute bridge march'),
    x('Calf raise', '3 × 15', 'Hold a wall for balance', 'Single leg')
  ]},
  push: { title: 'upper body push', mins: 45, ex: [
    x('Bench press', '4 × 8', 'Dumbbell press', 'Slow 3-second lowering', null, 'Push-ups'),
    x('Overhead press', '3 × 10', 'Seated, lighter weight', 'Slow lowering', null, 'Pike push-up'),
    x('Incline dumbbell press', '3 × 10', 'Lighter weight', 'Pause at the bottom', null, 'Feet-up push-ups'),
    x('Triceps dip', '3 × 12', 'Bent-knee bench dip', 'Straight-leg dip')
  ]},
  pull: { title: 'back and core', mins: 45, ex: [
    x('Lat pulldown', '4 × 10', 'Lighter weight', 'Slow return', null, 'Towel row'),
    x('Seated row', '3 × 12', 'Lighter weight', 'Pause for 2 seconds', null, 'Backpack row'),
    x('Face pull', '3 × 15', 'Lighter band or cable', 'Pause for 2 seconds', null, 'Reverse snow angels'),
    x('Hanging knee raise', '3 × 10', 'Lying leg raise', 'Straight-leg raise')
  ]},
  upper: { title: 'upper body', mins: 40, ex: [
    x('Dumbbell shoulder press', '3 × 10', 'Lighter weight', 'Slow lowering', null, 'Pike push-up'),
    x('Bent-over row', '3 × 10', 'Chest-supported row', 'Pause at the top', null, 'Backpack row'),
    x('Push-ups', '3 × 12', 'Incline push-ups', 'Feet elevated'),
    x('Biceps curl', '3 × 12', 'Lighter weight', 'Slow lowering', null, 'Backpack curl')
  ]},
  steady: { title: 'steady cardio', mins: 35, ex: [
    x('Easy-pace cardio', '30 min', '20 minutes at the same pace', '35 minutes at the same pace', 'Cycling or swimming', 'Jog or brisk walk', 'Brisk walk on flat ground'),
    x('Bird dog', '3 × 10 each side', 'Hold for 2 seconds', 'Hold for 5 seconds'),
    x('Calf stretch', '2 × 45 s', 'Hold for 30 s', 'Hold for 60 s')
  ]},
  mobility: { title: 'mobility and walk', mins: 25, ex: [
    x('Easy walk', '15 min', '10 minutes', '20 minutes'),
    x('Hip flexor stretch', '2 × 45 s each side', 'Hold for 30 s', 'Hold for 60 s'),
    x('Thoracic rotations', '2 × 10 each side', 'Smaller range', 'Pause at the end'),
    x('Cat-cow', '2 × 10', 'Move slowly', 'Hold each end for 3 seconds')
  ]},
  rest: { title: 'rest day', mins: 0, ex: [] }
};

export type Goal = 'lose' | 'build' | 'fit';
export const SPLIT: Record<Goal, string[]> = {
  lose:  ['full','cardio','lower','mobility','upper','steady','rest'],
  build: ['push','lower','pull','rest','upper','lower','mobility'],
  fit:   ['full','cardio','mobility','full','steady','cardio','rest']
};

export const MEALS: Record<Goal, { n: [string, string, number][]; v: [string, string, number][] }> = {
  lose: {
    n: [['Breakfast','Egg bhurji with one roti',360],['Lunch','Grilled chicken, rice and salad',520],['Snack','Roasted chana',160],['Dinner','Fish curry with vegetables',440]],
    v: [['Breakfast','Besan chilla with curd',350],['Lunch','Paneer tikka bowl with salad',510],['Snack','Roasted chana',160],['Dinner','Moong dal khichdi with sabzi',430]]
  },
  build: {
    n: [['Breakfast','Three-egg omelette, oats and a banana',620],['Lunch','Chicken rice bowl with dal',780],['Snack','Peanut butter toast and milk',380],['Dinner','Grilled fish, roti and sabzi',700]],
    v: [['Breakfast','Paneer paratha with curd',640],['Lunch','Rajma chawal with salad',760],['Snack','Peanut butter toast and milk',380],['Dinner','Soya chunk curry with roti',680]]
  },
  fit: {
    n: [['Breakfast','Oats with fruit and nuts',420],['Lunch','Chicken wrap with salad',560],['Snack','Fruit and almonds',200],['Dinner','Egg curry with a small portion of rice',600]],
    v: [['Breakfast','Poha with peanuts',400],['Lunch','Dal, roti, sabzi and curd',600],['Snack','Fruit and almonds',200],['Dinner','Vegetable pulao with raita',560]]
  }
};

export const ASKS: { id: string; q: string; a: string }[] = [
  { id: 'knee', q: 'My knee hurts on squats', a: 'Keep every rep pain-free and swap the move that hurts for a gentler one, like glute bridges or sit-to-stands to a chair. If the pain is sharp, lasts more than a few days or gets worse, see a doctor or physio before you train it again.' },
  { id: 'eat', q: 'What should I eat before training?', a: 'Something small with carbs and a little protein, 60 to 90 minutes before: a banana with peanut butter, or curd with poha. Keep fat and fibre low so it sits easily.' },
  { id: 'miss', q: 'I missed two workouts', a: 'Pick up with today\'s session and let the week run on. Doubling up adds fatigue and makes another skipped day more likely. If your week has changed a lot, generate a fresh plan that fits the days you have left.' },
  { id: 'home', q: 'Can I train without equipment?', a: 'Yes. Push-ups, bodyweight squats, glute bridges, backpack rows and planks cover most of the body. Tell FitTrack you have no equipment and every exercise in your plan is chosen to match.' }
];

// Free-typed questions are matched against a few common topics. The landing page has no AI behind it.
export const TOPICS: { k: RegExp; a: string }[] = [
  { k: /chest pain|faint|dizz|can'?t breathe|trouble breathing|short of breath|numb|blackout/i,
    a: 'Stop exercising and get medical help right away if you have chest pain, dizziness, fainting, numbness or trouble breathing. Don\'t wait for an app or a plan to tell you what to do.' },
  { k: /knee|pain|hurt|injur|sprain|back pain|lower back|shoulder pain/i,
    a: 'Keep every rep pain-free and swap the move that hurts for a gentler one. If the pain is sharp, lasts more than a few days or gets worse, see a doctor or physio before you train it again. Your profile lets FitTrack plan around an injury from the start.' },
  { k: /protein|whey|supplement|creatine/i,
    a: 'Most people can get enough protein from food: eggs, dal, paneer, curd, chicken or fish. Your plan sets a daily target for your goal. A supplement is optional, and worth a chat with a doctor or dietitian if you have kidney problems or other health conditions.' },
  { k: /before (training|workout|gym|exercise)|pre.?workout/i,
    a: 'Something small with carbs and a little protein, 60 to 90 minutes before: a banana with peanut butter, or curd with poha. Keep fat and fibre low so it sits easily.' },
  { k: /eat|food|meal|breakfast|lunch|dinner|snack|diet|hungry|calorie/i,
    a: 'Build each meal around a protein like dal, paneer, eggs, curd, chicken or fish, add vegetables, and pick a carb that fits how active you are. Your plan lists meals and calories for your goal, and every meal has a recipe.' },
  { k: /miss|skip|behind|double|motivat|lazy|consisten|habit/i,
    a: 'Pick up with today\'s session and let the week run on. Consistency beats catching up. If your week has changed a lot, generate a fresh plan that fits the days you have left.' },
  { k: /lose|fat|slim|belly|weight loss|cut/i,
    a: 'Fat loss comes mostly from a steady calorie deficit you can keep up, plus strength training to hold on to muscle. Slow and steady usually lasts longer than crash diets. Your plan sets calories for your goal.' },
  { k: /muscle|bulk|gain|strength|bigger/i,
    a: 'Muscle needs three things: progressive strength training, enough protein and calories, and sleep. Add a little weight or a rep over time. Your plan sets the sessions and the daily targets.' },
  { k: /sleep|rest day|recover|tired|fatigue|sore/i,
    a: 'Recovery is part of training. Aim for regular sleep, keep rest days in your week, and ease off if you feel run down for several days. Mild soreness is normal. Sharp or lasting pain isn\'t, so check with a doctor if it doesn\'t settle.' },
  { k: /water|hydrat|drink/i,
    a: 'Drink regularly through the day and a bit more around training, especially in hot weather. FitTrack tracks your daily water against a goal so it\'s easy to see how you\'re doing.' },
  { k: /home|equipment|gym|dumbbell/i,
    a: 'Yes, you can train effectively at home. Tell FitTrack what equipment you have, or none, and every exercise in your plan is chosen to match.' },
  { k: /beginner|new to|first time|just start|how do i start/i,
    a: 'Start light, learn the movements, and add weight slowly. FitTrack gives every exercise an easier and a harder version, so you can begin where you are and move up when it feels comfortable.' }
];
export const FALLBACK = 'I can answer that properly once I know your profile, your plan and your injuries. Create a free account and ask me again. Your plan takes about a minute to build.';

export const FAQS: { q: string; open: boolean; a: string }[] = [
  { q: 'Is this medical advice?', open: true, a: 'No. FitTrack gives general fitness and nutrition information, not medical advice. Talk to your doctor before you start a new exercise or eating plan, especially if you have an injury or a health condition, are pregnant or take medication. Stop and get medical help if you feel chest pain, dizziness or trouble breathing.' },
  { q: 'Is FitTrack free?', open: false, a: 'Yes, right now. FitTrack is a free, open-source project. If that changes, it will be announced here first.' },
  { q: 'How is my plan made?', open: false, a: 'Your profile goes to Google\'s Gemini model, which writes the plan in a fixed format. FitTrack checks that all seven days have workouts and meals before it saves the plan.' },
  { q: 'What do you store about me?', open: false, a: 'Your profile, plans, progress logs and coach messages. They live in a database where each account can only read its own rows. Your profile and questions are sent to Gemini to write plans and replies.' },
  { q: 'Can I change my plan later?', open: false, a: 'Yes. Update your profile in Settings and generate a new plan. There is a daily limit on new plans to keep the service free for everyone.' }
];