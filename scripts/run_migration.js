#!/usr/bin/env node
/**
 * Migration runner — applies supabase/migrations/*.sql to the live DB.
 *
 * Splits the file into individual statements so it works with the
 * Supabase connection pooler (avoids "invalid message format" on large payloads).
 *
 * Usage:
 *   DB_PASSWORD=p node scripts/run_migration.js
 *   DB_PASSWORD=p DB_HOST=aws-1-eu-central-1.pooler.supabase.com DB_USER=postgres.ref node scripts/run_migration.js
 */

const { Client } = require("pg");
const fs   = require("fs");
const path = require("path");

const PROJECT_REF    = "cblwoeoozzjagxgpmrbd";
const DB_PASSWORD    = process.env.DB_PASSWORD;
const DB_HOST        = process.env.DB_HOST || `db.${PROJECT_REF}.supabase.co`;
const DB_USER        = process.env.DB_USER || "postgres";
const _fileIdx = process.argv.indexOf("--file");
const MIGRATION_FILE =
  process.argv.find((a) => a.startsWith("--file="))?.split("=")[1] ||
  (_fileIdx !== -1 ? process.argv[_fileIdx + 1] : null) ||
  "supabase/migrations/20260325000001_v2_complete.sql";

if (!DB_PASSWORD) {
  console.error(
    `\n❌  DB_PASSWORD env var is required.\n` +
    `  Run: DB_PASSWORD=yourpassword node scripts/run_migration.js\n`
  );
  process.exit(1);
}

const CONN = {
  host:     DB_HOST,
  port:     5432,
  database: "postgres",
  user:     DB_USER,
  password: DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
};

// ─── SQL splitter ─────────────────────────────────────────────────────────────
// Index-based: never builds intermediate strings — O(n) time and memory.
// Respects single-quoted strings, dollar-quoted blocks, and comments.
function splitStatements(sql) {
  const stmts = [];
  let pos   = 0;
  let start = 0;          // start of current statement slice
  const len = sql.length;

  function ch(i = pos) { return i < len ? sql[i] : ""; }

  while (pos < len) {
    const c = ch();

    // Line comment — skip to end of line
    if (c === "-" && ch(pos + 1) === "-") {
      while (pos < len && ch() !== "\n") pos++;
      continue;
    }

    // Block comment
    if (c === "/" && ch(pos + 1) === "*") {
      pos += 2;
      while (pos < len && !(ch() === "*" && ch(pos + 1) === "/")) pos++;
      if (pos < len) pos += 2;
      continue;
    }

    // Single-quoted string  '...'  with '' escape
    if (c === "'") {
      pos++;
      while (pos < len) {
        if (ch() === "'" && ch(pos + 1) === "'") { pos += 2; }
        else if (ch() === "'")                   { pos++; break; }
        else                                     { pos++; }
      }
      continue;
    }

    // Dollar-quoted block  $$...$$ or $tag$...$tag$
    if (c === "$") {
      let tagEnd = pos + 1;
      while (tagEnd < len && sql[tagEnd] !== "$" && /\w/.test(sql[tagEnd])) tagEnd++;
      if (tagEnd < len && sql[tagEnd] === "$") {
        const tag    = sql.slice(pos, tagEnd + 1);
        const tagLen = tag.length;
        pos += tagLen;
        while (pos < len) {
          if (sql.startsWith(tag, pos)) { pos += tagLen; break; }
          pos++;
        }
        continue;
      }
    }

    // Statement boundary
    if (c === ";") {
      const stmt = sql.slice(start, pos + 1).trim();
      if (stmt && stmt !== ";") stmts.push(stmt);
      pos++;
      start = pos;
      continue;
    }

    pos++;
  }

  // Trailing statement without trailing semicolon
  const last = sql.slice(start).trim();
  if (last) stmts.push(last);
  return stmts;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const migrationPath = path.resolve(MIGRATION_FILE);
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌  Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql        = fs.readFileSync(migrationPath, "utf8");
  const statements = splitStatements(sql);

  console.log(`\n📋  Migration : ${migrationPath}`);
  console.log(`📝  Statements: ${statements.length}`);
  console.log(`🔗  Connecting to ${CONN.host}:${CONN.port}...`);

  const client = new Client(CONN);
  try {
    await client.connect();
    console.log("✅  Connected\n⏳  Applying...\n");

    await client.query("BEGIN");

    for (let i = 0; i < statements.length; i++) {
      const stmt    = statements[i];
      const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
      try {
        await client.query(stmt);
        console.log(`  [${i + 1}/${statements.length}] ✓  ${preview}`);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(`\n❌  Statement ${i + 1} failed: ${err.message}`);
        console.error(`    SQL: ${preview}`);
        process.exit(1);
      }
    }

    await client.query("COMMIT");
    console.log("\n✅  Migration applied!\n");

    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'plans','platform_admins','branches','gym_subscriptions','gym_feature_overrides',
          'gym_user_roles','invites','members','membership_types','member_memberships',
          'member_qr_codes','attendance_checkins','attendance_events','exercise_categories',
          'exercise_media','workout_templates','workout_template_items',
          'member_workout_assignments','workout_session_items','audit_logs','impersonation_sessions'
        )
      ORDER BY table_name
    `);

    console.log(`📊  V2 tables live (${rows.length}/21):`);
    rows.forEach((r) => console.log(`    ✓ ${r.table_name}`));
    if (rows.length < 21) {
      console.log(`\n⚠️   ${21 - rows.length} table(s) missing`);
    } else {
      console.log(`\n🎉  All 21 V2 tables are live!`);
    }

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
