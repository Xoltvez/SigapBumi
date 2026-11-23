"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MapPin,
  Search,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  Trees,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Shield,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Wind,
  HeartPulse,
  Building2,
  Layers,
  Compass,
} from "lucide-react";
import { fetchLiveReports, cleanReportDescription, type LiveReportItem } from "@/lib/services/reports";
import type { DisasterType } from "@/types";
import { Interactive3DBag } from "@/components/home/Interactive3DBag";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);
  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const heroGlow1Ref = useRef<HTMLDivElement>(null);
  const heroGlow2Ref = useRef<HTMLDivElement>(null);

  // Refs untuk Scroll-Triggered Reveal Sections
  const warningSectionRef = useRef<HTMLElement>(null);
  const categoriesSectionRef = useRef<HTMLElement>(null);
  const reportsSectionRef = useRef<HTMLElement>(null);
  const mitigasiSectionRef = useRef<HTMLElement>(null);

  // Search tracking state
  const [trackingInput, setTrackingInput] = useState("");
  const [selectedDisasterFilter, setSelectedDisasterFilter] = useState<string>("semua");

  // Checklist Tas Siaga Bencana (TSB) standar BPBD
  const tsbItems = [
    {
      id: "dokumen",
      label: "Dokumen & Surat Berharga",
      desc: "KTP, KK, Ijazah, Buku Tabungan dalam kantong kedap air",
    },
    {
      id: "p3k",
      label: "Kotak P3K & Obat Medis",
      desc: "Obat pribadi, perban, plester luka, antiseptik, dan masker",
    },
    {
      id: "air",
      label: "Air Minum & Ransum Pangan",
      desc: "Minimal 3 liter per jiwa dan makanan instan/kaleng tahan 72 jam",
    },
    {
      id: "senter",
      label: "Senter & Baterai Cadangan",
      desc: "Penerangan darurat LED tahan air dan baterai ekstra",
    },
    {
      id: "peluit",
      label: "Peluit Darurat & Powerbank",
      desc: "Sinyal suara penolong SOS dan daya komunikasi ponsel",
    },
  ];

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      router.push(`/lacak?kode=${encodeURIComponent(trackingInput.trim().toUpperCase())}`);
    } else {
      router.push("/lacak");
    }
  };

  // Live reports from database
  const [liveReports, setLiveReports] = useState<LiveReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      try {
        const data = await fetchLiveReports();
        if (isMounted && data) {
          setLiveReports(data);
        }
      } catch (err) {
        console.warn("Gagal memuat laporan beranda:", err);
      } finally {
        if (isMounted) setIsLoadingReports(false);
      }
    };

    loadReports();

    const handleSync = () => {
      loadReports();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleSync);
      window.addEventListener("storage", handleSync);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleSync);
        window.removeEventListener("storage", handleSync);
      }
    };
  }, []);

  // Metrics for hero status
  const totalCount = liveReports.length;
  const resolvedCount = liveReports.filter((r) => r.status === "selesai").length;
  const resolvedRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : "0";

  // Cuaca Lokal Realtime Sesuai Kabupaten/Kota Warga (Live BMKG)
  const [localWeather, setLocalWeather] = useState<{
    cityName: string;
    temp: number;
    weatherDesc: string;
    weatherIcon?: string;
  } | null>(null);

  // Data Peringatan Gempa Terkini Realtime BMKG
  const [liveQuake, setLiveQuake] = useState<{
    magnitude: string;
    wilayah: string;
    kedalaman: string;
    dirasakan: string;
    potensi: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWeatherAndQuake = async (lat?: number, lng?: number) => {
      try {
        let url = "/api/bmkg?type=all";
        if (lat !== undefined && lng !== undefined) {
          url += `&lat=${lat}&lng=${lng}`;
        } else {
          url += "&adm4=33.02.24.1001"; // Default Banyumas / Jawa Tengah
        }

        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();

        // 1. Cuaca Lokal
        const raw = json.cuaca?.data?.[0];
        const matched = json.matchedCity;
        const firstPeriod = raw?.cuaca?.[0]?.[0];

        if (isMounted && firstPeriod) {
          const resolvedCity = raw?.lokasi?.kotkab || matched?.name || "Wilayah Warga";
          setLocalWeather({
            cityName: resolvedCity.replace(/^Kota Adm\.\s*/i, "").replace(/^Kabupaten\s*/i, "Kab. "),
            temp: firstPeriod.t,
            weatherDesc: firstPeriod.weather_desc,
            weatherIcon: firstPeriod.image,
          });
        }

        // 2. Gempa Terkini InaTEWS BMKG
        if (isMounted && json.gempaTerkini) {
          const g = json.gempaTerkini;
          setLiveQuake({
            magnitude: g.Magnitude || "5.0",
            wilayah: (g.Wilayah || "").replace(/^Pusat gempa berada di\s*/i, ""),
            kedalaman: g.Kedalaman || "10 km",
            dirasakan: g.Dirasakan ? `Gempa dirasakan di ${g.Dirasakan.replace(/^[I|V|X\s,-]+/, "")}` : "Terasa di wilayah sekitar",
            potensi: (g.Potensi || "").toLowerCase().includes("tidak berpotensi")
              ? "Tidak berpotensi tsunami"
              : g.Potensi || "Tidak berpotensi tsunami",
          });
        }
      } catch (err) {
        console.warn("Gagal memuat cuaca & gempa BMKG:", err);
      }
    };

    // 1. Cek apakah ada riwayat lokasi tersimpan di browser
    let hasCoords = false;
    if (typeof window !== "undefined") {
      try {
        const rawAddr = localStorage.getItem("sigapbumi_last_valid_address");
        if (rawAddr) {
          const parsed = JSON.parse(rawAddr);
          if (parsed.lat && parsed.lng) {
            hasCoords = true;
            fetchWeatherAndQuake(parsed.lat, parsed.lng);
          }
        }
      } catch { }

      // 2. Jika izin lokasi geolocation sudah aktif di browser
      if (!hasCoords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchWeatherAndQuake(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            fetchWeatherAndQuake();
          },
          { timeout: 6000, maximumAge: 300000 }
        );
      } else if (!hasCoords) {
        fetchWeatherAndQuake();
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered reports
  const filteredReports =
    selectedDisasterFilter === "semua"
      ? liveReports.slice(0, 4)
      : liveReports.filter((r) => r.disaster_type === selectedDisasterFilter).slice(0, 4);

  // Animasi transisi halus setiap kali kartu laporan dimuat atau filter diubah
  useEffect(() => {
    if (!isLoadingReports && filteredReports.length > 0 && reportsSectionRef.current) {
      const repCards = reportsSectionRef.current.querySelectorAll(".gsap-report-card");
      if (repCards.length > 0) {
        gsap.fromTo(
          repCards,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: "power2.out",
          }
        );
      }
    }
  }, [filteredReports, isLoadingReports]);

  // Categories list with distinct thematic styling
  const categories: {
    type: DisasterType;
    label: string;
    desc: string;
    icon?: React.ElementType;
    iconUrl?: string;
    badgeColor: string;
    borderColor: string;
    bgAccent: string;
    iconColor: string;
  }[] = [
      {
        type: "banjir",
        label: "Tsunami & Banjir",
        desc: "Gelombang tsunami, luapan sungai, rob pantai, dan genangan air",
        iconUrl: "/icon%20bencana/banjir.png",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        borderColor: "hover:border-blue-400 hover:shadow-blue-500/10",
        bgAccent: "group-hover:bg-blue-50/50",
        iconColor: "text-blue-600 bg-blue-100/70",
      },
      {
        type: "gempa",
        label: "Gempa Bumi",
        desc: "Guncangan tektonik, retakan tanah, dan dampak seismik",
        iconUrl: "/icon%20bencana/gempa%20bumi.png",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        borderColor: "hover:border-amber-400 hover:shadow-amber-500/10",
        bgAccent: "group-hover:bg-amber-50/50",
        iconColor: "text-amber-600 bg-amber-100/70",
      },
      {
        type: "kebakaran",
        label: "Kebakaran Pemukiman",
        desc: "Insiden api perumahan, korsleting listrik, dan gedung publik",
        iconUrl: "/icon%20bencana/house-fire.png",
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        borderColor: "hover:border-red-400 hover:shadow-red-500/10",
        bgAccent: "group-hover:bg-red-50/50",
        iconColor: "text-red-600 bg-red-100/70",
      },
      {
        type: "longsor",
        label: "Tanah Longsor",
        desc: "Gerakan lereng tebing, jalan terputus, dan material batuan",
        iconUrl: "/icon%20bencana/avalanche.png",
        badgeColor: "bg-stone-50 text-stone-700 border-stone-200",
        borderColor: "hover:border-stone-400 hover:shadow-stone-500/10",
        bgAccent: "group-hover:bg-stone-50/50",
        iconColor: "text-stone-700 bg-stone-200/80",
      },
      {
        type: "karhutla",
        label: "Karhutla & Kabut Asap",
        desc: "Kebakaran lahan gambut, hutan lindung, dan titik api (hotspot)",
        iconUrl: "/icon%20bencana/fire.png",
        badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
        borderColor: "hover:border-orange-400 hover:shadow-orange-500/10",
        bgAccent: "group-hover:bg-orange-50/50",
        iconColor: "text-orange-600 bg-orange-100/70",
      },
      {
        type: "lainnya",
        label: "Lainnya",
        desc: "Insiden kedaruratan umum, cuaca ekstrem, pohon tumbang, & darurat lain",
        iconUrl: "/icon%20bencana/disaster-management.png",
        badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
        borderColor: "hover:border-cyan-400 hover:shadow-cyan-500/10",
        bgAccent: "group-hover:bg-cyan-50/50",
        iconColor: "text-cyan-600 bg-cyan-100/70",
      },
    ];

  // GSAP Eye-catching & Scroll-Triggered Reveal Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Ambient Background Glows Breathing Animation (Desktop only agar mobile bebas silau)
      if (
        heroGlow1Ref.current &&
        heroGlow2Ref.current &&
        typeof window !== "undefined" &&
        window.innerWidth >= 640
      ) {
        gsap.to(heroGlow1Ref.current, {
          scale: 1.2,
          x: 15,
          y: -10,
          opacity: 0.5,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(heroGlow2Ref.current, {
          scale: 1.25,
          x: -20,
          y: 15,
          opacity: 0.45,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1,
        });
      }

      // 2. Hero Left Headline & Action Elements Stagger Entrance (Dimuat di Awal Saat Buka Web)
      if (heroLeftRef.current) {
        const kineticWords = heroLeftRef.current.querySelectorAll(".gsap-kinetic-word");
        const desc = heroLeftRef.current.querySelector(".gsap-hero-desc");
        const searchBar = heroLeftRef.current.querySelector(".gsap-hero-search");
        const ctaButtons = heroLeftRef.current.querySelector(".gsap-hero-cta");

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // A. Kinetic typography reveal bertingkat tanpa distorsi jarak
        if (kineticWords.length > 0) {
          tl.fromTo(
            kineticWords,
            { y: "110%", opacity: 0 },
            {
              y: "0%",
              opacity: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
            }
          );
        }

        // B. Deskripsi menyusul halus
        tl.fromTo(
          desc,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
          // C. Bar pencarian pelacakan meluncur
          .fromTo(
            searchBar,
            { opacity: 0, y: 22, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7 },
            "-=0.45"
          )
          // D. Tombol aksi hero
          .fromTo(
            ctaButtons,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.6 },
            "-=0.4"
          );
      }

      // 3. Right Hero Bento Card Entrance & Floating Ambient
      if (heroCardRef.current) {
        const cardBox = heroCardRef.current.querySelector(".gsap-bento-box") as HTMLElement | null;
        const shadowLayer = heroCardRef.current.querySelector(".gsap-offset-shadow");
        const bentoItems = heroCardRef.current.querySelectorAll(".gsap-bento-item");
        const avatarGroup = heroCardRef.current.querySelector(".gsap-avatar-stack");
        const radar1 = heroCardRef.current.querySelector(".gsap-radar-sweep");
        const radar2 = heroCardRef.current.querySelector(".gsap-radar-sweep-2");

        if (cardBox) {
          gsap.fromTo(
            cardBox,
            { opacity: 0, scale: 0.92, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.9, delay: 0.25, ease: "back.out(1.3)" }
          );

          // 3D Tilt Magnetik Halus mengikuti Kursor Mouse
          const xTo = gsap.quickTo(cardBox, "rotationY", { duration: 0.45, ease: "power2.out" });
          const yTo = gsap.quickTo(cardBox, "rotationX", { duration: 0.45, ease: "power2.out" });

          const handleMouseMove = (e: MouseEvent) => {
            const rect = cardBox.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width - 0.5;
            const relY = (e.clientY - rect.top) / rect.height - 0.5;
            xTo(relX * 12); // maks 6 derajat rotation Y
            yTo(-relY * 12); // maks 6 derajat rotation X
          };

          const handleMouseLeave = () => {
            xTo(0);
            yTo(0);
          };

          cardBox.addEventListener("mousemove", handleMouseMove);
          cardBox.addEventListener("mouseleave", handleMouseLeave);
        }

        // Radar Sonar Pulsing
        if (radar1) {
          gsap.to(radar1, {
            scale: 1.08,
            opacity: 0.8,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
        if (radar2) {
          gsap.to(radar2, {
            scale: 1.15,
            opacity: 0.4,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 0.5,
          });
        }

        if (shadowLayer) {
          gsap.to(shadowLayer, {
            y: "-=6",
            rotation: "+=1.5",
            repeat: -1,
            yoyo: true,
            duration: 4,
            ease: "sine.inOut",
          });
        }

        if (bentoItems && bentoItems.length > 0) {
          gsap.fromTo(
            bentoItems,
            { opacity: 0, x: -15 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, delay: 0.65, ease: "power2.out" }
          );
        }

        if (avatarGroup) {
          gsap.fromTo(
            avatarGroup,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.6, delay: 1, ease: "back.out(1.5)" }
          );
        }

        // Rolling Counter untuk "1.420+ Warga Melaporkan"
        const citizenCounter = heroCardRef.current.querySelector(".gsap-citizen-counter");
        if (citizenCounter) {
          const counterObj = { val: 0 };
          gsap.to(counterObj, {
            val: 1420,
            duration: 2,
            delay: 0.4,
            ease: "power2.out",
            onUpdate: () => {
              citizenCounter.textContent = Math.round(counterObj.val).toLocaleString("id-ID");
            },
          });
        }
      }

      // =========================================================================
      // SCROLL-TRIGGERED SECTIONS: HANYA DIMUAT SETELAH USER MENSKROLL KE BAWAH
      // =========================================================================

      // SECTION 2: Early Warning BMKG Broadcast Strip
      if (warningSectionRef.current) {
        gsap.fromTo(
          warningSectionRef.current,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: {
              trigger: warningSectionRef.current,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );

        const warnIcon = warningSectionRef.current.querySelector(".gsap-warn-icon");
        if (warnIcon) {
          gsap.to(warnIcon, {
            scale: 1.15,
            duration: 1.1,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
          });
        }
      }

      // SECTION 3: Kategori Kejadian Bencana (Header + 6 Bento Cards)
      if (categoriesSectionRef.current) {
        const catHeader = categoriesSectionRef.current.querySelector(".gsap-cat-header");
        const catCards = categoriesSectionRef.current.querySelectorAll(".gsap-cat-card");

        if (catHeader) {
          gsap.fromTo(
            catHeader,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: categoriesSectionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (catCards && catCards.length > 0) {
          gsap.fromTo(
            catCards,
            { opacity: 0, y: 45, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              stagger: 0.09,
              ease: "power2.out",
              scrollTrigger: {
                trigger: categoriesSectionRef.current,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );

          // Efek Elastisitas Squash & Stretch 3D pada Ikon Bencana saat Hover
          catCards.forEach((c) => {
            const iconBox = c.querySelector(".gsap-cat-icon-box");
            if (iconBox) {
              c.addEventListener("mouseenter", () => {
                gsap.to(iconBox, {
                  scale: 1.22,
                  rotation: 6,
                  duration: 0.55,
                  ease: "elastic.out(1.2, 0.35)",
                });
              });
              c.addEventListener("mouseleave", () => {
                gsap.to(iconBox, {
                  scale: 1,
                  rotation: 0,
                  duration: 0.35,
                  ease: "power2.out",
                });
              });
            }
          });
        }
      }

      // SECTION 4: Live Reports Feed & Filterable Incident Reports
      if (reportsSectionRef.current) {
        const repHeader = reportsSectionRef.current.querySelector(".gsap-rep-header");
        const filterTabs = reportsSectionRef.current.querySelector(".gsap-rep-filters");
        const repCards = reportsSectionRef.current.querySelectorAll(".gsap-report-card");

        if (repHeader) {
          gsap.fromTo(
            repHeader,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: reportsSectionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (filterTabs) {
          gsap.fromTo(
            filterTabs,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: reportsSectionRef.current,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // SECTION 5: Citizen Preparedness Bento Grid (Checklist TSB & 3D Bag)
      if (mitigasiSectionRef.current) {
        const mitHeader = mitigasiSectionRef.current.querySelector(".gsap-mit-header");
        const tsbBox = mitigasiSectionRef.current.querySelector(".gsap-tsb-box");
        const bagBox = mitigasiSectionRef.current.querySelector(".gsap-bag-box");
        const tsbItemsList = mitigasiSectionRef.current.querySelectorAll(".gsap-tsb-item");

        if (mitHeader) {
          gsap.fromTo(
            mitHeader,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: mitigasiSectionRef.current,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (tsbBox) {
          gsap.fromTo(
            tsbBox,
            { opacity: 0, x: -35 },
            {
              opacity: 1,
              x: 0,
              duration: 0.85,
              ease: "power2.out",
              scrollTrigger: {
                trigger: mitigasiSectionRef.current,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (bagBox) {
          gsap.fromTo(
            bagBox,
            { opacity: 0, x: 35, scale: 0.92 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.85,
              ease: "power2.out",
              scrollTrigger: {
                trigger: mitigasiSectionRef.current,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (tsbItemsList && tsbItemsList.length > 0) {
          gsap.fromTo(
            tsbItemsList,
            { opacity: 0, y: 15 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: tsbBox,
                start: "top 75%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }
    }, mainRef);

    return () => {
      ctx.revert();
      if (typeof window !== "undefined") {
        ScrollTrigger.getAll().forEach((st) => st.kill());
      }
    };
  }, []);

  return (
    <main
      ref={mainRef}
      className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-28 md:pb-16 space-y-8 md:space-y-12"
    >
      {/* 1. Hero Section: High Impact, Clean, Human-Centered, Action-Oriented (Dimuat Langsung) */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white sm:bg-gradient-to-b sm:from-white sm:via-orange-50/20 sm:to-white p-5 sm:p-8 lg:p-10 shadow-sm">
        {/* Soft Background Radial Glow Accents (Desktop only agar tampilan mobile bersih, clean, dan bebas silau) */}
        <div
          ref={heroGlow1Ref}
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl hidden sm:block"
        />
        <div
          ref={heroGlow2Ref}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl hidden sm:block"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Description, Quick Tracking Form & Primary CTAs */}
          <div ref={heroLeftRef} className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Main Headline */}
            <div>
              <h1 className="gsap-hero-title text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-ink leading-[1.18] tracking-tight">
                <span className="block overflow-hidden">
                  <span className="gsap-kinetic-word inline-block">
                    Setiap Detik Berarti.
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span className="gsap-kinetic-word inline-block bg-gradient-to-r from-primary via-primary-hover to-amber-600 bg-clip-text text-transparent mr-2">
                    Laporkan Cepat.
                  </span>
                  <span className="gsap-kinetic-word inline-block">
                    Lindungi Bersama.
                  </span>
                </span>
              </h1>
              <p className="gsap-hero-desc text-ink-soft text-base sm:text-lg mt-3 leading-relaxed max-w-xl">
                Kirimkan laporan kejadian bencana, pantau status penanganan secara terbuka, dan akses informasi tanggap darurat resmi dalam satu pintu.
              </p>
            </div>

            {/* Direct Quick Tracking / Search Bar */}
            <form
              onSubmit={handleTrackingSubmit}
              className="gsap-hero-search w-full max-w-xl bg-surface border-2 border-line hover:border-primary/50 focus-within:border-primary rounded-xl p-1.5 shadow-sm transition-all flex flex-col sm:flex-row items-stretch gap-1.5"
            >
              <div className="flex items-center px-3 gap-2 flex-1 min-h-[44px]">
                <Search className="w-4 h-4 text-ink-muted shrink-0" />
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Masukkan Kode Lacak (cth: SB-2026-001) / Lokasi..."
                  className="w-full text-xs sm:text-sm bg-transparent text-ink placeholder:text-ink-muted focus:outline-none"
                  aria-label="Input kode pelacakan bencana"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-ink hover:bg-ink-soft text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <span>Lacak Status</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </form>

            {/* Main Action Buttons */}
            <div className="gsap-hero-cta flex flex-wrap items-center gap-3 w-full sm:w-auto pt-1">
              <Link
                href="/lapor"
                className="group relative inline-flex items-center justify-center h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-active text-white font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
              >
                <AlertTriangle className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                <span>Laporkan Kejadian Sekarang</span>
              </Link>

              <Link
                href="/peta"
                className="inline-flex items-center justify-center h-12 px-5 rounded-xl border border-line-strong bg-surface hover:bg-surface-hover hover:border-ink/20 text-ink font-semibold text-sm sm:text-base transition-all shadow-xs hover:shadow-sm min-h-[48px]"
              >
                <Compass className="w-4 h-4 mr-2 text-primary" />
                <span>Jelajahi Peta Situasi</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Quick-Report Bento Card (Compact - hidden on mobile) */}
          <div ref={heroCardRef} className="hidden lg:block lg:col-span-5 relative max-w-[420px] mx-auto lg:max-w-none w-full [perspective:1000px]">
            {/* Background Blob Accent */}
            <div
              aria-hidden="true"
              className="absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl bg-orange-600/25 blur-lg -z-10"
            />

            {/* Emergency Sonar Radar Rings */}
            <div
              aria-hidden="true"
              className="gsap-radar-sweep pointer-events-none absolute -inset-3 rounded-[32px] border border-orange-500/25 -z-10"
            />
            <div
              aria-hidden="true"
              className="gsap-radar-sweep-2 pointer-events-none absolute -inset-6 rounded-[36px] border border-red-500/15 -z-10"
            />

            {/* Dark Container Card with 3D Tilt */}
            <div className="gsap-bento-box bg-[#111622] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/50 space-y-3 text-white [transform-style:preserve-3d] transition-transform duration-100 ease-out">
              {/* Header Headline */}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                  Laporkan kejadian darurat di sekitar Anda sekarang.
                </h2>
              </div>

              {/* Stacked White Card (Center Layer with Offset Card Shadow) */}
              <div className="relative my-1">
                {/* Offset Card Layer Behind */}
                <div
                  aria-hidden="true"
                  className="gsap-offset-shadow absolute inset-0 bg-white/35 rounded-xl rotate-2 translate-x-1.5 -translate-y-1 scale-[0.98] shadow pointer-events-none"
                />

                {/* Main Foreground White Card */}
                <div className="relative bg-white rounded-xl p-2.5 sm:p-3 shadow-lg text-slate-900 border border-slate-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                      Pilih Jenis Kejadian
                    </span>
                    <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                      Siaga 24/7
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {/* Item 1: Kebakaran */}
                    <Link
                      href="/lapor?tipe=kebakaran"
                      className="gsap-bento-item group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-red-50 border border-red-100/80 p-0.5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                          <Image
                            src="/icon%20bencana/house-fire.png"
                            alt="Kebakaran"
                            width={20}
                            height={20}
                            className="object-contain w-5 h-5 drop-shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                            Kebakaran Pemukiman / Lahan
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Damkar 113 &middot; Pemadaman darurat
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 2: Banjir */}
                    <Link
                      href="/lapor?tipe=banjir"
                      className="gsap-bento-item group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100/80 p-0.5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                          <Image
                            src="/icon%20bencana/banjir.png"
                            alt="Banjir"
                            width={20}
                            height={20}
                            className="object-contain w-5 h-5 drop-shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            Banjir &amp; Luapan Air Sungai
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Lapor tinggi genangan &amp; evakuasi
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 3: Gempa Bumi */}
                    <Link
                      href="/lapor?tipe=gempa"
                      className="gsap-bento-item group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100/80 p-0.5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                          <Image
                            src="/icon%20bencana/gempa%20bumi.png"
                            alt="Gempa Bumi"
                            width={20}
                            height={20}
                            className="object-contain w-5 h-5 drop-shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                            Gempa Bumi &amp; Kerusakan
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Dampak retakan &amp; posko aman
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 4: Tanah Longsor & Cuaca */}
                    <Link
                      href="/lapor?tipe=longsor"
                      className="gsap-bento-item group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100/80 p-0.5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
                          <Image
                            src="/icon%20bencana/avalanche.png"
                            alt="Tanah Longsor"
                            width={20}
                            height={20}
                            className="object-contain w-5 h-5 drop-shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            Tanah Longsor &amp; Tebing Runtuh
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Akses jalan putus &amp; longsoran
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Overlapping Avatars + Report Count + Description */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="gsap-avatar-stack flex items-center gap-2.5">
                  {/* Overlapping Citizen Avatars */}
                  <div className="flex -space-x-2 overflow-hidden shrink-0">
                    <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-sm">
                      <Image
                        src="/avatars/avatar1.jpeg"
                        alt="Foto Profil Warga Pelapor 1"
                        width={32}
                        height={32}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-sm">
                      <Image
                        src="/avatars/avatar2.jpeg"
                        alt="Foto Profil Warga Pelapor 2"
                        width={32}
                        height={32}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-sm">
                      <Image
                        src="/avatars/avatar3.jpeg"
                        alt="Foto Profil Warga Pelapor 3"
                        width={32}
                        height={32}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-sm">
                      <Image
                        src="/avatars/avatar4.jpeg"
                        alt="Foto Profil Warga Pelapor 4"
                        width={32}
                        height={32}
                        className="object-cover h-full w-full"
                      />
                    </div>
                  </div>

                  {/* Report Count */}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>
                        <span className="gsap-citizen-counter font-mono">1.420</span>+ Warga Melaporkan
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {totalCount} laporan darurat aktif terverifikasi posko
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Laporan Anda diteruskan langsung ke sistem posko BPBD dan tim evakuasi terdekat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official Weather & Early Warning Live Broadcast Strip (Dimuat Saat Scroll) */}
      <section
        ref={warningSectionRef}
        aria-label="Peringatan Dini Cuaca & Gempa BMKG"
        className="opacity-0 relative overflow-hidden bg-white sm:bg-gradient-to-r sm:from-amber-500/10 sm:via-orange-500/10 sm:to-amber-500/5 border border-line sm:border-amber-300/60 rounded-xl p-3.5 sm:p-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"></span>
              <div className="relative w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-white shrink-0">
                  Peringatan Dini BMKG
                </span>
                <span className="text-xs sm:text-sm font-bold text-ink">
                  {liveQuake ? (
                    <>Gempa M {liveQuake.magnitude} — {liveQuake.wilayah}</>
                  ) : (
                    "Siaga Cuaca Ekstrem & Potensi Bencana Hidrometeorologi"
                  )}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-ink-soft mt-0.5 leading-snug">
                {liveQuake ? (
                  <>
                    Kedalaman {liveQuake.kedalaman} • {liveQuake.dirasakan} • {liveQuake.potensi}
                  </>
                ) : (
                  "Waspada potensi cuaca ekstrem di pesisir. Pantau aliran sungai terdekat."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {localWeather && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-semibold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold text-ink">{localWeather.cityName}</span>
                <span className="font-extrabold text-ink">{localWeather.temp}°C</span>
                {localWeather.weatherIcon && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={localWeather.weatherIcon}
                    alt={localWeather.weatherDesc}
                    className="w-4 h-4 object-contain shrink-0"
                  />
                )}
                <span className="text-ink-soft text-[11px] hidden sm:inline">{localWeather.weatherDesc}</span>
              </div>
            )}

            <Link
              href="/cuaca"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-slate-50 border border-line hover:border-slate-300 text-ink text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
            >
              <span>Radar Cuaca &amp; InaTEWS</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Kategori Kejadian Bencana Cepat (Dimuat Saat Scroll) */}
      <section
        ref={categoriesSectionRef}
        aria-labelledby="kategori-title"
        className="space-y-4"
      >
        <div className="gsap-cat-header opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="kategori-title" className="text-xl md:text-2xl font-bold text-ink">
              Kategori Kejadian Bencana
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Pilih klasifikasi bencana untuk membuka formulir pelaporan dengan panduan evakuasi spesifik
            </p>
          </div>

          <Link
            href="/lapor"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Buka Formulir Lengkap</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.type}
                href={`/lapor?tipe=${cat.type}`}
                className={`gsap-cat-card opacity-0 group relative p-5 bg-surface border border-line rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card flex flex-col justify-between ${cat.borderColor}`}
              >
                <div>
                  <div className="mb-3.5">
                    <div className={`gsap-cat-icon-box w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${cat.iconColor} p-2.5 shadow-2xs`}>
                      {cat.iconUrl ? (
                        <div className="relative w-9 h-9 flex items-center justify-center">
                          <Image
                            src={cat.iconUrl}
                            alt={cat.label}
                            width={36}
                            height={36}
                            className="object-contain drop-shadow-xs"
                          />
                        </div>
                      ) : IconComponent ? (
                        <IconComponent className="w-8 h-8" />
                      ) : null}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-line/70 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Laporkan Sekarang</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Live Situation Feed & Filterable Incident Reports (Dimuat Saat Scroll) */}
      <section
        ref={reportsSectionRef}
        aria-labelledby="laporan-terkini-title"
        className="space-y-4"
      >
        <div className="gsap-rep-header opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 id="laporan-terkini-title" className="text-xl md:text-2xl font-bold text-ink">
              Laporan Kejadian Terkini
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Data insiden terverifikasi posko terpadu dari seluruh penjuru Indonesia
            </p>
          </div>

          <Link
            href="/peta"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-soft hover:bg-primary-soft/80 text-primary-text border border-primary/20 text-xs font-bold transition-all self-start sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>Pantau 90+ Titik di Peta Interaktif</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="gsap-rep-filters opacity-0 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "semua", label: "Semua Kategori", icon: null },
            { id: "banjir", label: "Banjir", icon: Waves },
            { id: "gempa", label: "Gempa", icon: Activity },
            { id: "kebakaran", label: "Kebakaran", icon: Flame },
            { id: "longsor", label: "Tanah Longsor", icon: Mountain },
            { id: "karhutla", label: "Karhutla", icon: Trees },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDisasterFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all shrink-0 cursor-pointer ${selectedDisasterFilter === tab.id
                  ? "bg-ink text-white shadow-xs"
                  : "bg-surface hover:bg-bg text-ink-soft border border-line"
                  }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cards Grid */}
        {isLoadingReports ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-surface border border-line rounded-2xl p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-line/80 rounded-md" />
                    <div className="h-5 w-20 bg-line/80 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-line/90 rounded-md" />
                  <div className="h-3.5 w-full bg-line/50 rounded-md" />
                  <div className="h-3.5 w-2/3 bg-line/50 rounded-md" />
                </div>
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <div className="h-3.5 w-1/3 bg-line/60 rounded-md" />
                  <div className="h-3.5 w-20 bg-line/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-ink-muted">
            <p className="font-semibold text-sm text-ink">Belum ada laporan pada kategori ini</p>
            <p className="text-xs text-ink-soft mt-1">Pilih kategori bencana lain atau ajukan laporan baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="gsap-report-card bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-bg text-ink-muted border border-line">
                        {report.province || "Nasional"}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${report.status === "selesai"
                        ? "bg-success-soft text-success-text"
                        : report.status === "ditindaklanjuti"
                          ? "bg-warning-soft text-warning-text"
                          : "bg-info-soft text-info-text"
                        }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                    {cleanReportDescription(report.description)}
                  </p>
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{report.address}</span>
                  </div>

                  <Link
                    href={`/lacak?kode=${report.tracking_code}`}
                    className="font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 shrink-0 group min-h-[32px]"
                  >
                    <span>Pantau Alur</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Citizen Preparedness Bento Grid: Interactive TSB & Steps (Dimuat Saat Scroll) */}
      <section
        ref={mitigasiSectionRef}
        aria-labelledby="edukasi-title"
        className="space-y-4"
      >
        <div className="gsap-mit-header opacity-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="edukasi-title" className="text-xl md:text-2xl font-bold text-ink">
              Kesiapsiagaan &amp; Mitigasi Mandiri
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Bekali diri dan keluarga dengan langkah penyelamatan dan persiapan darurat sebelum bencana terjadi
            </p>
          </div>

          <Link
            href="/edukasi"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1"
          >
            <span>Seluruh Panduan Edukasi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bento 1: Checklist Tas Siaga Bencana (TSB) Standar BPBD (7 cols) */}
          <div className="gsap-tsb-box opacity-0 lg:col-span-7 bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Checklist Kesiapsiagaan
              </span>
              <h3 className="text-lg font-bold text-ink mt-0.5">
                Tas Siaga Bencana (TSB) Keluarga
              </h3>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              Pastikan tas siaga berisi kebutuhan pokok bertahan hidup minimal untuk 72 jam pertama pasca bencana:
            </p>

            {/* Checklist Items */}
            <div className="space-y-2.5 pt-1">
              {tsbItems.map((item) => (
                <div
                  key={item.id}
                  className="gsap-tsb-item opacity-0 w-full p-3 rounded-xl border border-line/80 bg-slate-50/70 flex items-start gap-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">{item.label}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>Wajib disiapkan di dekat pintu keluar rumah</span>
              <Link href="/edukasi#tsb" className="font-bold text-primary hover:underline">
                Panduan Isi Tas Lengkap &rarr;
              </Link>
            </div>
          </div>

          {/* Bento 2: Objek 3D Interaktif Tas Siaga Bencana (TSB) */}
          <div className="gsap-bag-box opacity-0 lg:col-span-5 flex flex-col items-center justify-center">
            <Interactive3DBag />
          </div>
        </div>
      </section>
    </main>
  );
}
