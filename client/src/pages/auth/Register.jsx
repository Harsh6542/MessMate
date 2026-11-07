import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { UserPlus, Lock, Mail, User, Building, Hash, Phone, AlertCircle, Home } from 'lucide-react';

export const Register = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      rollNumber: '',
      phone: '',
      gender: 'male',
      roomNumber: '',
      hostel: '',
      password: ''
    }
  });

  const selectedGender = watch('gender');
  const selectedHostel = watch('hostel');

  // Fetch active hostels list for dropdown
  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const res = await api.get('/hostels');
        if (res.success && res.data?.hostels) {
          setHostels(res.data.hostels);
        }
      } catch (err) {
        console.warn('Could not load hostels list:', err.message);
      }
    };
    fetchHostels();
  }, []);

  // Filter hostels based on selected gender
  // Boys: Kautilya Hostel, Nagarjuna Hostel, Aryabhatta Hostel
  // Girls: Kadambini Hostel
  const filteredHostels = hostels.filter((h) => {
    if (!h.type) {
      // Fallback matching by name if type is not populated yet
      const lowerName = (h.name || '').toLowerCase();
      if (selectedGender === 'female') {
        return lowerName.includes('kadambini');
      } else {
        return lowerName.includes('kautilya') || lowerName.includes('nagarjuna') || lowerName.includes('aryabhatta') || lowerName.includes('kosi') || lowerName.includes('ganga');
      }
    }
    return selectedGender === 'male' ? h.type === 'boys' : h.type === 'girls';
  });

  // When gender switches, auto-select if single choice (e.g. Kadambini) or reset invalid hostel
  useEffect(() => {
    if (filteredHostels.length > 0) {
      const isCurrentValid = filteredHostels.some((h) => h._id === selectedHostel);
      if (!isCurrentValid) {
        if (selectedGender === 'female' && filteredHostels.length === 1) {
          setValue('hostel', filteredHostels[0]._id);
        } else {
          setValue('hostel', '');
        }
      }
    }
  }, [selectedGender, filteredHostels, selectedHostel, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const newUser = await registerAuth(data);
      toast.success(`Welcome to MessMate, ${newUser.firstName}!`);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          Student Registration
        </h2>
        <p className="mt-1 text-xs text-slate-400 text-center">
          Create your digital hostel mess account to access meal coupons
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              First Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                placeholder="Ayush"
                className="w-full pl-8 pr-2.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Last Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              placeholder="Kumar"
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {errors.lastName && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            College / Personal Email <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Valid email required' }
              })}
              placeholder="ayush.ug22.cs@nitp.ac.in"
              className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11px] text-rose-400">{errors.email.message}</p>
          )}
        </div>

        {/* Roll Number & Phone Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Roll Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Hash className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                {...register('rollNumber', { required: 'Roll Number is required' })}
                placeholder="2201045"
                className="w-full pl-8 pr-2.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            {errors.rollNumber && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.rollNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                {...register('phone')}
                placeholder="9876543210"
                className="w-full pl-8 pr-2.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Gender <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setValue('gender', 'male', { shouldValidate: true })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                selectedGender === 'male'
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedGender === 'male' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>Male (Boys Hostel)</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('gender', 'female', { shouldValidate: true })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                selectedGender === 'female'
                  ? 'bg-pink-500/15 border-pink-500/60 text-pink-300 shadow-sm shadow-pink-500/10'
                  : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedGender === 'female' ? 'bg-pink-400' : 'bg-slate-500'}`} />
              <span>Female (Girls Hostel)</span>
            </button>
          </div>
          <input type="hidden" {...register('gender', { required: 'Gender is required' })} />
        </div>

        {/* Hostel Assignment & Room Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Hostel Assignment <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Building className="w-3.5 h-3.5" />
              </div>
              <select
                {...register('hostel', { required: 'Please select your hostel' })}
                className="w-full pl-8 pr-2.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Select Hostel</option>
                {filteredHostels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} {h.code ? `(${h.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.hostel && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.hostel.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Room Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Home className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                {...register('roomNumber', { required: 'Room number is required' })}
                placeholder={selectedGender === 'female' ? 'KD-104' : 'K-204'}
                className="w-full pl-8 pr-2.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            {errors.roomNumber && (
              <p className="mt-1 text-[11px] text-rose-400">{errors.roomNumber.message}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Set Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
              placeholder="••••••••"
              className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-[11px] text-rose-400">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Create Account
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
