"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

interface GsapPageTransitionProps {
  children: React.ReactNode;
}

export function GsapPageTransition({ children }: GsapPageTransitionProps) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hormati preferensi reduce-motion dari sistem pengguna
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Top progress bar meluncur cepat di bagian paling atas layar setiap ganti halaman/menu
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
        const tl = gsap.timeline();
        tl.fromTo(
          progressBarRef.current,
          { width: "0%", opacity: 1 },
          {
            width: "65%",
            duration: 0.22,
            ease: "power2.out",
          }
        )
          .to(progressBarRef.current, {
            width: "100%",
            duration: 0.25,
            ease: "power3.inOut",
          })
          .to(progressBarRef.current, {
            opacity: 0,
            duration: 0.2,
            ease: "power1.in",
          });
      }

      // 2. Animasi masuk konten halaman (smooth reveal, subtle lift & blur dissolve)
      if (pageContainerRef.current) {
        gsap.killTweensOf(pageContainerRef.current);
        gsap.fromTo(
          pageContainerRef.current,
          {
            opacity: 0,
            y: 18,
            scale: 0.996,
            filter: "blur(4px)",
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
            clearProps: "filter,transform",
          }
        );
      }
    });

    return () => ctx.revert();
  }, [pathname]);

  return (
    <>
      {/* Top Accent Progress Indicator saat navigasi antar menu/halaman */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-0.5 overflow-hidden"
      >
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 w-0 opacity-0 shadow-sm shadow-orange-500/50"
        />
      </div>

      {/* Konten Halaman Teranimasi GSAP */}
      <div ref={pageContainerRef} className="flex-1 flex flex-col w-full">
        {children}
      </div>
    </>
  );
}
