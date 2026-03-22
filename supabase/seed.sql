-- ============================================================
-- Seed: Iron House Gym
-- Development seed for Phase 2.
-- Uses fixed UUIDs so seed is idempotent (safe to re-run).
-- ============================================================

-- ─── TENANT ──────────────────────────────────────────────────────────────────

insert into tenants (id, name, slug, subscription_plan, subscription_status, is_active)
values ('00000000-0000-0000-0001-000000000001', 'Iron House Gym', 'iron-house', 'starter', 'active', true)
on conflict (id) do nothing;

-- ─── TENANT SETTINGS ─────────────────────────────────────────────────────────

insert into tenant_settings (tenant_id, show_login_required, show_quick_start, default_recommendation_mode)
values ('00000000-0000-0000-0001-000000000001', false, true, 'manual')
on conflict (tenant_id) do nothing;

-- ─── FEATURE FLAGS (starter plan — all off) ───────────────────────────────────

insert into feature_flags (tenant_id, feature_key, enabled) values
  ('00000000-0000-0000-0001-000000000001', 'member_login',           false),
  ('00000000-0000-0000-0001-000000000001', 'attendance_tracking',    false),
  ('00000000-0000-0000-0001-000000000001', 'workout_history',        false),
  ('00000000-0000-0000-0001-000000000001', 'member_dashboard',       false),
  ('00000000-0000-0000-0001-000000000001', 'gym_admin_dashboard',    false),
  ('00000000-0000-0000-0001-000000000001', 'premium_branding',       false),
  ('00000000-0000-0000-0001-000000000001', 'advanced_analytics',     false),
  ('00000000-0000-0000-0001-000000000001', 'custom_recommendations',  false)
on conflict (tenant_id, feature_key) do nothing;

-- ─── EQUIPMENT TYPES (global catalog) ────────────────────────────────────────

insert into equipment_types (id, name, slug) values
  ('00000000-0000-0000-0002-000000000001', 'Dumbbells',         'dumbbell'),
  ('00000000-0000-0000-0002-000000000002', 'Barbell',           'barbell'),
  ('00000000-0000-0000-0002-000000000003', 'Pull-Up Bar',       'pull-up-bar'),
  ('00000000-0000-0000-0002-000000000004', 'Cable Machine',     'cable-machine'),
  ('00000000-0000-0000-0002-000000000005', 'Leg Press Machine', 'leg-press'),
  ('00000000-0000-0000-0002-000000000006', 'Treadmill',         'treadmill'),
  ('00000000-0000-0000-0002-000000000007', 'Kettlebells',       'kettlebell'),
  ('00000000-0000-0000-0002-000000000008', 'Resistance Bands',  'resistance-bands'),
  ('00000000-0000-0000-0002-000000000009', 'Bench',             'bench'),
  ('00000000-0000-0000-0002-000000000010', 'Squat Rack',        'squat-rack'),
  ('00000000-0000-0000-0002-000000000011', 'Body Only',         'body-only')
on conflict (id) do nothing;

-- ─── TENANT EQUIPMENT PROFILE (Iron House — full facility) ───────────────────

insert into tenant_equipment_profiles (tenant_id, equipment_type_id, is_available) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000003', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000004', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000005', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000006', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000007', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000008', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000009', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000010', true),
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000011', true)
on conflict (tenant_id, equipment_type_id) do nothing;

-- ─── EXERCISES (curated sample — full import via scripts/import-exercises.ts) ─

