import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

const TARIFFS = {
  breakfast: 60,
  lunch: 90,
  dinner: 90
};

export const GuestMealRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [mealType, setMealType] = useState('lunch');
  const [guestCount, setGuestCount] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [guestNames, setGuestNames] = useState(['']);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/guest-meals/my');
      if (res.success) {
        setRequests(res.data?.requests || []);
      }
    } catch (err) {
      toast.error('Failed to load guest meal bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleNameChange = (index, value) => {
    const updated = [...guestNames];
    updated[index] = value;
    setGuestNames(updated);
  };

  const handleAddNameField = () => {
    if (guestNames.length < 10) {
      setGuestNames([...guestNames, '']);
      setGuestCount(guestNames.length + 1);
    }
  };

  const handleRemoveNameField = (index) => {
    if (guestNames.length > 1) {
      const updated = guestNames.filter((_, i) => i !== index);
      setGuestNames(updated);
      setGuestCount(updated.length);
    }
  };

  const handleGuestCountChange = (count) => {
    const num = Math.min(10, Math.max(1, count));
    setGuestCount(num);
    const names = [...guestNames];
    while (names.length < num) names.push('');
    while (names.length > num) names.pop();
    setGuestNames(names);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast.error('Please enter the visit purpose.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/guest-meals', {
        date,
        mealType,
        guestCount,
        purpose,
        guestNames: guestNames.filter((n) => n.trim())
      });

      if (res.success) {
        toast.success('Guest meal booking submitted for manager approval!');
        setPurpose('');
        setGuestNames(['']);
        setGuestCount(1);
        fetchMyRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit guest meal booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this guest meal booking?')) return;
    try {
      const res = await api.delete(`/guest-meals/${id}`);
      if (res.success) {
        toast.success('Booking cancelled.');
        fetchMyRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const currentRate = TARIFFS[mealType] || 90;
  const totalAmount = guestCount * currentRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-emerald-400" />
          Guest Meal Booking & Family Passes
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Reserve meal tickets for visiting parents, relatives or friends. Bookings are processed by the mess manager.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            New Guest Meal Reservation
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Visit Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meal Session *
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="breakfast">Breakfast (₹60 / guest)</option>
                  <option value="lunch">Lunch (₹90 / guest)</option>
                  <option value="dinner">Dinner (₹90 / guest)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Number of Guests (Max 10)
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={guestCount}
                onChange={(e) => handleGuestCountChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Guest Names Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Name(s)
              </label>
              <div className="space-y-2">
                {guestNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Guest ${i + 1} Name (e.g. Ramesh Kumar)`}
                      value={name}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                    {guestNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNameField(i)}
                        className="p-2 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purpose of Visit *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Parents visiting NIT Patna campus / project teammates"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Estimated Tariff Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Applicable Tariff Breakdown
                </span>
                <span className="text-xs text-slate-300">
                  {guestCount} Guest(s) × ₹{currentRate} per head
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">₹{totalAmount}</span>
                <span className="text-[10px] text-slate-400 block">Payable at Mess Counter</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting Reservation...' : 'Request Guest Meal Pass'}
            </button>
          </form>
        </div>

        {/* Policy Guidelines Box */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Info className="w-5 h-5 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Hostel Mess Guest Policy</h3>
          </div>

          <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
            <li>
              Submit requests at least <b className="text-slate-300">3 hours</b> before the meal start time so the kitchen can prepare adequate quantities.
            </li>
            <li>
              Approved guest passes are integrated into the kitchen prep sheet to eliminate avoidable wastage.
            </li>
            <li>
              Standard Guest Tariffs:
              <div className="mt-1 font-semibold text-slate-300">
                • Breakfast: ₹60<br />
                • Lunch / Dinner: ₹90
              </div>
            </li>
            <li>
              Students are personally responsible for guest conduct and dining room decorum.
            </li>
          </ul>
        </div>
      </div>

      {/* Booking History Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          My Guest Meal Bookings ({requests.length})
        </h3>

        {loading ? (
          <div className="min-h-[150px] flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-500 text-xs">
            You have not booked any guest meals yet.
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="px-4 py-3">Meal Date</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {requests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 capitalize font-bold text-slate-300">{r.mealType}</td>
                      <td className="px-4 py-3">{r.guestCount} Guest(s)</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">₹{r.totalAmountINR}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">{r.purpose}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            r.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : r.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : r.status === 'cancelled'
                              ? 'bg-slate-700 text-slate-400'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(r._id)}
                            className="text-rose-400 hover:text-rose-300 font-bold text-[11px] transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestMealRequest;
