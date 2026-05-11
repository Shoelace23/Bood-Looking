import { AnchorHotel, PriceCategory } from './types';

export function calculateAnchorVFM(anchor: AnchorHotel): number {
  const ratingScore = anchor.bookingScore * 10;
  const starsScore = anchor.stars * 20;
  const priceScore = 50;
  return Math.round(ratingScore * 0.45 + starsScore * 0.20 + priceScore * 0.35);
}

export function calculateVFMScore(
  hotel: { pricePerNight: number; stars: number; bookingScore: number; discount?: number },
  anchor: AnchorHotel
): number {
  const priceRatio = anchor.pricePerNight / hotel.pricePerNight;
  const priceScore = Math.min(100, Math.max(0, 50 * priceRatio));
  const ratingScore = hotel.bookingScore * 10;
  const starsScore = hotel.stars * 20;
  const discountBonus = hotel.discount ? Math.min(hotel.discount * 2, 20) : 0;

  return Math.round(
    priceScore * 0.30 +
    ratingScore * 0.40 +
    starsScore * 0.15 +
    discountBonus * 0.15
  );
}

export function getPriceCategory(pricePerNight: number): PriceCategory {
  if (pricePerNight < 100) return 'excellent';
  if (pricePerNight < 130) return 'good';
  if (pricePerNight < 160) return 'high';
  return 'premium';
}

export function getMarkerColor(category: PriceCategory): string {
  switch (category) {
    case 'excellent': return '#10b981';
    case 'good': return '#14b8a6';
    case 'high': return '#f97316';
    case 'premium': return '#a855f7';
    case 'unavailable': return '#ef4444';
  }
}

export function isBetterDeal(
  hotel: { pricePerNight: number; bookingScore: number; stars: number },
  anchor: AnchorHotel
): boolean {
  const priceRatio = hotel.pricePerNight / anchor.pricePerNight;
  const scoreDiff = hotel.bookingScore - anchor.bookingScore;
  const starsDiff = hotel.stars - anchor.stars;

  return (
    (scoreDiff > 0.3 && priceRatio <= 1.05) ||
    (scoreDiff >= 0 && priceRatio < 0.90) ||
    (starsDiff > 0 && priceRatio <= 1.05) ||
    (scoreDiff >= 0 && starsDiff >= 0 && priceRatio < 1.0)
  );
}

export function getVFMLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 78) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (score >= 65) return { label: 'Très bon', color: 'text-teal-400', bg: 'bg-teal-400/10' };
  if (score >= 52) return { label: 'Bon', color: 'text-blue-400', bg: 'bg-blue-400/10' };
  if (score >= 38) return { label: 'Moyen', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  return { label: 'Faible', color: 'text-red-400', bg: 'bg-red-400/10' };
}

export function formatPriceDelta(delta: number): { text: string; positive: boolean } {
  if (Math.abs(delta) < 1) return { text: '=', positive: true };
  const sign = delta < 0 ? '' : '+';
  return { text: `${sign}${delta.toFixed(0)}%`, positive: delta < 0 };
}

export function formatScoreDelta(delta: number): { text: string; positive: boolean } {
  if (Math.abs(delta) < 0.05) return { text: '=', positive: true };
  const sign = delta > 0 ? '+' : '';
  return { text: `${sign}${delta.toFixed(1)}`, positive: delta > 0 };
}

export function getNights(checkinDate: string, checkoutDate: string): number {
  const d1 = new Date(checkinDate);
  const d2 = new Date(checkoutDate);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
