/**
 * Intelligent exercise search engine.
 *
 * Supports: synonyms, slang, typos (fuzzy), partial inputs,
 * muscle-group mapping, equipment aliases, goal-based phrasing.
 * Pure client-side — runs against the pre-loaded exercise cache.
 */

// ─── Synonym / alias map ───────────────────────────────────────────────────────
// Every key maps to related terms. Lookup is bidirectional at runtime.

const SYNONYM_MAP: Record<string, string[]> = {
  // ── Muscle groups ──────────────────────────────────────────────────────
  abs:       ["core", "abdominals", "six pack", "stomach", "belly", "midsection", "tummy", "abdomen", "ab"],
  core:      ["abs", "abdominals", "plank", "midsection", "stability"],
  chest:     ["pecs", "pectoral", "breast", "upper chest", "bench"],
  back:      ["lats", "latissimus", "spine", "rhomboids", "trapezius", "traps", "rear", "posterior chain"],
  legs:      ["lower body", "quads", "quadriceps", "hamstrings", "calves", "thighs", "leg day", "glutes"],
  shoulders: ["delts", "deltoids", "overhead", "rotator cuff", "shoulder"],
  arms:      ["biceps", "triceps", "forearms", "upper arms", "guns"],
  glutes:    ["butt", "booty", "buttocks", "posterior", "hips", "glute"],
  hamstrings:["ham", "back of legs", "posterior legs"],
  calves:    ["calf", "lower legs"],

  // ── Exercise categories ────────────────────────────────────────────────
  cardio:    ["aerobic", "endurance", "hiit", "fat burn", "fat burning", "burn fat", "lose weight",
              "weight loss", "conditioning", "treadmill", "run", "sprint", "jump"],
  strength:  ["weight training", "lifting", "resistance", "muscle building", "build muscle",
              "hypertrophy", "powerlifting", "heavy"],
  flexibility:["stretching", "stretch", "mobility", "yoga", "pilates", "recovery",
               "cool down", "cooldown", "restore"],
  warmup:    ["warm up", "warm-up", "activation", "primer", "prepare", "prehab"],
  hiit:      ["interval", "tabata", "circuit", "intense", "high intensity", "fat burn", "cardio"],

  // ── Equipment ─────────────────────────────────────────────────────────
  bodyweight: ["no equipment", "no gym", "home workout", "at home", "calisthenics",
               "no weights", "home", "outdoors", "park"],
  dumbbell:  ["dumbbells", "db", "free weights", "hand weights"],
  barbell:   ["bb", "bar", "olympic bar", "plates", "powerlifting bar"],
  cable:     ["pulley", "cables", "machine cable"],
  kettlebell:["kb", "kettle"],
  band:      ["resistance band", "elastic band", "loop band"],

  // ── Common exercises ──────────────────────────────────────────────────
  "jump rope": ["jumping rope", "rope jumping", "skipping", "skip rope", "jumprope", "rope skip"],
  squat:     ["squats", "squating", "squatting", "air squat", "bodyweight squat"],
  "push up": ["pushup", "push-up", "pushups", "push ups", "press up"],
  "pull up": ["pullup", "pull-up", "chin up", "chinup", "chin-up"],
  lunge:     ["lunges", "stepping", "split squat", "walking lunge"],
  plank:     ["planks", "core hold", "forearm plank", "plank hold"],
  crunch:    ["crunches", "sit up", "situp", "sit-up", "curl up"],
  deadlift:  ["dead lift", "dl", "rdl", "romanian", "stiff leg"],
  row:       ["rowing", "bent over row", "cable row", "seated row"],
  curl:      ["curls", "bicep curl", "dumbbell curl", "barbell curl"],

  // ── Goals / slang ─────────────────────────────────────────────────────
  "six pack":    ["abs", "core", "stomach fat", "belly fat", "abdominals"],
  "stomach fat": ["abs", "core", "fat loss", "burn fat", "cardio"],
  "belly fat":   ["abs", "core", "fat loss", "cardio"],
  "leg day":     ["legs", "lower body", "quads", "squats", "glutes"],
  "upper body":  ["chest", "back", "shoulders", "arms", "push", "pull"],
  "full body":   ["total body", "compound", "functional", "all muscle"],
  "burn fat":    ["cardio", "fat loss", "hiit", "weight loss", "conditioning"],
  "lose weight": ["cardio", "fat loss", "hiit", "calorie burn"],
  "build muscle":["strength", "hypertrophy", "weight training", "mass"],
  shred:         ["cardio", "fat loss", "lean", "cut", "hiit"],
  tone:          ["light weight", "endurance", "lean muscle", "definition"],
  "no equipment":["bodyweight", "home workout", "calisthenics", "at home"],
  "home workout":["bodyweight", "no equipment", "no gym", "calisthenics"],
};

