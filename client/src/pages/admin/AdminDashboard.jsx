import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Building,
  Users,
  Shield,
  Utensils,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Edit,
  Trash2,
  Server,
  Activity,
  X,
  Scale,
  Key,
  ShieldCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const AdminDashboard = () => {
  const location = useLocation();
  const getInitialTab = () => {
    if (location.pathname.includes('/users')) return 'users';
    if (location.pathname.includes('/hostels')) return 'hostels';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Users Tab State
  const [userList, setUserList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [hostelList, setHostelList] = useState([]);
  const [messList, setMessList] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // New User Form State
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    gender: 'male',
    rollNumber: '',
    roomNumber: '',
    phone: '',
    hostel: '',
    mess: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/users')) setActiveTab('users');
    else if (location.pathname.includes('/hostels')) setActiveTab('hostels');
    else setActiveTab('overview');
  }, [location.pathname]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      const payload = res?.data || res;
      if (res?.success || res?.status === 'success' || payload) {
        setAdminData(payload);
      }
    } catch (err) {
      toast.error('Failed to load system dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedRole) params.append('role', selectedRole);

      const [usersRes, hostelsRes, messRes] = await Promise.all([
        api.get(`/users?${params.toString()}&limit=50`),
        api.get('/hostels'),
        api.get('/mess')
      ]);

      if (usersRes.success) {
        setUserList(usersRes.data?.users || []);
      }
      if (hostelsRes.success) {
        setHostelList(hostelsRes.data?.hostels || []);
      }
      if (messRes.success) {
        setMessList(messRes.data?.facilities || messRes.data?.messFacilities || []);
      }
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'hostels') {
      fetchUsers();
    }
  }, [activeTab, searchQuery, selectedRole]);

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.put(`/users/${user._id}/status`, { isActive: !user.isActive });
      if (res.success) {
        toast.success(`Account for ${user.firstName} ${!user.isActive ? 'activated' : 'deactivated'}.`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle account status.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/users', newUserData);
      if (res.success) {
        toast.success(`Account for ${newUserData.firstName} created successfully!`);
        setShowCreateModal(false);
        setNewUserData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'student',
          gender: 'male',
          rollNumber: '',
          roomNumber: '',
          phone: '',
          hostel: '',
          mess: ''
        });
        fetchUsers();
        fetchAdminStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser({
      ...user,
      hostel: user.hostel?._id || user.hostel || '',
      mess: user.mess?._id || user.mess || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/users/${editingUser._id}`, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        role: editingUser.role,
        gender: editingUser.gender,
        hostel: editingUser.hostel || null,
        mess: editingUser.mess || null,
        roomNumber: editingUser.roomNumber,
        phone: editingUser.phone
      });

      if (res.success) {
        toast.success('User updated successfully.');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin' || user.email === 'admin@messmate.edu') {
      toast.error('System Super Administrator account cannot be deleted.');
      return;
    }

    const confirmMsg = `Permanently delete ${user.firstName} ${user.lastName} (${user.email})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/users/${user._id}`);
      if (res?.success || res?.status === 'success' || res) {
        toast.success(`Account for ${user.firstName} deleted successfully.`);
        fetchUsers();
        fetchAdminStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleCleanDummyUsers = async () => {
    const confirmMsg = 'Purge all dummy mock students from the database?\n\nThis frees up roll numbers for real students while preserving official Demo accounts (Ayush, Priya, Staff Raju, Manager Suresh, Super Admin) and weekly menus.';
    if (!window.confirm(confirmMsg)) return;

    try {
      setPurging(true);
      const res = await api.post('/users/clean-dummy-users');
      if (res?.success || res?.status === 'success' || res) {
        toast.success(res?.message || 'Purged dummy users cleanly! Database is fresh.');
        fetchUsers();
        fetchAdminStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purge dummy users.');
    } finally {
      setPurging(false);
    }
  };

  const counts = adminData?.counts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-emerald-500" />
            Super Administrator Console
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Institutional management: account provisioning, role assignments, multi-hostel configuration, and platform audit feeds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') fetchAdminStats();
              else fetchUsers();
            }}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || usersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          System Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User & Account Management
        </button>

        <button
          onClick={() => setActiveTab('hostels')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'hostels'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Hostels & Mess Facilities ({adminData?.hostels?.length || 0})
        </button>
      </div>

      {activeTab === 'overview' ? (
        loading ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Total Users */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Total Users
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {counts.totalUsers || 0}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Platform accounts</p>
                </div>
              </div>

              {/* Active Students */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Active Students
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {counts.students || 0}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Hostel residents</p>
                </div>
              </div>

              {/* Mess Staff */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Mess Staff
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
                    {counts.staff || 0}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Scanners & workers</p>
                </div>
              </div>

              {/* Total Meals Served */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Meals Served
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    {counts.totalMealsServed || 0}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Attendance logs</p>
                </div>
              </div>

              {/* Waste Logged */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Waste Logged
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-baseline gap-1">
                    {counts.totalWasteLoggedKg || 0}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">kg</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Physical scale logs</p>
                </div>
              </div>

              {/* Grievances */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Grievances
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl lg:text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
                    {counts.totalComplaints || 0}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Tickets processed</p>
                </div>
              </div>
            </div>

            {/* Hostels Infrastructure Grid */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-500" />
                  Active NIT Patna Hostels & Resident Capacities
                </h3>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  4 Facilities Configured
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(adminData?.hostels || []).map((h) => {
                  const isGirls = h.type === 'girls' || h.name?.toLowerCase().includes('kadambini');
                  const capacity = h.capacity || (isGirls ? 400 : 450);
                  const residents = h.residentsCount || 0;
                  const pct = Math.min(100, Math.round((residents / capacity) * 100));

                  return (
                    <div
                      key={h._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                              {h.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                                  isGirls
                                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                                }`}
                              >
                                {isGirls ? 'Girls Hostel' : 'Boys Hostel'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Cap: {capacity}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shrink-0">
                            {h.code}
                          </span>
                        </div>

                        {/* Occupancy Progress Bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                            <span>Occupancy</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Assigned Residents:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          {residents} {residents === 1 ? 'student' : 'students'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Institutional System Status Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
              <div className="flex items-center gap-2.5 font-medium">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>National Institute of Technology Patna • MessMate Institutional System</span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                All Dining Facilities Active & Operational
              </span>
            </div>
          </div>
        )
      ) : activeTab === 'users' ? (
        /* USERS DIRECTORY TAB */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by name, roll, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-xl px-3 py-2 pl-9 outline-none focus:border-emerald-500 shadow-sm"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 shadow-sm"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="mess_staff">Mess Staff</option>
                <option value="mess_manager">Mess Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCleanDummyUsers}
                disabled={purging}
                className="px-3.5 py-2 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-750 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                title="Purge dummy accounts and free up roll numbers for real mess operations"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-500" />
                {purging ? 'Purging Dummies...' : 'Clean Dummy Users'}
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Provision Account
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-bold">User</th>
                      <th className="px-4 py-3 font-bold">Role</th>
                      <th className="px-4 py-3 font-bold">Hostel</th>
                      <th className="px-4 py-3 font-bold">Mess Facility</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {userList.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.email} {u.rollNumber ? `• Roll: ${u.rollNumber}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : u.role === 'mess_manager'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : u.role === 'mess_staff'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {u.hostel?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {u.mess?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                              u.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-rose-500/10 hover:text-rose-600'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-600'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit User"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.role === 'admin' || u.email === 'admin@messmate.edu'}
                              className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition disabled:opacity-30 disabled:hover:text-slate-400"
                              title={u.role === 'admin' ? 'Cannot delete Super Admin' : 'Delete User'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* HOSTELS & MESS TAB */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              Configured Mess Facilities
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messList.map((m) => (
                <div
                  key={m._id}
                  className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-2.5 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60">
                      Active Facility
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div>
                      Hostel Link: <b className="text-slate-900 dark:text-slate-200 font-semibold">{m.hostel?.name || 'Assigned'}</b>
                    </div>
                    <div>
                      Max Seating Capacity: <b className="text-slate-900 dark:text-slate-200 font-semibold">{m.capacity || 400} students</b>
                    </div>
                    <div>
                      Cutoff Policy:{' '}
                      <b className="text-slate-900 dark:text-slate-200 font-semibold">
                        Breakfast 21:00 (prev day) • Lunch 09:00 • Dinner 16:00
                      </b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Provision New Account */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 dark:text-white">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Provision New Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create an administrative, staff, manager or student credential.
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="student">Student</option>
                    <option value="mess_staff">Mess Staff</option>
                    <option value="mess_manager">Mess Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                  <select
                    value={newUserData.gender || 'male'}
                    onChange={(e) => setNewUserData({ ...newUserData, gender: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newUserData.roomNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, roomNumber: e.target.value })}
                    placeholder="e.g. K-104, KD-201"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hostel</label>
                  <select
                    value={newUserData.hostel}
                    onChange={(e) => setNewUserData({ ...newUserData, hostel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {hostelList.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mess Facility</label>
                  <select
                    value={newUserData.mess}
                    onChange={(e) => setNewUserData({ ...newUserData, mess: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {messList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User Details */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 dark:text-white">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-emerald-500" />
              Edit User Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reassign hostel or mess facility for {editingUser.firstName} {editingUser.lastName}.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                >
                  <option value="student">Student</option>
                  <option value="mess_staff">Mess Staff</option>
                  <option value="mess_manager">Mess Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                  <select
                    value={editingUser.gender || 'male'}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={editingUser.roomNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, roomNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Hostel</label>
                  <select
                    value={editingUser.hostel || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, hostel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">None / Unassigned</option>
                    {hostelList.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Mess</label>
                  <select
                    value={editingUser.mess || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mess: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="">None / Unassigned</option>
                    {messList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
