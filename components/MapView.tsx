'use client';

import dynamic from 'next/dynamic';
import { SearchResults } from '@/lib/types';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Chargement de la carte…</p>
      </div>
    </div>
  ),
});

interface Props {
  results: SearchResults;
  selectedHotelId: string | null;
  onHotelSelect: (id: string | null) => void;
}

export default function MapView(props: Props) {
  return <MapInner {...props} />;
}
