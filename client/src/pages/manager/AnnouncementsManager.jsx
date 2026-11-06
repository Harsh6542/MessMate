import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Bell, Send, Trash2, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      if (res.success && res.data?.announcements) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setPublishing(true);
      const res = await api.post('/announcements', {
        title: title.trim(),
        content: content.trim(),
        priority
      });

      if (res.success) {
        toast.success('Announcement broadcast to all residents!');
        setTitle('');
        setContent('');
        setPriority('normal');
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this announcement?')) return;
    try {
      const res = await api.delete(`/announcements/${id}`);
      if (res.success) {
        toast.success('Announcement removed.');
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove announcement');
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'important':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mess Announcements & Bulletins</h1>
        <p className="text-xs text-slate-500 mt-1">
          Broadcast emergency timing updates, special meal notifications, and health advisories in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Publish Form Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            New Broadcast
          </h3>

          <form onSubmit={handlePublish} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Special Diwali Feast Timing"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="normal">Normal Information</option>
                <option value="important">Important Update</option>
                <option value="urgent">Urgent / Immediate Action</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message content for hostel residents..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {publishing ? 'Broadcasting...' : 'Broadcast Bulletin'}
            </button>
          </form>
        </div>

        {/* Announcements List Column */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Active Broadcasts</span>
            <span className="text-xs font-normal text-slate-400">{announcements.length} bulletins</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No active announcements broadcast currently.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {announcements.map((a) => (
                <div key={a._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getPriorityBadge(a.priority)}`}>
                      {a.priority}
                    </span>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{a.title}</h4>
                  <p className="text-xs text-slate-600 whitespace-pre-line">{a.content}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>By: {a.publishedBy?.firstName} ({a.publishedBy?.role})</span>
                    <span>{new Date(a.publishedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
