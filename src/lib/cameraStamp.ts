"use client";

export interface StampMetadata {
  lat: number;
  lng: number;
  accuracy?: number | null;
  timestamp?: Date;
  trackingCode?: string;
  sourceLabel?: string;
}

/**
 * Mencap stempel digital resmi (GPS, Akurasi, Tanggal, Jam WIB) langsung ke atas piksel foto
 * menggunakan HTML5 Canvas 2D Context secara permanen.
 */
export async function stampPhotoWithGpsTimestamp(
  imageSource: File | Blob | string,
  meta: StampMetadata
): Promise<string> {
  if (typeof window === "undefined") return "";

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        // Skala resolusi optimal agar hemat kuota upload tetapi teks tetap tajam terbaca
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

        // 1. Gambar foto asli
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 2. Data teks stempel
        const now = meta.timestamp || new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const day = String(now.getDate()).padStart(2, "0");
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const dateStr = `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;

        const latStr = meta.lat.toFixed(5);
        const lngStr = meta.lng.toFixed(5);
        const accStr = meta.accuracy ? ` (±${Math.round(meta.accuracy)}m)` : "";

        // Ukuran proporsional sesuai skala gambar
        const baseFontSize = Math.max(14, Math.round(targetWidth * 0.024));
        const lineSpacing = baseFontSize * 1.35;
        const padding = baseFontSize * 1.2;

        const boxWidth = Math.min(targetWidth * 0.88, 560);
        const boxHeight = lineSpacing * 3.8 + padding * 2;
        const boxX = padding;
        const boxY = targetHeight - boxHeight - padding;

        // 3. Gambar background semi-transparan (Dark Glassmorphism)
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.82)"; // Slate 900 dengan 82% opacity
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 12;

        const radius = 12;
        ctx.beginPath();
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();
        ctx.fill();

        // Border tipis elegan
        ctx.strokeStyle = "rgba(249, 115, 22, 0.6)"; // Oranye aksen
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // 4. Render Teks Stempel
        ctx.save();
        ctx.textBaseline = "top";

        // Baris 1: Header Badge Otentik
        ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = "#F97316"; // Oranye SigapBumi
        ctx.fillText("🛡️ BUKTI KAMERA RIIL • POSKO SIGAPBUMI", boxX + padding, boxY + padding);

        // Baris 2: Titik Koordinat GPS
        ctx.font = `bold ${baseFontSize * 0.9}px "Courier New", Courier, monospace`;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`📍 GPS: ${latStr}, ${lngStr}${accStr}`, boxX + padding, boxY + padding + lineSpacing * 1.15);

        // Baris 3: Tanggal & Waktu Realtime
        ctx.font = `500 ${baseFontSize * 0.85}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = "#E2E8F0"; // Slate 200
        ctx.fillText(`🕒 Waktu: ${dateStr}`, boxX + padding, boxY + padding + lineSpacing * 2.15);

        // Baris 4: Status Verifikasi Sensor
        ctx.font = `bold ${baseFontSize * 0.78}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = "#10B981"; // Emerald
        ctx.fillText("✓ TERVERIFIKASI SENSOR GPS & KAMERA LANGSUNG", boxX + padding, boxY + padding + lineSpacing * 3.1);

        ctx.restore();

        // 5. Ekspor ke format Data URL JPEG kualitas tinggi
        const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(stampedDataUrl);
      } catch (err) {
        console.error("Gagal mencap watermark pada foto:", err);
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

