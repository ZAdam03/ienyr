'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Default ikon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});


interface Site {
  companyId: string;
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

export default function SiteMap({ companyId }: { companyId: string }) {
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    fetch('/api/site')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((s: Site) => s.companyId === companyId && s.latitude && s.longitude);
        setSites(filtered);
      })
      .catch(err => console.error('Hiba a térképes adatok betöltésekor:', err));
  }, [companyId]);

  const center: LatLngExpression = sites.length
    ? [sites[0].latitude!, sites[0].longitude!]
    : [47.4979, 19.0402]; // Alapértelmezett: Budapest

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {sites.map(site => (
          <Marker key={site.id} position={[site.latitude!, site.longitude!]}>
            <Popup>
              <strong>{site.description}</strong><br />
              <a href={`/site/${site.id}`}>Részletek</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
