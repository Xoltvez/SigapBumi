/**
 * Service Navigasi Rute Lapangan OSRM (Open Source Routing Machine)
 * Menyediakan kalkulasi rute jalan raya riil, jarak tempuh (km), dan estimasi waktu berkendara (menit).
 * 100% Gratis, tanpa API Key, resmi OpenStreetMap.
 */

export interface RouteStep {
  instruction: string; // Contoh: "Menuju Jalan Penghubung" atau "Belok Kanan ke Jl. Pantura"
  distanceFormatted: string; // Contoh: "83 m" atau "1.2 km"
  distanceMeters: number;
  modifier?: string; // "straight", "left", "right", "slight right", dll.
  type?: string; // "depart", "turn", "new name", "arrive"
}

export interface RouteResult {
  coordinates: [number, number][]; // Array [lat, lng] untuk Leaflet polyline
  distanceKm: number;
  distanceFormatted: string; // Contoh: "37.5 km" atau "750 m"
  durationMinutes: number;
  durationFormatted: string; // Contoh: "~49 Menit" atau "~1 Jam 25 Menit"
  durationFormattedShort: string; // Contoh: "49" (untuk "49 mnt")
  arrivalTimeFormatted: string; // Contoh: "Tiba pukul 00.38"
  summary: string;
  isFallbackDirect?: boolean;
  steps: RouteStep[];
}

// Rumus Haversine untuk kalkulasi jarak darat cadangan
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper format waktu tiba (contoh: "Tiba pukul 00.38")
function calculateArrivalTime(durationMinutes: number): string {
  const now = new Date();
  const arrival = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const hh = String(arrival.getHours()).padStart(2, "0");
  const mm = String(arrival.getMinutes()).padStart(2, "0");
  return `Tiba pukul ${hh}.${mm}`;
}

// Helper menerjemahkan manuver OSRM ke Bahasa Indonesia yang ramah navigasi
function formatStepInstruction(
  type: string = "",
  modifier: string = "",
  name: string = ""
): string {
  const roadName = name.trim() ? name.trim() : "Jalan Penghubung";

  if (type === "depart") {
    return `Menuju ${roadName}`;
  }
  if (type === "arrive") {
    return `Tiba di Titik Tujuan (${roadName})`;
  }

  const mod = modifier.toLowerCase();
  if (mod.includes("sharp left")) {
    return `Belok tajam ke kiri ke ${roadName}`;
  }
  if (mod.includes("slight left")) {
    return `Sedikit belok ke kiri ke ${roadName}`;
  }
  if (mod.includes("left")) {
    return `Belok kiri ke ${roadName}`;
  }
  if (mod.includes("sharp right")) {
    return `Belok tajam ke kanan ke ${roadName}`;
  }
  if (mod.includes("slight right")) {
    return `Sedikit belok ke kanan ke ${roadName}`;
  }
  if (mod.includes("right")) {
    return `Belok kanan ke ${roadName}`;
  }
  if (mod.includes("uturn")) {
    return `Putar balik di ${roadName}`;
  }
  return `Terus lurus di ${roadName}`;
}

