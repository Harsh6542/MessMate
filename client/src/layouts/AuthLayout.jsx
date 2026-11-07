import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Utensils, Shield, Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  const location = useLocation();
  const isNarrowPage = location.pathname.includes('/forgot-password') || location.pathname.includes('/reset-password');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial from-violet-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Campus Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">
                Mess<span className="text-emerald-400">Mate</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                NIT Patna
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Smart Hostel Mess & Dining Portal</p>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Central Dining Network Active</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full mx-auto my-auto z-10 pt-4 pb-6 ${isNarrowPage ? 'max-w-md' : 'max-w-5xl'}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-xs text-slate-500 z-10 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} MessMate &bull; National Institute of Technology Patna</p>
        <p className="text-[11px] text-slate-500">
          Digitized meal planning, single-use QR coupons & zero food waste initiative
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;