insert into exercises (id, source_id, source_name, slug, name, category, level, equipment, primary_muscles, secondary_muscles, instructions) values
  (
    '00000000-0000-0000-0003-000000000001',
    'Arm_Circles', 'free-exercise-db', 'arm-circles', 'Arm Circles',
    'stretching', 'beginner', 'body only',
    '["shoulders"]'::jsonb, '[]'::jsonb,
    '["Stand with feet shoulder-width apart. Extend both arms out to the sides.", "Make large, controlled circles forward for 15 reps, then reverse."]'::jsonb
  ),
  (
    '00000000-0000-0000-0003-000000000002',
    'Hip_Circles', 'free-exercise-db', 'hip-circles', 'Hip Circles',
    'stretching', 'beginner', 'body only',
    '["hips"]'::jsonb, '["abdominals"]'::jsonb,
    '["Stand with hands on hips.", "Make large, slow circles with your hips. Keep your upper body stable."]'::jsonb
  ),
  (
    '00000000-0000-0000-0003-000000000003',
    'Dumbbell_Bench_Press', 'free-exercise-db', 'flat-dumbbell-press', 'Flat Dumbbell Press',
    'strength', 'beginner', 'dumbbell',
    '["chest"]'::jsonb, '["triceps","shoulders"]'::jsonb,
    '["Lie on a flat bench holding dumbbells at chest height, palms facing forward.", "Press up until arms are extended, then lower slowly.", "Keep shoulder blades pinched throughout."]'::jsonb
  ),
  (
    '00000000-0000-0000-0003-000000000004',
    'Barbell_Squat', 'free-exercise-db', 'barbell-back-squat', 'Barbell Back Squat',
    'strength', 'intermediate', 'barbell',
    '["quadriceps","glutes"]'::jsonb, '["hamstrings","calves","lower back"]'::jsonb,
    '["Bar rests across your upper traps. Feet shoulder-width, toes slightly out.", "Squat below parallel, keeping your chest tall and knees tracking over toes.", "Drive hard out of the hole."]'::jsonb
  ),
  (
    '00000000-0000-0000-0003-000000000005',
    'Kettlebell_Swing', 'free-exercise-db', 'kettlebell-swing', 'Kettlebell Swing',
    'strength', 'intermediate', 'kettlebells',
    '["hamstrings","glutes"]'::jsonb, '["abdominals","shoulders","lower back"]'::jsonb,
    '["Hinge at the hips and swing the bell between your legs.", "Drive your hips forward powerfully to project the bell up to chest height.", "This is a hip hinge, not a squat."]'::jsonb
  )
on conflict (id) do nothing;

-- ─── WORKOUTS ─────────────────────────────────────────────────────────────────

insert into workouts (id, tenant_id, title, slug, description, category, difficulty, estimated_duration_minutes, is_featured, is_quick_start, is_published, recommendation_priority, source_type) values
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0001-000000000001',
   'Dynamic Warmup Flow', 'dynamic-warmup-flow',
   'A full-body activation sequence to prime your joints and muscles before any training session.',
   'Warmup', 'beginner', 10, false, true, true, 100, 'tenant'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0001-000000000001',
   'Dumbbell Chest Press', 'dumbbell-chest-press',
   'A beginner-friendly chest session using dumbbells to build foundational pressing strength and muscle.',
   'Chest', 'beginner', 25, true, true, true, 90, 'tenant'),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0001-000000000001',
   'Push-Up Burn', 'push-up-burn',
   'An equipment-free chest and tricep burner using progressive push-up variations.',
   'Chest', 'intermediate', 20, false, false, true, 70, 'tenant'),
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0001-000000000001',
   'Pull-Up Strength', 'pull-up-strength',
   'Build pulling strength and back width through a structured pull-up progression and accessory work.',
   'Back', 'intermediate', 30, true, false, true, 80, 'tenant'),
  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0001-000000000001',
   'Seated Cable Row', 'seated-cable-row',
   'A focused back thickness session built around the seated cable row and dumbbell accessories.',
   'Back', 'beginner', 25, false, false, true, 60, 'tenant'),
  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0001-000000000001',
   'Leg Day Starter', 'leg-day-starter',
   'A foundational lower body session covering all major leg muscle groups with manageable volume.',
   'Legs', 'beginner', 35, true, false, true, 85, 'tenant'),
  ('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0001-000000000001',
   'Squat & Lunge Circuit', 'squat-lunge-circuit',
   'An intermediate lower body circuit combining barbell squats, lunges, and explosive movements.',
   'Legs', 'intermediate', 30, false, false, true, 65, 'tenant'),
  ('00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0001-000000000001',
   'Treadmill Fat Burn', 'treadmill-fat-burn',
   'A structured 30-minute treadmill session with alternating intensity zones for fat burning.',
   'Cardio', 'beginner', 30, false, true, true, 75, 'tenant'),
  ('00000000-0000-0000-0004-000000000009', '00000000-0000-0000-0001-000000000001',
   'HIIT Cardio Blast', 'hiit-cardio-blast',
   'High-intensity intervals using bodyweight movements. Maximum effort, minimum equipment.',
   'Cardio', 'advanced', 25, true, false, true, 70, 'tenant'),
  ('00000000-0000-0000-0004-000000000010', '00000000-0000-0000-0001-000000000001',
   'Kettlebell Conditioning', 'kettlebell-conditioning',
   'A full-body kettlebell session that builds strength, power, and conditioning simultaneously.',
   'Full Body', 'intermediate', 35, true, false, true, 80, 'tenant')
