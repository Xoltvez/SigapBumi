"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  User,
  Shield,
  Radio,
  Volume2,
  VolumeX,
  Bell,
  MapPin,
  Sliders,
  Flame,
  HeartPulse,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Play,
  Square,
  Compass,
  Send,
  Download,
  Trash2,
  Layers,
  Wifi,
  ExternalLink,
  Info,
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
import { sendSosAlert } from "@/lib/services/sos";

type SettingsTab = "petugas" | "audio" | "radar" | "integrasi" | "peta" | "data";

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
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [isSendingTestSos, setIsSendingTestSos] = useState(false);

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

  // Ambil titik koordinat riil GPS posko saat ini
  const handleDetectStationGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      alert("Browser Anda tidak mendukung deteksi GPS otomatis.");
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          stationLat: Number(pos.coords.latitude.toFixed(5)),
          stationLng: Number(pos.coords.longitude.toFixed(5)),
        }));
        setIsGettingGps(false);
        showToast("Titik koordinat posko berhasil disinkronkan dengan GPS riil!");
      },
      (err) => {
        setIsGettingGps(false);
        alert(`Gagal mengambil koordinat GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Kirim Sinyal SOS Simulasi Uji Coba
  const handleSendTestSos = async () => {
    setIsSendingTestSos(true);
    try {
      await sendSosAlert({
        lat: settings.stationLat + (Math.random() - 0.5) * 0.015,
        lng: settings.stationLng + (Math.random() - 0.5) * 0.015,
        assistanceType: (officerForm.unit === "damkar"
          ? "damkar"
          : officerForm.unit === "medis"
          ? "medis"
          : officerForm.unit === "polisi"
          ? "polisi"
          : "bnpb_bpbd") as any,
        note: `[SIMULASI GLADI RESIK] Uji Coba Kesiapsiagaan Posko ${settings.stationCode}`,
        phoneNumber: settings.whatsappDispatcherNumber || "0812-3456-7890",
        senderName: "Petugas Operator Gladi Resik",
      });

      if (settings.autoPlaySiren) {
        playSosSiren(2, settings.sirenVolume);
      }

      showToast("Sinyal darurat uji coba berhasil disiarkan ke Radar SOS!");
    } catch {
      alert("Gagal menyiarkan sinyal SOS simulasi.");
    } finally {
      setIsSendingTestSos(false);
    }
  };

  // Bersihkan cache panggilan darurat lokal
  const handleClearSosCache = () => {
    if (window.confirm("Hapus semua riwayat sinyal darurat lokal dari cache browser?")) {
      try {
        localStorage.removeItem("sigapbumi_sos_alerts_cache");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: {} }));
        showToast("Cache sinyal darurat berhasil dibersihkan!");
      } catch {
        alert("Gagal menghapus cache.");
      }
    }
  };

  // Ekspor rekap data konfigurasi & log
  const handleExportConfig = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            posko: settings,
            petugas: officerForm,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `sigapbumi_config_${settings.stationCode.toLowerCase()}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Berkas konfigurasi posko berhasil diunduh!");
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
            Kelola profil petugas jaga, preferensi sirene darurat SOS, radius radar geofencing,
            dan integrasi komunikasi taktis lintas instansi.
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
          onClick={() => setActiveTab("radar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "radar"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Compass className="w-4 h-4 text-blue-500" />
          <span>Radar & Geofencing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("integrasi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "integrasi"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-500" />
          <span>Integrasi & Komunikasi</span>
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

        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "data"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Sliders className="w-4 h-4 text-slate-600" />
          <span>Uji Coba & Data</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Instansi Penanggung Jawab
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "bnpb_bpbd", label: "BNPB / BPBD", icon: LifeBuoy, color: "text-[#EA580C]" },
                      { id: "damkar", label: "Dinas Damkar", icon: Flame, color: "text-rose-500" },
                      { id: "medis", label: "Dinkes / RS", icon: HeartPulse, color: "text-rose-600" },
                      { id: "polisi", label: "Kepolisian (Polri)", icon: Shield, color: "text-blue-600" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = officerForm.unit === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setOfficerForm({
                              ...officerForm,
                              unit: item.id,
                              unitName: item.label,
                            })
                          }
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? "border-[#EA580C] bg-[#FFF4EC] text-[#EA580C] shadow-sm ring-1 ring-[#EA580C]"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 text-slate-700"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? "text-[#EA580C]" : item.color}`} />
                          <span className="text-[11px] text-center">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
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

      {/* Tab 3: Radar & Geofencing */}
      {activeTab === "radar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  <span>Jangkauan Radar Geofencing Tanggap Darurat</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Menentukan perimeter radius wilayah tanggung jawab posko dan target SLA waktu respon cepat armada.
                </p>
              </div>

              {/* Titik Pusat Koordinat Posko */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#EA580C]" />
                    <span>Koordinat Pusat Posko Induk (Base Station)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectStationGps}
                    disabled={isGettingGps}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-colors shadow-xs"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isGettingGps ? "animate-spin text-blue-600" : ""}`} />
                    <span>{isGettingGps ? "Mencari GPS..." : "Gunakan GPS Saat Ini"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Latitude:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={settings.stationLat}
                      onChange={(e) =>
                        setSettings({ ...settings, stationLat: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Longitude:</span>
                    <input
                      type="number"
                      step="0.00001"
                      value={settings.stationLng}
                      onChange={(e) =>
                        setSettings({ ...settings, stationLng: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pilihan Radius Geofence */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Radius Geofence Prioritas Posko
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { km: 5, label: "5 KM", desc: "Kelurahan/Lokal" },
                    { km: 10, label: "10 KM", desc: "Kecamatan" },
                    { km: 25, label: "25 KM", desc: "Kota / Rayon (Standar)" },
                    { km: 50, label: "50 KM", desc: "Lintas Wilayah" },
                    { km: 0, label: "Nasional", desc: "Semua Sinyal Masuk" },
                  ].map((r) => {
                    const isSelected = settings.geofenceRadiusKm === r.km;
                    return (
                      <button
                        key={r.km}
                        type="button"
                        onClick={() => setSettings({ ...settings, geofenceRadiusKm: r.km })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-900"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <p className="text-xs font-extrabold">{r.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target SLA Waktu Respon Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Target SLA Waktu Tanggap Armada (Menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.targetSlaMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, targetSlaMinutes: parseInt(e.target.value) || 15 })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Laporan darurat dengan waktu tunggu melampaui target ini akan berubah warna merah di radar.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Ambang Skor Prioritas Tinggi (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={settings.highPriorityThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        highPriorityThreshold: parseInt(e.target.value) || 75,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Laporan dengan skor AI di atas angka ini otomatis memicu tanda bahaya tingkat satu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Prinsip Radar Geofencing</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Radius Geofencing membantu operator memilah antara insiden di zona yurisdiksi utama dan insiden lintas rayon posko lain.
              </p>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-xs text-blue-900 font-medium">
                Sinyal SOS dari warga di luar radius ini tetap tercatat, namun tidak memicu alarm otomatis secara agresif.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Integrasi & Komunikasi */}
      {activeTab === "integrasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-600" />
                  <span>Kanal Dispatcher & Komunikasi Eksternal</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hubungkan sistem posko dengan gateway perpesanan WhatsApp, notifikasi desktop browser, dan webhook darurat.
                </p>
              </div>

              {/* Notifikasi Desktop Browser */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="pr-4">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Notifikasi Pop-up Desktop Browser</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tampilkan pop-up peringatan di layar komputer petugas meskipun tab posko sedang berada di latar belakang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if ("Notification" in window) {
                      Notification.requestPermission().then((res) => {
                        if (res === "granted") {
                          new Notification("SigapBumi Posko", {
                            body: "Notifikasi darurat desktop posko aktif dan berfungsi!",
                          });
                          showToast("Izin notifikasi desktop berhasil diaktifkan!");
                        } else {
                          alert("Izin notifikasi ditolak oleh browser.");
                        }
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs"
                >
                  Uji Izin Notifikasi
                </button>
              </div>

              {/* WhatsApp Gateway Dispatcher */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nomor WhatsApp Dispatcher Komando
                </label>
                <input
                  type="tel"
                  value={settings.whatsappDispatcherNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, whatsappDispatcherNumber: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-slate-800"
                  placeholder="Contoh: 0811-9876-5432"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor ini akan terlampir otomatis saat operator menekan tombol &ldquo;Kirim Info ke Armada via WA&rdquo;.
                </p>
              </div>

              {/* Webhook Dispatcher Eksternal */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Webhook Dispatcher Terpadu (Opsional)
                </label>
                <input
                  type="url"
                  value={settings.emergencyWebhookUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, emergencyWebhookUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-slate-800"
                  placeholder="https://api.bpbd.go.id/dispatch/webhook"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  URL endpoint POST JSON untuk meneruskan payload sinyal SOS ke sistem komando nasional BNPB/112.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>Konektivitas Realtime Supabase</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kanal WebSocket `sos_alerts` dan `reports` aktif mendengarkan perubahan data secara langsung di browser tanpa perlu reload halaman.
              </p>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kanal Siaga 24 Jam Terhubung</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Tampilan Peta */}
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

      {/* Tab 6: Uji Coba & Manajemen Data */}
      {activeTab === "data" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-slate-700" />
                  <span>Simulasi Gladi Resik & Pemeliharaan Sistem</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Alat bantu pengujian kesiapsiagaan tim, ekspor berkas audit, dan pembersihan cache darurat.
                </p>
              </div>

              {/* Mode Simulasi Gladi Resik */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-amber-500 text-white">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-amber-950">
                      Mode Simulasi Gladi Resik (Latihan Siaga Bencana)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                    Saat mode ini aktif, banner penanda &ldquo;Mode Simulasi&rdquo; akan ditampilkan agar operator dapat membedakan data latihan dengan kejadian bencana nyata.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.simulationMode}
                    onChange={(e) =>
                      setSettings({ ...settings, simulationMode: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Tombol Aksi Uji Coba */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Broadcast Test SOS */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <Send className="w-3.5 h-3.5 text-rose-600" />
                      <span>Siarkan Sinyal SOS Uji Coba</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Membuat satu sinyal panggilan darurat demo untuk menguji radar dan sirine posko.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestSos}
                    disabled={isSendingTestSos}
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    {isSendingTestSos ? "Menyiarkan..." : "Kirim SOS Simulasi"}
                  </button>
                </div>

                {/* Ekspor Konfigurasi */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ekspor Berkas Konfigurasi Posko</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Unduh salinan JSON konfigurasi stasiun posko dan parameter radar operasional.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportConfig}
                    className="mt-3 w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shadow-xs"
                  >
                    Unduh File JSON
                  </button>
                </div>

                {/* Hapus Cache SOS */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between sm:col-span-2">
                  <div>
                    <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Bersihkan Cache Sinyal Darurat Lokal</span>
                    </h5>
                    <p className="text-[11px] text-rose-700 leading-snug">
                      Menghapus panggilan darurat simulasi yang tersimpan di browser setelah kegiatan gladi resik selesai.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSosCache}
                    className="mt-3 w-fit py-2 px-4 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors shadow-xs"
                  >
                    Bersihkan Cache Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Integritas Data
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Semua pengaturan disimpan dengan aman pada browser lokal petugas dan dapat dicadangkan kapan saja untuk pergantian shift piket.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
