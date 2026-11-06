import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  CalendarRange,
  Trash2
} from 'lucide-react';

export const MealDeclaration = () => {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Single meal form
  const {
    register: regSingle,
    handleSubmit: handleSingleSubmit,
    reset: resetSingle
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      mealType: 'lunch',
      reason: ''
    }
  });

  // Bulk leave form
  const {
    register: regBulk,
    handleSubmit: handleBulkSubmit,
    reset: resetBulk
  } = useForm({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      reason: 'Travelling home / Personal Leave'
    }
  });

  const fetchDeclarations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/declarations/my');
      if (res.success && res.data?.declarations) {
        setDeclarations(res.data.declarations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, []);

  const onSingleSubmit = async (data) => {
    try {
      setActionLoading(true);
      const res = await api.post('/declarations', data);
      if (res.success) {
        toast.success(res.message || 'Meal absence declared successfully');
        resetSingle();
        fetchDeclarations();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to declare absence');
    } finally {
      setActionLoading(false);
    }
  };

  const onBulkSubmit = async (data) => {
    try {
      setActionLoading(true);
      const res = await api.post('/declarations/bulk', {
        ...data,
        mealTypes: ['breakfast', 'lunch', 'dinner']
      });
      if (res.success) {
        toast.success(res.message || 'Hostel leave absence recorded');
        resetBulk();
        fetchDeclarations();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave declarations');
    } finally {
      setActionLoading(false);
    }
  };

  const onCancelDeclaration = async (id) => {
    if (!window.confirm('Restore your meal eligibility for this meal?')) return;
    try {
      const res = await api.delete(`/declarations/${id}`);
      if (res.success) {
        toast.success('Absence cancelled. Meal eligibility restored!');
        fetchDeclarations();
      }
    } catch (err) {
      toast.error(err.message || 'Cannot cancel declaration (cutoff may have passed)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Advance Meal Declaration & Opt-Out
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Help kitchen staff avoid preparing excess food by notifying the mess when you won't eat.
        </p>
      </div>

      {/* Default Present Policy Alert */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <span className="font-semibold text-emerald-800">Default-Present Mess Policy: </span>
          You are automatically marked <strong>Present</strong> for all meals by default. You only need to declare
          an absence if you plan to skip a meal or go on leave.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('single')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'single'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Single Meal Opt-Out
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bulk'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          Hostel Leave (Date Range)
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit(onSingleSubmit)} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Skip an Individual Meal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Meal Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...regSingle('date', { required: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Meal Session</label>
                <select
                  {...regSingle('mealType', { required: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="breakfast">Breakfast (07:30 – 09:30 | Cutoff: 21:00 prev night)</option>
                  <option value="lunch">Lunch (12:30 – 14:30 | Cutoff: 09:00 today)</option>
                  <option value="dinner">Dinner (19:30 – 21:30 | Cutoff: 15:00 today)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eating outside, Lab class"
                  {...regSingle('reason')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="mt-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              {actionLoading ? 'Recording...' : 'Confirm Meal Absence'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit(onBulkSubmit)} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Declare Date-Range Hostel Leave</h3>
            <p className="text-xs text-slate-500">
              Visiting home or attending a college fest? Opt out of all meals automatically across your travel dates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Leave Start Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...regBulk('startDate', { required: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Leave End Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...regBulk('endDate', { required: true })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Purpose of Absence</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Vacation / Hackathon"
                  {...regBulk('reason')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="mt-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              {actionLoading ? 'Recording Leave...' : 'Declare Hostel Leave'}
            </button>
          </form>
        )}
      </div>

      {/* Active Declarations List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
          <span>Your Upcoming Absence Declarations</span>
          <span className="text-xs font-normal text-slate-400">
            {declarations.length} upcoming meals opted out
          </span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading declarations...</div>
        ) : declarations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No upcoming meal opt-outs recorded. You are scheduled to receive all meals!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Meal Session</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {declarations.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {new Date(d.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 capitalize font-semibold text-slate-700">
                      {d.mealType}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{d.reason || 'Not specified'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Opted Out
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onCancelDeclaration(d._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Cancel absence and restore eligibility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Cancel & Eat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealDeclaration;

