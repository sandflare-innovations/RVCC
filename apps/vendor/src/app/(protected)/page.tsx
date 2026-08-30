import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertCircle, Building2, CheckCircle2, Clock, FileText, Inbox, ArrowUpRight } from "lucide-react";

import { type VendorRequirementRow, summariseVendorDashboard } from "@/lib/rfq";
import { KpiCard, StatusBadge } from "@/components/ui";

import { VENDOR_COOKIE } from "@/lib/constants";
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
  let loadError: number | null = null;

  try {
    const res = await vendorApiFetch("/dashboard", { method: "GET", sessionToken: token });
    if (res.ok) {
      payload = (await res.json()) as DashboardPayload;
    } else {
      loadError = res.status;
    }
  } catch (err) {
    console.error("[vendor] dashboard fetch failed", err);
    loadError = 503;
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Could not load dashboard ({loadError}).</p>
        </div>
      </div>
    );
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
    <div className="animate-in fade-in space-y-12 duration-500 relative z-10 -mt-8 pt-0">
      
      {/* Hero Welcome Section matching screenshot */}
      <div className="bg-brand-blue rounded-b-[2.5rem] flex flex-col items-center justify-center text-center px-4 py-8 md:py-10 text-white space-y-6 md:space-y-8 mb-10 shadow-sm relative z-40 overflow-hidden min-h-[calc(100vh-290px)]">
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          {/* Left Decorative Pill */}
          <div 
            className="absolute -left-32 top-1/2 -translate-y-1/2 w-[500px] h-[240px] border-[40px] border-white rounded-r-full border-l-0" 
            style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 20%, black 100%)', maskImage: 'linear-gradient(to right, transparent 20%, black 100%)' }}
          />
          {/* Right Top Decorative Pill */}
          <div 
            className="absolute -right-24 -top-12 w-[400px] h-[200px] border-[32px] border-white rounded-l-full border-r-0" 
            style={{ WebkitMaskImage: 'linear-gradient(to left, transparent 10%, black 100%)', maskImage: 'linear-gradient(to left, transparent 10%, black 100%)' }}
          />
          {/* Right Bottom Decorative Pill */}
          <div 
            className="absolute -right-32 bottom-8 w-[450px] h-[220px] border-[40px] border-white rounded-l-full border-r-0" 
            style={{ WebkitMaskImage: 'linear-gradient(to left, transparent 10%, black 100%)', maskImage: 'linear-gradient(to left, transparent 10%, black 100%)' }}
          />
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-sm relative z-10 px-4 mt-8">
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

      <div className="grid gap-6 lg:grid-cols-3 w-full">
        {/* Left Side (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Latest docs */}
          <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Latest docs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 1, name: "Agency client contra...", color: "bg-brand-blue", icon: <FileText className="w-4 h-4 text-white" /> },
                { id: 2, name: "Main concept.pdf", color: "bg-brand-blue/80", icon: <FileText className="w-4 h-4 text-white" /> },
                { id: 3, name: "Agreement.pdf", color: "bg-brand-blue/60", icon: <FileText className="w-4 h-4 text-white" /> },
                { id: 4, name: "Weekly team meetin...", color: "bg-brand-blue/40", icon: <FileText className="w-4 h-4 text-white" /> },
              ].map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 rounded-2xl border border-zinc-100 p-3 hover:border-brand-blue/30 transition-colors cursor-pointer group">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm ${doc.color} group-hover:scale-105 transition-transform`}>
                    {doc.icon}
                  </div>
                  <span className="text-sm font-medium text-zinc-700 truncate">{doc.name}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href="#" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
                View all
              </Link>
            </div>
          </section>

          {/* Bottom Row inside Left Side (Messages & Actions) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            
            {/* Latest messages */}
            <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Latest messages</h2>
              <div className="space-y-4 flex-1">
                {[
                  { id: 1, text: "Send me the agreement to assign", initial: "A", color: "bg-brand-blue/10 text-brand-blue" },
                  { id: 2, text: "Please review the new specs", initial: "B", color: "bg-brand-blue/20 text-brand-blue" },
                ].map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="w-4 h-4 rounded-full border-2 border-brand-blue/30"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-600 leading-snug">{msg.text}</p>
                    </div>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${msg.color}`}>
                      {msg.initial}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="#" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
                  View all
                </Link>
              </div>
            </section>

            {/* Your next actions */}
            <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Your next actions</h2>
              <div className="flex-1">
                <OverviewNextActions actions={nextActions} />
              </div>
              <div className="mt-6">
                <Link href="#" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
                  View all
                </Link>
              </div>
            </section>

          </div>
        </div>

        {/* Right Side (Running Bids) */}
        <div className="lg:col-span-1 h-full">
          <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 h-full flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 tracking-tight">Running bids</h2>
            <div className="space-y-5 flex-1">
              {[
                { id: "1", title: "Office Supplies Q3", month: "May", day: "31", time: "10:00-11:00", bg: "bg-[#3C99DC]", textColor: "text-white" },
                { id: "2", title: "IT Equipment Refresh", month: "Jun", day: "15", time: "14:00-15:00", bg: "bg-[#2565AE]", textColor: "text-white" },
                { id: "3", title: "Marketing Materials", month: "Jul", day: "02", time: "09:00-10:00", bg: "bg-[#0F5298]", textColor: "text-white" },
              ].map((bid) => (
                <div key={bid.id} className={`flex items-center gap-6 ${bid.bg} rounded-[20px] p-6 transition-transform hover:scale-[1.02] shadow-sm min-h-[120px]`}>
                  {/* Clean White Date Box */}
                  <div className="flex flex-col items-center justify-center bg-white rounded-xl w-[80px] h-[80px] shadow-sm flex-shrink-0 border border-black/5">
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{bid.month}</span>
                    <span className="text-3xl font-black text-zinc-900 leading-none mt-0.5">{bid.day}</span>
                  </div>
                  <div>
                    <h3 className={`font-bold ${bid.textColor} text-lg tracking-tight`}>{bid.title}</h3>
                    <p className={`text-sm ${bid.textColor === 'text-white' ? 'text-white/90' : 'text-zinc-700'} mt-1.5 font-medium`}>{bid.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/requirements" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors">
                View all
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* 3 Item Lists matching the KPIs */}
      <div className="grid gap-6 lg:grid-cols-3 w-full">
        
        {/* Open Invitations */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Inbox className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Open invitations</h2>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { id: 1, title: "Office Supplies Q3", date: "May 31", time: "10:00" },
              { id: 2, title: "IT Equipment Refresh", date: "Jun 15", time: "14:00" },
              { id: 3, title: "Marketing Materials", date: "Jul 02", time: "09:00" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-white hover:border-brand-blue/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-brand-blue transition-colors"></div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Invited {item.date}</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-md">New</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link href="/requirements" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors inline-flex items-center gap-1">
              View all open invitations <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>



        {/* Submitted */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Submitted</h2>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { id: 1, title: "Q2 Catering Services", date: "May 10", status: "Under Review" },
              { id: 2, title: "Security Audit 2026", date: "Apr 28", status: "Evaluated" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:border-emerald-200 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Submitted on {item.date}</p>
                  </div>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-md">{item.status}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link href="/requirements" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors inline-flex items-center gap-1">
              View all submitted <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Drafts */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Drafts</h2>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { id: 1, title: "Fleet Vehicles", updated: "2 hours ago" },
              { id: 2, title: "Cloud Hosting Renewal", updated: "Yesterday" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Last edited {item.updated}</p>
                  </div>
                </div>
                <div className="text-zinc-400 group-hover:text-brand-blue transition-colors">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <Link href="/requirements" className="text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors inline-flex items-center gap-1">
              Continue drafts <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
