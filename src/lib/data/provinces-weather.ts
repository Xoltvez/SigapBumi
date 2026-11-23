export interface CityBmkgItem {
  name: string;
  province: string;
  region: "Jawa" | "Sumatera" | "Bali & Nusa Tenggara" | "Kalimantan" | "Sulawesi" | "Maluku & Papua";
  adm4: string;
  lat: number;
  lon: number;
}

// 38 Provinsi Lengkap di Seluruh Indonesia + Wilayah Kunci Lokal (Banyumas/Purwokerto)
export const CITIES_BMKG: CityBmkgItem[] = [
  // --- PULAU JAWA ---
  { name: "Jakarta Pusat", province: "DKI Jakarta", region: "Jawa", adm4: "31.71.01.1001", lat: -6.18, lon: 106.83 },
  { name: "Bandung", province: "Jawa Barat", region: "Jawa", adm4: "32.73.07.1001", lat: -6.91, lon: 107.61 },
  { name: "Semarang", province: "Jawa Tengah", region: "Jawa", adm4: "33.74.06.1001", lat: -6.99, lon: 110.42 },
  { name: "Banyumas / Purwokerto", province: "Jawa Tengah", region: "Jawa", adm4: "33.02.24.1001", lat: -7.45, lon: 109.24 },
  { name: "Yogyakarta", province: "DI Yogyakarta", region: "Jawa", adm4: "34.71.05.1001", lat: -7.80, lon: 110.37 },
  { name: "Surabaya", province: "Jawa Timur", region: "Jawa", adm4: "35.78.08.1001", lat: -7.25, lon: 112.75 },
  { name: "Serang", province: "Banten", region: "Jawa", adm4: "36.73.01.1001", lat: -6.12, lon: 106.15 },

  // --- PULAU SUMATERA ---
  { name: "Banda Aceh", province: "Aceh", region: "Sumatera", adm4: "11.71.01.1001", lat: 5.55, lon: 95.32 },
  { name: "Medan", province: "Sumatera Utara", region: "Sumatera", adm4: "12.71.01.1001", lat: 3.59, lon: 98.67 },
  { name: "Padang", province: "Sumatera Barat", region: "Sumatera", adm4: "13.71.01.1001", lat: -0.95, lon: 100.35 },
  { name: "Pekanbaru", province: "Riau", region: "Sumatera", adm4: "14.71.01.1001", lat: 0.51, lon: 101.45 },
  { name: "Kota Jambi", province: "Jambi", region: "Sumatera", adm4: "15.71.01.1001", lat: -1.61, lon: 103.61 },
  { name: "Palembang", province: "Sumatera Selatan", region: "Sumatera", adm4: "16.71.04.1001", lat: -2.99, lon: 104.75 },
  { name: "Kota Bengkulu", province: "Bengkulu", region: "Sumatera", adm4: "17.71.01.1001", lat: -3.80, lon: 102.26 },
  { name: "Bandar Lampung", province: "Lampung", region: "Sumatera", adm4: "18.71.01.1001", lat: -5.43, lon: 105.26 },
  { name: "Pangkalpinang", province: "Kepulauan Bangka Belitung", region: "Sumatera", adm4: "19.71.01.1001", lat: -2.13, lon: 106.11 },
  { name: "Tanjungpinang", province: "Kepulauan Riau", region: "Sumatera", adm4: "21.72.01.1001", lat: 0.92, lon: 104.45 },

  // --- BALI & NUSA TENGGARA ---
  { name: "Denpasar", province: "Bali", region: "Bali & Nusa Tenggara", adm4: "51.71.01.1001", lat: -8.67, lon: 115.21 },
  { name: "Mataram", province: "Nusa Tenggara Barat", region: "Bali & Nusa Tenggara", adm4: "52.71.01.1001", lat: -8.58, lon: 116.12 },
  { name: "Kupang", province: "Nusa Tenggara Timur", region: "Bali & Nusa Tenggara", adm4: "53.71.01.1001", lat: -10.18, lon: 123.58 },

  // --- PULAU KALIMANTAN ---
  { name: "Pontianak", province: "Kalimantan Barat", region: "Kalimantan", adm4: "61.71.01.1001", lat: -0.02, lon: 109.34 },
  { name: "Palangkaraya", province: "Kalimantan Tengah", region: "Kalimantan", adm4: "62.71.01.1001", lat: -2.21, lon: 113.92 },
  { name: "Banjarmasin / Banjarbaru", province: "Kalimantan Selatan", region: "Kalimantan", adm4: "63.71.01.1001", lat: -3.32, lon: 114.59 },
  { name: "Samarinda", province: "Kalimantan Timur", region: "Kalimantan", adm4: "64.72.01.1001", lat: -0.50, lon: 117.15 },
  { name: "Tanjung Selor / Tarakan", province: "Kalimantan Utara", region: "Kalimantan", adm4: "65.71.01.1001", lat: 3.30, lon: 117.63 },

  // --- PULAU SULAWESI ---
  { name: "Manado", province: "Sulawesi Utara", region: "Sulawesi", adm4: "71.71.01.1001", lat: 1.49, lon: 124.84 },
  { name: "Palu", province: "Sulawesi Tengah", region: "Sulawesi", adm4: "72.71.01.1001", lat: -0.90, lon: 119.87 },
  { name: "Makassar", province: "Sulawesi Selatan", region: "Sulawesi", adm4: "73.71.01.1001", lat: -5.14, lon: 119.43 },
  { name: "Kendari", province: "Sulawesi Tenggara", region: "Sulawesi", adm4: "74.71.01.1001", lat: -3.97, lon: 122.51 },
  { name: "Kota Gorontalo", province: "Gorontalo", region: "Sulawesi", adm4: "75.71.01.1001", lat: 0.54, lon: 123.06 },
  { name: "Mamuju", province: "Sulawesi Barat", region: "Sulawesi", adm4: "76.02.01.1001", lat: -2.67, lon: 118.89 },

  // --- KEPULAUAN MALUKU & PAPUA ---
  { name: "Ambon", province: "Maluku", region: "Maluku & Papua", adm4: "81.71.01.1001", lat: -3.69, lon: 128.18 },
  { name: "Ternate / Sofifi", province: "Maluku Utara", region: "Maluku & Papua", adm4: "82.71.01.1001", lat: 0.79, lon: 127.38 },
  { name: "Jayapura", province: "Papua", region: "Maluku & Papua", adm4: "91.71.01.1001", lat: -2.53, lon: 140.71 },
  { name: "Manokwari", province: "Papua Barat", region: "Maluku & Papua", adm4: "92.02.01.1001", lat: -0.86, lon: 134.06 },
  { name: "Merauke", province: "Papua Selatan", region: "Maluku & Papua", adm4: "93.01.01.1001", lat: -8.49, lon: 140.40 },
  { name: "Nabire", province: "Papua Tengah", region: "Maluku & Papua", adm4: "94.01.01.1001", lat: -3.37, lon: 135.50 },
  { name: "Wamena", province: "Papua Pegunungan", region: "Maluku & Papua", adm4: "95.01.01.1001", lat: -4.09, lon: 138.94 },
  { name: "Sorong", province: "Papua Barat Daya", region: "Maluku & Papua", adm4: "96.71.01.1001", lat: -0.88, lon: 131.25 },
];

export const POPULAR_WEATHER_SHORTCUTS = [
  "31.71.01.1001", // Jakarta Pusat
  "33.02.24.1001", // Banyumas / Purwokerto
  "32.73.07.1001", // Bandung
  "33.74.06.1001", // Semarang
  "34.71.05.1001", // Yogyakarta
  "35.78.08.1001", // Surabaya
  "12.71.01.1001", // Medan
  "16.71.04.1001", // Palembang
  "51.71.01.1001", // Denpasar
  "73.71.01.1001", // Makassar
  "64.72.01.1001", // Samarinda
  "91.71.01.1001", // Jayapura
];
