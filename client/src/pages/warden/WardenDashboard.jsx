import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Star,
  AlertCircle,
  TrendingDown,
  Clock,
  Users,
  Bell,
  RefreshCw,
  TrendingUp,
  FileText,
  DollarSign,
  Scale
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const WardenDashboard = () => {
  const { user } = useAuth();
  const [wardenData, setWardenData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/warden');
      if (res.success && res.data) {
        setWardenData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load warden dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const complaintsSummary = wardenData?.complaintsSummary || {};
  const wastageSummary = wardenData?.wastageSummary || {};
  const weeklyTrends = wardenData?.weeklyTrends || [];
  const oversightComplaints = wardenData?.oversightComplaints || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Hostel Warden & Mess Committee Oversight
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Independent institutional supervision: monitor student quality ratings, enforce complaint SLAs, review food wastage, and audit confidential grievances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/warden/announcements"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Bell className="w-4 h-4" />
            Post Bulletin
          </Link>

          <button
            onClick={fetchDashboard}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Key Oversight KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Satisfaction Index
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {wardenData?.satisfactionIndex || '4.2'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">30-day student ratings</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                SLA Compliance
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {complaintsSummary.resolutionRate || 100}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {complaintsSummary.resolved} of {complaintsSummary.total} tickets resolved
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Overdue Tickets
              </span>
              <div
                className={`text-2xl font-black mt-1 ${
                  complaintsSummary.overdueCount > 0 ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {complaintsSummary.overdueCount || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Exceeded SLA deadline</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Food Waste (30 Days)
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {wastageSummary.totalWasteKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Physical scale logs</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Financial Loss
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ₹{wastageSummary.totalCostLostINR?.toLocaleString() || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Estimated procurement loss</p>
            </div>
          </div>

          {/* Trend Chart & SLA Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Student Rating Trends Chart */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Weekly Student Meal Quality Rating Trends
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Past 4 Weeks</span>
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      name="Average Rating (out of 5)"
                      stroke="#fbbf24"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#fbbf24' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grievance Resolution & Confidential Oversight */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Grievance Resolution & Audit Protocol
                </h3>

                <div className="space-y-4">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Confidential Student Grievances
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Identity protected from contractors; visible solely to Warden
                      </span>
                    </div>
                    <span className="text-xl font-black text-cyan-400">
                      {complaintsSummary.confidentialCount || 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        SLA Adherence Benchmark
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Critical food hygiene issues must be resolved within 12 hours
                      </span>
                    </div>
                    <span className="text-xl font-black text-emerald-400">
                      {complaintsSummary.overdueCount === 0 ? 'Optimal' : 'Needs Follow-up'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Link
                  to="/warden/complaints"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Investigate Complaints
                </Link>
                <Link
                  to="/warden/wastage"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Audit Food Wastage
                </Link>
              </div>
            </div>
          </div>

          {/* Oversight Grievances Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Active Grievances Under Committee Review ({oversightComplaints.length})
              </h3>
              <Link to="/warden/complaints" className="text-xs text-emerald-400 hover:underline">
                Full Grievance Queue →
              </Link>
            </div>

            {oversightComplaints.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No active complaints filed in this hostel.
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                      <tr>
                        <th className="px-4 py-3">Ticket ID</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Complainant</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">SLA Deadline</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {oversightComplaints.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                            {c.ticketId || c._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-2.5 capitalize text-slate-300">
                            {c.category?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-2.5">
                            {c.isConfidential ? (
                              <span className="text-cyan-400 font-semibold">
                                {c.student?.firstName} {c.student?.lastName} (Confidential)
                              </span>
                            ) : (
                              <span>
                                {c.student?.firstName} ({c.student?.rollNumber})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                c.priority === 'critical'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : c.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                            {new Date(c.slaDeadline).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                c.status === 'resolved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {c.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WardenDashboard;
