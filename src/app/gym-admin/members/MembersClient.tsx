"use client";

import { useState } from "react";
import type { MemberRowEnriched } from "@/features/sessions/queries";

type Segment = "all" | "active" | "inactive" | "new";

const SEGMENT_LABELS: Record<Segment, string> = {
  all:      "All",
  active:   "Active",
  inactive: "Inactive",
  new:      "New",
};

const SEGMENT_STYLES: Record<string, string> = {
  active:   "bg-green-500/10 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
  new:      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

interface Props {
  members: MemberRowEnriched[];
}

export function MembersClient({ members }: Props) {
  const [segment, setSegment] = useState<Segment>("all");
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (segment !== "all" && m.segment !== segment) return false;
    if (search) {
      const q = search.toLowerCase();
      return (m.fullName ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all:      members.length,
    active:   members.filter((m) => m.segment === "active").length,
    inactive: members.filter((m) => m.segment === "inactive").length,
    new:      members.filter((m) => m.segment === "new").length,
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input w-full sm:w-72"
      />

      {/* Segment tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {(["all", "active", "new", "inactive"] as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              segment === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {SEGMENT_LABELS[s]}{" "}
            <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No members match this filter.
          </p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_80px_80px_100px] px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Member</span>
              <span className="text-right">Sessions</span>
              <span className="text-right">Status</span>
              <span className="text-right">Joined</span>
            </div>
            {filtered.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_80px_80px_100px] items-center px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {m.fullName ? m.fullName[0].toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.fullName ?? "Unknown"}
                    </p>
                    {m.lastActiveAt && (
                      <p className="text-xs text-muted-foreground">
                        Last active{" "}
                        {new Date(m.lastActiveAt).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-right text-sm text-foreground">
                  {m.sessionCount}
                </span>
                <div className="flex justify-end">
                  <span
                    className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold capitalize ${
                      SEGMENT_STYLES[m.segment]
                    }`}
                  >
                    {m.segment}
                  </span>
                </div>
                <span className="text-right text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
