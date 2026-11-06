import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AlertCircle, Plus, Clock, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';

export const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const url = filterStatus ? `/complaints?status=${filterStatus}` : '/complaints';
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
  }, [filterStatus]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'escalated':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-600 font-bold';
      case 'high':
        return 'text-amber-600 font-bold';
      case 'medium':
        return 'text-slate-600';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Grievance & Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track reported issues, monitor resolution SLAs, and communicate directly with hostel authorities.
          </p>
        </div>
        <Link
          to="/student/complaints/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Lodge New Complaint
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['', 'submitted', 'in_progress', 'resolved', 'escalated'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterStatus === st
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Tickets'}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No grievances logged</p>
            <p className="max-w-xs mx-auto">
              If you experience issues with food hygiene, taste, cleanliness, or staff behaviour, file a ticket.
            </p>
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{c.complaintId}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getStatusBadge(
                      c.status
                    )}`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Category: {c.category.replace('_', ' ')}
                  </span>
                  {c.isConfidential && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Confidential
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-800">{c.subject}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                  <span>Responses: {c.responses?.length || 0}</span>
                  <span className={getPriorityBadge(c.priority)}>Priority: {c.priority}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/student/complaints/${c._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComplaintsList;
