import { NextResponse } from "next/server";

// Daftar kode adm4 BMKG kota-kota besar di Indonesia dengan koordinat lintang/bujur
export const CITIES_BMKG = [
  { name: "Jakarta Pusat", province: "DKI Jakarta", adm4: "31.71.01.1001", lat: -6.18, lon: 106.83 },
  { name: "Banyumas / Purwokerto", province: "Jawa Tengah", adm4: "33.02.24.1001", lat: -7.45, lon: 109.24 },
  { name: "Surabaya", province: "Jawa Timur", adm4: "35.78.08.1001", lat: -7.25, lon: 112.75 },
  { name: "Bandung", province: "Jawa Barat", adm4: "32.73.07.1001", lat: -6.91, lon: 107.61 },
  { name: "Semarang", province: "Jawa Tengah", adm4: "33.74.06.1001", lat: -6.99, lon: 110.42 },
  { name: "Yogyakarta", province: "DI Yogyakarta", adm4: "34.71.05.1001", lat: -7.80, lon: 110.37 },
  { name: "Medan", province: "Sumatera Utara", adm4: "12.71.01.1001", lat: 3.59, lon: 98.67 },
  { name: "Makassar", province: "Sulawesi Selatan", adm4: "73.71.01.1001", lat: -5.14, lon: 119.43 },
  { name: "Denpasar", province: "Bali", adm4: "51.71.01.1001", lat: -8.67, lon: 115.21 },
  { name: "Palembang", province: "Sumatera Selatan", adm4: "16.71.04.1001", lat: -2.99, lon: 104.75 },
];

function findClosestCity(lat: number, lon: number) {
  let closest = CITIES_BMKG[0];
  let minDist = Infinity;
  for (const c of CITIES_BMKG) {
    const d = Math.hypot(c.lat - lat, c.lon - lon);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }
  return closest;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // 'gempa' | 'cuaca' | 'all'
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  
  let targetAdm4 = searchParams.get("adm4") || "";
  let matchedCity: (typeof CITIES_BMKG)[0] | null = null;

  if (latParam && lngParam) {
    const parsedLat = parseFloat(latParam);
    const parsedLng = parseFloat(lngParam);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      matchedCity = findClosestCity(parsedLat, parsedLng);
      if (!targetAdm4) {
        targetAdm4 = matchedCity.adm4;
      }
    }
  }

  if (!targetAdm4) {
    targetAdm4 = "31.71.01.1001";
  }

  const result: {
    gempaTerkini?: unknown;
    daftarGempa?: unknown[];
    cuaca?: unknown;
    matchedCity?: (typeof CITIES_BMKG)[0] | null;
    cities: typeof CITIES_BMKG;
    updatedAt: string;
    source: string;
  } = {
    cities: CITIES_BMKG,
    matchedCity: matchedCity || CITIES_BMKG.find((c) => c.adm4 === targetAdm4) || CITIES_BMKG[0],
    updatedAt: new Date().toISOString(),
    source: "Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)",
  };

  try {
    // 1. Fetch Gempa Otomatis & Terkini InaTEWS jika dibutuhkan
    if (type === "all" || type === "gempa") {
      try {
        const [autoRes, listRes] = await Promise.all([
          fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", {
            next: { revalidate: 60 },
            headers: { "User-Agent": "SigapBumi-Portal/1.0" },
          }),
          fetch("https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json", {
            next: { revalidate: 60 },
            headers: { "User-Agent": "SigapBumi-Portal/1.0" },
          }),
        ]);

        if (autoRes.ok) {
          const autoJson = await autoRes.json();
          result.gempaTerkini = autoJson?.Infogempa?.gempa || null;
        }

        if (listRes.ok) {
          const listJson = await listRes.json();
          result.daftarGempa = listJson?.Infogempa?.gempa?.slice(0, 10) || [];
        }
      } catch (err) {
        console.warn("[BMKG-API] Gagal mengambil data gempa BMKG:", err);
      }
    }

    // 2. Fetch Prakiraan Cuaca BMKG jika dibutuhkan
    if (type === "all" || type === "cuaca") {
      try {
        const weatherUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(targetAdm4)}`;
        const weatherRes = await fetch(weatherUrl, {
          next: { revalidate: 180 },
          headers: { "User-Agent": "SigapBumi-Portal/1.0" },
        });

        if (weatherRes.ok) {
          const weatherJson = await weatherRes.json();
          result.cuaca = weatherJson || null;
        }
      } catch (err) {
        console.warn("[BMKG-API] Gagal mengambil data cuaca BMKG:", err);
      }
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[BMKG-API] Endpoint error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data resmi BMKG",
        updatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
