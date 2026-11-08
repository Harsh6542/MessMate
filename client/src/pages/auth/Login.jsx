import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  KeyRound,
  Moon,
  Sun,
  Menu as MenuIcon,
  Calendar,
  TrendingDown,
  FileSpreadsheet,
  Clock,
  Activity,
  Check,
  Utensils,
  Award,
  BarChart3,
  Scale
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
  const { user, login, staffLogin, register: registerAuth } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // If user is already authenticated with active session, redirect to their role dashboard
  useEffect(() => {
    if (user && !location.state?.fromLogout) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate, location.state]);

  // Active view: null | 'student_login' | 'student_register' | 'staff_login' | 'manager_login' | 'admin_login' | 'interactive_demo'
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  // Smooth scroll helper for navbar links
  const scrollToSection = (id) => {
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Launch Demo session from the separate Interactive Demo Showcase
  const handleLaunchDemo = async (role) => {
    setErrorMessage('');
    try {
      setLoading(true);
      let user;

      if (role === 'mess_staff') {
        user = await staffLogin('STF-101', '1234', 'mess_staff');
      } else if (role === 'mess_manager') {
        user = await staffLogin('MGR-101', '1234', 'mess_manager');
      } else if (role === 'student_female') {
        user = await login('priya.kumari@messmate.edu', 'Password@123');
      } else if (role === 'admin') {
        user = await login('admin@messmate.edu', 'Password@123');
      } else {
        user = await login('student@messmate.edu', 'Password@123');
      }

      const roleLabel = user.role.replace('_', ' ').toUpperCase();
      toast.success(`Demo Session: Signed in as ${roleLabel}`);
      const dest = getDashboardPath(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Demo session failed. Ensure backend server is connected.');
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
      setErrorMessage(err.message || 'Login failed. Please verify your email and password.');
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
    <div className="space-y-12 animate-fadeIn pb-12">
      {/* ============================================================ */}
      {/* 1. FLOATING TOP NAVIGATION BAR (Matches Uploaded Design)     */}
      {/* ============================================================ */}
      <nav
        className={`sticky top-3 z-40 max-w-6xl mx-auto px-4 sm:px-6 py-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 flex items-center justify-between ${
          isDark
            ? 'bg-slate-900/85 border border-slate-800/90 shadow-2xl shadow-indigo-950/20'
            : 'bg-white/85 border border-slate-200/90 shadow-xl shadow-slate-200/60'
        }`}
      >
        {/* Brand Logo & Name: MessMate ONLY */}
        <div
          onClick={() => scrollToSection('portal-cards')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Rounded Gradient Square Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center text-base sm:text-lg font-extrabold tracking-tight">
              <span className={isDark ? 'text-white' : 'text-slate-900'}>Mess</span>
              <span className="text-indigo-500">Mate</span>
            </div>
            <p
              className={`text-[9px] font-mono tracking-widest uppercase -mt-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Secure. Private. Safe.
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Links */}
        <div
          className={`hidden md:flex items-center gap-6 text-xs font-semibold ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <button
            onClick={() => scrollToSection('features')}
            className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveModal('interactive_demo')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer font-bold ${
              isDark
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 hover:bg-violet-500/25'
                : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
            }`}
          >
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span>Interactive Demo</span>
          </button>
          <button
            onClick={() => scrollToSection('metrics')}
            className={`transition-colors cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
          >
            Metrics
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Functional Dark/Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/60 text-indigo-300 hover:text-white hover:bg-slate-700/80 shadow-sm'
                : 'bg-slate-100 border-slate-300 text-amber-500 hover:text-amber-600 hover:bg-slate-200 shadow-sm'
            }`}
          >
            {isDark ? (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
            ) : (
              <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
            )}
          </button>

          {/* Primary Gradient Pill Button */}
          <button
            onClick={() => scrollToSection('portal-cards')}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className={`md:hidden p-1.5 rounded-lg focus:outline-none ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileNavOpen && (
        <div
          className={`md:hidden max-w-6xl mx-auto px-4 py-3 border rounded-2xl shadow-xl flex flex-col gap-2.5 text-xs font-semibold animate-fadeIn ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <button
            onClick={() => scrollToSection('features')}
            className={`text-left py-1.5 px-3 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className={`text-left py-1.5 px-3 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className={`text-left py-1.5 px-3 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            Security
          </button>
          <button
            onClick={() => {
              setMobileNavOpen(false);
              setActiveModal('interactive_demo');
            }}
            className={`text-left py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 ${
              isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-50 text-violet-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo Showcase</span>
          </button>
          <button
            onClick={() => scrollToSection('metrics')}
            className={`text-left py-1.5 px-3 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            Metrics
          </button>

          {/* Theme Mode Toggle Row in Mobile Nav */}
          <div
            className={`flex items-center justify-between py-2 px-3 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <span>Appearance</span>
            <button
              onClick={toggleTheme}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                isDark ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-amber-600'
              }`}
            >
              {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          <button
            onClick={() => scrollToSection('portal-cards')}
            className="w-full mt-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-center"
          >
            Go to Login Portals &rarr;
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN ACCESS PORTALS SECTION                                */}
      {/* ============================================================ */}
      <section id="portal-cards" className="space-y-6 pt-2 scroll-mt-20">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-1.5">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-1 ${
              isDark
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>NIT Patna Unified Hostel Dining Portal</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Select Your Campus Access Portal
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Dedicated access portals for Students, Serving Staff, Mess Managers, and System Administrators.
          </p>
        </div>

        {/* 3 Separate Cards (Clean, authentic real-time login without demo clutter) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* CARD 1: STUDENT ACCESS */}
          <div
            className={`rounded-3xl border shadow-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 shadow-indigo-950/20'
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold tracking-widest text-indigo-500 uppercase">
                  Student Access
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SECURE
                </span>
              </div>

              {/* Graphic Banner */}
              <div
                className={`relative rounded-2xl p-3 border flex items-center justify-center h-36 overflow-hidden mb-5 transition-colors ${
                  isDark
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-950/80 border-indigo-500/20 group-hover:border-indigo-500/40'
                    : 'bg-gradient-to-b from-indigo-50 to-slate-50 border-indigo-200 group-hover:border-indigo-300'
                }`}
              >
                <svg viewBox="0 0 280 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="80" width="40" height="70" rx="4" fill="#312E81" fillOpacity="0.4" />
                  <rect x="70" y="60" width="60" height="90" rx="4" fill="#3730A3" fillOpacity="0.5" />
                  <rect x="140" y="70" width="50" height="80" rx="4" fill="#312E81" fillOpacity="0.4" />
                  <rect x="200" y="90" width="50" height="60" rx="4" fill="#3730A3" fillOpacity="0.4" />
                  <circle cx="240" cy="110" r="22" fill="#047857" fillOpacity="0.4" />
                  <rect x="238" y="125" width="4" height="25" fill="#065F46" />
                  <circle cx="105" cy="55" r="16" fill="#FBBF24" />
                  <path d="M92 50 C95 40, 115 40, 118 50 C120 45, 122 55, 118 60 Z" fill="#1E1B4B" />
                  <path d="M85 85 C85 75, 125 75, 125 85 L125 145 L85 145 Z" fill="#6366F1" />
                  <rect x="80" y="95" width="22" height="28" rx="2" fill="#F8FAFC" transform="rotate(-12 80 95)" />
                  <rect x="83" y="98" width="16" height="22" rx="1" fill="#4F46E5" transform="rotate(-12 80 95)" />
                  <circle cx="165" cy="58" r="15" fill="#FCD34D" />
                  <path d="M150 55 C152 42, 178 42, 180 55 C185 75, 178 95, 178 95 L152 95 C152 95, 145 75, 150 55 Z" fill="#312E81" />
                  <path d="M145 88 C145 78, 185 78, 185 88 L185 145 L145 145 Z" fill="#8B5CF6" />
                </svg>

                <div
                  className={`absolute -bottom-3 border-2 border-indigo-500/50 rounded-2xl p-1.5 shadow-xl text-indigo-400 flex items-center justify-center ${
                    isDark ? 'bg-slate-900 shadow-indigo-500/20' : 'bg-white shadow-md'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>

              <div className="text-center pt-1 mb-4">
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Student Portal
                </h2>
                <p className={`mt-0.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Access digital meal coupons, declare meal absences, submit food ratings, and book guest passes.
                </p>
              </div>

              <div className="space-y-1.5 mb-5">
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Single-use digital QR meal coupons</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Advance meal opt-out & zero food waste</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>7-day menu view & verified meal feedback</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveModal('student_login')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <span>Login as Student</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveModal('student_register')}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-colors text-center cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>
          </div>

          {/* CARD 2: MESS STAFF ACCESS (ID & PIN) */}
          <div
            className={`rounded-3xl border shadow-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 shadow-emerald-950/20'
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-500 uppercase">
                  Staff Counter
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <ScanLine className="w-3 h-3 text-cyan-400" />
                  SCANNER
                </span>
              </div>

              {/* Graphic Banner */}
              <div
                className={`relative rounded-2xl p-3 border flex items-center justify-center gap-3 h-36 overflow-hidden mb-5 transition-colors ${
                  isDark
                    ? 'bg-gradient-to-b from-emerald-950/60 to-slate-950/80 border-emerald-500/20 group-hover:border-emerald-500/40'
                    : 'bg-gradient-to-b from-emerald-50 to-slate-50 border-emerald-200 group-hover:border-emerald-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl border shadow-lg flex items-center justify-center text-emerald-500 transform -rotate-3 hover:rotate-0 transition-transform ${
                    isDark ? 'bg-slate-900/90 border-emerald-500/30 shadow-emerald-500/10' : 'bg-white border-emerald-300 shadow-md'
                  }`}
                >
                  <ScanLine className="w-6 h-6" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 border border-emerald-400/40 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white transform hover:scale-105 transition-transform">
                  <Hash className="w-7 h-7" />
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl border shadow-lg flex items-center justify-center text-teal-500 transform rotate-3 hover:rotate-0 transition-transform ${
                    isDark ? 'bg-slate-900/90 border-teal-500/30 shadow-teal-500/10' : 'bg-white border-teal-300 shadow-md'
                  }`}
                >
                  <KeyRound className="w-6 h-6" />
                </div>

                <div
                  className={`absolute -bottom-3 border-2 border-emerald-500/50 rounded-2xl p-1.5 shadow-xl text-emerald-500 flex items-center justify-center ${
                    isDark ? 'bg-slate-900 shadow-emerald-500/20' : 'bg-white shadow-md'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="text-center pt-1 mb-4">
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mess Staff
                </h2>
                <p className={`mt-0.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Counter barcode scanner, manual roll lookups, meal headcounts, and daily kitchen prep sheets.
                </p>
                <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 font-bold">
                  Staff ID & Security PIN Login
                </div>
              </div>

              <div className="space-y-1.5 mb-5">
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Live camera QR barcode scanner</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Manual roll number backup verification</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Kitchen prep sheets & food waste scale</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveModal('staff_login')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Login with Staff ID & PIN</span>
              </button>
            </div>
          </div>

          {/* CARD 3: MESS MANAGER ACCESS (ID & PIN) */}
          <div
            className={`rounded-3xl border shadow-2xl p-6 flex flex-col justify-between hover:border-violet-500/50 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 shadow-violet-950/20'
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
            }`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold tracking-widest text-violet-500 uppercase">
                  Manager Hub
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Sliders className="w-3 h-3 text-purple-400" />
                  OPERATIONS
                </span>
              </div>

              {/* Graphic Banner */}
              <div
                className={`relative rounded-2xl p-3 border flex items-center justify-center gap-3 h-36 overflow-hidden mb-5 transition-colors ${
                  isDark
                    ? 'bg-gradient-to-b from-violet-950/60 to-slate-950/80 border-violet-500/20 group-hover:border-violet-500/40'
                    : 'bg-gradient-to-b from-violet-50 to-slate-50 border-violet-200 group-hover:border-violet-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl border shadow-lg flex items-center justify-center text-violet-500 transform -rotate-3 hover:rotate-0 transition-transform ${
                    isDark ? 'bg-slate-900/90 border-violet-500/30 shadow-violet-500/10' : 'bg-white border-violet-300 shadow-md'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-violet-600 border border-violet-400/40 shadow-xl shadow-violet-500/20 flex items-center justify-center text-white transform hover:scale-105 transition-transform">
                  <Sliders className="w-7 h-7" />
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl border shadow-lg flex items-center justify-center text-indigo-500 transform rotate-3 hover:rotate-0 transition-transform ${
                    isDark ? 'bg-slate-900/90 border-indigo-500/30 shadow-indigo-500/10' : 'bg-white border-indigo-300 shadow-md'
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                </div>

                <div
                  className={`absolute -bottom-3 border-2 border-violet-500/50 rounded-2xl p-1.5 shadow-xl text-violet-500 flex items-center justify-center ${
                    isDark ? 'bg-slate-900 shadow-violet-500/20' : 'bg-white shadow-md'
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                </div>
              </div>

              <div className="text-center pt-1 mb-4">
                <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Mess Manager
                </h2>
                <p className={`mt-0.5 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Menu planning, AI attendance forecasting, raw inventory stock ledgers, and grievance resolution.
                </p>
                <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-500 font-bold">
                  Manager ID & Security PIN Login
                </div>
              </div>

              <div className="space-y-1.5 mb-5">
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>AI demand forecasting & portion planning</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Raw inventory stock ledger & re-order alarms</span>
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] ${
                    isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>Student complaints triage & announcements</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveModal('manager_login')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer group-hover:scale-[1.01]"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Login with Manager ID & PIN</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Institutional Admin Access Pill */}
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => setActiveModal('admin_login')}
            className={`inline-flex items-center gap-2 py-2 px-5 rounded-full border text-xs font-semibold shadow-md transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-500" />
            <span>Institutional Admin Console &rarr;</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. FEATURES SECTION                                          */}
      {/* ============================================================ */}
      <section
        id="features"
        className={`max-w-6xl mx-auto space-y-6 pt-10 scroll-mt-24 border-t ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>Smart Hostel Mess Ecosystem</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Engineered for Zero Food Waste & Transparent Dining
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Automating attendance, meal declarations, counter auditing, and raw stock management across all NIT Patna hostels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-indigo-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mb-3">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Digital Single-Use QR Coupons
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Cryptographically signed QR codes generated per meal session. Prevents coupon theft, duplicate meals, and unauthorized outsiders.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-emerald-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-emerald-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Advance Absence Declarations
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Students declare meal absences ahead of cutoff hours. Kitchen staff cook exact quantities, preventing surplus preparation.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-violet-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-violet-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AI Demand & Portion Forecasting
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Statistical algorithms calculate exact ingredient quantities and buffer servings based on hostel declarations and historical turnouts.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-teal-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-teal-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center mb-3">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Flexible Allowance Wallet
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Transparent ₹1,000 monthly allowance wallet automatically replenished every month for special counter snacks and guest meal bookings.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-amber-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-amber-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Kitchen Scale Waste Auditing
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Mess staff weigh leftover food on digital scales at the end of each session, publishing transparent daily wastage logs to students.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/70 border-slate-800/80 hover:border-rose-500/40'
                : 'bg-white border-slate-200 shadow-md hover:border-rose-300 hover:shadow-lg'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Verified Grievance Triage
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Photo-verified grievance pipeline categorized by food taste, hygiene, water quality, and staff behavior with mandatory manager SLAs.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. HOW IT WORKS SECTION                                      */}
      {/* ============================================================ */}
      <section
        id="how-it-works"
        className={`max-w-6xl mx-auto space-y-6 pt-10 scroll-mt-24 border-t ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>Standard Operating Procedure</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Closed-Loop Dining Flow in 4 Steps
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            How students, kitchen staff, and mess managers interact synchronously throughout the day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border relative ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <span className={`text-3xl font-black font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>01</span>
            <h3 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Declare or Opt-In</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Student opens mobile portal and either claims their meal coupon or declares absence before the session cutoff time.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border relative ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <span className={`text-3xl font-black font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>02</span>
            <h3 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Kitchen Prep Sheet</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Cooks consult real-time demand sheets showing confirmed headcount, reducing bulk over-preparation.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border relative ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <span className={`text-3xl font-black font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>03</span>
            <h3 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Counter Verification</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Mess staff scans the student's digital coupon with the tablet camera in &lt;1.2 seconds, instantly invalidating the code.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border relative ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <span className={`text-3xl font-black font-mono ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>04</span>
            <h3 className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Waste Log & Review</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Remaining food is logged on digital scales; students submit verified feedback and ratings to improve tomorrow's menu.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SECURITY ARCHITECTURE SECTION                             */}
      {/* ============================================================ */}
      <section
        id="security"
        className={`max-w-6xl mx-auto space-y-6 pt-10 scroll-mt-24 border-t ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Institutional Security</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Campus-Grade Security & Privacy
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Protecting university dining entitlements, student privacy, and financial reconciliations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Single-Use Nonce Validation
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Every digital coupon contains a cryptographically random nonce verified atomically against MongoDB. Cannot be duplicated, screenshotted, or shared.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Role-Based Access Control (RBAC)
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Strict compartmentalization prevents serving staff from modifying menus, students from editing inventory, and managers from tampering with admin logs.
            </p>
          </div>

          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center mb-3">
              <Hash className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Salted Passwords & HTTPS Session
            </h3>
            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Bcrypt-salted credentials, TLS encryption, and secure HTTP-Only cookies ensure no authentication tokens are exposed to browser cross-site scripts.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CAMPUS METRICS & IMPACT SECTION                           */}
      {/* ============================================================ */}
      <section
        id="metrics"
        className={`max-w-6xl mx-auto space-y-6 pt-10 scroll-mt-24 border-t ${
          isDark ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Campus Benchmarks</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Real-Time Campus Dining Metrics
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Measured across active residential hostel facilities at National Institute of Technology Patna.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div
            className={`p-6 rounded-2xl border shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black text-indigo-500 font-mono">4</span>
            <p className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Hostels Connected</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Kautilya, Kadambini, Nagarjuna, Aryabhatta</p>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black text-emerald-500 font-mono">1,800+</span>
            <p className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Hostel Residents</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Undergraduate & postgraduate boarders</p>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black text-teal-500 font-mono">38%</span>
            <p className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Waste Reduction</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Average monthly food savings</p>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-md ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black text-violet-500 font-mono">&lt; 1.2s</span>
            <p className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Counter Scan Speed</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Zero line congestion during peak hours</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. EVALUATOR / JURY CALLOUT BANNER (Interactive Demo Link)   */}
      {/* ============================================================ */}
      <div
        className={`max-w-6xl mx-auto p-6 sm:p-7 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30'
            : 'bg-gradient-to-r from-white via-indigo-50/60 to-white border-indigo-200 shadow-xl'
        }`}
      >
        <div className="space-y-1 text-center sm:text-left">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isDark ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-violet-100 text-violet-700 border-violet-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span>Evaluator & Jury Sandbox</span>
          </div>
          <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Looking for an evaluation preview of MessMate?
          </h3>
          <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Explore live features without typing credentials. Switch instantly between Student, Mess Staff, Mess Manager, and Super Admin roles.
          </p>
        </div>

        <button
          onClick={() => setActiveModal('interactive_demo')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-violet-600/30 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-violet-200" />
          <span>Launch Interactive Demo Showcase</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 8. INTERACTIVE MODAL DIALOGS                                 */}
      {/* ============================================================ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`relative w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* MODAL 1: STUDENT LOGIN (CLEAN REAL-TIME) */}
            {activeModal === 'student_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 flex items-center justify-center mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Student Sign In
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter your registered university email and password
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        {...loginForm('email', { required: 'Email address is required' })}
                        placeholder="student@messmate.edu"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="mt-1 text-[11px] text-rose-500">{loginErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-indigo-500 hover:text-indigo-600 transition-colors font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm('password', { required: 'Password is required' })}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="mt-1 text-[11px] text-rose-500">{loginErrors.password.message}</p>
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

                <div className={`pt-2 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    New student?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('student_register')}
                      className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                    >
                      Register here &rarr;
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* MODAL 2: STUDENT REGISTRATION */}
            {activeModal === 'student_register' && (
              <div className="space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 flex items-center justify-center mb-2">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Student Registration
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Create your account to access digital meal coupons
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        {...registerForm('firstName', { required: 'Required' })}
                        placeholder="Ayush"
                        className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                      {registerErrors.firstName && (
                        <p className="text-[10px] text-rose-500 mt-0.5">{registerErrors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        {...registerForm('lastName', { required: 'Required' })}
                        placeholder="Singh"
                        className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...registerForm('email', {
                        required: 'Email required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Valid email required' }
                      })}
                      placeholder="ayush.ug22.cs@nitp.ac.in"
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDark
                          ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                    {registerErrors.email && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{registerErrors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Roll Number *
                      </label>
                      <input
                        type="text"
                        {...registerForm('rollNumber', { required: 'Roll required' })}
                        placeholder="2201045"
                        className={`w-full px-3 py-2 border rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...registerForm('phone')}
                        placeholder="9876543210"
                        className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Gender *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterValue('gender', 'male', { shouldValidate: true })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedGender === 'male'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedGender === 'male' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                        <span>Male (Boys)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegisterValue('gender', 'female', { shouldValidate: true })}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedGender === 'female'
                            ? 'bg-pink-600/20 border-pink-500 text-pink-500 font-bold'
                            : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-slate-100 border-slate-300 text-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedGender === 'female' ? 'bg-pink-500' : 'bg-slate-400'}`} />
                        <span>Female (Girls)</span>
                      </button>
                    </div>
                    <input type="hidden" {...registerForm('gender', { required: true })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Hostel Assignment *
                      </label>
                      <select
                        {...registerForm('hostel', { required: 'Please select hostel' })}
                        className={`w-full px-2.5 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option value="">Select Hostel</option>
                        {filteredHostels.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} {h.code ? `(${h.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {registerErrors.hostel && (
                        <p className="text-[10px] text-rose-500 mt-0.5">{registerErrors.hostel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Room Number *
                      </label>
                      <input
                        type="text"
                        {...registerForm('roomNumber', { required: 'Room required' })}
                        placeholder={selectedGender === 'female' ? 'KD-104' : 'K-204'}
                        className={`w-full px-3 py-2 border rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Set Password *
                    </label>
                    <input
                      type="password"
                      {...registerForm('password', {
                        required: 'Password required',
                        minLength: { value: 6, message: 'Minimum 6 chars' }
                      })}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        isDark
                          ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                    {registerErrors.password && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{registerErrors.password.message}</p>
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

                <div className={`pt-2 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveModal('student_login')}
                      className="text-indigo-500 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                    >
                      Sign In &rarr;
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* MODAL 3: MESS STAFF LOGIN (CLEAN REAL-TIME ID & PIN) */}
            {activeModal === 'staff_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mb-2">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mess Staff Sign In
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter your assigned <span className="text-emerald-500 font-semibold">Staff ID</span> and{' '}
                    <span className="text-emerald-500 font-semibold">Security PIN</span>.
                  </p>
                </div>

                <form onSubmit={handleStaffSubmit(onStaffSubmit)} className="space-y-3.5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Staff ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Hash className="w-4 h-4 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        {...staffForm('staffId', { required: 'Staff ID is required' })}
                        placeholder="e.g. STF-101"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                    {staffErrors.staffId && (
                      <p className="mt-1 text-[11px] text-rose-500">{staffErrors.staffId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Security PIN
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4 text-emerald-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...staffForm('pin', { required: 'Security PIN is required' })}
                        placeholder="••••"
                        maxLength={20}
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {staffErrors.pin && (
                      <p className="mt-1 text-[11px] text-rose-500">{staffErrors.pin.message}</p>
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
                        <span>Validate & Open Serving Counter</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* MODAL 4: MESS MANAGER LOGIN (CLEAN REAL-TIME ID & PIN) */}
            {activeModal === 'manager_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-500 flex items-center justify-center mb-2">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Mess Manager Sign In
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter your assigned <span className="text-violet-500 font-semibold">Manager ID</span> and{' '}
                    <span className="text-violet-500 font-semibold">Security PIN</span>.
                  </p>
                </div>

                <form onSubmit={handleManagerSubmit(onManagerSubmit)} className="space-y-3.5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Manager ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="w-4 h-4 text-violet-500" />
                      </div>
                      <input
                        type="text"
                        {...managerForm('staffId', { required: 'Manager ID is required' })}
                        placeholder="e.g. MGR-101"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                    {managerErrors.staffId && (
                      <p className="mt-1 text-[11px] text-rose-500">{managerErrors.staffId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Security PIN
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4 text-violet-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...managerForm('pin', { required: 'Security PIN is required' })}
                        placeholder="••••"
                        maxLength={20}
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {managerErrors.pin && (
                      <p className="mt-1 text-[11px] text-rose-500">{managerErrors.pin.message}</p>
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
                        <span>Validate & Open Operations Hub</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* MODAL 5: ADMIN LOGIN */}
            {activeModal === 'admin_login' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Institutional Admin Console
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Multi-hostel provisioning and system-wide administration
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Admin Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        {...loginForm('email', { required: 'Admin email required' })}
                        placeholder="admin@messmate.edu"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-[11px] text-purple-500 hover:text-purple-600 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginForm('password', { required: 'Password required' })}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          isDark
                            ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
              </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 6: SEPARATE INTERACTIVE DEMO SHOWCASE                  */}
            {/* (Only shown when clicking Interactive Demo in Navbar or jury)*/}
            {/* ============================================================ */}
            {activeModal === 'interactive_demo' && (
              <div className="space-y-5">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mb-2 shadow-lg shadow-violet-500/25">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Interactive Demo Showcase
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Select any evaluation persona below to launch a live test session instantly without typing credentials.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Persona 1: Student (Male) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Ayush Singh (Student - Boys)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-500 font-mono font-bold">
                        Kautilya
                      </span>
                    </div>
                    <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Roll: 2201003 &bull; Digital coupon wallet, meal declarations, and feedback.
                    </p>
                    <button
                      onClick={() => handleLaunchDemo('student')}
                      disabled={loading}
                      className="w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Student Session (Ayush)</span>
                    </button>
                  </div>

                  {/* Persona 2: Student (Female) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-pink-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-pink-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-pink-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Priya Kumari (Student - Girls)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-500 font-mono font-bold">
                        Kadambini
                      </span>
                    </div>
                    <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Roll: 2201010 &bull; Kadambini girls dining facility and meal absent logging.
                    </p>
                    <button
                      onClick={() => handleLaunchDemo('student_female')}
                      disabled={loading}
                      className="w-full py-1.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Student Session (Priya)</span>
                    </button>
                  </div>

                  {/* Persona 3: Mess Staff */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-emerald-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Raju Kumar (Mess Staff)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-mono font-bold">
                        ID: STF-101
                      </span>
                    </div>
                    <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Serving counter camera scanner, manual student lookup, and kitchen scale waste logging.
                    </p>
                    <button
                      onClick={() => handleLaunchDemo('mess_staff')}
                      disabled={loading}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Mess Staff Counter Session</span>
                    </button>
                  </div>

                  {/* Persona 4: Mess Manager */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-violet-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-violet-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-violet-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Suresh Sharma (Mess Manager)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-500 font-mono font-bold">
                        ID: MGR-101
                      </span>
                    </div>
                    <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      AI attendance forecasting, menu editor, raw ingredient inventory, and complaints queue.
                    </p>
                    <button
                      onClick={() => handleLaunchDemo('mess_manager')}
                      disabled={loading}
                      className="w-full py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Mess Manager Operations Session</span>
                    </button>
                  </div>

                  {/* Persona 5: Super Admin */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-colors ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-purple-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Campus Super Admin
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-500 font-mono font-bold">
                        Platform-wide
                      </span>
                    </div>
                    <p className={`text-[11px] mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Hostel & mess provisioning, multi-facility oversight, and master user accounts.
                    </p>
                    <button
                      onClick={() => handleLaunchDemo('admin')}
                      disabled={loading}
                      className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Super Admin Session</span>
                    </button>
                  </div>
                </div>

                <div className={`pt-2 border-t text-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <p className="text-[11px] text-slate-500">
                    Live production database test sessions &bull; All data modifications are real-time
                  </p>
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