on conflict (id) do nothing;

-- ─── WORKOUT STEPS ────────────────────────────────────────────────────────────

-- Dynamic Warmup Flow (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001', 1, 'Arm Circles',
   'Stand with feet shoulder-width apart. Extend both arms out to the sides and make large, controlled circles. Forward for 15 reps, then reverse for 15 reps.',
   15, 2, 15, null),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000001', 2, 'Hip Circles',
   'Stand with hands on hips. Make large, slow circles with your hips. Keep your upper body stable and your feet planted.',
   null, null, 10, 30),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0004-000000000001', 3, 'Leg Swings',
   'Hold a wall for balance. Swing one leg forward and back in a controlled arc. Keep the swing smooth, not forced. Switch legs after each set.',
   12, 2, 10, null),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0004-000000000001', 4, 'High Knees',
   'Run in place, driving your knees up to hip height on each step. Pump your arms in sync. Keep a light, bouncy rhythm.',
   null, null, 15, 30),
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0004-000000000001', 5, 'Thoracic Rotations',
   'Get into a half-kneeling position. Place one hand behind your head and rotate your elbow toward the ceiling. Open up your upper back fully on each rep.',
   10, 2, 15, null)
on conflict (id) do nothing;

-- Dumbbell Chest Press (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0004-000000000002', 1, 'Flat Dumbbell Press',
   'Lie on a flat bench holding dumbbells at chest height, palms facing forward. Press up until arms are extended, then lower slowly. Keep shoulder blades pinched throughout.',
   10, 3, 60, null),
  ('00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0004-000000000002', 2, 'Incline Dumbbell Press',
   'Set the bench to a 30–45° incline. Press the dumbbells from upper-chest height upward. Targets the upper pec and front delt.',
   10, 3, 60, null),
  ('00000000-0000-0000-0005-000000000013', '00000000-0000-0000-0004-000000000002', 3, 'Dumbbell Chest Fly',
   'Lie flat with arms extended above your chest, palms facing each other. Lower both arms in a wide arc until you feel a stretch across your chest, then bring them back together.',
   12, 3, 45, null),
  ('00000000-0000-0000-0005-000000000014', '00000000-0000-0000-0004-000000000002', 4, 'Close-Grip Dumbbell Press',
   'Lie flat and press the dumbbells together at chest level. Press straight up keeping the bells touching. Shifts emphasis to the inner chest and triceps.',
   12, 2, 45, null),
  ('00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0004-000000000002', 5, 'Push-Up Finisher',
   'Finish with bodyweight push-ups. Standard grip, full range of motion. Focus on squeezing the chest at the top of each rep.',
   15, 2, 30, null)
on conflict (id) do nothing;

