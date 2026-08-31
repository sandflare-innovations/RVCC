import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KpiCard } from "@/components/ui";
import { VENDOR_COOKIE } from "@/lib/constants";
import { summariseVendorDashboard,type VendorRequirementRow } from "@/lib/rfq";
import { getVendorFromSession } from "@/lib/session";
import { vendorApiFetch } from "@/lib/vendor-api";
import { OverviewNextActions } from "@/sections/dashboard/OverviewNextActions";
import { VendorHeroSearch } from "@/sections/dashboard/VendorHeroSearch";

export const dynamic = "force-dynamic";

type DashboardRegistration = {
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  businessRelationship: string;
  productCategories: string[];
  company: {
    legalName: string;
    dbaName: string;
    country: string;
    organizationType: string;
    website: string;
  } | null;
};

type DashboardPayload = {
  registration: DashboardRegistration | null;
  requirements: VendorRequirementRow[];
};

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1 border-t border-zinc-100 py-3 first:border-t-0 sm:grid-cols-3">
      <dt className="text-xs font-bold tracking-[0.12em] text-zinc-500 uppercase">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 sm:col-span-2">{value || "—"}</dd>
    </div>
  );
}

export default async function VendorDashboard() {
  const vendor = await getVendorFromSession();
  if (!vendor) return null;
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let payload: DashboardPayload = { registration: null, requirements: [] };
  try {
    const res = await vendorApiFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) {
      payload = (await res.json()) as DashboardPayload;
    }
  } catch (err) {
    console.error("[vendor] dashboard fetch failed", err);
  }

  const { counts, nextActions } = summariseVendorDashboard({ requirements: payload.requirements });
  const registration = payload.registration;
  const companyName = registration?.company?.legalName;
  const submitted =
    registration?.submittedAt != null
      ? new Date(registration.submittedAt).toLocaleDateString("en-GB")
      : null;

  const kpis = [
    { label: "Open invitations", value: counts.open, icon: <Inbox className="h-4 w-4" /> },
    { label: "Due in 48h", value: counts.dueSoon, icon: <Clock className="h-4 w-4" /> },
    { label: "Submitted", value: counts.submitted, icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: "Drafts", value: counts.drafts, icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="animate-in fade-in relative z-10 -mt-8 space-y-12 pt-0 duration-500">
      {/* Hero Welcome Section matching screenshot */}
      <div className="bg-brand-blue relative z-40 mb-10 flex min-h-[calc(100vh-290px)] flex-col items-center justify-center space-y-6 overflow-hidden rounded-b-[2.5rem] px-4 py-8 text-center text-white shadow-sm md:space-y-8 md:py-10">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          {/* Left Decorative Pill */}
          <div
            className="absolute top-1/2 -left-32 h-[240px] w-[500px] -translate-y-1/2 rounded-r-full border-[40px] border-l-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 20%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 20%, black 100%)",
            }}
          />
          {/* Right Top Decorative Pill */}
          <div
            className="absolute -top-12 -right-24 h-[200px] w-[400px] rounded-l-full border-[32px] border-r-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to left, transparent 10%, black 100%)",
              maskImage: "linear-gradient(to left, transparent 10%, black 100%)",
            }}
          />
          {/* Right Bottom Decorative Pill */}
          <div
            className="absolute -right-32 bottom-8 h-[220px] w-[450px] rounded-l-full border-[40px] border-r-0 border-white"
            style={{
              WebkitMaskImage: "linear-gradient(to left, transparent 10%, black 100%)",
              maskImage: "linear-gradient(to left, transparent 10%, black 100%)",
            }}
          />
        </div>

        <h1 className="relative z-10 mt-8 px-4 text-4xl font-bold tracking-tight text-white drop-shadow-sm md:text-5xl lg:text-6xl">
          Welcome to Vendor Portal!
        </h1>

        {/* Search Bar */}
        <div className="relative z-10 w-full max-w-2xl px-4 pb-4">
          <VendorHeroSearch />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-3">
        {/* Left Side (Spans 2 columns) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Latest docs */}
          <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">Latest docs</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  id: 1,
                  name: "Agency client contra...",
                  color: "bg-brand-blue",
                  icon: <FileText className="h-4 w-4 text-white" />,
                },
                {
                  id: 2,
                  name: "Main concept.pdf",
                  color: "bg-brand-blue/80",
                  icon: <FileText className="h-4 w-4 text-white" />,
                },
                {
                  id: 3,
                  name: "Agreement.pdf",
                  color: "bg-brand-blue/60",
                  icon: <FileText className="h-4 w-4 text-white" />,
                },
                {
                  id: 4,
                  name: "Weekly team meetin...",
                  color: "bg-brand-blue/40",
                  icon: <FileText className="h-4 w-4 text-white" />,
                },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className="hover:border-brand-blue/30 group flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-100 p-3 transition-colors"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${doc.color} transition-transform group-hover:scale-105`}
                  >
                    {doc.icon}
                  </div>
                  <span className="truncate text-sm font-medium text-zinc-700">{doc.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="#"
                className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
              >
                View all
              </Link>
            </div>
          </section>

          {/* Bottom Row inside Left Side (Messages & Actions) */}
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Latest messages */}
            <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">
                Latest messages
              </h2>
              <div className="flex-1 space-y-4">
                {[
                  {
                    id: 1,
                    text: "Send me the agreement to assign",
                    initial: "A",
                    color: "bg-brand-blue/10 text-brand-blue",
                  },
                  {
                    id: 2,
                    text: "Please review the new specs",
                    initial: "B",
                    color: "bg-brand-blue/20 text-brand-blue",
                  },
                ].map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="border-brand-blue/30 h-4 w-4 rounded-full border-2"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-snug text-zinc-600">{msg.text}</p>
                    </div>
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${msg.color}`}
                    >
                      {msg.initial}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="#"
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
                >
                  View all
                </Link>
              </div>
            </section>

            {/* Your next actions */}
            <section className="flex flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">
                Your next actions
              </h2>
              <div className="flex-1">
                <OverviewNextActions actions={nextActions} />
              </div>
              <div className="mt-6">
                <Link
                  href="#"
                  className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
                >
                  View all
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Right Side (Running Bids) */}
        <div className="h-full lg:col-span-1">
          <section className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold tracking-tight text-zinc-900">Running bids</h2>
            <div className="flex-1 space-y-5">
              {[
                {
                  id: "1",
                  title: "Office Supplies Q3",
                  month: "May",
                  day: "31",
                  time: "10:00-11:00",
                  bg: "bg-[#3C99DC]",
                  textColor: "text-white",
                },
                {
                  id: "2",
                  title: "IT Equipment Refresh",
                  month: "Jun",
                  day: "15",
                  time: "14:00-15:00",
                  bg: "bg-[#2565AE]",
                  textColor: "text-white",
                },
                {
                  id: "3",
                  title: "Marketing Materials",
                  month: "Jul",
                  day: "02",
                  time: "09:00-10:00",
                  bg: "bg-[#0F5298]",
                  textColor: "text-white",
                },
              ].map((bid) => (
                <div
                  key={bid.id}
                  className={`flex items-center gap-6 ${bid.bg} min-h-[120px] rounded-[20px] p-6 shadow-sm transition-transform hover:scale-[1.02]`}
                >
                  {/* Clean White Date Box */}
                  <div className="flex h-[80px] w-[80px] flex-shrink-0 flex-col items-center justify-center rounded-xl border border-black/5 bg-white shadow-sm">
                    <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
                      {bid.month}
                    </span>
                    <span className="mt-0.5 text-3xl leading-none font-black text-zinc-900">
                      {bid.day}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-bold ${bid.textColor} text-lg tracking-tight`}>
                      {bid.title}
                    </h3>
                    <p
                      className={`text-sm ${bid.textColor === "text-white" ? "text-white/90" : "text-zinc-700"} mt-1.5 font-medium`}
                    >
                      {bid.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/requirements"
                className="text-brand-blue hover:text-brand-blue/80 text-sm font-bold transition-colors"
              >
                View all
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* 3 Item Lists matching the KPIs */}
      <div className="grid w-full gap-6 lg:grid-cols-3">
        {/* Open Invitations */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <Inbox className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Open invitations</h2>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { id: 1, title: "Office Supplies Q3", date: "May 31", time: "10:00" },
              { id: 2, title: "IT Equipment Refresh", date: "Jun 15", time: "14:00" },
              { id: 3, title: "Marketing Materials", date: "Jul 02", time: "09:00" },
            ].map((item) => (
              <div
                key={item.id}
                className="hover:border-brand-blue/30 group flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="group-hover:bg-brand-blue h-2 w-2 rounded-full bg-blue-400 transition-colors"></div>
                  <div>
                    <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">Invited {item.date}</p>
                  </div>
                </div>
                <div className="rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-400">
                  New
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              View all open invitations <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Submitted */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Submitted</h2>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { id: 1, title: "Q2 Catering Services", date: "May 10", status: "Under Review" },
              { id: 2, title: "Security Audit 2026", date: "Apr 28", status: "Evaluated" },
            ].map((item) => (
              <div
                key={item.id}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 transition-all hover:border-emerald-200"
              >
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">Submitted on {item.date}</p>
                  </div>
                </div>
                <div className="rounded-md bg-emerald-100/50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              View all submitted <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Drafts */}
        <section className="flex min-h-[400px] flex-col rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-brand-blue/10 text-brand-blue flex h-8 w-8 items-center justify-center rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Drafts</h2>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { id: 1, title: "Fleet Vehicles", updated: "2 hours ago" },
              { id: 2, title: "Cloud Hosting Renewal", updated: "Yesterday" },
            ].map((item) => (
              <div
                key={item.id}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:border-zinc-300"
              >
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-zinc-300"></div>
                  <div>
                    <h3 className="group-hover:text-brand-blue text-sm font-bold text-zinc-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">Last edited {item.updated}</p>
                  </div>
                </div>
                <div className="group-hover:text-brand-blue text-zinc-400 transition-colors">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link
              href="/requirements"
              className="text-brand-blue hover:text-brand-blue/80 inline-flex items-center gap-1 text-sm font-bold transition-colors"
            >
              Continue drafts <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
