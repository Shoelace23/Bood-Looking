export interface AnchorHotel {
  name: string;
  destination: string;
  checkinDate: string;
  checkoutDate: string;
  adults: number;
  children: number[];
  bookingUrl: string;
  pricePerNight: number;
  currency: string;
  stars: number;
  bookingScore: number;
  services: string[];
}

export type PriceCategory = 'excellent' | 'good' | 'high' | 'premium' | 'unavailable';

export interface HotelResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  currency: string;
  totalPrice: number;
  nights: number;
  stars: number;
  bookingScore: number;
  reviewCount: number;
  facilities: string[];
  imageUrl: string;
  bookingUrl: string;
  discount?: number;
  isAvailable: boolean;
  vfmScore: number;
  anchorVfmScore: number;
  priceVsAnchor: number;
  scoreVsAnchor: number;
  starsVsAnchor: number;
  isBetterDeal: boolean;
  priceCategory: PriceCategory;
}

export interface AnchorWithVFM extends AnchorHotel {
  vfmScore: number;
  nights: number;
  totalPrice: number;
  lat: number;
  lng: number;
  address?: string;
  reviewCount?: number;
  facilities?: string[];
}

export interface SearchParams {
  anchor: AnchorHotel;
  priceRangePercent: number;
  minScore?: number;
}

export interface SearchResults {
  anchor: AnchorWithVFM;
  alternatives: HotelResult[];
  nights: number;
  searchedAt: string;
  isMock: boolean;
}

export const SERVICES_OPTIONS = [
  { id: 'wifi', label: 'WiFi inclus' },
  { id: 'breakfast', label: 'Petit-déjeuner' },
  { id: 'pool', label: 'Piscine' },
  { id: 'spa', label: 'Spa & Bien-être' },
  { id: 'gym', label: 'Salle de sport' },
  { id: 'parking', label: 'Parking gratuit' },
  { id: 'sea_view', label: 'Vue mer' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'room_service', label: 'Room service' },
  { id: 'airport_shuttle', label: 'Navette aéroport' },
  { id: 'ac', label: 'Climatisation' },
  { id: 'pets', label: 'Animaux acceptés' },
] as const;