-- Push-Up Burn (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000021', '00000000-0000-0000-0004-000000000003', 1, 'Standard Push-Up',
   'Hands slightly wider than shoulder-width, body in a straight plank. Lower until your chest nearly touches the floor, then press up. Control the descent.',
   15, 3, 40, null),
  ('00000000-0000-0000-0005-000000000022', '00000000-0000-0000-0004-000000000003', 2, 'Wide-Grip Push-Up',
   'Set your hands wider than a standard push-up. This wider stance increases the stretch across the chest at the bottom. Control each rep.',
   12, 3, 40, null),
  ('00000000-0000-0000-0005-000000000023', '00000000-0000-0000-0004-000000000003', 3, 'Diamond Push-Up',
   'Form a diamond shape with your thumbs and index fingers beneath your chest. Lower down, then press up. Heavy tricep involvement.',
   10, 3, 60, null),
  ('00000000-0000-0000-0005-000000000024', '00000000-0000-0000-0004-000000000003', 4, 'Decline Push-Up',
   'Elevate your feet on a bench or step. Perform push-ups from this position to target the upper chest and increase overall difficulty.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000025', '00000000-0000-0000-0004-000000000003', 5, 'Slow Negative Push-Up',
   'Take 4 full seconds to lower yourself to the floor, then press back up normally. This eccentric loading creates deep muscle fatigue.',
   8, 2, 60, null)
on conflict (id) do nothing;

-- Pull-Up Strength (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000031', '00000000-0000-0000-0004-000000000004', 1, 'Dead Hang',
   'Grip the bar with both hands, palms facing away. Let your body hang fully, arms straight. Decompresses the spine and builds grip strength.',
   null, 2, 45, 30),
  ('00000000-0000-0000-0005-000000000032', '00000000-0000-0000-0004-000000000004', 2, 'Scapular Pull-Up',
   'Hang from the bar with arms straight. Without bending your elbows, depress and retract your shoulder blades to pull your body up slightly.',
   10, 3, 45, null),
  ('00000000-0000-0000-0005-000000000033', '00000000-0000-0000-0004-000000000004', 3, 'Pull-Up',
   'Pull yourself up until your chin clears the bar. Lower slowly and with control. Use a band for assistance or perform slow negatives if needed.',
   6, 3, 90, null),
  ('00000000-0000-0000-0005-000000000034', '00000000-0000-0000-0004-000000000004', 4, 'Inverted Row',
   'Set a barbell in a rack at hip height. Lie underneath and grip the bar. Pull your chest up to the bar keeping your body rigid.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000035', '00000000-0000-0000-0004-000000000004', 5, 'Band Pull-Apart',
   'Hold a resistance band at shoulder height with arms straight. Pull the band apart until it touches your chest, then return slowly.',
   15, 3, 30, null)
on conflict (id) do nothing;

-- Seated Cable Row (4 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000041', '00000000-0000-0000-0004-000000000005', 1, 'Seated Cable Row',
   'Sit at the cable station with feet planted. Pull the handle to your lower chest, driving elbows back and squeezing your shoulder blades together. Return with control.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000042', '00000000-0000-0000-0004-000000000005', 2, 'Lat Pulldown',
   'Grip the bar wider than shoulder-width. Pull it down to your upper chest while leaning back slightly. Squeeze the lats at the bottom and return slowly.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000043', '00000000-0000-0000-0004-000000000005', 3, 'Single-Arm Dumbbell Row',
   'Support yourself on a bench with one hand and one knee. Row the dumbbell from a full stretch up to your hip, keeping your back flat.',
   10, 3, 60, null),
  ('00000000-0000-0000-0005-000000000044', '00000000-0000-0000-0004-000000000005', 4, 'Face Pull',
   'Set a cable to head height with a rope attachment. Pull the rope toward your face, separating the handles at the end. Targets rear delts and rotator cuff.',
   15, 3, 45, null)
on conflict (id) do nothing;

