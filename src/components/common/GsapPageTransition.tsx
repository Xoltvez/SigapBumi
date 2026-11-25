"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

interface GsapPageTransitionProps {
  children: React.ReactNode;
}

// Rute yang dikecualikan dari animasi transisi:
// 1. Halaman Login & Register warga (/masuk, /daftar)
// 2. Seluruh Dashboard Posko & login admin (/admin/*)
// 3. Peta Bencana (/peta) agar elemen fixed mobile tidak terkunci dalam transform containing block
const isRouteExcludedFromTransition = (pathname: string | null): boolean => {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/peta") ||
    pathname === "/masuk" ||
    pathname === "/daftar" ||
    pathname.includes("/login") ||
    pathname.includes("/register")
  );
};

// Rute yang punya animasi sendiri (lihat ScrollReveal): cukup progress bar + fade kontainer
const ROUTES_WITH_OWN_ANIMATION = ["/", "/tentang", "/syarat-ketentuan", "/kebijakan-privasi"];

export function GsapPageTransition({ children }: GsapPageTransitionProps) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const isExcluded = isRouteExcludedFromTransition(pathname);

  useEffect(() => {
    // Lewati seluruh animasi GSAP jika rute masuk dalam pengecualian (Login, Register, Dashboard Posko)
    if (isExcluded) return;

    // Hormati preferensi aksesibilitas reduce-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const container = pageContainerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // 1. Top progress bar meluncur cepat di bagian paling atas layar setiap ganti halaman/menu
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
        const barTl = gsap.timeline();
        barTl
          .fromTo(
            progressBarRef.current,
            { width: "0%", opacity: 1 },
            {
              width: "70%",
              duration: 0.22,
              ease: "power2.out",
            }
          )
          .to(progressBarRef.current, {
            width: "100%",
            duration: 0.22,
            ease: "power3.inOut",
          })
          .to(progressBarRef.current, {
            opacity: 0,
            duration: 0.18,
            ease: "power1.in",
          });
      }

      // 2. Animasi PER ELEMEN berjenjang (Cascade & Stagger) seperti di Beranda
      const titles = container.querySelectorAll(
        "h1, h2, .page-title, [data-animate='title']"
      );
      const descriptions = container.querySelectorAll(
        "main > div:first-child p, .page-desc, main > header p, [data-animate='desc']"
      );
      const gridCards = container.querySelectorAll(
        ".grid > div, .grid > a, article, .stat-card, [data-animate='card']"
      );
      const actionItems = container.querySelectorAll(
        "form, .filter-bar, [data-animate='action']"
      );

      // Timeline GSAP bertingkat per elemen
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // Jika di halaman beranda ("/"), biarkan timeline internal ScrollTrigger beranda berjalan
      if (ROUTES_WITH_OWN_ANIMATION.includes(pathname)) {
        gsap.fromTo(
          container,
          { opacity: 0.4 },
          { opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "all" }
        );
      } else {
        // Kontainer utama sedikit mengangkat
        tl.fromTo(
          container,
          { opacity: 0.85, y: 12 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "transform" }
        );

        // A. Judul & Header Halaman Masuk Duluan
        if (titles.length > 0) {
          tl.fromTo(
            titles,
            { opacity: 0, y: 26, filter: "blur(2px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.45,
              stagger: 0.08,
              clearProps: "filter",
            },
            "-=0.2"
          );
        }

        // B. Deskripsi / Subtitle Mengikuti
        if (descriptions.length > 0) {
          tl.fromTo(
            descriptions,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 },
            "-=0.3"
          );
        }

        // C. Kartu-kartu Grid Masuk Bertingkat (Staggered Bento/Cards ala Beranda)
        if (gridCards.length > 0) {
          const cardsSlice = Array.from(gridCards).slice(0, 12);
          tl.fromTo(
            cardsSlice,
            { opacity: 0, y: 32, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.48,
              stagger: 0.06,
              ease: "back.out(1.15)",
              clearProps: "transform",
            },
            "-=0.25"
          );
        }

        // D. Form / Tombol Aksi Menyusul
        if (actionItems.length > 0) {
          tl.fromTo(
            actionItems,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 },
            "-=0.2"
          );
        }
      }
    }, container);

    return () => ctx.revert();
  }, [pathname, isExcluded]);

  // Jika rute dikecualikan (login, register, dan seluruh dashboard posko), render secara langsung tanpa animasi dan tanpa progress bar
  if (isExcluded) {
    return <div className="flex-1 flex flex-col w-full">{children}</div>;
  }

  return (
    <>
      {/* Top Accent Progress Indicator saat navigasi antar menu/halaman publik */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-0.5 overflow-hidden"
      >
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 w-0 opacity-0 shadow-sm shadow-orange-500/50"
        />
      </div>

      {/* Konten Halaman Teranimasi Per Elemen */}
      <div ref={pageContainerRef} className="flex-1 flex flex-col w-full">
        {children}
      </div>
    </>
  );
}
