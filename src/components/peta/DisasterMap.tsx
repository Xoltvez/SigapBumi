"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  MapPin,
  ExternalLink,
  LocateFixed,
} from "lucide-react";
import type { DisasterType, ReportStatus } from "@/types";

export interface MapPoint {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  created_at: string;
  confirmation_count: number;
  is_sos?: boolean;
}

interface DisasterMapProps {
  points: MapPoint[];
  selectedPointId?: string;
  onSelectPoint?: (point: MapPoint) => void;
}

// Custom DivIcon generator based on status and SOS
function createPinIcon(status: ReportStatus, isSos: boolean = false) {
  let bgColor = "#2563EB"; // info default

  if (isSos) {
    bgColor = "#DC2626"; // danger
    return L.divIcon({
      className: "custom-sos-pin",
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background-color: #DC2626; border: 2px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">SOS</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }

  if (status === "diverifikasi") bgColor = "#1D4ED8";
  if (status === "ditindaklanjuti") bgColor = "#F59E0B";
  if (status === "selesai") bgColor = "#16A34A";
  if (status === "ditolak") bgColor = "#DC2626";

  return L.divIcon({
    className: "custom-disaster-pin",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; border-radius: 50% 50% 50% 0; background-color: ${bgColor}; transform: rotate(-45deg); border: 2px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function LocateUserButton() {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 13);
    });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: "70px", marginRight: "10px" }}>
      <div className="leaflet-bar">
        <button
          type="button"
          onClick={handleLocate}
          title="Pusatkan ke lokasi saya"
          aria-label="Pusatkan ke lokasi saya"
          className="w-9 h-9 bg-surface hover:bg-bg flex items-center justify-center text-ink rounded shadow-sm border border-line"
        >
          <LocateFixed className="w-5 h-5 text-ink-soft" />
        </button>
      </div>
    </div>
  );
}

export default function DisasterMap({
  points,
  onSelectPoint,
}: DisasterMapProps) {
  // Center coordinates around Jabodetabek & West Java default
  const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Jakarta
  const defaultZoom = 11;

  useEffect(() => {
    // Injects ping animation styles if not already present
    const styleId = "custom-pin-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] relative rounded-lg overflow-hidden border border-line shadow-card">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* OpenStreetMap Tile Layer with Required Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocateUserButton />

        {/* Markers */}
        {points.map((pt) => (
          <Marker
            key={pt.id}
            position={[pt.lat, pt.lng]}
            icon={createPinIcon(pt.status, pt.is_sos)}
            eventHandlers={{
              click: () => onSelectPoint && onSelectPoint(pt),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 max-w-[240px] text-left">
                {pt.is_sos ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-danger-soft text-danger-text text-[10px] font-bold mb-1">
                    PANGGILAN DARURAT SOS
                  </span>
                ) : (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono text-primary font-bold">
                      {pt.tracking_code}
                    </span>
                    <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-bg text-ink-soft border border-line">
                      {pt.status}
                    </span>
                  </div>
                )}

                <h4 className="text-xs font-bold text-ink leading-snug mb-1">
                  {pt.title}
                </h4>

                <p className="text-[11px] text-ink-soft flex items-start gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="truncate">{pt.location_name}</span>
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-line text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pt.created_at}
                  </span>
                  {!pt.is_sos && (
                    <span className="flex items-center gap-0.5 text-primary font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      {pt.confirmation_count}
                    </span>
                  )}
                </div>

                {!pt.is_sos && (
                  <Link
                    href={`/lacak?kode=${pt.tracking_code}`}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1 py-1 rounded bg-primary text-white text-[11px] font-semibold hover:bg-primary-hover transition-colors"
                  >
                    <span>Lacak Status</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
