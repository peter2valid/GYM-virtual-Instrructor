import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing config.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Get all workout template items without an exercise_id
  const { data: items, error: itemErr } = await supabase
    .from("workout_template_items")
    .select("id, title")
    .is("exercise_id", null);

  if (itemErr) {
    console.error("Error fetching items:", itemErr.message);
    process.exit(1);
  }

  console.log(`Found ${items.length} items to link.`);

  // 2. Get all exercises to match against
  const { data: exercises, error: exErr } = await supabase
    .from("exercises")
    .select("id, name");

  if (exErr) {
    console.error("Error fetching exercises:", exErr.message);
    process.exit(1);
  }

  const nameToId = new Map(exercises.map(ex => [ex.name.toLowerCase().trim(), ex.id]));

  const aliases: Record<string, string> = {
    "standard push-up": "pushups",
    "push-up": "pushups",
    "push up": "pushups",
    "leg swings": "dynamic leg swings",
    "high knees": "high knees run in place",
    "arm circles": "arm circles",
    "hip circles": "hip circles",
    "thoracic rotations": "thoracic rotations",
    "flat dumbbell press": "dumbbell bench press",
    "incline dumbbell press": "incline dumbbell bench press",
    "dumbbell chest fly": "dumbbell flyes",
    "push-up finisher": "pushups",
    "wide-grip push-up": "wide-grip pushups",
    "diamond push-up": "close-grip pushup",
    "slow negative push-up": "pushups",
    "dead hang": "dead hang",
    "pull-up": "pullups",
    "band pull-apart": "band pull apart",
    "seated cable row": "seated cable rows",
    "lat pulldown": "wide-grip lat pulldown",
    "single-arm dumbbell row": "one-arm dumbbell row",
    "leg day starter": "leg press",
    "walking lunge": "walking lunges",
    "spider-man steps": "spiderman crawl",
    "spider-man step": "spiderman crawl",
    "moderate jog": "jogging-5 mph",
    "easy walk": "walking, treadmill",
    "jump squats": "jump squat",
    "burpees": "burpee",
    "mountain climbers": "mountain climbers",
    "jump rope": "jump rope",
    "sprint in place": "running, high knees",
    "kettlebell swing": "kettlebell swing",
    "goblet squat": "goblet squat",
    "kb clean & press": "kettlebell clean and press",
    "kb romanian deadlift": "kettlebell romanian deadlift",
    "kb farmer''s carry": "farmers walk",
    "farmers carry": "farmers walk"
  };

  // 3. Update items
  let linked = 0;
  for (const item of items) {
    const cleanTitle = item.title.toLowerCase().trim();
    let exerciseId = nameToId.get(cleanTitle);

    if (!exerciseId && aliases[cleanTitle]) {
      exerciseId = nameToId.get(aliases[cleanTitle]);
    }

    if (!exerciseId) {
      // Direct substring match as fallback
      for (const [name, id] of nameToId) {
        if (name.includes(cleanTitle) || cleanTitle.includes(name)) {
          exerciseId = id;
          break;
        }
      }
    }
    if (exerciseId) {
      const { error: upErr } = await supabase
        .from("workout_template_items")
        .update({ exercise_id: exerciseId })
        .eq("id", item.id);

      if (upErr) {
        console.error(`Error linking ${item.title}:`, upErr.message);
      } else {
        linked++;
      }
    }
  }

  console.log(`Successfully linked ${linked} workout items to exercises.`);
}

main().catch(console.error);
