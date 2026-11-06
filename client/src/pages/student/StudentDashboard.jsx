import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Utensils,
  QrCode,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Bell,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/student');
      const payload = res?.data || res;
      if (res?.success || res?.status === 'success' || payload) {
        setDashboardData(payload);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const nextSession = dashboardData?.nextSession;
  const todayMenu = dashboardData?.todayMenu;
  const stats = dashboardData?.attendanceStats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              NIT Patna Hostel Resident
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Roll: {user?.rollNumber || 'N/A'} • Room: {user?.roomNumber || 'N/A'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">
            Your centralized hostel mess portal. Review today's nutritious menu, declare absences to reduce food waste, generate secure QR coupons, and order guest passes.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/student/coupon"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <QrCode className="w-4 h-4" />
              Get Meal Coupon
            </Link>
            <Link
              to="/student/declarations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Meal Absence Planner
            </Link>
            <Link
              to="/student/feedback"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              <Star className="w-4 h-4 text-amber-400" />
              Rate Attended Meal
            </Link>
          </div>
        </div>

        {/* Decorative corner icon */}
        <Utensils className="absolute -bottom-8 -right-8 w-48 h-48 text-slate-800/40 pointer-events-none" />
      </div>

      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !dashboardData ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Connecting to Mess Telemetry...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Unable to load meal dashboard information. Please make sure the backend server is running and click retry.
          </p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Active / Next Meal Hero Card */}
          {nextSession ? (
            <div className="bg-slate-800/50 border border-slate-700/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                        nextSession.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {nextSession.isActive ? '• Serving Now' : 'Upcoming Meal'}
                    </span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {nextSession.mealType}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-slate-100 capitalize">
                    {nextSession.mealType} Session
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1 text-slate-300 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {new Date(nextSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      -{' '}
                      {new Date(nextSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>
                      Cutoff:{' '}
                      <b className="text-slate-300">
                        {new Date(nextSession.cutoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </b>
                    </span>
                  </div>

                  {/* Opt-out state indicator */}
                  {dashboardData?.hasDeclaredOptOut ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-bold border border-rose-500/30">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      You have declared absence for this meal (Coupon Inactive)
                    </div>
                  ) : (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Meal Confirmed (Eligible for instant QR Coupon)
                    </div>
                  )}
                </div>

                {/* Right side Action & Menu Preview */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 lg:w-96">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                    <span>Menu Dishes</span>
                    <Link to="/student/menu" className="text-[10px] text-emerald-400 hover:underline">
                      Full Menu →
                    </Link>
                  </h4>

                  {!todayMenu?.dishes?.length ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      Menu dishes will be updated shortly by mess management.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {todayMenu.dishes.map((dish, i) => (
                        <span
                          key={dish._id || i}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          {dish.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      to="/student/coupon"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs text-center rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Open QR Coupon
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Meals Attended
              </span>
              <div className="text-2xl font-black text-slate-100 mt-1">
                {stats?.attendedPast30Days || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">In the past 30 days</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Declared Opt-Outs
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                {stats?.optOutsPast30Days || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Planned absences saved food</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Guest Passes
              </span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {dashboardData?.guestRequests?.length || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Upcoming visitor tickets</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Open Grievances
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {dashboardData?.recentComplaints?.filter((c) => c.status !== 'closed' && c.status !== 'resolved').length || 0}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Active tickets in SLA</p>
            </div>
          </div>

          {/* Grievances & Announcements Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Recent Grievances */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    My Grievance & Complaint Tickets
                  </h3>
                  <Link to="/student/complaints" className="text-xs text-emerald-400 hover:underline">
                    View All →
                  </Link>
                </div>

                {!dashboardData?.recentComplaints?.length ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    No complaints lodged recently. Tap below if you need food hygiene or quantity assistance.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {dashboardData.recentComplaints.map((c) => (
                      <Link
                        key={c._id}
                        to={`/student/complaints/${c._id}`}
                        className="block bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200">{c.title || c.subject}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              c.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {c.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <Link
                  to="/student/complaints/new"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  + Lodge New Grievance
                </Link>
              </div>
            </div>

            {/* Mess Announcements Bulletin */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  Mess Announcements & Bulletins
                </h3>
              </div>

              {!dashboardData?.announcements?.length ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">
                  No active announcements for your hostel.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {dashboardData.announcements.map((a) => (
                    <div
                      key={a._id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-100 flex items-center gap-1.5">
                          {a.isPinned && <span className="text-emerald-400">📌</span>}
                          {a.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
