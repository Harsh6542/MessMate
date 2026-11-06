import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingDown,
  Scale,
  DollarSign,
  UtensilsCrossed,
  AlertCircle,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const FoodWastageView = () => {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // '7' | '30'

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, logsRes] = await Promise.all([
        api.get(`/waste-logs/summary?days=${timeRange}`),
        api.get('/waste-logs?limit=30')
      ]);

      if (sumRes.success) {
        setSummary(sumRes.data);
      }
      if (logsRes.success) {
        setLogs(logsRes.data?.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load food wastage records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Format meal breakdown for Recharts
  const chartData = summary?.byMealType
    ? Object.entries(summary.byMealType).map(([meal, data]) => ({
        meal: meal.toUpperCase(),
        'Surplus (kg)': Math.round(data.surplusKg * 10) / 10,
        'Plate Waste (kg)': Math.round(data.plateWasteKg * 10) / 10
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-rose-400" />
            Food Wastage & Empirical Scale Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical scale measurements separating unserved kitchen surplus from student plate waste.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Waste</span>
                <Scale className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">
                {summary?.totalWasteKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Measured on physical scales</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Kitchen Surplus</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {summary?.totalSurplusKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Unserved over-preparation</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Plate Waste</span>
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">
                {summary?.totalPlateWasteKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Left on student plates</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Financial Loss</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{summary?.totalCostLostINR?.toLocaleString() || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Approx. procurement value lost</p>
            </div>
          </div>

          {/* Wastage Breakdown Chart */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-400" />
              Meal Session Waste Breakdown (Kitchen Surplus vs Student Plate Waste)
            </h3>

            {chartData.every((d) => d['Surplus (kg)'] === 0 && d['Plate Waste (kg)'] === 0) ? (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                No measurable food wastage has been logged for this period yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="meal" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Surplus (kg)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Plate Waste (kg)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Scale Logs Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Empirical Scale Measurement Logs ({logs.length})
              </h3>
            </div>

            {logs.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-10 text-center">
                <Scale className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No Scale Entries Recorded</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mess workers can log physical scale weights from the Staff Waste Logging form after each meal.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                      <tr>
                        <th className="px-4 py-3">Meal Date</th>
                        <th className="px-4 py-3">Session</th>
                        <th className="px-4 py-3">Prepared / Served</th>
                        <th className="px-4 py-3">Surplus (kg)</th>
                        <th className="px-4 py-3">Plate Waste (kg)</th>
                        <th className="px-4 py-3">Cost Lost</th>
                        <th className="px-4 py-3">Disposal</th>
                        <th className="px-4 py-3">Staff Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 font-semibold text-slate-200">
                            {log.mealSession?.date
                              ? new Date(log.mealSession.date).toLocaleDateString()
                              : new Date(log.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 capitalize font-bold text-slate-300">
                            {log.mealSession?.mealType || 'Meal'}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {log.totalPreparedServings} / {log.totalActualServed} heads
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-400">
                            {log.unservedSurplusWeightKg} kg
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-400">
                            {log.plateWasteWeightKg} kg
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-400">
                            ₹{log.estimatedCostLostINR}
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-400 text-[11px]">
                            {log.disposalMethod?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {log.recordedBy ? `${log.recordedBy.firstName} (${log.recordedBy.role})` : 'Mess Worker'}
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

export default FoodWastageView;

