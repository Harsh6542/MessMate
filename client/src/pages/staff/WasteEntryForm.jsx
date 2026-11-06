import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Scale,
  TrendingDown,
  UtensilsCrossed,
  Trash2,
  DollarSign,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const WasteEntryForm = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    totalPreparedServings: '',
    totalActualServed: '',
    unservedSurplusWeightKg: '',
    plateWasteWeightKg: '',
    estimatedCostLostINR: '',
    disposalMethod: 'biogas',
    remarks: ''
  });

  const fetchSessionOptions = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const [prepRes, logsRes] = await Promise.all([
        api.get(`/demand/prep-sheet?date=${todayStr}`),
        api.get('/waste-logs?limit=5')
      ]);

      if (prepRes.success && prepRes.data?.prepSheets?.length) {
        setSessions(prepRes.data.prepSheets);
        // Default to active or first session
        const first = prepRes.data.prepSheets[0];
        setSelectedSessionId(first.sessionId);
        setFormData((prev) => ({
          ...prev,
          totalPreparedServings: first.targetCookingServings || '',
          totalActualServed: first.actualServedCount || ''
        }));
      }

      if (logsRes.success) {
        setRecentLogs(logsRes.data?.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load meal session options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionOptions();
  }, []);

  const handleSessionChange = (sessionId) => {
    setSelectedSessionId(sessionId);
    const selected = sessions.find((s) => s.sessionId === sessionId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        totalPreparedServings: selected.targetCookingServings || '',
        totalActualServed: selected.actualServedCount || ''
      }));
    }
  };

  // Auto calculate cost when weights change
  const handleWeightChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const surplus = Number(field === 'unservedSurplusWeightKg' ? val : formData.unservedSurplusWeightKg) || 0;
    const plate = Number(field === 'plateWasteWeightKg' ? val : formData.plateWasteWeightKg) || 0;
    // ~Rs 50/kg surplus, ~Rs 35/kg plate waste
    updated.estimatedCostLostINR = Math.round(surplus * 50 + plate * 35);
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error('Please select a meal session.');
      return;
    }

    const surplus = Number(formData.unservedSurplusWeightKg);
    const plate = Number(formData.plateWasteWeightKg);

    if (isNaN(surplus) || surplus < 0 || isNaN(plate) || plate < 0) {
      toast.error('Please enter valid non-negative weights for waste.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/waste-logs', {
        mealSessionId: selectedSessionId,
        totalPreparedServings: Number(formData.totalPreparedServings) || 0,
        totalActualServed: Number(formData.totalActualServed) || 0,
        unservedSurplusWeightKg: surplus,
        plateWasteWeightKg: plate,
        estimatedCostLostINR: Number(formData.estimatedCostLostINR) || 0,
        disposalMethod: formData.disposalMethod,
        remarks: formData.remarks
      });

      if (res.success) {
        toast.success('Food waste scale record logged successfully!');
        setFormData({
          totalPreparedServings: '',
          totalActualServed: '',
          unservedSurplusWeightKg: '',
          plateWasteWeightKg: '',
          estimatedCostLostINR: '',
          disposalMethod: 'biogas',
          remarks: ''
        });
        fetchSessionOptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit waste record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
          <Scale className="w-6 h-6 text-rose-400" />
          Meal Scale Log & Waste Entry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Record empirical weight measurements after each meal service to monitor kitchen surplus and student plate waste.
        </p>
      </div>

      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Session Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Select Meal Session *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sessions.map((s) => (
                    <button
                      type="button"
                      key={s.sessionId}
                      onClick={() => handleSessionChange(s.sessionId)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex flex-col items-center gap-1 ${
                        selectedSessionId === s.sessionId
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{s.mealType}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        Served: {s.actualServedCount} heads
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Servings Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Prepared Servings
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={formData.totalPreparedServings}
                    onChange={(e) => setFormData({ ...formData, totalPreparedServings: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Actual Served (Attendance)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 415"
                    value={formData.totalActualServed}
                    onChange={(e) => setFormData({ ...formData, totalActualServed: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Physical Scale Weights Row */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-amber-400 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">Unserved Surplus</span>
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      placeholder="0.0"
                      value={formData.unservedSurplusWeightKg}
                      onChange={(e) => handleWeightChange('unservedSurplusWeightKg', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-2xl font-black text-amber-400 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                    />
                    <span className="text-sm font-bold text-slate-400">kg</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Food left over in kitchen vessels</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-rose-400 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">Plate Waste</span>
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      placeholder="0.0"
                      value={formData.plateWasteWeightKg}
                      onChange={(e) => handleWeightChange('plateWasteWeightKg', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-2xl font-black text-rose-400 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                    />
                    <span className="text-sm font-bold text-slate-400">kg</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Food discarded in wash bins by students</p>
                </div>
              </div>

              {/* Cost & Disposal Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Est. Financial Loss (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCostLostINR}
                    onChange={(e) => setFormData({ ...formData, estimatedCostLostINR: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-bold rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Disposal / Recycling Method
                  </label>
                  <select
                    value={formData.disposalMethod}
                    onChange={(e) => setFormData({ ...formData, disposalMethod: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  >
                    <option value="biogas">Biogas Plant Conversion</option>
                    <option value="compost">Organic Composting Unit</option>
                    <option value="pig_farm_donation">Livestock / Animal Feed</option>
                    <option value="municipal_waste">Municipal Solid Waste</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Observations / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kitchen Observations & Waste Root Cause
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High plate waste observed for dinner sabzi; rice preparation was 15 kg excess due to rain turnout reduction."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-rose-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4" />
                {submitting ? 'Submitting Scale Record...' : 'Commit Scale Measurement Record'}
              </button>
            </form>
          </div>

          {/* Quick Recent Log History */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Recently Logged Scale Weights
              </h3>

              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">
                  No scale logs recorded yet today.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div
                      key={log._id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200 capitalize">
                          {log.mealSession?.mealType || 'Meal'} Session
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1">
                        <span>Surplus: <b className="text-amber-400">{log.unservedSurplusWeightKg} kg</b></span>
                        <span>Plate: <b className="text-rose-400">{log.plateWasteWeightKg} kg</b></span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 capitalize">{log.disposalMethod?.replace('_', ' ')}</span>
                        <span className="text-emerald-400 font-bold">₹{log.estimatedCostLostINR} loss</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400">
              <span className="font-bold text-slate-300 block mb-0.5">Scale Protocol:</span>
              Always weigh the unserved serving pans before cleaning. Tare the container weight on the scale.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteEntryForm;
