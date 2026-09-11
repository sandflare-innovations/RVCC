"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";

// Module-level map to preserve individual page scroll positions across unmounts
const pageScrollPositions = new Map<string, number>();

function LenisScrollManager() {
  const lenis = useLenis();
  const pathname = usePathname();
  const isPopState = useRef(false);

  // Configure manual scroll restoration so browser does not fight Lenis
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handlePopState = () => {
      isPopState.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Track live scroll position for the current page
  useEffect(() => {
    if (!lenis) return;

    const unsubscribe = lenis.on("scroll", (e: { scroll: number }) => {
      pageScrollPositions.set(pathname, e.scroll);
    });

    return () => {
      unsubscribe();
      pageScrollPositions.set(pathname, lenis.scroll);
    };
  }, [pathname, lenis]);

  // Isolate scroll per page on route transitions
  useEffect(() => {
    if (!lenis) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash) {
      // If navigating with an anchor hash (e.g. #contact)
      const target = document.querySelector(hash);
      if (target) {
        lenis.scrollTo(target as HTMLElement, { immediate: true });
      } else {
        window.scrollTo(0, 0);
        lenis.scrollTo(0, { immediate: true });
      }
    } else if (isPopState.current) {
      // Browser back/forward: restore the specific scroll position for this page
      const savedY = pageScrollPositions.get(pathname) ?? 0;
      window.scrollTo(0, savedY);
      lenis.scrollTo(savedY, { immediate: true });
      isPopState.current = false;
    } else {
      // Normal navigation: always start cleanly at the top of the new page
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
    }

    // Immediately recalculate dimensions for the new page layout
    lenis.resize();

    // Re-check after layout transitions and dynamic images settle
    const raf = requestAnimationFrame(() => {
      lenis.resize();
    });
    const timer = setTimeout(() => {
      lenis.resize();
    }, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname, lenis]);

  // Keep Lenis in sync with DOM changes (accordions, expanded sections, image loading)
  useEffect(() => {
    if (!lenis || typeof window === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (document.body) resizeObserver.observe(document.body);
    if (document.documentElement) resizeObserver.observe(document.documentElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [lenis]);

  return null;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ReactLenis
      key={pathname}
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
      }}
    >
      <LenisScrollManager />
      {children}
    </ReactLenis>
  );
}

