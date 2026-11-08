import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Hash,
  AlertCircle,
  GraduationCap,
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  ScanLine,
  KeyRound
} from 'lucide-react';

// Canonical destination route helper
const getDashboardPath = (role) => {
  switch (role) {
    case 'mess_staff':
      return '/staff/dashboard';
    case 'mess_manager':
      return '/manager/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/student/dashboard';
  }
};

export const Login = () => {
  const { login, staffLogin, register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Active view: null | 'student_login' | 'student_register' | 'staff_login' | 'manager_login' | 'admin_login'
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hostels, setHostels] = useState([]);

  // Student Register Form
  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    watch: watchRegister,
    setValue: setRegisterValue,
    formState: { errors: registerErrors },
    reset: resetRegisterForm
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

  // Student / Admin Login Form (Email & Password)
  const {
    register: loginForm,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
    reset: resetLoginForm
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Staff Login Form (Staff ID & PIN)
  const {
    register: staffForm,
    handleSubmit: handleStaffSubmit,
    setValue: setStaffValue,
    formState: { errors: staffErrors },
    reset: resetStaffForm
  } = useForm({
    defaultValues: {
      staffId: '',
      pin: ''
    }
  });

  // Manager Login Form (Manager ID & PIN)
  const {
    register: managerForm,
    handleSubmit: handleManagerSubmit,
    setValue: setManagerValue,
    formState: { errors: managerErrors },
    reset: resetManagerForm
  } = useForm({
    defaultValues: {
      staffId: '',
      pin: ''
    }
  });

  const selectedGender = watchRegister('gender');
  const selectedHostel = watchRegister('hostel');

  // Check URL query parameters (e.g. ?mode=register or from /register route)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register' || location.pathname === '/register') {
      setActiveModal('student_register');
    }
  }, [searchParams, location.pathname]);

  // Fetch hostels for student registration dropdown
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
  const filteredHostels = hostels.filter((h) => {
    if (!h.type) {
      const lowerName = (h.name || '').toLowerCase();
      if (selectedGender === 'female') {
        return lowerName.includes('kadambini');
      } else {
        return (
          lowerName.includes('kautilya') ||
          lowerName.includes('nagarjuna') ||
          lowerName.includes('aryabhatta') ||
          lowerName.includes('kosi') ||
          lowerName.includes('ganga')
        );
      }
    }
    return selectedGender === 'male' ? h.type === 'boys' : h.type === 'girls';
  });

  // Auto-select if single choice (Kadambini for girls) or reset invalid choice
  useEffect(() => {
    if (filteredHostels.length > 0) {
      const isCurrentValid = filteredHostels.some((h) => h._id === selectedHostel);
      if (!isCurrentValid) {
        if (selectedGender === 'female' && filteredHostels.length === 1) {
          setRegisterValue('hostel', filteredHostels[0]._id);
        } else {
          setRegisterValue('hostel', '');
        }
      }
    }
  }, [selectedGender, filteredHostels, selectedHostel, setRegisterValue]);

  // Quick 1-click Demo Fill & Login
  const handleQuickDemo = async (role) => {
    setErrorMessage('');
    try {
      setLoading(true);
      let user;

      if (role === 'mess_staff') {
        // Log in via Staff ID & PIN
        user = await staffLogin('STF-101', '1234', 'mess_staff');
      } else if (role === 'mess_manager') {
        // Log in via Manager ID & PIN
        user = await staffLogin('MGR-101', '1234', 'mess_manager');
      } else if (role === 'student_female') {
        user = await login('priya.kumari@messmate.edu', 'Password@123');
      } else if (role === 'admin') {
        user = await login('admin@messmate.edu', 'Password@123');
      } else {
        user = await login('student@messmate.edu', 'Password@123');
      }

      const roleLabel = user.role.replace('_', ' ').toUpperCase();
      toast.success(`Welcome, ${user.firstName}! Signed in as ${roleLabel}`);
      const dest = getDashboardPath(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Demo sign in failed. Ensure backend server is connected.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Student & Admin Email Login Submission
  const onLoginSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const loggedInUser = await login(data.email, data.password);
      toast.success(`Welcome back, ${loggedInUser.firstName}!`);
      const from = location.state?.from?.pathname || getDashboardPath(loggedInUser.role);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Staff ID & PIN Submission
  const onStaffSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const loggedInUser = await staffLogin(data.staffId, data.pin, 'mess_staff');
      toast.success(`Welcome back, ${loggedInUser.firstName}!`);
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Staff verification failed. Check your Staff ID & PIN.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Manager ID & PIN Submission
  const onManagerSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const loggedInUser = await staffLogin(data.staffId, data.pin, 'mess_manager');
      toast.success(`Welcome back, ${loggedInUser.firstName}!`);
      navigate('/manager/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Manager verification failed. Check your Manager ID & PIN.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Student Registration Submission
  const onRegisterSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const newUser = await registerAuth(data);
      toast.success(`Welcome to MessMate, ${newUser.firstName}!`);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMessage('');
    resetLoginForm();
    resetRegisterForm();
    resetStaffForm();
    resetManagerForm();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Notice */}
      <div className="text-center max-w-3xl mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>NIT Patna Unified Hostel Dining Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Select Your Campus Access Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Dedicated access portals for Students, Serving Staff, Mess Managers, and System Administrators.
        </p>
      </div>

      {/* Main 3 Separate Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* ============================================================ */}
        {/* CARD 1: STUDENT ACCESS                                       */}
        {/* ============================================================ */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

          <div>
            {/* Header pill row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-extrabold tracking-widest text-indigo-400 uppercase">
                Student Access
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SECURE
              </span>
            </div>

            {/* Illustration Graphic Banner */}
            <div className="relative rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950/80 p-3 border border-indigo-500/20 flex items-center justify-center h-36 overflow-hidden mb-5 group-hover:border-indigo-500/40 transition-colors">
              <svg viewBox="0 0 280 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="80" width="40" height="70" rx="4" fill="#312E81" fillOpacity="0.4" />
                <rect x="70" y="60" width="60" height="90" rx="4" fill="#3730A3" fillOpacity="0.5" />
                <rect x="140" y="70" width="50" height="80" rx="4" fill="#312E81" fillOpacity="0.4" />
                <rect x="200" y="90" width="50" height="60" rx="4" fill="#3730A3" fillOpacity="0.4" />
                <circle cx="240" cy="110" r="22" fill="#047857" fillOpacity="0.4" />
                <rect x="238" y="125" width="4" height="25" fill="#065F46" />

                {/* Male Student */}
                <circle cx="105" cy="55" r="16" fill="#FBBF24" />
                <path d="M92 50 C95 40, 115 40, 118 50 C120 45, 122 55, 118 60 Z" fill="#1E1B4B" />
                <path d="M85 85 C85 75, 125 75, 125 85 L125 145 L85 145 Z" fill="#6366F1" />
                <rect x="80" y="95" width="22" height="28" rx="2" fill="#F8FAFC" transform="rotate(-12 80 95)" />
                <rect x="83" y="98" width="16" height="22" rx="1" fill="#4F46E5" transform="rotate(-12 80 95)" />

                {/* Female Student */}
                <circle cx="165" cy="58" r="15" fill="#FCD34D" />
                <path d="M150 55 C152 42, 178 42, 180 55 C185 75, 178 95, 178 95 L152 95 C152 95, 145 75, 150 55 Z" fill="#312E81" />
                <path d="M145 88 C145 78, 185 78, 185 88 L185 145 L145 145 Z" fill="#8B5CF6" />
                <rect x="160" y="100" width="26" height="34" rx="3" fill="#0F172A" transform="rotate(8 160 100)" />
                <rect x="163" y="103" width="20" height="28" rx="2" fill="#C084FC" transform="rotate(8 160 100)" />
              </svg>

              <div className="absolute -bottom-3 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-1.5 shadow-xl shadow-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            {/* Title & Info */}
            <div className="text-center pt-1 mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Student Portal</h2>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                Single-use digital meal QR coupons, meal declarations, and feedback.
              </p>
            </div>

            {/* Checklist Highlights */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Digital QR meal coupon wallet</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Advance meal opt-out & saves</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Weekly menu view & food rating</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveModal('student_login')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
            >
              <span>Login as Student</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal('student_register')}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-colors text-center cursor-pointer"
              >
                Sign Up
              </button>

              <button
                onClick={() => handleQuickDemo('student')}
                disabled={loading}
                title="1-Click Quick Demo Login (Ayush - Kautilya Hostel)"
                className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>⚡ Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 2: MESS STAFF ACCESS (ID & PIN)                         */}
        {/* ============================================================ */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

          <div>
            {/* Header pill row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-extrabold tracking-widest text-emerald-400 uppercase">
                Staff Counter
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <ScanLine className="w-3 h-3 text-cyan-400" />
                SCANNER
              </span>
            </div>

            {/* Illustration Graphic Banner */}
            <div className="relative rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-950/80 p-3 border border-emerald-500/20 flex items-center justify-center gap-3 h-36 overflow-hidden mb-5 group-hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 flex items-center justify-center text-emerald-400 transform -rotate-3 hover:rotate-0 transition-transform">
                <ScanLine className="w-6 h-6" />
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-900/90 to-teal-800/90 border border-emerald-400/40 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white transform hover:scale-105 transition-transform">
                <Hash className="w-7 h-7" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-lg shadow-teal-500/10 flex items-center justify-center text-teal-400 transform rotate-3 hover:rotate-0 transition-transform">
                <KeyRound className="w-6 h-6" />
              </div>

              <div className="absolute -bottom-3 bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-1.5 shadow-xl shadow-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Title & Info */}
            <div className="text-center pt-1 mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Mess Staff</h2>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                Serving counter QR barcode scanner, attendance, and kitchen prep.
              </p>
              <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                Staff ID & Security PIN Login
              </div>
            </div>

            {/* Checklist Highlights */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Live camera QR barcode scanner</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Manual student roll verification</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Kitchen prep sheet & waste scale</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveModal('staff_login')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login with Staff ID & PIN</span>
            </button>

            <button
              onClick={() => handleQuickDemo('mess_staff')}
              disabled={loading}
              title="1-Click Demo Login as Mess Staff (Raju - Kautilya)"
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>⚡ Staff Demo (ID: STF-101 | PIN: 1234)</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CARD 3: MESS MANAGER ACCESS (ID & PIN)                       */}
        {/* ============================================================ */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 flex flex-col justify-between hover:border-violet-500/50 hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />

          <div>
            {/* Header pill row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-extrabold tracking-widest text-violet-400 uppercase">
                Manager Hub
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Sliders className="w-3 h-3 text-purple-400" />
                OPERATIONS
              </span>
            </div>

            {/* Illustration Graphic Banner */}
            <div className="relative rounded-2xl bg-gradient-to-b from-violet-950/60 to-slate-950/80 p-3 border border-violet-500/20 flex items-center justify-center gap-3 h-36 overflow-hidden mb-5 group-hover:border-violet-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-violet-500/30 shadow-lg shadow-violet-500/10 flex items-center justify-center text-violet-400 transform -rotate-3 hover:rotate-0 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-900/90 to-violet-800/90 border border-violet-400/40 shadow-xl shadow-violet-500/20 flex items-center justify-center text-white transform hover:scale-105 transition-transform">
                <Sliders className="w-7 h-7" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 flex items-center justify-center text-indigo-400 transform rotate-3 hover:rotate-0 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>

              <div className="absolute -bottom-3 bg-slate-900 border-2 border-violet-500/50 rounded-2xl p-1.5 shadow-xl shadow-violet-500/20 text-violet-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Title & Info */}
            <div className="text-center pt-1 mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Mess Manager</h2>
              <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                Demand forecasting, menu curation, inventory & complaint audits.
              </p>
              <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-300">
                Manager ID & Security PIN Login
              </div>
            </div>

            {/* Checklist Highlights */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>AI demand forecast & portion planning</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Raw inventory ledger & re-order levels</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Student grievances & announcements</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setActiveModal('manager_login')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login with Manager ID & PIN</span>
            </button>

            <button
              onClick={() => handleQuickDemo('mess_manager')}
              disabled={loading}
              title="1-Click Demo Login as Mess Manager (Suresh - Kautilya)"
              className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-violet-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>⚡ Manager Demo (ID: MGR-101 | PIN: 1234)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row Admin Link */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setActiveModal('admin_login')}
          className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white shadow-md transition-all cursor-pointer hover:border-slate-600"
        >
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Institutional Admin Console &rarr;</span>
        </button>

        <button
          onClick={() => handleQuickDemo('admin')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>⚡ 1-Click Admin Demo</span>
        </button>
      </div>

      {/* Quick Demo Credentials Table Drawer */}
      <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Quick Demo Accounts (1-Click Evaluation)
          </span>
          <span className="text-[11px] text-slate-500">Universal Access Provided</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleQuickDemo('student')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition hover:border-indigo-500/50 cursor-pointer"
          >
            <div className="text-[11px] font-bold text-indigo-400">Student (Male)</div>
            <div className="text-[10px] text-slate-300 font-mono">student@messmate.edu</div>
            <div className="text-[9px] text-slate-500">Pass: Password@123</div>
          </button>

          <button
            onClick={() => handleQuickDemo('student_female')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition hover:border-pink-500/50 cursor-pointer"
          >
            <div className="text-[11px] font-bold text-pink-400">Student (Female)</div>
            <div className="text-[10px] text-slate-300 font-mono">priya.kumari@messmate.edu</div>
            <div className="text-[9px] text-slate-500">Pass: Password@123</div>
          </button>

          <button
            onClick={() => handleQuickDemo('mess_staff')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition hover:border-emerald-500/50 cursor-pointer"
          >
            <div className="text-[11px] font-bold text-emerald-400">Mess Staff</div>
            <div className="text-[10px] text-emerald-300 font-mono font-bold">ID: STF-101</div>
            <div className="text-[9px] text-slate-400">Security PIN: 1234</div>
          </button>

          <button
            onClick={() => handleQuickDemo('mess_manager')}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition hover:border-violet-500/50 cursor-pointer"
          >
            <div className="text-[11px] font-bold text-violet-400">Mess Manager</div>
            <div className="text-[10px] text-violet-300 font-mono font-bold">ID: MGR-101</div>
            <div className="text-[9px] text-slate-400">Security PIN: 1234</div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* INTERACTIVE MODAL DIALOGS                                     */}
      {/* ============================================================ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* MODAL 1: STUDENT LOGIN */}
            {activeModal === 'student_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Student Sign In</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your registered email and password to access meal coupons
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        {...loginForm('email', { required: 'Email address is required' })}
                        placeholder="ayush.ug22.cs@nitp.ac.in"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="mt-1 text-[11px] text-rose-400">{loginErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">Password</label>
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm('password', { required: 'Password is required' })}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="mt-1 text-[11px] text-rose-400">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    New student?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('student_register')}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                    >
                      Register here &rarr;
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginValue('email', 'student@messmate.edu');
                      setLoginValue('password', 'Password@123');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Fill Demo Credentials (Ayush - Kautilya)
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 2: STUDENT REGISTRATION */}
            {activeModal === 'student_register' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-2">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Student Registration</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create your account to access digital meal coupons
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-3">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        {...registerForm('firstName', { required: 'Required' })}
                        placeholder="Ayush"
                        className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      {registerErrors.firstName && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{registerErrors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        {...registerForm('lastName', { required: 'Required' })}
                        placeholder="Singh"
                        className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...registerForm('email', {
                        required: 'Email required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Valid email required' }
                      })}
                      placeholder="ayush.ug22.cs@nitp.ac.in"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    {registerErrors.email && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{registerErrors.email.message}</p>
                    )}
                  </div>

                  {/* Roll & Phone */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        {...registerForm('rollNumber', { required: 'Roll required' })}
                        placeholder="2201045"
                        className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...registerForm('phone')}
                        placeholder="9876543210"
                        className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Gender Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gender *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterValue('gender', 'male', { shouldValidate: true })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedGender === 'male'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedGender === 'male' ? 'bg-indigo-400' : 'bg-slate-500'}`} />
                        <span>Male (Boys)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegisterValue('gender', 'female', { shouldValidate: true })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedGender === 'female'
                            ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedGender === 'female' ? 'bg-pink-400' : 'bg-slate-500'}`} />
                        <span>Female (Girls)</span>
                      </button>
                    </div>
                    <input type="hidden" {...registerForm('gender', { required: true })} />
                  </div>

                  {/* Hostel & Room */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Hostel Assignment *
                      </label>
                      <select
                        {...registerForm('hostel', { required: 'Please select hostel' })}
                        className="w-full px-2.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="">Select Hostel</option>
                        {filteredHostels.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} {h.code ? `(${h.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {registerErrors.hostel && (
                        <p className="text-[10px] text-rose-400 mt-0.5">{registerErrors.hostel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Room Number *
                      </label>
                      <input
                        type="text"
                        {...registerForm('roomNumber', { required: 'Room required' })}
                        placeholder={selectedGender === 'female' ? 'KD-104' : 'K-204'}
                        className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Set Password *
                    </label>
                    <input
                      type="password"
                      {...registerForm('password', {
                        required: 'Password required',
                        minLength: { value: 6, message: 'Minimum 6 chars' }
                      })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    {registerErrors.password && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{registerErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('student_login')}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                    >
                      Sign In &rarr;
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* MODAL 3: MESS STAFF LOGIN (ID & PIN) */}
            {activeModal === 'staff_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Mess Staff Sign In</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your assigned <span className="text-emerald-400 font-semibold">Staff ID</span> and{' '}
                    <span className="text-emerald-400 font-semibold">Security PIN</span> to access scanner tools.
                  </p>
                </div>

                <form onSubmit={handleStaffSubmit(onStaffSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Staff ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Hash className="w-4 h-4 text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        {...staffForm('staffId', { required: 'Staff ID is required' })}
                        placeholder="STF-101"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    {staffErrors.staffId && (
                      <p className="mt-1 text-[11px] text-rose-400">{staffErrors.staffId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Security PIN / Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...staffForm('pin', { required: 'Security PIN is required' })}
                        placeholder="••••"
                        maxLength={20}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {staffErrors.pin && (
                      <p className="mt-1 text-[11px] text-rose-400">{staffErrors.pin.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Validate & Open Staff Dashboard</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Demo access:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffValue('staffId', 'STF-101');
                      setStaffValue('pin', '1234');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                  >
                    Autofill (STF-101 / 1234)
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 4: MESS MANAGER LOGIN (ID & PIN) */}
            {activeModal === 'manager_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-2">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Mess Manager Sign In</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your assigned <span className="text-violet-400 font-semibold">Manager ID</span> and{' '}
                    <span className="text-violet-400 font-semibold">Security PIN</span> to access operations.
                  </p>
                </div>

                <form onSubmit={handleManagerSubmit(onManagerSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Manager ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Briefcase className="w-4 h-4 text-violet-400" />
                      </div>
                      <input
                        type="text"
                        {...managerForm('staffId', { required: 'Manager ID is required' })}
                        placeholder="MGR-101"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                    {managerErrors.staffId && (
                      <p className="mt-1 text-[11px] text-rose-400">{managerErrors.staffId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Security PIN / Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4 text-violet-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...managerForm('pin', { required: 'Security PIN is required' })}
                        placeholder="••••"
                        maxLength={20}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {managerErrors.pin && (
                      <p className="mt-1 text-[11px] text-rose-400">{managerErrors.pin.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Validate & Open Manager Hub</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Demo access:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setManagerValue('staffId', 'MGR-101');
                      setManagerValue('pin', '1234');
                    }}
                    className="text-violet-400 hover:text-violet-300 font-semibold underline cursor-pointer"
                  >
                    Autofill (MGR-101 / 1234)
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 5: ADMIN LOGIN */}
            {activeModal === 'admin_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Institutional Admin Console</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Platform provisioning and multi-hostel system administration
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        {...loginForm('email', { required: 'Admin email required' })}
                        placeholder="admin@messmate.edu"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">Password</label>
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-purple-400 hover:text-purple-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm('password', { required: 'Password required' })}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Sign In to Admin Console</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginValue('email', 'admin@messmate.edu');
                      setLoginValue('password', 'Password@123');
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                  >
                    Autofill Super Admin Credentials
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
