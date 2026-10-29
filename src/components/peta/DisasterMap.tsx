"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  is_demo?: boolean;
  province?: string;
  regency?: string;
}

interface DisasterMapProps {
  points: MapPoint[];
  selectedPointId?: string;
  onSelectPoint?: (point: MapPoint) => void;
  showLegend?: boolean;
  className?: string;
}

// Generate custom DivIcon based on status and emergency SOS
function createPinIcon(status: ReportStatus, isSos: boolean = false) {
  if (isSos) {
    return L.divIcon({
      className: "custom-sos-pin",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #DC2626; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(220,38,38,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 9px;">SOS</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

  let bgHex = "#2563EB"; // info default
  if (status === "ditindaklanjuti") bgHex = "#F59E0B";
  else if (status === "selesai") bgHex = "#16A34A";
  else if (status === "ditolak") bgHex = "#DC2626";

  return L.divIcon({
    className: "custom-report-pin",
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: ${bgHex}; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(31,41,55,0.3);"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

export default function DisasterMap({
  points,
  selectedPointId,
  onSelectPoint,
  showLegend = true,
  className = "",
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Injeksi style animasi ping jika belum ada di document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "sigapbumi-map-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(31,41,55,0.15) !important;
          padding: 4px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Indonesia archipelago default view
    const map = L.map(mapContainerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: true,
    });

    // Required OpenStreetMap Attribution
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor',
      maxZoom: 19,
    }).addTo(map);

    // Add Locate Button Control
    const LocateControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const btn = L.DomUtil.create("button", "leaflet-bar");
        btn.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:#fff;border-radius:4px;cursor:pointer;font-size:16px;" title="Pusatkan ke lokasi saya">⌖</span>`;
        btn.onclick = function (e) {
          e.stopPropagation();
          map.locate({ setView: true, maxZoom: 13 });
        };
        return btn;
      },
    });
    map.addControl(new LocateControl());

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Pan to selected point when selectedPointId changes
  useEffect(() => {
    if (!selectedPointId || !mapInstanceRef.current) return;
    const pt = points.find((p) => p.id === selectedPointId);
    if (pt) {
      mapInstanceRef.current.setView([pt.lat, pt.lng], 13);
    }
  }, [selectedPointId, points]);

  // Update Markers when points change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    points.forEach((pt) => {
      const marker = L.marker([pt.lat, pt.lng], {
        icon: createPinIcon(pt.status, pt.is_sos),
      });

      // Construct popup HTML (tanpa emoji, mematuhi Anti-Slop R-01)
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #1F2937; min-width: 190px; max-width: 250px; padding: 2px;">
          ${
            pt.is_sos
              ? `<div style="background-color: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">PANGGILAN DARURAT SOS</div>`
              : `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-weight: bold; color: #EF6806;">${pt.tracking_code}</span>
                  <span style="font-size: 10px; text-transform: capitalize; background: #F6F7F8; padding: 1px 6px; border-radius: 4px; border: 1px solid #E5E7EB;">${pt.status}</span>
                </div>`
          }
          ${
            pt.is_demo
              ? `<div style="background: #FEF0E6; color: #A74904; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; display: inline-block; margin-bottom: 4px;">DATA DEMONSTRASI</div>`
              : ""
          }
          <div style="font-weight: 700; font-size: 13px; line-height: 1.3; margin-bottom: 4px;">${pt.title}</div>
          <div style="color: #4B5563; font-size: 11px; margin-bottom: 6px;">Lokasi: ${pt.location_name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; padding-top: 4px; border-top: 1px solid #E5E7EB;">
            <span>Waktu: ${pt.created_at}</span>
            ${!pt.is_sos ? `<span style="color: #EF6806; font-weight: 600;">${pt.confirmation_count} konfirmasi</span>` : ""}
          </div>
          ${
            !pt.is_sos
              ? `<a href="/lacak?kode=${pt.tracking_code}" style="display: block; text-align: center; background-color: #EF6806; color: white; text-decoration: none; padding: 6px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; margin-top: 8px;">Lacak Status & Detail</a>`
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onSelectPoint) {
          onSelectPoint(pt);
        }
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds jika ada titik dan tidak sedang fokus pada titik tertentu
    if (!selectedPointId && points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12 });
      }
    }
  }, [points, onSelectPoint, selectedPointId]);

  const sosCount = points.filter((p) => p.is_sos).length;
  const reportCount = points.filter((p) => !p.is_sos).length;

  return (
    <div
      className={`w-full h-full min-h-[500px] md:min-h-[600px] relative rounded-lg overflow-hidden border border-line shadow-card ${className}`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] max-w-[280px] bg-surface/95 backdrop-blur-sm border border-line rounded-lg p-3 shadow-card text-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px]">
              Legenda Status
            </span>
            <span className="text-[10px] text-ink-muted font-medium">
              Total {points.length} Titik ({reportCount} Lap + {sosCount} SOS)
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
              <span>Diterima / Diverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
              <span>Ditindaklanjuti</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
              <span>Selesai Teratasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0 animate-pulse" />
              <span className="font-bold text-danger">Panggilan SOS Darurat ({sosCount})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
