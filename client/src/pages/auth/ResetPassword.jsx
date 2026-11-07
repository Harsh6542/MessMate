import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.post(`/auth/reset-password/${token}`, {
        password: data.password
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        if (res.token) {
          localStorage.setItem('messmate_token', res.token);
        }
        await refreshUser();
        setTimeout(() => {
          const role = res.data?.user?.role || 'student';
          navigate(`/${role}/dashboard`, { replace: true });
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Password reset link is invalid or expired. Please request a new link.');
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-slate-400 text-center max-w-xs mx-auto">
          Please enter and confirm your new secure account password
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="p-6 bg-slate-900/60 border border-emerald-500/30 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Password Updated!</h3>
          <p className="text-xs text-slate-400">
            Your password was successfully updated. Redirecting you to your dashboard...
          </p>
          <div className="pt-2">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' }
                })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (val) => val === passwordValue || 'Passwords do not match'
                })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
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
                <ShieldCheck className="w-4 h-4" />
                Update Password
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

export default ResetPassword;

