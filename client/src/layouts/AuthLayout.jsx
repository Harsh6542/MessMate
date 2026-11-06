import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Utensils } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute -bottom-8 right-0 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Mess<span className="text-emerald-400">Mate</span>
          </span>
        </Link>
        <p className="mt-2 text-sm text-slate-400">
          Smart Hostel Mess Management & Food Waste Reduction
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          <Outlet />
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} MessMate Platform. Designed for practical hostel operations.
      </footer>
    </div>
  );
};

export default AuthLayout;

