// --- CONSTANTS ---
export const DIETARY_RESTRICTIONS = [
  "Gluten-Free", "Dairy-Free", "Nut-Free", "Soy-Free", 
  "Shellfish-Free", "Low-Sodium", "Sugar-Free", "Halal", "Kosher", "Low-Carb"
];

export const DAILY_WATER_GOAL = 2500; // ml

// --- UTILS ---
export const getDayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const getPlanDayIndex = (date: Date) => {
  // Map Sunday (0) -> 6, Monday (1) -> 0
  let day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

// Unit Conversion Utils
export const toDisplayWeight = (kg: number, units: 'metric' | 'imperial') => {
  return units === 'imperial' ? Math.round(kg * 2.20462) : kg;
};

export const fromDisplayWeight = (val: number, units: 'metric' | 'imperial') => {
  return units === 'imperial' ? val / 2.20462 : val;
};

export const getWeightLabel = (units: 'metric' | 'imperial') => units === 'imperial' ? 'lbs' : 'kg';

export const toDisplayHeight = (cm: number, units: 'metric' | 'imperial') => {
  if (units === 'metric') return { text: `${cm} cm`, val: cm };
  const realFeet = (cm * 0.393700787) / 12;
  const feet = Math.floor(realFeet);
  const inches = Math.round((realFeet - feet) * 12);
  return { text: `${feet}' ${inches}"`, val: cm };
};
