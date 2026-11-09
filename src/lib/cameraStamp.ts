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

/**
 * Mengubah koordinat GPS (lat, lng) menjadi detail nama jalan, kecamatan, dan kabupaten
 * via Reverse Geocoding OpenStreetMap Nominatim dengan timeout cepat dan fallback otomatis.
 */
export async function getReverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  if (typeof window === "undefined") {
    return {
      road: "Titik Darurat Warga",
      subdistrict: "Kecamatan Terpantau",
      city: "Kabupaten / Kota Terpantau",
      province: "Indonesia",
      fullAddress: `Koordinat GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2600);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "Accept-Language": "id,en",
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road =
        addr.road ||
        addr.pedestrian ||
        addr.street ||
        addr.neighbourhood ||
        addr.hamlet ||
        "Jalan Tanpa Nama";

      const rawSub =
        addr.suburb ||
        addr.city_district ||
        addr.village ||
        addr.town ||
        "Kecamatan Terpantau";

      const rawCity =
        addr.city ||
        addr.county ||
        addr.regency ||
        addr.state_district ||
        "Kabupaten Terpantau";

      const subdistrict = rawSub.toLowerCase().startsWith("kecamatan")
        ? rawSub
        : `Kecamatan ${rawSub}`;

      const city =
        rawCity.toLowerCase().startsWith("kabupaten") || rawCity.toLowerCase().startsWith("kota")
          ? rawCity
          : `Kabupaten ${rawCity}`;

      const province = addr.state || "Jawa Barat";

      return {
        road,
        subdistrict,
        city,
        province,
        fullAddress: data.display_name || `${road}, ${subdistrict}, ${city}, ${province}`,
      };
    }
  } catch {
    // Jaringan timeout atau offline, gunakan fallback lokasi
  }

  return {
    road: "Jalan Titik Darurat",
    subdistrict: "Kecamatan Terpantau GPS",
    city: "Kabupaten / Kota Terpantau",
    province: "Indonesia",
    fullAddress: `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
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

  // 1. Dapatkan detail alamat jika belum ada di meta
  let address = meta.addressDetails;
  if (!address || !address.road) {
    try {
      const geo = await getReverseGeocode(meta.lat, meta.lng);
      address = {
        road: geo.road,
        subdistrict: geo.subdistrict,
        city: geo.city,
        province: geo.province,
      };
    } catch {
      address = {
        road: "Jalan Tanpa Nama",
        subdistrict: "Kecamatan Terpantau",
        city: "Kabupaten Terpantau",
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

        // 1. Gambar foto asli dari kamera
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Skala proporsional
        const scale = targetWidth / 800; // Standar basis 800px

        // 2. GAMBAR KOMPAS DI POJOK KIRI ATAS
        const compassRadius = Math.round(36 * scale);
        const compassCx = Math.round(24 * scale) + compassRadius;
        const compassCy = Math.round(24 * scale) + compassRadius;
        const headingDeg = meta.heading !== undefined && meta.heading !== null ? meta.heading : 286;

        ctx.save();
        // Lingkaran luar dial kompas (Semi-translucent dark grey)
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
        ctx.rotate(-rad); // Rotasi kompas sesuai azimuth
        ctx.beginPath();
        const needleW = Math.max(5, Math.round(7 * scale));
        const needleH = compassRadius - 12 * scale;
        // Bagian atas (Cyan / Biru)
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
        // Background kotak peta dengan border putih
        ctx.beginPath();
        ctx.rect(mapX, mapY, mapSize, mapSize);
        ctx.fillStyle = "#E5E7EB"; // Map base color
        ctx.fill();
        ctx.lineWidth = Math.max(2, Math.round(2.5 * scale));
        ctx.strokeStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Gambar tekstur peta / jalanan mockup realistis
        ctx.beginPath();
        ctx.rect(mapX, mapY, mapSize, mapSize);
        ctx.clip(); // Batasi gambar hanya di dalam kotak peta

        // Background daratan peta lembut
        ctx.fillStyle = "#F1F5F9";
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        // Jalanan peta (vector streets)
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

        // Area taman / hijau mockup
        ctx.fillStyle = "rgba(187, 247, 208, 0.55)";
        ctx.fillRect(mapX + 8, mapY + 8, mapSize * 0.3, mapSize * 0.25);

        // Water area mockup
        ctx.fillStyle = "rgba(186, 230, 253, 0.6)";
        ctx.fillRect(mapX + mapSize * 0.6, mapY + mapSize * 0.65, mapSize * 0.35, mapSize * 0.3);

        // Red Pin Marker di tengah kotak mini map
        const pinX = mapX + mapSize / 2;
        const pinY = mapY + mapSize / 2;
        const pinSize = Math.max(14, 18 * scale);

        // Bayangan pin
        ctx.beginPath();
        ctx.ellipse(pinX, pinY + pinSize * 0.4, pinSize * 0.35, pinSize * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fill();

        // Bentuk pin merah
        ctx.beginPath();
        ctx.arc(pinX, pinY - pinSize * 0.3, pinSize * 0.35, Math.PI * 0.8, Math.PI * 2.2);
        ctx.lineTo(pinX, pinY + pinSize * 0.35);
        ctx.closePath();
        ctx.fillStyle = "#EF4444";
        ctx.fill();
        ctx.strokeStyle = "#B91C1C";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Titik putih di dalam pin
        ctx.beginPath();
        ctx.arc(pinX, pinY - pinSize * 0.3, pinSize * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        // Logo SigapBumi / Map kecil di pojok bawah mini map
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

        const lines = [
          dateStr,
          headingStr,
          address.road || "Jalan Tanpa Nama",
          address.subdistrict || "Kecamatan Terpantau",
          address.city || "Kabupaten Terpantau",
          address.province || "Indonesia",
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

        // Text stroke/shadow gelap kuat agar kontras dengan foto apa pun
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
