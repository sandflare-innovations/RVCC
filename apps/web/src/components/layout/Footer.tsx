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
    { name: "Heavy Earth Works", href: "/services" },
    { name: "Precision Land Survey", href: "/services" },
    { name: "Artificial Grass & Turf", href: "/services" },
    { name: "Infrastructure Engineering", href: "/services" },
  ];

  const companyLinks = [
    { name: "Safety & Quality Policy", href: "/quality-policy" },
    { name: "Corporate Documents", href: "/documents" },
    { name: "Careers & Recruitment", href: "/careers" },
    { name: "Vendor Registration", href: "/contact" },
    { name: "Headquarters Direct", href: "/contact" },
  ];

  const socialLinks = [
    {
      name: "LinkedIn",
      icon: <FaLinkedinIn size={16} />,
      href: "https://linkedin.com",
    },
    {
      name: "X (Twitter)",
      icon: <FaXTwitter size={16} />,
      href: "https://twitter.com",
    },
    {
      name: "Instagram",
      icon: <FaInstagram size={16} />,
      href: "https://instagram.com",
    },
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={16} />,
      href: "https://wa.me/966112345678",
    },
    {
      name: "YouTube",
      icon: <FaYoutube size={16} />,
      href: "https://youtube.com",
    },
    {
      name: "Facebook",
      icon: <FaFacebookF size={16} />,
      href: "https://facebook.com",
    },
  ];

  return (
    <footer className="bg-brand-blue relative overflow-hidden text-white antialiased">
      {/* Precision Decorative Geometric Hairlines */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-0 right-0 h-px w-full bg-white/15" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-white/15" />
        <div className="absolute top-0 right-0 h-full w-px bg-white/10" />
        <div className="absolute top-0 left-0 h-full w-px bg-white/10" />
        {/* Subtle luminous ambient highlights */}
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-[130px]" />
        <div className="absolute -bottom-20 right-10 h-80 w-80 rounded-full bg-black/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 sm:px-8 lg:px-12 lg:pt-24">
        {/* ── TOP CONTACT & HEADQUARTERS BAR ─────────────────────────────────── */}
        <div className="mb-16 grid grid-cols-1 gap-4 border-b border-white/15 pb-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Location */}
          <a
            href="https://maps.app.goo.gl/2krZ3M8LdrmmGu6w6"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-brand-blue">
              <LuMapPin size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                Headquarters
              </p>
              <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-white/90">
                Al Olaya, 6705, Riyadh 12221
              </p>
            </div>
          </a>

          {/* Phone */}
          <a
            href="tel:+966112345678"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-brand-blue">
              <LuPhone size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                Call Direct
              </p>
              <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-white/90">
                +966 11 234 5678
              </p>
            </div>
          </a>

          {/* Email with copy action */}
          <div className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-brand-blue">
                <LuMail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                  Direct Inquiries
                </p>
                <a
                  href="mailto:info@rvcc.sa"
                  className="truncate block text-sm font-semibold text-white hover:underline"
                >
                  info@rvcc.sa
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={copyEmailToClipboard}
              title="Copy email address"
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:bg-white hover:text-brand-blue"
            >
              {copiedEmail ? <LuCheck size={14} className="text-emerald-300" /> : <LuCopy size={14} />}
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT NAVIGATION GRID ───────────────────────────────────── */}
        <div className="mb-20 grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 lg:gap-8">
          {/* Brand Info & Vision (4 Cols) */}
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

            <p className="max-w-sm text-sm leading-relaxed font-light text-white/80">
              Riyadh Villas Contracting Co. is a premier Saudi construction and engineering firm
              delivering landmark civil projects, master-planned parks, and precision infrastructure aligned with Vision 2030.
            </p>

            {/* Credential Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90">
                ISO 9001:2015
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90">
                Class-A Contractor
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90">
                Saudi Vision 2030
              </span>
            </div>
          </div>

          {/* Explore Links (2 Cols) */}
          <div className="space-y-4 lg:col-span-2">
            <span className="block text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">
              Explore
            </span>
            <ul className="space-y-3 text-sm font-light">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group relative inline-block text-white/85 transition-all duration-300 hover:translate-x-1 hover:text-white"
                  >
                    <span>{item.name}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services (3 Cols) */}
          <div className="space-y-4 lg:col-span-3">
            <span className="block text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">
              Our Services
            </span>
            <ul className="space-y-3 text-sm font-light">
              {serviceLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group relative inline-block text-white/85 transition-all duration-300 hover:translate-x-1 hover:text-white"
                  >
                    <span>{item.name}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Newsletter (3 Cols) */}
          <div className="space-y-6 sm:col-span-2 md:col-span-3 lg:col-span-3">
            <div className="space-y-3">
              <span className="block text-[11px] font-bold tracking-[0.3em] text-white/40 uppercase">
                Company
              </span>
              <ul className="space-y-2.5 text-sm font-light">
                {companyLinks.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="group relative inline-block text-white/85 transition-all duration-300 hover:translate-x-1 hover:text-white"
                    >
                      <span>{item.name}</span>
                      <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Dispatch */}
            <div className="space-y-2.5 pt-2">
              <span className="block text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">
                Stay Updated
              </span>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    placeholder="Enter email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={newsletterSubscribed}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-white/50 transition-colors focus:border-white focus:bg-white/15 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={newsletterSubscribed}
                    className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand-blue shadow-sm transition-transform hover:scale-105 disabled:bg-emerald-400 disabled:text-white"
                  >
                    {newsletterSubscribed ? <LuCheck size={13} /> : <LuArrowRight size={13} />}
                  </button>
                </div>
                <AnimatePresence>
                  {newsletterSubscribed && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] font-medium text-emerald-300"
                    >
                      Thank you for subscribing to RVCC updates.
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>

        {/* ── SOCIAL PRESENCE & SCROLL TO TOP ─────────────────────────────────── */}
        <div className="mb-12 flex flex-col items-center justify-between gap-6 border-t border-white/15 pt-8 md:flex-row">
          {/* Social Icons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                whileHover={{ y: -4 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-brand-blue"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>

          {/* Scroll to Top Button */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -4 }}
            className="group flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs font-bold tracking-widest text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-brand-blue"
          >
            <span>BACK TO TOP</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-brand-blue group-hover:text-white">
              <LuArrowUp size={12} />
            </span>
          </motion.button>
        </div>

        {/* ── CREDITS & LEGAL INFO ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[11px] text-white/50 sm:flex-row">
          <div className="flex items-center gap-3 tracking-widest">
            <span>© {new Date().getFullYear()} RVCC. ALL RIGHTS RESERVED.</span>
            <span className="h-px w-6 bg-white/20" />
            <span>BUILT BY RVCC IT</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/quality-policy" className="transition-colors hover:text-white">
              Quality Policy
            </Link>
            <Link href="/documents" className="transition-colors hover:text-white">
              Compliance
            </Link>
            <Link href="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
            <span className="text-white/30">•</span>
            <span className="text-white/70">Kingdom of Saudi Arabia 🇸🇦</span>
          </div>
        </div>

        {/* ── LARGE REVEAL LOGO AT BOTTOM ────────────────────────────────────── */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 w-full max-w-5xl -translate-x-1/2 overflow-hidden">
          <motion.div
            initial={{ y: "100%" }}
            whileInView={{ y: "25%" }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            viewport={{ once: true }}
            className="relative aspect-[3/1] w-full opacity-20"
            style={{ filter: "brightness(0) invert(1)" }}
          >
            <Image
              src="/images/logo/logo.webp"
              alt="RVCC Large Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
