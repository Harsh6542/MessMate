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
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Utensils,
  Receipt,
  User,
  CreditCard,
  Building2,
  X,
  ChevronRight,
  Info,
  Flame,
  Check
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

// Default catalog of special items if not yet loaded from backend
const DEFAULT_SPECIAL_ITEMS = [
  {
    id: 'chicken_curry',
    name: 'Special Chicken Curry / Roast',
    category: 'Non-Veg Special',
    price: 500,
    icon: '🍗',
    description: 'Tender chicken pieces cooked in rich spices / roast'
  },
  {
    id: 'egg_curry_dahi',
    name: 'Double Egg Curry & Sweet Curd (Dahi)',
    category: 'Egg & Dairy Add-on',
    price: 500,
    icon: '🥚',
    description: 'Two boiled eggs in curry paired with chilled sweet dahi'
  },
  {
    id: 'paneer_special',
    name: 'Shahi Paneer / Kadai Paneer Special',
    category: 'Veg Feast Special',
    price: 500,
    icon: '🧀',
    description: 'Rich cottage cheese cubes in buttery creamy tomato gravy'
  },
  {
    id: 'sweet_dahi_dessert',
    name: 'Sweet Yogurt (Dahi) & Dessert Treat',
    category: 'Dairy & Dessert',
    price: 500,
    icon: '🥣',
    description: 'Sweet sweetened dahi/curd cup paired with Gulab Jamun / Kheer'
  },
  {
    id: 'weekend_special',
    name: 'Weekend Treat (Fish Fry / Mutton Curry)',
    category: 'Weekend Special',
    price: 500,
    icon: '🐟',
    description: 'Crispy seasonal fish fry or homestyle mutton curry'
  },
  {
    id: 'custom_special',
    name: 'General Special Mess Food Item',
    category: 'Special Extra',
    price: 500,
    icon: '⭐',
    description: 'Valid for any chef special add-on dish at the dining counter'
  }
];

