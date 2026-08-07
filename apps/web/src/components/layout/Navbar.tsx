"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { useTheme } from "next-themes";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa6";

import { Icons } from "@repo/ui";

import { AnimatedThemeToggler } from "@ui/AnimatedThemeToggler";
import { Button } from "@ui/Button";

import { cn } from "@lib/utils";

export const Navbar = () => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const lenis = useLenis();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isWorksSection, setIsWorksSection] = useState(false);
  const lastScrollY = useRef(0);

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
        <div className="md:px-container relative container grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 xl:gap-6">
          {/* Left: menu stays edge-left; nav hugs logo */}
          <div className="relative z-50 flex min-w-0 items-center gap-6 xl:gap-8">
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "group relative z-50 flex shrink-0 items-center space-x-3 transition-all",
                isLightAndScrolled ? "text-brand-blue" : "text-white"
              )}
            >
              <div className="flex flex-col space-y-2">
                <span className="h-[2px] w-12 bg-current transition-all group-hover:w-12" />
                <span className="h-[2px] w-12 bg-current transition-all group-hover:w-6" />
              </div>
            </button>

            <nav className="ml-auto hidden items-center gap-5 pr-2 lg:flex xl:gap-7 xl:pr-4">
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
            className="relative z-50 shrink-0 justify-self-center transition-transform hover:scale-105"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={160}
              height={160}
              priority
              className={cn(
                "w-28 transition-all duration-500 md:w-32",
                forceWhiteTheme || (!isScrolled && !isLightPage) || resolvedTheme === "dark"
                  ? "brightness-0 invert"
                  : "brightness-100 invert-0"
              )}
            />
          </Link>

          {/* Right: nav hugs logo; CTAs stay edge-right */}
          <div className="relative z-50 flex min-w-0 items-center gap-5 xl:gap-7">
            <nav className="hidden items-center gap-5 pl-2 lg:flex xl:gap-7 xl:pl-4">
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

            <div
              className={cn(
                "ml-auto hidden items-stretch lg:flex",
                "border-l pl-5 xl:pl-7",
                isLightAndScrolled ? "border-brand-blue/25" : "border-white/25"
              )}
            >
              <div className="flex h-9 items-stretch">
                <Button
                  variant="none"
                  href="/contact"
                  borderColor={isLightAndScrolled ? "border-brand-blue" : "border-white"}
                  textColor={isLightAndScrolled ? "text-brand-blue" : "text-white"}
                  hoverFillColor={isLightAndScrolled ? "bg-brand-blue" : "bg-white"}
                  hoverTextColor={
                    isLightAndScrolled
                      ? "group-hover:text-background"
                      : "group-hover:text-brand-blue"
                  }
                  className="h-full min-w-0 rounded-none border-r-0 px-4 py-0 text-[9px] font-bold tracking-[0.2em] uppercase xl:px-5"
                >
                  Contact
                </Button>
                <Button
                  variant="primary"
                  href="/enquire"
                  className="h-full min-w-0 rounded-none border-l-0 px-4 py-0 text-[9px] font-bold tracking-[0.2em] uppercase xl:px-5"
                >
                  Enquiry
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
          "bg-background custom-scrollbar fixed top-0 left-0 z-[200] h-full w-full max-w-[400px] overflow-y-auto transition-transform duration-500 ease-out",
          isOpen ? "pointer-events-auto translate-x-0" : "pointer-events-none -translate-x-full"
        )}
      >
        <div className="flex min-h-full flex-col p-12">
          {/* Close Button */}
          <div className="flex shrink-0 justify-start">
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-blue group flex items-center space-x-4 transition-all duration-500"
            >
              <Icons.Close className="h-8 w-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-180" />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                Close
              </span>
            </button>
          </div>

          {/* Menu Links */}
          <nav className="mt-6 flex flex-1 flex-col space-y-6 py-4">
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
                  "group border-border text-brand-blue relative border-b pb-4 text-2xl font-bold transition-all",
                  "flex items-center justify-between"
                )}
              >
                <motion.span
                  initial={{ letterSpacing: "0.2em" }}
                  whileHover={{ letterSpacing: "0.4em" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="uppercase transition-all"
                >
                  {link}
                </motion.span>
                <span className="text-brand-blue/30 group-hover:text-brand-blue text-[10px] transition-colors">
                  0{idx + 1}
                </span>

                {/* SpaceX-style underline for menu links */}
                <span className="bg-brand-blue absolute bottom-0 left-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="mt-8 shrink-0">
            <Button
              variant="primary"
              href="/enquire"
              className="h-14 w-full rounded-none text-[10px] font-black tracking-[0.3em] uppercase"
              onClick={() => setIsOpen(false)}
            >
              Enquiry
            </Button>
          </div>

          {/* Menu Footer - Compact */}
          <div className="mt-auto shrink-0 pt-10">
            <div className="flex w-full items-center justify-between gap-4">
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                {[
                  { icon: <FaLinkedinIn />, href: "#" },
                  { icon: <FaInstagram />, href: "#" },
                  { icon: <FaFacebookF />, href: "#" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="border-brand-blue/10 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue flex h-12 w-12 items-center justify-center border transition-all duration-500 hover:text-white"
                  >
                    <div className="text-xl">{social.icon}</div>
                  </a>
                ))}
              </div>

              {/* Actions: Theme & Language */}
              <div className="flex items-center gap-4">
                <AnimatedThemeToggler />
                <button className="border-brand-blue/10 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue flex h-12 w-12 items-center justify-center border text-[10px] font-black tracking-[0.1em] uppercase transition-all duration-500 hover:text-white">
                  AR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
