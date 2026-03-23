import type { Workout } from "@/types";

// ─── Global 7-day plan ─────────────────────────────────────────────────────
// sourceType: "global" + tenantId: null → available to every gym automatically.

export const GLOBAL_WORKOUTS: Workout[] = [
  // ─── WARM UP (daily) ────────────────────────────────────────────────────
  {
    id: "global-warmup",
    tenantId: null,
    slug: "daily-warm-up",
    title: "Daily Warm Up",
    description:
      "Full-body activation to prime your joints and muscles before any training session. Do this before every daily workout.",
    category: "Warmup",
    difficulty: "beginner",
    estimatedMinutes: 10,
    isFeatured: true,
    isQuickStart: true,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-wu-1", workoutId: "global-warmup", exerciseId: null, order: 1, title: "Jumping Jacks", description: "Stand with feet together, arms at sides. Jump both feet out wide while raising arms overhead, then jump back to start. Keep a light, bouncy rhythm.", mediaUrl: null, durationSeconds: 30, reps: null, sets: null, restSeconds: 10 },
      { id: "g-wu-2", workoutId: "global-warmup", exerciseId: null, order: 2, title: "Air Squats", description: "Stand with feet shoulder-width apart. Lower hips back and down until thighs are parallel to floor, arms forward for balance. Drive through heels to stand.", mediaUrl: null, durationSeconds: null, reps: 15, sets: 1, restSeconds: 10 },
      { id: "g-wu-3", workoutId: "global-warmup", exerciseId: null, order: 3, title: "Shoulder Taps", description: "Start in a high plank. Alternate tapping each shoulder with the opposite hand while keeping hips level. Brace your core to minimize rotation.", mediaUrl: null, durationSeconds: null, reps: 20, sets: 1, restSeconds: 10 },
      { id: "g-wu-4", workoutId: "global-warmup", exerciseId: null, order: 4, title: "Burpees", description: "Drop hands to floor, jump feet back to plank, perform a push-up, jump feet forward, then explode into a jump with arms overhead. Move with control.", mediaUrl: null, durationSeconds: null, reps: 10, sets: 1, restSeconds: 15 },
      { id: "g-wu-5", workoutId: "global-warmup", exerciseId: null, order: 5, title: "Toe Touches", description: "Stand tall with feet hip-width apart. Reach down toward your toes, bending at the hips. Keep legs as straight as comfortable and return slowly.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 1, restSeconds: 10 },
      { id: "g-wu-6", workoutId: "global-warmup", exerciseId: null, order: 6, title: "Jump Rope", description: "Jump rope or simulate by hopping in place while swinging wrists. Maintain a quick, rhythmic tempo with soft knees on every landing.", mediaUrl: null, durationSeconds: 60, reps: null, sets: 1, restSeconds: 15 },
      { id: "g-wu-7", workoutId: "global-warmup", exerciseId: null, order: 7, title: "Hip Rotation", description: "Stand with hands on hips. Make large, slow circles with your hips clockwise, then counter-clockwise. Keep upper body stable and feet planted.", mediaUrl: null, durationSeconds: 30, reps: null, sets: 1, restSeconds: 10 },
      { id: "g-wu-8", workoutId: "global-warmup", exerciseId: null, order: 8, title: "Spider-Man Steps", description: "From a plank position, bring one foot forward outside your same-side hand. Return and alternate sides. Open your hips fully on each step.", mediaUrl: null, durationSeconds: null, reps: 10, sets: 1, restSeconds: 10 },
      { id: "g-wu-9", workoutId: "global-warmup", exerciseId: null, order: 9, title: "Lunges", description: "Step forward and lower your back knee toward the floor. Push off your front foot to return to standing. Keep torso upright throughout. Alternate legs.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 1, restSeconds: 10 },
    ],
  },

  // ─── EVERYDAY ABS ───────────────────────────────────────────────────────
  {
    id: "global-everyday-abs",
    tenantId: null,
    slug: "everyday-abs",
    title: "Everyday Abs",
    description:
      "Core finisher to be done alongside your daily workout. 4 sets × 12 reps of each exercise.",
    category: "Abs",
    difficulty: "beginner",
    estimatedMinutes: 15,
    isFeatured: false,
    isQuickStart: true,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-abs-1", workoutId: "global-everyday-abs", exerciseId: null, order: 1, title: "Leg Raises", description: "Lie flat on your back, legs straight. Keeping your lower back pressed to the floor, raise both legs to 90° then lower slowly without letting them touch.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 20 },
      { id: "g-abs-2", workoutId: "global-everyday-abs", exerciseId: null, order: 2, title: "Bicycle Crunches", description: "Lie on your back, hands behind head. Drive one knee toward the opposite elbow while extending the other leg. Rotate through the torso, not just the elbow.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 20 },
      { id: "g-abs-3", workoutId: "global-everyday-abs", exerciseId: null, order: 3, title: "Crunches", description: "Lie on your back with knees bent. Curl your upper back off the floor by contracting your abs. Lower with control — avoid pulling on your neck.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 20 },
      { id: "g-abs-4", workoutId: "global-everyday-abs", exerciseId: null, order: 4, title: "Lying Toe Touches", description: "Lie on your back with legs raised straight up. Reach both hands toward your toes, lifting your shoulders off the floor. Lower with control.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 20 },
      { id: "g-abs-5", workoutId: "global-everyday-abs", exerciseId: null, order: 5, title: "Heel Touches", description: "Lie on your back, knees bent, feet flat. Crunch slightly and reach each hand alternately to touch the same-side heel. Keep tension in your obliques throughout.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 20 },
    ],
  },

  // ─── DAY 1 — LEGS ───────────────────────────────────────────────────────
  {
    id: "global-day1-legs",
    tenantId: null,
    slug: "day-1-legs",
    title: "Day 1 — Legs",
    description:
      "Complete lower body session hitting quads, hamstrings, glutes, and calves. 4 sets × 12 reps.",
    category: "Legs",
    difficulty: "intermediate",
    estimatedMinutes: 50,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-lg-1", workoutId: "global-day1-legs", exerciseId: null, order: 1, title: "Barbell / Goblet Squat", description: "Barbell: bar on upper traps, feet shoulder-width. Squat below parallel keeping chest tall. Goblet variation: hold a dumbbell at chest height and squat deep.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-lg-2", workoutId: "global-day1-legs", exerciseId: null, order: 2, title: "Leg Extension", description: "Sit in the leg extension machine with pad resting on your shins. Extend both legs until straight, squeeze at the top, then lower slowly to 90°.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-lg-3", workoutId: "global-day1-legs", exerciseId: null, order: 3, title: "Leg Press", description: "Sit in the leg press with feet hip-width apart. Lower the sled until knees reach 90°, then press back without locking out. Keep lower back flat against the pad.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-lg-4", workoutId: "global-day1-legs", exerciseId: null, order: 4, title: "Romanian / Sumo Deadlift", description: "Romanian: hinge at hips with a flat back, lower bar along legs until deep hamstring stretch. Sumo: wide stance, toes out, grips inside knees — drive hips through at the top.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 75 },
      { id: "g-lg-5", workoutId: "global-day1-legs", exerciseId: null, order: 5, title: "Leg Curl", description: "Lie face-down on the leg curl machine. Curl heels toward glutes through the full range of motion. Squeeze at the top, lower slowly under control.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-lg-6", workoutId: "global-day1-legs", exerciseId: null, order: 6, title: "Calf Raises", description: "Stand on the edge of a step or flat ground. Rise onto toes as high as possible, hold for a beat, then lower the heel below platform level for full stretch.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 30 },
      { id: "g-lg-7", workoutId: "global-day1-legs", exerciseId: null, order: 7, title: "Walking Lunges", description: "Step forward and lower your back knee toward the floor. Push off your front foot and step through into the next lunge. Keep torso upright and core braced.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
    ],
  },

  // ─── DAY 2 — BACK ───────────────────────────────────────────────────────
  {
    id: "global-day2-back",
    tenantId: null,
    slug: "day-2-back",
    title: "Day 2 — Back",
    description:
      "Thickness and width session targeting lats, rhomboids, traps, and spinal erectors. 4 sets × 12 reps.",
    category: "Back",
    difficulty: "intermediate",
    estimatedMinutes: 45,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-bk-1", workoutId: "global-day2-back", exerciseId: null, order: 1, title: "Incline Barbell / Dumbbell Rows", description: "Set bench to 45°. Lie chest-down on the pad. Row the bar or dumbbells to your lower chest, driving elbows back. Squeeze shoulder blades at the top.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-bk-2", workoutId: "global-day2-back", exerciseId: null, order: 2, title: "Wide Lat Pulldown", description: "Grip the bar wider than shoulder-width, palms facing away. Pull down to your upper chest leaning back slightly. Squeeze lats at the bottom, return slowly.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-bk-3", workoutId: "global-day2-back", exerciseId: null, order: 3, title: "Dumbbell / Barbell Shrugs", description: "Hold dumbbells at your sides or a barbell in front. Shrug your shoulders straight up as high as possible, hold for a beat, then lower slowly. No rolling.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-bk-4", workoutId: "global-day2-back", exerciseId: null, order: 4, title: "Barbell Deadlift", description: "Bar over mid-foot, hip-width stance. Hinge and grip the bar. Keep chest up and back flat — drive through the floor and lock out hips at the top. Control the descent.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 90 },
      { id: "g-bk-5", workoutId: "global-day2-back", exerciseId: null, order: 5, title: "One Arm Row", description: "Support yourself on a bench with the opposite hand and knee. Row the dumbbell from full stretch up to your hip. Keep back flat, don't twist the torso.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
    ],
  },

  // ─── DAY 3 — CARDIO ─────────────────────────────────────────────────────
  {
    id: "global-day3-cardio",
    tenantId: null,
    slug: "day-3-cardio",
    title: "Day 3 — Cardio",
    description:
      "45-minute moderate-intensity cardio session. Improves endurance and accelerates recovery between heavy training days.",
    category: "Cardio",
    difficulty: "beginner",
    estimatedMinutes: 45,
    isFeatured: false,
    isQuickStart: true,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-cd-1", workoutId: "global-day3-cardio", exerciseId: null, order: 1, title: "Burpees / Mountain Climbers / Inch Worm", description: "Circuit: 10 burpees → 20 mountain climbers → 5 inch worms (walk hands out to plank and back). Rest 30 s and repeat for 10 minutes to elevate heart rate.", mediaUrl: null, durationSeconds: 600, reps: null, sets: null, restSeconds: 30 },
      { id: "g-cd-2", workoutId: "global-day3-cardio", exerciseId: null, order: 2, title: "Cycling / Running", description: "Steady-state cardio at moderate intensity — you should be able to hold a conversation. Aim for 20–25 minutes on the bike or treadmill.", mediaUrl: null, durationSeconds: 1500, reps: null, sets: null, restSeconds: null },
      { id: "g-cd-3", workoutId: "global-day3-cardio", exerciseId: null, order: 3, title: "Aerobics Cool-Down", description: "Low-impact aerobics or a brisk walk for the final 10 minutes. Allow heart rate to come down gradually while staying active.", mediaUrl: null, durationSeconds: 600, reps: null, sets: null, restSeconds: null },
    ],
  },

  // ─── DAY 4 — CHEST ──────────────────────────────────────────────────────
  {
    id: "global-day4-chest",
    tenantId: null,
    slug: "day-4-chest",
    title: "Day 4 — Chest",
    description:
      "Full chest session covering upper, middle, and inner chest with pressing and fly movements. 4 sets × 12 reps.",
    category: "Chest",
    difficulty: "intermediate",
    estimatedMinutes: 55,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-ch-1", workoutId: "global-day4-chest", exerciseId: null, order: 1, title: "Bench Press", description: "Lie on a flat bench with a grip slightly wider than shoulders. Lower the bar to your lower chest, then press back up. Keep shoulder blades pinched and feet flat.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 75 },
      { id: "g-ch-2", workoutId: "global-day4-chest", exerciseId: null, order: 2, title: "Incline Dumbbell Press", description: "Set bench to 30–45°. Press dumbbells from upper chest upward until arms are fully extended. Controls the upper pec and front delt. Lower slowly.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-ch-3", workoutId: "global-day4-chest", exerciseId: null, order: 3, title: "Flat Bench Dumbbell Press", description: "Lie flat holding dumbbells at chest height. Press straight up, then lower with elbows at ~45° to protect shoulders. Full range of motion.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-ch-4", workoutId: "global-day4-chest", exerciseId: null, order: 4, title: "Flat Bench Dumbbell Flies", description: "Lie flat with arms extended above chest, palms facing each other. Open arms in a wide arc until you feel a deep chest stretch, then bring back together.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-ch-5", workoutId: "global-day4-chest", exerciseId: null, order: 5, title: "Incline Machine Press", description: "Adjust the incline press machine seat so the handles are at upper-chest height. Press out to full extension and return with control — steady tempo.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-ch-6", workoutId: "global-day4-chest", exerciseId: null, order: 6, title: "Forearm Curls", description: "Seated or standing, hold a barbell with an underhand grip. Curl the bar by flexing only your wrists. Lower slowly. Strengthens forearms and grip for pressing lifts.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 30 },
      { id: "g-ch-7", workoutId: "global-day4-chest", exerciseId: null, order: 7, title: "Dumbbell Hammer Curl", description: "Hold dumbbells with a neutral (hammer) grip, palms facing each other. Curl both arms simultaneously to shoulder height. Lower slowly. Targets brachialis and brachioradialis.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
    ],
  },

  // ─── DAY 5 — SHOULDERS ──────────────────────────────────────────────────
  {
    id: "global-day5-shoulders",
    tenantId: null,
    slug: "day-5-shoulders",
    title: "Day 5 — Shoulders",
    description:
      "Complete shoulder session covering all three delt heads plus traps. 4 sets × 12 reps.",
    category: "Shoulders",
    difficulty: "intermediate",
    estimatedMinutes: 50,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-sh-1", workoutId: "global-day5-shoulders", exerciseId: null, order: 1, title: "Seated Military Press", description: "Sit upright on a bench with back support. Press a barbell from chin height to lockout overhead. Keep core braced and avoid arching the lower back.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 75 },
      { id: "g-sh-2", workoutId: "global-day5-shoulders", exerciseId: null, order: 2, title: "Arnold Dumbbell Press", description: "Start with dumbbells at chin height, palms facing you. As you press up, rotate your palms outward so they face forward at the top. Reverse on the way down.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-sh-3", workoutId: "global-day5-shoulders", exerciseId: null, order: 3, title: "Bent Over Rear Delt Raise", description: "Hinge forward at 45°. Raise dumbbells out to the sides with a slight bend in the elbows, leading with the elbows. Targets the rear deltoid. Lower with control.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-sh-4", workoutId: "global-day5-shoulders", exerciseId: null, order: 4, title: "Dumbbell Front Raises", description: "Hold dumbbells in front of thighs. Raise one or both arms to shoulder height with a slight bend in the elbows. Lower slowly. Targets the anterior delt.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-sh-5", workoutId: "global-day5-shoulders", exerciseId: null, order: 5, title: "Upright Barbell Row", description: "Grip a barbell with hands shoulder-width apart. Pull it straight up to chin height with elbows flaring out. Lower with control. Keep the bar close to your body.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-sh-6", workoutId: "global-day5-shoulders", exerciseId: null, order: 6, title: "Face Pull", description: "Set a cable to head height with a rope attachment. Pull the rope toward your face, separating the handles at the end. Squeezes rear delts and rotator cuff. Great for shoulder health.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
    ],
  },

  // ─── DAY 6 — ARMS ───────────────────────────────────────────────────────
  {
    id: "global-day6-arms",
    tenantId: null,
    slug: "day-6-arms",
    title: "Day 6 — Arms",
    description:
      "Dedicated bicep and tricep session for size and definition. 4 sets × 12 reps.",
    category: "Arms",
    difficulty: "intermediate",
    estimatedMinutes: 45,
    isFeatured: false,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-ar-1", workoutId: "global-day6-arms", exerciseId: null, order: 1, title: "Incline Dumbbell Curls", description: "Set bench to 60°. Sit back and let arms hang straight. Curl both dumbbells simultaneously, keeping elbows behind the body for a deep bicep stretch.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-ar-2", workoutId: "global-day6-arms", exerciseId: null, order: 2, title: "Standing Barbell Curl", description: "Grip the barbell shoulder-width with an underhand grip. Curl to shoulder height without swinging. Lower fully and feel the stretch at the bottom.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-ar-3", workoutId: "global-day6-arms", exerciseId: null, order: 3, title: "Concentrated Dumbbell Curl", description: "Sit on a bench, elbow braced on inner thigh. Curl the dumbbell to your shoulder, fully contracting the bicep at the top. Isolates the bicep peak.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-ar-4", workoutId: "global-day6-arms", exerciseId: null, order: 4, title: "Skull Crusher", description: "Lie on a flat bench holding an EZ-bar or dumbbells above your chest, arms straight. Bend only at the elbows, lowering the weight toward your forehead. Press back up.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 60 },
      { id: "g-ar-5", workoutId: "global-day6-arms", exerciseId: null, order: 5, title: "Triceps Pushdown", description: "Stand at a cable station with a bar or rope attachment at head height. Push the attachment down until arms are fully extended. Keep elbows pinned to your sides.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
      { id: "g-ar-6", workoutId: "global-day6-arms", exerciseId: null, order: 6, title: "Overhead Tricep Extension", description: "Hold a dumbbell or EZ-bar overhead with both hands. Lower the weight behind your head by bending elbows, then extend back to straight. Keep upper arms vertical.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 4, restSeconds: 45 },
    ],
  },

  // ─── DAY 7 — REST ───────────────────────────────────────────────────────
  {
    id: "global-day7-rest",
    tenantId: null,
    slug: "day-7-rest",
    title: "Day 7 — Rest & Recovery",
    description:
      "Active recovery or complete rest. Your muscles grow during rest — this day is as important as any training day.",
    category: "Rest",
    difficulty: "beginner",
    estimatedMinutes: 30,
    isFeatured: false,
    isQuickStart: false,
    isPublished: true,
    sourceType: "global",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      { id: "g-rs-1", workoutId: "global-day7-rest", exerciseId: null, order: 1, title: "Light Walk or Easy Swim", description: "A 20–30 minute easy walk outdoors or gentle swim. Keep heart rate low. This promotes blood flow to fatigued muscles without adding stress.", mediaUrl: null, durationSeconds: 1800, reps: null, sets: null, restSeconds: null },
      { id: "g-rs-2", workoutId: "global-day7-rest", exerciseId: null, order: 2, title: "Full-Body Stretch", description: "Hold each stretch for 30–60 seconds: hip flexors, hamstrings, quads, chest, lats, shoulders. Breathe deeply into each stretch — no bouncing.", mediaUrl: null, durationSeconds: 600, reps: null, sets: null, restSeconds: null },
      { id: "g-rs-3", workoutId: "global-day7-rest", exerciseId: null, order: 3, title: "Foam Roll", description: "Slowly roll over quads, IT band, glutes, upper back, and lats. Pause on any tender spots for 30–60 seconds. Aids in myofascial release and recovery.", mediaUrl: null, durationSeconds: 600, reps: null, sets: null, restSeconds: null },
    ],
  },
];

