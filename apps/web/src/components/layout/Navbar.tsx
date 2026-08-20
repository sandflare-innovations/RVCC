"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { useTheme } from "next-themes";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import { Icons } from "@/lib/icons";

import { enquireVerifyUrl } from "@/lib/public-urls";

import { AnimatedThemeToggler } from "@ui/AnimatedThemeToggler";
import { Button } from "@ui/Button";

import { cn } from "@lib/utils";

export const Navbar = () => {
  const pathname = usePathname();
  const enquireHref = enquireVerifyUrl();
  const { resolvedTheme } = useTheme();
  const lenis = useLenis();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isWorksSection, setIsWorksSection] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isGallaryPage = pathname?.startsWith("/gallary");
  const isContactPage = pathname?.startsWith("/contact");
  const isDocumentsPage = pathname?.startsWith("/documents");
  const isClientsPage = pathname?.startsWith("/clients");
  const isQualityPage = pathname?.startsWith("/quality-policy");
  const isAboutPage = pathname?.startsWith("/about");
  const isEnquirePage = pathname?.startsWith("/enquire");
  const isLightPage =
    isGallaryPage ||
    isContactPage ||
    isDocumentsPage ||
    isClientsPage ||
    isQualityPage ||
    isAboutPage ||
    isEnquirePage;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > (isLightPage ? 50 : window.innerHeight));

      // Hide header while scrolling down
      if (currentScrollY > lastScrollY.current) {
        // Only hide immediately on light pages, otherwise wait for 100vh
        if (isLightPage || currentScrollY > window.innerHeight) {
          setIsVisible(false);
        }
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Intersection Observer for Our Works Section
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsWorksSection(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Change theme when 10% of the section is visible
      }
    );

    const worksSection = document.getElementById("works");
    if (worksSection) observer.observe(worksSection);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (worksSection) observer.unobserve(worksSection);
    };
  }, [isLightPage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    if (isOpen) {
      // Stop Lenis smooth scroll
      lenis?.stop();

      // Simple overflow hidden to prevent background scroll
      // avoids the 'jump to top' issue caused by position: fixed
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      // Optional: Add padding to prevent layout shift if scrollbar disappears
      const scrollBarWidth = window.innerWidth - html.clientWidth;
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      // Start Lenis smooth scroll
      lenis?.start();

      body.style.overflow = "";
      html.style.overflow = "";
      body.style.paddingRight = "";
    }

    return () => {
      lenis?.start();
      body.style.overflow = "";
      html.style.overflow = "";
      body.style.paddingRight = "";
    };
  }, [isOpen, lenis]);

  const menuLinks = [
    "ABOUT US",
    "SERVICES",
    "PROJECTS",
    "CLIENTS",
    "GALLERY",
    "CAREERS",
    "DOCUMENTS",
    "CONTACT",
  ];

  // Force white theme for header elements when in Works section
  const forceWhiteTheme = isWorksSection;
  const isLightAndScrolled = (isScrolled && !forceWhiteTheme) || isLightPage;

  // Placed after the hooks above so hook order stays stable across renders.
  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-500 ease-in-out",
          isLightAndScrolled
            ? "bg-background/90 py-6 shadow-lg backdrop-blur-md md:py-4"
            : "bg-transparent py-10 md:py-8",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="relative grid w-full grid-cols-[1fr_auto_1fr] items-center px-6 md:px-8 lg:px-10 xl:px-12">
          {/* Left: menu stays edge-left; nav hugs logo */}
          <div className="relative z-50 flex min-w-0 items-center gap-6 xl:gap-8">
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation menu"
              className={cn(
                "group relative z-50 flex shrink-0 items-center justify-center transition-all focus:outline-none",
                isLightAndScrolled ? "text-brand-blue" : "text-white"
              )}
            >
              <div className="flex flex-col justify-center space-y-1.5 py-1">
                <span className="block h-[2px] w-8 bg-current transition-opacity duration-300 group-hover:opacity-80" />
                <span className="block h-[2px] w-8 bg-current transition-opacity duration-300 group-hover:opacity-80" />
              </div>
            </button>

            <nav className="ml-auto hidden items-center gap-7 pr-6 lg:flex xl:gap-9 xl:pr-8 2xl:gap-11 2xl:pr-10">
              {menuLinks.slice(0, 3).map((link) => (
                <Link
                  key={link}
                  href={
                    link === "GALLERY"
                      ? "/gallary"
                      : link === "ABOUT US"
                        ? "/about"
                        : link === "SERVICES"
                          ? "/services"
                          : link === "PROJECTS"
                            ? "/projects"
                            : `/${link.toLowerCase().replace(" ", "-")}`
                  }
                  className={cn(
                    "group relative flex flex-col py-1 text-[11px] font-bold tracking-[0.22em] transition-colors xl:text-[12px] xl:tracking-[0.28em]",
                    isLightAndScrolled ? "text-brand-blue" : "text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isLightAndScrolled
                        ? "group-hover:text-brand-blue/80"
                        : "group-hover:text-white"
                    )}
                  >
                    {link}
                  </span>
                  <span
                    className={cn(
                      "absolute bottom-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100",
                      isLightAndScrolled ? "bg-brand-blue" : "bg-white"
                    )}
                  />
                </Link>
              ))}
            </nav>
          </div>

          {/* Logo — true center column between PROJECTS and CLIENTS */}
          <Link
            href="/"
            className="relative z-50 shrink-0 justify-self-center px-4 transition-transform hover:scale-105 md:px-6 xl:px-8"
          >
            <Image
              src="/images/logo/logo.webp"
              alt="Logo"
              width={160}
              height={160}
              priority
              className={cn(
                "w-28 transition-all duration-500 md:w-32",
                forceWhiteTheme || (!isScrolled && !isLightPage) || (mounted && resolvedTheme === "dark")
                  ? "brightness-0 invert"
                  : "brightness-100 invert-0"
              )}
            />
          </Link>

          {/* Right: nav hugs logo; CTAs stay edge-right */}
          <div className="relative z-50 flex min-w-0 items-center gap-5 xl:gap-7">
            <nav className="hidden items-center gap-7 pl-6 lg:flex xl:gap-9 xl:pl-8 2xl:gap-11 2xl:pl-10">
              {menuLinks.slice(3, 6).map((link) => (
                <Link
                  key={link}
                  href={
                    link === "GALLERY"
                      ? "/gallary"
                      : link === "ABOUT US"
                        ? "/about"
                        : link === "SERVICES"
                          ? "/services"
                          : link === "PROJECTS"
                            ? "/projects"
                            : `/${link.toLowerCase().replace(" ", "-")}`
                  }
                  className={cn(
                    "group relative flex flex-col py-1 text-[11px] font-bold tracking-[0.22em] transition-colors xl:text-[12px] xl:tracking-[0.28em]",
                    isLightAndScrolled ? "text-brand-blue" : "text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isLightAndScrolled
                        ? "group-hover:text-brand-blue/80"
                        : "group-hover:text-white"
                    )}
                  >
                    {link}
                  </span>
                  <span
                    className={cn(
                      "absolute bottom-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100",
                      isLightAndScrolled ? "bg-brand-blue" : "bg-white"
                    )}
                  />
                </Link>
              ))}
            </nav>

            <div className="ml-auto hidden items-center lg:flex">
              <div className="flex h-9 items-center">
                <Button
                  variant="none"
                  href={enquireHref}
                  borderColor={isLightAndScrolled ? "border-brand-blue" : "border-white"}
                  textColor={isLightAndScrolled ? "text-brand-blue" : "text-white"}
                  hoverFillColor={isLightAndScrolled ? "bg-brand-blue" : "bg-white"}
                  hoverTextColor={
                    isLightAndScrolled
                      ? "group-hover:text-background"
                      : "group-hover:text-brand-blue"
                  }
                  className="h-full min-w-0 rounded-none border px-4 py-0 text-[9px] font-bold tracking-[0.14em] whitespace-nowrap uppercase xl:px-5"
                >
                  E-Vendor Registration
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[150] touch-none bg-black/40 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* SpaceX Style Side Menu Box */}
      <div
        data-lenis-prevent
        className={cn(
          "bg-background fixed top-0 left-0 z-[200] flex h-full w-full max-w-[420px] flex-col overflow-hidden shadow-2xl transition-transform duration-500 ease-out",
          isOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none -translate-x-full"
        )}
      >
        {/* Fixed Top Header (Close Button on Left, Theme & Language on Right) */}
        <div className="flex shrink-0 items-center justify-between px-8 pt-8 pb-4 md:px-10 md:pt-10">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="text-brand-blue group flex items-center space-x-3 transition-all duration-300"
          >
            <Icons.Close className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Close
            </span>
          </button>

          {/* Right Side: Theme & Language (Minimal / Box-less) */}
          <div className="flex items-center gap-4 text-brand-blue">
            <AnimatedThemeToggler className="h-8 w-8 border-none bg-transparent p-0 hover:border-transparent hover:bg-transparent hover:opacity-75 transition-opacity" />
            <button
              type="button"
              className="text-brand-blue text-[11px] font-black tracking-[0.15em] uppercase hover:opacity-75 transition-opacity p-0 bg-transparent border-none"
            >
              AR
            </button>
          </div>
        </div>

        {/* Scrollable Menu Links Box */}
        <nav
          data-lenis-prevent
          className="custom-scrollbar flex-1 overflow-y-auto px-8 py-2 md:px-10"
        >
          <div className="flex flex-col space-y-4 py-2">
            {menuLinks.map((link, idx) => (
              <Link
                key={link}
                href={
                  link === "GALLERY"
                    ? "/gallary"
                    : link === "ABOUT US"
                      ? "/about"
                      : link === "SERVICES"
                        ? "/services"
                        : link === "PROJECTS"
                          ? "/projects"
                          : `/${link.toLowerCase().replace(" ", "-")}`
                }
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group border-border text-brand-blue relative flex items-center justify-between border-b pb-3 text-xl font-bold transition-all md:text-2xl"
                )}
              >
                <motion.span
                  initial={{ letterSpacing: "0.2em" }}
                  whileHover={{ letterSpacing: "0.35em" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="uppercase transition-all"
                >
                  {link}
                </motion.span>
                <span className="text-brand-blue/30 group-hover:text-brand-blue text-[10px] transition-colors">
                  0{idx + 1}
                </span>

                {/* SpaceX-style underline for menu links */}
                <span className="bg-brand-blue absolute bottom-0 left-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Fixed Sticky Bottom Footer (E-Vendor button & Centered Social Icons) */}
        <div className="shrink-0 border-t border-border/10 bg-background px-8 pt-5 pb-8 md:px-10 md:pb-10">
          <Button
            variant="primary"
            href={enquireHref}
            className="h-12 w-full rounded-none text-[10px] font-black tracking-[0.2em] uppercase"
            onClick={() => setIsOpen(false)}
          >
            E-Vendor Registration
          </Button>

          {/* Centered Social Icons Row */}
          <div className="mt-5 flex w-full items-center justify-center gap-2.5">
            {[
              { icon: <FaLinkedinIn />, href: "https://linkedin.com", label: "LinkedIn" },
              { icon: <FaInstagram />, href: "https://instagram.com", label: "Instagram" },
              { icon: <FaFacebookF />, href: "https://facebook.com", label: "Facebook" },
              { icon: <FaXTwitter />, href: "https://x.com", label: "X (Twitter)" },
              { icon: <FaYoutube />, href: "https://youtube.com", label: "YouTube" },
              { icon: <FaWhatsapp />, href: "https://wa.me/1234567890", label: "WhatsApp" },
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="border-brand-blue/10 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue flex h-9 w-9 items-center justify-center border transition-all duration-300 hover:text-white"
              >
                <div className="text-sm">{social.icon}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
