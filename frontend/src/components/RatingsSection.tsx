import { useState, useEffect } from 'react';
import { SERVICES, RATINGS } from '../data/mockData';
import { Star, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Rating } from '../types';
import { apiClient } from '../api/client';

interface RatingsSectionProps {
  ratingsList?: Rating[];
  servicesList?: Service[];
}

import type { Service } from '../types';

export default function RatingsSection({ ratingsList, servicesList }: RatingsSectionProps) {
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [showAllRatings, setShowAllRatings] = useState(false);

  // Local copy of ratings so the section works standalone too (when the
  // parent doesn't pass ratingsList). It initializes from the prop/mock
  // and refreshes from the backend on mount.
  const [localRatings, setLocalRatings] = useState<Rating[]>(ratingsList || RATINGS);

  useEffect(() => {
    // If parent passes ratingsList, prefer it (it's the live backend data
    // flowing from App.tsx → useSiteData). Otherwise fetch directly.
    if (ratingsList && ratingsList.length > 0) {
      setLocalRatings(ratingsList);
      return;
    }
    let cancelled = false;
    apiClient
      .getApprovedRatings()
      .then((rows) => {
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setLocalRatings(rows as unknown as Rating[]);
        }
      })
      .catch(() => {
        // Keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, [ratingsList]);

  // Use servicesList prop if available (live from backend), else mock
  const activeServices = servicesList && servicesList.length > 0 ? servicesList : SERVICES;

  // Filter ratings that are approved
  const baseRatings = localRatings;
  const approvedRatings = baseRatings.filter(r => r.isApproved !== false);

  // Filter ratings by selected service ID
  const filteredRatings = filterServiceId === 'all' 
    ? approvedRatings 
    : approvedRatings.filter(r => r.serviceId === filterServiceId);

  const displayedRatings = showAllRatings ? filteredRatings : filteredRatings.slice(0, 3);

  // Read services dynamically for dropdown filter
  const filterOptions = [
    { id: 'all', name: 'Show All Services' },
    ...activeServices.map(s => ({ id: s.id, name: s.name }))
  ];

  const getServiceName = (serviceId: string) => {
    return activeServices.find(s => s.id === serviceId)?.name || 'General';
  };

  return (
    <section id="ratings" className="py-24 bg-transparent overflow-hidden border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest mb-2">Client Reviews</p>
            <h2 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 mb-2">
              Feedback From Our Active Global Partners
            </h2>
            <p className="text-sm text-slate-500 font-sans max-w-xl">
              See how our remote financial auditing, custom bookkeeping, and executive virtual operations are helping global small businesses.
            </p>
          </div>

          {/* Dynamic Dropdown Filter */}
          <div className="flex items-center space-x-3 shrink-0">
            <label htmlFor="service-filter" className="text-xs font-mono font-bold text-slate-500 uppercase">
              Filter by service:
            </label>
            <div className="relative">
              <select
                id="service-filter"
                value={filterServiceId}
                onChange={(e) => setFilterServiceId(e.target.value)}
                className="appearance-none bg-white/45 backdrop-blur-md border border-white/45 rounded-xl px-4 py-2.5 pr-10 text-xs font-bold font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/35 shadow-sm cursor-pointer"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings Grid with Layout Animation */}
        <div className="min-h-[300px] relative">
          <AnimatePresence mode="popLayout">
            {displayedRatings.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {displayedRatings.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    id={`rating-card-${item.id}`}
                    initial={{ opacity: 0, scale: 0.97, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 12 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    className="glass-card p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-500"
                  >
                    <div>
                      {/* Stars list — render based on actual rating (1-5). */}
                      <div className="flex items-center space-x-0.5 mb-4 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (item.ratingStars || 5) ? 'fill-current' : 'fill-none text-amber-300/40'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className="text-xs text-slate-705 leading-relaxed font-sans italic mb-6">
                        "{item.comment}"
                      </p>
                    </div>

                    {/* Profile Meta */}
                    <div className="pt-4 border-t border-white/45 mt-4 flex items-center space-x-3">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/50"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-sans font-bold text-sm border border-indigo-100">
                          {item.name.charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-sans font-bold text-sm text-slate-800 truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans truncate leading-none mt-1">
                          {item.designation}, <span className="font-bold text-slate-500">{item.company}</span>
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          {/* Location Badge */}
                          <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-500">
                            <MapPin className="w-3 h-3 text-indigo-600" />
                            <span>{item.country}</span>
                          </span>
                          
                          {/* Service Tag */}
                          <span className="flex items-center space-x-1 bg-indigo-50/70 text-indigo-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase tracking-tight border border-indigo-100 shadow-sm">
                            <Tag className="w-2.5 h-2.5" />
                            <span className="max-w-[100px] truncate">{getServiceName(item.serviceId)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 bg-white/20 rounded-2xl border border-dashed border-white/45"
              >
                <p className="text-sm text-slate-500">No client ratings available for this specific service filter.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View All Reviews Button */}
        {filteredRatings.length > 3 && (
          <div className="flex justify-center mt-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAllRatings(!showAllRatings)}
              className="px-6 py-3 bg-white/70 hover:bg-indigo-50 border border-slate-200 text-indigo-600 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer hover:border-indigo-500/30 flex items-center gap-2"
            >
              <span>{showAllRatings ? 'Show Fewer Reviews' : 'View All Reviews'}</span>
              <span className="text-[10px]">{showAllRatings ? '▲' : '▼'}</span>
            </motion.button>
          </div>
        )}

      </div>
    </section>
  );
}
