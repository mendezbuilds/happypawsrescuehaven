import React from 'react';
import Badge from './Badge';
import type { Pet } from '../../lib/types';

interface CaseFileCardProps {
  pet: Pet;
  className?: string;
}

/**
 * Signature Kennel Case File Card.
 * Uses a grid background pattern, physical polaroid photograph aesthetics,
 * rubber stamp tags, typewriter-like metadata tables, and intake descriptions.
 */
export const CaseFileCard: React.FC<CaseFileCardProps> = ({ pet, className = '' }) => {
  // Format intake date
  const formattedDate = new Date(pet.intake_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-3xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 overflow-hidden group ${className}`}
    >
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Photo Column */}
        <div className="relative w-full md:w-56 h-60 md:h-56 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-inner">
          {pet.photo_url ? (
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <span className="text-xs font-medium">No photo available</span>
            </div>
          )}
          
          {/* Status overlay */}
          <div className="absolute top-3 left-3">
            <Badge status={pet.status} />
          </div>

          {/* Species Badge */}
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            {pet.species}
          </div>
        </div>

        {/* Content Details Column */}
        <div className="flex-1 flex flex-col justify-between h-full w-full space-y-4">
          <div>
            {/* Header with Case ID and Intake Date */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full ring-1 ring-indigo-500/15">
                Case #{pet.case_number}
              </span>
              <span>Intake: {formattedDate}</span>
            </div>

            {/* Name */}
            <h3 className="font-display text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {pet.name}
            </h3>

            {/* Quick Specs Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-lg font-medium">
                Breed: <span className="font-semibold text-slate-900">{pet.breed || 'Rescue Mix'}</span>
              </div>
              <div className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-lg font-medium">
                {pet.age || 'Unknown Age'} • {pet.gender || 'Unknown Gender'}
              </div>
            </div>

            {/* Bio snippet */}
            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "{pet.description || 'A loving companion eager to find their forever family.'}"
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 gap-1">
            <span>View Full Profile</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseFileCard;
