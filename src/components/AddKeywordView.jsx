import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  History,
  Info,
  Plus,
  Sparkles,
  Layers,
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';
import { monthKeys, monthLabel } from '../data/keywordData';
import toast from 'react-hot-toast';

export default function AddKeywordView({
  onBack,
  onAdd,
  defaultDomain = 'example.com',
  availableCategories = ['ipl', 'casino', 'Core Features', 'Automation', 'Competitors', 'Rankings', 'my99exch']
}) {
  const months = useMemo(() => monthKeys(6), []);
  const currentMonthKey = months.at(-1);

  const defaultCategoriesList = useMemo(() => {
    const combined = [...new Set([...availableCategories, 'ipl', 'casino', 'Core Features', 'Automation', 'Competitors', 'Rankings', 'my99exch'])].filter(Boolean);
    return combined.length > 0 ? combined : ['Automation', 'Core Features', 'Rankings'];
  }, [availableCategories]);

  const [form, setForm] = useState({
    keyword: '',
    url: '',
    position: '3',
    volume: '1400',
    difficulty: '35',
    group: defaultCategoriesList[0] || 'Automation',
    notRanking: false,
    hasPastRankings: false
  });

  const [pastMonthsData, setPastMonthsData] = useState(() => {
    return Object.fromEntries(months.map((m) => [m, '']));
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const activeCategory = isCustomCategory ? customCategory : form.group;

  const handleMonthChange = (monthKey, val) => {
    setPastMonthsData((prev) => ({
      ...prev,
      [monthKey]: val
    }));
  };

  const handleCategorySelect = (cat) => {
    setIsCustomCategory(false);
    setForm((prev) => ({ ...prev, group: cat }));
  };

  const handleSubmit = (e, keepOpen = false) => {
    if (e) e.preventDefault();
    if (!form.keyword.trim()) {
      toast.error('Please enter a keyword query');
      return;
    }

    const pos = form.notRanking ? 101 : Math.min(100, Math.max(1, parseInt(form.position, 10) || 50));
    const vol = Math.max(0, parseInt(form.volume, 10) || 1400);
    const diff = Math.min(100, Math.max(1, parseInt(form.difficulty, 10) || 35));
    const finalGroup = isCustomCategory ? (customCategory.trim() || 'General') : (form.group || 'Automation');

    // Build 30-day sparkline history
    const history = Array(30).fill(pos);

    // Build monthly variance data
    const monthly = {};
    months.forEach((m) => {
      if (m === currentMonthKey) {
        monthly[m] = pos;
      } else if (form.hasPastRankings && pastMonthsData[m]) {
        monthly[m] = Number(pastMonthsData[m]);
      } else {
        monthly[m] = null;
      }
    });

    const newKeyword = {
      id: `kw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      keyword: form.keyword.trim(),
      group: finalGroup,
      url: form.url.trim() || `https://${defaultDomain}/`,
      position: pos,
      volume: vol,
      difficulty: diff,
      history,
      monthly,
      change: 0,
      deletedAt: null
    };

    onAdd(newKeyword);

    if (keepOpen) {
      setForm((prev) => ({
        ...prev,
        keyword: '',
        url: '',
        position: '3',
        volume: '1400',
        notRanking: false
      }));
      setPastMonthsData(Object.fromEntries(months.map((m) => [m, ''])));
      toast.success(`Saved "${newKeyword.keyword}"! Ready for next keyword.`);
    } else {
      onBack();
    }
  };

  const domainInitial = defaultDomain.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 mb-2 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Keyword Intelligence</span>
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Add New Keyword
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track a target query and monitor its SERP rankings in real-time.
          </p>
        </div>

        {/* Active Project Badge (Image 2 Top Right) */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-600/30">
            {domainInitial}
          </div>
          <div className="text-left pr-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {defaultDomain}
            </p>
            <p className="text-[10px] font-medium text-slate-400">
              Active Project
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card: Keyword Configuration */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl shadow-black/5">
          {/* Card Title & Description */}
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Keyword Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure query parameters, target landing URL, category, and initial position.
            </p>
          </div>

          <div className="space-y-5">
            {/* Field 1: Keyword Query */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Keyword Query <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. distributed sql query engine"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Field 2: Category / Group with Quick Select Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Category / Group <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Select from {defaultCategoriesList.length} existing or type new
                </span>
              </div>

              {isCustomCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type new category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
                  >
                    Select Existing
                  </button>
                </div>
              ) : (
                <select
                  value={form.group}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCustomCategory(true);
                      setCustomCategory('');
                    } else {
                      setForm({ ...form, group: e.target.value });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {defaultCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__">+ Type a new category...</option>
                </select>
              )}

              {/* Quick Select Pills (Image 2) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Quick Select:
                </span>
                {defaultCategoriesList.map((cat) => {
                  const isSelected = !isCustomCategory && form.group === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Target Landing Page URL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Target Landing Page URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder={`https://${defaultDomain}/`}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Row 4: Current Position & Search Volume (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Position / Rank */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Current Position / Rank (1-100) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={form.notRanking}
                    placeholder="3"
                    value={form.notRanking ? '' : form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full pl-3.5 pr-14 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-[11px] font-semibold">
                    #Rank
                  </div>
                </div>
              </div>

              {/* Monthly Search Volume */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Monthly Search Volume <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="1400"
                    value={form.volume}
                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                    className="w-full pl-3.5 pr-14 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-[11px] font-semibold">
                    vol/mo
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox: Not ranking yet */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="not-ranking-checkbox"
                type="checkbox"
                checked={form.notRanking}
                onChange={(e) => setForm({ ...form, notRanking: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer"
              />
              <label
                htmlFor="not-ranking-checkbox"
                className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Not ranking yet (outside top 100)
              </label>
            </div>

            {/* Section 5: Monthly Position History (6-Month Horizon) */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>Monthly Position History (6-Month Horizon)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Current month reflects today's rank. Previous months start empty for new keywords.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={form.hasPastRankings}
                    onChange={(e) => setForm({ ...form, hasPastRankings: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    I already have past rankings (backfill)
                  </span>
                </label>
              </div>

              {/* 6 Month Grid Cards */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {months.map((mKey, idx) => {
                  const isCurrent = mKey === currentMonthKey;
                  const label = monthLabel(mKey);

                  return (
                    <div
                      key={mKey}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center gap-1 ${
                        isCurrent
                          ? 'bg-indigo-950/20 border-indigo-500/40 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 w-full">
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          {label}
                        </span>
                        {isCurrent && (
                          <span className="px-1 py-0.2 text-[9px] font-extrabold bg-emerald-500 text-slate-950 rounded uppercase tracking-wider leading-none">
                            LIVE
                          </span>
                        )}
                      </div>

                      {isCurrent ? (
                        <div className="text-base sm:text-lg font-bold text-indigo-400">
                          {form.notRanking ? '>100' : `#${form.position || '3'}`}
                        </div>
                      ) : form.hasPastRankings ? (
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="–"
                          value={pastMonthsData[mKey]}
                          onChange={(e) => handleMonthChange(mKey, e.target.value)}
                          className="w-full px-1 py-1 text-xs text-center font-bold bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <div className="text-base sm:text-lg font-bold text-slate-400 dark:text-slate-600">
                          –
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Info Notice Banner */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p>
                  Previous months have no data yet because tracking starts today. You can import historical data anytime via CSV or Google Search Console.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Image 2) */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add & Add Another</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Add Keyword
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
