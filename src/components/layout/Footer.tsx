import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Heart, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

/**
 * Shared Page footer containing site descriptions, quick links, and system indicators.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-16 font-sans mt-auto relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline tracking-tight">
                <span className="font-display text-2xl font-extrabold text-white leading-tight">
                  Rescue
                </span>
                <span className="font-display text-2xl font-black bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent leading-tight ml-0.5">
                  4paws
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-sm">
              Rescue4paws is an elite foster-based rescue and adoption network dedicated to rescuing, medically rehabilitating, and rehoming vulnerable animals across communities.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified 501(c)(3) Rescue</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                <Heart className="w-3.5 h-3.5 fill-rose-400" />
                <span>100% No-Kill</span>
              </div>
            </div>
          </div>

          {/* Links grid */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h5 className="text-xs uppercase tracking-widest font-bold text-white mb-4">
                Adopt & Help
              </h5>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link to="/adopt" className="hover:text-indigo-400 transition-colors">Available Pets</Link>
                </li>
                <li>
                  <Link to="/volunteer" className="hover:text-indigo-400 transition-colors">Foster a Pet</Link>
                </li>
                <li>
                  <Link to="/volunteer" className="hover:text-indigo-400 transition-colors">Volunteer Team</Link>
                </li>
                <li>
                  <Link to="/donate" className="hover:text-indigo-400 transition-colors">Donate to Care</Link>
                </li>
                <li>
                  <Link to="/transport" className="hover:text-indigo-400 transition-colors">Transport Network</Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs uppercase tracking-widest font-bold text-white mb-4">
                Information
              </h5>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link to="/about" className="hover:text-indigo-400 transition-colors">About Our Mission</Link>
                </li>
                <li>
                  <Link to="/resources" className="hover:text-indigo-400 transition-colors">Adopter Guides</Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-indigo-400 transition-colors">Rescue Events</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-indigo-400 transition-colors">Contact Support</Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Staff Portal</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter / Contact Assurance */}
          <div className="md:col-span-3 space-y-4">
            <h5 className="text-xs uppercase tracking-widest font-bold text-white">
              Stay Connected
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive updates on newly rescued pets, adoption day events, and heartfelt success stories.
            </p>
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 focus-within:border-indigo-500 transition-colors">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-transparent text-xs text-white px-3 py-2 focus:outline-none w-full placeholder:text-slate-500" 
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors cursor-pointer" aria-label="Subscribe">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="pt-2 font-display italic text-indigo-300 text-xs">
              “Until they all have a warm bed and loving arms.”
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-12 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Rescue4paws Network. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span>Privacy Policy</span>
            <span>Terms of Adoption</span>
            <span>Non-Profit Verification</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
