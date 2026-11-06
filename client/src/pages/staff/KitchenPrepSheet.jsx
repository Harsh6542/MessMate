import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Utensils,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  ChefHat,
  Flame,
  Printer
} from 'lucide-react';

export const KitchenPrepSheet = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [prepData, setPrepData] = useState(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPrepSheet = async (dateStr) => {
    try {
      setLoading(true);
      const res = await api.get(`/demand/prep-sheet?date=${dateStr}`);
      if (res.success && res.data) {
        setPrepData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load kitchen prep sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrepSheet(selectedDate);
  }, [selectedDate]);

  const currentSheet = prepData?.prepSheets?.[selectedSessionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <ChefHat className="w-7 h-7 text-emerald-400" />
            Kitchen Preparation Sheet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time batch preparation quantities and raw ingredient requirements for mess cooking staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
          />

          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Print Kitchen Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchPrepSheet(selectedDate)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
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
      ) : !prepData?.prepSheets?.length ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center">
          <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Kitchen Sheets Found</h3>
          <p className="text-xs text-slate-500 mt-1">No sessions scheduled for this date.</p>
        </div>
      ) : (
        <>
          {/* Meal Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {prepData.prepSheets.map((sheet, idx) => (
              <button
                key={sheet.sessionId}
                onClick={() => setSelectedSessionIndex(idx)}
                className={`px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-3 transition ${
                  selectedSessionIndex === idx
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>{sheet.mealType}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    selectedSessionIndex === idx
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {sheet.targetCookingServings} heads
                </span>
              </button>
            ))}
          </div>

          {currentSheet && (
            <div className="space-y-6">
              {/* High-Contrast Target Cooking Card */}
              <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Flame className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      Approved Target Preparation
                    </span>
                    <div className="text-4xl md:text-5xl font-black text-slate-100 tracking-tight mt-0.5">
                      {currentSheet.targetCookingServings}{' '}
                      <span className="text-lg md:text-xl font-bold text-slate-400">servings</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Serving Window:{' '}
                      <span className="text-slate-200 font-semibold">
                        {new Date(currentSheet.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        -{' '}
                        {new Date(currentSheet.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                  <div className="px-3">
                    <div className="text-xs text-slate-400">Declared Demand</div>
                    <div className="text-xl font-black text-slate-200 mt-0.5">{currentSheet.declaredDemand}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="px-3">
                    <div className="text-xs text-slate-400">Turnout Factor</div>
                    <div className="text-xl font-black text-amber-400 mt-0.5">{currentSheet.turnoutRate}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="px-3">
                    <div className="text-xs text-slate-400">Walk-in Buffer</div>
                    <div className="text-xl font-black text-emerald-400 mt-0.5">+{currentSheet.safetyBuffer}</div>
                  </div>
                </div>
              </div>

              {/* Kitchen Dish Preparation Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  Dishes & Estimated Bulk Raw Commodity Measure
                </h3>

                {!currentSheet.menu?.dishes?.length ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-500 text-xs">
                    No dishes mapped for this session in the weekly menu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSheet.menu.dishes.map((dish, i) => (
                      <div
                        key={dish._id || i}
                        className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-600 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-black text-slate-100">{dish.name}</h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                dish.isVeg
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {dish.isVeg ? 'VEG' : 'NON-VEG'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 capitalize mt-1">
                            Category: {dish.category?.replace('_', ' ')}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Portion Rule</span>
                            <span className="text-xs font-semibold text-slate-300">{dish.portionNote}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Raw Needed</span>
                            <span className="text-lg font-black text-emerald-400">
                              {dish.estimatedRawKg > 0 ? `${dish.estimatedRawKg} kg` : '1 Batch'}
                            </span>
                          </div>
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

export default KitchenPrepSheet;
