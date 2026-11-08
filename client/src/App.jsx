import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';

// Phase 2 Operational Pages
import WeeklyMenuView from './pages/student/WeeklyMenuView';
import MealDeclaration from './pages/student/MealDeclaration';
import DigitalCoupon from './pages/student/DigitalCoupon';
import QRScanner from './pages/staff/QRScanner';
import ManualVerify from './pages/staff/ManualVerify';
import MenuEditor from './pages/manager/MenuEditor';

// Phase 3 Student Experience Pages
import FeedbackRating from './pages/student/FeedbackRating';
import ComplaintsList from './pages/student/ComplaintsList';
import NewComplaint from './pages/student/NewComplaint';
import ComplaintDetail from './pages/student/ComplaintDetail';
import ComplaintsQueue from './pages/manager/ComplaintsQueue';
import AnnouncementsManager from './pages/manager/AnnouncementsManager';

// Phase 4 Administration & Operations Pages
import DemandForecast from './pages/manager/DemandForecast';
import InventoryManager from './pages/manager/InventoryManager';
import FoodWastageView from './pages/manager/FoodWastageView';
import GuestMealsManager from './pages/manager/GuestMealsManager';
import KitchenPrepSheet from './pages/staff/KitchenPrepSheet';
import WasteEntryForm from './pages/staff/WasteEntryForm';
import GuestMealRequest from './pages/student/GuestMealRequest';

// Helper to resolve canonical dashboard route per user role
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


export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                fontSize: '13px',
                borderRadius: '12px'
              }
            }}
          />

          <Routes>
            {/* Public Root & Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/profile" element={<Profile />} />

                {/* Student Role Routes */}
                <Route element={<RoleRoute allowedRoles={['student']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/menu" element={<WeeklyMenuView />} />
                  <Route path="/student/declarations" element={<MealDeclaration />} />
                  <Route path="/student/coupon" element={<DigitalCoupon />} />
                  <Route path="/student/feedback" element={<FeedbackRating />} />
                  <Route path="/student/complaints" element={<ComplaintsList />} />
                  <Route path="/student/complaints/new" element={<NewComplaint />} />
                  <Route path="/student/complaints/:id" element={<ComplaintDetail />} />
                  <Route path="/student/guest-meals" element={<GuestMealRequest />} />
                </Route>

                {/* Mess Staff Role Routes */}
                <Route element={<RoleRoute allowedRoles={['mess_staff']} />}>
                  <Route path="/staff/dashboard" element={<StaffDashboard />} />
                  <Route path="/staff/scanner" element={<QRScanner />} />
                  <Route path="/staff/manual-verify" element={<ManualVerify />} />
                  <Route path="/staff/prep-sheet" element={<KitchenPrepSheet />} />
                  <Route path="/staff/waste-entry" element={<WasteEntryForm />} />
                </Route>

                {/* Mess Manager Role Routes */}
                <Route element={<RoleRoute allowedRoles={['mess_manager']} />}>
                  <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                  <Route path="/manager/menu" element={<MenuEditor />} />
                  <Route path="/manager/demand" element={<DemandForecast />} />
                  <Route path="/manager/inventory" element={<InventoryManager />} />
                  <Route path="/manager/wastage" element={<FoodWastageView />} />
                  <Route path="/manager/guest-meals" element={<GuestMealsManager />} />
                  <Route path="/manager/complaints" element={<ComplaintsQueue />} />
                  <Route path="/manager/announcements" element={<AnnouncementsManager />} />
                </Route>

                {/* Super Admin Role Routes */}
                <Route element={<RoleRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminDashboard />} />
                  <Route path="/admin/hostels" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback Aliases for legacy /mess_staff and /mess_manager routes */}
            <Route path="/mess_staff" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/mess_staff/*" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/mess_manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/mess_manager/*" element={<Navigate to="/manager/dashboard" replace />} />

            {/* Catch-all 404 Route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                  <h1 className="text-6xl font-extrabold text-emerald-400">404</h1>
                  <p className="text-xl font-bold mt-2">Page Not Found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    The page you are looking for does not exist or has been relocated.
                  </p>
                  <a
                    href="/"
                    className="mt-6 px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg"
                  >
                    Return to Home
                  </a>
                </div>
              }
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
