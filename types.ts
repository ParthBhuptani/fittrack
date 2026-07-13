

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum Goal {
  WeightLoss = 'Weight Loss',
  MuscleGain = 'Muscle Gain',
  Maintenance = 'Maintenance',
  Endurance = 'Endurance',
  Flexibility = 'Flexibility',
}

export enum ActivityLevel {
  Sedentary = 'Sedentary',
  LightlyActive = 'Lightly Active',
  ModeratelyActive = 'Moderately Active',
  VeryActive = 'Very Active',
}

export enum DietType {
  Vegan = 'Vegan',
  Vegetarian = 'Vegetarian',
  NonVeg = 'Non-Vegetarian',
  Eggetarian = 'Eggetarian',
  Keto = 'Keto',
  Paleo = 'Paleo',
  Balanced = 'Balanced',
  Other = 'Other'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // stored in cm
  weight: number; // stored in kg
  units: 'metric' | 'imperial';
  goal: Goal;
  activityLevel: ActivityLevel;
  dietType: DietType;
  restrictions: string[]; // e.g. ["Gluten-Free", "Dairy-Free"]
  dietaryPreferences: string; // Additional notes like "No mushrooms"
  injuries: string;
  allergies: string;
  equipment: string; // "Gym", "Home with Dumbbells", "Bodyweight only"
}

export interface User {
  id: string;
  email: string;
  password?: string;
  profile?: UserProfile;
  createdAt: number;
}

export interface ExerciseVariation {
  name: string;
  difficulty: 'Easier' | 'Harder';
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  tips: string;
  completed?: boolean; // UI state only
  variations?: ExerciseVariation[];
}

export interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  recipeStub: string; // Short description
  ingredients: string[]; // List of ingredients
  instructions: string[]; // Step by step
  completed?: boolean; // UI state only
}

export interface DailyPlan {
  dayName: string; // "Monday", "Day 1", etc.
  focus: string; // "Leg Day", "Cardio", "Rest"
  workout: {
    exercises: Exercise[];
    durationMinutes: number;
  };
  diet: {
    totalCalories: number;
    meals: Meal[];
  };
}

export interface WeeklyPlan {
  generatedAt: number;
  weeklySummary: string;
  days: DailyPlan[];
}

export interface ProgressLog {
  date: string;
  weight: number;
  caloriesConsumed?: number;
  workoutCompleted: boolean;
  waterIntake?: number; // in ml
  details?: { [itemId: string]: boolean }; // Stores 'exercise-0': true, 'meal-2': true
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}