// ─── Legacy tenant-specific workouts (Iron House Gym) ─────────────────────
// These remain for backwards compatibility with any existing tenant sessions.

const TENANT_ID = "tenant-iron-house";

export const TENANT_WORKOUTS: Workout[] = [
  {
    id: "workout-dynamic-warmup",
    tenantId: TENANT_ID,
    slug: "dynamic-warmup-flow",
    title: "Dynamic Warmup Flow",
    description: "A full-body activation sequence to prime your joints and muscles before any training session.",
    category: "Warmup",
    difficulty: "beginner",
    estimatedMinutes: 10,
    isFeatured: false,
    isQuickStart: true,
    isPublished: true,
    sourceType: "tenant",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    steps: [
      { id: "s-dw-1", workoutId: "workout-dynamic-warmup", exerciseId: null, order: 1, title: "Arm Circles", description: "Stand with feet shoulder-width apart. Extend both arms out to the sides and make large, controlled circles. Forward for 15 reps, then reverse for 15 reps.", mediaUrl: null, durationSeconds: null, reps: 15, sets: 2, restSeconds: 15 },
      { id: "s-dw-2", workoutId: "workout-dynamic-warmup", exerciseId: null, order: 2, title: "Hip Circles", description: "Stand with hands on hips. Make large, slow circles with your hips.", mediaUrl: null, durationSeconds: 30, reps: null, sets: null, restSeconds: 10 },
      { id: "s-dw-3", workoutId: "workout-dynamic-warmup", exerciseId: null, order: 3, title: "Leg Swings", description: "Hold a wall for balance. Swing one leg forward and back in a controlled arc.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 2, restSeconds: 10 },
      { id: "s-dw-4", workoutId: "workout-dynamic-warmup", exerciseId: null, order: 4, title: "High Knees", description: "Run in place, driving knees up to hip height on each step.", mediaUrl: null, durationSeconds: 30, reps: null, sets: null, restSeconds: 15 },
      { id: "s-dw-5", workoutId: "workout-dynamic-warmup", exerciseId: null, order: 5, title: "Thoracic Rotations", description: "Half-kneeling. Place one hand behind head and rotate elbow toward the ceiling.", mediaUrl: null, durationSeconds: null, reps: 10, sets: 2, restSeconds: 15 },
    ],
  },
  {
    id: "workout-dumbbell-chest-press",
    tenantId: TENANT_ID,
    slug: "dumbbell-chest-press",
    title: "Dumbbell Chest Press",
    description: "A beginner-friendly chest session using dumbbells to build foundational pressing strength and muscle.",
    category: "Chest",
    difficulty: "beginner",
    estimatedMinutes: 25,
    isFeatured: true,
    isQuickStart: true,
    isPublished: true,
    sourceType: "tenant",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    steps: [
      { id: "s-dcp-1", workoutId: "workout-dumbbell-chest-press", exerciseId: null, order: 1, title: "Flat Dumbbell Press", description: "Press from chest height upward, shoulder blades pinched.", mediaUrl: null, durationSeconds: null, reps: 10, sets: 3, restSeconds: 60 },
      { id: "s-dcp-2", workoutId: "workout-dumbbell-chest-press", exerciseId: null, order: 2, title: "Incline Dumbbell Press", description: "30–45° incline. Targets upper pec and front delt.", mediaUrl: null, durationSeconds: null, reps: 10, sets: 3, restSeconds: 60 },
      { id: "s-dcp-3", workoutId: "workout-dumbbell-chest-press", exerciseId: null, order: 3, title: "Dumbbell Chest Fly", description: "Wide arc, feel the stretch across the chest at the bottom.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 3, restSeconds: 45 },
      { id: "s-dcp-4", workoutId: "workout-dumbbell-chest-press", exerciseId: null, order: 4, title: "Push-Up Finisher", description: "Standard push-ups. Squeeze chest at the top of each rep.", mediaUrl: null, durationSeconds: null, reps: 15, sets: 2, restSeconds: 30 },
    ],
  },
  {
    id: "workout-pull-up-strength",
    tenantId: TENANT_ID,
    slug: "pull-up-strength",
    title: "Pull-Up Strength",
    description: "Build pulling strength and back width through a structured pull-up progression.",
    category: "Back",
    difficulty: "intermediate",
    estimatedMinutes: 30,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "tenant",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    steps: [
      { id: "s-pus-1", workoutId: "workout-pull-up-strength", exerciseId: null, order: 1, title: "Dead Hang", description: "Hang fully from the bar, arms straight. Decompresses the spine.", mediaUrl: null, durationSeconds: 30, reps: null, sets: 2, restSeconds: 45 },
      { id: "s-pus-2", workoutId: "workout-pull-up-strength", exerciseId: null, order: 2, title: "Pull-Up", description: "Pull until chin clears bar. Lower slowly.", mediaUrl: null, durationSeconds: null, reps: 6, sets: 3, restSeconds: 90 },
      { id: "s-pus-3", workoutId: "workout-pull-up-strength", exerciseId: null, order: 3, title: "Inverted Row", description: "Set barbell at hip height. Pull chest to bar with rigid body.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 3, restSeconds: 60 },
      { id: "s-pus-4", workoutId: "workout-pull-up-strength", exerciseId: null, order: 4, title: "Band Pull-Apart", description: "Pull resistance band apart at shoulder height until it touches chest.", mediaUrl: null, durationSeconds: null, reps: 15, sets: 3, restSeconds: 30 },
    ],
  },
  {
    id: "workout-leg-day-starter",
    tenantId: TENANT_ID,
    slug: "leg-day-starter",
    title: "Leg Day Starter",
    description: "A foundational lower body session covering all major leg muscle groups.",
    category: "Legs",
    difficulty: "beginner",
    estimatedMinutes: 35,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "tenant",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    steps: [
      { id: "s-lds-1", workoutId: "workout-leg-day-starter", exerciseId: null, order: 1, title: "Bodyweight Squat", description: "Lower until thighs are parallel. Drive through heels to stand.", mediaUrl: null, durationSeconds: null, reps: 15, sets: 3, restSeconds: 45 },
      { id: "s-lds-2", workoutId: "workout-leg-day-starter", exerciseId: null, order: 2, title: "Romanian Deadlift", description: "Hinge at hips. Feel the hamstring stretch, drive hips forward.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 3, restSeconds: 60 },
      { id: "s-lds-3", workoutId: "workout-leg-day-starter", exerciseId: null, order: 3, title: "Leg Press", description: "Lower sled to 90°. Press back without locking out.", mediaUrl: null, durationSeconds: null, reps: 12, sets: 3, restSeconds: 60 },
      { id: "s-lds-4", workoutId: "workout-leg-day-starter", exerciseId: null, order: 4, title: "Standing Calf Raise", description: "Rise onto toes, hold, lower through full range.", mediaUrl: null, durationSeconds: null, reps: 20, sets: 3, restSeconds: 30 },
    ],
  },
  {
    id: "workout-hiit-cardio-blast",
    tenantId: TENANT_ID,
    slug: "hiit-cardio-blast",
    title: "HIIT Cardio Blast",
    description: "High-intensity intervals using bodyweight movements. Maximum effort, minimum equipment.",
    category: "Cardio",
    difficulty: "advanced",
    estimatedMinutes: 25,
    isFeatured: true,
    isQuickStart: false,
    isPublished: true,
    sourceType: "tenant",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    steps: [
      { id: "s-hcb-1", workoutId: "workout-hiit-cardio-blast", exerciseId: null, order: 1, title: "Jump Squats", description: "Squat and explode into a jump. Land softly and go straight into the next rep.", mediaUrl: null, durationSeconds: 40, reps: null, sets: 4, restSeconds: 20 },
      { id: "s-hcb-2", workoutId: "workout-hiit-cardio-blast", exerciseId: null, order: 2, title: "Burpees", description: "Full burpee: plank, push-up, jump with arms overhead.", mediaUrl: null, durationSeconds: 40, reps: null, sets: 4, restSeconds: 20 },
      { id: "s-hcb-3", workoutId: "workout-hiit-cardio-blast", exerciseId: null, order: 3, title: "Mountain Climbers", description: "Plank position. Drive knees to chest at high speed.", mediaUrl: null, durationSeconds: 40, reps: null, sets: 4, restSeconds: 20 },
      { id: "s-hcb-4", workoutId: "workout-hiit-cardio-blast", exerciseId: null, order: 4, title: "Sprint in Place", description: "Run as fast as you can in place. Drive knees high.", mediaUrl: null, durationSeconds: 40, reps: null, sets: 4, restSeconds: 60 },
    ],
  },
];

// ─── Combined export ───────────────────────────────────────────────────────
// Global workouts first so they appear at the top of any list.
export const mockWorkouts: Workout[] = [...GLOBAL_WORKOUTS, ...TENANT_WORKOUTS];
