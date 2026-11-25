"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animasi khusus untuk halaman informasi (Tentang, Syarat & Ketentuan, Kebijakan Privasi).
 *
 * Tandai elemen dengan atribut:
 * - data-reveal="intro" : masuk berurutan saat halaman dibuka (judul, hero)
 * - data-reveal="up"     : muncul saat di-scroll ke viewport (dikelompokkan per batch)
 * - data-reveal="pop"    : seperti "up", ditambah efek skala untuk kartu kecil
 *
 * Halaman yang memakai komponen ini dikecualikan dari animasi per-elemen GsapPageTransition
 * agar tidak dianimasikan dua kali.
 */
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const intro = root.querySelectorAll<HTMLElement>("[data-reveal='intro']");
      if (intro.length > 0) {
        gsap.fromTo(
          intro,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", clearProps: "transform" }
        );
      }

      const scrollItems = root.querySelectorAll<HTMLElement>("[data-reveal='up'], [data-reveal='pop']");
      if (scrollItems.length === 0) return;
      gsap.set(scrollItems, { opacity: 0, y: 28 });
      gsap.set(root.querySelectorAll("[data-reveal='pop']"), { scale: 0.94 });

      ScrollTrigger.batch(scrollItems, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform",
          }),
      });

      // Pastikan posisi trigger benar setelah gambar/font selesai dimuat
      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex-1 flex flex-col w-full">
      {children}
    </div>
  );
}
