"use client";

import React, { useState } from "react";
import {
  Activity,
  Waves,
  Flame,
  Mountain,
  CheckSquare,
  Square,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";

interface GuidePhase {
  title: string;
  items: string[];
}

interface DisasterGuide {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  overview: string;
  phases: {
    sebelum: GuidePhase;
    saat: GuidePhase;
    sesudah: GuidePhase;
  };
}

const GUIDES: DisasterGuide[] = [
  {
    id: "gempa",
    name: "Gempa Bumi",
    icon: Activity,
    color: "text-warning",
    overview:
      "Gempa bumi terjadi tiba-tiba tanpa peringatan awal. Kunci keselamatan adalah reaksi cepat melindungi kepala dan menjauhi kaca atau benda yang mudah roboh.",
    phases: {
      sebelum: {
        title: "Sebelum Terjadi (Kesiapsiagaan)",
        items: [
          "Pastikan perabot berat (lemari, rak buku) terpaku kuat ke dinding.",
          "Tentukan titik aman di setiap ruangan (di bawah meja kokoh, dekat pilar utama).",
          "Simpan tas siaga bencana di tempat yang mudah dijangkau saat darurat.",
          "Hafalkan nomor darurat dan sepakati titik kumpul bersama keluarga.",
        ],
      },
      saat: {
        title: "Saat Gempa Terjadi (Tanggap Cepat)",
        items: [
          "Terapkan prinsip: DROP (berlutut), COVER (lindungi kepala & leher), HOLD ON (berpegangan pada benda kokoh).",
          "Jangan gunakan lift saat evakuasi; selalu gunakan tangga darurat.",
          "Jika berada di luar ruangan, jauhi gedung tinggi, tiang listrik, dan papan reklame.",
          "Jika sedang berkendara, tepi dan hentikan kendaraan di tempat terbuka.",
        ],
      },
      sesudah: {
        title: "Sesudah Gempa Mereda (Pemulihan)",
        items: [
          "Periksa kemungkinan kebocoran gas atau korsleting listrik sebelum menyalakan api/lampu.",
          "Waspadai gempa susulan yang kekuatannya bisa merobohkan struktur bangunan retak.",
          "Gunakan alas kaki untuk menghindari pecahan kaca dan puing tajam.",
          "Pantau informasi resmi gempa susulan hanya dari rilis resmi BMKG.",
        ],
      },
    },
  },
  {
    id: "banjir",
    name: "Banjir",
    icon: Waves,
    color: "text-info",
    overview:
      "Banjir luapan sungai atau pasang air laut dapat dicegah dampaknya dengan pemantauan debit air dan evakuasi dini sebelum arus menjadi deras.",
    phases: {
      sebelum: {
        title: "Sebelum Terjadi (Kesiapsiagaan)",
        items: [
          "Simpan dokumen berharga dan barang elektronik di lantai atas atau wadah kedap air.",
          "Ketahui jalur evakuasi menuju tempat penampungan sementara di lingkungan Anda.",
          "Bersihkan saluran air dan drainase secara berkala bersama warga sekitar.",
          "Siapkan pelampung atau ban darurat untuk anak-anak dan lansia.",
        ],
      },
      saat: {
        title: "Saat Air Mulai Masuk (Tanggap Cepat)",
        items: [
          "Segera matikan saklar listrik utama (MCB) dan tutup kran gas LPG.",
          "Amankan keluarga, prioritaskan anak-anak, ibu hamil, dan lansia menuju tempat tinggi.",
          "Jangan berjalan atau berkendara menembus arus air banjir melebihi batas lutut.",
          "Hindari menyentuh tiang listrik atau kabel yang terendam air.",
        ],
      },
      sesudah: {
        title: "Sesudah Air Surut (Pemulihan)",
        items: [
          "Pastikan instalasi listrik telah diperiksa teknisi sebelum dinyalakan kembali.",
          "Gunakan desinfektan dan sarung tangan saat membersihkan lumpur bekas banjir.",
          "Waspadai binatang berbahaya (ular, kalajengking) yang bersarang di sela perabot.",
          "Rebus air minum hingga mendidih sempurna untuk mencegah penularan penyakit diare/leptospirosis.",
        ],
      },
    },
  },
  {
    id: "kebakaran",
    name: "Kebakaran",
    icon: Flame,
    color: "text-danger",
    overview:
      "Asap beracun lebih mematikan daripada api itu sendiri. Saat kebakaran, evakuasi cepat dan merayap rendah di bawah asap adalah kunci menyelamatkan diri.",
    phases: {
      sebelum: {
        title: "Sebelum Terjadi (Kesiapsiagaan)",
        items: [
          "Sediakan Alat Pemadam Api Ringan (APAR) di dapur dan periksa masa berlakunya.",
          "Hindari menumpuk steker listrik berlebihan pada satu stopkontak.",
          "Jauhkan cairan mudah terbakar dari jangkauan kompor atau percikan api.",
          "Pastikan pintu keluar dan tangga darurat tidak terhalang barang.",
        ],
      },
      saat: {
        title: "Saat Muncul Api / Asap (Tanggap Cepat)",
        items: [
          "Tutup hidung dan mulut dengan kain basah untuk menyaring asap beracun.",
          "Merayap rendah di lantai saat keluar ruangan karena oksigen bersih berada di lapisan bawah.",
          "Jangan membuka pintu yang terasa panas saat disentuh punggung tangan.",
          "Jika pakaian terbakar: BERHENTI (Stop), JATOHKAN DIRI (Drop), BERGULING (Roll).",
        ],
      },
      sesudah: {
        title: "Sesudah Api Dipadamkan (Pemulihan)",
        items: [
          "Jangan memasuki kembali bangunan yang terbakar sebelum dinyatakan aman oleh petugas Damkar.",
          "Segera periksakan diri ke puskesmas/RS jika mengalami luka bakar atau sesak napas.",
          "Laporkan kejadian ke ketua lingkungan dan posko penanggulangan setempat.",
        ],
      },
    },
  },
  {
    id: "longsor",
    name: "Tanah Longsor",
    icon: Mountain,
    color: "text-ink",
    overview:
      "Tanah longsor sering terjadi pada lereng curam saat musim hujan deras. Kenali tanda-tanda awal retakan tanah dan mata air yang mendadak keruh.",
    phases: {
      sebelum: {
        title: "Sebelum Terjadi (Kesiapsiagaan)",
        items: [
          "Waspadai retakan memanjang pada tanah, lantai rumah, atau jalan lereng.",
          "Perhatikan pohon atau tiang listrik yang mulai miring ke arah lereng bawah.",
          "Jangan menebang pohon penahan lereng curam tanpa penanaman ulang tanaman berakar kuat.",
          "Segera mengungsi jika hujan lebat berlangsung lebih dari 3 jam berturut-turut di wilayah lereng.",
        ],
      },
      saat: {
        title: "Saat Longsor Terjadi (Tanggap Cepat)",
        items: [
          "Segera lari menjauhi arah runtuhan lereng menuju tanah lapang yang stabil.",
          "Jangan berlindung di bawah lereng atau di dalam rumah semi permanen di bibir tebing.",
          "Bunyikan kentongan atau tanda bahaya agar tetangga sekitar segera terbangun.",
        ],
      },
      sesudah: {
        title: "Sesudah Longsor Terjadi (Pemulihan)",
        items: [
          "Jauhi lokasi longsor karena tanah susulan masih sangat rentan ambrol.",
          "Bantu evakuasi korban hanya jika situasi lereng dinyatakan aman oleh BPBD/Basarnas.",
          "Ikuti arahan posko pengungsian resmi mengenai jalur distribusi bantuan.",
        ],
      },
    },
  },
];

const SURVIVAL_KIT_ITEMS = [
  "Dokumen Penting (KK, KTP, Ijazah, Polis Asuransi) dalam kantong plastik kedap air",
  "Kotak P3K standar & obat-obatan pribadi rutin",
  "Makanan instan tahan lama (biskuit, kurma, kornet) & air minum botol untuk 3 hari",
  "Senter LED terang & baterai cadangan",
  "Peluit darurat (untuk menarik perhatian regu penolong)",
  "Powerbank & kabel charger ponsel",
  "Pakaian ganti hangat, selimut tipis, dan jas hujan",
  "Uang tunai pecahan kecil secukupnya",
];

export default function EdukasiPage() {
  const [selectedDisasterId, setSelectedDisasterId] = useState<string>("gempa");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const activeGuide =
    GUIDES.find((g) => g.id === selectedDisasterId) || GUIDES[0];

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-10">
      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-primary-soft text-primary-hover text-xs font-semibold mb-3">
          Panduan Mitigasi & Kesiapsiagaan Bencana
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Edukasi Tanggap Bencana
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          Ketahui langkah penyelamatan diri sebelum, saat, dan sesudah bencana untuk melindungi diri Anda dan keluarga tercinta.
        </p>
      </div>

      {/* Tabs Kategori Bencana */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {GUIDES.map((g) => {
          const Icon = g.icon;
          const isActive = selectedDisasterId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedDisasterId(g.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                isActive
                  ? "border-primary bg-primary text-white shadow-sm scale-105"
                  : "border-line bg-surface text-ink hover:border-line-strong hover:bg-bg"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* Guide Content: 3 Phases Grid */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-ink mb-1">
            Panduan Menghadapi {activeGuide.name}
          </h2>
          <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
            {activeGuide.overview}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Fase 1: Sebelum */}
          <div className="bg-bg border border-line rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <span className="w-6 h-6 rounded-full bg-info text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-ink">
                {activeGuide.phases.sebelum.title}
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-ink-soft leading-relaxed">
              {activeGuide.phases.sebelum.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fase 2: Saat Terjadi */}
          <div className="bg-warning-soft/40 border border-warning/30 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-warning/30 pb-2.5">
              <span className="w-6 h-6 rounded-full bg-warning text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-ink">
                {activeGuide.phases.saat.title}
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-ink leading-relaxed">
              {activeGuide.phases.saat.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fase 3: Sesudah */}
          <div className="bg-bg border border-line rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <span className="w-6 h-6 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-ink">
                {activeGuide.phases.sesudah.title}
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-ink-soft leading-relaxed">
              {activeGuide.phases.sesudah.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Survival Kit Checklist Section */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-line">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-ink">
              Checklist Tas Siaga Bencana (Survival Kit)
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Siapkan barang-barang penting ini di satu tas ransel tahan air untuk evakuasi cepat
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-soft text-primary-hover self-start sm:self-center">
            {checkedCount} dari {SURVIVAL_KIT_ITEMS.length} Barang Tercentang
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SURVIVAL_KIT_ITEMS.map((item, idx) => {
            const isChecked = !!checkedItems[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleCheck(idx)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors ${
                  isChecked
                    ? "bg-primary-soft/40 border-primary text-ink"
                    : "bg-surface border-line text-ink hover:bg-bg"
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
                )}
                <span
                  className={`text-xs leading-relaxed ${
                    isChecked ? "font-semibold text-primary-hover" : "text-ink-soft"
                  }`}
                >
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Official Emergency Contact Directory */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink">
            Kanal Panggilan Darurat Nasional
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Nomor bebas pulsa yang dapat dihubungi 24 jam saat terjadi kondisi genting
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="tel:112"
            className="p-4 rounded-lg border border-danger/30 bg-danger-soft/40 hover:bg-danger-soft transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center font-bold text-sm shrink-0">
              112
            </div>
            <div>
              <p className="text-xs font-bold text-danger-text">Panggilan Darurat Terpadu</p>
              <p className="text-[11px] text-ink-muted">Bebas pulsa seluruh operator</p>
            </div>
          </a>

          <a
            href="tel:115"
            className="p-4 rounded-lg border border-primary/30 bg-primary-soft/40 hover:bg-primary-soft transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
              115
            </div>
            <div>
              <p className="text-xs font-bold text-primary-hover">Basarnas (SAR Nasional)</p>
              <p className="text-[11px] text-ink-muted">Pencarian & evakuasi korban</p>
            </div>
          </a>

          <a
            href="tel:113"
            className="p-4 rounded-lg border border-danger/30 bg-danger-soft/40 hover:bg-danger-soft transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-danger text-white flex items-center justify-center font-bold text-sm shrink-0">
              113
            </div>
            <div>
              <p className="text-xs font-bold text-danger-text">Pemadam Kebakaran (Damkar)</p>
              <p className="text-[11px] text-ink-muted">Penyelamatan & kebakaran</p>
            </div>
          </a>

          <a
            href="tel:119"
            className="p-4 rounded-lg border border-info/30 bg-info-soft/40 hover:bg-info-soft transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-info text-white flex items-center justify-center font-bold text-sm shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-info-text">Ambulans & Medis (Kemenkes)</p>
              <p className="text-[11px] text-ink-muted">Pertolongan darurat gawat medis</p>
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
