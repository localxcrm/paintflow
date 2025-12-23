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
};

function getHexColor(tailwindClass: string): string {
  return colorMap[tailwindClass] || '#6b7280';
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
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        const statusLabels: Record<string, string> = {
          'lead': 'Lead',
          'got_the_job': 'Confirmado',
          'scheduled': 'Agendado',
          'completed': 'Concluído',
        };

        const popupContent = `
          <div style="min-width: 200px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
              ${job.jobNumber}
            </div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
              Cliente
            </div>
            <div style="font-weight: 500; margin-bottom: 8px;">
              ${job.clientName}
            </div>
            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">
              Endereço
            </div>
            <div style="font-weight: 500; margin-bottom: 8px;">
              ${job.address}, ${job.city}${job.state ? ', ' + job.state : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="color: #64748b; font-size: 12px;">Status</div>
                <div style="font-weight: 500;">${statusLabels[job.status] || job.status}</div>
              </div>
              <div style="text-align: right;">
                <div style="color: #64748b; font-size: 12px;">Valor</div>
                <div style="font-weight: bold; color: #10b981;">${formatCurrency(job.jobValue)}</div>
              </div>
            </div>
            ${job.Subcontractor ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 12px;">Equipe</div>
                <div style="font-weight: 500;">${job.Subcontractor.name}</div>
              </div>
            ` : ''}
            <div style="margin-top: 12px;">
              <a href="/jobs/${job.id}" style="
                display: block;
                text-align: center;
                background-color: #3b82f6;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
              ">
                Ver Detalhes
              </a>
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
