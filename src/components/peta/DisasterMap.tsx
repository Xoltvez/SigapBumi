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
}

interface DisasterMapProps {
  points: MapPoint[];
  selectedPointId?: string;
  onSelectPoint?: (point: MapPoint) => void;
}

// Generate custom DivIcon based on status and emergency SOS
function createPinIcon(status: ReportStatus, isSos: boolean = false) {
  if (isSos) {
    return L.divIcon({
      className: "custom-sos-pin",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background-color: #DC2626; border: 2px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px; font-family: sans-serif;">SOS</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

  let bgColor = "#2563EB"; // info default (diterima)
  if (status === "diverifikasi") bgColor = "#1D4ED8";
  if (status === "ditindaklanjuti") bgColor = "#F59E0B";
  if (status === "selesai") bgColor = "#16A34A";
  if (status === "ditolak") bgColor = "#DC2626";

  return L.divIcon({
    className: "custom-disaster-pin",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 24px; height: 24px; border-radius: 50% 50% 50% 0; background-color: ${bgColor}; transform: rotate(-45deg); border: 2px solid #FFFFFF; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; border-radius: 50%; background-color: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export default function DisasterMap({
  points,
  onSelectPoint,
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Injects ping animation styles
  useEffect(() => {
    const styleId = "custom-pin-animations";
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

    // Jakarta default view
    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 11,
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

      // Construct popup HTML
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #1F2937; min-width: 180px; max-width: 240px; padding: 2px;">
          ${
            pt.is_sos
              ? `<div style="background-color: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">PANGGILAN DARURAT SOS</div>`
              : `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-weight: bold; color: #EF6806;">${pt.tracking_code}</span>
                  <span style="font-size: 10px; text-transform: capitalize; background: #F6F7F8; padding: 1px 6px; border-radius: 4px; border: 1px solid #E5E7EB;">${pt.status}</span>
                </div>`
          }
          <div style="font-weight: 700; font-size: 13px; line-height: 1.3; margin-bottom: 4px;">${pt.title}</div>
          <div style="color: #4B5563; font-size: 11px; margin-bottom: 6px;">📍 ${pt.location_name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; padding-top: 4px; border-top: 1px solid #E5E7EB;">
            <span>🕒 ${pt.created_at}</span>
            ${!pt.is_sos ? `<span style="color: #EF6806; font-weight: 600;">🛡️ ${pt.confirmation_count} warga</span>` : ""}
          </div>
          ${
            !pt.is_sos
              ? `<a href="/lacak?kode=${pt.tracking_code}" style="display: block; text-align: center; background-color: #EF6806; color: white; text-decoration: none; padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; margin-top: 8px;">Lacak Status & Detail</a>`
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
  }, [points, onSelectPoint]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] relative rounded-lg overflow-hidden border border-line shadow-card">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
}
