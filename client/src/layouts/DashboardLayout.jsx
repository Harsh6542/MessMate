import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  LayoutDashboard,
  Calendar,
  QrCode,
  AlertCircle,
  Star,
  Users,
  LogOut,
  Menu as MenuIcon,
  X,
  Bell,
  User,
  Package,
  TrendingDown,
  Building,
  ScanLine,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role-based navigation links
  const getNavItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Weekly Menu', path: '/student/menu', icon: Calendar },
          { name: 'Meal Declaration', path: '/student/declarations', icon: Calendar },
          { name: 'Digital Coupon', path: '/student/coupon', icon: QrCode },
          { name: 'Feedback & Ratings', path: '/student/feedback', icon: Star },
          { name: 'Complaints', path: '/student/complaints', icon: AlertCircle },
          { name: 'Guest Meals', path: '/student/guest-meals', icon: Users }
        ];
      case 'mess_staff':
        return [
          { name: 'Staff Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
          { name: 'Scan QR Coupon', path: '/staff/scanner', icon: ScanLine },
          { name: 'Manual Verification', path: '/staff/manual-verify', icon: Users },
          { name: 'Kitchen Prep Sheet', path: '/staff/prep-sheet', icon: FileSpreadsheet },
          { name: 'Record Food Waste', path: '/staff/waste-entry', icon: TrendingDown }
        ];
      case 'mess_manager':
        return [
          { name: 'Manager Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
          { name: 'Menu Planning', path: '/manager/menu', icon: Calendar },
          { name: 'Demand Prediction', path: '/manager/demand', icon: TrendingDown },
          { name: 'Inventory & Stock', path: '/manager/inventory', icon: Package },
          { name: 'Complaints Queue', path: '/manager/complaints', icon: AlertCircle },
          { name: 'Food Wastage Logs', path: '/manager/wastage', icon: TrendingDown },
          { name: 'Announcements', path: '/manager/announcements', icon: Bell }
        ];
      case 'warden':
        return [
          { name: 'Warden Dashboard', path: '/warden/dashboard', icon: LayoutDashboard },
          { name: 'Hostel Performance', path: '/warden/performance', icon: Building },
          { name: 'Complaints Oversight', path: '/warden/complaints', icon: AlertCircle },
          { name: 'Wastage Analytics', path: '/warden/wastage', icon: TrendingDown },
          { name: 'Quality Scorecards', path: '/warden/quality', icon: Star }
        ];
      case 'admin':
        return [
          { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Hostels & Mess', path: '/admin/hostels', icon: Building },
          { name: 'System Settings', path: '/admin/settings', icon: ShieldCheck }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatRole = (role) => {
    switch (role) {
      case 'mess_staff':
        return 'Mess Staff';
      case 'mess_manager':
        return 'Mess Manager';
      case 'warden':
        return 'Hostel Warden';
      case 'admin':
        return 'Administrator';
      default:
        return 'Student';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 z-30">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Mess<span className="text-emerald-400">Mate</span>
          </span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                {formatRole(user?.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors mb-1"
          >
            <User className="w-4 h-4" />
            My Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white flex items-center justify-between px-4 h-16 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-bold">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold">
            Mess<span className="text-emerald-400">Mate</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900/95 backdrop-blur-md z-40 p-4 flex flex-col justify-between">
          <nav className="space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 rounded-xl hover:bg-slate-800"
            >
              <User className="w-5 h-5" />
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 rounded-xl hover:bg-rose-500/10"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white border-b border-slate-200">
          <div>
            <h1 className="text-base font-semibold text-slate-800">
              Welcome, {user?.firstName}
            </h1>
            <p className="text-xs text-slate-500">
              {user?.hostel?.name ? `Hostel: ${user.hostel.name}` : 'NIT Patna Mess Ecosystem'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              title="Notifications"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <Link
              to="/profile"
              className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <span className="text-sm font-medium">{user?.firstName}</span>
            </Link>
          </div>
        </header>

        {/* Child Pages Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