-- Leg Day Starter (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000051', '00000000-0000-0000-0004-000000000006', 1, 'Bodyweight Squat',
   'Stand with feet shoulder-width apart. Lower your hips back and down until your thighs are parallel to the floor. Drive through your heels to stand.',
   15, 3, 45, null),
  ('00000000-0000-0000-0005-000000000052', '00000000-0000-0000-0004-000000000006', 2, 'Romanian Deadlift',
   'Hold dumbbells in front of your thighs. Hinge at the hips, pushing them back while lowering the weights along your legs. Feel the hamstring stretch, then drive hips forward.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000053', '00000000-0000-0000-0004-000000000006', 3, 'Leg Press',
   'Sit in the leg press machine with feet hip-width apart. Lower the sled until knees hit 90°, then press back up without locking out.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000054', '00000000-0000-0000-0004-000000000006', 4, 'Leg Curl',
   'Lie face-down on the leg curl machine. Curl your heels toward your glutes through the full range of motion. Squeeze at the top, lower slowly.',
   12, 3, 45, null),
  ('00000000-0000-0000-0005-000000000055', '00000000-0000-0000-0004-000000000006', 5, 'Standing Calf Raise',
   'Stand on the edge of a step or flat ground. Rise onto your toes as high as possible, hold for a beat, then lower. Calves respond well to full range of motion.',
   20, 3, 30, null)
on conflict (id) do nothing;

-- Squat & Lunge Circuit (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000061', '00000000-0000-0000-0004-000000000007', 1, 'Barbell Back Squat',
   'Bar rests across your upper traps. Feet shoulder-width, toes slightly out. Squat below parallel keeping your chest tall and knees tracking over toes.',
   8, 4, 90, null),
  ('00000000-0000-0000-0005-000000000062', '00000000-0000-0000-0004-000000000007', 2, 'Walking Lunge',
   'Step forward and lower your back knee toward the floor. Push off your front foot and step through into the next lunge. Keep your torso upright.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000063', '00000000-0000-0000-0004-000000000007', 3, 'Bulgarian Split Squat',
   'Rear foot elevated on a bench behind you. Lower your back knee toward the ground while keeping your front shin vertical.',
   10, 3, 60, null),
  ('00000000-0000-0000-0005-000000000064', '00000000-0000-0000-0004-000000000007', 4, 'Box Jump',
   'Stand in front of a sturdy box. Dip into a quarter squat and jump onto the box landing softly. Step down — do not jump down.',
   8, 3, 90, null),
  ('00000000-0000-0000-0005-000000000065', '00000000-0000-0000-0004-000000000007', 5, 'Wall Sit',
   'Lower into a squat with your back flat against a wall, thighs parallel to the floor. Hold the position for the full duration.',
   null, 3, 60, 45)
on conflict (id) do nothing;

-- Treadmill Fat Burn (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000071', '00000000-0000-0000-0004-000000000008', 1, 'Easy Walk — Warm-Up',
   'Start at a comfortable walking pace (4–5 km/h). Keep your posture tall, shoulders relaxed, arms swinging naturally. Let your breathing settle.',
   null, null, null, 300),
  ('00000000-0000-0000-0005-000000000072', '00000000-0000-0000-0004-000000000008', 2, 'Moderate Jog',
   'Increase to a light jog (7–8 km/h). You should be able to speak in short sentences. Maintain a comfortable, sustainable pace.',
   null, null, null, 600),
  ('00000000-0000-0000-0005-000000000073', '00000000-0000-0000-0004-000000000008', 3, 'Power Walk Intervals',
   'Increase incline to 4–6%. Walk at a brisk pace (5.5–6 km/h). The incline significantly increases calorie burn without the impact of running.',
   null, null, null, 300),
  ('00000000-0000-0000-0005-000000000074', '00000000-0000-0000-0004-000000000008', 4, 'Run — Push Phase',
   'Drop incline back to flat. Increase speed to a run you can sustain (9–10 km/h). Push yourself here — this is the high-intensity block.',
   null, null, null, 300),
  ('00000000-0000-0000-0005-000000000075', '00000000-0000-0000-0004-000000000008', 5, 'Cool Down Walk',
   'Reduce speed to an easy walk (4 km/h). Allow your heart rate to come down gradually. Keep moving — stopping abruptly is not ideal for recovery.',
   null, null, null, 300)
on conflict (id) do nothing;

