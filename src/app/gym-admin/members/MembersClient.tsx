"use client";

import { useState } from "react";
import type { MemberRowEnriched } from "@/features/sessions/queries";
import type { MembershipType, MemberMembership } from "@/features/members/queries";
import * as Dialog from "@radix-ui/react-dialog";
import { createMemberAccount } from "@/features/profiles/admin-actions";
import {
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
  assignMembership,
} from "@/features/members/actions";

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT = "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";
const BTN_PRIMARY = "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50";
const BTN_GHOST = "rounded-xl border border-input bg-background px-4 py-2 hover:bg-accent text-sm font-medium transition-colors";

type Tab = "members" | "plans";
type Segment = "all" | "active" | "inactive" | "new";

const SEGMENT_LABELS: Record<Segment, string> = { all: "All", active: "Active", inactive: "Inactive", new: "New" };
const SEGMENT_STYLES: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  members: MemberRowEnriched[];
  membershipTypes: MembershipType[];
  memberships: MemberMembership[];
}

// ─── Root client component ────────────────────────────────────────────────────

export function MembersClient({ members, membershipTypes, memberships }: Props) {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {(["members", "plans"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "plans" ? "Membership Plans" : "Members"}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <MembersTab members={members} membershipTypes={membershipTypes} />
      )}
      {tab === "plans" && (
        <PlansTab membershipTypes={membershipTypes} memberships={memberships} />
      )}
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({
  members,
  membershipTypes,
}: {
  members: MemberRowEnriched[];
  membershipTypes: MembershipType[];
}) {
  const [segment, setSegment] = useState<Segment>("all");
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // Assign membership
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [assignMemberName, setAssignMemberName] = useState<string | null>(null);
  const [assignTypeId, setAssignTypeId] = useState("");
  const [assignStart, setAssignStart] = useState(new Date().toISOString().split("T")[0]);
  const [assignAmount, setAssignAmount] = useState("");
  const [assignPayment, setAssignPayment] = useState<"paid" | "partial" | "unpaid" | "waived">("paid");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setIsAdding(true);
    setAddError(null);
    const res = await createMemberAccount({ fullName: addName, email: addEmail, phone: addPhone || undefined });
    setIsAdding(false);
    if (res?.error) {
      setAddError(res.error);
    } else {
      setCreatedPassword(res.tempPassword ?? null);
      setAddName(""); setAddEmail(""); setAddPhone("");
    }
  }

  function openAssign(memberId: string, memberName: string | null) {
    setAssignMemberId(memberId);
    setAssignMemberName(memberName);
    setAssignTypeId(membershipTypes[0]?.id ?? "");
    setAssignStart(new Date().toISOString().split("T")[0]);
    setAssignAmount("");
    setAssignPayment("paid");
    setAssignError(null);
    setAssignOpen(true);
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignMemberId || !assignTypeId) return;
    setIsAssigning(true);
    setAssignError(null);
    const selectedType = membershipTypes.find((t) => t.id === assignTypeId);
    const res = await assignMembership({
      memberId: assignMemberId,
      membershipTypeId: assignTypeId,
      startDate: assignStart,
      amountPaidKes: assignAmount ? parseInt(assignAmount) : (selectedType?.priceKes ?? 0),
      paymentStatus: assignPayment,
      autoRenew: false,
    });
    setIsAssigning(false);
    if ("error" in res) {
      setAssignError(res.error);
    } else {
      setAssignOpen(false);
    }
  }

  const filtered = members.filter((m) => {
    if (segment !== "all" && m.segment !== segment) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (m.fullName ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: members.length,
    active: members.filter((m) => m.segment === "active").length,
    inactive: members.filter((m) => m.segment === "inactive").length,
    new: members.filter((m) => m.segment === "new").length,
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <input
          type="search"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:w-72"
        />
        <Dialog.Root open={isAddOpen} onOpenChange={(open) => { if (!open) { setCreatedPassword(null); setAddError(null); } setIsAddOpen(open); }}>
          <Dialog.Trigger asChild>
            <button className="flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
              Add Member
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-2xl">
              {createdPassword ? (
                <>
                  <Dialog.Title className="text-lg font-semibold">Member Added</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">Share these credentials. Password is shown once only.</Dialog.Description>
                  <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Temporary Password</p>
                    <p className="font-mono text-sm font-semibold select-all">{createdPassword}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Dialog.Close asChild><button className={BTN_PRIMARY}>Done</button></Dialog.Close>
                  </div>
                </>
              ) : (
                <>
                  <Dialog.Title className="text-lg font-semibold">Add New Member</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">A temporary password will be generated.</Dialog.Description>
                  {addError && <p className="mt-2 text-sm text-destructive font-medium">{addError}</p>}
                  <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                    <Field label="Full Name"><input type="text" required value={addName} onChange={(e) => setAddName(e.target.value)} className={INPUT} /></Field>
                    <Field label="Email Address"><input type="email" required value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className={INPUT} /></Field>
                    <Field label="Phone" optional><input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className={INPUT} /></Field>
                    <div className="flex gap-3 justify-end mt-4">
                      <Dialog.Close asChild><button type="button" className={BTN_GHOST}>Cancel</button></Dialog.Close>
                      <button disabled={isAdding} type="submit" className={BTN_PRIMARY}>{isAdding ? "Adding..." : "Add Member"}</button>
                    </div>
                  </form>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Segments */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {(["all", "active", "new", "inactive"] as Segment[]).map((s) => (
          <button key={s} onClick={() => setSegment(s)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${segment === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {SEGMENT_LABELS[s]} <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No members match this filter.</p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_100px_80px_80px_100px_80px] px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Member</span><span>Contact</span><span className="text-right">Sessions</span><span className="text-right">Status</span><span className="text-right">Joined</span><span />
            </div>
            {filtered.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_100px_80px_80px_100px_80px] items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {m.fullName ? m.fullName[0].toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{m.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{m.lastActiveAt ? `Last active ${new Date(m.lastActiveAt).toLocaleDateString("en", { month: "short", day: "numeric" })}` : "No sessions yet"}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  {m.phone && <p className="truncate text-xs text-foreground">{m.phone}</p>}
                  {m.email && <p className="truncate text-xs text-muted-foreground">{m.email}</p>}
                </div>
                <span className="text-right text-sm text-foreground">{m.sessionCount}</span>
                <div className="flex justify-end">
                  <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold capitalize ${SEGMENT_STYLES[m.segment]}`}>{m.segment}</span>
                </div>
                <span className="text-right text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <div className="flex justify-end">
                  {membershipTypes.length > 0 && (
                    <button
                      onClick={() => openAssign(m.id, m.fullName)}
                      className="rounded-lg border border-input px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
                    >
                      Assign Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign membership dialog */}
      <Dialog.Root open={assignOpen} onOpenChange={setAssignOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-2xl">
            <Dialog.Title className="text-lg font-semibold">Assign Membership</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Assign a plan to <span className="font-medium text-foreground">{assignMemberName ?? "this member"}</span>.
            </Dialog.Description>
            {assignError && <p className="mt-2 text-sm text-destructive font-medium">{assignError}</p>}
            <form onSubmit={handleAssign} className="mt-4 space-y-4">
              <Field label="Membership Plan">
                <select value={assignTypeId} onChange={(e) => setAssignTypeId(e.target.value)} className={INPUT}>
                  {membershipTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.durationDays}d — KES {t.priceKes.toLocaleString()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start Date">
                <input type="date" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Amount Paid (KES)" optional>
                <input
                  type="number"
                  min={0}
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(e.target.value)}
                  placeholder={membershipTypes.find((t) => t.id === assignTypeId)?.priceKes.toString() ?? "0"}
                  className={INPUT}
                />
              </Field>
              <Field label="Payment Status">
                <select value={assignPayment} onChange={(e) => setAssignPayment(e.target.value as typeof assignPayment)} className={INPUT}>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="waived">Waived</option>
                </select>
              </Field>
              <div className="flex gap-3 justify-end mt-4">
                <Dialog.Close asChild><button type="button" className={BTN_GHOST}>Cancel</button></Dialog.Close>
                <button disabled={isAssigning} type="submit" className={BTN_PRIMARY}>{isAssigning ? "Assigning..." : "Assign"}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────

function PlansTab({
  membershipTypes,
  memberships,
}: {
  membershipTypes: MembershipType[];
  memberships: MemberMembership[];
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state (shared for create + edit)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [priceKes, setPriceKes] = useState("0");
  const [includesWorkouts, setIncludesWorkouts] = useState(true);

  function openCreate() {
    setName(""); setDescription(""); setDurationDays("30"); setPriceKes("0"); setIncludesWorkouts(true);
    setSaveError(null);
    setIsCreateOpen(true);
  }

  function openEdit(t: MembershipType) {
    setName(t.name); setDescription(t.description ?? ""); setDurationDays(t.durationDays.toString());
    setPriceKes(t.priceKes.toString()); setIncludesWorkouts(t.includesWorkouts);
    setSaveError(null);
    setEditTarget(t);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true); setSaveError(null);
    const res = await createMembershipType({ name, description, durationDays: parseInt(durationDays), priceKes: parseInt(priceKes), includesWorkouts });
    setIsSaving(false);
    if ("error" in res) { setSaveError(res.error); return; }
    setIsCreateOpen(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setIsSaving(true); setSaveError(null);
    const res = await updateMembershipType(editTarget.id, { name, description: description || null, durationDays: parseInt(durationDays), priceKes: parseInt(priceKes), includesWorkouts });
    setIsSaving(false);
    if ("error" in res) { setSaveError(res.error); return; }
    setEditTarget(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this plan? Existing memberships are kept.")) return;
    await deleteMembershipType(id);
  }

  const activePlans = membershipTypes.filter((t) => t.isActive);
  const activeMemberships = memberships.filter((m) => m.status === "active");

  const planForm = (onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      {saveError && <p className="text-sm text-destructive font-medium">{saveError}</p>}
      <Field label="Plan Name"><input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly, Annual…" className={INPUT} /></Field>
      <Field label="Description" optional><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (days)"><input type="number" required min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className={INPUT} /></Field>
        <Field label="Price (KES)"><input type="number" required min={0} value={priceKes} onChange={(e) => setPriceKes(e.target.value)} className={INPUT} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={includesWorkouts} onChange={(e) => setIncludesWorkouts(e.target.checked)} className="h-4 w-4 rounded border-input" />
        Includes workout access
      </label>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" onClick={() => { setIsCreateOpen(false); setEditTarget(null); }} className={BTN_GHOST}>Cancel</button>
        <button disabled={isSaving} type="submit" className={BTN_PRIMARY}>{isSaving ? "Saving..." : "Save Plan"}</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatMini label="Active Plans" value={activePlans.length} />
        <StatMini label="Active Memberships" value={activeMemberships.length} />
        <StatMini label="Total Assigned" value={memberships.length} />
      </div>

      {/* Plan list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Membership Plans</p>
          <button onClick={openCreate} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            + New Plan
          </button>
        </div>
        {activePlans.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No plans yet. Create one to start assigning memberships.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {activePlans.map((t) => {
              const assigned = memberships.filter((m) => m.membershipTypeId === t.id && m.status === "active").length;
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.durationDays} days · KES {t.priceKes.toLocaleString()} · {assigned} active member{assigned !== 1 ? "s" : ""}
                      {t.includesWorkouts && " · Includes workouts"}
                    </p>
                    {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="rounded-lg border border-destructive/30 text-destructive px-3 py-1.5 text-xs font-medium hover:bg-destructive/10 transition-colors">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active memberships list */}
      {memberships.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Assigned Memberships</p>
          </div>
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_120px_80px_80px_80px] px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Member</span><span>Plan</span><span className="text-right">Expires</span><span className="text-right">Payment</span><span className="text-right">Status</span>
            </div>
            {memberships.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_120px_80px_80px_80px] items-center px-4 py-3">
                <span className="text-sm text-foreground">{m.memberName ?? "—"}</span>
                <span className="text-xs text-muted-foreground truncate">{m.membershipTypeName}</span>
                <span className="text-right text-xs text-muted-foreground">
                  {new Date(m.endDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
                <div className="flex justify-end">
                  <PaymentBadge status={m.paymentStatus} />
                </div>
                <div className="flex justify-end">
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create plan dialog */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-2xl">
            <Dialog.Title className="text-lg font-semibold">New Membership Plan</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">Define the plan terms. Members can be assigned once created.</Dialog.Description>
            {planForm(handleCreate)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit plan dialog */}
      <Dialog.Root open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out sm:rounded-2xl">
            <Dialog.Title className="text-lg font-semibold">Edit Plan</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">Changes apply to future assignments only.</Dialog.Description>
            {planForm(handleEdit)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}{optional && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-500/10 text-green-600 dark:text-green-400",
    partial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    unpaid: "bg-red-500/10 text-red-500",
    waived: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 dark:text-green-400",
    expired: "bg-muted text-muted-foreground",
    paused: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    cancelled: "bg-red-500/10 text-red-500",
  };
  return (
    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
