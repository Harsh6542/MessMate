import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Star, CheckCircle2, Clock, MessageSquare, Utensils, AlertCircle } from 'lucide-react';

export const FeedbackRating = () => {
  const [attendedMeals, setAttendedMeals] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Ratings state
  const [taste, setTaste] = useState(5);
  const [hygiene, setHygiene] = useState(5);
  const [temperature, setTemperature] = useState(5);
  const [portionSize, setPortionSize] = useState(5);
  const [overall, setOverall] = useState(5);
  const [comment, setComment] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, feedRes] = await Promise.all([
        api.get('/attendance/my-history'),
        api.get('/feedback/my')
      ]);

      if (attRes.success && attRes.data?.attendance) {
        setAttendedMeals(attRes.data.attendance);
        if (attRes.data.attendance.length > 0) {
          setSelectedSession(attRes.data.attendance[0].mealSession);
        }
      }

      if (feedRes.success && feedRes.data?.feedback) {
        setFeedbackHistory(feedRes.data.feedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession?._id) {
      toast.error('Please select an attended meal session');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/feedback', {
        mealSessionId: selectedSession._id,
        ratings: {
          taste,
          hygiene,
          temperature,
          portionSize,
          overall
        },
        comment
      });

      if (res.success) {
        toast.success(res.message || 'Feedback submitted successfully!');
        setComment('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = (label, value, setter) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setter(star)}
            className="p-1 focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-bold text-slate-700 w-4">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Food Quality & Hygiene Ratings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verified student reviews. You can only rate meals for which your attendance was verified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Form Column */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            Rate a Recently Attended Meal
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading attendance records...</div>
          ) : attendedMeals.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">No Attended Meals Found</p>
              <p>You can only submit reviews after having your coupon scanned at the mess counter.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Attended Meal
                </label>
                <select
                  value={selectedSession?._id || ''}
                  onChange={(e) => {
                    const match = attendedMeals.find(
                      (a) => a.mealSession?._id === e.target.value
                    );
                    if (match) setSelectedSession(match.mealSession);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {attendedMeals.map((att) => (
                    <option key={att._id} value={att.mealSession?._id}>
                      {att.mealSession?.mealType?.toUpperCase()} —{' '}
                      {new Date(att.mealSession?.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}{' '}
                      (Attended at {new Date(att.timestamp).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Metrics */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {renderStarInput('Food Taste & Flavor', taste, setTaste)}
                {renderStarInput('Cleanliness & Hygiene', hygiene, setHygiene)}
                {renderStarInput('Food Temperature (Served Hot)', temperature, setTemperature)}
                {renderStarInput('Portion Size / Quantity', portionSize, setPortionSize)}
                {renderStarInput('Overall Dining Experience', overall, setOverall)}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Written Feedback or Constructive Comments
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Paneer curry was fresh and hot, but dal was slightly watery today."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  maxLength={500}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
              >
                {submitting ? 'Submitting Review...' : 'Submit Meal Review'}
              </button>
            </form>
          )}
        </div>

        {/* Feedback History Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>Your Previous Ratings</span>
            <span className="text-xs font-normal text-slate-400">{feedbackHistory.length}</span>
          </h3>

          {feedbackHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No ratings submitted yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {feedbackHistory.map((fb) => (
                <div key={fb._id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 capitalize">
                      {fb.mealSession?.mealType}
                    </span>
                    <span className="text-amber-500 font-bold flex items-center gap-1 text-[11px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {fb.ratings?.overall} / 5
                    </span>
                  </div>

                  {fb.comment && (
                    <p className="text-xs text-slate-600 italic">"{fb.comment}"</p>
                  )}

                  {fb.managerResponse?.text && (
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
                      <span className="font-bold block">Manager Response:</span>
                      {fb.managerResponse.text}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block text-right">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackRating;

