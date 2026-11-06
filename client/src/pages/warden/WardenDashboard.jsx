import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building,
  AlertCircle,
  Star,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export const WardenDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30 mb-2">
          Hostel Warden / Mess Committee
        </span>
        <h1 className="text-2xl font-bold">Warden Oversight Portal — {user?.firstName}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor dining performance, audit complaint resolution times, review student satisfaction trends, and supervise food waste reduction.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/warden/complaints"
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <AlertCircle className="w-4 h-4" />
            Review & Escalate Complaints
          </Link>
          <Link
            to="/warden/performance"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Building className="w-4 h-4 text-slate-300" />
            Hostel Performance Scorecards
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Grievance SLA Compliance</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Resolution SLA</h2>
          <p className="text-xs text-slate-500 mt-1">Audit overdue and confidential student grievances</p>
          <Link to="/warden/complaints" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
            Investigate Complaints <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Food Quality Trends</span>
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">5-Star Feedback</h2>
          <p className="text-xs text-slate-500 mt-1">Average ratings for Taste, Hygiene, & Temperature</p>
          <Link to="/warden/quality" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
            View Scorecards <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Wastage Reduction</span>
            <TrendingDown className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Waste Minimization</h2>
          <p className="text-xs text-slate-500 mt-1">Audit unserved surplus & plate waste curves</p>
          <Link to="/warden/wastage" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
            Audit Wastage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;

