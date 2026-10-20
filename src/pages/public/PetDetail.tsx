import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '../../lib/supabase';
import type { Pet } from '../../lib/types';
import Container from '../../components/ui/Container';
import Badge from '../../components/ui/Badge';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Check, 
  ShieldAlert,
  Heart,
  Baby,
  Users,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  FileCheck
} from 'lucide-react';

export const PetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string>('');

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setPet(data);
        
        // Initialize active photo
        if (data) {
          const primary = (data.photos && data.photos.length > 0) ? data.photos[0] : data.photo_url;
          setActivePhoto(primary || '');
        }
      } catch (err: any) {
        console.error('Error fetching pet details:', err);
        setError(err.message || 'Pet record not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold font-mono">Loading Pet Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="py-24 bg-slate-50 min-h-screen flex items-center">
        <Container className="max-w-md mx-auto text-center space-y-6">
          <div className="inline-flex p-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Pet Record Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The requested rescue companion profile could not be retrieved. It may have been adopted or archived.
          </p>
          <Link
            to="/adopt"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Adoptable Pets
          </Link>
        </Container>
      </div>
    );
  }

  // Setup Fallback Values
  const petAge = pet.age_years !== null && pet.age_years !== undefined
    ? `${pet.age_years} ${pet.age_years === 1 ? 'yr' : 'yrs'}`
    : (pet.age || 'N/A');
    
  const petSex = pet.sex || pet.gender || 'Unknown';
  const petSize = pet.size 
    ? pet.size.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Unknown';
    
  const intakeDateFormatted = new Date(pet.intake_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="py-10 md:py-16 bg-slate-50 min-h-screen text-slate-800 relative overflow-hidden">
      {/* Ambient Aurora Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="max-w-6xl space-y-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/adopt"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-xs hover:border-indigo-200"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" /> Back to Adoptable Pets
          </Link>

          <span className="text-xs font-mono text-slate-400 font-medium">
            ID: <span className="text-slate-700 font-semibold">{pet.case_number}</span>
          </span>
        </div>

        {/* Main Showcase Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Gallery Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-4/3 sm:aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md group">
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={pet.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                    <Sparkles className="w-10 h-10 text-slate-300 mb-2" />
                    <span className="text-xs font-medium uppercase tracking-wider">No Photo Available</span>
                  </div>
                )}

                {/* Floating Modern Status Pill */}
                <div className="absolute top-4 right-4">
                  <Badge status={pet.status} className="shadow-lg backdrop-blur-md" />
                </div>

                {/* Photo Count Pill */}
                {pet.photos && pet.photos.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-md">
                    {pet.photos.length} Photos
                  </div>
                )}
              </div>

              {/* Photo Thumbnails */}
              {pet.photos && pet.photos.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {pet.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhoto(photo)}
                      className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                        activePhoto === photo 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105 shadow-sm' 
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img src={photo} alt={`${pet.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Care Guarantee Card */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-sky-50/40 rounded-2xl p-4 border border-indigo-100/70 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rescue4paws Care Guarantee</div>
                  <div className="text-[11px] text-slate-600">Full medical history, spayed/neutered, & current on vaccinations.</div>
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pet Title Header */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {pet.species}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {pet.breed || 'Companion Mix'}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {pet.name}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Located at: <strong className="text-slate-700 font-semibold">{pet.current_location || 'Foster Home Facility'}</strong></span>
                </div>
              </div>

              {/* Quick Spec Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Age</span>
                  <span className="font-bold text-slate-900 text-sm block">{petAge}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Sex</span>
                  <span className="font-bold text-slate-900 text-sm capitalize block">{petSex}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Size</span>
                  <span className="font-bold text-slate-900 text-sm block">{petSize}</span>
                </div>
                <div className="bg-indigo-50/70 rounded-2xl p-3.5 border border-indigo-100">
                  <span className="block text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mb-1">Adoption Fee</span>
                  <span className="font-bold text-indigo-700 text-sm flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {pet.adoption_fee} {pet.currency || 'USD'}
                  </span>
                </div>
              </div>

              {/* Foster Notes / Personality Quote */}
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 relative">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Personality & Foster Notes
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 italic">
                  "{pet.foster_notes || pet.description || 'This companion is ready to meet their forever family. Inquire today to arrange a meet-and-greet.'}"
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Intake registered on {intakeDateFormatted}</span>
                </div>
              </div>

              {/* Temperament Compatibility Chips */}
              {(pet.good_with_kids || pet.good_with_dogs || pet.good_with_cats) && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    Home Compatibility & Temperament
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pet.good_with_kids && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200/70">
                        <Baby className="w-3.5 h-3.5" /> Good With Children
                      </span>
                    )}
                    {pet.good_with_dogs && (
                      <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-200/70">
                        <Users className="w-3.5 h-3.5" /> Good With Other Dogs
                      </span>
                    )}
                    {pet.good_with_cats && (
                      <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-200/70">
                        <Heart className="w-3.5 h-3.5" /> Good With Cats
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Veterinary & Medical Clearance Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  Medical Clearance
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${pet.vaccinated ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <Check className={`w-4 h-4 ${pet.vaccinated ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Vaccinated</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${pet.spayed_neutered ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <Check className={`w-4 h-4 ${pet.spayed_neutered ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Spayed/Neutered</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${pet.microchipped ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    <Check className={`w-4 h-4 ${pet.microchipped ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>Microchipped</span>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="pt-4 border-t border-slate-100">
                {pet.status.toUpperCase() === 'AVAILABLE' ? (
                  <div className="space-y-3">
                    <Link
                      to={`/adopt/${pet.id}/apply`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all active:scale-[0.99]"
                    >
                      <span>Apply to Adopt {pet.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Applications reviewed within 24-48 hours. No upfront application fee.
                    </p>
                  </div>
                ) : pet.status.toUpperCase() === 'PENDING' ? (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Application Under Active Review
                    </div>
                    <p className="text-xs text-amber-700">
                      An application is currently being processed for {pet.name}. You may still submit a backup interest application.
                    </p>
                    <Link
                      to={`/adopt/${pet.id}/apply`}
                      className="inline-block mt-2 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                    >
                      Submit Backup Application →
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      Found a Loving Forever Home!
                    </div>
                    <p className="text-xs text-emerald-700">
                      {pet.name} has been adopted. Browse our other rescue companions who are looking for a family.
                    </p>
                    <Link
                      to="/adopt"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Browse Other Pets <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Process & Requirements 2-Column Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> Adoption Prerequisites
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Adopter must be at least 18 years old with a government-issued photo ID.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Proof of landlord approval is required if renting or leasing a property.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Veterinary reference check to confirm existing household pets are up-to-date.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Virtual or in-person home orientation check prior to placement.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" /> What's Included in Adoption
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Spay/Neuter Procedure</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Core Age Vaccines</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Microchip Registration</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-Day Pet Health Intro</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              Every adoption directly funds rescue operations, medical emergency surgeries, and transport for vulnerable animals.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PetDetail;
