'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Subcontractor {
  id: string;
  name: string;
  color: string;
}

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  state: string | null;
  status: string;
  scheduledStartDate: string | null;
  latitude: number | null;
  longitude: number | null;
  jobValue: number;
  Subcontractor: Subcontractor | null;
}

interface JobMapProps {
  jobs: Job[];
}

// Map Tailwind color classes to hex colors
const colorMap: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-purple-500': '#a855f7',
  'bg-orange-500': '#f97316',
  'bg-pink-500': '#ec4899',
  'bg-teal-500': '#14b8a6',
  'bg-red-500': '#ef4444',
  'bg-yellow-500': '#eab308',
  'bg-indigo-500': '#6366f1',
  'bg-gray-500': '#6b7280',
  '#3B82F6': '#3B82F6',
  '#22C55E': '#22C55E',
  '#10B981': '#10B981',
  '#A855F7': '#A855F7',
  '#F97316': '#F97316',
  '#EC4899': '#EC4899',
  '#14B8A6': '#14B8A6',
  '#EF4444': '#EF4444',
  '#EAB308': '#EAB308',
  '#6366F1': '#6366F1',
  '#6B7280': '#6B7280',
};

function getHexColor(color: string): string {
  // If it's already a hex color, return it
  if (color?.startsWith('#')) {
    return color;
  }
  // Otherwise look up in color map
  return colorMap[color] || '#6b7280';
}

function createMarkerIcon(color: string): L.DivIcon {
  const hexColor = getHexColor(color);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${hexColor};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

export default function JobMap({ jobs }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already initialized
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([42.3601, -71.0589], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each job
    const markers: L.Marker[] = [];

    jobs.forEach(job => {
      if (job.latitude && job.longitude) {
        const color = job.Subcontractor?.color || 'bg-gray-500';
        const marker = L.marker([job.latitude, job.longitude], {
          icon: createMarkerIcon(color),
        });

        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        };

        const statusLabels: Record<string, string> = {
          'lead': 'Lead',
          'got_the_job': 'Confirmed',
          'scheduled': 'Scheduled',
          'completed': 'Completed',
        };

        const statusColors: Record<string, string> = {
          'lead': '#6b7280',
          'got_the_job': '#22c55e',
          'scheduled': '#3b82f6',
          'completed': '#10b981',
        };

        const subColor = job.Subcontractor?.color || '#6b7280';
        const hexSubColor = getHexColor(subColor);

        const popupContent = `
          <div style="min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-weight: bold; font-size: 14px;">
                ${job.jobNumber}
              </div>
              <span style="
                background-color: ${statusColors[job.status] || '#6b7280'};
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
              ">${statusLabels[job.status] || job.status}</span>
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">
              Client
            </div>
            <div style="font-weight: 500; margin-bottom: 8px;">
              ${job.clientName}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 2px;">
              Address
            </div>
            <div style="font-weight: 500; margin-bottom: 8px;">
              ${job.address}, ${job.city}${job.state ? ', ' + job.state : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e2e8f0;">
              <div style="text-align: left;">
                <div style="color: #64748b; font-size: 11px;">Value</div>
                <div style="font-weight: bold; color: #10b981; font-size: 16px;">${formatCurrency(job.jobValue)}</div>
              </div>
              ${job.Subcontractor ? `
                <div style="text-align: right;">
                  <div style="color: #64748b; font-size: 11px;">Crew</div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${hexSubColor};"></div>
                    <span style="font-weight: 500;">${job.Subcontractor.name}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        markers.push(marker);
      }
    });

    // Fit map bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup function
    return () => {
      // Don't destroy the map, just clear markers on next render
    };
  }, [jobs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: '500px', width: '100%' }}
      className="rounded-lg"
    />
  );
}
