import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Filter,
  Send,
  X
} from 'lucide-react';

export const ComplaintsQueue = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Response dialog state
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/complaints?status=${statusFilter}` : '/complaints';
      const res = await api.get(url);
      if (res.success && res.data?.complaints) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await api.post(`/complaints/${selectedComplaint._id}/respond`, {
        message: replyMessage,
        isInternal,
        newStatus: replyStatus
      });

      if (res.success) {
        toast.success('Response recorded and status updated');
        setReplyMessage('');
        setSelectedComplaint(null);
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Grievances Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review reported concerns, address student hygiene feedback, and maintain resolution SLA timers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['', 'submitted', 'in_progress', 'resolved', 'escalated'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Grievances'}
          </button>
        ))}
      </div>

      {/* Complaints Table/Cards */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading complaints queue...</div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="font-bold text-slate-700">No Pending Complaints</p>
          <p>All student tickets in this filter view have been handled!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {c.complaintId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {c.category?.replace('_', ' ')}
                  </span>
                  {c.isConfidential && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Anonymous
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-800">{c.subject}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{c.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Student: {c.complainant?.firstName} {c.complainant?.lastName} ({c.complainant?.rollNumber})</span>
                  <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className="text-rose-600 font-semibold uppercase text-[10px]">
                    Priority: {c.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedComplaint(c);
                    setReplyStatus(c.status);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Respond / Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  #{selectedComplaint.complaintId}
                </span>
                <h3 className="text-base font-bold text-slate-800">{selectedComplaint.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{selectedComplaint.description}"
            </p>

            <form onSubmit={handleSendReply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Workflow Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress (Kitchen investigating)</option>
                  <option value="resolved">Resolved (Issue addressed)</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Response Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="e.g. Spoke with Head Chef; ingredient batch was inspected and corrective action taken."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internalToggle"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="internalToggle" className="text-xs text-slate-600 cursor-pointer">
                  Internal staff note only (Hidden from student)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReply ? 'Recording...' : 'Post Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsQueue;
