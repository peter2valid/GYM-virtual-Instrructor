"use client";

import { useState, useRef, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface ExerciseHit {
  id: string;
  name: string;
  category: string;
  primary_muscles: string[];
}

interface Props {
  value: string | null;
  valueName: string | null;
  onChange: (id: string | null, name: string | null) => void;
}

export function ExerciseSearch({ value, valueName, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("exercises")
      .select("id, name, category, primary_muscles")
      .ilike("name", `%${q}%`)
      .eq("is_active", true)
      .limit(8);

    setResults(data ?? []);
    setLoading(false);
  }

  function handleInput(q: string) {
    setQuery(q);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 250);
  }

  function handleSelect(ex: ExerciseHit) {
    onChange(ex.id, ex.name);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    onChange(null, null);
    setQuery("");
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-primary/5 px-3 py-2 text-sm">
        <span className="flex-1 font-medium text-foreground">{valueName}</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          ✕ Clear
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder="Search exercises (optional)…"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        className="input"
      />
      {open && (query.length >= 2) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No exercises found.</p>
          ) : (
            results.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onMouseDown={() => handleSelect(ex)}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium text-foreground">{ex.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ex.category} · {ex.primary_muscles?.slice(0, 2).join(", ")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
