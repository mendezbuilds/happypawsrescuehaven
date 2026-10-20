import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { 
  Heart, 
  Coins, 
  Users, 
  ShieldCheck, 
  Home as HomeIcon, 
  Truck, 
  PawPrint, 
  Cat, 
  Rabbit,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import supabase from '../../lib/supabase';

/**
 * Home page for Rescue4paws — Premium, High-Conversion Design.
 */
export const Home: React.FC = () => {
  const [totalAdopted, setTotalAdopted] = useState<string>('2300');

  useEffect(() => {
    const fetchTotalAdoptedSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'total_animals_adopted')
          .maybeSingle();
        
        if (!error && data?.value) {
          setTotalAdopted(data.value);
        }
      } catch (err) {
        console.error('Error fetching total_animals_adopted setting:', err);
      }
    };

    fetchTotalAdoptedSetting();
  }, []);

  const totalAdoptedNum = parseInt(totalAdopted, 10) || 2300;
  const dogsAdopted = Math.floor(totalAdoptedNum * 12 / 22);
  const catsAdopted = Math.floor(totalAdoptedNum * 8 / 22);
  const pocketPetsAdopted = totalAdoptedNum - dogsAdopted - catsAdopted;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans overflow-hidden">
      
      {/* =========================================================================
          1. HERO SECTION: Split Layout with Aurora Mesh & Interactive Showcase
         ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-slate-50 to-white pt-10 pb-20 md:py-24">
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-400/25 to-sky-300/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-gradient-to-tr from-violet-400/20 to-rose-300/15 rounded-full blur-3xl pointer-events-none"></div>

        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Column: Compelling Copy & Calls to Action */}
            <div className="lg:col-span-7 space-y-7 text-left">
              
              {/* Trust Badge Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-indigo-100 shadow-xs text-xs font-semibold text-indigo-700 select-none">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>The Next-Generation Foster & Rescue Network</span>
              </div>

              {/* Master Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-slate-900 tracking-tight leading-[1.08]">
                Every Paw Deserves a{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
                  Loving Home.
                </span>
              </h1>

              {/* Value Subhead */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                Rescue4paws is a foster-powered sanctuary network. We rescue vulnerable pets from high-risk shelters, provide dedicated veterinary care, and safely transport them into loving forever homes.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/adopt">
                  <Button variant="primary" className="!px-7 !py-3.5 !text-sm !font-bold flex items-center gap-2 group shadow-lg shadow-indigo-500/25">
                    <span>Meet Adoptable Pets</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link to="/volunteer">
                  <Button variant="secondary" className="!px-6 !py-3.5 !text-sm !font-semibold flex items-center gap-2 hover:bg-slate-50">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Become a Foster</span>
                  </Button>
                </Link>

                <Link to="/donate">
                  <Button variant="ghost" className="!px-5 !py-3.5 !text-sm !font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Donate</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators / Social Proof Strip */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="block text-slate-900 font-bold text-sm leading-tight">{totalAdoptedNum.toLocaleString()}+</span>
                    <span className="text-[11px] text-slate-500">Animals Saved</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    ★
                  </div>
                  <div>
                    <span className="block text-slate-900 font-bold text-sm leading-tight">100% No-Kill</span>
                    <span className="text-[11px] text-slate-500">Foster-First Care</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                    🚚
                  </div>
                  <div>
                    <span className="block text-slate-900 font-bold text-sm leading-tight">Active Transport</span>
                    <span className="text-[11px] text-slate-500">Safe Delivery Relay</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Layered Premium Showcase Card */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              
              {/* Backing decorative glow card */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-sky-400/20 to-transparent rounded-3xl transform rotate-2 scale-102 filter blur-md"></div>

              {/* Main Card */}
              <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-5 overflow-hidden transition-all duration-300 hover:shadow-indigo-500/15">
                
                {/* Photo with Overlay Pills */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-4 shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=1000"
                    alt="Happy adopted rescue dog"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Floating Status Pill */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-md flex items-center gap-1.5 ring-1 ring-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Ready for Adoption</span>
                  </div>

                  {/* Favorite / Heart Micro-badge */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-rose-500 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    <span>In Foster Care • Ready to Travel</span>
                  </div>
                </div>

                {/* Card Info Section */}
                <div className="space-y-3 px-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-display text-slate-900">Barnaby & Friends</h3>
                      <p className="text-xs text-slate-500">Golden Mix • 2 Years Old • Healthy & Friendly</p>
                    </div>
                    <Link to="/adopt">
                      <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-500/15">
                        Meet Me →
                      </span>
                    </Link>
                  </div>

                  {/* Micro Specs */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Vaccinated</span>
                      <span className="text-xs font-bold text-emerald-600">✓ Up to Date</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">House Trained</span>
                      <span className="text-xs font-bold text-slate-800">Yes</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Good with</span>
                      <span className="text-xs font-bold text-indigo-600">Kids & Dogs</span>
                    </div>
                  </div>
                </div>

                {/* Floating Glassmorphic Pill 1 */}
                <div className="absolute -bottom-2 -left-2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 flex items-center gap-3 select-none">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">100% Medically Cleared</span>
                    <span className="text-[10px] text-slate-500">Full veterinary exam complete</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </Container>
      </section>


      {/* =========================================================================
          2. IMPACT DASHBOARD: Dynamic Aurora Gradient Stats Strip
         ========================================================================= */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 py-16 text-white relative overflow-hidden">
        {/* Subtle grid background effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <Container className="relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">
              Real Impact • Real Second Chances
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
              Transforming Lives Together
            </h2>
            <p className="text-sm text-slate-300">
              Through community support, dedicated volunteers, and compassionate fosters, every statistic represents a life saved.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
            
            {/* Stat 1: Total Animals */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center justify-between hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-2">
                <PawPrint className="w-5 h-5" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold font-display text-white leading-none">
                {totalAdoptedNum.toLocaleString()}
              </span>
              <span className="text-xs text-indigo-200 font-medium mt-2">
                Total Adoptions
              </span>
            </div>

            {/* Stat 2: Dogs */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center justify-between hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-2">
                <PawPrint className="w-5 h-5" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold font-display text-white leading-none">
                {dogsAdopted.toLocaleString()}
              </span>
              <span className="text-xs text-sky-200 font-medium mt-2">
                Dogs Rehomed
              </span>
            </div>

            {/* Stat 3: Cats */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center justify-between hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center mb-2">
                <Cat className="w-5 h-5" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold font-display text-white leading-none">
                {catsAdopted.toLocaleString()}
              </span>
              <span className="text-xs text-violet-200 font-medium mt-2">
                Cats Placed
              </span>
            </div>

            {/* Stat 4: Pocket Pets */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center justify-between hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                <Rabbit className="w-5 h-5" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold font-display text-white leading-none">
                {pocketPetsAdopted.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-200 font-medium mt-2">
                Pocket Pets
              </span>
            </div>

            {/* Stat 5: Transport Network */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center flex flex-col items-center justify-between hover:bg-white/15 transition-all col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-3xl lg:text-4xl font-extrabold font-display text-white leading-none">
                50+
              </span>
              <span className="text-xs text-amber-200 font-medium mt-2">
                Transport Relays
              </span>
            </div>

          </div>
        </Container>
      </section>


      {/* =========================================================================
          3. THREE-PATH INVOLVEMENT: Modern Rich Cards (Adopt, Foster, Donate)
         ========================================================================= */}
      <section className="py-20 md:py-24 bg-white">
        <Container className="space-y-14">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-600">
                Ways You Can Help
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 leading-tight">
                Be a Lifeline for a Pet in Need
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Every adoption, foster placement, and donation directly funds medical surgeries, nutritious food, and safe journeys for rescue pets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Adopt */}
            <div className="group bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">Adopt a Companion</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Browse our adoptable dogs, cats, and rabbits. Each pet is fully vetted, vaccinated, and cared for in a home setting.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Comprehensive medical records</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Behavioral evaluation in foster homes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Post-adoption care support</span>
                  </li>
                </ul>
              </div>
              <Link to="/adopt" className="block pt-2">
                <Button variant="primary" className="w-full !py-3 !font-bold flex items-center justify-center gap-2">
                  <span>Browse Available Pets</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Card 2: Foster */}
            <div className="group bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">Foster or Volunteer</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Open your home temporarily or join our transport and event teams. We cover all food, supplies, and veterinary costs.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>100% of supplies and food provided</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Flexible short or long term fostering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Volunteer transport drivers welcome</span>
                  </li>
                </ul>
              </div>
              <Link to="/volunteer" className="block pt-2">
                <Button variant="secondary" className="w-full !py-3 !font-bold flex items-center justify-center gap-2 border-slate-300 hover:border-slate-400">
                  <span>Join Our Foster Network</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Card 3: Donate */}
            <div className="group bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-3xl p-8 shadow-xs hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 transition-transform">
                  <Coins className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold font-display text-slate-900">Support Medical Fund</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  From emergency surgeries to daily nutritious meals, every dollar donated directly rescues animals from hardship.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tax-deductible nonprofit contributions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Emergency medical triage sponsorships</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Transparent financial allocations</span>
                  </li>
                </ul>
              </div>
              <Link to="/donate" className="block pt-2">
                <Button variant="primary" className="w-full !py-3 !font-bold !bg-gradient-to-r !from-amber-500 !to-rose-500 hover:!from-amber-600 hover:!to-rose-600 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2">
                  <span>Make a Donation</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>

        </Container>
      </section>


      {/* =========================================================================
          4. PILLARS OF EXCELLENCE: How Rescue4paws Works
         ========================================================================= */}
      <section className="py-20 md:py-24 bg-slate-50 border-t border-slate-200/80">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: 4 Pillars */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest font-bold text-indigo-600">
                  The Rescue4paws Standard
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 leading-tight">
                  How We Rescue, Care & Rehome
                </h2>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Our comprehensive 4-stage rescue lifecycle ensures every vulnerable animal receives medical care and a dedicated support team.
                </p>
              </div>

              <div className="space-y-4">
                
                {/* Pillar 1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-display text-slate-900">1. Shelter Pull & Medical Triage</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      We rescue animals facing immediate euthanasia or neglect, providing emergency veterinary treatment, vaccinations, and microchipping.
                    </p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 font-bold">
                    <HomeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-display text-slate-900">2. In-Home Foster Decompression</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Rather than stressful kennels, our pets reside with loving volunteer foster parents where their unique personalities can shine.
                    </p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-display text-slate-900">3. Safe Climate-Controlled Transport</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Our certified volunteer transport relay moves pets safely across regions to areas with high adoption demand and loving adopters.
                    </p>
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-display text-slate-900">4. Lifelong Adoption Matching</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      Our rigorous yet supportive screening connects animals with responsible, loving adopters with post-adoption check-ins.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Visual Showcase Card */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 overflow-hidden">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative mb-5 shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=1000"
                    alt="Foster volunteer with rescue dog"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-sky-300">Volunteer Community</span>
                    <h4 className="text-xl font-bold font-display mt-0.5">Over 140 Active Foster Families</h4>
                    <p className="text-xs text-slate-200">Providing round-the-clock love and medical convalescence</p>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-indigo-900">Ready to make a difference?</span>
                    <span className="text-[11px] text-indigo-700">Join our network of foster heroes today.</span>
                  </div>
                  <Link to="/volunteer">
                    <Button variant="primary" className="!px-4 !py-2 !text-xs !font-bold">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>


      {/* =========================================================================
          5. PULL QUOTE: Editorial Vow Section
         ========================================================================= */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <Container>
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-50/60 via-slate-50 to-sky-50/40 rounded-3xl p-8 sm:p-12 border border-indigo-100/80 shadow-sm text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-6 shadow-md shadow-indigo-500/20">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <blockquote className="font-display italic text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-snug">
              “Every animal we welcome is not a case number, but a promise—a commitment to care, transport, and nurture them until they find the love they’ve always deserved.”
            </blockquote>
            <div className="mt-6 flex flex-col items-center">
              <span className="font-bold text-sm text-indigo-700">Rescue4paws Foundation Vow</span>
              <span className="text-xs text-slate-500">Dedicated Foster & Medical Team</span>
            </div>
          </div>
        </Container>
      </section>

      {/* =========================================================================
          6. BOTTOM CALL TO ACTION
         ========================================================================= */}
      <section className="py-20 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-violet-900 text-white relative overflow-hidden">
        <Container className="text-center space-y-6 relative z-10 max-w-3xl">
          <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">
            Start Your Journey
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight">
            Ready to Welcome Your New Best Friend?
          </h2>
          <p className="text-base sm:text-lg text-indigo-200 leading-relaxed font-normal">
            Take the first step today. Meet our loving animals, apply to adopt or foster, or support our ongoing rescue missions.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/adopt">
              <Button variant="primary" className="!bg-white !text-indigo-900 hover:!bg-indigo-50 !px-8 !py-3.5 !text-sm !font-bold shadow-xl">
                Browse Available Pets
              </Button>
            </Link>
            <Link to="/volunteer">
              <Button variant="secondary" className="!bg-indigo-700/60 !text-white hover:!bg-indigo-700 !border-indigo-500 !px-8 !py-3.5 !text-sm !font-semibold">
                Become a Foster
              </Button>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  );
};

export default Home;
