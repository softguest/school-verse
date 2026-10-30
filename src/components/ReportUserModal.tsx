import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.ts';

interface ReportUserModalProps {
  reportedStudentId: string;
  reportedStudentName: string;
  messageId?: string;
  onClose: () => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  reportedStudentId,
  reportedStudentName,
  messageId,
  onClose,
}) => {
  const [reason, setReason] = useState('Inappropriate Language');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    'Inappropriate Language or Bullying',
    'Personal Contact Information Sharing (Phone/Email)',
    'Harassment or Unsolicited Spam',
    'Impersonation or False Academic Identity',
    'Academic Dishonesty or Mission Leak',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.reportStudent(reportedStudentId, `${reason}: ${details}`, messageId);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-2 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-base font-bold text-white">Report Student Behavior</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Report Logged for Review</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thank you for helping keep SchoolVerse a safe and supportive learning atmosphere for all students. Our safety team will review this interaction immediately.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300"
              >
                Return to Campus
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                You are reporting an interaction involving{' '}
                <span className="font-semibold text-white">{reportedStudentName}</span>.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Violation Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Additional Context (Optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Describe what occurred..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
