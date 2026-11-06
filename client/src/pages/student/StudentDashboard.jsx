import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Utensils,
  QrCode,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hostel Resident Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hello, {user?.firstName}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Manage your daily mess meals, view upcoming menus, declare planned absences before
            cutoffs, and generate digital meal coupons.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/student/coupon"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Generate Meal Coupon
            </Link>
            <Link
              to="/student/declarations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-xs border border-slate-600 transition-all"
            >
              <Calendar className="w-4 h-4" />
              Opt-Out / Leave Planner
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Next Meal Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Next Upcoming Meal
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Dinner Today</h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            19:30 – 21:30 | Cutoff: 15:00
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Eligible (No Opt-Out)
            </span>
            <Link
              to="/student/menu"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-1"
            >
              Menu <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Declarations Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Opt-Outs
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800">0 Active Leaves</h3>
          <p className="text-xs text-slate-500 mt-1">
            Default policy: Present for all meals
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/student/declarations"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Declare Meal Absence <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Open Complaints Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Grievances & Complaints
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Open Tickets</h3>
          <p className="text-xs text-slate-500 mt-1">
            Need help with hygiene or food quality?
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/student/complaints"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-1"
            >
              Lodge a Complaint <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

