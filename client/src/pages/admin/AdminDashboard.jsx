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
  Key
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
    rollNumber: '',
    roomNumber: '',
    phone: '',
    hostel: '',
    mess: ''
  });

  const [submitting, setSubmitting] = useState(false);

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

  const counts = adminData?.counts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <Building className="w-6 h-6 text-emerald-400" />
            Super Administrator Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Institutional management: account provisioning, role assignments, multi-hostel configuration, and platform audit feeds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') fetchAdminStats();
              else fetchUsers();
            }}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || usersLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          System Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User & Account Management
        </button>

        <button
          onClick={() => setActiveTab('hostels')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'hostels'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
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
            {/* System KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Total Users
                </span>
                <div className="text-2xl font-black text-slate-100 mt-1">{counts.totalUsers || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Platform accounts</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Active Students
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">{counts.students || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Hostel residents</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Mess Staff
                </span>
                <div className="text-2xl font-black text-cyan-400 mt-1">{counts.staff || 0}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Scanners & workers</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Total Meals Served
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {counts.totalMealsServed || 0}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Attendance logs</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Waste Logged
                </span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {counts.totalWasteLoggedKg || 0} <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Physical scale logs</p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Total Grievances
                </span>
                <div className="text-2xl font-black text-slate-200 mt-1">
                  {counts.totalComplaints || 0}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Tickets processed</p>
              </div>
            </div>

            {/* Hostels Infrastructure Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Active NIT Patna Hostels & Resident Capacities
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(adminData?.hostels || []).map((h) => (
                  <div
                    key={h._id}
                    className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-100 text-sm">{h.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {h.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 capitalize">
                        Type: {h.type || 'Boys'} • Total Rooms: {h.totalRooms || 250}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Assigned Residents:</span>
                      <span className="text-emerald-400 font-black text-sm">
                        {h.residentsCount || 0} students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Runtime Health Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Runtime: <b className="text-slate-200">Node.js ES Modules</b> • Mode:{' '}
                  <b className="text-slate-200 capitalize">{adminData?.systemInfo?.nodeEnv}</b> • Uptime:{' '}
                  <b className="text-slate-200">{Math.round((adminData?.systemInfo?.uptimeSeconds || 0) / 60)} mins</b>
                </span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                API Cluster Healthy
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
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 pl-9 outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="mess_staff">Mess Staff</option>
                <option value="mess_manager">Mess Manager</option>
                <option value="warden">Warden</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Provision Account
            </button>
          </div>

          {usersLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Hostel</th>
                      <th className="px-4 py-3">Mess Facility</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {userList.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-100">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.email} {u.rollNumber ? `• Roll: ${u.rollNumber}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : u.role === 'warden'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : u.role === 'mess_manager'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : u.role === 'mess_staff'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {u.hostel?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {u.mess?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                              u.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400'
                                : 'bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700 transition"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Configured Mess Facilities
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messList.map((m) => (
                <div
                  key={m._id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-100 text-sm">{m.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                      Active Facility
                    </span>
                  </div>

                  <div className="text-slate-400 space-y-1 pt-1">
                    <div>
                      Hostel Link: <b className="text-slate-200">{m.hostel?.name || 'Assigned'}</b>
                    </div>
                    <div>
                      Max Seating Capacity: <b className="text-slate-200">{m.capacity || 400} students</b>
                    </div>
                    <div>
                      Cutoff Policy:{' '}
                      <b className="text-slate-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Provision New Account
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create an administrative, staff, warden or student credential.
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="student">Student</option>
                    <option value="mess_staff">Mess Staff</option>
                    <option value="mess_manager">Mess Manager</option>
                    <option value="warden">Hostel Warden</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hostel</label>
                  <select
                    value={newUserData.hostel}
                    onChange={(e) => setNewUserData({ ...newUserData, hostel: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mess Facility</label>
                  <select
                    value={newUserData.mess}
                    onChange={(e) => setNewUserData({ ...newUserData, mess: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit className="w-5 h-5 text-emerald-400" />
              Edit User Account
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reassign hostel or mess facility for {editingUser.firstName} {editingUser.lastName}.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                >
                  <option value="student">Student</option>
                  <option value="mess_staff">Mess Staff</option>
                  <option value="mess_manager">Mess Manager</option>
                  <option value="warden">Hostel Warden</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Hostel</label>
                  <select
                    value={editingUser.hostel || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, hostel: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Mess</label>
                  <select
                    value={editingUser.mess || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mess: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
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
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
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
