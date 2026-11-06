import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Search, CheckCircle2, User, Hash, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ManualVerify = () => {
  const [loading, setLoading] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      rollNumber: '',
      reason: 'Phone battery dead'
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setVerifiedResult(null);

      const res = await api.post('/coupons/manual-verify', data);
      if (res.success && res.data) {
        setVerifiedResult(res.data);
        toast.success('Attendance recorded manually!');
        reset({ rollNumber: '', reason: 'Phone battery dead' });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
      toast.error(err.message || 'Verification rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manual Student Lookup</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized manual fallback for students without a functional smartphone.
        </p>
      </div>

      {verifiedResult && (
        <div className="p-5 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 bg-slate-950/20 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950/15 px-2 py-0.5 rounded">
              Manual Check-In Success
            </span>
            <h2 className="text-lg font-black">
              {verifiedResult.student?.firstName} {verifiedResult.student?.lastName}
            </h2>
            <p className="text-xs font-semibold opacity-90">
              Roll No: {verifiedResult.student?.rollNumber} • {verifiedResult.session?.mealType?.toUpperCase()} Recorded
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Student College Roll Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                {...register('rollNumber', { required: 'Roll Number is required' })}
                placeholder="e.g. 2201045"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            {errors.rollNumber && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.rollNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Manual Fallback
            </label>
            <select
              {...register('reason')}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="Phone battery dead">Phone battery dead</option>
              <option value="Phone screen cracked / QR unreadable">Phone screen cracked / QR unreadable</option>
              <option value="Forgot phone in hostel room">Forgot phone in hostel room</option>
              <option value="Network connectivity error on campus">Network connectivity error on campus</option>
              <option value="No smartphone / Feature phone user">No smartphone / Feature phone user</option>
              <option value="Other authorized override">Other authorized override</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verify Eligibility & Mark Attendance
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualVerify;
