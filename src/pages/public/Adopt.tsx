import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../lib/supabase';
import type { Pet } from '../../lib/types';
import Container from '../../components/ui/Container';
import Badge from '../../components/ui/Badge';
import { Filter, Search, Rabbit } from 'lucide-react';

export const Adopt: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        // Only fetch available pets from database
        const { data, error: dbError } = await supabase
          .from('pets')
          .select('*')
          .eq('status', 'AVAILABLE')
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        setPets(data || []);
      } catch (err: any) {
        console.error('Error fetching pets:', err);
        setError(err.message || 'Failed to retrieve available pets.');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...pets];

    // Filter by Species
    if (speciesFilter !== 'all') {
      result = result.filter(pet => {
        const petSpecies = (pet.species || '').toLowerCase();
        if (speciesFilter === 'pocket_pet') {
          return petSpecies === 'pocket_pet' || petSpecies === 'rabbit' || petSpecies === 'hamster' || petSpecies === 'guinea_pig';
        }
        if (speciesFilter === 'other') {
          return petSpecies !== 'dog' && petSpecies !== 'cat' && petSpecies !== 'pocket_pet' && petSpecies !== 'rabbit' && petSpecies !== 'hamster' && petSpecies !== 'guinea_pig';
        }
        return petSpecies === speciesFilter;
      });
    }

    // Filter by Size
    if (sizeFilter !== 'all') {
      result = result.filter(pet => (pet.size || '').toLowerCase() === sizeFilter);
    }

    // Filter by Age Range
    if (ageFilter !== 'all') {
      result = result.filter(pet => {
        const ageYears = pet.age_years;
        
        // Fallback age parsing if age_years is null
        let computedAgeYears = ageYears;
        if (computedAgeYears === null && pet.age) {
          const ageStr = pet.age.toLowerCase();
          if (ageStr.includes('month')) {
            const match = ageStr.match(/(\d+)/);
            if (match) computedAgeYears = parseInt(match[1], 10) / 12;
          } else if (ageStr.includes('year')) {
            const match = ageStr.match(/(\d+)/);
            if (match) computedAgeYears = parseInt(match[1], 10);
          }
        }

        if (computedAgeYears === null) return false;

        switch (ageFilter) {
          case 'puppy_kitten':
            return computedAgeYears < 1;
          case 'young':
            return computedAgeYears >= 1 && computedAgeYears <= 3;
          case 'adult':
            return computedAgeYears > 3 && computedAgeYears <= 8;
          case 'senior':
            return computedAgeYears > 8;
          default:
            return true;
        }
      });
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(pet => 
        (pet.name || '').toLowerCase().includes(query) ||
        (pet.breed || '').toLowerCase().includes(query) ||
        (pet.description || '').toLowerCase().includes(query)
      );
    }

    setFilteredPets(result);
  }, [pets, speciesFilter, sizeFilter, ageFilter, searchQuery]);

  return (
    <div className="py-12 md:py-16 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <Container className="space-y-10">
        
        {/* Modern Page Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700 shadow-xs select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Rescue4paws Adoptable Animals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-slate-900 leading-tight">
            Meet Your Next Companion
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Every rescue pet below is currently thriving in a loving foster home, receiving veterinary care, and eagerly awaiting their forever family.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs uppercase tracking-wider font-bold text-slate-700 font-mono">
              Filter Available Pets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Search Name or Breed
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Barnaby..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Species Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Species
              </label>
              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none transition-all"
              >
                <option value="all">All Species</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
                <option value="pocket_pet">Pocket Pets</option>
                <option value="other">Other Species</option>
              </select>
            </div>

            {/* Size Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Size
              </label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none transition-all"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra_large">Extra Large</option>
              </select>
            </div>

            {/* Age Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Age Group
              </label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none transition-all"
              >
                <option value="all">All Ages</option>
                <option value="puppy_kitten">Puppy / Kitten (&lt;1 year)</option>
                <option value="young">Young (1-3 years)</option>
                <option value="adult">Adult (3-8 years)</option>
                <option value="senior">Senior (8+ years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs animate-pulse flex flex-col h-[400px]"
              >
                <div className="aspect-square bg-slate-100 rounded-2xl mb-4 w-full"></div>
                <div className="h-5 bg-slate-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mt-auto"></div>
              </div>
            ))}
          </div>
        )}

        {/* Database / Connection Error */}
        {!loading && error && (
          <div className="text-center py-12 bg-rose-50 border border-rose-200 rounded-2xl p-6 max-w-xl mx-auto space-y-3">
            <span className="text-xs uppercase tracking-wider font-bold text-rose-700 block">
              System Notice
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">{error}</p>
            <p className="text-xs text-slate-500">Please verify connection or try again later.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPets.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200/90 rounded-3xl max-w-xl mx-auto space-y-4 shadow-xs p-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Rabbit className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">No Matching Pets Found</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              No pets match your selected filters right now. Our rescue network regularly welcomes new animals into foster care.
            </p>
            <button
              onClick={() => {
                setSpeciesFilter('all');
                setSizeFilter('all');
                setAgeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full ring-1 ring-indigo-500/15"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Pets Grid */}
        {!loading && !error && filteredPets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPets.map((pet) => {
              const primaryPhoto = (pet.photos && pet.photos.length > 0) ? pet.photos[0] : pet.photo_url;
              
              // Age Fallback Display
              const petAge = pet.age_years !== null && pet.age_years !== undefined
                ? `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'}`
                : (pet.age || 'N/A');
                
              // Sex Fallback Display
              const petSex = pet.sex || pet.gender || 'Unknown';
              
              // Size Formatting
              const petSize = pet.size 
                ? pet.size.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
                : 'Unknown';

              return (
                <Link
                  key={pet.id}
                  to={`/adopt/${pet.id}`}
                  className="bg-white border border-slate-200/90 hover:border-indigo-300/80 transition-all duration-300 rounded-3xl shadow-xs hover:shadow-2xl hover:-translate-y-1.5 p-4 relative overflow-hidden flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="aspect-square bg-slate-100 rounded-2xl relative mb-4 overflow-hidden shadow-inner">
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto}
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <span className="text-xs font-medium">No Photo Available</span>
                      </div>
                    )}
                    
                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
                      <Badge status={pet.status || 'AVAILABLE'} />
                    </div>

                    {/* Species tag */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                      {pet.species}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-grow flex flex-col justify-between space-y-4 px-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {pet.name}
                        </h3>
                        <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full ring-1 ring-indigo-500/10">
                          #{pet.case_number}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {pet.breed || 'Rescue Mix'}
                      </p>
                    </div>

                    {/* Specs chips */}
                    <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3 text-xs text-slate-600">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-semibold">Age</span>
                        <span className="font-bold text-slate-800 truncate block">{petAge}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-semibold">Sex</span>
                        <span className="font-bold text-slate-800 capitalize block">{petSex}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-semibold">Size</span>
                        <span className="font-bold text-slate-800 block">{petSize}</span>
                      </div>
                    </div>

                    {/* Card CTA Footer */}
                    <div className="flex items-center justify-between text-indigo-600 text-xs font-semibold pt-1">
                      <span>View Profile & Apply</span>
                      <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-200">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Adopt;
