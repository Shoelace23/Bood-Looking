import Link from 'next/link';
import { ITINERARY, TRIP_START, TRIP_END, TRIP_NIGHTS, TRIP_TOTAL } from '@/lib/itinerary';
import { ChevronRight, Moon, Star } from 'lucide-react';
import { SearchResults } from '@/lib/types';
import { RIO_RESULTS }         from '@/lib/rioData';
import { TRANCOSO_RESULTS }    from '@/lib/trancosoData';
import { SAO_LUIS_RESULTS }    from '@/lib/saoLuisData';
import { BARREIRINHAS_RESULTS } from '@/lib/barreirinhasData';
import { ATINS_RESULTS }       from '@/lib/atinsData';
import { PARNABA_RESULTS }     from '@/lib/parnabaData';
import { JERICOACOARA_RESULTS } from '@/lib/jericoacoaraData';
import { FORTALEZA_RESULTS }   from '@/lib/fortalezaData';
import { SALVADOR1_RESULTS }   from '@/lib/salvador1Data';
import { BOIPEBA_RESULTS }     from '@/lib/boipebaData';
import { SALVADOR2_RESULTS }   from '@/lib/salvador2Data';

const AIRBNB_RED = '#FF385C';

// ── Mapping étape → données SearchResults ────────────────────────────
const STOP_DATA: Record<number, SearchResults | null> = {
  1:  RIO_RESULTS,
  2:  TRANCOSO_RESULTS,
  3:  null,               // Caraíva — pas de données Booking
  4:  SAO_LUIS_RESULTS,
  5:  BARREIRINHAS_RESULTS,
  6:  ATINS_RESULTS,
  7:  PARNABA_RESULTS,
  8:  JERICOACOARA_RESULTS,
  9:  FORTALEZA_RESULTS,
  10: SALVADOR1_RESULTS,
  11: BOIPEBA_RESULTS,
  12: SALVADOR2_RESULTS,
};

// ── Mini bar chart VFM (dans la zone gradient) ──────────────────────
function VfmMiniChart({ data }: { data: SearchResults }) {
  const anchorVfm = data.anchor.vfmScore;

  // Barres triées par VFM croissant → profil "montant" à droite
  const bars = [
    { vfm: anchorVfm, isAnchor: true, isBetterDeal: false },
    ...data.alternatives.map(a => ({
      vfm: a.vfmScore,
      isAnchor: false,
      isBetterDeal: a.isBetterDeal,
    })),
  ].sort((a, b) => a.vfm - b.vfm);

  const maxVfm = Math.max(...bars.map(b => b.vfm), 80);

  return (
    <div className="flex items-end gap-[2px]" style={{ height: 40 }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(5, (bar.vfm / maxVfm) * 100)}%`,
            backgroundColor: bar.isAnchor
              ? 'rgba(255,255,255,1)'      // ancre : blanc pur
              : bar.isBetterDeal
              ? 'rgba(255,255,255,0.60)'   // meilleures offres : blanc 60 %
              : 'rgba(255,255,255,0.22)',   // autres : blanc 22 %
          }}
          title={bar.isAnchor ? `Ancre · VFM ${bar.vfm}` : `Alternative · VFM ${bar.vfm}`}
        />
      ))}
    </div>
  );
}

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

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tight">
            bood<span style={{ color: AIRBNB_RED }}>looking</span>
          </span>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Moon className="h-4 w-4" />
            <span>{TRIP_NIGHTS} nuits · 3 adultes + 1 enfant</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Hero ── */}
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: AIRBNB_RED }}>
            Votre voyage
          </p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">🇧🇷 Brésil — Été 2026</h1>
          <p className="text-lg text-neutral-500">
            {formatDateLong(TRIP_START)} → {formatDateLong(TRIP_END)}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 flex-wrap">
            {[
              { n: ITINERARY.length, label: 'étapes' },
              { n: TRIP_NIGHTS,     label: 'nuits' },
              { n: `${TRIP_TOTAL.toLocaleString('fr-FR')} €`, label: 'budget hébergement estimé' },
            ].map(({ n, label }) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900">{n}</span>
                <span className="text-sm text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stop grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ITINERARY.map((stop, idx) => {
            const gradient  = GRADIENTS[idx % GRADIENTS.length];
            const stopData  = STOP_DATA[stop.id] ?? null;

            return (
              <Link
                key={stop.id}
                href={`/etape/${stop.id}`}
                className="group block rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient image area */}
                <div className={`relative h-52 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    {/* Stop badge */}
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
                      style={{ background: 'rgba(0,0,0,0.35)' }}
                    >
                      {stop.id}
                    </span>

                    {/* Score */}
                    {stop.bookingScore && (
                      <span className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5 text-xs font-bold text-neutral-900 shadow">
                        <Star className="h-3 w-3 fill-neutral-800" />
                        {stop.bookingScore.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Bottom: city + dates + chart */}
                  <div>
                    <h2 className="text-xl font-bold text-white drop-shadow">{stop.city}</h2>
                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <span className="text-white/80 text-xs font-medium">
                        {formatDateShort(stop.arrivalDate)} – {formatDateShort(stop.departureDate)}
                      </span>
                      <span className="bg-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {stop.nights} nuit{stop.nights > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Mini VFM bar chart — dans la zone gradient */}
                    {stopData
                      ? <VfmMiniChart data={stopData} />
                      : <div style={{ height: 40 }} />
                    }
                  </div>
                </div>

                {/* Info below */}
                <div className="bg-white px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{stop.hotelName}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {stop.pricePerNight !== null
                        ? `${stop.pricePerNight} €/nuit`
                        : 'Prix non renseigné'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {stopData && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ background: AIRBNB_RED }}
                      >
                        Comparer
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
