import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 mb-2">
          Super Administrator
        </span>
        <h1 className="text-2xl font-bold">System Administration — {user?.firstName}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Provision student and staff accounts, configure hostel residency facilities, configure declaration cutoff deadlines, and audit application activities.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Users className="w-4 h-4" />
            Manage User Accounts
          </Link>
          <Link
            to="/admin/hostels"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Building className="w-4 h-4 text-slate-300" />
            Hostels & Facilities Setup
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Accounts & Roles</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">RBAC Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Students, Mess Staff, Managers, and Wardens</p>
          <Link to="/admin/users" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
            View Accounts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Hostel Infrastructure</span>
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Hostels & Mess</h2>
          <p className="text-xs text-slate-500 mt-1">Configure resident capacities, dining blocks, and meal timings</p>
          <Link to="/admin/hostels" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            Manage Facilities <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">System Settings</span>
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Cutoffs & Policies</h2>
          <p className="text-xs text-slate-500 mt-1">Meal declaration cutoff deadlines and audit trails</p>
          <Link to="/admin/settings" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline">
            Configure Policies <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

