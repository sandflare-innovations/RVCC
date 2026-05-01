"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import { useLanguage } from "@/context/LanguageContext";

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

  const socialLinks = [
    { name: "Facebook", icon: <FaFacebookF />, href: "#" },
    { name: "Instagram", icon: <FaInstagram />, href: "#" },
    { name: "LinkedIn", icon: <FaLinkedinIn />, href: "#" },
    { name: "Twitter", icon: <FaXTwitter />, href: "#" },
    { name: "WhatsApp", icon: <FaWhatsapp />, href: "#" },
    { name: "YouTube", icon: <FaYoutube />, href: "#" },
  ];

  return (
    <footer className="bg-background relative overflow-hidden py-0">
      <div className="mx-auto">
        <div className="bg-brand-blue dark:text-theme-bg section-padding relative z-10 container overflow-hidden text-white">
          {/* Decorative Lines instead of Circles for Sharp Design */}
          <div className="pointer-events-none absolute top-0 right-0 h-px w-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-white/10" />
          <div className="pointer-events-none absolute top-0 right-0 h-full w-px bg-white/10" />
          <div className="pointer-events-none absolute top-0 left-0 h-full w-px bg-white/10" />

          <div className="relative z-10 w-full">
            {/* Main Content Grid */}
            <div className="mb-32 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-24">
              {/* Navigation Links */}
              <div className="flex flex-col items-start gap-4 text-left">
                <span className="mb-6 text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
                  Explore
                </span>
                {navLinks.map((link, index) => (
                  <motion.a
                    key={index}
                    href={link.href}
                    whileHover={{ letterSpacing: "0.1em" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="group relative w-fit text-lg font-light transition-all duration-500 hover:text-white/70"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                  </motion.a>
                ))}
              </div>

              {/* Services Links */}
              <div className="flex flex-col items-start gap-4 text-left">
                <span className="mb-6 text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
                  Our Services
                </span>
                {[
                  "Civil Construction",
                  "Urban Landscaping",
                  "Heavy Earth Works",
                  "Precision Land Survey",
                  "Artificial Grass",
                ].map((item, index) => (
                  <motion.a
                    key={index}
                    href="#services"
                    whileHover={{ letterSpacing: "0.1em" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="group relative w-fit text-lg font-light transition-all duration-500 hover:text-white/70"
                  >
                    <span>{item}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                  </motion.a>
                ))}
              </div>

              {/* Industries Links */}
              <div className="flex flex-col items-start gap-4 text-left">
                <span className="mb-6 text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
                  Industries
                </span>
                {[
                  "Residential Projects",
                  "Commercial Hubs",
                  "Industrial Zones",
                  "Infrastructure",
                  "Public Spaces",
                ].map((item, index) => (
                  <motion.a
                    key={index}
                    href="#projects"
                    whileHover={{ letterSpacing: "0.1em" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="group relative w-fit text-lg font-light transition-all duration-500 hover:text-white/70"
                  >
                    <span>{item}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                  </motion.a>
                ))}
              </div>

              {/* Company Info */}
              <div className="flex flex-col items-start gap-4 text-left">
                <span className="mb-6 text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
                  Company
                </span>
                {[
                  { name: "Safety & Quality", href: "#" },
                  { name: "Sustainability", href: "#" },
                  { name: "Our Team", href: "#" },
                  { name: "Careers", href: "#" },
                  { name: "Privacy Policy", href: "#" },
                ].map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    whileHover={{ letterSpacing: "0.1em" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="group relative w-fit text-lg font-light transition-all duration-500 hover:text-white/70"
                  >
                    <span>{item.name}</span>
                    <span className="absolute bottom-0 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-element-gap pb-header-mb relative border-t border-white/10">
              <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
                {/* Social Icons - Expanded List */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {socialLinks.map((social, idx) => (
                    <motion.a
                      key={idx}
                      href={social.href}
                      whileHover={{ y: -5 }}
                      className="hover:text-brand-blue flex h-12 w-12 items-center justify-center border border-white/10 bg-white/5 text-white transition-all duration-500 hover:bg-white"
                      title={social.name}
                    >
                      <div className="text-xl">{social.icon}</div>
                    </motion.a>
                  ))}
                </div>

                {/* Scroll to Top Button (Moved here) */}
                <motion.button
                  onClick={scrollToTop}
                  whileHover={{ y: -5 }}
                  className="hover:text-brand-blue flex h-12 w-12 items-center justify-center rounded-none border border-white/20 backdrop-blur-sm transition-all duration-500 hover:bg-white"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </motion.button>
              </div>

              {/* Credits & Info */}
              <div className="mt-16 flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-white/20">
                  <span>© 2026 RVCC</span>
                  <span className="h-px w-8 bg-white/10" />
                  <span>BUILT BY RVCC IT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Reveal Logo at the bottom */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 w-full max-w-5xl -translate-x-1/2 overflow-hidden">
            <motion.div
              initial={{ y: "100%" }}
              whileInView={{ y: "25%" }}
              transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
              viewport={{ once: false }}
              className="relative aspect-[3/1] w-full opacity-20"
              style={{ filter: "brightness(0) invert(1)" }}
            >
              <Image
                src="/images/logo/logo.png"
                alt="RVCC Large Logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};
