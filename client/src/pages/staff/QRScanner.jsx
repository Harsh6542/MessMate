import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../services/api';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  User,
  Utensils,
  Wallet,
  Sparkles
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
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
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

        const res = await api.post('/coupons/verify', { qrPayload: decodedText });
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

    const onScanFailure = () => {
      // Ignore routine frame read failures
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const resetState = () => {
    setScanResult(null);
    setScanError('');
  };

  const wallet = scanResult?.wallet;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">QR Coupon Scanner</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan student's unique Mess QR code or meal session token to verify attendance.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Headcount</span>
          <span className="text-2xl font-black text-emerald-400">{scannedCount}</span>
        </div>
      </div>

      {/* Verification Result Notification Card */}
      {scanResult && (
        <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-3xl shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-950/20 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/20 px-2 py-0.5 rounded-md">
                  Verified & Coupon Redeemed
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

          {/* Student Wallet Status Indicator */}
          {wallet && (
            <div className="pt-2 border-t border-slate-950/15 flex items-center justify-between text-xs font-bold text-slate-950">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Remaining Balance: ₹{wallet.balanceAmount} ({Math.max(0, wallet.totalCouponsAllocated - wallet.couponsUsed)} coupons left)
              </span>
              <span className="bg-slate-950/20 px-2 py-0.5 rounded-lg text-[11px]">
                Month: {wallet.currentMonthCouponsUsed} / {wallet.monthlyMaxCoupons || 2}
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

      {/* HTML5 QR Camera View Container */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div id="qr-reader" className="w-full rounded-2xl overflow-hidden text-slate-100"></div>
      </div>
    </div>
  );
};

export default QRScanner;
