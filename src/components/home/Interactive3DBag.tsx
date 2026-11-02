"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Move3d, RotateCcw } from "lucide-react";

interface Hotspot {
  id: string;
  title: string;
  desc: string;
  x: number; // percentage
  y: number; // percentage
  z: number; // px elevation
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "p3k",
    title: "Kotak P3K Medis",
    desc: "Obat darurat, plester, perban & antiseptik",
    x: 48,
    y: 53,
    z: 45,
  },
  {
    id: "air",
    title: "Air Minum",
    desc: "Kebutuhan hidrasi minimal 72 jam",
    x: 23,
    y: 52,
    z: 35,
  },
  {
    id: "dokumen",
    title: "Dokumen Penting",
    desc: "Pouch kedap air identitas & arsip keluarga",
    x: 28,
    y: 82,
    z: 50,
  },
  {
    id: "radio",
    title: "Senter & Radio",
    desc: "Alat sinyal evakuasi & siaran info BMKG",
    x: 74,
    y: 52,
    z: 40,
  },
];

export function Interactive3DBag() {
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D rotation state (in degrees)
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 8, y: -6 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // References for smooth dragging & momentum
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: 8,
    rotY: -6,
  });
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Mouse move tilt when NOT dragging (smooth ambient parallax)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Subtle parallax range: -15deg to +15deg
      const normX = (e.clientX - centerX) / (rect.width / 2);
      const normY = (e.clientY - centerY) / (rect.height / 2);

      const targetX = -normY * 12 + 6;
      const targetY = normX * 16 - 4;

      setRotation({
        x: Math.max(-25, Math.min(25, targetX)),
        y: Math.max(-30, Math.min(30, targetY)),
      });
    },
    [isDragging]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDragging) return;
    // Ease back toward default pleasant isometric view
    setRotation({ x: 8, y: -6 });
  }, [isDragging]);

  // Pointer Down (Mouse or Touch) for 3D Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setHasInteracted(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotation.x,
      rotY: rotation.y,
    };
    velocityRef.current = { vx: 0, vy: 0 };
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Convert pixels to rotation angles (sensitivity)
    const newRotY = dragStartRef.current.rotY + deltaX * 0.45;
    const newRotX = Math.max(-35, Math.min(45, dragStartRef.current.rotX - deltaY * 0.45));

    velocityRef.current = {
      vx: (newRotY - rotation.y) * 0.3,
      vy: (newRotX - rotation.x) * 0.3,
    };

    setRotation({ x: newRotX, y: newRotY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    // Apply gentle deceleration momentum
    let { vx, vy } = velocityRef.current;
    const friction = 0.92;

    const step = () => {
      vx *= friction;
      vy *= friction;
      if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
        setRotation((prev) => ({
          x: Math.max(-35, Math.min(45, prev.x + vy)),
          y: prev.y + vx,
        }));
        animFrameRef.current = requestAnimationFrame(step);
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const resetView = () => {
    setRotation({ x: 8, y: -6 });
    setActiveHotspot(null);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Dynamic light angle for realistic surface reflection
  const lightX = 50 + rotation.y * 1.2;
  const lightY = 30 + rotation.x * 1.2;

  return (
    <div className="relative w-full flex flex-col items-center select-none py-2">
      {/* 3D Scene Viewport without any box or border */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ perspective: "1200px" }}
        className={`relative w-full max-w-[460px] aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing touch-none transition-transform`}
      >
        {/* Dynamic 3D Ground Contact Shadow */}
        <div
          className="absolute bottom-6 w-[70%] h-8 rounded-full blur-xl bg-slate-900/25 pointer-events-none transition-transform duration-200"
          style={{
            transform: `translateX(${rotation.y * 0.8}px) scaleX(${1 + Math.abs(rotation.y) * 0.005}) scaleY(${
              1 + Math.abs(rotation.x) * 0.008
            })`,
            opacity: Math.max(0.2, 0.4 - Math.abs(rotation.x) * 0.003),
          }}
        />

        {/* 3D Rotating Object Container */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {/* Main 3D Bag Image */}
          <div
            className="relative w-[92%] h-[92%] filter drop-shadow-[0_25px_35px_rgba(15,23,42,0.18)]"
            style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}
          >
            <Image
              src="/tas_siaga_3d_cutout.png"
              alt="Objek 3D Realistis Tas Siaga Bencana (TSB) dapat digerakkan dan digeser interaktif"
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-contain pointer-events-none drop-shadow-md"
              priority
              onError={(e) => {
                // Fallback to jpg if cutout not yet ready
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes("tas_siaga_3d.jpg")) {
                  target.src = "/tas_siaga_3d.jpg";
                }
              }}
            />

            {/* Dynamic Specular Lighting Sheen Layer */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl mix-blend-soft-light transition-opacity"
              style={{
                background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
                opacity: 0.85,
              }}
            />
          </div>

          {/* Interactive Floating 3D Hotspot Pins */}
          {HOTSPOTS.map((spot) => {
            const isActive = activeHotspot === spot.id;
            return (
              <div
                key={spot.id}
                style={{
                  top: `${spot.y}%`,
                  left: `${spot.x}%`,
                  transform: `translate(-50%, -50%) translateZ(${spot.z}px)`,
                  transformStyle: "preserve-3d",
                }}
                className="absolute z-20 pointer-events-auto"
              >
                {/* Ping Marker */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot(isActive ? null : spot.id);
                  }}
                  className={`group relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform focus-visible:outline-primary ${
                    isActive
                      ? "bg-primary text-white scale-125"
                      : "bg-surface/90 hover:bg-white text-primary border border-primary/30 hover:scale-110"
                  }`}
                  aria-label={spot.title}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                </button>

                {/* Hotspot Floating Tooltip */}
                {isActive && (
                  <div
                    style={{ transform: "translateZ(30px)" }}
                    className="absolute left-1/2 -top-16 -translate-x-1/2 w-44 bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl text-left pointer-events-none backdrop-blur-md border border-slate-700/80 animate-in fade-in zoom-in-95 duration-200 z-30"
                  >
                    <div className="text-xs font-bold text-amber-300">
                      <span>{spot.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                      {spot.desc}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Interaction Controls & Hints (Border-free) */}
      <div className="mt-1 flex items-center justify-center gap-3 text-xs text-ink-soft">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 text-[11px] font-semibold border border-slate-200/80 shadow-2xs backdrop-blur-xs">
          <Move3d className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>{hasInteracted ? "Geser mouse untuk rotasi 3D bebas" : "Klik & geser objek tas untuk memutar 3D"}</span>
        </div>

        <button
          type="button"
          onClick={resetView}
          title="Kembalikan Sudut Pandang"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface hover:bg-slate-100 border border-line text-[11px] font-medium text-ink-soft hover:text-ink transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
