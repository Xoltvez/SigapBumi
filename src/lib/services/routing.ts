/**
 * Service Navigasi Rute Lapangan OSRM (Open Source Routing Machine)
 * Menyediakan kalkulasi rute jalan raya riil, jarak tempuh (km), dan estimasi waktu berkendara (menit).
 * 100% Gratis, tanpa API Key, resmi OpenStreetMap.
 */

export interface RouteResult {
  coordinates: [number, number][]; // Array [lat, lng] untuk Leaflet polyline
  distanceKm: number;
  distanceFormatted: string; // Contoh: "14.2 km" atau "750 m"
  durationMinutes: number;
  durationFormatted: string; // Contoh: "~24 Menit" atau "~1 Jam 15 Menit"
  summary: string;
  isFallbackDirect?: boolean;
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

export async function calculateRoute(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // Panggil OSRM Public Driving Routing Service (OpenStreetMap)
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

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

        return {
          coordinates: leafletCoords,
          distanceKm: Number(distanceKm.toFixed(1)),
          distanceFormatted,
          durationMinutes: totalMinutes,
          durationFormatted,
          summary: "Rute Tercepat via Jaringan Jalan Arteri",
          isFallbackDirect: false,
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

  return {
    coordinates: directCoords,
    distanceKm: Number(estimatedRoadKm.toFixed(1)),
    distanceFormatted,
    durationMinutes: estimatedMinutes,
    durationFormatted,
    summary: "Estimasi Garis Pandu Tanggap Darurat",
    isFallbackDirect: true,
  };
}
