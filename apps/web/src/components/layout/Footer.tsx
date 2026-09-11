"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import {
  LuArrowRight,
  LuArrowUp,
  LuCheck,
  LuCopy,
  LuMail,
  LuMapPin,
  LuPhone,
  LuSparkles,
} from "react-icons/lu";

import { useLanguage } from "@/context/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("info@rvcc.sa");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) return;
    setNewsletterSubscribed(true);
  };

  const navLinks = [
    { name: t.header.about || "About Us", href: "/about" },
    { name: t.header.services || "Our Services", href: "/services" },
    { name: t.header.projects || "Projects & Works", href: "/projects" },
    { name: "News & Events", href: "/news" },
    { name: "Media Gallery", href: "/gallary" },
    { name: "Clients & Partners", href: "/clients" },
    { name: t.header.contacts || "Contact Us", href: "/contact" },
  ];

  const serviceLinks = [
    { name: "Civil Construction", href: "/services" },
    { name: "Urban Landscaping & Parks", href: "/services" },
    { name: "Heavy Earthworks", href: "/services" },
    { name: "Precision Land Survey", href: "/services" },
    { name: "Artificial Turf & Sports Grounds", href: "/services" },
    { name: "Infrastructure Engineering", href: "/services" },
  ];

  const governanceLinks = [
    { name: "Quality & Safety Policy", href: "/quality-policy" },
    { name: "Corporate Documents", href: "/documents" },
    { name: "Careers & Opportunities", href: "/careers" },
    { name: "Vendor Registration", href: "/contact" },
    { name: "Riyadh Headquarters Direct", href: "/contact" },
  ];

  const socialLinks = [
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn size={15} />,
      href: "https://linkedin.com",
      color: "hover:text-[#0a66c2] hover:border-[#0a66c2]/40",
    },
    {
      name: "X (Twitter)",
      icon: <FaXTwitter size={15} />,
      href: "https://twitter.com",
      color: "hover:text-white hover:border-white/40",
    },
    {
      name: "Instagram",
      icon: <FaInstagram size={15} />,
      href: "https://instagram.com",
      color: "hover:text-[#e4405f] hover:border-[#e4405f]/40",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={15} />,
      href: "https://wa.me/966112345678",
      color: "hover:text-[#25d366] hover:border-[#25d366]/40",
    },
    {
      name: "YouTube",
      icon: <FaYoutube size={15} />,
      href: "https://youtube.com",
      color: "hover:text-[#ff0000] hover:border-[#ff0000]/40",
    },
    {
      name: "Facebook",
      icon: <FaFacebookF size={15} />,
      href: "https://facebook.com",
      color: "hover:text-[#1877f2] hover:border-[#1877f2]/40",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#050911] text-zinc-300 antialiased">
      {/* Ambient Architectural Lighting & Blueprint Gradients */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-radial from-brand-blue/15 via-brand-blue/5 to-transparent blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[450px] w-[500px] rounded-full bg-radial from-brand-blue/10 via-brand-blue/0 to-transparent blur-[120px]" />
        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-12 sm:px-8 lg:px-12 lg:pt-28">
        {/* ── 1. HIGH-IMPACT COLLABORATION BANNER ─────────────────────────────── */}
        <div className="relative mb-20 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 shadow-2xl backdrop-blur-xl md:p-12 lg:mb-24 lg:p-16">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-brand-blue/15 blur-[90px]" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-brand-blue uppercase">
                  <LuSparkles size={12} className="animate-pulse" />
                  Vision 2030 Partner
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  Riyadh HQ • Open Now
                </span>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to Shape the Kingdom&apos;s Next Landmark?
              </h2>

              <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                Collaborate with Riyadh Villas Contracting Co. for master-planned infrastructure,
                precision civil works, and iconic architectural developments.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row">
              <Link
                href="/enquire"
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-brand-blue px-7 py-4 text-xs font-bold tracking-wider text-white shadow-[0_10px_30px_rgba(0,115,188,0.3)] transition-all duration-300 hover:bg-brand-blue/90 hover:shadow-[0_15px_40px_rgba(0,115,188,0.4)]"
              >
                <span>START A CONSULTATION</span>
                <LuArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-xs font-semibold tracking-wider text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
              >
                EXPLORE PROJECTS
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. QUICK CONTACT STRIP ─────────────────────────────────────────── */}
        <div className="mb-20 grid grid-cols-1 gap-4 border-y border-white/[0.08] py-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Location */}
          <a
            href="https://maps.app.goo.gl/2krZ3M8LdrmmGu6w6"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/10 hover:bg-white/[0.02]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-blue transition-colors group-hover:border-brand-blue/40 group-hover:bg-brand-blue/10">
              <LuMapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Headquarters
              </p>
              <p className="truncate text-sm font-semibold text-white group-hover:text-brand-blue transition-colors">
                Al Olaya, 6705, Riyadh 12221
              </p>
            </div>
          </a>

          {/* Phone */}
          <a
            href="tel:+966112345678"
            className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/10 hover:bg-white/[0.02]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-blue transition-colors group-hover:border-brand-blue/40 group-hover:bg-brand-blue/10">
              <LuPhone size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Call Direct
              </p>
              <p className="truncate text-sm font-semibold text-white group-hover:text-brand-blue transition-colors">
                +966 11 234 5678
              </p>
            </div>
          </a>

          {/* Email with copy action */}
          <div className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition-colors hover:border-white/10 hover:bg-white/[0.02]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-blue transition-colors group-hover:border-brand-blue/40 group-hover:bg-brand-blue/10">
                <LuMail size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Direct Inquiries
                </p>
                <a
                  href="mailto:info@rvcc.sa"
                  className="truncate block text-sm font-semibold text-white hover:text-brand-blue transition-colors"
                >
                  info@rvcc.sa
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={copyEmailToClipboard}
              title="Copy email address"
              className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              {copiedEmail ? <LuCheck size={14} className="text-emerald-400" /> : <LuCopy size={14} />}
            </button>
          </div>
        </div>

        {/* ── 3. MAIN NAVIGATION MATRIX ──────────────────────────────────────── */}
        <div className="mb-24 grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand & Credibility (4 Cols) */}
          <div className="space-y-6 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <div className="relative h-10 w-44">
                <Image
                  src="/images/logo/logo.webp"
                  alt="RVCC Logo"
                  fill
                  className="object-contain object-left brightness-0 invert"
                />
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Riyadh Villas Contracting Co. delivers landmark civil construction, master-planned
              parks, and precision engineering across Saudi Arabia, supporting the ambitious Vision 2030 blueprint.
            </p>

            {/* Certifications & Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                ISO 9001:2015
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                Class-A Contractor
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                Vision 2030
              </span>
            </div>
          </div>

          {/* Column 2: Navigation Links (2 Cols) */}
          <div className="space-y-4 lg:col-span-2">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="inline-block text-zinc-400 transition-colors duration-200 hover:translate-x-1 hover:text-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Core Disciplines (3 Cols) */}
          <div className="space-y-4 lg:col-span-3">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase">
              Capabilities
            </h4>
            <ul className="space-y-2.5 text-sm">
              {serviceLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="inline-block text-zinc-400 transition-colors duration-200 hover:translate-x-1 hover:text-white"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Intelligence Dispatch / Newsletter (3 Cols) */}
          <div className="space-y-4 sm:col-span-2 md:col-span-3 lg:col-span-3">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase">
              Intelligence Brief
            </h4>
            <p className="text-xs leading-relaxed text-zinc-400">
              Receive quarterly updates on our civil infrastructure milestones and upcoming Saudi development tenders.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="name@company.sa"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={newsletterSubscribed}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 pr-11 text-xs text-white placeholder-zinc-500 transition-colors focus:border-brand-blue focus:bg-white/[0.07] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={newsletterSubscribed}
                  className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue text-white transition-colors hover:bg-brand-blue/90 disabled:bg-emerald-500"
                >
                  {newsletterSubscribed ? <LuCheck size={13} /> : <LuArrowRight size={13} />}
                </button>
              </div>
              <AnimatePresence>
                {newsletterSubscribed && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] font-medium text-emerald-400"
                  >
                    Thank you. You are subscribed to RVCC insights.
                  </motion.p>
                )}
              </AnimatePresence>
            </form>

            <div className="pt-2">
              <p className="text-[11px] text-zinc-500">
                Official Saudi Commercial Reg: <strong>1010000000</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. SOCIAL PRESENCE & BACK TO TOP ───────────────────────────────── */}
        <div className="mb-12 flex flex-col items-center justify-between gap-6 border-t border-white/[0.08] pt-8 md:flex-row">
          {/* Social Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition-all duration-300 hover:scale-105 hover:bg-white/[0.08] ${social.color}`}
              >
                {social.icon}
              </a>
            ))}
          </div>

          {/* Back to Top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-400 transition-all duration-300 hover:border-brand-blue/40 hover:bg-brand-blue/10 hover:text-white"
          >
            <span>BACK TO TOP</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-blue">
              <LuArrowUp size={13} />
            </span>
          </button>
        </div>

        {/* ── 5. BOTTOM BAR & LEGAL NOTICE ──────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 text-[11px] text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Riyadh Villas Contracting Co. (RVCC). All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/quality-policy" className="transition-colors hover:text-zinc-300">
              Quality Policy
            </Link>
            <Link href="/documents" className="transition-colors hover:text-zinc-300">
              Compliance
            </Link>
            <Link href="/contact" className="transition-colors hover:text-zinc-300">
              Terms of Engagement
            </Link>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Kingdom of Saudi Arabia 🇸🇦</span>
          </div>
        </div>
      </div>

      {/* ── 6. SIGNATURE MONUMENTAL WATERMARK ───────────────────────────────── */}
      <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none opacity-[0.03]">
        <span className="text-[12vw] font-black tracking-tighter text-white uppercase whitespace-nowrap">
          RIYADH VILLAS
        </span>
      </div>
    </footer>
  );
};
