'use client';

import { Star, ExternalLink } from 'lucide-react';
import { SearchResults, HotelResult, AnchorWithVFM, SERVICES_OPTIONS } from '@/lib/types';

const AIRBNB_RED = '#FF385C';
const TEAL = '#0d9488';

interface Props {
  results: SearchResults;
  selectedHotelId: string | null;
  onHotelSelect: (id: string | null) => void;
}

/* ── Stars ──────────────────────────────────────────────────────────── */
function Stars({ count }: { count: number }) {
  if (count === 0) return <span className="text-neutral-300 text-sm">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < count ? 'fill-neutral-700 text-neutral-700' : 'fill-neutral-200 text-neutral-200'}`} />
      ))}
    </span>
  );
}

/* ── Service chips ──────────────────────────────────────────────────── */
function ServicePills({ facilities }: { facilities: string[] }) {
  const labels = facilities
    .map((id) => SERVICES_OPTIONS.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .slice(0, 3) as string[];
  if (!labels.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {labels.map((l) => (
        <span key={l} className="text-xs bg-neutral-100 text-neutral-500 rounded-full px-2 py-0.5 leading-none">{l}</span>
      ))}
      {facilities.length > 3 && (
        <span className="text-xs text-neutral-400 self-center">+{facilities.length - 3}</span>
      )}
    </div>
  );
}

/* ── VFM badge ──────────────────────────────────────────────────────── */
function VFMBadge({ score }: { score: number }) {
  const cls =
    score >= 65 ? 'bg-emerald-500 text-white' :
    score >= 52 ? 'bg-blue-500 text-white' :
    score >= 38 ? 'bg-amber-400 text-white' :
                  'bg-neutral-200 text-neutral-500';
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {score}
    </span>
  );
}

/* ── Anchor row ─────────────────────────────────────────────────────── */
function AnchorRow({ anchor, nights }: { anchor: AnchorWithVFM; nights: number }) {
  const pps = anchor.stars > 0 ? `${(anchor.pricePerNight / anchor.stars).toFixed(0)}€/★` : null;

  return (
    <tr className="border-b-2" style={{ borderColor: AIRBNB_RED, background: '#fff5f6' }}>
      {/* Hôtel */}
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span
                className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: AIRBNB_RED }}
              >
                Votre référence
              </span>
            </div>
            <p className="font-semibold text-sm text-neutral-900 leading-snug">{anchor.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{anchor.destination}</p>
            <ServicePills facilities={anchor.services} />
            {anchor.bookingUrl && (
              <a
                href={anchor.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5 hover:underline"
                style={{ color: AIRBNB_RED }}
              >
                Voir sur Booking <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </td>
      {/* Étoiles */}
      <td className="px-4 py-3 text-center">
        <Stars count={anchor.stars} />
      </td>
      {/* Note */}
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
          {anchor.bookingScore.toFixed(1)}
        </span>
      </td>
      {/* Prix/nuit */}
      <td className="px-4 py-3 text-center">
        <p className="font-bold text-neutral-900">{anchor.pricePerNight}€</p>
        {pps && <p className="text-xs text-neutral-400 mt-0.5">{pps}</p>}
      </td>
      {/* Total */}
      <td className="px-4 py-3 text-center">
        <p className="font-semibold text-neutral-900">{anchor.totalPrice}€</p>
        <p className="text-xs text-neutral-400">{nights} nuits</p>
      </td>
      {/* VFM */}
      <td className="px-4 py-3 text-center">
        <VFMBadge score={anchor.vfmScore} />
      </td>
      {/* Économie */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-neutral-400">Réf.</span>
      </td>
    </tr>
  );
}

/* ── Alternative row ────────────────────────────────────────────────── */
function HotelRow({
  hotel,
  anchorPricePerStar,
  isSelected,
  onClick,
  nights,
  index,
}: {
  hotel: HotelResult;
  anchorPricePerStar: number;
  isSelected: boolean;
  onClick: () => void;
  nights: number;
  index: number;
}) {
  const pps = hotel.stars > 0 ? hotel.pricePerNight / hotel.stars : null;
  const ppsVsAnchor = (pps && anchorPricePerStar > 0) ? ((pps - anchorPricePerStar) / anchorPricePerStar) * 100 : null;
  const diff = hotel.priceVsAnchor;
  const isCheaper = diff < -1;
  const isDearer  = diff > 1;

  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 cursor-pointer transition-colors ${
        isSelected ? 'bg-rose-50' : index % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50/50 hover:bg-neutral-50'
      }`}
      style={isSelected ? { outline: `2px solid ${AIRBNB_RED}`, outlineOffset: '-2px' } : {}}
    >
      {/* Hôtel */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {hotel.isBetterDeal && (
            <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              Meilleure offre ✓
            </span>
          )}
        </div>
        <p className="font-semibold text-sm text-neutral-900 leading-snug">{hotel.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[240px]">{hotel.address}</p>
        {hotel.reviewCount > 0 && (
          <p className="text-xs text-neutral-400">{hotel.reviewCount.toLocaleString()} avis</p>
        )}
        <ServicePills facilities={hotel.facilities} />
        <a
          href={hotel.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-semibold mt-1.5 hover:underline"
          style={{ color: AIRBNB_RED }}
        >
          Réserver <ExternalLink className="h-3 w-3" />
        </a>
      </td>
      {/* Étoiles */}
      <td className="px-4 py-3 text-center">
        <Stars count={hotel.stars} />
      </td>
      {/* Note */}
      <td className="px-4 py-3 text-center">
        {hotel.bookingScore > 0 ? (
          <span className="inline-flex items-center gap-1 bg-neutral-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
            {hotel.bookingScore.toFixed(1)}
          </span>
        ) : (
          <span className="text-neutral-300 text-sm">—</span>
        )}
      </td>
      {/* Prix/nuit */}
      <td className="px-4 py-3 text-center">
        <p className="font-bold text-neutral-900">{hotel.pricePerNight}€</p>
        {pps !== null && (
          <p className={`text-xs mt-0.5 ${
            ppsVsAnchor !== null && ppsVsAnchor < -1 ? 'text-emerald-600 font-semibold' :
            ppsVsAnchor !== null && ppsVsAnchor > 1  ? 'text-red-400' :
                                                        'text-neutral-400'
          }`}>
            {pps.toFixed(0)}€/★
          </p>
        )}
      </td>
      {/* Total */}
      <td className="px-4 py-3 text-center">
        <p className="font-semibold text-neutral-900">{hotel.totalPrice}€</p>
        <p className="text-xs text-neutral-400">{nights} nuits</p>
      </td>
      {/* VFM */}
      <td className="px-4 py-3 text-center">
        <VFMBadge score={hotel.vfmScore} />
      </td>
      {/* Économie vs ancre */}
      <td className="px-4 py-3 text-center">
        {isCheaper && (
          <span className="text-sm font-bold text-emerald-600">{diff.toFixed(1)}%</span>
        )}
        {isDearer && (
          <span className="text-sm font-bold text-red-400">+{diff.toFixed(1)}%</span>
        )}
        {!isCheaper && !isDearer && (
          <span className="text-sm text-neutral-400">=</span>
        )}
      </td>
    </tr>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function ComparisonTable({ results, selectedHotelId, onHotelSelect }: Props) {
  const anchorPricePerStar = results.anchor.stars > 0
    ? results.anchor.pricePerNight / results.anchor.stars
    : 0;

  return (
    <div className="bg-white">
      {/* Section header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Tableau détaillé — Prix &amp; Économies
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {results.alternatives.length + 1} hébergements · {results.anchor.destination} · triés par VFM
          </p>
        </div>
        {!results.isMock && (
          <span className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full font-medium">
            Booking.com réel
          </span>
        )}
      </div>

      {/* Table wrapper — scroll horizontal sur petits écrans */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: TEAL }}>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Hôtel
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                Étoiles
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                Note
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                Prix/nuit
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                Prix total
                <span className="block font-normal normal-case tracking-normal opacity-80">
                  ({results.nights} nuits)
                </span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                VFM
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                Économie
                <span className="block font-normal normal-case tracking-normal opacity-80">
                  vs. référence
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <AnchorRow anchor={results.anchor} nights={results.nights} />
            {results.alternatives.map((hotel, i) => (
              <HotelRow
                key={hotel.id}
                hotel={hotel}
                anchorPricePerStar={anchorPricePerStar}
                isSelected={selectedHotelId === hotel.id}
                onClick={() => onHotelSelect(hotel.id === selectedHotelId ? null : hotel.id)}
                nights={results.nights}
                index={i}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Key takeaways */}
      {results.alternatives.length > 0 && (() => {
        const best = results.alternatives[0];
        const cheapest = [...results.alternatives].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
        const sameScore = results.alternatives.filter(
          h => h.bookingScore > 0 && Math.abs(h.bookingScore - results.anchor.bookingScore) <= 0.3
        );
        return (
          <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50">
            <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Points clés</p>
            <ul className="space-y-1.5 text-sm text-neutral-600">
              <li>
                <span className="font-semibold">Meilleur VFM :</span>{' '}
                <span className="font-semibold text-neutral-900">{best.name}</span>{' '}
                à <span className="font-bold">{best.pricePerNight}€/nuit</span>
                {best.bookingScore > 0 && ` (note ${best.bookingScore.toFixed(1)})`}
                {best.priceVsAnchor < -1 && (
                  <span className="text-emerald-600 font-semibold"> — économie de {best.priceVsAnchor.toFixed(1)}%</span>
                )}
              </li>
              {cheapest.id !== best.id && (
                <li>
                  <span className="font-semibold">Prix le plus bas :</span>{' '}
                  <span className="font-semibold text-neutral-900">{cheapest.name}</span>{' '}
                  à <span className="font-bold">{cheapest.pricePerNight}€/nuit</span>
                  <span className="text-emerald-600 font-semibold"> ({cheapest.priceVsAnchor.toFixed(1)}% vs ancre)</span>
                </li>
              )}
              {sameScore.length > 0 && (
                <li>
                  <span className="font-semibold">Note similaire à l'ancre :</span>{' '}
                  {sameScore.slice(0, 2).map((h, i) => (
                    <span key={h.id}>
                      {i > 0 && ', '}
                      <span className="font-semibold text-neutral-900">{h.name}</span>{' '}
                      à {h.pricePerNight}€/nuit
                    </span>
                  ))}
                </li>
              )}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}
