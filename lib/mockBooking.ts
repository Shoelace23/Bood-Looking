import {
  SearchParams,
  SearchResults,
  HotelResult,
  PriceCategory,
  AnchorHotel,
} from './types';
import {
  calculateVFMScore,
  calculateAnchorVFM,
  getPriceCategory,
  isBetterDeal,
  getNights,
} from './vfm';

// ─── MCP raw hotel shape (from Booking.com connector) ────────────────────────

export interface MCPHotel {
  name: string;
  coordinates?: { latitude: number; longitude: number };
  price_breakdown?: { gross_price: number; currency: string };
  review_score?: number;
  review_score_word?: string;
  review_nr?: number;
  class?: number;           // stars
  facilities_block?: { facilities?: Array<{ name: string }> };
  url?: string;
  main_photo_url?: string;
  address?: string;
  discount_amount?: number;
  discount_type?: string;
  // Booking.com connector may also return these directly:
  pricePerNight?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  stars?: number;
  bookingScore?: number;
  reviewCount?: number;
  imageUrl?: string;
  bookingUrl?: string;
}

export function transformMCPResults(
  raw: MCPHotel[],
  anchor: AnchorHotel
): SearchResults {
  const nights = getNights(anchor.checkinDate, anchor.checkoutDate);
  const anchorVfmScore = calculateAnchorVFM(anchor);

  const alternatives: HotelResult[] = raw
    .filter((h) => {
      const price = h.pricePerNight ?? h.price_breakdown?.gross_price ?? 0;
      return price > 0;
    })
    .map((h, idx) => {
      const pricePerNight =
        h.pricePerNight ?? h.price_breakdown?.gross_price ?? 0;
      const currency =
        h.currency ?? h.price_breakdown?.currency ?? anchor.currency;
      const stars = h.stars ?? h.class ?? 0;
      const bookingScore = h.bookingScore ?? h.review_score ?? 0;
      const reviewCount = h.reviewCount ?? h.review_nr ?? 0;
      const lat =
        h.lat ?? h.coordinates?.latitude ?? 0;
      const lng =
        h.lng ?? h.coordinates?.longitude ?? 0;

      const rawFacilities =
        h.facilities_block?.facilities?.map((f) => f.name.toLowerCase()) ?? [];
      const facilities = mapFacilities(rawFacilities);

      const discount = h.discount_amount
        ? Math.round(h.discount_amount)
        : undefined;

      const totalPrice = pricePerNight * nights;
      const priceCategory: PriceCategory = getPriceCategory(pricePerNight);
      const vfmScore = calculateVFMScore(
        { pricePerNight, stars, bookingScore, discount },
        anchor
      );
      const priceVsAnchor =
        ((pricePerNight - anchor.pricePerNight) / anchor.pricePerNight) * 100;
      const scoreVsAnchor = bookingScore - anchor.bookingScore;
      const starsVsAnchor = stars - anchor.stars;
      const betterDeal = isBetterDeal(
        { pricePerNight, bookingScore, stars },
        anchor
      );

      const bookingUrl =
        h.bookingUrl ??
        h.url ??
        buildBookingSearchUrl(
          h.name,
          anchor.checkinDate,
          anchor.checkoutDate,
          anchor.adults,
          anchor.children
        );

      return {
        id: `mcp-${idx}`,
        name: h.name,
        address: h.address ?? '',
        lat,
        lng,
        pricePerNight,
        currency,
        totalPrice,
        nights,
        stars,
        bookingScore,
        reviewCount,
        facilities,
        imageUrl: h.imageUrl ?? h.main_photo_url ?? '',
        bookingUrl,
        discount,
        isAvailable: true,
        vfmScore,
        anchorVfmScore,
        priceVsAnchor,
        scoreVsAnchor,
        starsVsAnchor,
        isBetterDeal: betterDeal,
        priceCategory,
      };
    })
    .sort((a, b) => b.vfmScore - a.vfmScore);

  // Best-guess anchor location: average of result coordinates
  const withCoords = alternatives.filter((h) => h.lat && h.lng);
  const anchorLat = withCoords.length
    ? withCoords.reduce((s, h) => s + h.lat, 0) / withCoords.length
    : 48.8588;
  const anchorLng = withCoords.length
    ? withCoords.reduce((s, h) => s + h.lng, 0) / withCoords.length
    : 2.347;

  return {
    anchor: {
      ...anchor,
      vfmScore: anchorVfmScore,
      nights,
      totalPrice: anchor.pricePerNight * nights,
      lat: anchorLat,
      lng: anchorLng,
    },
    alternatives,
    nights,
    searchedAt: new Date().toISOString(),
    isMock: false,
  };
}