-- HIIT Cardio Blast (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000081', '00000000-0000-0000-0004-000000000009', 1, 'Jump Squats',
   'Squat down and explode upward into a jump. Land softly with slightly bent knees and go straight into the next rep. Keep your chest up throughout.',
   null, 4, 20, 40),
  ('00000000-0000-0000-0005-000000000082', '00000000-0000-0000-0004-000000000009', 2, 'Burpees',
   'Drop hands to floor, jump feet back to plank, perform a push-up, jump feet forward, then explode into a jump with arms overhead. Maximum effort every rep.',
   null, 4, 20, 40),
  ('00000000-0000-0000-0005-000000000083', '00000000-0000-0000-0004-000000000009', 3, 'Mountain Climbers',
   'Start in a plank position. Alternate driving each knee toward your chest at high speed. Keep your hips low and your core braced.',
   null, 4, 20, 40),
  ('00000000-0000-0000-0005-000000000084', '00000000-0000-0000-0004-000000000009', 4, 'Jump Rope (or Simulation)',
   'Jump rope or simulate the motion by hopping in place while swinging your wrists. Maintain a quick, rhythmic tempo.',
   null, 4, 20, 40),
  ('00000000-0000-0000-0005-000000000085', '00000000-0000-0000-0004-000000000009', 5, 'Sprint in Place',
   'Run as fast as you can in place. Drive your knees up high and pump your arms hard. Give everything you have for the full duration.',
   null, 4, 60, 40)
on conflict (id) do nothing;

-- Kettlebell Conditioning (5 steps)
insert into workout_steps (id, workout_id, step_order, title, instruction_text, reps, sets, rest_seconds, duration_seconds) values
  ('00000000-0000-0000-0005-000000000091', '00000000-0000-0000-0004-000000000010', 1, 'Kettlebell Swing',
   'Hinge at the hips and swing the bell between your legs. Drive your hips forward powerfully to project the bell up to chest height. This is a hip hinge, not a squat.',
   15, 4, 60, null),
  ('00000000-0000-0000-0005-000000000092', '00000000-0000-0000-0004-000000000010', 2, 'Goblet Squat',
   'Hold the kettlebell by the horns at chest height. Squat deep with your elbows inside your knees at the bottom. Keep your chest tall and drive through your heels.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000093', '00000000-0000-0000-0004-000000000010', 3, 'KB Clean & Press',
   'Clean the bell to the rack position in one fluid motion, then press it overhead. Perform all reps on one side before switching.',
   8, 3, 90, null),
  ('00000000-0000-0000-0005-000000000094', '00000000-0000-0000-0004-000000000010', 4, 'KB Romanian Deadlift',
   'Hold the bell in both hands. Hinge at your hips with a flat back, lowering the bell between your legs until you feel a deep hamstring stretch.',
   12, 3, 60, null),
  ('00000000-0000-0000-0005-000000000095', '00000000-0000-0000-0004-000000000010', 5, 'KB Farmer''s Carry',
   'Hold a kettlebell in each hand at your sides. Walk for the full duration with shoulders back, core braced, and a tall posture.',
   null, 3, 45, 40)
on conflict (id) do nothing;

-- ─── TENANT WORKOUT PREFERENCES ──────────────────────────────────────────────
-- Defines Iron House Gym's catalog, quick starts, and featured workouts.
-- This table — not code — drives what each gym shows.

insert into tenant_workout_preferences (tenant_id, workout_id, is_recommended, is_quick_start, display_order) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000001', false, true,   1),  -- Dynamic Warmup    (quick start)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000002', false, true,   2),  -- Dumbbell Chest    (quick start)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000008', false, true,   3),  -- Treadmill Fat Burn (quick start)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000006', true,  false,  4),  -- Leg Day           (featured)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000004', true,  false,  5),  -- Pull-Up Strength  (featured)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000009', true,  false,  6),  -- HIIT Cardio Blast (featured)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000010', true,  false,  7),  -- Kettlebell        (featured)
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000003', false, false,  8),  -- Push-Up Burn
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000005', false, false,  9),  -- Seated Cable Row
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0004-000000000007', false, false, 10)   -- Squat & Lunge Circuit
on conflict (tenant_id, workout_id) do nothing;
