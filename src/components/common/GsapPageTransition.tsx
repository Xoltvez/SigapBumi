"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

// Rute yang punya animasi sendiri (lihat ScrollReveal / Beranda): cukup progress bar + fade kontainer
const ROUTES_WITH_OWN_ANIMATION = ["/", "/tentang", "/syarat-ketentuan", "/kebijakan-privasi"];

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE"]);

function isAnimatableElement(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (SKIP_TAGS.has(el.tagName)) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.position === "fixed" || style.position === "absolute") return false;
  return true;
}

function isCardLikeContainer(el: HTMLElement): boolean {
  const cls = typeof el.className === "string" ? el.className : "";
  return (
    cls.includes("bg-surface") ||
    cls.includes("bg-white") ||
    cls.includes("shadow-card") ||
    cls.includes("shadow-sm") ||
    /\bborder\b/.test(cls)
  );
}

/**
 * Mengumpulkan elemen-elemen utama halaman secara ketat berurutan dari atas ke bawah (DOM & posisi visual).
 * - Membuka wrapper tunggal (misal container max-w mx-auto) agar anak-anaknya bisa dianimasikan berurutan.
 * - Membuka header/hero transparan (tanpa background kartu) agar judul, deskripsi, form pencarian, dsb. masuk satu per satu dari atas ke bawah.
 * - Membuka grid tingkat atas (misal grid KPI/kartu) agar tiap kartu masuk bertingkat.
 * - Mempertahankan section/kartu utama sebagai satu kesatuan agar frame kartu tidak muncul duluan mendahului isinya.
 */
function collectTopToBottomTargets(container: HTMLElement): HTMLElement[] {
  let root: HTMLElement = (container.querySelector("main") as HTMLElement | null) || container;

  // Buka wrapper tunggal (maksimal 3 level) seperti <main><div className="max-w-[900px] mx-auto">...</div></main>
  for (let depth = 0; depth < 3; depth++) {
    const visibleChildren = Array.from(root.children).filter(isAnimatableElement);
    if (visibleChildren.length === 1 && !isCardLikeContainer(visibleChildren[0])) {
      root = visibleChildren[0];
    } else {
      break;
    }
  }

  const topBlocks = Array.from(root.children).filter(isAnimatableElement);
  const targets: HTMLElement[] = [];

  for (const block of topBlocks) {
    const cls = typeof block.className === "string" ? block.className : "";
    const directChildren = Array.from(block.children).filter(isAnimatableElement);

    // 1. Header/hero transparan (mengandung h1, bukan kartu) -> animasikan anak-anaknya dari atas ke bawah
    const isTransparentHeader =
      !isCardLikeContainer(block) &&
      directChildren.length > 1 &&
      Boolean(block.querySelector("h1")) &&
      !cls.includes("flex-row") &&
      !cls.includes("sm:flex-row");

    if (isTransparentHeader) {
      targets.push(...directChildren);
      continue;
    }

    // 2. Grid kartu tingkat atas (misal KPI cards atau grid artikel) -> animasikan tiap kartu secara stagger
    const isTopGrid =
      !isCardLikeContainer(block) &&
      /\bgrid\b/.test(cls) &&
      directChildren.length >= 2 &&
      directChildren.length <= 12;

    if (isTopGrid) {
      targets.push(...directChildren);
      continue;
    }

    // 3. Blok / section / kartu utuh
    targets.push(block);
  }

  // Pastikan urutan ketat berdasarkan posisi visual dari paling atas ke bawah (lalu kiri ke kanan)
  return targets
    .map((el, index) => ({ el, rect: el.getBoundingClientRect(), index }))
    .sort((a, b) => {
      const topDiff = a.rect.top - b.rect.top;
      if (Math.abs(topDiff) > 8) return topDiff;
      const leftDiff = a.rect.left - b.rect.left;
      if (Math.abs(leftDiff) > 8) return leftDiff;
      return a.index - b.index;
    })
    .map((item) => item.el);
}

export function GsapPageTransition({ children }: GsapPageTransitionProps) {
  const pathname = usePathname();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const isExcluded = isRouteExcludedFromTransition(pathname);

  useIsomorphicLayoutEffect(() => {
    // Lewati seluruh animasi GSAP jika rute masuk dalam pengecualian (Login, Register, Dashboard Posko, Peta)
    if (isExcluded) return;

    // Hormati preferensi aksesibilitas reduce-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const container = pageContainerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // 1. Top progress bar meluncur halus di bagian paling atas layar setiap ganti halaman/menu
      if (progressBarRef.current) {
        gsap.killTweensOf(progressBarRef.current);
        const barTl = gsap.timeline();
        barTl
          .fromTo(
            progressBarRef.current,
            { width: "0%", opacity: 1 },
            {
              width: "75%",
              duration: 0.22,
              ease: "power2.out",
            }
          )
          .to(progressBarRef.current, {
            width: "100%",
            duration: 0.2,
            ease: "power3.inOut",
          })
          .to(progressBarRef.current, {
            opacity: 0,
            duration: 0.16,
            ease: "power1.in",
          });
      }

      // 2. Jika halaman punya animasi internal (Beranda / ScrollReveal), cukup fade halus kontainer
      if (ROUTES_WITH_OWN_ANIMATION.includes(pathname)) {
        gsap.fromTo(
          container,
          { opacity: 0.5 },
          { opacity: 1, duration: 0.3, ease: "power2.out", clearProps: "opacity" }
        );
        return;
      }

      // 3. Kumpulkan elemen secara ketat dari paling atas ke bawah
      const orderedTargets = collectTopToBottomTargets(container);

      if (orderedTargets.length > 0) {
        // Batasi total stagger agar halaman panjang tetap responsif dan terasa cepat
        const staggerStep =
          orderedTargets.length > 10
            ? Math.max(0.035, 0.55 / orderedTargets.length)
            : 0.06;

        gsap.fromTo(
          orderedTargets,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            stagger: staggerStep,
            ease: "power3.out",
            clearProps: "transform,opacity",
          }
        );
      } else {
        gsap.fromTo(
          container,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", clearProps: "transform,opacity" }
        );
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
