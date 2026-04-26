"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useTheme } from "next-themes";

import { Icons } from "@repo/ui";

import { AnimatedThemeToggler } from "@ui/AnimatedThemeToggler";
import { Button } from "@ui/Button";

import { cn } from "@lib/utils";

export const Navbar = () => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isWorksSection, setIsWorksSection] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > window.innerHeight);

      if (currentScrollY > lastScrollY.current && currentScrollY > window.innerHeight) {
        setIsVisible(false);
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
  }, []);

  const menuLinks = ["ABOUT US", "SERVICES", "PROJECTS", "GALLERY", "CAREERS", "CONTACTS"];

  // Force white theme for header elements when in Works section
  const forceWhiteTheme = isWorksSection;
  const isLightAndScrolled = isScrolled && !forceWhiteTheme;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-[100] transition-all duration-500 ease-in-out",
          isLightAndScrolled
            ? "bg-background/90 py-4 shadow-lg backdrop-blur-md"
            : "bg-transparent py-8",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="relative container flex items-center justify-between">
          {/* Menu & Left Nav - Left */}
          <div className="flex items-center space-x-12">
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "group relative z-50 flex items-center space-x-3 transition-all",
                isLightAndScrolled ? "text-brand-blue" : "text-white"
              )}
            >
              <div className="flex flex-col space-y-2">
                <span className="h-[2px] w-12 bg-current transition-all group-hover:w-12" />
                <span className="h-[2px] w-12 bg-current transition-all group-hover:w-6" />
              </div>
            </button>

            <nav className="hidden items-center space-x-8 lg:flex">
              {menuLinks.slice(0, 3).map((link) => (
                <Link
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  className={cn(
                    "group relative flex flex-col py-1 text-[12px] font-bold tracking-[0.3em] transition-colors",
                    isLightAndScrolled ? "text-brand-blue/70" : "text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isLightAndScrolled ? "group-hover:text-brand-blue" : "group-hover:text-white"
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

          {/* Logo - Center */}
          <Link
            href="/"
            className="absolute left-1/2 z-50 -translate-x-1/2 transform transition-transform hover:scale-105"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={160}
              height={160}
              className={cn(
                "w-28 transition-all duration-500 md:w-32",
                forceWhiteTheme || !isScrolled || resolvedTheme === "dark"
                  ? "brightness-0 invert"
                  : "brightness-100 invert-0"
              )}
            />
          </Link>

          {/* Actions - Right */}
          <div className="relative z-50 flex items-center space-x-8">
            <nav className="hidden items-center space-x-8 lg:flex">
              {menuLinks.slice(3).map((link) => (
                <Link
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  className={cn(
                    "group relative flex flex-col py-1 text-[12px] font-bold tracking-[0.3em] transition-colors",
                    isLightAndScrolled ? "text-brand-blue/70" : "text-white/70"
                  )}
                >
                  <span
                    className={cn(
                      "transition-colors",
                      isLightAndScrolled ? "group-hover:text-brand-blue" : "group-hover:text-white"
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
            <Button
              variant="outline"
              href="#contact"
              className={cn(
                "h-10 min-w-[140px] px-6 text-[9px]",
                isLightAndScrolled ? "border-brand-blue text-brand-blue" : "border-white text-white"
              )}
            >
              Contact
            </Button>
          </div>
        </div>
      </header>

      {/* SpaceX Style Side Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* SpaceX Style Side Menu Box */}
      <div
        className={cn(
          "bg-background fixed top-0 left-0 z-[200] flex h-full w-full max-w-[400px] flex-col p-12 transition-transform duration-500 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close Button */}
        <div className="flex justify-start">
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

        {/* Menu Links - Optimized for 100vh visibility */}
        <nav className="mt-12 flex flex-1 flex-col justify-center space-y-6">
          {menuLinks.map((link, idx) => (
            <Link
              key={link}
              href={`#${link.toLowerCase().replace(" ", "-")}`}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group border-border text-brand-blue relative border-b pb-4 text-2xl font-bold tracking-[0.2em] transition-all",
                "flex items-center justify-between"
              )}
            >
              <span className="uppercase">{link}</span>
              <span className="text-brand-blue/30 group-hover:text-brand-blue text-[10px] transition-colors">
                0{idx + 1}
              </span>

              {/* SpaceX-style underline for menu links */}
              <span className="bg-brand-blue absolute bottom-0 left-0 h-[2px] w-full origin-right scale-x-0 transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Menu Footer - Compact */}
        <div className="border-border mt-auto space-y-6 border-t pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {[
                <Icons.Linkedin key="li" />,
                <Icons.Instagram key="ig" />,
                <Icons.Facebook key="fb" />,
              ].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-brand-blue transition-all hover:scale-110 hover:opacity-70"
                >
                  {icon}
                </a>
              ))}
            </div>
            <div className="flex items-center space-x-6">
              <AnimatedThemeToggler />
              <button className="text-brand-blue text-[10px] font-black tracking-[0.3em] uppercase hover:opacity-70">
                AR
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
