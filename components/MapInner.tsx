'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SearchResults, HotelResult, AnchorWithVFM } from '@/lib/types';

interface Props {
  results: SearchResults;
  selectedHotelId: string | null;
  onHotelSelect: (id: string | null) => void;
  isVisible?: boolean; // mobile: true quand l'onglet Carte est actif
}

const AIRBNB_RED = '#FF385C';

/* ── Price pill markers (Airbnb style) ─────────────────── */
function pricePill(price: number, isAnchor: boolean, isSelected: boolean): L.DivIcon {
  let bg: string, color: string, border: string, shadow: string;

  if (isAnchor) {
    bg = AIRBNB_RED; color = '#ffffff'; border = `3px solid ${AIRBNB_RED}`; shadow = '0 4px 14px rgba(255,56,92,0.45)';
  } else if (isSelected) {
    bg = '#222222'; color = '#ffffff'; border = '2px solid #222222'; shadow = '0 4px 14px rgba(0,0,0,0.35)';
  } else {
    bg = '#ffffff'; color = '#222222'; border = '1.5px solid #dddddd'; shadow = '0 2px 8px rgba(0,0,0,0.18)';
  }

  const label = isAnchor ? `📍 ${Math.round(price)}€` : `${Math.round(price)}€`;
  const size = isAnchor ? 88 : 68;

  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};color:${color};border:${border};border-radius:24px;
      padding:6px 14px;font-weight:700;font-size:13px;white-space:nowrap;
      box-shadow:${shadow};cursor:pointer;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      letter-spacing:-0.3px;transition:transform 0.1s;
    ">${label}</div>`,
    iconSize: [size, 36],
    iconAnchor: [size / 2, 18],
    popupAnchor: [0, -22],
  });
}

/* ── Popup content (Airbnb light style) ─────────────────── */
function popupHtml(hotel: HotelResult | AnchorWithVFM, isAnchor: boolean): string {
  const name = hotel.name ?? 'Hôtel';
  const stars = '★'.repeat(hotel.stars) + '☆'.repeat(Math.max(0, 5 - hotel.stars));
  const score = hotel.bookingScore.toFixed(1);

  if (isAnchor) {
    const a = hotel as AnchorWithVFM;
    return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:210px">
      <div style="font-size:11px;font-weight:700;color:${AIRBNB_RED};margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px">Votre référence</div>
      <div style="font-size:15px;font-weight:700;color:#222;margin-bottom:4px;line-height:1.3">${name}</div>
      <div style="color:#e5a823;font-size:13px;margin-bottom:6px">${stars}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <span style="background:#222;color:#fff;border-radius:6px;padding:2px 8px;font-size:13px;font-weight:700">${score}</span>
        <span style="color:#717171;font-size:12px">Note Booking</span>
      </div>
      <div style="font-size:16px;font-weight:700;color:#222">${a.pricePerNight}€<span style="font-size:13px;font-weight:400;color:#717171">/nuit</span></div>
      <div style="color:#717171;font-size:12px;margin-top:2px">Total : ${a.totalPrice}€ · ${a.nights} nuits</div>
      ${a.bookingUrl ? `<a href="${a.bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;font-weight:600;color:${AIRBNB_RED};text-decoration:none">Voir sur Booking ↗</a>` : ''}
    </div>`;
  }

  const h = hotel as HotelResult;
  const diff = h.priceVsAnchor;
  const diffColor = diff < -1 ? '#00a699' : diff > 1 ? '#e01b5d' : '#717171';
  const diffText = Math.abs(diff) < 1 ? '= prix ancre' : `${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs ancre`;
  const pps = h.stars > 0 ? (h.pricePerNight / h.stars).toFixed(0) : null;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:220px">
    <div style="font-size:15px;font-weight:700;color:#222;margin-bottom:3px;line-height:1.3">${h.name}</div>
    <div style="color:#717171;font-size:11px;margin-bottom:5px">${h.address}</div>
    <div style="color:#e5a823;font-size:13px;margin-bottom:5px">${stars}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <span style="background:#222;color:#fff;border-radius:6px;padding:2px 8px;font-size:13px;font-weight:700">${score}</span>
      <span style="color:#717171;font-size:12px">${h.reviewCount.toLocaleString()} avis</span>
    </div>
    <div style="font-size:16px;font-weight:700;color:#222">${h.pricePerNight}€<span style="font-size:13px;font-weight:400;color:#717171">/nuit</span>${pps ? `<span style="font-size:12px;color:#717171;margin-left:8px">${pps}€/★</span>` : ''}</div>
    <div style="color:${diffColor};font-size:12px;font-weight:600;margin-top:3px">${diffText}</div>
    ${h.isBetterDeal ? `<div style="margin-top:6px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:4px 8px;font-size:11px;color:#16a34a;font-weight:600">✓ Meilleure offre</div>` : ''}
    ${h.bookingUrl ? `<a href="${h.bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;font-weight:600;color:${AIRBNB_RED};text-decoration:none">Voir sur Booking ↗</a>` : ''}
  </div>`;
}

export default function MapInner({ results, selectedHotelId, onHotelSelect, isVisible = true }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  /* Recalcule la taille quand le conteneur devient visible (onglet mobile) */
  useEffect(() => {
    if (isVisible && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 50);
    }
  }, [isVisible]);

  /* Init map */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* Place markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    const pts: L.LatLngExpression[] = [];

    // Anchor
    const a = results.anchor;
    const anchorMarker = L.marker([a.lat, a.lng], {
      icon: pricePill(a.pricePerNight, true, false),
      zIndexOffset: 1000,
    })
      .bindPopup(popupHtml(a, true), { className: 'light-popup', maxWidth: 280 })
      .addTo(map);
    markersRef.current.set('anchor', anchorMarker);
    pts.push([a.lat, a.lng]);

    // Alternatives
    results.alternatives.forEach((h) => {
      const isSelected = h.id === selectedHotelId;
      const marker = L.marker([h.lat, h.lng], {
        icon: pricePill(h.pricePerNight, false, isSelected),
      })
        .bindPopup(popupHtml(h, false), { className: 'light-popup', maxWidth: 280 })
        .on('click', () => onHotelSelect(h.id))
        .addTo(map);
      markersRef.current.set(h.id, marker);
      pts.push([h.lat, h.lng]);
    });

    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts as L.LatLngTuple[]), { padding: [50, 50], maxZoom: 15 });
    }
  }, [results, onHotelSelect, selectedHotelId]);

  /* Pan + open popup on selection */
  useEffect(() => {
    if (!selectedHotelId) return;
    const marker = markersRef.current.get(selectedHotelId);
    if (marker) {
      marker.openPopup();
      mapRef.current?.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedHotelId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Airbnb-style floating pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-white rounded-full shadow-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700">
          {results.alternatives.length + 1} hébergements · Cliquez pour les détails
        </div>
      </div>
    </div>
  );
}
