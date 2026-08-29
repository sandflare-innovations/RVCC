"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {

  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Key,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Mail,
  Building,
  Phone,
  Briefcase,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  Loader2,
  Clock,
  ArrowUpDown,
  Send,
  Eye,
  EyeOff,
  Ban,
} from "lucide-react";

import { StaffMember, AdminRoleName } from "@/types/staff";
import { AnimatedSearchInput } from "@/lib/ui";


const SEARCH_PLACEHOLDERS = [
  "staff name...",
  "email address...",
  "job position...",
  "role (Super Admin, Procurement Admin)...",
];


const ROLE_INFO: Record<AdminRoleName, { label: string; bgClass: string; textClass: string; borderClass: string; desc: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    bgClass: "bg-purple-50 text-purple-700 border-purple-200",
    textClass: "text-purple-700",
    borderClass: "border-purple-200",
    desc: "Full Root Access — Manage admins, security, procurements, vendors & website",
  },
  ADMIN: {
    label: "General Admin",
    bgClass: "bg-blue-50 text-brand-blue border-blue-200",
    textClass: "text-brand-blue",
    borderClass: "border-blue-200",
    desc: "General Admin — Manage vendors, RFQs, procurements, and company website",
  },
  PROCUREMENT_ADMIN: {
    label: "Procurement Admin",
    bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    desc: "Procurement Portal Only — Create, review, and manage purchase requisitions",
  },
  VENDOR_ADMIN: {
    label: "Vendor Admin",
    bgClass: "bg-amber-50 text-amber-700 border-amber-200",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    desc: "Vendor Management Only — Approve suppliers, manage RFQs & registrations",
  },
  WEBSITE_ADMIN: {
    label: "Website Admin",
    bgClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    textClass: "text-cyan-700",
    borderClass: "border-cyan-200",
    desc: "Website Content Only — Manage projects, services, gallery, careers & documents",
  },
  REVIEWER: {
    label: "Reviewer",
    bgClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    textClass: "text-zinc-700",
    borderClass: "border-zinc-200",
    desc: "Read-Only Auditor — Inspect dashboards without edit or deletion permissions",
  },
};


