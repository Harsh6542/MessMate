import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

export const GuestMealsManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [mealFilter, setMealFilter] = useState('');

  // Rejection Modal
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (mealFilter) params.append('mealType', mealFilter);

      const res = await api.get(`/guest-meals?${params.toString()}`);
      if (res.success) {
        setRequests(res.data?.requests || []);
      }
    } catch (err) {
      toast.error('Failed to load guest meal requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, mealFilter]);

  const handleDecision = async (requestId, decision, reason = '') => {
    try {
      setProcessing(true);
      const res = await api.put(`/guest-meals/${requestId}/decision`, {
        decision,
        rejectionReason: reason
      });

      if (res.success) {
        toast.success(`Guest meal request ${decision} successfully.`);
        setRejectModalReq(null);
        setRejectionReason('');
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process decision.');
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Guest Meal Bookings & Visitor Approvals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Approve or reject student guest meal tickets. Approved guests automatically increment kitchen prep sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { label: 'All Requests', val: '' },
            { label: `Pending Review (${pendingCount})`, val: 'pending' },
            { label: 'Approved', val: 'approved' },
            { label: 'Rejected', val: 'rejected' }
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                statusFilter === tab.val
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none shadow-sm focus:border-emerald-500"
          >
            <option value="">All Meal Types</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </div>

      {/* Request Cards / Table */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Guest Meal Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When students submit guest meal requests, they will appear here for manager authorization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : req.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {req.status}
                  </span>

                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {req.mealType}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    {req.requestedBy?.firstName?.[0] || 'S'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Roll: {req.requestedBy?.rollNumber} • Room: {req.requestedBy?.roomNumber || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Meal Date:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {new Date(req.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Guest Count:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {req.guestCount} {req.guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Total Tariff:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">₹{req.totalAmountINR}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Purpose: </span>
                    {req.purpose}
                  </div>
                  {req.guestNames?.length > 0 && (
                    <div className="text-[10px] text-slate-500">
                      Names: {req.guestNames.join(', ')}
                    </div>
                  )}
                  {req.rejectionReason && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 italic pt-1">
                      Reason: {req.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {req.status === 'pending' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setRejectModalReq(req);
                      setRejectionReason('');
                    }}
                    disabled={processing}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-500/20 transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision(req._id, 'approved')}
                    disabled={processing}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Rejection Prompt */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <button
              onClick={() => setRejectModalReq(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Reject Guest Meal Request
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Provide a reason for declining {rejectModalReq.requestedBy?.firstName}'s request for {rejectModalReq.guestCount} guest(s).
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Mess seating capacity full during dinner session"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full mt-3 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision(rejectModalReq._id, 'rejected', rejectionReason)}
                disabled={processing}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestMealsManager;

