'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Moon, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { ItineraryStop } from '@/lib/itinerary';
import { RIO_RESULTS } from '@/lib/rioData';
import { TRANCOSO_RESULTS } from '@/lib/trancosoData';
import { SAO_LUIS_RESULTS } from '@/lib/saoLuisData';
import { BARREIRINHAS_RESULTS } from '@/lib/barreirinhasData';
import { ATINS_RESULTS } from '@/lib/atinsData';
import { PARNABA_RESULTS } from '@/lib/parnabaData';
import { JERICOACOARA_RESULTS } from '@/lib/jericoacoaraData';
import { FORTALEZA_RESULTS } from '@/lib/fortalezaData';
import { SALVADOR1_RESULTS } from '@/lib/salvador1Data';
import { BOIPEBA_RESULTS } from '@/lib/boipebaData';
import { SALVADOR2_RESULTS } from '@/lib/salvador2Data';
import { SearchResults } from '@/lib/types';
import ComparisonTable from '@/components/ComparisonTable';
import MapView from '@/components/MapView';

const AIRBNB_RED = '#FF385C';

const GRADIENTS = [
  'from-rose-300 to-pink-500',
  'from-amber-300 to-orange-500',
  'from-emerald-300 to-teal-500',
  'from-sky-300 to-blue-500',
  'from-violet-300 to-purple-500',
  'from-fuchsia-300 to-pink-500',
  'from-lime-300 to-green-500',
  'from-cyan-300 to-sky-500',
  'from-orange-300 to-red-500',
  'from-indigo-300 to-violet-500',
  'from-teal-300 to-emerald-500',
  'from-pink-300 to-rose-500',
];

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ── Stop detail (no comparison data yet) ───────────────────────── */
function StopDetail({ stop }: { stop: ItineraryStop }) {
  const gradient = GRADIENTS[(stop.id - 1) % GRADIENTS.length];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">

      {/* Hero band */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-8 mb-8 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <span
            className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            {stop.id}
          </span>
          {stop.bookingScore && (
            <span className="flex items-center gap-1 bg-white/90 rounded-full px-3 py-1 text-sm font-bold text-neutral-900 shadow">
              <Star className="h-4 w-4 fill-neutral-800" />
              {stop.bookingScore.toFixed(1)}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold drop-shadow mb-1">{stop.city}</h1>
        <p className="text-white/80 text-base font-medium">{stop.hotelName}</p>

        <div className="flex flex-wrap gap-3 mt-6">
          <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateShort(stop.arrivalDate)} → {formatDateShort(stop.departureDate)}
          </span>
          <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
            <Moon className="h-3.5 w-3.5" />
            {stop.nights} nuit{stop.nights > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" />
            {stop.adults} adultes · {stop.children} enfant
          </span>
        </div>
      </div>

      {/* Price card */}
      {stop.pricePerNight !== null ? (
        <div className="border border-neutral-200 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">Prix</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-neutral-900">{stop.pricePerNight}€</span>
            <span className="text-neutral-500">/ nuit</span>
          </div>
          {stop.nights > 1 && stop.totalPrice && (
            <p className="text-sm text-neutral-400 mt-1">
              Total séjour · <span className="font-semibold text-neutral-700">{stop.totalPrice.toLocaleString('fr-FR')}€</span>
            </p>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-neutral-200 rounded-2xl p-6 mb-6 text-center text-neutral-400 text-sm">
          Prix non renseigné
        </div>
      )}

      {/* Dates detail */}
      <div className="border border-neutral-200 rounded-2xl p-6 mb-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Dates</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Arrivée</p>
            <p className="text-sm font-semibold text-neutral-900 capitalize">{formatDateLong(stop.arrivalDate)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Départ</p>
            <p className="text-sm font-semibold text-neutral-900 capitalize">{formatDateLong(stop.departureDate)}</p>
          </div>
        </div>
      </div>

      {/* Booking link */}
      {stop.bookingUrl ? (
        <a
          href={stop.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: AIRBNB_RED }}
        >
          Voir sur Booking.com
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}

      {/* Coming soon banner */}
      <div className="mt-8 border border-neutral-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-neutral-500 mb-1">Comparaison d'hôtels</p>
        <p className="text-xs text-neutral-400">Bientôt disponible pour cette étape</p>
      </div>
    </div>
  );
}

/* ── Comparison page ───────────────────────────────────────────────── */
function ComparisonPage({ stop, results }: { stop: ItineraryStop; results: SearchResults }) {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const gradient = GRADIENTS[(stop.id - 1) % GRADIENTS.length];

  /* Info strip partagée */
  const infoStrip = (
    <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-100 bg-white flex items-center gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow flex-shrink-0 bg-gradient-to-br ${gradient}`}>
        {stop.id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-bold text-neutral-900">{stop.city}</h1>
          {stop.bookingScore && (
            <span className="flex items-center gap-1 bg-neutral-100 rounded-full px-2 py-0.5 text-xs font-bold text-neutral-700">
              <Star className="h-3 w-3 fill-neutral-700" />
              {stop.bookingScore.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Moon className="h-3 w-3" />
            {stop.nights} nuits · {formatDateShort(stop.arrivalDate)} → {formatDateShort(stop.departureDate)}
          </span>
        </div>
        <p className="text-xs text-neutral-400">{stop.hotelName}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE (< md) : onglets Liste / Carte ── */}
      <div className="flex flex-col md:hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {infoStrip}

        {/* Onglets */}
        <div className="flex-shrink-0 flex border-b border-neutral-100 bg-white">
          <button
            onClick={() => setMobileTab('list')}
            style={mobileTab === 'list' ? { borderBottom: '2px solid #171717', color: '#171717' } : { color: '#a3a3a3' }}
            className="flex-1 py-2.5 text-sm font-semibold"
          >
            Liste
          </button>
          <button
            onClick={() => setMobileTab('map')}
            style={mobileTab === 'map' ? { borderBottom: '2px solid #171717', color: '#171717' } : { color: '#a3a3a3' }}
            className="flex-1 py-2.5 text-sm font-semibold"
          >
            Carte
          </button>
        </div>

        {/* Panneau actif */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'list' ? (
            <div className="h-full overflow-y-auto">
              <ComparisonTable
                results={results}
                selectedHotelId={selectedHotelId}
                onHotelSelect={(id) => { setSelectedHotelId(id); setMobileTab('map'); }}
              />
            </div>
          ) : (
            <div className="h-full w-full relative">
              <MapView
                results={results}
                selectedHotelId={selectedHotelId}
                onHotelSelect={setSelectedHotelId}
                isVisible={mobileTab === 'map'}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP (≥ md) : tableau gauche + carte droite ── */}
      <div className="hidden md:flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        {infoStrip}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto border-r border-neutral-100">
            <ComparisonTable
              results={results}
              selectedHotelId={selectedHotelId}
              onHotelSelect={setSelectedHotelId}
            />
          </div>
          <div className="w-[700px] flex-shrink-0 relative">
            <MapView
              results={results}
              selectedHotelId={selectedHotelId}
              onHotelSelect={setSelectedHotelId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const COMPARISON_DATA: Record<number, SearchResults> = {
  1: RIO_RESULTS,
  2: TRANCOSO_RESULTS,
  // 3: Caraíva — pas de prix ancre → StopDetail affiché
  4: SAO_LUIS_RESULTS,
  5: BARREIRINHAS_RESULTS,
  6: ATINS_RESULTS,
  7: PARNABA_RESULTS,
  8: JERICOACOARA_RESULTS,
  9: FORTALEZA_RESULTS,
  10: SALVADOR1_RESULTS,
  11: BOIPEBA_RESULTS,
  12: SALVADOR2_RESULTS,
};

/* ── Main export ────────────────────────────────────────────────── */
export default function EtapeClient({ stop }: { stop: ItineraryStop }) {
  const results = COMPARISON_DATA[stop.id] ?? null;

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-200 px-6 py-3 h-14 flex items-center">
        <div className="max-w-full mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
            <span className="text-neutral-200">|</span>
            <span className="text-xl font-bold tracking-tight">
              bood<span style={{ color: AIRBNB_RED }}>looking</span>
            </span>
          </div>
          <span className="text-sm text-neutral-400 hidden sm:block">
            Étape {stop.id} · {stop.city}
          </span>
        </div>
      </header>

      {/* Body */}
      {results ? <ComparisonPage stop={stop} results={results} /> : <StopDetail stop={stop} />}
    </div>
  );
}