function mapFacilities(raw: string[]): string[] {
  const map: Record<string, string> = {
    wifi: 'wifi', 'free wifi': 'wifi', 'wi-fi': 'wifi',
    breakfast: 'breakfast', 'petit-déjeuner': 'breakfast',
    pool: 'pool', 'swimming pool': 'pool', piscine: 'pool',
    spa: 'spa', 'spa & wellness': 'spa',
    gym: 'gym', fitness: 'gym', 'fitness centre': 'gym',
    parking: 'parking', 'free parking': 'parking',
    restaurant: 'restaurant',
    'room service': 'room_service',
    'airport shuttle': 'airport_shuttle',
    'air conditioning': 'ac', climatisation: 'ac',
    'pets allowed': 'pets',
  };
  const result = new Set<string>();
  raw.forEach((r) => {
    const key = Object.keys(map).find((k) => r.includes(k));
    if (key) result.add(map[key]);
  });
  return Array.from(result);
}

interface CityData {
  center: [number, number];
  area: string;
  hotels: RawHotel[];
}

interface RawHotel {
  name: string;
  address: string;
  latOffset: number;
  lngOffset: number;
  basePrice: number;
  stars: number;
  score: number;
  reviewCount: number;
  facilities: string[];
  discount?: number;
  imageSlug: string;
}

