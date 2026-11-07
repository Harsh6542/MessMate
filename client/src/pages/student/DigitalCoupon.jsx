import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { stopAllWebcamTracks } from '../../utils/cameraUtils';
import {
  Wallet,
  QrCode,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Utensils,
  Receipt,
  CreditCard,
  X,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

// Synthetic UPI / PhonePe style chime using Web Audio API
const playPaymentSuccessChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone cheerful success chime: E5 (659Hz) -> A5 (880Hz) -> C#6 (1108Hz)
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.setValueAtTime(880.0, now + 0.1);
    osc.frequency.setValueAtTime(1108.73, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch {}
};

export const DigitalCoupon = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scan_pay'); // 'scan_pay' | 'my_qr' | 'history'

  // Scanner & Payment state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPayload, setScannedPayload] = useState(null);
  const [payAmount, setPayAmount] = useState(50);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const scannerRef = useRef(null);

  // Fetch student wallet and transaction passbook
  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/wallet');
      const data = res?.data || res;
      if (res?.success || data?.wallet) {
        setWalletData(data);
        if (data.recentTransactions) {
          setRecentTransactions(data.recentTransactions);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load coupon wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Initialize html5-qrcode scanner when scanner modal opens
  useEffect(() => {
    let isCancelled = false;

    if (!isScanning) {
      stopAllWebcamTracks(scannerRef.current);
      scannerRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      if (isCancelled) return;

      try {
        const scanner = new Html5QrcodeScanner(
          'student-counter-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );

        scannerRef.current = scanner;

        const onScanSuccess = (decodedText) => {
          handleDetectedCounterQR(decodedText);
        };

        const onScanFailure = () => {};

        scanner.render(onScanSuccess, onScanFailure);
      } catch (err) {
        console.error('Camera init error:', err);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopAllWebcamTracks(scannerRef.current);
      scannerRef.current = null;
    };
  }, [isScanning]);

  // Teardown camera on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAllWebcamTracks(scannerRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopAllWebcamTracks(scannerRef.current);
    };
  }, []);

  const handleDetectedCounterQR = (qrString) => {
    stopAllWebcamTracks(scannerRef.current);
    scannerRef.current = null;
    setIsScanning(false);
    setScannedPayload(qrString);
  };

  const rawWallet = walletData?.wallet || {};
  const wallet = {
    balanceAmount: typeof rawWallet.balanceAmount === 'number' ? rawWallet.balanceAmount : 6000,
    semesterTotalAmount: rawWallet.semesterTotalAmount || 6000,
    monthlyMaxAmount: rawWallet.monthlyMaxAmount || 1000,
    currentMonthAmountSpent: rawWallet.currentMonthAmountSpent || 0,
    monthlyRemaining: typeof rawWallet.monthlyRemaining === 'number'
      ? rawWallet.monthlyRemaining
      : Math.max(0, 1000 - (rawWallet.currentMonthAmountSpent || 0))
  };

  const isMonthlyLimitReached = wallet.monthlyRemaining <= 0;
  const isSemesterLimitReached = wallet.balanceAmount <= 0;

  const numPayAmount = Number(payAmount) || 0;
  const isAmountValid =
    numPayAmount >= 1 &&
    numPayAmount <= 1000 &&
    numPayAmount <= wallet.monthlyRemaining &&
    numPayAmount <= wallet.balanceAmount;

  let validationError = '';
  if (isMonthlyLimitReached) {
    validationError = 'Monthly limit reached (₹0 remaining). Next month ₹1,000 will be added again.';
  } else if (isSemesterLimitReached) {
    validationError = 'Semester balance is ₹0. All ₹6,000 has been used.';
  } else if (!numPayAmount || numPayAmount < 1) {
    validationError = 'Please enter an amount of at least ₹1.';
  } else if (numPayAmount > 1000) {
    validationError = 'Single payment cannot exceed ₹1,000.';
  } else if (numPayAmount > wallet.monthlyRemaining) {
    validationError = `Amount exceeds monthly remaining balance of ₹${wallet.monthlyRemaining}.`;
  } else if (numPayAmount > wallet.balanceAmount) {
    validationError = `Amount exceeds available semester balance of ₹${wallet.balanceAmount}.`;
  }

  // Perform Payment
  const executePayment = async (counterQRToPay) => {
    const finalAmount = Math.round(Number(payAmount) || 0);
    if (finalAmount < 1 || finalAmount > 1000) {
      toast.error('Payment amount must be between ₹1 and ₹1,000');
      return;
    }
    if (finalAmount > wallet.monthlyRemaining) {
      toast.error(`Exceeds monthly limit. Only ₹${wallet.monthlyRemaining} left this month.`);
      return;
    }
    if (finalAmount > wallet.balanceAmount) {
      toast.error(`Exceeds semester balance of ₹${wallet.balanceAmount}.`);
      return;
    }

    try {
      setIsPaying(true);
      const res = await api.post('/coupons/pay-counter', {
        counterQR: counterQRToPay || scannedPayload,
        amount: finalAmount
      });

      const receipt = res?.data || res;
      if (res?.success || receipt?.transactionId) {
        playPaymentSuccessChime();
        setPaymentSuccessData(receipt);
        setScannedPayload(null);
        toast.success(`₹${finalAmount} Paid Successfully!`);
        fetchWallet();
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please check coupon limits.');
    } finally {
      setIsPaying(false);
    }
  };

  // Quick Pay helper for desktop / testing
  const handleQuickPayAssignedMess = () => {
    const defaultMessQR = walletData?.student?.messId
      ? `MESSMATE:COUNTER:${walletData.student.messId}:${walletData.student.mess || 'Mess'}`
      : `MESSMATE:COUNTER:assigned_mess`;
    setScannedPayload(defaultMessQR);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            Mess Wallet & Pay
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total Semester Allotment: ₹6,000 • Monthly Limit: Up to ₹1,000 (Flexible ₹1 - ₹1,000)
          </p>
        </div>
        <button
          onClick={fetchWallet}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
          title="Refresh Wallet"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── POLICY NOTICE ── */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-emerald-300">Regular Meals are Free: </span>
          Your usual daily meals (Breakfast, Lunch, Dinner) are <b className="text-white">100% included in your hostel fee</b> with no wallet deduction. You can make any payment from <b className="text-white">₹1 to ₹1,000</b> at the counter from your allotted ₹6,000 semester wallet whenever you want extra mess items. Up to ₹1,000 can be spent per month; if monthly balance reaches ₹0, payments pause until next month when ₹1,000 will be added again.
        </div>
      </div>

      {/* ── PHONEPE STYLE WALLET CARD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-7 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Row: Brand & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                Mess Digital Wallet
              </span>
              <span className="text-xs text-slate-400 font-medium">Spring 2026 Semester</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Allotted ₹6,000
            </div>
          </div>

          {/* Main Balance Display */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Available Semester Balance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ₹{wallet.balanceAmount?.toLocaleString('en-IN') || '6,000'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / ₹{wallet.semesterTotalAmount?.toLocaleString('en-IN') || '6,000'} Semester Allotment
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Monthly Allowance Left
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700/80">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className={`text-base font-black ${isMonthlyLimitReached ? 'text-rose-400' : 'text-emerald-300'}`}>
                  ₹{wallet.monthlyRemaining?.toLocaleString('en-IN')} / ₹1,000
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Quota Meter (Max ₹1,000 per month) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Monthly Limit: Up to ₹1,000 per month
              </span>
              <span className="font-bold text-slate-200">
                ₹{wallet.currentMonthAmountSpent?.toLocaleString('en-IN')} Spent • ₹{wallet.monthlyRemaining?.toLocaleString('en-IN')} Remaining
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMonthlyLimitReached
                    ? 'bg-rose-500'
                    : wallet.currentMonthAmountSpent > 700
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: `${Math.min(100, ((wallet.currentMonthAmountSpent || 0) / (wallet.monthlyMaxAmount || 1000)) * 100)}%`
                }}
              />
            </div>

            {isMonthlyLimitReached && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Monthly limit reached (₹0 remaining this month). You cannot make any payment this month. Next month ₹1,000 will be added again. Regular meals remain free!
              </p>
            )}
            {isSemesterLimitReached && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Semester balance exhausted (₹0 remaining of ₹6,000). Regular meals remain 100% free!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('scan_pay')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'scan_pay'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Scan & Pay (PhonePe)
        </button>

        <button
          onClick={() => setActiveTab('my_qr')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'my_qr'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <QrCode className="w-4 h-4" />
          My Mess QR Code
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Passbook ({recentTransactions.length})
        </button>
      </div>

      {/* ── TAB 1: SCAN & PAY (PHONEPE FLOW) ── */}
      {activeTab === 'scan_pay' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ScanLine className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-lg font-black text-slate-100">Pay at Mess Counter Standee</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan the Standee QR placed at the mess counter or use Quick Pay to pay any flexible amount from ₹1 to ₹1,000 from your semester wallet.
            </p>
          </div>

          {isMonthlyLimitReached && (
            <div className="max-w-md mx-auto p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Monthly limit reached (₹0 remaining this month). Payments are paused. Next month ₹1,000 will be added again into your wallet.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              disabled={isMonthlyLimitReached || isSemesterLimitReached}
              onClick={() => setIsScanning(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98"
            >
              <ScanLine className="w-4 h-4" />
              Open Camera Scanner
            </button>

            <button
              disabled={isMonthlyLimitReached || isSemesterLimitReached}
              onClick={handleQuickPayAssignedMess}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Quick Pay at {walletData?.student?.mess || 'Hostel Mess'}
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/60 text-[11px] text-slate-400">
            <span>Flexible ₹1 – ₹1,000</span>
            <span>•</span>
            <span>Max ₹1,000 / month</span>
            <span>•</span>
            <span>₹6,000 / semester</span>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY UNIQUE PERMANENT QR CODE ── */}
      {activeTab === 'my_qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
          <div>
            <h2 className="text-lg font-black text-slate-100">Permanent Student Mess QR</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Show this QR code at the mess counter for regular meals or for staff to scan and deduct wallet payments.
            </p>
          </div>

          {/* QR Display Card */}
          <div className="inline-block p-5 bg-white rounded-3xl shadow-2xl border border-slate-700">
            <QRCodeSVG
              value={walletData?.uniqueStudentQR || `MESSMATE:STUDENT:${user?.id}:${user?.rollNumber || 'STU'}`}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Dual Usage Clarification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left text-xs">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Regular Meal Entry
              </span>
              <p className="text-slate-400 text-[11px]">
                Everyday breakfast, lunch & dinner. <b>100% Free / ₹0 deducted</b> from wallet.
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mess Wallet Payment
              </span>
              <p className="text-slate-400 text-[11px]">
                Staff can scan this to deduct any payment amount (₹1 to ₹1,000) from your semester wallet.
              </p>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="max-w-md mx-auto p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between text-left text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-slate-200">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-slate-400 text-[11px]">Roll: {user?.rollNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-300">{walletData?.student?.hostel || 'Hostel Resident'}</p>
              <p className="text-slate-400 text-[11px]">Room: {walletData?.student?.roomNumber || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PASSBOOK & HISTORY ── */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Mess Wallet Passbook
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {recentTransactions.length} Transactions
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs space-y-1">
              <p>No mess payments yet.</p>
              <p className="text-[11px]">Your allotted ₹6,000 semester balance is fully available!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id || tx.transactionId}
                  className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 uppercase">
                        Mess Payment
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {tx.transactionId}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(tx.redeemedAt).toLocaleDateString()} at{' '}
                        {new Date(tx.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        <span className="uppercase">{tx.mealType}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-rose-400 text-sm block">
                      -₹{tx.amount || 500}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Redeemed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAMERA SCANNER MODAL ── */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <ScanLine className="w-4 h-4 text-emerald-400" />
                Scan Mess Standee QR
              </div>
              <button
                onClick={() => {
                  stopAllWebcamTracks(scannerRef.current);
                  setIsScanning(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black rounded-2xl overflow-hidden border border-slate-800">
              <div id="student-counter-reader" className="w-full"></div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Point camera at the Mess Standee QR code on the counter.
            </p>
          </div>
        </div>
      )}

      {/* ── PAYMENT CONFIRMATION SHEET ── */}
      {scannedPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Confirm Mess Payment
              </span>
              <button
                onClick={() => setScannedPayload(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white">
                Pay at Mess Counter
              </h3>
              <p className="text-xs text-slate-400">
                Facility: {walletData?.student?.mess || 'Hostel Dining Hall'}
              </p>
            </div>

            {/* Flexible Amount Input (₹1 to ₹1,000) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Enter Payment Amount (₹1 to ₹1,000)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={Math.min(1000, wallet.monthlyRemaining)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-2xl pl-11 pr-4 py-3 text-2xl font-black text-white focus:outline-none"
                  placeholder="50"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[20, 50, 100, 200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPayAmount(preset)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl border transition ${
                      Number(payAmount) === preset
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Message */}
            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Price Breakdown Box */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Amount to Deduct</span>
                <span className="text-lg font-black text-white">₹{numPayAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                <span>Debited From</span>
                <span className="font-semibold text-slate-200">Mess Semester Wallet</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Monthly Allowance After</span>
                <span className={`font-semibold ${
                  wallet.monthlyRemaining - numPayAmount <= 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  ₹{Math.max(0, wallet.monthlyRemaining - numPayAmount)} remaining of ₹1,000
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Semester Balance After</span>
                <span className="font-semibold text-emerald-400">
                  ₹{Math.max(0, wallet.balanceAmount - numPayAmount)} remaining of ₹6,000
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              disabled={isPaying || !isAmountValid}
              onClick={() => executePayment(scannedPayload)}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPaying ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Authorizing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{numPayAmount || 0} from Mess Wallet
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── PHONEPE STYLE PAYMENT SUCCESS CELEBRATION ── */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-7 max-w-md w-full text-center space-y-6 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-95 duration-200">
            {/* Animated Checkmark Circle */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-slate-950 shadow-xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">₹{paymentSuccessData.amount}.00 Paid</h2>
              <p className="text-xs font-semibold text-emerald-400">Payment Successful</p>
              <p className="text-xs text-slate-400">
                Mess: {paymentSuccessData.messName || 'Dining Hall'}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-mono font-bold text-slate-200">
                  {paymentSuccessData.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-semibold text-emerald-400">
                  ₹{paymentSuccessData.amount}.00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time & Date</span>
                <span className="text-slate-300">
                  {new Date(paymentSuccessData.paidAt).toLocaleTimeString()} •{' '}
                  {new Date(paymentSuccessData.paidAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700/60">
                <span className="text-slate-400">Remaining Monthly Allowance</span>
                <span className="font-bold text-amber-300">
                  ₹{paymentSuccessData.monthlyRemaining} / ₹1,000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining Semester Balance</span>
                <span className="font-bold text-emerald-400">
                  ₹{paymentSuccessData.walletBalance} / ₹6,000
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setPaymentSuccessData(null);
                setActiveTab('history');
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-emerald-500/20"
            >
              Done / View in Passbook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalCoupon;
