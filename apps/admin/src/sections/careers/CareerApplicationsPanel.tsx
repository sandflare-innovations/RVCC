"use client";

import { Calendar, Clock, Download, Eye, FileText, Mail, Phone, User, Users, X } from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cvFileName: string;
  cvFileUrl: string;
  createdAt: string;
};

export function CareerApplicationsPanel({ applications }: { applications: Application[] }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0073bc]">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950 sm:text-base">
              Candidate Applications
            </h2>
            <p className="text-xs text-zinc-500">
              Profiles and CV submissions received for this role.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0073bc]">
          {applications.length} {applications.length === 1 ? "Applicant" : "Applicants"}
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-xs font-semibold text-zinc-700">No applications received yet</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Once candidates submit their CVs through the public careers portal, they will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#0073bc] text-xs uppercase ring-1 ring-blue-100">
                  {app.fullName.slice(0, 2)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-zinc-950 truncate">{app.fullName}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <a
                      href={`mailto:${app.email}`}
                      className="inline-flex items-center gap-1 hover:text-[#0073bc] hover:underline"
                    >
                      <Mail className="h-3 w-3 text-zinc-400" />
                      <span>{app.email}</span>
                    </a>
                    {app.phone && (
                      <a
                        href={`tel:${app.phone}`}
                        className="inline-flex items-center gap-1 hover:text-[#0073bc]"
                      >
                        <Phone className="h-3 w-3 text-zinc-400" />
                        <span>{app.phone}</span>
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <Calendar className="h-3 w-3" />
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-GB") : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedApp(app)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-[#0073bc] shadow-2xs hover:bg-blue-100/80 transition-all cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Details</span>
                </button>

                <a
                  href={app.cvFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#005fa0] transition-all shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{app.cvFileName || "Download CV"}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      <Modal
        open={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        description="Review candidate background, submission timestamp, and submitted curriculum vitae."
        maxWidth="md"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Close
            </button>
            {selectedApp?.cvFileUrl && (
              <a
                href={selectedApp.cvFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005fa0] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Attached CV</span>
              </a>
            )}
          </div>
        }
      >
        {selectedApp && (
          <div className="space-y-4 pt-1">
            {/* Header card with initials */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-zinc-50/80 p-4 border border-zinc-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white font-bold text-base uppercase shadow-xs">
                {selectedApp.fullName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-950 truncate">
                  {selectedApp.fullName}
                </h3>
                <p className="text-xs text-zinc-400">
                  Applied on{" "}
                  {selectedApp.createdAt
                    ? new Date(selectedApp.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" />
                  Email Address
                </span>
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="mt-1 block truncate text-xs font-bold text-[#0073bc] hover:underline"
                >
                  {selectedApp.email}
                </a>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  Contact Phone
                </span>
                <a
                  href={selectedApp.phone ? `tel:${selectedApp.phone}` : undefined}
                  className="mt-1 block truncate text-xs font-bold text-zinc-800 hover:text-[#0073bc]"
                >
                  {selectedApp.phone || "Not provided"}
                </a>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Exact Time
                </span>
                <p className="mt-1 text-xs font-bold text-zinc-800">
                  {selectedApp.createdAt
                    ? new Date(selectedApp.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Candidate ID
                </span>
                <p className="mt-1 truncate font-mono text-xs font-semibold text-zinc-500">
                  {selectedApp.id.slice(0, 12)}...
                </p>
              </div>
            </div>

            {/* Resume / Document section */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                Attached Curriculum Vitae (CV)
              </span>
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0073bc]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-zinc-900">
                      {selectedApp.cvFileName || "Candidate_CV.pdf"}
                    </p>
                    <span className="text-[11px] text-zinc-400">PDF Document</span>
                  </div>
                </div>

                <a
                  href={selectedApp.cvFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0073bc] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#005fa0] transition-colors shrink-0"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