const CITY_DATA: Record<string, CityData> = {
  rio: {
    center: [-22.9711, -43.1823],
    area: 'Copacabana',
    hotels: [
      {
        name: 'Sofitel Rio de Janeiro Ipanema',
        address: 'Av. Vieira Souto 460, Ipanema',
        latOffset: 0.006,
        lngOffset: -0.009,
        basePrice: 199,
        stars: 5,
        score: 8.7,
        reviewCount: 3241,
        facilities: ['wifi', 'pool', 'spa', 'restaurant', 'room_service', 'gym', 'ac'],
        imageSlug: 'sofitel-rio',
      },
      {
        name: 'Orla Copacabana Hotel',
        address: 'Av. Atlântica 4122, Copacabana',
        latOffset: 0.0025,
        lngOffset: 0.004,
        basePrice: 106,
        stars: 4,
        score: 8.3,
        reviewCount: 2108,
        facilities: ['wifi', 'breakfast', 'restaurant', 'ac', 'room_service'],
        imageSlug: 'orla-copa',
      },
      {
        name: 'Ibis Rio de Janeiro Copacabana',
        address: 'Rua Ministro Viveiros de Castro 134',
        latOffset: -0.003,
        lngOffset: -0.006,
        basePrice: 85,
        stars: 3,
        score: 7.9,
        reviewCount: 5632,
        facilities: ['wifi', 'ac', 'parking'],
        discount: 12,
        imageSlug: 'ibis-copa',
      },
      {
        name: 'Windsor Atlantica Hotel',
        address: 'Av. Atlântica 1020, Copacabana',
        latOffset: 0.001,
        lngOffset: 0.01,
        basePrice: 147,
        stars: 5,
        score: 8.5,
        reviewCount: 1893,
        facilities: ['wifi', 'pool', 'restaurant', 'spa', 'room_service', 'gym'],
        imageSlug: 'windsor-atl',
      },
      {
        name: 'Golden Tulip Ipanema Plaza',
        address: 'Rua Farme de Amoedo 34, Ipanema',
        latOffset: 0.005,
        lngOffset: -0.014,
        basePrice: 91,
        stars: 4,
        score: 8.1,
        reviewCount: 1456,
        facilities: ['wifi', 'pool', 'breakfast', 'ac'],
        discount: 8,
        imageSlug: 'golden-tulip',
      },
      {
        name: 'Hotel Arpoador Inn',
        address: 'Rua Francisco Otaviano 177',
        latOffset: -0.005,
        lngOffset: 0.008,
        basePrice: 112,
        stars: 3,
        score: 8.4,
        reviewCount: 987,
        facilities: ['wifi', 'ac', 'sea_view'],
        imageSlug: 'arpoador-inn',
      },
      {
        name: 'Lemon Spirit Hostel & Hotel',
        address: 'Rua Cupertino Durão 56, Leblon',
        latOffset: 0.009,
        lngOffset: -0.02,
        basePrice: 78,
        stars: 3,
        score: 8.6,
        reviewCount: 724,
        facilities: ['wifi', 'breakfast', 'ac'],
        discount: 15,
        imageSlug: 'lemon-spirit',
      },
      {
        name: 'Pestana Rio Atlantica',
        address: 'Av. Atlântica 2964, Copacabana',
        latOffset: 0.0035,
        lngOffset: 0.0025,
        basePrice: 165,
        stars: 5,
        score: 8.2,
        reviewCount: 2341,
        facilities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'room_service'],
        imageSlug: 'pestana-rio',
      },
    ],
  },
  paris: {
    center: [48.8588, 2.3470],
    area: 'Centre',
    hotels: [
      {
        name: 'Hôtel Le Marais - Bastille',
        address: '3 Rue de Bretagne, 3e arr.',
        latOffset: 0.002,
        lngOffset: 0.008,
        basePrice: 118,
        stars: 4,
        score: 8.5,
        reviewCount: 1823,
        facilities: ['wifi', 'breakfast', 'ac'],
        imageSlug: 'le-marais',
      },
      {
        name: 'Ibis Paris Opéra',
        address: '3 Rue Louis Le Grand, 2e arr.',
        latOffset: 0.004,
        lngOffset: -0.003,
        basePrice: 89,
        stars: 3,
        score: 7.7,
        reviewCount: 4215,
        facilities: ['wifi', 'ac'],
        discount: 10,
        imageSlug: 'ibis-opera',
      },
      {
        name: 'Hôtel du Louvre',
        address: 'Pl. André Malraux, 1er arr.',
        latOffset: 0.001,
        lngOffset: -0.006,
        basePrice: 195,
        stars: 5,
        score: 9.0,
        reviewCount: 2987,
        facilities: ['wifi', 'spa', 'restaurant', 'room_service', 'gym', 'ac'],
        imageSlug: 'hotel-louvre',
      },
      {
        name: 'Novotel Paris Les Halles',
        address: '8 Place Marguerite de Navarre, 1er arr.',
        latOffset: 0.0015,
        lngOffset: -0.002,
        basePrice: 132,
        stars: 4,
        score: 8.2,
        reviewCount: 3102,
        facilities: ['wifi', 'pool', 'restaurant', 'gym', 'ac', 'parking'],
        discount: 7,
        imageSlug: 'novotel-halles',
      },
      {
        name: 'citizenM Paris Gare de Lyon',
        address: '5 Rue Hector Malot, 12e arr.',
        latOffset: -0.003,
        lngOffset: 0.013,
        basePrice: 95,
        stars: 4,
        score: 8.8,
        reviewCount: 5430,
        facilities: ['wifi', 'restaurant', 'ac', 'gym'],
        discount: 14,
        imageSlug: 'citizenm-gare',
      },
      {
        name: 'Hôtel de Fleurie Saint-Germain',
        address: '32 Rue Grégoire de Tours, 6e arr.',
        latOffset: -0.003,
        lngOffset: -0.008,
        basePrice: 145,
        stars: 4,
        score: 8.6,
        reviewCount: 891,
        facilities: ['wifi', 'breakfast', 'ac'],
        imageSlug: 'hotel-fleurie',
      },
      {
        name: 'Generator Paris',
        address: '9-11 Pl. du Colonel Fabien, 10e arr.',
        latOffset: 0.009,
        lngOffset: 0.003,
        basePrice: 72,
        stars: 3,
        score: 7.9,
        reviewCount: 6721,
        facilities: ['wifi', 'restaurant', 'bar'],
        discount: 18,
        imageSlug: 'generator-paris',
      },
      {
        name: 'Le Pavillon de la Reine',
        address: '28 Pl. des Vosges, 3e arr.',
        latOffset: 0.0025,
        lngOffset: 0.012,
        basePrice: 310,
        stars: 5,
        score: 9.3,
        reviewCount: 1201,
        facilities: ['wifi', 'spa', 'breakfast', 'ac', 'room_service'],
        imageSlug: 'pavillon-reine',
      },
    ],
  },
  barcelona: {
    center: [41.3851, 2.1734],
    area: 'Gothic Quarter',
    hotels: [
      {
        name: 'Hotel Arts Barcelona',
        address: 'Carrer de la Marina 19-21',
        latOffset: 0.001,
        lngOffset: 0.019,
        basePrice: 285,
        stars: 5,
        score: 9.1,
        reviewCount: 4102,
        facilities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'ac', 'sea_view'],
        imageSlug: 'hotel-arts',
      },
      {
        name: 'Generator Barcelona',
        address: 'Carrer de Còrsega 373, Eixample',
        latOffset: 0.007,
        lngOffset: -0.002,
        basePrice: 68,
        stars: 3,
        score: 8.1,
        reviewCount: 5892,
        facilities: ['wifi', 'restaurant', 'ac'],
        discount: 20,
        imageSlug: 'generator-bcn',
      },
      {
        name: 'Hotel Praktik Rambla',
        address: 'La Rambla 109, Eixample',
        latOffset: 0.003,
        lngOffset: -0.008,
        basePrice: 98,
        stars: 4,
        score: 8.7,
        reviewCount: 2341,
        facilities: ['wifi', 'ac', 'breakfast'],
        discount: 9,
        imageSlug: 'praktik-rambla',
      },
      {
        name: 'Catalonia Portal de l\'Àngel',
        address: 'Avda. Portal de l\'Àngel 17, Gothic Q.',
        latOffset: 0.002,
        lngOffset: -0.003,
        basePrice: 120,
        stars: 4,
        score: 8.4,
        reviewCount: 1987,
        facilities: ['wifi', 'ac', 'pool'],
        imageSlug: 'catalonia-angel',
      },
      {
        name: 'Vincci Maritimo',
        address: 'Litoral 36, La Vila Olímpica',
        latOffset: -0.001,
        lngOffset: 0.023,
        basePrice: 105,
        stars: 4,
        score: 8.3,
        reviewCount: 1654,
        facilities: ['wifi', 'pool', 'restaurant', 'ac', 'sea_view'],
        discount: 12,
        imageSlug: 'vincci-maritimo',
      },
      {
        name: 'W Barcelona',
        address: 'Pl. de la Rosa dels Vents 1',
        latOffset: -0.002,
        lngOffset: 0.017,
        basePrice: 245,
        stars: 5,
        score: 8.9,
        reviewCount: 6213,
        facilities: ['wifi', 'pool', 'spa', 'restaurant', 'gym', 'sea_view'],
        imageSlug: 'w-barcelona',
      },
    ],
  },
  default: {
    center: [48.8588, 2.3470],
    area: 'Centre',
    hotels: [
      {
        name: 'Grand Hotel Central',
        address: '12 Rue du Centre',
        latOffset: 0.003,
        lngOffset: 0.004,
        basePrice: 125,
        stars: 4,
        score: 8.3,
        reviewCount: 1200,
        facilities: ['wifi', 'breakfast', 'ac'],
        imageSlug: 'grand-central',
      },
      {
        name: 'City Inn Express',
        address: '5 Boulevard Principal',
        latOffset: -0.004,
        lngOffset: -0.003,
        basePrice: 79,
        stars: 3,
        score: 7.8,
        reviewCount: 3400,
        facilities: ['wifi', 'ac'],
        discount: 12,
        imageSlug: 'city-inn',
      },
      {
        name: 'Le Palais Boutique Hotel',
        address: '88 Avenue des Arts',
        latOffset: 0.005,
        lngOffset: -0.007,
        basePrice: 189,
        stars: 5,
        score: 9.1,
        reviewCount: 890,
        facilities: ['wifi', 'spa', 'restaurant', 'room_service', 'gym'],
        imageSlug: 'palais-boutique',
      },
      {
        name: 'Hotel Moderne',
        address: '34 Place de la République',
        latOffset: -0.002,
        lngOffset: 0.009,
        basePrice: 98,
        stars: 3,
        score: 8.0,
        reviewCount: 2100,
        facilities: ['wifi', 'ac', 'parking'],
        discount: 8,
        imageSlug: 'hotel-moderne',
      },
      {
        name: 'Radisson Blu City',
        address: '1 Esplanade',
        latOffset: 0.007,
        lngOffset: 0.001,
        basePrice: 145,
        stars: 4,
        score: 8.6,
        reviewCount: 1780,
        facilities: ['wifi', 'pool', 'restaurant', 'gym', 'ac'],
        imageSlug: 'radisson-city',
      },
      {
        name: 'Novotel Prestige',
        address: '22 Rue de la Gare',
        latOffset: -0.006,
        lngOffset: 0.005,
        basePrice: 112,
        stars: 4,
        score: 8.2,
        reviewCount: 2890,
        facilities: ['wifi', 'restaurant', 'ac', 'parking'],
        discount: 6,
        imageSlug: 'novotel-prestige',
      },
    ],
  },
};

