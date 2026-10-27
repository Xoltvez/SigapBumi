/**
 * Utility untuk konversi geospasial PostGIS EWKB (Extended Well-Known Binary)
 * dan format koordinat lainnya ke lat/lng numerik.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Mem-parsing string EWKB hex PostGIS (SRID 4326 Point)
 * Contoh: "0101000020E610000083C0CAA145AE5A401F85EB51B89E18C0"
 */
export function parsePostGISPoint(location: unknown): LatLng | null {
  if (!location) return null;

  // Jika sudah berupa objek { lat, lng }
  if (
    typeof location === "object" &&
    location !== null &&
    "lat" in location &&
    "lng" in location
  ) {
    const obj = location as { lat: number; lng: number };
    return { lat: Number(obj.lat), lng: Number(obj.lng) };
  }

  // Jika berupa GeoJSON Point { type: "Point", coordinates: [lng, lat] }
  if (
    typeof location === "object" &&
    location !== null &&
    "coordinates" in location &&
    Array.isArray((location as { coordinates: unknown[] }).coordinates)
  ) {
    const coords = (location as { coordinates: number[] }).coordinates;
    if (coords.length >= 2) {
      return { lng: coords[0], lat: coords[1] };
    }
  }

  if (typeof location !== "string") return null;

  const str = location.trim();

  // Format WKT: "POINT(106.723 -6.155)"
  const wktMatch = str.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (wktMatch) {
    const lng = parseFloat(wktMatch[1]);
    const lat = parseFloat(wktMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Format PostGIS EWKB Hexadecimal (Point dengan SRID: 25 byte = 50 karakter hex)
  // Byte 0: byte order (01 = Little Endian)
  // Byte 1-4: type (01000020 = Point with SRID flag)
  // Byte 5-8: SRID (E6100000 = 4326)
  // Byte 9-16: X (longitude) - 8 bytes double LE
  // Byte 17-24: Y (latitude) - 8 bytes double LE
  if (/^[0-9a-fA-F]{50}$/.test(str)) {
    try {
      const buffer = new Uint8Array(25);
      for (let i = 0; i < 25; i++) {
        buffer[i] = parseInt(str.substr(i * 2, 2), 16);
      }
      const view = new DataView(buffer.buffer);
      const isLittleEndian = buffer[0] === 1;
      const lng = view.getFloat64(9, isLittleEndian);
      const lat = view.getFloat64(17, isLittleEndian);

      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat: Math.round(lat * 1000000) / 1000000,
          lng: Math.round(lng * 1000000) / 1000000,
        };
      }
    } catch {
      // Abaikan jika gagal decode hex
    }
  }

  // Format "lat, lng" atau "-6.155, 106.723"
  const commaMatch = str.match(/([-\d.]+)\s*,\s*([-\d.]+)/);
  if (commaMatch) {
    const val1 = parseFloat(commaMatch[1]);
    const val2 = parseFloat(commaMatch[2]);
    // Asumsikan wilayah Indonesia: lat antara -11 s.d 6, lng antara 95 s.d 141
    if (val1 >= -15 && val1 <= 15 && val2 >= 90 && val2 <= 145) {
      return { lat: val1, lng: val2 };
    }
    if (val2 >= -15 && val2 <= 15 && val1 >= 90 && val1 <= 145) {
      return { lat: val2, lng: val1 };
    }
  }

  return null;
}
