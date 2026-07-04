/**
 * Données réelles Booking.com — Salvador de Bahia (arrivée 21/08)
 * Recherche MCP effectuée le 04/07/2026
 * Ancre : Bahiacafe Hotel · 244 €/nuit · 3★ · note 8.9
 * Dates : 2026-08-21 → 2026-08-22 (1 nuit) · 3 adultes + 1 enfant (15 ans) · ±25 %
 * VFM calculé avec la formule exacte de lib/vfm.ts
 */

import { SearchResults } from '@/lib/types';

export const SALVADOR2_RESULTS: SearchResults = {
  nights: 1,
  searchedAt: '2026-07-04T10:00:00Z',
  isMock: false,

  anchor: {
    name: 'Bahiacafe Hotel',
    destination: 'Salvador de Bahia',
    checkinDate: '2026-08-21',
    checkoutDate: '2026-08-22',
    adults: 3,
    children: [15],
    bookingUrl: 'https://www.booking.com/hotel/br/bahiacafe.fr.html',
    pricePerNight: 244,
    currency: 'EUR',
    stars: 3,
    bookingScore: 8.9,
    services: [],
    vfmScore: 70,
    nights: 1,
    totalPrice: 244,
    lat: -12.974,
    lng: -38.508,
    address: 'Praça da Sé, 22, Centre historique, Salvador',
    reviewCount: 1476,
    facilities: ['ac', 'airport_shuttle', 'spa', 'wifi'],
  },

  alternatives: [
    {
      id: '278581',
      name: 'Pousada Suítes Do Pelô',
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      pricePerNight: 191.44,
      totalPrice: 191.44,
      nights: 1,
      currency: 'EUR',
      address: 'Ladeira De São Miguel 39',
      lat: -12.974209,
      lng: -38.507854,
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-suites-do-pelo.html?aid=8132308&checkin=2026-08-21&checkout=2026-08-22&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      imageUrl: '',
      facilities: ['ac', 'airport_shuttle', 'wifi'],
      isAvailable: true,
      vfmScore: 19,
      anchorVfmScore: 70,
      priceVsAnchor: -21.5,
      scoreVsAnchor: -8.9,
      starsVsAnchor: -3,
      isBetterDeal: false,
      priceCategory: 'premium',
    },
    {
      id: '13893749',
      name: 'Pousada Cores do Pelô',
      stars: 0,
      bookingScore: 0,
      reviewCount: 0,
      pricePerNight: 197.84,
      totalPrice: 197.84,
      nights: 1,
      currency: 'EUR',
      address: 'Largo do Pelourinho 05',
      lat: -12.971414,
      lng: -38.508358,
      bookingUrl: 'https://www.booking.com/hotel/br/pousada-cores-do-pelo-salvador.html?aid=8132308&checkin=2026-08-21&checkout=2026-08-22&no_rooms=1&group_adults=3&group_children=1&age=15&selected_currency=EUR',
      imageUrl: '',
      facilities: ['ac', 'restaurant', 'wifi'],
      isAvailable: true,
      vfmScore: 18,
      anchorVfmScore: 70,
      priceVsAnchor: -18.9,
      scoreVsAnchor: -8.9,
      starsVsAnchor: -3,
      isBetterDeal: false,
      priceCategory: 'premium',
    },
  ],
};
