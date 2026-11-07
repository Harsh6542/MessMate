import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { AlertCircle, ShieldCheck, ArrowLeft, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'food_quality', label: 'Food Quality (Taste / Bad Smell)' },
  { value: 'hygiene', label: 'Kitchen & Dining Cleanliness / Hygiene' },
  { value: 'quantity', label: 'Insufficient Food Quantity / Shortage' },
  { value: 'undercooked_stale', label: 'Undercooked or Stale Food' },
  { value: 'staff_behaviour', label: 'Mess Staff Conduct or Behaviour' },
  { value: 'long_queues', label: 'Excessive Dining Counter Queues' },
  { value: 'drinking_water', label: 'Water Cooler / Drinking Water Issues' },
  { value: 'infrastructure', label: 'Dining Tables / Seating / Lights' },
  { value: 'other', label: 'Other Operational Issue' }
];

export const NewComplaint = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      category: 'food_quality',
      priority: 'medium',
      subject: '',
      description: '',
      imageUrl: '',
      isConfidential: false
    }
  });

  const isConfidential = watch('isConfidential');

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        images: data.imageUrl ? [data.imageUrl.trim()] : []
      };

      const res = await api.post('/complaints', payload);
      if (res.success) {
        toast.success(res.message || 'Grievance lodged successfully!');
        navigate('/student/complaints');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/student/complaints"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Complaints
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lodge a Mess Grievance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complaints are assigned resolution deadlines (SLAs) and tracked by mess authorities and administration.
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complaint Category
            </label>
            <select
              {...register('category', { required: true })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Urgency / Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'low', label: 'Low', desc: '48h SLA' },
                { val: 'medium', label: 'Medium', desc: '48h SLA' },
                { val: 'high', label: 'High', desc: '24h SLA' },
                { val: 'critical', label: 'Critical', desc: '12h Food Safety' }
              ].map((p) => (
                <label
                  key={p.val}
                  className="p-2 border border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer text-center hover:bg-slate-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50"
                >
                  <input
                    type="radio"
                    value={p.val}
                    {...register('priority')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-slate-800 capitalize">{p.label}</span>
                  <span className="text-[10px] text-slate-400">{p.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              {...register('subject', { required: 'Subject is required' })}
              placeholder="e.g. Undercooked rice served in today's lunch"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {errors.subject && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              {...register('description', { required: 'Description is required' })}
              placeholder="Describe the issue in detail, including specific counter or time..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Image / Photo Proof URL <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              placeholder="https://images.example.com/proof.jpg"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Confidentiality Toggle Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="isConfidential"
              {...register('isConfidential')}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <label htmlFor="isConfidential" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Submit as Confidential Grievance
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Your name and roll number will be completely hidden from mess staff and contractors.
                Only authorized hostel administration will have access to your identity for verification.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Grievance Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;

