import React, { useState } from 'react';
import supabase from '../../lib/supabase';
import Container from '../../components/ui/Container';
import { Search, AlertTriangle, Loader2, Footprints, Package, ArrowRight, ShieldCheck, MapPin, Clock } from 'lucide-react';
import type { ShipmentStatusUpdate } from '../../lib/types';

export const Transport: React.FC = () => {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [updates, setUpdates] = useState<ShipmentStatusUpdate[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a valid tracking ID.');
      setShipment(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShipment(null);

      // The RPC returns the shipment (with pet) and its updates, and only for
      // TRACKING_ACTIVE / DELIVERED shipments; anything else is a generic not-found.
      const { data, error: dbError } = await supabase.rpc('get_shipment_tracking', {
        p_tracking_id: cleanId,
      });
      if (dbError) throw dbError;

      if (!data?.shipment) {
        setError("We couldn't find an active shipment with that tracking ID. Please verify the ID from your confirmation email and try again.");
        return;
      }

      setUpdates(data.updates || []);
      setShipment(data.shipment);
    } catch (err: any) {
      console.error('Error fetching tracking info:', err);
      setError("We couldn't find an active shipment with that tracking ID. Please verify the ID from your confirmation email and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20 bg-slate-50 min-h-screen text-slate-800 font-sans relative overflow-hidden">
      {/* Ambient Aurora Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="max-w-3xl space-y-8 relative z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Rescue4paws Logistics Gateway
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 tracking-tight">
            Track Pet Companion Journey
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Real-time verified transit monitoring for foster relocations, rescue dispatches, and forever-home deliveries.
          </p>
        </div>

        {/* Tracking Search Input Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider select-none">
                Shipment Tracking ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. TR-2026-9938"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-3.5 px-4 pr-12 text-sm font-mono font-bold placeholder-slate-400 text-slate-900 uppercase outline-none transition-all"
                  required
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Querying Transit Database...
                </>
              ) : (
                'Track Shipment Status'
              )}
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs text-left flex items-start gap-3 mt-4 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-rose-900 block">Tracking Notice</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Ship a Package Card */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-center sm:text-left text-white shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display font-extrabold text-lg text-white">Need to Ship Something?</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Send pets, supplies, essential items, and medical documentation domestically or internationally. Instant quote by route.
                </p>
              </div>
            </div>
            <a
              href={import.meta.env.VITE_TRANSPORT_SUBDOMAIN_URL || 'https://ship.rescue4paws.org'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full shadow-lg shadow-indigo-500/25 transition-all shrink-0 active:scale-95"
            >
              Ship a Package <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tracking Details Display */}
        {shipment && (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6 text-left animate-in fade-in duration-300">
            {/* Docket Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Verified Dispatch Number
                </span>
                <h2 className="font-mono text-xl font-bold text-slate-900 tracking-wide">
                  {shipment.tracking_id}
                </h2>
              </div>
              <div>
                {shipment.status === 'DELIVERED' ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Delivered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                    In Transit
                  </span>
                )}
              </div>
            </div>

            {/* Passenger Pet Profile */}
            {shipment.pets && (
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                  {shipment.pets.photo_url || (shipment.pets.photos && shipment.pets.photos.length > 0) ? (
                    <img
                      src={shipment.pets.photo_url || shipment.pets.photos[0]}
                      alt={shipment.pets.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium">
                      No Photo
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Travel Passenger
                  </span>
                  <span className="font-display text-lg font-extrabold text-slate-900 block">
                    {shipment.pets.name}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {shipment.pets.breed || 'Companion Mix'} • {shipment.pets.age || 'Unknown Age'}
                  </span>
                </div>
              </div>
            )}

            {/* Progress Stepper / Real Shipment Timeline */}
            <div className="space-y-6 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Transit Timeline & Status Updates
              </h3>

              {updates.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs text-slate-600 italic">
                  Your companion's journey is currently being prepared. Real-time checkpoints will appear here once underway.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 border-l-2 border-indigo-100 py-1 ml-2">
                  {updates.map((update: ShipmentStatusUpdate) => {
                    const isDelivered = update.status === 'DELIVERED';
                    const isHoldOrCancelled = ['ON_HOLD', 'CANCELLED'].includes(update.status);
                    
                    let dotColor = 'bg-indigo-600 border-white ring-4 ring-indigo-100';
                    let labelClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';

                    if (isHoldOrCancelled) {
                      dotColor = 'bg-rose-600 border-white ring-4 ring-rose-100';
                      labelClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    } else if (isDelivered) {
                      dotColor = 'bg-emerald-600 border-white ring-4 ring-emerald-100';
                      labelClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    }

                    const d = new Date(update.created_at);
                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    const warmDate = `${dateStr} • ${timeStr}`;

                    return (
                      <div key={update.id} className="relative">
                        {/* Node Bullet */}
                        <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 ${dotColor}`} />

                        {/* Text descriptions */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${labelClass}`}>
                              {update.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {warmDate}
                            </span>
                          </div>
                          
                          {update.location_description && (
                            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>{update.location_description}</span>
                            </div>
                          )}

                          {update.note && (
                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                              {update.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delivery Celebration Banner */}
            {shipment.status === 'DELIVERED' && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-xs flex items-start gap-3 mt-4">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="uppercase font-bold text-emerald-900 block text-xs">Safe Arrival Confirmed</span>
                  <p className="leading-relaxed text-emerald-800">
                    Your rescue companion has safely arrived at their destination. Thank you for making this journey possible!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Transport;
