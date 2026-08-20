"use client";

import { useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

import { Icons } from "@/lib/icons";

import type { JobPosition } from "@/data/careers";

import { cn } from "@lib/utils";

/** Postings come from the database via the careers page (server component). */
export const CareerList = ({ positions }: { positions: JobPosition[] }) => {
  const [activeDepartment, setActiveDepartment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  // ReCAPTCHA State
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleVerificationTrigger = async () => {
    setIsVerifying(true);
    setCaptchaError(false);

    // Execute invisible recaptcha
    if (recaptchaRef.current) {
      try {
        const token = await recaptchaRef.current.executeAsync();
        if (token) {
          setIsVerified(true);
        } else {
          setCaptchaError(true);
        }
      } catch (error) {
        setCaptchaError(true);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const departments = ["All", ...new Set(positions.map((j) => j.department))];

  const filteredJobs = positions.filter((job) => {
    const matchesDept = activeDepartment === "All" || job.department === activeDepartment;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJob) return;

    if (!isVerified) {
      setCaptchaError(true);
      return;
    }

    if (!cvFile) {
      setSubmitError("Please upload your CV (PDF).");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const form = new FormData();
      form.set("jobPostingId", selectedJob.id);
      form.set("fullName", fullName.trim());
      form.set("email", email.trim());
      form.set("phone", phone.trim());
      form.set("cv", cvFile);

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError((data as { error?: string }).error || "Application failed. Please try again.");
        return;
      }

      setApplicationSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setCvFile(null);
      setTimeout(() => {
        setIsApplying(false);
        setSelectedJob(null);
        setApplicationSuccess(false);
        setIsVerified(false);
      }, 2000);
    } catch {
      setSubmitError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        {/* Search and Filter Section */}
        <div className="mb-20 space-y-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="group focus-within:border-brand-blue relative max-w-2xl flex-1 border-b border-zinc-200 transition-all">
              <Icons.Search className="group-focus-within:text-brand-blue absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 text-zinc-400 transition-colors" />
              <input
                type="text"
                placeholder="Search positions, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-foreground w-full bg-transparent py-5 pr-4 pl-10 text-lg font-light tracking-wide outline-none placeholder:text-zinc-300"
              />
            </div>

            {/* Department Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="mr-4 text-[10px] font-bold tracking-[0.4em] text-zinc-400 uppercase">
                List By:
              </span>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setActiveDepartment(dept)}
                  className={`border px-6 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                    activeDepartment === dept
                      ? "bg-brand-blue border-brand-blue text-white shadow-lg"
                      : "hover:border-brand-blue hover:text-brand-blue border-zinc-200 text-zinc-500"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs Grid (3-column on large screens) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => {
                  setSelectedJob(job);
                  setIsApplying(false);
                }}
                className="group hover:border-brand-blue/40 relative cursor-pointer border border-zinc-200 bg-white p-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)] transition-all duration-700 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)]"
              >
                {/* Hover Accent Line */}
                <div className="bg-brand-blue absolute top-0 left-0 h-full w-0 transition-all duration-700 group-hover:w-1" />

                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="bg-brand-blue/5 text-brand-blue px-2.5 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase">
                      {job.department}
                    </span>
                    <span className="text-[9px] font-light tracking-widest text-zinc-400 uppercase">
                      {job.type}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-heading text-foreground group-hover:text-brand-blue text-2xl font-black uppercase transition-all duration-500 group-hover:translate-x-1 lg:text-3xl">
                      {job.title}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed font-light text-zinc-500">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-6">
                    <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-zinc-400 uppercase">
                      <Icons.MapPin className="text-brand-blue h-3.5 w-3.5" />
                      {job.isRemote ? <span>Remote Job</span> : job.location}
                    </div>
                    <div className="group-hover:bg-brand-blue flex h-8 w-8 items-center justify-center bg-zinc-50 text-zinc-400 transition-all duration-500 group-hover:text-white">
                      <Icons.ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredJobs.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-2xl font-light text-zinc-400 italic">No matching positions found.</p>
          </div>
        )}

        {/* Job Detail & Application Modal */}
        <AnimatePresence>
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
            >
              <div
                className="bg-background/98 absolute inset-0 backdrop-blur-2xl"
                onClick={() => !isApplying && setSelectedJob(null)}
              />

              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative h-full w-full overflow-hidden bg-white"
              >
                <div
                  className="flex h-full flex-col overflow-hidden lg:flex-row"
                  data-lenis-prevent
                >
                  {/* Left Side: Info (Scrollable) */}
                  <div className="custom-scrollbar flex-1 overflow-y-auto p-8 md:p-16 lg:p-20">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="group hover:text-brand-blue mb-12 flex items-center gap-3 text-[10px] font-bold tracking-[0.4em] text-zinc-400 uppercase transition-all"
                    >
                      <Icons.ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                      Back to opportunities
                    </button>

                    {!isApplying ? (
                      <div className="mt-20 space-y-24">
                        <div className="space-y-4">
                          <span className="text-brand-blue text-[11px] font-black tracking-[0.5em] uppercase">
                            {selectedJob.department}
                          </span>
                          <h2 className="font-heading text-5xl leading-[1.1] tracking-tighter text-zinc-900 uppercase md:text-7xl lg:text-8xl">
                            {selectedJob.title}
                          </h2>
                          {selectedJob.isRemote && (
                            <span className="bg-brand-blue/10 text-brand-blue inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase italic">
                              Remote Position
                            </span>
                          )}
                        </div>

                        <section className="space-y-8">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                            The Mission
                          </h4>
                          <p className="text-xl leading-[1.6] font-light text-zinc-600 italic md:text-2xl lg:max-w-2xl">
                            "{selectedJob.description}"
                          </p>
                        </section>

                        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                          <section className="space-y-8">
                            <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                              Technical Requirements
                            </h4>
                            <ul className="space-y-5">
                              {selectedJob.requirements.map((req, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-4 text-sm leading-relaxed font-light text-zinc-500"
                                >
                                  <div className="bg-brand-blue mt-2.5 h-[1px] w-4 shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </section>
                          <section className="space-y-8">
                            <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                              Environment & Perks
                            </h4>
                            <ul className="space-y-5">
                              {selectedJob.benefits.map((benefit, i) => (
                                <li
                                  key={i}
                                  className="text-brand-blue flex items-center gap-4 text-sm font-bold tracking-widest uppercase"
                                >
                                  <span className="text-lg">+</span>
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </section>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-20 flex min-h-[60vh] flex-col items-center justify-center">
                        {applicationSuccess ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center space-y-8 bg-zinc-50 py-24 text-center"
                          >
                            <div className="bg-brand-blue/10 text-brand-blue flex h-24 w-24 items-center justify-center rounded-full">
                              <Icons.ChevronDown className="h-12 w-12 rotate-[-90deg]" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-heading text-4xl font-black tracking-tighter text-zinc-900 uppercase">
                                Application Received
                              </h3>
                              <p className="font-light text-zinc-400">
                                We will calibrate our response and contact you soon.
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <form
                            onSubmit={handleApply}
                            className="flex w-full max-w-4xl flex-col items-center space-y-16 text-center"
                          >
                            <div className="space-y-4">
                              <h3 className="font-heading text-4xl tracking-tighter text-zinc-900 uppercase md:text-5xl">
                                Submit Application
                              </h3>
                              <p className="text-brand-blue text-[12px] leading-[0.5em] font-light tracking-[0.2em] uppercase">
                                For {selectedJob.title}
                              </p>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-12 text-left md:grid-cols-2">
                              {submitError ? (
                                <p
                                  role="alert"
                                  className="md:col-span-2 text-sm font-medium text-red-600"
                                >
                                  {submitError}
                                </p>
                              ) : null}
                              {/* Left Column: Personal Data */}
                              <div className="space-y-10">
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Name
                                  </label>
                                  <input
                                    required
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="e.g. Abdullah Ahmed"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-300"
                                  />
                                </div>
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Email
                                  </label>
                                  <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="abdullah@example.com"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-300"
                                  />
                                </div>
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Phone
                                  </label>
                                  <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+966 5X XXX XXXX"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-300"
                                  />
                                </div>
                              </div>

                              {/* Right Column: Professional Links & Files */}
                              <div className="flex h-full flex-col space-y-6">
                                <div className="space-y-4">
                                  <label className="text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                                    CV / CV Archive (PDF)
                                  </label>
                                  <div className="group hover:border-brand-blue relative flex h-48 w-full cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-zinc-200 bg-zinc-50/30 transition-all">
                                    <input
                                      required
                                      type="file"
                                      accept=".pdf,application/pdf"
                                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                      onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                                    />
                                    <Icons.File className="group-hover:text-brand-blue mb-2 h-8 w-8 text-zinc-200 transition-all" />
                                    <p className="group-hover:text-brand-blue text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                                      {cvFile ? cvFile.name : "Upload The CV"}
                                    </p>
                                    <div className="bg-brand-blue/5 absolute inset-0 origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
                                  </div>
                                </div>

                                {/* Modern Google Identity Verification UI */}
                                <div className="pt-2">
                                  <div className="space-y-3">
                                    <label
                                      className={cn(
                                        "text-[9px] font-black tracking-[0.4em] uppercase transition-colors",
                                        captchaError ? "text-red-500" : "text-zinc-400"
                                      )}
                                    >
                                      Identity Verification
                                    </label>

                                    <button
                                      type="button"
                                      onClick={handleVerificationTrigger}
                                      disabled={isVerified || isVerifying}
                                      className={cn(
                                        "group relative flex h-14 w-full items-center overflow-hidden border px-6 transition-all duration-500",
                                        isVerified
                                          ? "bg-brand-blue/5 border-brand-blue text-brand-blue"
                                          : captchaError
                                            ? "border-red-500 bg-red-50 text-red-500"
                                            : "hover:border-brand-blue border-zinc-200 bg-white text-zinc-500"
                                      )}
                                    >
                                      <div className="relative z-10 flex w-full items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          {isVerifying ? (
                                            <div className="border-brand-blue h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                          ) : isVerified ? (
                                            <Icons.Plus className="text-brand-blue h-4 w-4 rotate-45" />
                                          ) : (
                                            <div className="h-4 w-4 rounded-sm border-2 border-current opacity-30 transition-opacity group-hover:opacity-100" />
                                          )}
                                          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                            {isVerifying
                                              ? "Verifying..."
                                              : isVerified
                                                ? "Human Verified"
                                                : "Confirm Identity"}
                                          </span>
                                        </div>

                                        <div className="flex items-center opacity-40">
                                          <Icons.Shield className="mr-1.5 h-3.5 w-3.5" />
                                          <span className="text-[8px] font-black tracking-widest uppercase">
                                            Secured
                                          </span>
                                        </div>
                                      </div>

                                      {/* Background Animation */}
                                      {!isVerified && !isVerifying && (
                                        <div className="bg-brand-blue/5 absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-0" />
                                      )}
                                    </button>
                                  </div>

                                  <div className="h-0 overflow-hidden opacity-0">
                                    <ReCAPTCHA
                                      ref={recaptchaRef}
                                      sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                      size="invisible"
                                      onChange={(token) => {
                                        if (token) setIsVerified(true);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex w-full max-w-2xl items-center gap-4 pt-4">
                              <button
                                type="button"
                                onClick={() => setIsApplying(false)}
                                className="hover:border-brand-blue hover:text-brand-blue flex-1 border border-zinc-200 py-5 text-center text-[10px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-all"
                              >
                                Back to details
                              </button>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="hover:bg-brand-blue font-brand-blue flex-[2] bg-white py-4 text-[16px] font-bold tracking-[0.2em] text-black uppercase shadow-2xl transition-all active:scale-[0.98] disabled:opacity-60"
                              >
                                {submitting ? "Sending…" : "Send Application"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Quick Specs Sidebar */}
                  {!isApplying && (
                    <div className="flex w-full flex-col justify-between border-l border-zinc-100 bg-zinc-50 p-8 md:p-16 lg:w-[400px]">
                      <div className="space-y-16">
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Location
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic">
                            {selectedJob.isRemote ? "Global / Remote" : selectedJob.location}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Contract
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic">
                            {selectedJob.type}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Posted
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic">
                            {selectedJob.postedAt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsApplying(true);
                        }}
                        className="bg-brand-blue mt-24 py-8 text-[11px] font-bold tracking-[0.6em] text-white uppercase shadow-2xl transition-all hover:scale-[1.02] hover:bg-zinc-900"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
