import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  Send
} from 'lucide-react';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/complaints/${id}`);
      if (res.success && res.data?.complaint) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleReopen = async (e) => {
    e.preventDefault();
    try {
      setIsReopening(true);
      const res = await api.post(`/complaints/${id}/reopen`, { reason: reopenReason });
      if (res.success) {
        toast.success('Complaint reopened and escalated back to queue.');
        setReopenReason('');
        fetchDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reopen complaint');
    } finally {
      setIsReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">Loading grievance history...</div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">Grievance record not found.</div>
    );
  }

  const isResolvedOrClosed =
    complaint.status === 'resolved' || complaint.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/student/complaints"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints
      </Link>

      {/* Complaint Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
              {complaint.complaintId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {complaint.status.replace('_', ' ')}
            </span>
            <span className="text-[10px] font-bold uppercase text-slate-400">
              {complaint.category.replace('_', ' ')}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Logged: {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">{complaint.subject}</h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </p>
        </div>

        {complaint.images && complaint.images.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Attached Photo:</span>
            <a
              href={complaint.images[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              View Image Evidence
            </a>
          </div>
        )}

        {complaint.resolutionDeadline && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              SLA Resolution Target:
            </span>
            <span className="font-mono font-semibold">
              {new Date(complaint.resolutionDeadline).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Threaded Responses Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Official Responses & Resolution Timeline ({complaint.responses?.length || 0})
        </h3>

        {complaint.responses?.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Waiting for mess authorities to investigate and post updates.
          </div>
        ) : (
          <div className="space-y-3">
            {complaint.responses.map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 capitalize">
                    {r.by?.firstName ? `${r.by.firstName} (${r.role.replace('_', ' ')})` : r.role}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reopen Action Form */}
        {isResolvedOrClosed && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 text-amber-700">
              <RotateCcw className="w-3.5 h-3.5" />
              Issue Still Not Resolved?
            </h4>
            <form onSubmit={handleReopen} className="space-y-2">
              <input
                type="text"
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="State why the resolution was inadequate..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isReopening}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
              >
                {isReopening ? 'Reopening...' : 'Reopen Grievance Ticket'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetail;

