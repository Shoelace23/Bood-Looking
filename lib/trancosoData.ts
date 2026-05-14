/**
 * Données réelles Booking.com — Trancoso, Bahia
 * Recherche MCP effectuée le 11/05/2026
 * Ancre : Pousada Quarto Crescente · 249 €/nuit · non classée · note 9.9
 * Dates : 31/07/2026 → 03/08/2026 (3 nuits) · 3 adultes + 1 enfant (15 ans)
 * Prix MCP = total séjour ÷ 3 pour obtenir le prix/nuit
 * VFM calculé avec la formule exacte de lib/vfm.ts
 *
 * Note : La majorité des pousadas de Trancoso n'ont pas de classement étoiles
 * officiel ni de note Booking.com remontée par le MCP. La Pousada Seis e Meia
 * est la seule alternative avec données complètes (4★, 9.2, 255 avis).
 * L'ancre (9.9) confirme un excellent rapport qualité-prix.
 */

import { SearchResults } from '@/lib/types';

// ── Formules (lib/vfm.ts) ────────────────────────────────────────────
// anchorVFM  = bookingScore*10*0.45 + stars*20*0.20 + 50*0.35
// Anchor 9.9 score, 0★ → 99*0.45 + 0 + 17.5 = 44.55 + 17.5 = 62
//
// hotelVFM   = priceScore*0.30 + bookingScore*10*0.40 + stars*20*0.15 + discountBonus*0.15
// priceScore = min(100, 50 * anchorPrice / hotelPrice)
//
// Seis e Meia (215€, 4★, 9.2) :
//   priceScore = min(100, 50*249/215) = 57.9
//   → 57.9*0.30 + 92*0.40 + 80*0.15 = 17.4 + 36.8 + 12.0 = 66
//
// Hôtels sans note (score=0, stars=0) : VFM ≈ priceScore * 0.30 uniquement

