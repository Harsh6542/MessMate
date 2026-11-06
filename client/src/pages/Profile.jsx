import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { User, Lock, Mail, Phone, Hash, Building, ShieldCheck, Check } from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    }
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passErrors }
  } = useForm();

  const onUpdateProfile = async (data) => {
    try {
      setProfileLoading(true);
      await updateProfile(data);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data) => {
    try {
      setPasswordLoading(true);
      const res = await api.put('/auth/change-password', data);
      if (res.success) {
        toast.success('Password updated successfully');
        resetPasswordForm();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Profile & Security</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your identity, hostel credentials, and account password.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-2xl mb-4">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {user?.firstName} {user?.lastName}
          </h2>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 mt-2 uppercase tracking-wider">
            {user?.role?.replace('_', ' ')}
          </span>

          <div className="w-full mt-6 space-y-3 pt-6 border-t border-slate-100 text-left text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            {user?.rollNumber && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>Roll No: {user.rollNumber}</span>
              </div>
            )}
            {user?.hostel && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Hostel: {user.hostel?.name || 'Assigned'}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Status: Active Verified</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Personal Information
            </h3>
            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    {...regProfile('firstName')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    {...regProfile('lastName')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    {...regProfile('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl shadow transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  {...regPassword('currentPassword', { required: 'Current password is required' })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {passErrors.currentPassword && (
                  <p className="mt-1 text-[11px] text-rose-500">{passErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  {...regPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters required' }
                  })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {passErrors.newPassword && (
                  <p className="mt-1 text-[11px] text-rose-500">{passErrors.newPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