// Quick-lookup: word → all related terms (flattened, including the key itself)
const EXPANDED: Record<string, Set<string>> = {};
for (const [key, aliases] of Object.entries(SYNONYM_MAP)) {
  const all = new Set([key, ...aliases]);
  // Make every alias also point to all related terms
  for (const term of all) {
    if (!EXPANDED[term]) EXPANDED[term] = new Set();
    all.forEach((t) => EXPANDED[term].add(t));
  }
}

// ─── Suggestions (autocomplete) ───────────────────────────────────────────────

const SUGGESTION_LIST: string[] = [
  // Categories
  "Abs", "Arms", "Back", "Cardio", "Chest", "Full Body",
  "Legs", "Shoulders", "Strength", "HIIT", "Warmup", "Flexibility",
  // Popular searches
  "jump rope", "squat", "push up", "pull up", "plank", "deadlift",
  "bicep curl", "bench press", "lunge", "burpee", "crunch",
  "six pack", "leg day", "burn fat", "home workout", "no equipment",
  "bodyweight", "dumbbell", "barbell", "kettlebell",
];

export function getSuggestions(partial: string): string[] {
  if (partial.length < 1) return [];
  const p = partial.toLowerCase().trim();
  return SUGGESTION_LIST.filter((s) => s.toLowerCase().startsWith(p)).slice(0, 6);
}

// ─── Fuzzy matching (Levenshtein, capped at distance 2) ───────────────────────

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99; // early exit
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}

// ─── Query expansion ──────────────────────────────────────────────────────────

function expandQuery(raw: string): string[] {
  const lower = raw.toLowerCase().trim();
  const words = lower.split(/[\s,]+/).filter((w) => w.length >= 2);
  const result = new Set<string>([lower, ...words]);

  // Direct lookup in expanded map
  for (const word of [lower, ...words]) {
    const related = EXPANDED[word];
    if (related) related.forEach((t) => result.add(t));
  }

  // Partial phrase matching: "jumprope" → "jump rope"
  for (const [key] of Object.entries(SYNONYM_MAP)) {
    const stripped = key.replace(/[\s-]/g, "");
    if (lower.includes(stripped) || stripped.includes(lower)) {
      result.add(key);
      (EXPANDED[key] || new Set()).forEach((t) => result.add(t));
    }
  }

  return Array.from(result);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface SearchableExercise {
  id: string;
  source_id: string;
  name: string;
  category: string;
  level: string;
  equipment: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
}

function scoreExercise(ex: SearchableExercise, terms: string[]): number {
  const name = ex.name.toLowerCase();
  const cat = ex.category.toLowerCase();
  const equip = (ex.equipment ?? "").toLowerCase();
  const muscles = [...ex.primary_muscles, ...ex.secondary_muscles].map((m) =>
    m.toLowerCase()
  );
  const nameWords = name.split(/[\s\-_]+/);

  let score = 0;

  for (const term of terms) {
    if (term.length < 2) continue;

    // ── Exact matches ────────────────────────────────────────────────
    if (name === term) { score += 120; continue; }
    if (name.startsWith(term + " ") || name.startsWith(term + "-")) { score += 80; continue; }
    if (name.includes(term)) { score += 50; continue; }

    // ── Category / muscle ────────────────────────────────────────────
    if (cat === term) { score += 40; continue; }
    if (cat.includes(term)) { score += 25; }
    if (muscles.some((m) => m === term)) { score += 35; continue; }
    if (muscles.some((m) => m.includes(term))) { score += 20; }
    if (equip.includes(term)) { score += 15; }

    // ── Fuzzy match on individual name words (≥4 chars only) ────────
    if (term.length >= 4) {
      for (const word of nameWords) {
        if (word.length < 4) continue;
        const dist = editDistance(term, word);
        if (dist === 1) { score += 25; break; }
        if (dist === 2 && term.length >= 6) { score += 12; break; }
      }
    }
  }

  // ── Completeness bonus ───────────────────────────────────────────────
  // Exercises with longer names tend to be more specific — slight penalty
  score -= Math.max(0, ex.name.length - 20) * 0.2;

  return score;
}

// ─── Main search function ─────────────────────────────────────────────────────

export interface SearchResult {
  exercises: SearchableExercise[];
  isEmpty: boolean;
  /** When true, no strong matches — caller should show fallback content */
  isFallback: boolean;
}

export function searchExercises(
  exercises: SearchableExercise[],
  rawQuery: string,
  limit = 30
): SearchResult {
  const q = rawQuery.trim();
  if (q.length < 1) return { exercises: [], isEmpty: true, isFallback: false };

  const terms = expandQuery(q);

  const scored = exercises
    .map((ex) => ({ ex, score: scoreExercise(ex, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const strong = scored.filter(({ score }) => score >= 15);

  if (strong.length > 0) {
    return {
      exercises: strong.slice(0, limit).map(({ ex }) => ex),
      isEmpty: false,
      isFallback: false,
    };
  }

  // Weak / no matches → return top-scored regardless (always show something)
  const fallback = scored.slice(0, Math.min(10, limit)).map(({ ex }) => ex);
  return {
    exercises: fallback,
    isEmpty: fallback.length === 0,
    isFallback: true,
  };
}
