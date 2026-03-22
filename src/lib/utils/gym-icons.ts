import {
  Dumbbell,
  Activity,
  Zap,
  PersonStanding,
  Heart,
  Target,
  Timer,
  List,
  Trophy,
  Clock,
  Flame,
  CheckCircle,
  Users,
  Calendar,
  FlameKindling
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Strength:    Dumbbell,
  Cardio:      Activity,
  HIIT:        Zap,
  Flexibility: PersonStanding,
  Yoga:        Heart,
  Pilates:     Target,
  CrossFit:    Dumbbell,
  Bodyweight:  PersonStanding,
  Stretching:  PersonStanding,
  Recovery:    Heart,
  Warmup:      Activity,
  "Full Body": Dumbbell,
  Default:     Dumbbell,
};

export const DIFFICULTY_ICONS: Record<string, LucideIcon> = {
  beginner:     Target,
  intermediate: Activity,
  advanced:     Trophy,
};

export const STAT_ICONS = {
  duration:   Timer,
  steps:      List,
  level:      Trophy,
  workouts:   Dumbbell,
  minutes:    Clock,
  streak:     Flame,
  checkins:   CheckCircle,
  members:    Users,
  calories:   FlameKindling,
  heartRate:  Heart,
  trophy:     Trophy,
  calendar:   Calendar,
};

export function getCategoryIcon(category: string): LucideIcon {
  const normalized = category.trim();
  return CATEGORY_ICONS[normalized] || CATEGORY_ICONS.Default;
}

export function getDifficultyIcon(difficulty: string): LucideIcon {
  return DIFFICULTY_ICONS[difficulty] ?? DIFFICULTY_ICONS.intermediate;
}
