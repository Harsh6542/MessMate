import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Package,
  AlertCircle,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30 mb-2">
          Mess Contractor / Manager Console
        </span>
        <h1 className="text-2xl font-bold">Mess Administration — {user?.firstName}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor meal demand forecast, adjust cooking quantities, manage weekly rotating menus, and track ingredient stock.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/manager/demand"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            View Meal Demand Forecast
          </Link>
          <Link
            to="/manager/menu"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-300" />
            Update Weekly Menu
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Today's Declared Demand</span>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">Active Planning</h2>
          <p className="text-xs text-slate-500 mt-1">Residents minus opt-outs + guests</p>
          <Link to="/manager/demand" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
            Demand Breakdown <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Inventory & Raw Materials</span>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-bold text-slate-800">Stock Levels</h2>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Track purchases and consumption</p>
          <Link to="/manager/inventory" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            Manage Inventory <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Student Complaints</span>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-bold text-slate-800">Tickets Queue</h2>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Resolve food and hygiene feedback</p>
          <Link to="/manager/complaints" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
            Open Queue <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Food Wastage Logs</span>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-bold text-slate-800">Wastage Analytics</h2>
            <TrendingDown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">Analyze surplus and plate waste</p>
          <Link to="/manager/wastage" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
            View Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

