'use client';

import { useState } from 'react';
import {
  Search, Plus, Minus, Star, Hotel, Calendar, Users,
  Link, DollarSign, Sliders, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { AnchorHotel, SearchParams, SERVICES_OPTIONS } from '@/lib/types';

interface Props {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  initialAnchor?: AnchorHotel;
  initialPriceRange?: number;
}

const STAR_COUNT = [1, 2, 3, 4, 5];

const DEFAULT_ANCHOR: AnchorHotel = {
  name: '',
  destination: '',
  checkinDate: '',
  checkoutDate: '',
  adults: 2,
  children: [],
  bookingUrl: '',
  pricePerNight: 0,
  currency: 'EUR',
  stars: 4,
  bookingScore: 8.0,
  services: [],
};

export default function SearchForm({ onSearch, isLoading, initialAnchor, initialPriceRange }: Props) {
  const [anchor, setAnchor] = useState<AnchorHotel>(initialAnchor ?? DEFAULT_ANCHOR);
  const [priceRange, setPriceRange] = useState(initialPriceRange ?? 25);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const nights =
    anchor.checkinDate && anchor.checkoutDate
      ? Math.max(
          0,
          Math.round(
            (new Date(anchor.checkoutDate).getTime() -
              new Date(anchor.checkinDate).getTime()) /
              86400000
          )
        )
      : 0;

  const totalPrice = anchor.pricePerNight * nights;

  function setField<K extends keyof AnchorHotel>(k: K, v: AnchorHotel[K]) {
    setAnchor((prev) => ({ ...prev, [k]: v }));
  }

  function toggleService(id: string) {
    setAnchor((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));
  }

  function addChild() {
    setAnchor((prev) => ({ ...prev, children: [...prev.children, 8] }));
  }

  function removeChild(i: number) {
    setAnchor((prev) => ({
      ...prev,
      children: prev.children.filter((_, idx) => idx !== i),
    }));
  }

  function updateChildAge(i: number, age: number) {
    setAnchor((prev) => {
      const c = [...prev.children];
      c[i] = age;
      return { ...prev, children: c };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anchor.destination || !anchor.checkinDate || !anchor.checkoutDate || anchor.pricePerNight <= 0) return;
    onSearch({ anchor, priceRangePercent: priceRange });
  }

  const isValid =
    anchor.destination.trim() &&
    anchor.checkinDate &&
    anchor.checkoutDate &&
    anchor.pricePerNight > 0 &&
    nights > 0;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Hotel className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Bood<span className="text-amber-400">Looking</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Trouvez des hôtels avec un meilleur rapport qualité-prix que votre réservation actuelle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reference Hotel Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-xs font-bold">A</span>
              </div>
              <h2 className="text-sm font-semibold text-white">Hôtel de Référence — L&apos;Ancre</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Destination + Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Destination *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Rio de Janeiro, Paris…"
                      value={anchor.destination}
                      onChange={(e) => setField('destination', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nom de l&apos;hôtel</label>
                  <div className="relative">
                    <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Ex: Copacabana Palace"
                      value={anchor.name}
                      onChange={(e) => setField('name', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Booking URL */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">URL Booking.com</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://www.booking.com/hotel/…"
                    value={anchor.bookingUrl}
                    onChange={(e) => setField('bookingUrl', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Arrivée *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      value={anchor.checkinDate}
                      onChange={(e) => setField('checkinDate', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Départ *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      value={anchor.checkoutDate}
                      onChange={(e) => setField('checkoutDate', e.target.value)}
                      min={anchor.checkinDate}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>
              </div>

              {nights > 0 && (
                <p className="text-xs text-amber-400/80 -mt-1">
                  {nights} nuit{nights > 1 ? 's' : ''}
                  {totalPrice > 0 && ` · Total estimé : ${anchor.currency === 'EUR' ? '€' : '$'}${totalPrice}`}
                </p>
              )}

              {/* Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Adultes</label>
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setField('adults', Math.max(1, anchor.adults - 1))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm text-white font-medium w-4 text-center">{anchor.adults}</span>
                    <button
                      type="button"
                      onClick={() => setField('adults', Math.min(10, anchor.adults + 1))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Enfants</label>
                  <button
                    type="button"
                    onClick={addChild}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors w-full"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un enfant</span>
                  </button>
                </div>
              </div>

              {anchor.children.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {anchor.children.map((age, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-gray-400">Enfant {i + 1}</span>
                      <select
                        value={age}
                        onChange={(e) => updateChildAge(i, Number(e.target.value))}
                        className="bg-transparent text-xs text-white focus:outline-none"
                      >
                        {Array.from({ length: 18 }, (_, a) => (
                          <option key={a} value={a}>{a} ans</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeChild(i)} className="text-gray-500 hover:text-red-400 ml-1">
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Price + Stars + Score */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Prix / nuit *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="120"
                      value={anchor.pricePerNight || ''}
                      onChange={(e) => setField('pricePerNight', Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Devise</label>
                  <select
                    value={anchor.currency}
                    onChange={(e) => setField('currency', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="EUR">€ EUR</option>
                    <option value="USD">$ USD</option>
                    <option value="GBP">£ GBP</option>
                    <option value="BRL">R$ BRL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Note Booking</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="8.2"
                    value={anchor.bookingScore || ''}
                    onChange={(e) => setField('bookingScore', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Stars */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Nombre d&apos;étoiles</label>
                <div className="flex gap-1.5">
                  {STAR_COUNT.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setField('stars', n)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          n <= anchor.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-400 ml-2 self-center">
                    {anchor.stars} étoile{anchor.stars > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced: Services + Price range */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-white">Services &amp; Paramètres de recherche</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-5 pb-5 space-y-5 border-t border-gray-800">
                {/* Services */}
                <div className="pt-4">
                  <label className="text-xs text-gray-400 mb-2 block">Services inclus dans votre réservation</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleService(id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          anchor.services.includes(id)
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-400">Fourchette de prix</label>
                    <span className="text-xs font-semibold text-amber-400">±{priceRange}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  {anchor.pricePerNight > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>
                        Min: {anchor.currency === 'EUR' ? '€' : '$'}
                        {Math.round(anchor.pricePerNight * (1 - priceRange / 100))}
                      </span>
                      <span>
                        Max: {anchor.currency === 'EUR' ? '€' : '$'}
                        {Math.round(anchor.pricePerNight * (1 + priceRange / 100))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20 disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                <span>Recherche en cours…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Trouver de meilleures offres</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