export async function calculateRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    // Panggil OSRM Public Driving Routing Service dengan rincian belokan (&steps=true)
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceMeters = Number(route.distance) || 0;
        const durationSeconds = Number(route.duration) || 0;

        // OSRM mengembalikan koordinat GeoJSON [lng, lat], balik ke format Leaflet [lat, lng]
        const rawCoords: [number, number][] = route.geometry.coordinates || [];
        const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [
          lat,
          lng,
        ]);

        const distanceKm = distanceMeters / 1000;
        const distanceFormatted =
          distanceMeters < 1000
            ? `${Math.round(distanceMeters)} m`
            : `${distanceKm.toFixed(1)} km`;

        const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
        const durationFormatted =
          totalMinutes >= 60
            ? `~${Math.floor(totalMinutes / 60)} Jam ${totalMinutes % 60} Menit`
            : `~${totalMinutes} Menit`;

        // Parse OSRM Steps untuk navigasi langsung
        const rawSteps = route.legs?.[0]?.steps || [];
        const steps: RouteStep[] = rawSteps.map(
          (st: {
            distance?: number;
            maneuver?: { type?: string; modifier?: string };
            name?: string;
          }) => {
            const stDist = Number(st.distance) || 0;
            const distFmt =
              stDist < 1000
                ? `${Math.round(stDist)} m`
                : `${(stDist / 1000).toFixed(1)} km`;
            return {
              instruction: formatStepInstruction(
                st.maneuver?.type,
                st.maneuver?.modifier,
                st.name
              ),
              distanceFormatted: distFmt,
              distanceMeters: Math.round(stDist),
              modifier: st.maneuver?.modifier || "straight",
              type: st.maneuver?.type || "turn",
            };
          }
        );

        // Jika steps kosong, sediakan step awal default
        if (steps.length === 0) {
          steps.push({
            instruction: "Menuju Jalan Penghubung",
            distanceFormatted: distanceFormatted,
            distanceMeters: Math.round(distanceMeters),
            modifier: "straight",
            type: "depart",
          });
        }

        return {
          coordinates: leafletCoords,
          distanceKm: Number(distanceKm.toFixed(1)),
          distanceFormatted,
          durationMinutes: totalMinutes,
          durationFormatted,
          durationFormattedShort: String(totalMinutes),
          arrivalTimeFormatted: calculateArrivalTime(totalMinutes),
          summary: "Rute Tercepat via Jaringan Jalan Arteri",
          isFallbackDirect: false,
          steps,
        };
      }
    }
  } catch (err) {
    console.warn("OSRM routing timeout/error, beralih ke estimasi terkalibrasi:", err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback Terkalibrasi (Jika rute offline atau antar-pulau)
  const straightKm = calculateHaversineDistance(
    startLat,
    startLng,
    destLat,
    destLng
  );
  // Faktor kelokan jalan darat riil di Indonesia ~1.32x
  const estimatedRoadKm = Math.max(0.5, straightKm * 1.32);
  // Kecepatan rata-rata kendaraan tanggap darurat (Sirene Siaga): 45 km/jam
  const estimatedMinutes = Math.max(1, Math.round((estimatedRoadKm / 45) * 60));

  const distanceFormatted =
    estimatedRoadKm < 1
      ? `${Math.round(estimatedRoadKm * 1000)} m`
      : `${estimatedRoadKm.toFixed(1)} km`;

  const durationFormatted =
    estimatedMinutes >= 60
      ? `~${Math.floor(estimatedMinutes / 60)} Jam ${estimatedMinutes % 60} Menit`
      : `~${estimatedMinutes} Menit`;

  // Buat garis lurus bergradien 2 titik
  const directCoords: [number, number][] = [
    [startLat, startLng],
    [destLat, destLng],
  ];

  const fallbackSteps: RouteStep[] = [
    {
      instruction: "Menuju Jalan Penghubung",
      distanceFormatted: "100 m",
      distanceMeters: 100,
      modifier: "straight",
      type: "depart",
    },
    {
      instruction: "Lurus menuju Titik Kejadian Bencana",
      distanceFormatted: distanceFormatted,
      distanceMeters: Math.round(estimatedRoadKm * 1000),
      modifier: "straight",
      type: "arrive",
    },
  ];

  return {
    coordinates: directCoords,
    distanceKm: Number(estimatedRoadKm.toFixed(1)),
    distanceFormatted,
    durationMinutes: estimatedMinutes,
    durationFormatted,
    durationFormattedShort: String(estimatedMinutes),
    arrivalTimeFormatted: calculateArrivalTime(estimatedMinutes),
    summary: "Estimasi Garis Pandu Tanggap Darurat",
    isFallbackDirect: true,
    steps: fallbackSteps,
  };
}
