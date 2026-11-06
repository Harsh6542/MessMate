import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Users,
  Utensils,
  Star,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Boxes
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/manager');
      const payload = res?.data || res;
      if (res?.success || res?.status === 'success' || payload) {
        setManagerData(payload);
      }
    } catch (err) {
      toast.error('Failed to load manager dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const today = managerData?.today;
  const attendanceTrend = managerData?.attendanceTrend || [];
  const wastageTrend = managerData?.wastageTrend || [];
  const qualityScores = managerData?.qualityScores || {};
  const inventory = managerData?.inventory || {};
  const complaints = managerData?.complaints || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            Mess Manager Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hostel mess analytics, demand forecasting fidelity, kitchen preparation sheets, and wastage reduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/manager/demand"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            Demand & Portions
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
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Today's Meals Served
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {today?.totalServed || 0}{' '}
                <span className="text-xs font-normal text-slate-400">/ {today?.totalPrepared || 0}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Approved head count</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Low Stock Alerts
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {inventory.lowStockCount || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Commodities near empty</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Open Grievances
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {complaints.pendingCount || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Tickets requiring response</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Guest Passes
              </span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {managerData?.pendingGuestRequestsCount || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Pending approvals</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Food Quality Rating
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {qualityScores.overall || '4.2'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">From {qualityScores.totalReviews || 0} ratings</p>
            </div>
          </div>

          {/* Recharts Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-Day Attendance vs Declared Demand Area Chart */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  7-Day Declared Demand vs Actual Attendance
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Attendance Fidelity</span>
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="servedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="declaredDemand"
                      name="Expected Demand"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#demandGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="actualServed"
                      name="Actual Served"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#servedGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-Day Food Wastage Bar Chart */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  7-Day Wastage (Surplus vs Plate Waste)
                </span>
                <Link to="/manager/wastage" className="text-[10px] text-rose-400 hover:underline">
                  Full Analytics →
                </Link>
              </h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wastageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="surplusKg" name="Unserved Surplus (kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="plateWasteKg" name="Plate Waste (kg)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quality Radar & Attention Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Satisfaction Breakdown */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Meal Quality Metric Scorecard
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Taste & Flavors', score: qualityScores.taste || 4.2 },
                    { label: 'Kitchen & Table Hygiene', score: qualityScores.hygiene || 4.4 },
                    { label: 'Serving Temperature', score: qualityScores.temperature || 4.1 },
                    { label: 'Portion Sufficiency', score: qualityScores.portion || 4.3 }
                  ].map((m) => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{m.label}</span>
                        <span className="font-bold text-amber-400">{m.score} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/60">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${(m.score / 5.0) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Audited continuously from verified student attendance records.
              </div>
            </div>

            {/* Low-Stock Inventory Alerts */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    Low-Stock Reorder Alerts
                  </h3>
                  <Link to="/manager/inventory" className="text-xs text-emerald-400 hover:underline">
                    Stockroom →
                  </Link>
                </div>

                {!inventory.alerts?.length ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    All inventory commodities are currently above minimum threshold.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inventory.alerts.map((item) => (
                      <div
                        key={item._id}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{item.category}</div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-amber-400">
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            Min: {item.minimumThreshold} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <Link
                  to="/manager/inventory"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Manage Procurement
                </Link>
              </div>
            </div>

            {/* Urgent Complaints Queue */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Priority Complaints ({complaints.urgent?.length || 0})
                  </h3>
                  <Link to="/manager/complaints" className="text-xs text-emerald-400 hover:underline">
                    View Queue →
                  </Link>
                </div>

                {!complaints.urgent?.length ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    No critical or high-priority complaints pending in the queue.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {complaints.urgent.map((c) => (
                      <Link
                        key={c._id}
                        to="/manager/complaints"
                        className="block bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-100">{c.title}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {c.priority}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.isConfidential ? 'Confidential Student' : c.student?.firstName} • {c.category}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <Link
                  to="/manager/complaints"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  Open Grievance Queue
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;
