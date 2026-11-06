import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ScanLine,
  Users,
  FileSpreadsheet,
  TrendingDown,
  Clock,
  ArrowRight
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 mb-2">
          Mess Operations Staff
        </span>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Scan student coupons, check eligibility, verify walk-ins, and record kitchen food waste.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/staff/scanner"
            className="flex items-center gap-2.5 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            <ScanLine className="w-5 h-5" />
            Launch QR Camera Scanner
          </Link>
          <Link
            to="/staff/manual-verify"
            className="flex items-center gap-2.5 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-700 transition-all"
          >
            <Users className="w-5 h-5 text-slate-300" />
            Manual Roll Number Search
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Live Session Headcount</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800">0 / 0</h2>
          <p className="text-xs text-slate-500 mt-1">Students Served vs Expected</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Kitchen Prep Sheet</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Target Preparation</h2>
          <p className="text-xs text-slate-500 mt-1">Check today's required food quantities</p>
          <Link to="/staff/prep-sheet" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            Open Sheet <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Food Wastage Entry</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">End-of-Meal Scales</h2>
          <p className="text-xs text-slate-500 mt-1">Weigh surplus & plate waste in kg</p>
          <Link to="/staff/waste-entry" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
            Log Waste <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

