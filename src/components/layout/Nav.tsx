import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PawPrint } from 'lucide-react';

/**
 * Shared Header / Navigation bar containing Rescue4paws logo and primary site navigation.
 */
export const Nav: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { path: '/', label: 'Home' },
    { path: '/adopt', label: 'Adopt' },
    { path: '/transport', label: 'Transport' },
    { path: '/volunteer', label: 'Volunteer' },
    { path: '/donate', label: 'Donate' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  const getLinkClass = (path: string) => {
    const isExactMatch = location.pathname === path;
    return isExactMatch
      ? 'text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-500/15 shadow-xs'
      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/70 px-3 py-1.5 rounded-full font-medium transition-all';
  };

  const getMobileLinkClass = (path: string) => {
    const isExactMatch = location.pathname === path;
    return isExactMatch
      ? 'bg-indigo-50 text-indigo-600 font-bold pl-4 py-2 rounded-xl border-l-4 border-indigo-600'
      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50 pl-4 py-2 rounded-xl transition-all';
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Nav Bar Row */}
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/35 transition-all duration-200">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline tracking-tight">
                  <span className="font-display text-2xl font-extrabold text-slate-900 leading-tight">
                    Rescue
                  </span>
                  <span className="font-display text-2xl font-black bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent leading-tight ml-0.5">
                    4paws
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-none">
                  Foster & Adoption Network
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-1.5">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs transition-all duration-150 ${getLinkClass(link.path)}`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pl-3 flex items-center gap-2">
              <Link
                to="/admin/dashboard"
                className="bg-slate-900 text-white hover:bg-indigo-600 text-[11px] font-semibold px-4 py-2 rounded-full shadow-xs hover:shadow-md transition-all duration-200"
              >
                Staff Portal
              </Link>
            </div>
          </div>

          {/* Hamburger toggle button (Mobile only) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-hprh-pine/70 hover:text-hprh-pine p-1.5 border border-hprh-pine/15 rounded bg-hprh-paper hover:bg-hprh-pine/5 focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Navigation Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-hprh-pine/10 py-3 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-xs uppercase tracking-wider py-2.5 rounded font-mono font-semibold transition-all duration-150 ${getMobileLinkClass(
                    link.path
                  )}`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-2 border-t border-hprh-pine/10 mt-1">
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-hprh-pine text-hprh-paper text-xs uppercase tracking-wider py-2.5 rounded hover:bg-hprh-sage transition-all duration-200 font-mono font-bold"
                >
                  Staff Portal
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Nav;
