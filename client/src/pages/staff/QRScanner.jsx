import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import { stopAllWebcamTracks } from '../../utils/cameraUtils';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  Utensils,
  Wallet,
  Sparkles,
  Camera,
  CameraOff,
  ArrowLeft
} from 'lucide-react';

const playSuccessBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
};

export const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(true);

  // Scanner Mode: 'regular' (Free entry) or 'coupon' (Flexible ₹1 - ₹1,000 deduction)
  const [scanMode, setScanMode] = useState('regular'); // 'regular' | 'coupon'
  const [redeemAmount, setRedeemAmount] = useState(50);

  const scannerRef = useRef(null);

  // Toggle camera active state with immediate hardware release
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      await stopAllWebcamTracks(scannerRef.current);
      scannerRef.current = null;
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (!isCameraActive) {
      stopAllWebcamTracks(scannerRef.current);
      scannerRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      if (isCancelled) return;

      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );

        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText) => {
          if (isProcessing) return;

          try {
            setIsProcessing(true);
            setScanError('');
            setScanResult(null);

            const isCouponMode = scanMode === 'coupon';
            const payAmount = isCouponMode ? Math.max(1, Math.min(1000, Number(redeemAmount) || 50)) : 0;
            const res = await api.post('/coupons/verify', {
              qrPayload: decodedText,
              isCoupon: isCouponMode,
              amount: payAmount
            });

            if (res.success && res.data) {
              playSuccessBeep();
              setScanResult(res.data);
              setScannedCount((prev) => prev + 1);
            }
          } catch (err) {
            setScanError(err.message || 'Verification failed');
          } finally {
            setIsProcessing(false);
          }
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
  }, [isCameraActive, scanMode, redeemAmount]);

  // Teardown camera on beforeunload
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

  const resetState = () => {
    setScanResult(null);
    setScanError('');
  };

  const wallet = scanResult?.wallet;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top Bar with Navigation and Camera Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/staff/dashboard"
              onClick={() => stopAllWebcamTracks(scannerRef.current)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Staff Dashboard
            </Link>
            <span className="text-slate-600">•</span>
            {isCameraActive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Camera Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Camera Stopped
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Mess QR Counter Scanner</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Scan student QR code for regular meal entry (Free) or mess coupon redemption (₹500).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Explicit Camera Hardware Toggle Button */}
          <button
            onClick={handleToggleCamera}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-emerald-500 text-slate-950 border-emerald-500 hover:bg-emerald-400 font-black'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Start Camera
              </>
            )}
          </button>

          <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Verified</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{scannedCount}</span>
          </div>
        </div>
      </div>

      {/* ── COUNTER MODE SWITCHER ── */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Verification Mode:</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {scanMode === 'regular' ? 'Standard Free Meals (Included in Hostel Fee)' : 'Redeem Wallet Payment'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setScanMode('regular')}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              scanMode === 'regular'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Regular Meal (Free / ₹0)
          </button>

          <button
            onClick={() => setScanMode('coupon')}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              scanMode === 'coupon'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Wallet Payment (₹{redeemAmount})
          </button>
        </div>

        {/* Amount Input for Wallet Payment Mode */}
        {scanMode === 'coupon' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Enter Amount to Deduct (₹1 - ₹1,000):</span>
              <span className="font-bold text-amber-600 dark:text-amber-300">₹{redeemAmount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-400 shadow-sm"
                  placeholder="Amount"
                />
              </div>
              <div className="flex items-center gap-1">
                {[20, 50, 100, 200, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRedeemAmount(preset)}
                    className={`px-2.5 py-2 text-xs font-bold rounded-xl border transition ${
                      redeemAmount === preset
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Result Notification Card */}
      {scanResult && (
        <div
          className={`p-5 rounded-3xl shadow-xl space-y-3 animate-fade-in ${
            scanResult.isCoupon
              ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-950/20 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/20 px-2 py-0.5 rounded-md">
                  {scanResult.isCoupon
                    ? `Mess Payment Redeemed (-₹${scanResult.amount})`
                    : 'Regular Meal Verified (Included in Fees / ₹0)'}
                </span>
                <h2 className="text-xl font-black mt-1 leading-tight">
                  {scanResult.student?.firstName} {scanResult.student?.lastName}
                </h2>
                <p className="text-xs font-bold text-slate-900/80">
                  Roll: {scanResult.student?.rollNumber} • Room: {scanResult.student?.roomNumber || 'N/A'} •{' '}
                  {scanResult.mealSession?.mealType?.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={resetState}
              className="p-2 bg-slate-950/20 hover:bg-slate-950/30 rounded-xl transition shrink-0"
              title="Scan next"
            >
              <RotateCcw className="w-5 h-5 text-slate-950" />
            </button>
          </div>

          {/* Student Wallet Status */}
          {wallet && (
            <div className="pt-2 border-t border-slate-950/15 flex items-center justify-between text-xs font-bold text-slate-950">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Remaining Semester Balance: ₹{wallet.balanceAmount}
              </span>
              <span className="bg-slate-950/20 px-2 py-0.5 rounded-lg text-[11px]">
                Month Remaining: ₹{wallet.monthlyRemaining ?? Math.max(0, 1000 - (wallet.currentMonthAmountSpent || 0))} / ₹1,000
              </span>
            </div>
          )}
        </div>
      )}

      {scanError && (
        <div className="p-5 bg-rose-500 text-white rounded-3xl shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center shrink-0">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                Redemption Rejected
              </span>
              <p className="text-sm font-bold mt-1 leading-snug">{scanError}</p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition shrink-0"
            title="Clear"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* HTML5 QR Camera View Container or Inactive State */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden min-h-[320px] flex flex-col items-center justify-center">
        {isCameraActive ? (
          <div id="qr-reader" className="w-full rounded-2xl overflow-hidden text-slate-900 dark:text-slate-100"></div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              <CameraOff className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Camera is Turned Off</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Webcam hardware has been released. Click below to re-activate the camera when ready to scan.
              </p>
            </div>
            <button
              onClick={handleToggleCamera}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Turn Camera On
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
