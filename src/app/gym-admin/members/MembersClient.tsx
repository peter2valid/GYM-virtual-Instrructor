"use client";

import { useState } from "react";
import type { MemberRowEnriched } from "@/features/sessions/queries";
import * as Dialog from "@radix-ui/react-dialog";
import { createMemberAccount } from "@/features/profiles/admin-actions";

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setIsAdding(true);
    setAddError(null);
    const res = await createMemberAccount({ fullName: addName, email: addEmail });
    setIsAdding(false);
    if (res?.error) {
      setAddError(res.error);
    } else {
      setCreatedPassword(res.tempPassword ?? null);
      setAddName("");
      setAddEmail("");
    }
  }

  function handleCloseDialog(open: boolean) {
    if (!open) {
      setCreatedPassword(null);
      setAddError(null);
    }
    setIsAddOpen(open);
  }

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
      {/* Header Utilities */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-72"
        />

        <Dialog.Root open={isAddOpen} onOpenChange={handleCloseDialog}>
          <Dialog.Trigger asChild>
            <button className="flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              Add Member
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-2xl">
              {createdPassword ? (
                <>
                  <Dialog.Title className="text-lg font-semibold tracking-tight">
                    Member Added
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Share these credentials with the member. This password will not be shown again.
                  </Dialog.Description>
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Temporary Password</p>
                      <p className="font-mono text-sm font-semibold text-foreground select-all">{createdPassword}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">The member should change this after their first login.</p>
                  </div>
                  <div className="flex justify-end">
                    <Dialog.Close asChild>
                      <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                        Done
                      </button>
                    </Dialog.Close>
                  </div>
                </>
              ) : (
                <>
                  <Dialog.Title className="text-lg font-semibold tracking-tight">
                    Add New Member
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    A temporary password will be generated. Share it with the member after creation.
                  </Dialog.Description>
                  {addError && <p className="text-sm text-destructive font-medium">{addError}</p>}
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Full Name</label>
                      <input
                        type="text"
                        required
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email Address</label>
                      <input
                        type="email"
                        required
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                      <Dialog.Close asChild>
                        <button type="button" className="rounded-xl border border-input bg-background px-4 py-2 hover:bg-accent text-sm font-medium transition-colors">
                          Cancel
                        </button>
                      </Dialog.Close>
                      <button disabled={isAdding} type="submit" className="rounded-xl bg-primary px-4 py-2 hover:bg-primary/90 text-sm font-semibold text-primary-foreground transition-colors disabled:opacity-50">
                        {isAdding ? "Adding..." : "Add Member"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

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
