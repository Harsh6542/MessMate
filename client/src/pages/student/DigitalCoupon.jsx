import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Utensils,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const DigitalCoupon = () => {
  const { user } = useAuth();
  const [couponData, setCouponData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  const loadCoupon = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.post('/coupons/generate');
      if (res.success && res.data?.coupon) {
        setCouponData(res.data.coupon);
        setSessionData(res.data.session);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to retrieve meal coupon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupon();
  }, []);

  // Expiration countdown ticker
  useEffect(() => {
    if (!couponData?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(couponData.expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeLeft('Coupon Expired');
        clearInterval(timer);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [couponData]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Digital Meal Coupon</h1>
        <p className="text-xs text-slate-500 mt-1">
          Show this QR code at the dining hall counter for attendance verification.
        </p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Generating cryptographic QR token...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Coupon Unavailable</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">{errorMsg}</p>
          <button
            onClick={loadCoupon}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Coupon Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                {sessionData?.mealType} Session
              </span>
              <h2 className="text-lg font-bold">
                {new Date(sessionData?.date || Date.now()).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {couponData?.status === 'redeemed' ? 'REDEEMED' : 'READY TO SCAN'}
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50">
            {couponData?.status === 'redeemed' ? (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Meal Already Served</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  This coupon was successfully scanned and attendance verified at{' '}
                  {new Date(couponData.redeemedAt).toLocaleTimeString()}.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80">
                  <QRCodeSVG
                    value={couponData?.qrPayload || ''}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Expires in: <span className="text-emerald-600 font-mono font-bold">{timeLeft || 'Calculating...'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Single-use cryptographic token. Do not share screenshot.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Student Identification Footer */}
          <div className="p-5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400">Roll: {user?.rollNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium block">
                {user?.hostel?.name || 'Kosi Hostel'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3" /> Eligible
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalCoupon;
