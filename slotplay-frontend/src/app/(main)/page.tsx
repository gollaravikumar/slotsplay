/**
 * app/(main)/page.tsx — Homepage
 *
 * Design signature: split hero with real slot availability, sport quick-filters,
 * "How it works" numbered flow, feature band, and CTA.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ArrowRight, Star, Shield, Zap, Clock } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { useSports, useVenueList } from '@/hooks/useVenue';
import { formatDateLocal, getVenueSlots } from '@/lib/venue';
import type { Venue } from '@/types';

const HOW_IT_WORKS = [
  { step: '01', icon: Search, title: 'Find a turf', body: 'Search by sport, city, or distance. See real-time availability before you commit.' },
  { step: '02', icon: Clock,  title: 'Pick a slot',  body: 'Choose your date and time. Slots update live — no stale calendars.' },
  { step: '03', icon: Zap,    title: 'Pay via UPI',  body: 'One screenshot and your UTR number. Confirmed within minutes.' },
  { step: '04', icon: Shield, title: 'Show up & play', body: 'Your QR ticket is your entry. No printouts, no calls, just game time.' },
];

const FEATURES = [
  { value: 'Live', label: 'slot availability' },
  { value: 'UPI', label: 'payment workflow' },
  { value: 'QR', label: 'digital entry tickets' },
  { value: 'Verified', label: 'player reviews' },
];

const SPORT_STYLES: Record<string, { emoji: string; color: string }> = {
  cricket: { emoji: '🏏', color: 'from-green-600 to-green-800' },
  football: { emoji: '⚽', color: 'from-blue-600 to-blue-800' },
  badminton: { emoji: '🏸', color: 'from-amber-500 to-orange-600' },
  basketball: { emoji: '🏀', color: 'from-orange-500 to-red-600' },
  tennis: { emoji: '🎾', color: 'from-lime-600 to-teal-700' },
};

const SPORT_COLORS = [
  'from-green-600 to-green-800',
  'from-blue-600 to-blue-800',
  'from-amber-500 to-orange-600',
  'from-orange-500 to-red-600',
  'from-lime-600 to-teal-700',
];

function formatSlotTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function HomePage() {
  const router = useRouter();
  const { data: sports = [] } = useSports();
  const { data: venueData, isLoading: isLoadingVenues, error: venuesError } = useVenueList({
    page: 1,
    limit: 8,
    sortBy: 'rating',
  });
  const venues = venueData?.data ?? [];
  const today = new Date();
  const todayKey = formatDateLocal(today);
  const slotQueries = useQueries({
    queries: venues.map((venue: Venue) => ({
      queryKey: ['venue-slots', venue.id, todayKey],
      queryFn: () => getVenueSlots(venue.id, today),
      staleTime: 30_000,
      refetchInterval: 60_000,
    })),
  });
  const availableSlots = slotQueries.flatMap((query, index) =>
    (query.data ?? [])
      .filter(
        (slot) =>
          slot.isAvailable &&
          (!slot.startDateTime || Date.parse(slot.startDateTime) >= Date.now()),
      )
      .map((slot) => ({ slot, venue: venues[index] })),
  ).sort((a, b) => {
    const aTime = Date.parse(a.slot.startDateTime ?? `${todayKey}T${a.slot.startTime}`);
    const bTime = Date.parse(b.slot.startDateTime ?? `${todayKey}T${b.slot.startTime}`);
    return aTime - bTime;
  }).slice(0, 6);
  const slotsError = !!venuesError || slotQueries.some((query) => query.isError);
  const isLoadingSlots = isLoadingVenues || slotQueries.some((query) => query.isLoading);
  const spotlightSports = sports.slice(0, 5).map(
    (sport: { id: number; name: string }, index: number) => ({
      ...sport,
      ...(SPORT_STYLES[sport.name.toLowerCase()] ?? {
        emoji: '🏅',
        color: SPORT_COLORS[index % SPORT_COLORS.length],
      }),
    }),
  );

  const [search, setSearch] = useState('');
  const [city, setCity]     = useState('');
  const [sportId, setSportId] = useState('');

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (search)  p.set('search', search);
    if (city)    p.set('city', city);
    if (sportId) p.set('sportId', sportId);
    router.push(`/venues?${p}`);
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 w-[400px] h-[400px] rounded-full bg-brand-800/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: headline + search */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 rounded-full px-3 py-1 text-brand-400 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Find your next game
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
                Reserve<br />
                <span className="relative inline-block">
                  your game
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-brand-500 rounded-full" />
                </span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
                Book cricket turfs, football grounds, and more — in under 60 seconds. Real-time availability. UPI payments. QR tickets.
              </p>

              {/* Search box */}
              <form onSubmit={go} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Sport chips */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sport</label>
                    <select
                      value={sportId}
                      onChange={e => setSportId(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">All sports</option>
                      {sports.map((s: { id: number; name: string }) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      <MapPin size={11} className="inline mr-1" />City
                    </label>
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Hyderabad, Bangalore…"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Keyword row */}
                <div className="flex gap-2">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Venue name or area…"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </form>

              {/* Popular sport chips */}
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="text-xs text-gray-600 self-center">Quick:</span>
                {sports.slice(0, 3).map((sport: { id: number; name: string }) => (
                  <button
                    key={sport.id}
                    onClick={() => router.push(`/venues?sportId=${sport.id}`)}
                    className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300 hover:border-brand-500 hover:text-brand-400 transition-colors"
                  >
                    {sport.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: live slots */}
            <div>
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Today&apos;s available slots</p>
                    <p className="text-white font-bold text-lg">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    Updates every minute
                  </span>
                </div>

                <div className="space-y-2">
                  {availableSlots.map(({ slot, venue }) => (
                    <Link
                      key={slot.id}
                      href={`/venues/${venue.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-brand-700/50 bg-brand-950/30 hover:border-brand-500 transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-gray-300 w-20 flex-shrink-0">
                        {formatSlotTime(slot.startTime)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{venue.name}</p>
                        <p className="text-xs text-gray-500">
                          {venue.sports?.[0]?.name ?? 'Sports'} · ₹{slot.pricePerHour}/hr
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-brand-900/60 text-brand-400">
                        Open
                      </span>
                    </Link>
                  ))}
                  {isLoadingSlots && (
                    <p className="py-8 text-center text-sm text-gray-400">Checking today&apos;s availability…</p>
                  )}
                  {!isLoadingSlots && slotsError && availableSlots.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400">
                      Live availability is temporarily unavailable.
                    </p>
                  )}
                  {!isLoadingSlots && !slotsError && availableSlots.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400">
                      No upcoming slots found today. Check another date or venue.
                    </p>
                  )}
                </div>

                <Link
                  href="/venues"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold transition-colors"
                >
                  View all available slots <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature band ─────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {FEATURES.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              From search to slot in 60 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, body }) => (
              <div key={step} className="relative group">
                {/* Connector line (desktop only) */}
                <div className="hidden lg:block absolute top-8 left-[calc(50%+32px)] right-0 h-px border-t-2 border-dashed border-gray-200 dark:border-gray-800 group-last:hidden" />
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 h-full hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 flex items-center justify-center flex-shrink-0">
                      <Icon size={22} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <span className="text-4xl font-black text-gray-100 dark:text-gray-800 leading-none mt-1">{step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sport spotlight cards ─────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">By sport</p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">What do you play?</h2>
            </div>
            <Link href="/venues" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              All sports <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {spotlightSports.map(({ id, name, emoji, color }) => (
              <Link
                key={id}
                href={`/venues?sportId=${id}`}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 text-white hover:scale-105 hover:shadow-xl transition-all group`}
              >
                <div className="text-4xl mb-3">{emoji}</div>
                <p className="font-bold text-sm">{name}</p>
                <p className="text-white/70 text-xs mt-0.5">Book now →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-3">Find a venue near you</p>
            <h2 className="text-4xl font-black text-white tracking-tight mb-4">
              Your next game starts here
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
              Compare venues, check availability, and book your next game online.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/venues"
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
              >
                Browse turfs <ArrowRight size={16} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