export function StaffPanel() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | AdminRoleName>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalTarget, setEditModalTarget] = useState<StaffMember | null>(null);
  const [passwordModalTarget, setPasswordModalTarget] = useState<StaffMember | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<StaffMember | null>(null);
  const [blockModalTarget, setBlockModalTarget] = useState<StaffMember | null>(null);

  // OTP Verification Modal States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpActionType, setOtpActionType] = useState<"CREATE" | "UPDATE" | "PASSWORD" | "DELETE" | "BLOCK" | "UNBLOCK">("CREATE");
  const [otpActionPayload, setOtpActionPayload] = useState<any>(null);

  const [otpCode, setOtpCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpDevHint, setOtpDevHint] = useState<string | undefined>(undefined);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const fetchStaff = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await fetch("/api/staff", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Request Security OTP
  const triggerOtpRequest = async (action: string) => {
    setIsRequestingOtp(true);
    setActionError(null);
    try {
      const res = await fetch("/api/staff/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request OTP");

      setOtpSentTo(data.sentTo || "administrator email");
      setOtpDevHint(data.devCodeHint);
      setOtpCountdown(data.expiresInSeconds || 300);
      setOtpCode("");
      return true;
    } catch (err: any) {
      setActionError(err.message || "Failed to initiate security verification");
      return false;
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Initiate Create Staff Flow
  const handleInitiateCreate = async (formData: any) => {
    setOtpActionType("CREATE");
    setOtpActionPayload(formData);
    const sent = await triggerOtpRequest("CREATE_STAFF");
    if (sent) {
      setCreateModalOpen(false);
      setOtpModalOpen(true);
    }
  };

  // Initiate Edit Staff Flow
  const handleInitiateUpdate = async (formData: any) => {
    setOtpActionType("UPDATE");
    setOtpActionPayload(formData);
    const sent = await triggerOtpRequest("UPDATE_STAFF");
    if (sent) {
      setEditModalTarget(null);
      setOtpModalOpen(true);
    }
  };

  // Initiate Reset Password Flow
  const handleInitiatePasswordReset = async (formData: any) => {
    setOtpActionType("PASSWORD");
    setOtpActionPayload(formData);
    const sent = await triggerOtpRequest("RESET_PASSWORD");
    if (sent) {
      setPasswordModalTarget(null);
      setOtpModalOpen(true);
    }
  };

  // Initiate Delete Staff Flow
  const handleInitiateDelete = async (staff: StaffMember) => {
    setOtpActionType("DELETE");
    setOtpActionPayload({ id: staff.id, name: staff.name, email: staff.email });
    const sent = await triggerOtpRequest("DELETE_STAFF");
    if (sent) {
      setDeleteModalTarget(null);
      setOtpModalOpen(true);
    }
  };

  // Initiate Block / Unblock Staff Flow
  const handleInitiateToggleBlock = async (staff: StaffMember) => {
    const nextActive = !staff.isActive;
    const action = nextActive ? "UNBLOCK" : "BLOCK";
    setOtpActionType(action);
    setOtpActionPayload({ id: staff.id, name: staff.name, email: staff.email, isActive: nextActive });
    const sent = await triggerOtpRequest("UPDATE_STAFF");
    if (sent) {
      setOtpModalOpen(true);
    }
  };

  // Final Action Execution after OTP entry
  const handleExecuteWithOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setActionError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);

    try {
      if (otpActionType === "CREATE") {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...otpActionPayload, otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create staff member");
      } else if (otpActionType === "UPDATE") {
        const res = await fetch(`/api/staff/${otpActionPayload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...otpActionPayload, otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update staff member");
      } else if (otpActionType === "BLOCK" || otpActionType === "UNBLOCK") {
        const res = await fetch(`/api/staff/${otpActionPayload.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: otpActionPayload.isActive, otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to ${otpActionType.toLowerCase()} staff member`);
      } else if (otpActionType === "PASSWORD") {
        const res = await fetch(`/api/staff/${otpActionPayload.id}/password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...otpActionPayload, otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reset password");
      } else if (otpActionType === "DELETE") {
        const res = await fetch(`/api/staff/${otpActionPayload.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete staff member");
      }

      // Success
      setOtpModalOpen(false);
      fetchStaff(true);
    } catch (err: any) {
      setActionError(err.message || "Operation failed. Please try again.");
    } finally {
      setIsSubmittingAction(false);
    }
  };


  // Metrics
  const metrics = useMemo(() => {
    return {
      total: staffList.length,
      superAdmins: staffList.filter((s) => s.role === "SUPER_ADMIN").length,
      admins: staffList.filter((s) => s.role === "ADMIN").length,
      active: staffList.filter((s) => s.isActive && !s.isLocked).length,
    };
  }, [staffList]);

  // Filtered & Sorted Staff
  const displayedStaff = useMemo(() => {
    return staffList
      .filter((s) => {
        if (roleFilter !== "ALL" && s.role !== roleFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.position && s.position.toLowerCase().includes(q)) ||
          s.role.toLowerCase().includes(q)
        );

      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return sortDir === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [staffList, roleFilter, search, sortDir]);

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
        {[
          { label: "Total Staff & Admins", value: metrics.total, icon: <Users className="h-4 w-4" />, roleVal: "ALL" as const },
          { label: "Super Admins", value: metrics.superAdmins, icon: <ShieldCheck className="h-4 w-4 text-purple-600" />, roleVal: "SUPER_ADMIN" as const },
          { label: "Operational Admins", value: metrics.admins, icon: <Shield className="h-4 w-4 text-brand-blue" />, roleVal: "ADMIN" as const },
          { label: "Active Accounts", value: metrics.active, icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, roleVal: "ALL" as const },
        ].map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setRoleFilter(card.roleVal)}
            className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 cursor-pointer shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{card.label}</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                {card.icon}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-nowrap items-center justify-between gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={() => void fetchStaff()}
            disabled={refreshing}
            title="Refresh staff list"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-brand-blue bg-white text-brand-blue transition-colors hover:bg-brand-blue/5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 focus-visible:outline-none cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`} />
          </button>

          <AnimatedSearchInput
            value={search}
            onChange={setSearch}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search staff"
          />

        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-full border border-brand-blue bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-brand-blue text-white shadow-2xs font-bold" : "text-brand-blue hover:bg-brand-blue/5"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "card" ? "bg-brand-blue text-white shadow-2xs font-bold" : "text-brand-blue hover:bg-brand-blue/5"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Date Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            title={sortDir === "desc" ? "Sorting: Newest to Oldest" : "Sorting: Oldest to Newest"}
            className="focus-visible:ring-brand-blue/25 flex items-center gap-2 rounded-full border border-brand-blue bg-white py-2.5 px-4 text-xs font-semibold text-brand-blue outline-none focus-visible:ring-[3px] transition-all hover:bg-brand-blue/5 cursor-pointer shadow-2xs shrink-0"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-brand-blue shrink-0" />
            <span>
              Date: <strong className="text-zinc-950 font-bold">{sortDir === "desc" ? "Newest First" : "Oldest First"}</strong>
            </span>
          </button>

          {/* Add Staff Button */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-blue/90 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff / Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${
            refreshing ? "opacity-70" : "opacity-100"
          }`}
        >
          {/* Fixed Top Header */}
          <div className="shrink-0 bg-brand-blue text-white rounded-2xl px-6 py-3.5 shadow-xs mb-2">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold">
              <div className="col-span-3 min-w-0">Staff Member</div>
              <div className="col-span-2 min-w-0">Role & Permissions</div>
              <div className="col-span-3 min-w-0">Position / Designation</div>
              <div className="col-span-1 min-w-0 text-center">Status</div>
              <div className="col-span-2 min-w-0">Last Activity</div>
              <div className="col-span-1 min-w-0 text-right">Actions</div>
            </div>
          </div>

          {/* Scrollable Rows */}
          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-2 pr-1"
          >
            {loading && displayedStaff.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-600">
                Loading staff and administrator accounts…
              </div>
            )}
            {!loading && displayedStaff.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-600">
                No staff accounts found matching your filters.
              </div>
            )}
            {displayedStaff.map((staff) => {
              const roleBadge = ROLE_INFO[staff.role] || ROLE_INFO.ADMIN;

              return (
                <div
                  key={staff.id}
                  className="grid grid-cols-12 gap-3 items-center group cursor-default bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl p-4 transition-all hover:ring-brand-blue/40 text-sm"
                >
                  {/* Name & Email */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-950 text-sm truncate">{staff.name || "Administrator"}</span>
                      <span className="font-mono text-xs text-zinc-500 truncate">{staff.email}</span>
                    </div>
                  </div>

                  {/* Role Capsule */}
                  <div className="col-span-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide truncate ${roleBadge.bgClass}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="truncate">{roleBadge.label}</span>
                    </span>
                  </div>

                  {/* Position / Designation */}
                  <div className="col-span-3 min-w-0 text-xs font-semibold text-zinc-800 truncate">
                    {staff.position || "Staff Member"}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 min-w-0 text-center">
                    {staff.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : staff.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </div>

                  {/* Last Activity */}
                  <div className="col-span-2 min-w-0 text-xs text-zinc-500 font-mono truncate">
                    {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleDateString() : "Never"}
                  </div>

                  {/* Row Actions */}
                  <div className="col-span-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleInitiateToggleBlock(staff)}
                        title={staff.isActive ? "Block administrator account" : "Unblock administrator account"}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          staff.isActive
                            ? "text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {staff.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTarget(staff)}
                        title="Edit staff details"
                        className="p-1.5 text-zinc-400 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordModalTarget(staff)}
                        title="Change password"
                        className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(staff)}
                        title="Delete staff account"
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1 pb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedStaff.map((staff) => {
              const roleBadge = ROLE_INFO[staff.role] || ROLE_INFO.ADMIN;

              return (
                <div
                  key={staff.id}
                  className="relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs hover:border-brand-blue/60 hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Row: Role + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${roleBadge.bgClass}`}>
                        {roleBadge.label}
                      </span>
                      {staff.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <Ban className="h-3 w-3" /> Blocked
                        </span>
                      )}
                    </div>

                    {/* Name & Position */}
                    <div>
                      <h3 className="text-base font-bold text-zinc-950">{staff.name || "Administrator"}</h3>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{staff.email}</p>
                    </div>

                    {/* Metadata Summary */}
                    <div className="space-y-2 pt-3 border-t border-zinc-100 text-xs text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" /> Position:
                        </span>
                        <span className="font-semibold text-zinc-800">{staff.position || "—"}</span>
                      </div>
                    </div>
                  </div>


                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Created: {new Date(staff.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleInitiateToggleBlock(staff)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          staff.isActive
                            ? "text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={staff.isActive ? "Block account" : "Unblock account"}
                      >
                        {staff.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModalTarget(staff)}
                        className="p-1.5 text-zinc-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordModalTarget(staff)}
                        className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Change password"
                      >
                        <Key className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(staff)}
                        className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}


      {/* CREATE STAFF MODAL */}
      {createModalOpen && (
        <CreateStaffModal
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleInitiateCreate}
          isLoading={isRequestingOtp}
        />
      )}

      {/* EDIT STAFF MODAL */}
      {editModalTarget && (
        <EditStaffModal
          staff={editModalTarget}
          onClose={() => setEditModalTarget(null)}
          onSubmit={handleInitiateUpdate}
          isLoading={isRequestingOtp}
        />
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalTarget && (
        <ChangePasswordModal
          staff={passwordModalTarget}
          onClose={() => setPasswordModalTarget(null)}
          onSubmit={handleInitiatePasswordReset}
          isLoading={isRequestingOtp}
        />
      )}

      {/* OTP VERIFICATION MODAL */}
      {otpModalOpen && (
        <OtpVerificationModal
          actionType={otpActionType}
          sentTo={otpSentTo}
          devHint={otpDevHint}
          countdown={otpCountdown}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onResend={() => triggerOtpRequest(`${otpActionType}_STAFF`)}
          onClose={() => {
            setOtpModalOpen(false);
            setActionError(null);
          }}
          onConfirm={handleExecuteWithOtp}
          isLoading={isSubmittingAction}
          error={actionError}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODALS WITH CUSTOM-BUILT DROPDOWNS
// -------------------------------------------------------------

function CreateStaffModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState<AdminRoleName>("ADMIN");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Dropdown Open State
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError(null);
    onSubmit({ name, email, position, role, password });
  };

  const currentRoleInfo = ROLE_INFO[role] || ROLE_INFO.ADMIN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Add Staff / Administrator</h3>
              <p className="text-xs text-zinc-400">Configure new internal credentials and access scope</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tariq Al-Ghamdi"
                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address (Login ID)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@rvcc.com"
                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Position / Designation</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Procurement Manager"
              className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs"
            />
          </div>

          {/* Custom Role Dropdown */}
          <div className="relative">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Access Role & Scope</label>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-left hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs cursor-pointer"
            >
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${currentRoleInfo.bgClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {currentRoleInfo.label}
              </span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
            </button>


            {roleDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                {(Object.keys(ROLE_INFO) as AdminRoleName[]).map((rKey) => {
                  const rInfo = ROLE_INFO[rKey];
                  const isSelected = role === rKey;

                  return (
                    <button
                      key={rKey}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRole(rKey);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${rInfo.bgClass}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {rInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{rInfo.desc}</p>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-brand-blue shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Initial Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 pr-10 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Continue with OTP Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStaffModal({
  staff,
  onClose,
  onSubmit,
  isLoading,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(staff.name || "");
  const [position, setPosition] = useState(staff.position || "");
  const [role, setRole] = useState<AdminRoleName>(staff.role);
  const [isActive, setIsActive] = useState<boolean>(staff.isActive);

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: staff.id, name, position, role, isActive });
  };

  const currentRoleInfo = ROLE_INFO[role] || ROLE_INFO.ADMIN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Edit Staff Profile</h3>
              <p className="text-xs text-zinc-400 font-mono">{staff.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Position / Designation</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Senior Procurement Manager"
              className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs"
            />
          </div>

          {/* Custom Role Dropdown */}
          <div className="relative">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Access Role & Permissions</label>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-left hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-2xs cursor-pointer"
            >
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${currentRoleInfo.bgClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {currentRoleInfo.label}
              </span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
            </button>


            {roleDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-2xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                {(Object.keys(ROLE_INFO) as AdminRoleName[]).map((rKey) => {
                  const rInfo = ROLE_INFO[rKey];
                  const isSelected = role === rKey;

                  return (
                    <button
                      key={rKey}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRole(rKey);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${rInfo.bgClass}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {rInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{rInfo.desc}</p>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-brand-blue shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>


          <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
            <div>
              <span className="text-xs font-bold text-zinc-900 block">Account Active Status</span>
              <span className="text-[11px] text-zinc-500">Disable to immediately prevent login to admin portal</span>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-brand-blue rounded focus:ring-brand-blue/30 cursor-pointer"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Save with OTP Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ChangePasswordModal({
  staff,
  onClose,
  onSubmit,
  isLoading,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  isLoading: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    onSubmit({ id: staff.id, newPassword });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Reset Staff Password</h3>
              <p className="text-xs text-zinc-400 font-mono">{staff.name || staff.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">{error}</div>}

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Note: Changing the password will immediately revoke all active sessions for this account across all devices.
          </p>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify with OTP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OtpVerificationModal({
  actionType,
  sentTo,
  devHint,
  countdown,
  otpCode,
  setOtpCode,
  onResend,
  onClose,
  onConfirm,
  isLoading,
  error,
}: {
  actionType: string;
  sentTo: string;
  devHint?: string;
  countdown: number;
  otpCode: string;
  setOtpCode: (v: string) => void;
  onResend: () => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split current otpCode into array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => otpCode[i] || "");

  useEffect(() => {
    // Focus first input on modal mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "");
    if (!numeric) {
      // Clear current digit
      const next = digits.slice();
      next[index] = "";
      setOtpCode(next.join(""));
      return;
    }

    const char = numeric[numeric.length - 1]; // Take last typed character
    const next = digits.slice();
    next[index] = char;
    const newCode = next.join("");
    setOtpCode(newCode);

    // Auto-advance to next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current box is empty, jump back to previous box and clear it
        const next = digits.slice();
        next[index - 1] = "";
        setOtpCode(next.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = digits.slice();
        next[index] = "";
        setOtpCode(next.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtpCode(pasted);
      const targetFocusIndex = Math.min(pasted.length, 5);
      inputRefs.current[targetFocusIndex]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">Security Verification Required</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            A 6-digit security OTP code was sent to <strong className="text-zinc-800 font-semibold">{sentTo}</strong> to authorize this {actionType.toLowerCase()} action.
          </p>
        </div>

        {devHint && (
          <div className="mt-3 p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">Local Dev Test Code</span>
            <span className="font-mono text-sm font-extrabold text-amber-950 tracking-widest">{devHint}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200 text-center">{error}</div>}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block text-center mb-3">
              Enter 6-Digit OTP Code
            </label>

            {/* Individual 6-Box Digits */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {Array.from({ length: 6 }).map((_, idx) => {
                const isFilled = Boolean(digits[idx]);

                return (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d*"
                    maxLength={1}
                    value={digits[idx] || ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`h-12 w-11 sm:h-13 sm:w-12 rounded-2xl border text-center text-xl font-bold font-mono transition-all duration-150 focus:outline-none ${
                      isFilled
                        ? "border-brand-blue bg-blue-50/30 text-brand-blue shadow-xs"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-900 focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-blue/15"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              Expires in: <strong className="font-mono text-zinc-800">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</strong>
            </span>
            <button
              type="button"
              onClick={onResend}
              disabled={countdown > 240}
              className="text-brand-blue font-semibold hover:underline disabled:text-zinc-400 disabled:no-underline cursor-pointer"
            >
              Resend OTP
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || otpCode.length < 6}
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-blue px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify & Authorize</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