export const DigitalCoupon = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scan_pay'); // 'scan_pay' | 'my_qr' | 'history'

  // Special item selection
  const [selectedSpecialItem, setSelectedSpecialItem] = useState(DEFAULT_SPECIAL_ITEMS[0]);

  // Scanner & Payment state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPayload, setScannedPayload] = useState(null);
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

  // Initialize html5-qrcode scanner when scanner modal/view opens
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

  // Perform Payment for Selected Special Item
  const executePayment = async (counterQRToPay) => {
    try {
      setIsPaying(true);
      const res = await api.post('/coupons/pay-counter', {
        counterQR: counterQRToPay || scannedPayload,
        specialItemId: selectedSpecialItem?.id,
        specialItemName: selectedSpecialItem?.name
      });

      const receipt = res?.data || res;
      if (res?.success || receipt?.transactionId) {
        playPaymentSuccessChime();
        setPaymentSuccessData(receipt);
        setScannedPayload(null);
        toast.success(`₹500 Paid for ${receipt.specialItemName || selectedSpecialItem?.name}!`);
        fetchWallet();
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed. Please check your monthly or semester coupon limits.');
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

  const wallet = walletData?.wallet || {
    balanceAmount: 6000,
    semesterTotalAmount: 6000,
    totalCouponsAllocated: 12,
    couponsUsed: 0,
    couponsRemaining: 12,
    currentMonthCouponsUsed: 0,
    monthlyMaxCoupons: 2,
    monthlyCouponsRemaining: 2
  };

  const specialItemsList = walletData?.specialItems || DEFAULT_SPECIAL_ITEMS;
  const isMonthlyLimitReached = wallet.currentMonthCouponsUsed >= (wallet.monthlyMaxCoupons || 2);
  const isSemesterLimitReached = wallet.couponsRemaining <= 0 || wallet.balanceAmount < 500;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            Special Items Coupon Wallet & Pay
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Total Semester Allotment: ₹6,000 for Special Items (Chicken, Egg, Dahi, Paneer) • Max ₹1,000/month
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

      {/* ── IMPORTANT POLICY NOTICE: REGULAR MEALS ARE FREE ── */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-emerald-300">Regular Mess Meals are Included: </span>
          Your daily Breakfast, Lunch, and Dinner are <b className="text-white">100% covered by your standard hostel mess fee</b> with NO deduction from your wallet. This ₹6,000 wallet is an allotted allowance strictly for purchasing <b className="text-emerald-300">Special Food Items</b> (Chicken, Egg Curry, Sweet Dahi/Yogurt, Paneer, Desserts).
        </div>
      </div>

      {/* ── PHONEPE STYLE SPECIAL FOOD ITEMS WALLET CARD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-7 text-white">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Top Row: Brand & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                Special Items UPI Wallet
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
                Special Items Balance Available
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ₹{wallet.balanceAmount?.toLocaleString('en-IN') || '6,000'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  / ₹{wallet.semesterTotalAmount?.toLocaleString('en-IN') || '6,000'} Allotted
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Special Coupons Left
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700/80">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-base font-black text-amber-300">
                  {wallet.couponsRemaining} / {wallet.totalCouponsAllocated} Coupons (₹500 ea)
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Quota Meter (Max 2 coupons / ₹1,000 per month on Special Items) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Monthly Limit on Special Items: ₹1,000 max (2 Coupons)
              </span>
              <span className="font-bold text-slate-200">
                {wallet.currentMonthCouponsUsed} / {wallet.monthlyMaxCoupons || 2} Used this month (₹{wallet.currentMonthCouponsUsed * 500})
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMonthlyLimitReached
                    ? 'bg-rose-500'
                    : wallet.currentMonthCouponsUsed === 1
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: `${Math.min(100, ((wallet.currentMonthCouponsUsed || 0) / (wallet.monthlyMaxCoupons || 2)) * 100)}%`
                }}
              />
            </div>

            {isMonthlyLimitReached && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Monthly limit reached (2 special coupons / ₹1,000 used). Regular meals remain unlimited! Special quota unlocks on 1st of next month.
              </p>
            )}
            {isSemesterLimitReached && (
              <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Semester special quota exhausted! You have used all 12 special coupons (₹6,000). Regular meals are still available for free.
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
          Pay Special Item (PhonePe)
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

      {/* ── TAB 1: SCAN & PAY SPECIAL ITEM (PHONEPE FLOW) ── */}
      {activeTab === 'scan_pay' && (
        <div className="space-y-5">
          {/* Special Items Selection Menu */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Select Special Item to Redeem (₹500 / Coupon)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose which special mess add-on you want to pay for from your semester wallet.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                ₹500 ea
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {specialItemsList.map((item) => {
                const isSelected = selectedSpecialItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSpecialItem(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl shrink-0 mt-0.5">{item.icon}</div>
                    <div className="space-y-0.5 flex-1 pr-6">
                      <p className="font-bold text-xs text-slate-100">{item.name}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{item.description}</p>
                      <span className="text-[10px] font-semibold text-emerald-400 block pt-1">
                        1 Coupon (₹500)
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-slate-100">
                Pay ₹500 for: {selectedSpecialItem?.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the Standee QR on the mess counter to approve 1 coupon (₹500). Regular meal is completely free.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                disabled={isMonthlyLimitReached || isSemesterLimitReached}
                onClick={() => setIsScanning(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98"
              >
                <ScanLine className="w-4 h-4" />
                Scan Mess Standee QR
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

            <p className="text-[11px] text-slate-500">
              Only special food items require coupons • Max ₹1,000 / month • ₹6,000 total
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY UNIQUE PERMANENT QR CODE ── */}
      {activeTab === 'my_qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
          <div>
            <h2 className="text-lg font-black text-slate-100">Permanent Student Mess QR</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Show this QR code at the dining hall counter for both regular meals and special food items.
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
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Special Items Counter
              </span>
              <p className="text-slate-400 text-[11px]">
                Staff can scan this to serve your Chicken / Egg / Dahi and deduct 1 coupon (₹500).
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
              Special Items Wallet Passbook
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {recentTransactions.length} Transactions
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs space-y-1">
              <p>No special item coupons redeemed yet.</p>
              <p className="text-[11px]">Your allotted ₹6,000 (12 coupons) is fully available for special food treats!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id || tx.transactionId}
                  className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0 text-lg">
                      {tx.specialItemName?.includes('Chicken')
                        ? '🍗'
                        : tx.specialItemName?.includes('Egg')
                        ? '🥚'
                        : tx.specialItemName?.includes('Paneer')
                        ? '🧀'
                        : tx.specialItemName?.includes('Dahi') || tx.specialItemName?.includes('Yogurt')
                        ? '🥣'
                        : '⭐'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">
                        {tx.specialItemName || 'Special Mess Item'}
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
                Scan Mess Standee for: {selectedSpecialItem?.name}
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
                Confirm Special Food Item
              </span>
              <button
                onClick={() => setScannedPayload(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-3xl mx-auto mb-1">{selectedSpecialItem?.icon || '🍗'}</div>
              <h3 className="text-xl font-black text-white">
                {selectedSpecialItem?.name}
              </h3>
              <p className="text-xs text-slate-400">
                Mess Counter: {walletData?.student?.mess || 'Hostel Dining Hall'}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Special Item Price</span>
                <span className="text-lg font-black text-white">₹500.00 (1 Coupon)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                <span>Debited From</span>
                <span className="font-semibold text-slate-200">Special Items Semester Wallet</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Balance After Payment</span>
                <span className="font-semibold text-emerald-400">
                  ₹{Math.max(0, (wallet.balanceAmount || 6000) - 500)} ({wallet.couponsRemaining - 1} left)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Monthly Quota After</span>
                <span className="font-semibold text-amber-300">
                  {wallet.currentMonthCouponsUsed + 1} / {wallet.monthlyMaxCoupons || 2} Used this month (Max ₹1,000)
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              disabled={isPaying}
              onClick={() => executePayment(scannedPayload)}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-98 disabled:opacity-50"
            >
              {isPaying ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  Authorizing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹500 for {selectedSpecialItem?.name}
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
              <h2 className="text-2xl font-black text-white tracking-tight">₹500.00 Paid</h2>
              <p className="text-xs font-semibold text-emerald-400">Special Item Token Generated</p>
              <p className="text-base font-bold text-slate-100">
                {paymentSuccessData.specialItemName || selectedSpecialItem?.name}
              </p>
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
                <span className="text-slate-400">Special Item</span>
                <span className="font-semibold text-emerald-400">
                  {paymentSuccessData.specialItemName || selectedSpecialItem?.name}
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
                <span className="text-slate-400">Remaining Wallet Balance</span>
                <span className="font-bold text-emerald-400">
                  ₹{paymentSuccessData.walletBalance} ({paymentSuccessData.couponsRemaining} coupons left)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Show this screen to the counter staff to collect your special dish.
            </p>

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
