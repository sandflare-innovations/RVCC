"use client";

import React from "react";

import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";

const FooterBoxMask = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="footer-box-mask" clipPathUnits="objectBoundingBox">
        <path
          d="
            M 0 0 
            L 0.15 0 
            C 0.2 0, 0.22 0.05, 0.28 0.05 
            L 0.72 0.05 
            C 0.78 0.05, 0.8 0, 0.85 0 
            L 1 0 
            L 1 1 
            L 0.85 1 
            C 0.8 1, 0.78 0.95, 0.72 0.95 
            L 0.28 0.95 
            C 0.22 0.95, 0.2 1, 0.15 1 
            L 0 1 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
);

export const Footer = () => {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { name: t.header.about, href: "#about" },
    { name: t.header.services, href: "#services" },
    { name: t.header.projects, href: "#projects" },
    { name: t.header.contacts, href: "#contacts" },
  ];

  return (
    <footer className="from-theme-bg bg-background relative overflow-hidden py-10 dark:to-black">
      <FooterBoxMask />
      <div className="mx-auto">
        <div
          className="bg-brand-blue dark:text-theme-bg relative z-10 overflow-hidden p-10 pb-20 text-white"
          style={{ clipPath: "url(#footer-box-mask)" }}
        >
          {/* Decorative Circles from Reference Image */}
          <div className="pointer-events-none absolute top-0 right-0 h-[800px] w-[800px] translate-x-1/4 -translate-y-1/2 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/4 translate-y-1/2 rounded-full border border-white/10" />

          <div className="relative z-10 w-full">
            {/* Top Header Row: Inquire & Scroll to Top */}
            <div className="mb-20 flex items-center justify-between pt-10 md:mb-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-background border-theme-bg text-brand-blue flex items-center gap-3 rounded-full border p-3 px-8 text-[10px] font-black tracking-[0.3em] shadow-2xl transition-all duration-500 hover:opacity-90"
              >
                <div className="bg-brand-blue text-brand-blue h-1.5 w-1.5 rounded-full" />
                INQUIRE NOW
              </motion.button>

              <motion.button
                onClick={scrollToTop}
                whileHover={{ y: -10 }}
                className="hover:bg-background hover:text-brand-blue flex h-14 w-14 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-500"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </motion.button>
            </div>

            {/* Main Content Grid: Bold Links & Address Info */}
            <div className="mb-10 grid grid-cols-1 items-end gap-20 lg:grid-cols-2">
              {/* Big Navigation Links (Reference Design) */}
              <div className="flex flex-col gap-4 md:gap-8">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={index}
                    href={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group inline-block text-3xl leading-none font-semibold transition-all duration-500 hover:translate-x-4"
                  >
                    <span>{link.name}</span>
                  </motion.a>
                ))}
              </div>

              {/* Address Info (Migrated from old site) */}
              <div className="space-y-10 lg:text-right">
                <div className="space-y-4">
                  <h4 className="dark:text-theme-bg/70 text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">
                    Contact Us
                  </h4>
                  <a
                    href="tel:+966555027436"
                    className="group block text-2xl font-semibold transition-colors hover:text-white/80 md:text-3xl"
                  >
                    <span>+966 555027436</span>
                  </a>
                  <a
                    href="mailto:rvce@rvce.com.sa"
                    className="group block text-2xl font-semibold transition-colors hover:text-white/80 md:text-3xl"
                  >
                    <span>rvce@rvce.com.sa</span>
                  </a>
                </div>
                <div>
                  <h4 className="dark:text-theme-bg/70 mb-4 text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">
                    Location
                  </h4>
                  <p className="max-w-xs text-sm leading-relaxed font-bold opacity-70 lg:ml-auto">
                    Riyadh Villas Contracting Company, P O Box: 22483, Riyadh: 11495, Saudi Arabia
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Credits (Reference Image Style) */}
            <div className="flex flex-col items-center justify-between gap-12 border-t border-white/10 pt-10 md:flex-row">
              {/* Social Icons (White bg, blue icon) */}
              <div className="flex items-center gap-5">
                {[
                  {
                    name: "Facebook",
                    svg: (
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    ),
                  },
                  {
                    name: "Instagram",
                    svg: (
                      <>
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </>
                    ),
                  },
                  {
                    name: "Twitter",
                    svg: (
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    ),
                  },
                  {
                    name: "LinkedIn",
                    svg: (
                      <>
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </>
                    ),
                  },
                  {
                    name: "WhatsApp",
                    svg: (
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    ),
                  },
                ].map((social, idx) => (
                  <motion.a
                    key={idx}
                    href="#"
                    whileHover={{ scale: 1.15, y: -5 }}
                    className="dark:bg-theme-bg text-brand-blue flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-500 dark:shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                    title={social.name}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4.5 w-4.5"
                    >
                      {social.svg}
                    </svg>
                  </motion.a>
                ))}
              </div>

              <div className="dark:text-theme-bg hover:text-brand-blue cursor-pointer rounded-full bg-white/5 px-6 py-3 text-[10px] font-black tracking-[0.5em] text-white uppercase backdrop-blur-sm transition-colors">
                Privacy Policy
              </div>

              <div className="dark:text-theme-bg/70 flex flex-col items-center gap-4 text-[10px] font-bold tracking-[0.2em] text-white/40 md:flex-row">
                <span className="tracking-[0.4em] uppercase">© 2026 RVCC</span>
                <span className="hidden opacity-20 md:block">|</span>
                <span className="flex items-center gap-2 tracking-[0.4em] uppercase">
                  Web by <span className="dark:text-theme-bg text-white">RVCC IT</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
