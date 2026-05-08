"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { JobPosition, OPEN_POSITIONS } from "@/data/careers";

export const CareerList = () => {
  const [activeDepartment, setActiveDepartment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  const departments = ["All", ...new Set(OPEN_POSITIONS.map((j) => j.department))];

  const filteredJobs = OPEN_POSITIONS.filter((job) => {
    const matchesDept = activeDepartment === "All" || job.department === activeDepartment;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setApplicationSuccess(true);
    setTimeout(() => {
      setIsApplying(false);
      setSelectedJob(null);
      setApplicationSuccess(false);
    }, 2000);
  };

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-6">
        {/* Search and Filter Section */}
        <div className="mb-20 space-y-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="group focus-within:border-brand-blue relative max-w-2xl flex-1 border-b border-zinc-200 transition-all dark:border-white/10">
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
                      : "hover:border-brand-blue hover:text-brand-blue border-zinc-200 text-zinc-500 dark:border-white/5"
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
                className="group hover:border-brand-blue/40 relative cursor-pointer border border-zinc-300 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:border-white/20 dark:bg-white/5"
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

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-6 dark:border-white/10">
                    <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-zinc-400 uppercase">
                      <Icons.MapPin className="text-brand-blue h-3.5 w-3.5" />
                      {job.isRemote ? <span>Remote Job</span> : job.location}
                    </div>
                    <div className="group-hover:bg-brand-blue flex h-8 w-8 items-center justify-center bg-zinc-50 text-zinc-400 transition-all duration-500 group-hover:text-white dark:bg-white/5">
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
                className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-950"
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
                          <h2 className="font-heading text-5xl leading-[1.1] tracking-tighter text-zinc-900 uppercase md:text-7xl lg:text-8xl dark:text-white">
                            {selectedJob.title}
                          </h2>
                          {selectedJob.isRemote && (
                            <span className="bg-brand-blue/10 text-brand-blue inline-block px-3 py-1 text-[10px] font-bold tracking-widest uppercase italic">
                              Remote Position
                            </span>
                          )}
                        </div>

                        <section className="space-y-8">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase dark:text-zinc-500">
                            The Mission
                          </h4>
                          <p className="text-xl leading-[1.6] font-light text-zinc-600 italic md:text-2xl lg:max-w-2xl dark:text-zinc-300">
                            "{selectedJob.description}"
                          </p>
                        </section>

                        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                          <section className="space-y-8">
                            <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase dark:text-zinc-500">
                              Technical Requirements
                            </h4>
                            <ul className="space-y-5">
                              {selectedJob.requirements.map((req, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-4 text-sm leading-relaxed font-light text-zinc-500 dark:text-zinc-400"
                                >
                                  <div className="bg-brand-blue mt-2.5 h-[1px] w-4 shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </section>
                          <section className="space-y-8">
                            <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-400 uppercase dark:text-zinc-500">
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
                            className="flex flex-col items-center justify-center space-y-8 bg-zinc-50 py-24 text-center dark:bg-white/5"
                          >
                            <div className="bg-brand-blue/10 text-brand-blue flex h-24 w-24 items-center justify-center rounded-full">
                              <Icons.ChevronDown className="h-12 w-12 rotate-[-90deg]" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-heading text-4xl font-black tracking-tighter text-zinc-900 uppercase dark:text-white">
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
                              <h3 className="font-heading text-4xl tracking-tighter text-zinc-900 uppercase md:text-5xl dark:text-white">
                                Submit Application
                              </h3>
                              <p className="text-brand-blue text-[12px] leading-[0.5em] font-light tracking-[0.2em] uppercase">
                                For {selectedJob.title}
                              </p>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-12 text-left md:grid-cols-2">
                              {/* Left Column: Personal Data */}
                              <div className="space-y-10">
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Name
                                  </label>
                                  <input
                                    required
                                    type="text"
                                    placeholder="e.g. Abdullah Ahmed"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-200 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-800"
                                  />
                                </div>
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Email
                                  </label>
                                  <input
                                    required
                                    type="email"
                                    placeholder="abdullah@example.com"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-200 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-800"
                                  />
                                </div>
                                <div className="group space-y-2">
                                  <label className="group-focus-within:text-brand-blue text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-colors">
                                    Phone
                                  </label>
                                  <input
                                    required
                                    type="tel"
                                    placeholder="+966 5X XXX XXXX"
                                    className="focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-lg text-zinc-900 transition-all outline-none placeholder:text-zinc-200 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-800"
                                  />
                                </div>
                              </div>

                              {/* Right Column: Professional Links & Files */}
                              <div className="space-y-10">
                                <div className="h-full space-y-10">
                                  <label className="text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase">
                                    CV / CV Archive (PDF)
                                  </label>
                                  <div className="group hover:border-brand-blue relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-zinc-200 bg-zinc-50/30 transition-all dark:border-white/10 dark:bg-white/5">
                                    <input
                                      required
                                      type="file"
                                      accept=".pdf"
                                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                    />
                                    <Icons.File className="group-hover:text-brand-blue mb-2 h-8 w-8 text-zinc-200 transition-all" />
                                    <p className="group-hover:text-brand-blue text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                                      Upload The CV
                                    </p>
                                    <div className="bg-brand-blue/5 absolute inset-0 origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex w-full max-w-2xl items-center gap-4 pt-4">
                              <button
                                type="button"
                                onClick={() => setIsApplying(false)}
                                className="hover:border-brand-blue hover:text-brand-blue flex-1 border border-zinc-200 py-5 text-center text-[10px] font-black tracking-[0.4em] text-zinc-400 uppercase transition-all dark:border-white/10"
                              >
                                Back to details
                              </button>
                              <button
                                type="submit"
                                className="hover:bg-brand-blue font-brand-blue flex-[2] bg-white py-3 text-[16px] font-bold tracking-[0.2em] text-black uppercase shadow-2xl transition-all active:scale-[0.98] dark:hover:text-zinc-900"
                              >
                                Send Application
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Quick Specs Sidebar */}
                  {!isApplying && (
                    <div className="flex w-full flex-col justify-between border-l border-zinc-100 bg-zinc-50 p-8 md:p-16 lg:w-[400px] dark:border-white/10 dark:bg-zinc-900">
                      <div className="space-y-16">
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Location
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic dark:text-white">
                            {selectedJob.isRemote ? "Global / Remote" : selectedJob.location}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Contract
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic dark:text-white">
                            {selectedJob.type}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-black tracking-[0.4em] text-zinc-300 uppercase">
                            Posted
                          </h4>
                          <p className="font-heading text-2xl tracking-tighter text-zinc-900 uppercase italic dark:text-white">
                            {selectedJob.postedAt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsApplying(true)}
                        className="bg-brand-blue mt-24 py-8 text-[11px] font-bold tracking-[0.6em] text-white uppercase shadow-2xl transition-all hover:scale-[1.02] hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-black"
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