function getCityData(destination: string): CityData {
  const d = destination.toLowerCase();
  if (d.includes('rio') || d.includes('copacabana') || d.includes('ipanema')) return CITY_DATA.rio;
  if (d.includes('paris')) return CITY_DATA.paris;
  if (d.includes('barcelona') || d.includes('barcelone')) return CITY_DATA.barcelona;
  return CITY_DATA.default;
}

function buildImageUrl(slug: string): string {
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${hash}/400/260`;
}

function buildBookingSearchUrl(
  hotelName: string,
  checkin: string,
  checkout: string,
  adults: number,
  children: number[]
): string {
  const params = new URLSearchParams({
    ss: hotelName,
    checkin: checkin,
    checkout: checkout,
    group_adults: String(adults),
    no_rooms: '1',
    group_children: String(children.length),
  });
  children.forEach((age) => params.append('age', String(age)));
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export async function searchHotels(params: SearchParams): Promise<SearchResults> {
  const { anchor, priceRangePercent } = params;
  const nights = getNights(anchor.checkinDate, anchor.checkoutDate);
  const anchorVfmScore = calculateAnchorVFM(anchor);

  const minPrice = anchor.pricePerNight * (1 - priceRangePercent / 100);
  const maxPrice = anchor.pricePerNight * (1 + priceRangePercent / 100);

  const cityData = getCityData(anchor.destination);
  const [baseLat, baseLng] = cityData.center;

  // Simulate network delay
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const alternatives: HotelResult[] = cityData.hotels
    .filter((h) => {
      const price = h.basePrice;
      return price >= minPrice && price <= maxPrice;
    })
    .map((h, idx) => {
      const pricePerNight = h.basePrice;
      const totalPrice = pricePerNight * nights;
      const priceCategory: PriceCategory = h.basePrice === 0 ? 'unavailable' : getPriceCategory(pricePerNight);
      const vfmScore = calculateVFMScore(
        { pricePerNight, stars: h.stars, bookingScore: h.score, discount: h.discount },
        anchor
      );
      const priceVsAnchor = ((pricePerNight - anchor.pricePerNight) / anchor.pricePerNight) * 100;
      const scoreVsAnchor = h.score - anchor.bookingScore;
      const starsVsAnchor = h.stars - anchor.stars;
      const betterDeal = isBetterDeal(
        { pricePerNight, bookingScore: h.score, stars: h.stars },
        anchor
      );

      return {
        id: `hotel-${idx}`,
        name: h.name,
        address: h.address,
        lat: baseLat + h.latOffset,
        lng: baseLng + h.lngOffset,
        pricePerNight,
        currency: anchor.currency,
        totalPrice,
        nights,
        stars: h.stars,
        bookingScore: h.score,
        reviewCount: h.reviewCount,
        facilities: h.facilities,
        imageUrl: buildImageUrl(h.imageSlug),
        bookingUrl: buildBookingSearchUrl(h.name, anchor.checkinDate, anchor.checkoutDate, anchor.adults, anchor.children),
        discount: h.discount,
        isAvailable: true,
        vfmScore,
        anchorVfmScore,
        priceVsAnchor,
        scoreVsAnchor,
        starsVsAnchor,
        isBetterDeal: betterDeal,
        priceCategory,
      };
    })
    .sort((a, b) => b.vfmScore - a.vfmScore);

  // Geocode anchor approximately
  const anchorLat = baseLat + (Math.random() - 0.5) * 0.006;
  const anchorLng = baseLng + (Math.random() - 0.5) * 0.006;

  return {
    anchor: {
      ...anchor,
      vfmScore: anchorVfmScore,
      nights,
      totalPrice: anchor.pricePerNight * nights,
      lat: anchorLat,
      lng: anchorLng,
    },
    alternatives,
    nights,
    searchedAt: new Date().toISOString(),
    isMock: true,
  };
}
