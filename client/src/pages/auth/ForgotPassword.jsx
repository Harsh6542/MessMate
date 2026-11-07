import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Copy } from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetData, setResetData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const normalizedEmail = (data.email || '').trim().toLowerCase();
      const res = await api.post('/auth/forgot-password', { email: normalizedEmail });

      if (res.success) {
        setResetData({
          resetToken: res.resetToken,
          resetUrl: res.resetUrl,
          email: normalizedEmail
        });
        toast.success('Password reset link generated successfully!');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to generate reset link. Please verify your email.');
      toast.error(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (resetData?.resetUrl) {
      navigator.clipboard.writeText(resetData.resetUrl);
      toast.success('Reset link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-400 text-center max-w-xs mx-auto">
          Enter your registered college or hostel email address to receive password reset instructions
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {resetData ? (
        <div className="space-y-4 bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Reset Link Ready</h3>
            <p className="mt-1 text-xs text-slate-400">
              A secure password reset link has been generated for{' '}
              <span className="text-emerald-300 font-medium">{resetData.email}</span>. Valid for 30 minutes.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={() => navigate(`/reset-password/${resetData.resetToken}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Proceed to Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Direct Reset Link</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email format'
                  }
                })}
                placeholder="e.g. ayush.ug22.cs@nitp.ac.in"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Generate Reset Link
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-slate-700/50">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;

