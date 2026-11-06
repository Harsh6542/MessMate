import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Users,
  UserX,
  UserPlus,
  Utensils,
  ShieldCheck,
  Save,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

export const DemandForecast = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [prepData, setPrepData] = useState(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [adjustedQuantities, setAdjustedQuantities] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchDemand = async (dateStr) => {
    try {
      setLoading(true);
      const res = await api.get(`/demand/prep-sheet?date=${dateStr}`);
      if (res.success && res.data) {
        setPrepData(res.data);
        // Initialize adjusted quantities mapping
        const mapping = {};
        (res.data.prepSheets || []).forEach((sheet) => {
          mapping[sheet.sessionId] = sheet.managerAdjustedQuantity || sheet.recommendedQuantity || sheet.declaredDemand;
        });
        setAdjustedQuantities(mapping);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load demand predictions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand(selectedDate);
  }, [selectedDate]);

  const handleQuantityChange = (sessionId, val) => {
    setAdjustedQuantities((prev) => ({
      ...prev,
      [sessionId]: val
    }));
  };

  const handleSaveQuantity = async (sessionId) => {
    const qty = parseInt(adjustedQuantities[sessionId], 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid positive number for cooking quantity.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put(`/demand/adjust-quantity/${sessionId}`, { quantity: qty });
      if (res.success) {
        toast.success('Cooking preparation quantity approved and saved.');
        fetchDemand(selectedDate);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save adjusted quantity.');
    } finally {
      setSaving(false);
    }
  };

  const currentSheet = prepData?.prepSheets?.[selectedSessionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Meal Demand Forecasting & Portions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic meal demand prediction combining student opt-outs, approved guest tickets & historical turnout patterns.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 pl-9 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => fetchDemand(selectedDate)}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/80 transition"
            title="Refresh Predictions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !prepData?.prepSheets?.length ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
          <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Meal Sessions Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No active meal sessions were found for the selected date. Ensure the mess weekly menu is active.
          </p>
        </div>
      ) : (
        <>
          {/* Meal Session Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {prepData.prepSheets.map((sheet, idx) => (
              <button
                key={sheet.sessionId}
                onClick={() => setSelectedSessionIndex(idx)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                  selectedSessionIndex === idx
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>{sheet.mealType}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedSessionIndex === idx
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  {sheet.targetCookingServings} heads
                </span>
              </button>
            ))}
          </div>

          {currentSheet && (
            <div className="space-y-6">
              {/* Formula & Status Ribbon */}
              <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Demand Optimization Engine
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Formula: Declared Demand = Residents ({currentSheet.declaredDemand + (currentSheet.optOutCount || 0) - (currentSheet.approvedGuests || 0)}) − Opt-Outs + Approved Guests
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cutoff Passed: </span>
                    <span className="font-semibold text-slate-200">
                      {new Date(currentSheet.cutoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Key Breakdown Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Declared Opt-Outs</span>
                    <UserX className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400">{currentSheet.declaredDemand !== undefined ? prepData.prepSheets[selectedSessionIndex]?.menu ? 'Active' : '-' : '-'}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Students eating outside or home</p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Approved Guests</span>
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-cyan-400">+{currentSheet.approvedGuests || 0}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Visiting students / family tickets</p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Historical Turnout</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400">{currentSheet.turnoutRate || '94%'}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Past 30-day attendance fidelity</p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-medium uppercase tracking-wider">Walk-in Buffer</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">+{currentSheet.safetyBuffer || 5}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Contingency portion margin</p>
                </div>
              </div>

              {/* Recommended vs Approved Cooking Quantity Card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Recommendation Comparison
                    </span>
                    <div className="flex items-baseline gap-4 mt-1">
                      <div>
                        <span className="text-xs text-slate-400">Algorithmic Suggestion: </span>
                        <span className="text-2xl font-extrabold text-emerald-400">
                          {currentSheet.recommendedQuantity}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">servings</span>
                      </div>
                      <div className="text-slate-600">|</div>
                      <div>
                        <span className="text-xs text-slate-400">Net Declared Demand: </span>
                        <span className="text-lg font-bold text-slate-200">
                          {currentSheet.declaredDemand}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Review and finalize the final cooking count. This value directly updates the kitchen preparation sheet.
                    </p>
                  </div>

                  {/* Quantity Adjustment Input */}
                  <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 self-start lg:self-auto">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Approved Head Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adjustedQuantities[currentSheet.sessionId] ?? currentSheet.targetCookingServings}
                        onChange={(e) => handleQuantityChange(currentSheet.sessionId, e.target.value)}
                        className="w-32 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-lg font-black text-emerald-400 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveQuantity(currentSheet.sessionId)}
                      disabled={saving}
                      className="h-full mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving...' : 'Approve Quantity'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Kitchen Menu & Bulk Ingredient Preview */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  Menu Dishes & Estimated Bulk Raw Material Required (for {adjustedQuantities[currentSheet.sessionId] ?? currentSheet.targetCookingServings} Servings)
                </h3>

                {!currentSheet.menu?.dishes?.length ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No dishes configured for this meal slot in the weekly menu.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentSheet.menu.dishes.map((dish, i) => (
                      <div
                        key={dish._id || i}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-200">{dish.name}</span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                dish.isVeg
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {dish.isVeg ? 'VEG' : 'NON-VEG'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{dish.category?.replace('_', ' ')}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{dish.portionNote}</span>
                          <span className="text-xs font-extrabold text-emerald-400">
                            {dish.estimatedRawKg > 0 ? `~${dish.estimatedRawKg} kg raw` : 'Batch prep'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DemandForecast;
