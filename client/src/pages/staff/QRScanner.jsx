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
  Utensils
} from 'lucide-react';

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
          setScanResult(res.data);
          setScannedCount((prev) => prev + 1);
        }
      } catch (err) {
        setScanError(err.message || 'Verification failed');
      } finally {
        setIsProcessing(false);
      }
    };

    const onScanFailure = (error) => {
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

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">QR Coupon Scanner</h1>
          <p className="text-xs text-slate-500 mt-1">Point camera at the student's digital coupon QR code.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Headcount</span>
          <span className="text-2xl font-black text-emerald-600">{scannedCount}</span>
        </div>
      </div>

      {/* Verification Result Notification Card */}
      {scanResult && (
        <div className="p-5 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-950/20 text-slate-950 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950/15 px-2 py-0.5 rounded">
                Verified & Redeemed
              </span>
              <h2 className="text-lg font-black mt-0.5">
                {scanResult.student?.firstName} {scanResult.student?.lastName}
              </h2>
              <p className="text-xs font-semibold opacity-85">
                Roll: {scanResult.student?.rollNumber} • {scanResult.mealSession?.mealType?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="p-2 bg-slate-950/20 hover:bg-slate-950/30 rounded-xl text-xs font-bold"
            title="Scan next"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {scanError && (
        <div className="p-5 bg-rose-500 text-white rounded-2xl shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 text-white rounded-xl flex items-center justify-center">
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
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold"
            title="Clear"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* HTML5 QR Camera View Container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div id="qr-reader" className="w-full rounded-2xl overflow-hidden"></div>
      </div>
    </div>
  );
};

export default QRScanner;

