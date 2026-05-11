export interface ItineraryStop {
  id: number;
  hotelName: string;
  city: string;
  pricePerNight: number | null;
  adults: number;
  children: number;
  childAge: number;
  bookingScore: number | null;
  bookingUrl: string | null;
  arrivalDate: string;   // ISO: YYYY-MM-DD
  departureDate: string; // ISO: YYYY-MM-DD
  nights: number;
  totalPrice: number | null;
}

function parseDate(d: string): string {
  // "26/07/2026" → "2026-07-26"
  const [day, month, year] = d.split('/');
  return `${year}-${month}-${day}`;
}

function computeNights(arrival: string, departure: string): number {
  return Math.round(
    (new Date(departure).getTime() - new Date(arrival).getTime()) / (1000 * 60 * 60 * 24)
  );
}

const rawStops = [
  {
    hotelName: 'Atlantis Copacabana Hotel',
    city: 'Rio de Janeiro',
    pricePerNight: 175,
    bookingScore: 8.6,
    bookingUrl: 'https://www.booking.com/hotel/br/atlantis-copacabana.fr.html',
    arrival: '26/07/2026',
    departure: '31/07/2026',
  },
  {
    hotelName: 'Pousada Quarto Crescente',
    city: 'Trancoso',
    pricePerNight: 249,
    bookingScore: 9.9,
    bookingUrl: 'https://www.booking.com/hotel/br/pousada-quarto-crescente-trancoso.fr.html',
    arrival: '31/07/2026',
    departure: '03/08/2026',
  },
  {
    hotelName: 'Samuel',
    city: 'Caraíva',
    pricePerNight: null,
    bookingScore: null,
    bookingUrl: null,
    arrival: '03/08/2026',
    departure: '07/08/2026',
  },
  {
    hotelName: 'Praiabella Hotel',
    city: 'São Luís',
    pricePerNight: 162,
    bookingScore: 8.7,
    bookingUrl: 'https://www.booking.com/hotel/br/solare-praiabella.fr.html',
    arrival: '07/08/2026',
    departure: '08/08/2026',
  },
  {
    hotelName: 'Pousada do Buriti',
    city: 'Barreirinhas',
    pricePerNight: 289,
    bookingScore: 9.1,
    bookingUrl: 'https://www.booking.com/hotel/br/pousada-do-buriti.fr.html',
    arrival: '08/08/2026',
    departure: '09/08/2026',
  },
  {
    hotelName: 'Casa LuMar',
    city: 'Atins',
    pricePerNight: 352,
    bookingScore: 9.8,
    bookingUrl: 'https://www.booking.com/hotel/br/casa-lumar-atins.fr.html',
    arrival: '09/08/2026',
    departure: '11/08/2026',
  },
  {
    hotelName: 'Oceane Norte Hotel',
    city: 'Parnaíba',
    pricePerNight: 89,
    bookingScore: 8.8,
    bookingUrl: 'https://www.booking.com/hotel/br/oceane-norte.fr.html',
    arrival: '11/08/2026',
    departure: '12/08/2026',
  },
  {
    hotelName: 'Mym Dunas',
    city: 'Jericoacoara',
    pricePerNight: 120,
    bookingScore: 9.3,
    bookingUrl: 'https://www.booking.com/hotel/br/pousada-la-luna-jericoacoara.fr.html',
    arrival: '12/08/2026',
    departure: '16/08/2026',
  },
  {
    hotelName: 'Praiano Hotel',
    city: 'Fortaleza',
    pricePerNight: 164,
    bookingScore: 9.0,
    bookingUrl: 'https://www.booking.com/hotel/br/praiano-fortaleza.fr.html',
    arrival: '16/08/2026',
    departure: '17/08/2026',
  },
  {
    hotelName: 'Onda Azul',
    city: 'Salvador de Bahia',
    pricePerNight: 78,
    bookingScore: 8.4,
    bookingUrl: 'https://www.booking.com/hotel/br/onda-azul-valenca.fr.html',
    arrival: '17/08/2026',
    departure: '18/08/2026',
  },
  {
    hotelName: 'Pouso da Maré',
    city: 'Ilha de Boipeba',
    pricePerNight: 143,
    bookingScore: 9.1,
    bookingUrl: 'https://www.booking.com/hotel/br/pousada-pouso-da-mare.fr.html',
    arrival: '18/08/2026',
    departure: '21/08/2026',
  },
  {
    hotelName: 'Bahiacafe Hotel',
    city: 'Salvador de Bahia',
    pricePerNight: 244,
    bookingScore: 9.0,
    bookingUrl: 'https://www.booking.com/hotel/br/bahiacafe.fr.html',
    arrival: '21/08/2026',
    departure: '22/08/2026',
  },
];

export const ITINERARY: ItineraryStop[] = rawStops.map((s, i) => {
  const arrival = parseDate(s.arrival);
  const departure = parseDate(s.departure);
  const nights = computeNights(arrival, departure);
  return {
    id: i + 1,
    hotelName: s.hotelName,
    city: s.city,
    pricePerNight: s.pricePerNight,
    adults: 3,
    children: 1,
    childAge: 15,
    bookingScore: s.bookingScore,
    bookingUrl: s.bookingUrl,
    arrivalDate: arrival,
    departureDate: departure,
    nights,
    totalPrice: s.pricePerNight !== null ? s.pricePerNight * nights : null,
  };
});

export const TRIP_START = ITINERARY[0].arrivalDate;
export const TRIP_END = ITINERARY[ITINERARY.length - 1].departureDate;
export const TRIP_NIGHTS = ITINERARY.reduce((s, h) => s + h.nights, 0);
export const TRIP_TOTAL = ITINERARY.reduce(
  (s, h) => s + (h.totalPrice ?? 0),
  0
);
