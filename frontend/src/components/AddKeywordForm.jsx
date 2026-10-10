import React from 'react';
import {
  History,
  AlertCircle,
  PlusCircle,
  Search,
  MapPin,
  Loader2,
  Info
} from 'lucide-react';
import { useKeywordForm } from '../hooks/useKeywordForm';

const PAST_MONTHS = [
  { key: '2026-05', label: 'May \'26' },
  { key: '2026-06', label: 'Jun \'26' },
  { key: '2026-07', label: 'Jul \'26' },
  { key: '2026-08', label: 'Aug \'26' },
  { key: '2026-09', label: 'Sep \'26' },
];

const SEARCH_ENGINES = ['Google', 'Bing', 'Yahoo', 'DuckDuckGo'];
const LOCATIONS = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Canada',
  'Australia',
  'India',
  'Japan',
  'Global'
];

export function AddKeywordForm({ onSuccess, onCancel, onAddAnother, isModal = false }) {
  const {
    form,
    isSubmitting,
    isValid,
    errors,
    watchedNotRanking,
    watchedPosition,
    watchedBackfill,
    onSubmit,
    onAddAnotherSubmit,
  } = useKeywordForm({ onSuccess, onAddAnother });

  const { register } = form;

  return (
    <form className="space-y-6" noValidate>
      {/* 2-COLUMN FORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* FIELD 1: Keyword Query */}
        <div className="md:col-span-2">
          <label htmlFor="kw-query" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Keyword Query <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="kw-query"
              type="text"
              {...register('keyword')}
              placeholder="e.g. distributed sql query engine"
              aria-invalid={!!errors.keyword}
              aria-describedby={errors.keyword ? 'kw-query-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border ${
                errors.keyword
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
              } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
            />
          </div>
          {errors.keyword && (
            <p id="kw-query-error" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.keyword.message}</span>
            </p>
          )}
        </div>

        {/* FIELD 2: Target Landing Page URL */}
        <div className="md:col-span-2">
          <label htmlFor="kw-targetUrl" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Target Landing Page URL <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="kw-targetUrl"
              type="url"
              {...register('targetUrl')}
              placeholder="https://example.com/page"
              aria-invalid={!!errors.targetUrl}
              aria-describedby={errors.targetUrl ? 'kw-targetUrl-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border ${
                errors.targetUrl
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
              } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
            />
          </div>
          {errors.targetUrl && (
            <p id="kw-targetUrl-error" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.targetUrl.message}</span>
            </p>
          )}
        </div>

        {/* FIELD 3: Current Position / Rank */}
        <div>
          <label htmlFor="kw-position" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Current Position / Rank (1–100) {!watchedNotRanking && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <input
              id="kw-position"
              type="number"
              min="1"
              max="100"
              disabled={watchedNotRanking}
              {...register('position')}
              placeholder="e.g. 3"
              aria-invalid={!!errors.position}
              aria-describedby={errors.position ? 'kw-position-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800/80 border ${
                watchedNotRanking
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-400'
                  : errors.position
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
              } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              #Rank
            </span>
          </div>
          {errors.position && !watchedNotRanking && (
            <p id="kw-position-error" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.position.message}</span>
            </p>
          )}

          {/* Not ranking yet checkbox */}
          <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('notRanking')}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/30"
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Not ranking yet (outside top 100)
            </span>
          </label>
        </div>

        {/* FIELD 4: Monthly Search Volume */}
        <div>
          <label htmlFor="kw-volume" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Monthly Search Volume <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="kw-volume"
              type="number"
              min="0"
              step="50"
              {...register('volume')}
              placeholder="e.g. 5400"
              aria-invalid={!!errors.volume}
              aria-describedby={errors.volume ? 'kw-volume-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border ${
                errors.volume
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500'
              } rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 transition-all`}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              vol/mo
            </span>
          </div>
          {errors.volume && (
            <p id="kw-volume-error" className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.volume.message}</span>
            </p>
          )}
        </div>

        {/* FIELD 5: Search Engine */}
        <div>
          <label htmlFor="kw-engine" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Engine</span>
          </label>
          <select
            id="kw-engine"
            {...register('searchEngine')}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            {SEARCH_ENGINES.map((se) => (
              <option key={se} value={se}>{se}</option>
            ))}
          </select>
        </div>

        {/* FIELD 6: Location */}
        <div>
          <label htmlFor="kw-location" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Location / Country</span>
          </label>
          <select
            id="kw-location"
            {...register('location')}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTHLY POSITION HISTORY SECTION */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-750">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#0062ff]" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Monthly Position History (6-Month Horizon)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Current month reflects today's rank. Previous months start empty for new keywords.
            </p>
          </div>

          {/* Backfill History Toggle */}
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <input
              type="checkbox"
              {...register('backfillHistory')}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#0062ff] focus:ring-[#0062ff]/30"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              I already have past rankings <span className="text-[10px] text-slate-400 font-normal">(backfill)</span>
            </span>
          </label>
        </div>

        {/* 6-Month Inputs Grid */}
        <div>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {/* Previous 5 Months */}
            {PAST_MONTHS.map((m) => (
              <div key={m.key} className="text-center">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {m.label}
                </span>
                {watchedBackfill ? (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    {...register(`monthlyPositions.${m.key}`)}
                    placeholder="—"
                    aria-label={`Ranking for ${m.label}`}
                    className="w-full text-center px-1.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0062ff] shadow-2xs"
                  />
                ) : (
                  <div
                    className="w-full py-1.5 text-center text-xs font-bold text-slate-300 dark:text-slate-600 bg-slate-100/70 dark:bg-slate-850 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed select-none"
                    title="No data yet. Tracking starts today."
                  >
                    –
                  </div>
                )}
                {errors?.monthlyPositions?.[m.key] && (
                  <span className="text-[9px] text-rose-500 block mt-0.5">1–100</span>
                )}
              </div>
            ))}

            {/* Current Month (October 2026) - Read-only live mirror */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[10px] font-bold text-[#0062ff] dark:text-[#38bdf8]">
                  Oct '26
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Current Month" />
              </div>
              <div className="relative">
                <div
                  className="w-full py-1.5 text-center text-xs font-black text-[#0062ff] dark:text-[#38bdf8] bg-blue-50/80 dark:bg-[#0062ff]/15 rounded-xl border border-blue-200 dark:border-[#0062ff]/40 shadow-2xs select-none"
                  title="Automatically synchronized with Current Position"
                >
                  {watchedNotRanking ? '–' : watchedPosition ? `#${watchedPosition}` : '–'}
                </div>
                <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Explanatory Helper / Hint */}
          <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>
              {!watchedBackfill
                ? "Previous months have no data yet because tracking starts today. You can import historical data anytime via CSV or Google Search Console."
                : "Enter verified rankings for any past months. Empty boxes will remain as 'no data' (–)."}
            </p>
          </div>
        </div>
      </div>

      {/* FORM ACTION BUTTONS */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={onAddAnotherSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlusCircle className="w-3.5 h-3.5" />
          )}
          <span>Add & Add Another</span>
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-sm hover:shadow-[#0062ff]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Adding Keyword...</span>
            </>
          ) : (
            <span>Add Keyword</span>
          )}
        </button>
      </div>
    </form>
  );
}
