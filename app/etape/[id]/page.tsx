import { ITINERARY } from '@/lib/itinerary';
import { notFound } from 'next/navigation';
import EtapeClient from './EtapeClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stop = ITINERARY.find((s) => s.id === parseInt(id, 10));
  if (!stop) notFound();
  return <EtapeClient stop={stop} />;
}

export function generateStaticParams() {
  return ITINERARY.map((s) => ({ id: String(s.id) }));
}
