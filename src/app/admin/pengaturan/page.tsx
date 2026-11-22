"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Volume2,
  VolumeX,
  Bell,
  MapPin,
  Flame,
  HeartPulse,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Play,
  Square,
  Layers,
  Info,
  Lock,
  Building2,
  Radio,
  Sliders,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { playSosSiren, stopSosSiren } from "@/lib/audio/siren";
import {
  getAdminSettings,
  saveAdminSettings,
  resetAdminSettings,
  type AdminSettingsConfig,
  DEFAULT_ADMIN_SETTINGS,
} from "@/lib/services/settings";

type SettingsTab = "petugas" | "audio" | "peta";

export default function AdminPengaturanPage() {
  const { adminUser, updateAdminUser, isSirenMuted, setIsSirenMuted } = useAdmin();

  // Tab aktif
  const [activeTab, setActiveTab] = useState<SettingsTab>("petugas");

  // State pengaturan posko
  const [settings, setSettings] = useState<AdminSettingsConfig>(DEFAULT_ADMIN_SETTINGS);
  
  // State profil petugas piket
  const [officerForm, setOfficerForm] = useState({
    name: "Kapten Hendra Gunawan",
    nip: "198803152011011002",
    email: "hendra.bpbd@sigapbumi.id",
    role: "Komandan Posko",
    unit: "bnpb_bpbd",
    unitName: "BNPB / BPBD",
  });

  // State UI interaktif
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Pengaturan berhasil disimpan.");
  const [isTestingSiren, setIsTestingSiren] = useState(false);
  const [stopSirenRef, setStopSirenRef] = useState<(() => void) | null>(null);

  // Load initial settings and officer profile
  useEffect(() => {
    const loaded = getAdminSettings();
    setSettings(loaded);

    if (adminUser) {
      setOfficerForm({
        name: adminUser.name || "Kapten Hendra Gunawan",
        nip: adminUser.nip || "198803152011011002",
        email: adminUser.email || "hendra.bpbd@sigapbumi.id",
        role: adminUser.role || "Komandan Posko",
        unit: adminUser.unit || "bnpb_bpbd",
        unitName: adminUser.unitName || "BNPB / BPBD",
      });
    }
  }, [adminUser]);

  // Show notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3500);
  };

  // Simpan perubahan pengaturan
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Simpan pengaturan posko
    saveAdminSettings(settings);

    // 2. Simpan profil petugas ke auth session
    updateAdminUser({
      name: officerForm.name,
      nip: officerForm.nip,
      email: officerForm.email,
      role: officerForm.role,
      unit: officerForm.unit,
      unitName: officerForm.unitName,
    });

    // 3. Sinkronisasi state mute sirine dengan AdminShell
    setIsSirenMuted(!settings.autoPlaySiren);

    showToast("Seluruh pengaturan posko dan profil petugas berhasil disimpan!");
  };

  // Reset pengaturan ke default
  const handleResetToDefault = () => {
    if (window.confirm("Kembalikan semua konfigurasi posko ke pengaturan default awal?")) {
      const reset = resetAdminSettings();
      setSettings(reset);
      setIsSirenMuted(false);
      showToast("Konfigurasi posko telah dikembalikan ke standar awal.");
    }
  };

  // Tes Sirine Audio Web Audio API
  const handleTestSiren = () => {
    if (isTestingSiren) {
      if (stopSirenRef) stopSirenRef();
      stopSosSiren();
      setIsTestingSiren(false);
      setStopSirenRef(null);
    } else {
      setIsTestingSiren(true);
      const stopFn = playSosSiren(settings.sirenCycles || 2, settings.sirenVolume);
      setStopSirenRef(() => stopFn);

      const cycleDuration = (settings.sirenCycles || 2) * 800 + 400;
      setTimeout(() => {
        setIsTestingSiren(false);
        setStopSirenRef(null);
      }, cycleDuration);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-50 text-[#EA580C]">
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pusat Kendali Operasi
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan & Konfigurasi Posko
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola profil petugas jaga, preferensi sirene darurat SOS, dan opsi visualisasi tampilan peta posko.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            title="Kembalikan ke standar awal"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#D44D07] text-white font-bold text-xs transition-all shadow-md hover:shadow-orange-500/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("petugas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "petugas"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4 text-[#EA580C]" />
          <span>Profil & Petugas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audio")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "audio"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Volume2 className="w-4 h-4 text-rose-500" />
          <span>Sirene & Audio SOS</span>
          {settings.autoPlaySiren && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("peta")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "peta"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers className="w-4 h-4 text-purple-500" />
          <span>Tampilan Peta</span>
        </button>
      </div>

      {/* Tab 1: Profil Petugas & Posko */}
      {activeTab === "petugas" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#EA580C]" />
                <span>Identitas Petugas Piket Operasional</span>
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini akan tertera pada log penanganan, pengesahan status laporan, dan kartu piket komando.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap Petugas
                  </label>
                  <input
                    type="text"
                    value={officerForm.name}
                    onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-semibold text-slate-800"
                    placeholder="Contoh: Kapten Hendra Gunawan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor Induk Pegawai (NIP / NRP)
                  </label>
                  <input
                    type="text"
                    value={officerForm.nip}
                    onChange={(e) => setOfficerForm({ ...officerForm, nip: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono text-slate-800"
                    placeholder="Contoh: 198803152011011002"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Kedinasan
                  </label>
                  <input
                    type="email"
                    value={officerForm.email}
                    onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] text-slate-800"
                    placeholder="Contoh: petugas.bpbd@sigapbumi.id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jabatan Operasional
                  </label>
                  <input
                    type="text"
                    value={officerForm.role}
                    onChange={(e) => setOfficerForm({ ...officerForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] text-slate-800"
                    placeholder="Contoh: Komandan Posko / Operator Pusdalops"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Instansi Penanggung Jawab & Hak Akses
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Terkunci Sesuai Akun Login
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      {
                        id: "pemerintahan",
                        label: "Pemerintahan (Pusat)",
                        sub: "Semua Data Masuk",
                        icon: Building2,
                        color: "text-amber-600",
                      },
                      {
                        id: "bnpb_bpbd",
                        label: "BNPB / BPBD",
                        sub: "Bencana Hidrometeorologi",
                        icon: LifeBuoy,
                        color: "text-[#EA580C]",
                      },
                      {
                        id: "damkar",
                        label: "Dinas Damkar",
                        sub: "Kebakaran & Karhutla",
                        icon: Flame,
                        color: "text-rose-500",
                      },
                      {
                        id: "medis",
                        label: "Dinkes / RS",
                        sub: "Medis Darurat & PSC 119",
                        icon: HeartPulse,
                        color: "text-rose-600",
                      },
                      {
                        id: "polisi",
                        label: "Kepolisian (Polri)",
                        sub: "Kamtibmas & Pengamanan",
                        icon: Shield,
                        color: "text-blue-600",
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = officerForm.unit === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                            isSelected
                              ? "border-[#EA580C] bg-[#FFF4EC] text-[#EA580C] shadow-sm ring-1 ring-[#EA580C]"
                              : "border-slate-200/80 bg-slate-50/40 text-slate-400 opacity-60"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected ? "text-[#EA580C]" : item.color
                            }`}
                          />
                          <span className="text-[11px] text-center font-bold">
                            {item.label}
                          </span>
                          <span className="text-[9px] text-center font-normal line-clamp-1">
                            {item.sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Untuk berganti instansi atau hak akses, silakan logout dan login kembali dengan role yang sesuai.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Profil Stasiun Posko */}
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                <span>Konfigurasi Stasiun Komando Posko</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Posko Induk
                  </label>
                  <input
                    type="text"
                    value={settings.stationName}
                    onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kode Identifikasi Posko
                  </label>
                  <input
                    type="text"
                    value={settings.stationCode}
                    onChange={(e) => setSettings({ ...settings, stationCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Frekuensi Radio Tanggap Darurat (HT)
                  </label>
                  <input
                    type="text"
                    value={settings.radioFrequency}
                    onChange={(e) => setSettings({ ...settings, radioFrequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Callsign Dispatch Komando
                  </label>
                  <input
                    type="text"
                    value={settings.dispatchCallsign}
                    onChange={(e) => setSettings({ ...settings, dispatchCallsign: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Keamanan Sesi & Auto-Logout */}
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 text-[#EA580C] border border-orange-100/80">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Keamanan Sesi & Auto-Logout
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Protokol keamanan inaktivitas (idle) dan pemutusan sesi peramban
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Batas Waktu Idle (Inaktivitas)
                  </label>
                  <select
                    value={settings.sessionIdleTimeoutMinutes || 15}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionIdleTimeoutMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value={5}>5 Menit (Keamanan Ketat)</option>
                    <option value={10}>10 Menit</option>
                    <option value={15}>15 Menit (Standar Rekomendasi)</option>
                    <option value={30}>30 Menit</option>
                    <option value={60}>60 Menit (Operasional Khusus)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Peringatan akan muncul 60 detik sebelum sesi ditutup otomatis jika tidak ada aktivitas.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Logout Saat Keluar Website
                  </label>
                  <div className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 flex items-center justify-between">
                    <span className="font-semibold text-xs">Tutup Tab / Peramban</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                      Selalu Aktif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    Sesi diterminasi seketika saat peramban atau tab posko ditutup demi kepatuhan SOP BPBD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden border border-slate-700">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Shield className="w-32 h-32" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Badge Petugas Valid
              </div>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-xl shadow-lg">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white leading-snug">
                    {officerForm.name || "Nama Petugas"}
                  </h4>
                  <p className="text-xs text-orange-200 font-semibold mt-0.5">
                    {officerForm.role || "Komandan Posko"}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    NIP: {officerForm.nip || "-"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-700/80 pt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Instansi:</span>
                  <span className="font-bold text-white">{officerForm.unitName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Posko Induk:</span>
                  <span className="font-bold text-white">{settings.stationCode}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Kanal Radio:</span>
                  <span className="font-mono text-emerald-300">{settings.radioFrequency}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Status Akses:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Super Admin Posko
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-slate-800">
              <h4 className="text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Penyimpanan Data Sesi
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Profil petugas tersimpan secara lokal dan otomatis tercermin pada sidebar, topbar, dan tiket respon darurat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sirene & Audio SOS */}
      {activeTab === "audio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-rose-500" />
                    <span>Konfigurasi Sirine Darurat Web Audio API</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Alarm sirine dual-tone berfrekuensi tinggi (620 Hz – 1080 Hz) yang berbunyi otomatis saat ada sinyal darurat warga masuk.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestSiren}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                    isTestingSiren
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isTestingSiren ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Hentikan Sirine</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tes Bunyikan Sirine</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle Auto-Play Siren */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Bunyikan Sirine Otomatis Saat Sinyal SOS Masuk</span>
                    {settings.autoPlaySiren ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        Senyap (Muted)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memastikan petugas posko langsung terbangun dan waspada ketika ada panggilan darurat dari warga sekitar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.autoPlaySiren}
                    onChange={(e) => setSettings({ ...settings, autoPlaySiren: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                </label>
              </div>

              {/* Slider Volume Sirine */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>Intensitas Volume Sirine</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {Math.round(settings.sirenVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={settings.sirenVolume}
                  onChange={(e) =>
                    setSettings({ ...settings, sirenVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Lembut (5%)</span>
                  <span>Standar Posko (40%)</span>
                  <span>Maksimal (100%)</span>
                </div>
              </div>

              {/* Pilihan Siklus Pengulangan Ayunan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Durasi Ayunan Gelombang Sirine
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { cycles: 2, label: "2 Ayunan (~1.6 Detik)", desc: "Singkat & tidak bising" },
                    { cycles: 4, label: "4 Ayunan (~3.2 Detik)", desc: "Rekomendasi standar posko" },
                    { cycles: 8, label: "8 Ayunan (~6.4 Detik)", desc: "Sinyal siaga intensif" },
                  ].map((c) => {
                    const isSelected = settings.sirenCycles === c.cycles;
                    return (
                      <button
                        key={c.cycles}
                        type="button"
                        onClick={() => setSettings({ ...settings, sirenCycles: c.cycles })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/60 ring-1 ring-rose-500 text-rose-950"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <p className="text-xs font-bold">{c.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chime untuk Laporan Masuk Biasa */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-900">
                    Peringatan Audio Halus (Chime) untuk Laporan Bencana Biasa
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Membunyikan nada notifikasi ringan saat warga mengajukan laporan kerusakan non-darurat.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.chimeOnNewReport}
                    onChange={(e) =>
                      setSettings({ ...settings, chimeOnNewReport: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Info Box */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-rose-500" />
                <span>Teknologi Web Audio API</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sirine Posko SigapBumi diproduksi secara matematis oleh browser menggunakan dual-tone wave synthesizer oscillator.
              </p>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>Bebas latensi unduh file audio MP3/WAV.</li>
                <li>Tetap berbunyi bahkan dalam kondisi koneksi internet darurat lambat (offline-first).</li>
                <li>Mendukung auto-resume audio context saat operator mengklik layar posko.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tampilan Peta */}
      {activeTab === "peta" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <span>Preferensi Tampilan Peta Operasional</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur mode peta taktis, laju penyegaran data otomatis, dan visualisasi konsentrasi kerawanan.
                </p>
              </div>

              {/* Gaya Peta Default */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Gaya Lapisan Peta Default
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "OpenStreetMap Terang", desc: "Kontras tinggi siang hari" },
                    { id: "dark", label: "Carto Dark (Mode Malam)", desc: "Ramah mata di ruang kendali" },
                    { id: "satellite", label: "Citra Satelit Topografi", desc: "Detail kontur dan vegetasi" },
                  ].map((layer) => {
                    const isSelected = settings.defaultMapLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() =>
                          setSettings({ ...settings, defaultMapLayer: layer.id as any })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 text-purple-950"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <p className="text-xs font-bold">{layer.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{layer.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Laju Auto-Refresh Interval */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Interval Sinkronisasi Data Cadangan (Polling Fallback)
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { sec: 10, label: "Tiap 10 Detik" },
                    { sec: 15, label: "Tiap 15 Detik (Default)" },
                    { sec: 30, label: "Tiap 30 Detik" },
                    { sec: 60, label: "Tiap 1 Menit" },
                  ].map((t) => {
                    const isSelected = settings.autoRefreshIntervalSec === t.sec;
                    return (
                      <button
                        key={t.sec}
                        type="button"
                        onClick={() => setSettings({ ...settings, autoRefreshIntervalSec: t.sec })}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 text-purple-900 font-bold"
                            : "border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle Heatmap */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-900">
                    Tampilkan Heatmap Kepadatan Bencana Secara Default
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan lapisan gradasi panas untuk memetakan klaster lokasi bencana terbanyak.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.showHeatmapDefault}
                    onChange={(e) =>
                      setSettings({ ...settings, showHeatmapDefault: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Efisiensi Resource Posko
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengaturan interval membantu menghemat konsumsi memori browser saat memantau dashboard 24/7 di monitor layar lebar posko.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
