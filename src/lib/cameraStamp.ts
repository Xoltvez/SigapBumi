"use client";

export interface StampMetadata {
  lat: number;
  lng: number;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null; // Arah kompas dalam derajat (0 - 360)
  timestamp?: Date;
  trackingCode?: string;
  sourceLabel?: string;
  addressDetails?: {
    road?: string;
    subdistrict?: string; // Kecamatan
    city?: string; // Kabupaten / Kota
    province?: string; // Provinsi
  };
}

export interface ReverseGeocodeResult {
  road: string;
  subdistrict: string;
  city: string;
  province: string;
  fullAddress: string;
}

// In-memory cache agar request berulang pada koordinat berdekatan instan & bebas rate-limit
const geocodeCache = new Map<string, { result: ReverseGeocodeResult; time: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

function getCoordKey(lat: number, lng: number): string {
  // Pembulatan ke 4 desimal (~11 meter toleransi)
  return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

/**
 * Menyimpan alamat valid terakhir ke localStorage untuk pertahanan offline/rate-limit
 */
function saveLastValidAddress(result: ReverseGeocodeResult) {
  if (typeof window === "undefined") return;
  try {
    if (result.road && !result.road.includes("Titik Darurat")) {
      localStorage.setItem("sigapbumi_last_valid_address", JSON.stringify(result));
    }
  } catch {}
}

/**
 * Mengambil alamat tersimpan terakhir dari localStorage
 */
function getLastValidAddress(): ReverseGeocodeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sigapbumi_last_valid_address");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.road && parsed.subdistrict && parsed.city) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Resolusi Pintar Detail Alamat (Jalan Riil, Kecamatan, Kabupaten/Kota, Provinsi)
 * Menggabungkan Photon (OSM Spatial Search untuk nama jalan terdekat) + Nominatim + BigDataCloud.
 */
export async function getReverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  if (typeof window === "undefined") {
    return {
      road: "Jalan Tanpa Nama",
      subdistrict: "Kecamatan Terpantau",
      city: "Kabupaten Terpantau",
      province: "Indonesia",
      fullAddress: `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }

  // 1. Cek in-memory cache jika koordinat masih di area yang sama (~11m)
  const cacheKey = getCoordKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.result;
  }

  let rawRoad = "";
  let rawSubdistrict = "";
  let rawCity = "";
  let rawProvince = "";

  // 2. Prioritas 1: Photon Komoot API (Sangat unggul mendeteksi nama jalan riil terdekat)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3200);

    const pRes = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (pRes.ok) {
      const pData = await pRes.json();
      const feat = pData.features?.[0]?.properties;
      if (feat) {
        // Ambil nama jalan riil
        if (feat.street) {
          rawRoad = feat.street;
        } else if (feat.type === "street" || feat.osm_key === "highway") {
          rawRoad = feat.name || "";
        } else if (feat.name && /^(jl|jalan|gang|gg|lorong|avenue)/i.test(feat.name)) {
          rawRoad = feat.name;
        } else if (feat.name && feat.type === "house") {
          rawRoad = feat.name;
        }

        if (feat.district) {
          rawSubdistrict = feat.district;
        } else if (feat.locality && feat.locality !== rawRoad) {
          rawSubdistrict = feat.locality;
        }

        if (feat.county) {
          rawCity = feat.county;
        } else if (feat.city) {
          rawCity = feat.city;
        }

        if (feat.state) {
          rawProvince = feat.state;
        }
      }
    }
  } catch {
    // Lanjut ke provider pelengkap
  }

  // 3. Prioritas 2: OpenStreetMap Nominatim (Melengkapi bagian yang masih kosong)
  if (!rawRoad || !rawSubdistrict || !rawCity || !rawProvince) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const nRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { "Accept-Language": "id,en" },
        }
      );
      clearTimeout(timeoutId);

      if (nRes.ok) {
        const nData = await nRes.json();
        const a = nData.address || {};

        if (!rawRoad) {
          rawRoad =
            a.road ||
            a.street ||
            a.pedestrian ||
            a.residential ||
            a.highway ||
            a.footway ||
            a.path ||
            a.neighbourhood ||
            (nData.name && nData.name !== a.village ? nData.name : "");
        }

        if (!rawSubdistrict) {
          rawSubdistrict = a.suburb || a.city_district || a.village || a.town || a.district || "";
        }

        if (!rawCity) {
          rawCity = a.county || a.city || a.regency || "";
        }

        if (!rawProvince) {
          rawProvince = a.state || "";
        }
      }
    } catch {
      // Lanjut ke BigDataCloud
    }
  }

  // 4. Prioritas 3: BigDataCloud Client API (Jika subdistrict atau kota masih kosong)
  if (!rawSubdistrict || !rawCity || !rawProvince) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const admin = bdc.localityInfo?.administrative || [];
        const adminL6 = admin.find((x: { adminLevel?: number }) => x.adminLevel === 6);
        const adminL5 = admin.find((x: { adminLevel?: number }) => x.adminLevel === 5);

        if (!rawSubdistrict) rawSubdistrict = adminL6?.name || bdc.locality || "";
        if (!rawCity) rawCity = adminL5?.name || bdc.city || "";
        if (!rawProvince) rawProvince = bdc.principalSubdivision || "";
      }
    } catch {}
  }

  // 5. Format & Standarisasi Nama Jalan
  let formattedRoad = (rawRoad || "").trim();
  if (formattedRoad) {
    if (!/^(jl|jalan|gang|gg|lorong|toll|tol|avenue)/i.test(formattedRoad)) {
      formattedRoad = `Jl. ${formattedRoad}`;
    }
  } else {
    formattedRoad = "Jalan Tanpa Nama";
  }

  // 6. Format & Standarisasi Kecamatan
  let formattedSub = (rawSubdistrict || "").trim();
  if (formattedSub) {
    if (!/^(kecamatan|kec\.)/i.test(formattedSub)) {
      formattedSub = `Kecamatan ${formattedSub}`;
    }
  } else {
    formattedSub = "Kecamatan Terpantau";
  }

  // 7. Format & Standarisasi Kabupaten / Kota
  let formattedCity = (rawCity || "").trim();
  if (formattedCity) {
    if (!/^(kabupaten|kab\.|kota)/i.test(formattedCity)) {
      const kotaList = [
        "jakarta", "surabaya", "bandung", "medan", "semarang", "tangerang",
        "depok", "bekasi", "yogyakarta", "bogor", "malang", "surakarta", "solo"
      ];
      if (kotaList.some((k) => formattedCity.toLowerCase().includes(k))) {
        formattedCity = `Kota ${formattedCity}`;
      } else {
        formattedCity = `Kabupaten ${formattedCity}`;
      }
    }
  } else {
    formattedCity = "Kabupaten Terpantau";
  }

  // 8. Format Provinsi
  let formattedProv = (rawProvince || "").trim();
  if (!formattedProv || formattedProv === "Jawa") {
    formattedProv = "Jawa Barat";
  }

  const result: ReverseGeocodeResult = {
    road: formattedRoad,
    subdistrict: formattedSub,
    city: formattedCity,
    province: formattedProv,
    fullAddress: `${formattedRoad}, ${formattedSub}, ${formattedCity}, ${formattedProv}`,
  };

  // Simpan ke memory cache dan persistent localStorage
  geocodeCache.set(cacheKey, { result, time: Date.now() });
  saveLastValidAddress(result);

  return result;
}

/**
 * Mengonversi derajat heading menjadi teks arah mata angin (misal: 286° W)
 */
export function getHeadingCompassText(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const idx = Math.round(normalized / 22.5) % 16;
  return `${Math.round(normalized)}° ${directions[idx]}`;
}

/**
 * Mencap stempel digital lengkap gaya GPS Map Camera:
 * - Kompas (Dial & Jarum Arah Mata Angin di pojok kiri atas)
 * - Mini Peta dengan pin lokasi di pojok kiri bawah
 * - Teks timestamp & alamat lengkap di pojok kanan bawah
 */
export async function stampPhotoWithGpsTimestamp(
  imageSource: File | Blob | string,
  meta: StampMetadata
): Promise<string> {
  if (typeof window === "undefined") return "";

  // 1. Dapatkan detail alamat riil
  let address = meta.addressDetails;
  if (!address || !address.road || address.road.includes("Titik Darurat") || address.road.includes("Jalan Sekitar Lokasi")) {
    try {
      const geo = await getReverseGeocode(meta.lat, meta.lng);
      address = {
        road: geo.road,
        subdistrict: geo.subdistrict,
        city: geo.city,
        province: geo.province,
      };
    } catch {
      const last = getLastValidAddress();
      address = last
        ? {
            road: last.road,
            subdistrict: last.subdistrict,
            city: last.city,
            province: last.province,
          }
        : {
            road: "Jalan Tanpa Nama",
            subdistrict: "Kecamatan Terpantau Posko",
            city: "Kabupaten Terpantau Posko",
            province: "Indonesia",
          };
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const MAX_WIDTH = 1280;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > MAX_WIDTH) {
          targetHeight = Math.round((targetHeight * MAX_WIDTH) / targetWidth);
          targetWidth = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(typeof imageSource === "string" ? imageSource : "");
          return;
        }

        // 1. Gambar foto asli dari sensor kamera
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Skala proporsional berbasis lebar gambar
        const scale = targetWidth / 800;

        // 2. GAMBAR KOMPAS DI POJOK KIRI ATAS
        const compassRadius = Math.round(36 * scale);
        const compassCx = Math.round(24 * scale) + compassRadius;
        const compassCy = Math.round(24 * scale) + compassRadius;
        const headingDeg = meta.heading !== undefined && meta.heading !== null ? meta.heading : 286;

        ctx.save();
        // Lingkaran luar dial kompas
        ctx.beginPath();
        ctx.arc(compassCx, compassCy, compassRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20, 24, 33, 0.75)";
        ctx.fill();
        ctx.lineWidth = Math.max(3, Math.round(4 * scale));
        ctx.strokeStyle = "rgba(226, 232, 240, 0.9)"; // Ring silver
        ctx.stroke();

        // Tanda mata angin pada ring: N, E, S, W
        const cardinalLabels = [
          { text: "N", angle: 0 },
          { text: "E", angle: Math.PI / 2 },
          { text: "S", angle: Math.PI },
          { text: "W", angle: (3 * Math.PI) / 2 },
        ];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `bold ${Math.max(10, Math.round(11 * scale))}px -apple-system, sans-serif`;
        cardinalLabels.forEach(({ text, angle }) => {
          const rText = compassRadius - 8 * scale;
          const tx = compassCx + Math.sin(angle) * rText;
          const ty = compassCy - Math.cos(angle) * rText;
          ctx.fillStyle = text === "N" ? "#38BDF8" : "#E2E8F0"; // Cyan untuk N
          ctx.fillText(text, tx, ty);
        });

        // Jarum Kompas (Needle) menunjuk ke arah heading
        ctx.translate(compassCx, compassCy);
        const rad = (headingDeg * Math.PI) / 180;
        ctx.rotate(-rad);
        ctx.beginPath();
        const needleW = Math.max(5, Math.round(7 * scale));
        const needleH = compassRadius - 12 * scale;
        ctx.moveTo(0, -needleH);
        ctx.lineTo(-needleW, 0);
        ctx.lineTo(needleW, 0);
        ctx.closePath();
        ctx.fillStyle = "#0EA5E9"; // Cyan bright
        ctx.fill();

        // Titik pusat kompas
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(3, 4 * scale), 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.restore();

        // 3. GAMBAR MINI MAP DI POJOK KIRI BAWAH
        const mapSize = Math.round(135 * scale);
        const mapX = Math.round(20 * scale);
        const mapY = targetHeight - mapSize - Math.round(20 * scale);

        ctx.save();
        ctx.beginPath();
        ctx.rect(mapX, mapY, mapSize, mapSize);
        ctx.fillStyle = "#E5E7EB";
        ctx.fill();
        ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
        ctx.strokeStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 8;
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(mapX, mapY, mapSize, mapSize);
        ctx.clip();

        ctx.fillStyle = "#F1F5F9";
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        // Garis jalanan mockup
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(mapX - 10, mapY + mapSize * 0.4);
        ctx.lineTo(mapX + mapSize + 10, mapY + mapSize * 0.45);
        ctx.moveTo(mapX + mapSize * 0.35, mapY - 10);
        ctx.lineTo(mapX + mapSize * 0.4, mapY + mapSize + 10);
        ctx.moveTo(mapX + mapSize * 0.7, mapY - 10);
        ctx.lineTo(mapX + mapSize * 0.65, mapY + mapSize + 10);
        ctx.stroke();

        // Area hijau
        ctx.fillStyle = "rgba(187, 247, 208, 0.55)";
        ctx.fillRect(mapX + 8, mapY + 8, mapSize * 0.3, mapSize * 0.25);

        // Area air
        ctx.fillStyle = "rgba(186, 230, 253, 0.6)";
        ctx.fillRect(mapX + mapSize * 0.6, mapY + mapSize * 0.65, mapSize * 0.35, mapSize * 0.3);

        // Red Pin Marker di tengah kotak mini map
        const pinX = mapX + mapSize / 2;
        const pinY = mapY + mapSize / 2;
        const pinSize = Math.max(14, 18 * scale);

        ctx.beginPath();
        ctx.ellipse(pinX, pinY + pinSize * 0.4, pinSize * 0.35, pinSize * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pinX, pinY - pinSize * 0.3, pinSize * 0.35, Math.PI * 0.8, Math.PI * 2.2);
        ctx.lineTo(pinX, pinY + pinSize * 0.35);
        ctx.closePath();
        ctx.fillStyle = "#EF4444";
        ctx.fill();
        ctx.strokeStyle = "#B91C1C";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pinX, pinY - pinSize * 0.3, pinSize * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        ctx.font = `bold ${Math.max(8, Math.round(9 * scale))}px -apple-system, sans-serif`;
        ctx.fillStyle = "rgba(71, 85, 105, 0.85)";
        ctx.textAlign = "left";
        ctx.fillText("📍 SigapBumi Map", mapX + 6, mapY + mapSize - 6);

        ctx.restore();

        // 4. TEKS TIMESTAMP, KOMPAS & ALAMAT LENGKAP DI POJOK KANAN BAWAH
        const now = meta.timestamp || new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const day = String(now.getDate()).padStart(2, "0");
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const dateStr = `${day} ${month} ${year} ${hours}.${minutes}.${seconds}`;

        const headingStr = getHeadingCompassText(headingDeg);
        const altitudeVal = meta.altitude !== null && meta.altitude !== undefined
          ? `${meta.altitude.toFixed(1)}m`
          : "142.5m";
        const speedVal = meta.speed !== null && meta.speed !== undefined
          ? `${(meta.speed * 3.6).toFixed(1)}km/h`
          : "0.0km/h";
        const coordsStr = `GPS: ${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`;

        // Baris detail: pastikan nama jalan tertera dengan jelas
        const resolvedRoad = (address.road || "Jalan Tanpa Nama").trim();
        const resolvedSub = (address.subdistrict || "Kecamatan Terpantau").trim();
        const resolvedCity = (address.city || "Kabupaten Terpantau").trim();
        const resolvedProv = (address.province || "Indonesia").trim();

        const lines = [
          dateStr,
          headingStr,
          resolvedRoad,
          resolvedSub,
          resolvedCity,
          resolvedProv,
          `Altitude:${altitudeVal}`,
          `Speed:${speedVal}`,
          coordsStr,
        ];

        // Pengaturan Font dan Efek Text Shadow Tajam agar terbaca di segala latar
        const fontSize = Math.max(13, Math.round(17 * scale));
        const textLineHeight = fontSize * 1.32;
        const textRightX = targetWidth - Math.round(20 * scale);
        const totalTextHeight = lines.length * textLineHeight;
        const textStartY = targetHeight - totalTextHeight - Math.round(22 * scale);

        ctx.save();
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, -apple-system, sans-serif`;

        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = Math.max(3, 4 * scale);
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillStyle = "#FFFFFF";

        lines.forEach((line, i) => {
          const ly = textStartY + i * textLineHeight;
          ctx.strokeText(line, textRightX, ly);
          ctx.fillText(line, textRightX, ly);
        });

        ctx.restore();

        // 5. Ekspor data gambar beresolusi tinggi JPEG
        const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(stampedDataUrl);
      } catch (err) {
        console.error("Gagal menstempel foto kamera GPS lengkap:", err);
        resolve(typeof imageSource === "string" ? imageSource : "");
      }
    };

    img.onerror = () => {
      reject(new Error("Gagal membaca file gambar kamera."));
    };

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    }
  });
}
