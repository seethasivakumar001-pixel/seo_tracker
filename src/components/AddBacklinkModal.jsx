import React, { useState, useEffect } from 'react';
import { X, Link2, Globe, ShieldCheck, AlertCircle, Sparkles, Check, Calendar } from 'lucide-react';
import { BACKLINK_TYPES, BACKLINK_STATUSES } from '../data/mockBacklinks';
import { isValidHttpUrl, checkDuplicateBacklink } from '../services/backlinkService';
import toast from 'react-hot-toast';

export function AddBacklinkModal({
  isOpen,
  onClose,
  onSave,
  editItem = null,
  currentProjectId = 'site-1',
  defaultSubmittedUrl = ''
}) {
  const isEditing = !!editItem;

  const [formData, setFormData] = useState({
    websiteName: '',
    websiteUrl: '',
    submittedUrl: '',
    status: 'Undone',
    type: 'Directory',
    anchorText: '',
    linkAttribute: 'Dofollow',
    domainRating: '75',
    spamScore: '1',
    dateSubmitted: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [crossProjectWarning, setCrossProjectWarning] = useState(null);

  useEffect(() => {
    if (editItem) {
      setFormData({
        websiteName: editItem.websiteName || '',
        websiteUrl: editItem.websiteUrl || '',
        submittedUrl: editItem.submittedUrl || defaultSubmittedUrl,
        status: editItem.status || 'Undone',
        type: editItem.type || 'Directory',
        anchorText: editItem.anchorText || '',
        linkAttribute: editItem.linkAttribute || 'Dofollow',
        domainRating: String(editItem.domainRating || '75'),
        spamScore: String(editItem.spamScore || '1'),
        dateSubmitted: editItem.dateSubmitted || new Date().toISOString().split('T')[0],
        notes: editItem.notes || ''
      });
    } else {
      setFormData({
        websiteName: '',
        websiteUrl: '',
        submittedUrl: defaultSubmittedUrl,
        status: 'Undone',
        type: 'Directory',
        anchorText: '',
        linkAttribute: 'Dofollow',
        domainRating: '75',
        spamScore: '1',
        dateSubmitted: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setErrors({});
    setCrossProjectWarning(null);
  }, [editItem, isOpen, defaultSubmittedUrl]);

  // Real-time URL parsing for auto-filling name & cross-project duplicate detection
  const handleWebsiteUrlChange = (val) => {
    setFormData((prev) => {
      let autoName = prev.websiteName;
      if (!autoName && val) {
        try {
          const u = new URL(val);
          const raw = u.hostname.replace(/^www\./, '').split('.')[0];
          autoName = raw.charAt(0).toUpperCase() + raw.slice(1);
        } catch {}
      }
      return { ...prev, websiteUrl: val, websiteName: autoName };
    });

    if (isValidHttpUrl(val)) {
      const dup = checkDuplicateBacklink(val, formData.submittedUrl || defaultSubmittedUrl, currentProjectId, editItem?.id);
      if (dup.isDuplicate) {
        setErrors((prev) => ({ ...prev, websiteUrl: 'This backlink is already recorded for this project.' }));
      } else {
        setErrors((prev) => ({ ...prev, websiteUrl: null }));
        if (dup.hasCrossProjectWarning) {
          setCrossProjectWarning(`Notice: This website is also linked in another project (${dup.match.websiteName}).`);
        } else {
          setCrossProjectWarning(null);
        }
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.websiteName.trim()) {
      errs.websiteName = 'Website name is required';
    }

    if (!formData.websiteUrl.trim()) {
      errs.websiteUrl = 'Website URL is required';
    } else if (!isValidHttpUrl(formData.websiteUrl.trim())) {
      errs.websiteUrl = 'Website URL must start with http:// or https://';
    }

    if (!formData.submittedUrl.trim()) {
      errs.submittedUrl = 'Submitted target URL is required';
    } else if (!isValidHttpUrl(formData.submittedUrl.trim())) {
      errs.submittedUrl = 'Submitted URL must start with http:// or https://';
    }

    // Duplicate check
    if (!errs.websiteUrl && !errs.submittedUrl) {
      const dup = checkDuplicateBacklink(formData.websiteUrl, formData.submittedUrl, currentProjectId, editItem?.id);
      if (dup.isDuplicate) {
        errs.websiteUrl = 'This Website URL + Submitted URL already exists in this project.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve the validation errors');
      return;
    }

    onSave({
      ...formData,
      projectId: currentProjectId
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Backlink' : 'Add New Backlink'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track link submissions, verification states, and SEO metrics.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {crossProjectWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{crossProjectWarning}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Website Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Medium, Quora, Crunchbase"
                value={formData.websiteName}
                onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                  errors.websiteName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white`}
              />
              {errors.websiteName && <p className="text-[11px] text-rose-500 mt-1">{errors.websiteName}</p>}
            </div>

            {/* Backlink Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Backlink Category / Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                {BACKLINK_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Website URL (Backlink Source) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://medium.com/@username/article-title"
              value={formData.websiteUrl}
              onChange={(e) => handleWebsiteUrlChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                errors.websiteUrl ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white`}
            />
            {errors.websiteUrl && <p className="text-[11px] text-rose-500 mt-1">{errors.websiteUrl}</p>}
          </div>

          {/* Submitted URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Submitted URL (Target Page on Your Site) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://techsphere.io/blog/my-target-page"
              value={formData.submittedUrl}
              onChange={(e) => setFormData({ ...formData, submittedUrl: e.target.value })}
              className={`w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                errors.submittedUrl ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white`}
            />
            {errors.submittedUrl && <p className="text-[11px] text-rose-500 mt-1">{errors.submittedUrl}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workflow Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                {BACKLINK_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Link Attribute */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link Attribute
              </label>
              <select
                value={formData.linkAttribute}
                onChange={(e) => setFormData({ ...formData, linkAttribute: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="Dofollow" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Dofollow</option>
                <option value="Nofollow" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nofollow</option>
                <option value="UGC" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">UGC</option>
                <option value="Sponsored" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sponsored</option>
              </select>
            </div>

            {/* Submission Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Date Submitted</span>
              </label>
              <input
                type="date"
                value={formData.dateSubmitted}
                onChange={(e) => setFormData({ ...formData, dateSubmitted: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white cursor-pointer font-medium dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Anchor Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anchor Text
              </label>
              <input
                type="text"
                placeholder="e.g. cloud platform"
                value={formData.anchorText}
                onChange={(e) => setFormData({ ...formData, anchorText: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Domain Authority / Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain Rating (DA / DR)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.domainRating}
                onChange={(e) => setFormData({ ...formData, domainRating: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Spam Score */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Spam Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.spamScore}
                onChange={(e) => setFormData({ ...formData, spamScore: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Outreach Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Followed up with editor on Sep 24th; guest article live."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Add Backlink'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