export const TRANCOSO_RESULTS: SearchResults = {
  nights: 3,
  searchedAt: '2026-05-11T12:00:00Z',
  isMock: false,

  anchor: {
    name: 'Pousada Quarto Crescente',
    destination: 'Trancoso',
    checkinDate: '2026-07-31',
    checkoutDate: '2026-08-03',
    adults: 3,
    children: [15],
    bookingUrl: 'https://www.booking.com/hotel/br/pousada-quarto-crescente-trancoso.fr.html',
    pricePerNight: 249,
    currency: 'EUR',
    stars: 0,
    bookingScore: 9.9,
    services: ['pool', 'wifi', 'ac'],
    // AnchorWithVFM extras
    vfmScore: 62,
    nights: 3,
    totalPrice: 747,
    lat: -16.5905,
    lng: -39.0944,
    address: 'Rua Nove de Agosto, s/n, Trancoso',
    reviewCount: 0,
    facilities: ['ac', 'airport_shuttle', 'gym', 'parking', 'pool', 'spa', 'wifi'],
  },

  alternatives: [
    // ── 1. Pousada Seis e Meia — seule alternative avec données rating complètes ──
    // 646€ total / 3 nuits = 215€/nuit · 4★ · 9.2 · 255 avis
    // VFM = 57.9*0.30 + 92*0.40 + 80*0.15 = 66 → meilleure offre (starsDiff=4, priceRatio=0.86 ≤ 1.05)
    {
      id: '1551744',
      name: 'Pousada Seis e Meia',
      address: 'Avenida Principal, 275, Trancoso',
      lat: -16.590383,
      lng: -39.100249,
      pricePerNight: 215,
      currency: 'EUR',
      totalPrice: 645,
      nights: 3,
      stars: 4,
      bookingScore: 9.2,
      reviewCount: 255,
      facilities: ['parking', 'pool', 'wifi', 'spa', 'airport_shuttle', 'ac'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-seis-e-meia.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 66,
      anchorVfmScore: 62,
      priceVsAnchor: -13.7,
      scoreVsAnchor: -0.7,
      starsVsAnchor: 4,
      isBetterDeal: true,
      priceCategory: 'premium',
    },

    // ── 2. Pousada Jequitibá — 304€ / 3 = 102€/nuit · non classée · non notée ──
    // VFM = min(100, 50*249/102)*0.30 = 100*0.30 = 30
    {
      id: '575107',
      name: 'Pousada Jequitibá',
      address: 'Rua do Bosque, s/n, Trancoso',
      lat: -16.590399,
      lng: -39.095857,
      pricePerNight: 102,
      currency: 'EUR',
      totalPrice: 306,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['wifi', 'ac', 'room_service'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-jequitiba.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 30,
      anchorVfmScore: 62,
      priceVsAnchor: -59.0,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'good',
    },

    // ── 3. Pousada Villa Encantos do Mar — 310€ / 3 = 103€/nuit · non classée ──
    // VFM = 100*0.30 = 30
    {
      id: '15073200',
      name: 'Pousada Villa Encantos do Mar',
      address: 'R. Antônio Florentino, 15, Trancoso',
      lat: -16.594895,
      lng: -39.098524,
      pricePerNight: 103,
      currency: 'EUR',
      totalPrice: 309,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'airport_shuttle', 'ac'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/villa-encantos-do-mar-charming-house-in-trancoso.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 30,
      anchorVfmScore: 62,
      priceVsAnchor: -58.6,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'good',
    },

    // ── 4. Pousada Pandoro — 349€ / 3 = 116€/nuit · non classée ──
    // VFM = 100*0.30 = 30
    {
      id: '1551744-pandoro',
      name: 'Pousada Pandoro',
      address: 'Estrada de Trancoso nº 117, Centro, Trancoso',
      lat: -16.590096,
      lng: -39.099895,
      pricePerNight: 116,
      currency: 'EUR',
      totalPrice: 348,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'ac'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-pandoro.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 30,
      anchorVfmScore: 62,
      priceVsAnchor: -53.4,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'good',
    },

    // ── 5. Pousada Calypso — 439€ / 3 = 146€/nuit · non classée ──
    // VFM = min(100, 50*249/146)*0.30 = 85.3*0.30 = 26
    {
      id: '258003',
      name: 'Pousada Calypso',
      address: 'Parque Municipal de Trancoso, s/nº, Trancoso',
      lat: -16.590712,
      lng: -39.096237,
      pricePerNight: 146,
      currency: 'EUR',
      totalPrice: 438,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'airport_shuttle', 'pets', 'ac', 'spa'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-calypso.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 26,
      anchorVfmScore: 62,
      priceVsAnchor: -41.4,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'high',
    },

    // ── 6. Pousada do Bosque — 573€ / 3 = 191€/nuit · piscine + spa + navette ──
    // VFM = min(100, 50*249/191)*0.30 = 65.2*0.30 = 20
    {
      id: '258315',
      name: 'Pousada do Bosque',
      address: 'Rua da Cuba, nº 1 - Centro, Trancoso',
      lat: -16.591374,
      lng: -39.096241,
      pricePerNight: 191,
      currency: 'EUR',
      totalPrice: 573,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'airport_shuttle', 'pets', 'ac', 'spa'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-do-bosque.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 20,
      anchorVfmScore: 62,
      priceVsAnchor: -23.3,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'premium',
    },

    // ── 7. Mata N'ativa Pousada — 656€ / 3 = 219€/nuit · restaurant + piscine ──
    // VFM = min(100, 50*249/219)*0.30 = 56.8*0.30 = 17
    {
      id: '333108',
      name: "Mata N'ativa Pousada",
      address: 'Estrada para Arraial, s/n, Trancoso',
      lat: -16.586382,
      lng: -39.094261,
      pricePerNight: 219,
      currency: 'EUR',
      totalPrice: 657,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'restaurant', 'ac'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/mata-na-ativa-pousada.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 17,
      anchorVfmScore: 62,
      priceVsAnchor: -12.0,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'premium',
    },

    // ── 8. Pousada Mundo Verde — 721€ / 3 = 240€/nuit · piscine vue + activités ──
    // VFM = min(100, 50*249/240)*0.30 = 51.9*0.30 = 16
    {
      id: '260790',
      name: 'Pousada Mundo Verde',
      address: 'Rua do Telegrafo, 43, Trancoso',
      lat: -16.587308,
      lng: -39.097753,
      pricePerNight: 240,
      currency: 'EUR',
      totalPrice: 720,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'airport_shuttle', 'pets', 'ac'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-mundo-verde.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 16,
      anchorVfmScore: 62,
      priceVsAnchor: -3.6,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'premium',
    },

    // ── 9. Casa da Glória Trancoso — 756€ / 3 = 252€/nuit · luxe Quadrado ──
    // VFM = min(100, 50*249/252)*0.30 = 49.4*0.30 = 15
    {
      id: '1283028',
      name: 'Casa da Glória Trancoso',
      address: 'Praça do Quadrado, s/n, Trancoso',
      lat: -16.589525,
      lng: -39.094540,
      pricePerNight: 252,
      currency: 'EUR',
      totalPrice: 756,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['pool', 'wifi', 'restaurant', 'airport_shuttle', 'ac', 'room_service'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/casa-da-gloria-trancoso.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 15,
      anchorVfmScore: 62,
      priceVsAnchor: 1.2,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'premium',
    },

    // ── 10. Pousada Le Refuge — 772€ / 3 = 257€/nuit · plage + yoga + golf ──
    // VFM = min(100, 50*249/257)*0.30 = 48.4*0.30 = 15
    {
      id: '1134554',
      name: 'Pousada Le Refuge',
      address: 'Caminho da Praia, s/n, Trancoso',
      lat: -16.592412,
      lng: -39.091300,
      pricePerNight: 257,
      currency: 'EUR',
      totalPrice: 771,
      nights: 3,
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      facilities: ['parking', 'pool', 'wifi', 'airport_shuttle', 'ac', 'spa'],
      imageUrl: '',
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-le-refuge-trancoso.html?aid=8132308&checkin=2026-07-31&checkout=2026-08-03&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      isAvailable: true,
      vfmScore: 15,
      anchorVfmScore: 62,
      priceVsAnchor: 3.2,
      scoreVsAnchor: -9.9,
      starsVsAnchor: 0,
      isBetterDeal: false,
      priceCategory: 'premium',
    },
  ],
};
