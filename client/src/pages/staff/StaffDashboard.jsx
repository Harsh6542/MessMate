import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ScanLine,
  Users,
  Utensils,
  TrendingDown,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Flame,
  ArrowRight,
  QrCode,
  Printer,
  X,
  CreditCard,
  Building2
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket() || {};
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [livePayments, setLivePayments] = useState([]);

  const fetchStaffDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/staff');
      const payload = res?.data || res;
      if (res?.success || res?.status === 'success' || payload) {
        setStaffData(payload);
      }

      // Also fetch today's counter payments
      try {
        const payRes = await api.get('/coupons/counter-payments');
        if (payRes?.data) {
          setLivePayments(payRes.data);
        }
      } catch {}
    } catch (err) {
      toast.error('Failed to load staff dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDashboard();
  }, []);

  // Real-time counter payments feed
  useEffect(() => {
    if (!socket) return;

    const handlePayment = (payment) => {
      toast.success(`₹${payment.amount} Paid by ${payment.student?.name} (${payment.student?.rollNumber || 'Roll'})`, {
        icon: '💵',
        duration: 4000
      });
      setLivePayments((prev) => [
        {
          _id: payment.transactionId,
          transactionId: payment.transactionId,
          amount: payment.amount,
          student: payment.student,
          mealSession: { mealType: payment.mealType },
          redeemedAt: payment.timestamp
        },
        ...prev
      ]);
    };

    socket.on('counter:payment', handlePayment);

    return () => {
      socket.off('counter:payment', handlePayment);
    };
  }, [socket]);

  const activeSess = staffData?.activeSession;
  const todayBreakdown = staffData?.todayBreakdown || [];
  const recentScans = staffData?.recentScans || [];
  const pendingWaste = staffData?.pendingWasteLogSession;
  const messInfo = staffData?.messInfo;

  const counterQR = messInfo?.counterQR || `MESSMATE:COUNTER:${messInfo?.id || 'mess'}:${encodeURIComponent((messInfo?.name || 'Mess').replace(/\s+/g, '_'))}`;

  return (
    <div className="space-y-6">
      {/* Staff Greeting & Standee Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <ScanLine className="w-6 h-6 text-emerald-400" />
            Mess Staff Operations Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as {user?.firstName} ({user?.role?.replace('_', ' ')?.toUpperCase()}) • Fast QR verification & PhonePe-style live counter payments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowStandeeModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition active:scale-98"
          >
            <QrCode className="w-4 h-4" />
            Mess Counter Standee
          </button>

          <button
            onClick={fetchStaffDashboard}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Pending Waste Log Alert Banner */}
          {pendingWaste && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Scale Log Pending for {pendingWaste.mealType?.toUpperCase()}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Please weigh the unserved surplus and plate waste containers to close the session record.
                  </p>
                </div>
              </div>

              <Link
                to="/staff/waste-entry"
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shrink-0 transition"
              >
                Log Weights Now →
              </Link>
            </div>
          )}

          {/* Active Meal Shift Hero Card */}
          {activeSess ? (
            <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                        activeSess.isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {activeSess.isActive ? '● ACTIVE MEAL SESSION' : 'UPCOMING SESSION'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Window:{' '}
                      <b className="text-slate-200">
                        {new Date(activeSess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        -{' '}
                        {new Date(activeSess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </b>
                    </span>
                  </div>

                  <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tight">
                    {activeSess.mealType} Service
                  </h2>
                </div>

                {/* Big Live Attendance Counts */}
                <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700 rounded-2xl p-4 self-start md:self-auto">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Served Count</span>
                    <span className="text-3xl font-black text-emerald-400">{activeSess.actualServedCount}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Heads</span>
                    <span className="text-2xl font-bold text-slate-200">{activeSess.declaredDemand}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                    <span className="text-2xl font-bold text-amber-400">{activeSess.remainingExpected}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
                  <span>Attendance Progress</span>
                  <span className="text-emerald-400">{activeSess.percentageServed}% Served</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, activeSess.percentageServed)}%` }}
                  />
                </div>
              </div>

              {/* Primary Touch Actions for Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <Link
                  to="/staff/scanner"
                  className="py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <ScanLine className="w-5 h-5" />
                  Scan Student QR
                </Link>

                <button
                  onClick={() => setShowStandeeModal(true)}
                  className="py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Show Counter QR
                </button>

                <Link
                  to="/staff/manual-verify"
                  className="py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  Manual Roll Search
                </Link>

                <Link
                  to="/staff/waste-entry"
                  className="py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  Log Scale Waste
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-10 text-center">
              <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-300">No Shift Currently Scheduled</h3>
            </div>
          )}

          {/* Real-time PhonePe-style Counter Payments Feed */}
          {livePayments.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Live Counter QR Payments (PhonePe Flow)
                </h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {livePayments.length} Payments Received
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {livePayments.slice(0, 6).map((pay) => (
                  <div
                    key={pay._id || pay.transactionId}
                    className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-100 text-xs text-amber-300">
                        {pay.specialItemName || 'Mess Coupon (₹500)'}
                      </p>
                      <p className="text-[11px] text-slate-200 font-bold">
                        {pay.student?.name || `${pay.student?.firstName || ''} ${pay.student?.lastName || ''}`.trim() || 'Student'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Roll: {pay.student?.rollNumber || 'N/A'} • Room: {pay.student?.roomNumber || '—'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {pay.redeemedAt ? new Date(pay.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-400 text-sm block">
                        +₹{pay.amount || 500}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        1 Coupon
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's 3 Shifts Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Today's Meal Shifts Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {todayBreakdown.map((s) => (
                <div
                  key={s.sessionId}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-sm uppercase text-slate-200">{s.mealType}</h4>
                    <span className="text-[10px] text-slate-400 capitalize">Status: {s.status}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-400">{s.actualServedCount}</span>
                    <span className="text-xs text-slate-400"> / {s.declaredDemand} heads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Live Scans Audit Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recent Attendance Verifications ({recentScans.length})
            </h3>

            {recentScans.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No attendance scans recorded for this mess session yet.
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Roll Number</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Verification Mode</th>
                        <th className="px-4 py-3 text-right">Time Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {recentScans.map((scan) => (
                        <tr key={scan._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-2.5 font-bold text-slate-100">
                            {scan.student?.firstName} {scan.student?.lastName}
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 font-mono">
                            {scan.student?.rollNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">
                            {scan.student?.roomNumber || '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                scan.verificationType === 'manual_override'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {scan.verificationType?.replace('_', ' ') || 'QR SCAN'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(scan.verifiedAt || scan.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
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

      {/* ── MESS COUNTER QR STANDEE MODAL ── */}
      {showStandeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Official Mess Standee
              </span>
              <button
                onClick={() => setShowStandeeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {messInfo?.name || 'Mess Dining Counter'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan & Pay 1 Mess Coupon (₹500)
              </p>
            </div>

            {/* Standee QR Display */}
            <div className="p-5 bg-white rounded-3xl shadow-2xl border border-slate-700 inline-block">
              <QRCodeSVG
                value={counterQR}
                size={230}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-amber-300">Mess Coupon: ₹500 (1 Coupon)</p>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Regular daily meals are 100% Free (Covered by hostel fee)
              </p>
              <p className="text-[10px] text-slate-400">
                Allotted: ₹6,000 / sem (12 coupons) • Monthly Limit: 2 coupons (₹1,000)
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Print Counter Standee
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
