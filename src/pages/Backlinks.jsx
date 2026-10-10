import React, { useState, useMemo, useEffect } from 'react';
import {
  Link2,
  Globe,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Download,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Filter,
  Check,
  UploadCloud,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Activity,
  ArrowUpDown,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { useSEOStore } from '../store/seoStore';
import { useBacklinkStore } from '../store/backlinkStore';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { AddBacklinkModal } from '../components/AddBacklinkModal';
import { BulkImportBacklinksModal } from '../components/BulkImportBacklinksModal';
import TrashPanel from '../components/TrashPanel';
import UndoToast from '../components/UndoToast';
import {
  exportBacklinksToExcel,
  exportBacklinksToPDF
} from '../services/backlinkService';
import { BACKLINK_TYPES } from '../data/mockBacklinks';
import toast from 'react-hot-toast';

export function Backlinks() {
  const { getSelectedWebsite, selectedWebsiteId, websites, projects, categories, restoreProject, restoreCategory, purgeProject, purgeCategory, emptyTrash } = useSEOStore();
  const currentWebsite = getSelectedWebsite();
  const currentProjectId = currentWebsite?.id || selectedWebsiteId || 'site-1';
  const currentDomain = currentWebsite?.domain || 'example.com';

  const {
    backlinks,
    fetchDbBacklinks,
    addBacklink,
    updateBacklink,
    toggleBacklinkStatus,
    verifyBacklink,
    verifyAllProjectBacklinks,
    softDeleteBacklink,
    restoreBacklink,
    purgeBacklink,
    bulkUpdateStatus,
    bulkDeleteBacklinks,
    bulkImportBacklinks,
    getProjectSummary
  } = useBacklinkStore();

  // Load from DB on mount
  useEffect(() => {
    fetchDbBacklinks();
  }, [fetchDbBacklinks]);

  // Page Views & Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'growth' | 'lost'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Done' | 'Undone'
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState('sno'); // 'sno' | 'name' | 'dr' | 'date' | 'status'
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [undoToast, setUndoToast] = useState(null);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);

  // Clear selections & page on project switch
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [currentProjectId]);

  // Active Backlinks for the CURRENT PROJECT
  const projectActiveBacklinks = useMemo(() => {
    return backlinks.filter((b) => {
      const matchProject =
        b.projectId === currentProjectId ||
        (currentProjectId === 'p1' && b.projectId === 'site-1') ||
        (currentProjectId === 'site-1' && b.projectId === 'p1') ||
        (currentProjectId === 'p2' && b.projectId === 'site-2') ||
        (currentProjectId === 'site-2' && b.projectId === 'p2');
      return matchProject && !b.deletedAt;
    });
  }, [backlinks, currentProjectId]);

  // Trashed Backlinks
  const trashedBacklinks = useMemo(() => {
    return backlinks.filter((b) => b.deletedAt);
  }, [backlinks]);

  // Summary Metrics for Active Project
  const summary = useMemo(() => {
    const total = projectActiveBacklinks.length;
    const done = projectActiveBacklinks.filter((b) => b.status === 'Done').length;
    const undone = total - done;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const liveCount = projectActiveBacklinks.filter((b) => b.verificationStatus === 'Live').length;
    const brokenCount = projectActiveBacklinks.filter((b) => b.verificationStatus === 'Broken').length;
    const pendingCount = projectActiveBacklinks.filter((b) => b.verificationStatus === 'Pending' || !b.verificationStatus).length;

    return { total, done, undone, completionPct, liveCount, brokenCount, pendingCount };
  }, [projectActiveBacklinks]);

  // Distinct Referring Domains Count
  const referringDomainsCount = useMemo(() => {
    const domains = new Set();
    projectActiveBacklinks.forEach((b) => {
      try {
        const url = b.websiteUrl || b.websiteName || '';
        const host = url.replace(/^https?:\/\//i, '').split('/')[0];
        if (host) domains.add(host.toLowerCase());
      } catch (e) {}
    });
    return domains.size || (projectActiveBacklinks.length > 0 ? Math.round(projectActiveBacklinks.length * 0.8) : 320);
  }, [projectActiveBacklinks]);

  // Average Domain Rating
  const avgDomainRating = useMemo(() => {
    if (!projectActiveBacklinks.length) return 72;
    const sum = projectActiveBacklinks.reduce((acc, b) => acc + (Number(b.domainRating) || 50), 0);
    return Math.round(sum / projectActiveBacklinks.length) || 72;
  }, [projectActiveBacklinks]);

  // Filtered & Sorted Backlinks List
  const filteredBacklinks = useMemo(() => {
    let list = [...projectActiveBacklinks];

    // Sub-tab filter
    if (activeTab === 'lost') {
      list = list.filter((b) => b.verificationStatus === 'Broken' || b.verificationStatus === 'Not found');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.websiteName?.toLowerCase().includes(q) ||
          b.websiteUrl?.toLowerCase().includes(q) ||
          b.submittedUrl?.toLowerCase().includes(q) ||
          b.anchorText?.toLowerCase().includes(q) ||
          b.notes?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== 'All') {
      list = list.filter((b) => b.status === statusFilter);
    }

    // Type Filter
    if (typeFilter !== 'All') {
      list = list.filter((b) => b.type === typeFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let valA = a.websiteName?.toLowerCase() || '';
      let valB = b.websiteName?.toLowerCase() || '';

      if (sortField === 'dr') {
        valA = Number(a.domainRating) || 0;
        valB = Number(b.domainRating) || 0;
      } else if (sortField === 'date') {
        valA = a.dateSubmitted || '';
        valB = b.dateSubmitted || '';
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [projectActiveBacklinks, activeTab, searchQuery, statusFilter, typeFilter, sortField, sortAsc]);

  // Pagination Slice
  const totalItems = filteredBacklinks.length;
  const paginatedBacklinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBacklinks.slice(start, start + pageSize);
  }, [filteredBacklinks, currentPage, pageSize]);

  // Checkbox Selection
  const allCurrentSelected =
    paginatedBacklinks.length > 0 && paginatedBacklinks.every((b) => selectedIds.includes(b.id));

  const handleSelectAllCurrent = (e) => {
    if (e.target.checked) {
      const idsToAdd = paginatedBacklinks.map((b) => b.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    } else {
      const idsToRemove = paginatedBacklinks.map((b) => b.id);
      setSelectedIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
    }
  };

  const handleToggleRowSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Status Badge Toggle Handler
  const handleToggleStatus = (id) => {
    const newStatus = toggleBacklinkStatus(id);
    toast.success(`Status updated to ${newStatus}`);
  };

  // Single Delete with Undo
  const handleDeleteBacklink = (b) => {
    softDeleteBacklink(b.id);
    setUndoToast({
      message: `Backlink for "${b.websiteName}" moved to Trash.`,
      undoAction: () => restoreBacklink(b.id),
      duration: 6000
    });
  };

  // Single Verify
  const handleVerifyLink = (id) => {
    const res = verifyBacklink(id);
    if (res?.verificationStatus === 'Live') {
      toast.success('Link verification verified: Status Live');
    } else if (res?.verificationStatus === 'Broken') {
      toast.error('Link verification failed: Broken / 404');
    } else {
      toast.warn('Link verification: Not found on page');
    }
  };

  // Verify All
  const handleVerifyAll = () => {
    setIsVerifyingAll(true);
    setTimeout(() => {
      verifyAllProjectBacklinks(currentProjectId);
      setIsVerifyingAll(false);
      toast.success(`Verified ${projectActiveBacklinks.length} backlinks for ${currentDomain}`);
    }, 800);
  };

  // Bulk Actions
  const handleBulkMarkDone = () => {
    bulkUpdateStatus(selectedIds, 'Done');
    toast.success(`Marked ${selectedIds.length} backlinks as Done`);
    setSelectedIds([]);
  };

  const handleBulkMarkUndone = () => {
    bulkUpdateStatus(selectedIds, 'Undone');
    toast.success(`Marked ${selectedIds.length} backlinks as Undone`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    bulkDeleteBacklinks(selectedIds);
    setUndoToast({
      message: `Moved ${count} backlinks to Trash.`,
      undoAction: () => selectedIds.forEach((id) => restoreBacklink(id)),
      duration: 6000
    });
    setSelectedIds([]);
  };

  // Mock 6-Month Trend Data
  const trendData = [
    { month: 'May', newLinks: 4, lostLinks: 1, total: 6 },
    { month: 'Jun', newLinks: 5, lostLinks: 0, total: 11 },
    { month: 'Jul', newLinks: 6, lostLinks: 1, total: 16 },
    { month: 'Aug', newLinks: 7, lostLinks: 2, total: 21 },
    { month: 'Sep', newLinks: 8, lostLinks: 1, total: 28 },
    { month: 'Oct', newLinks: summary.total, lostLinks: summary.brokenCount, total: summary.total }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ═══ TOP HERO BANNER (CLEAN 2-COLUMN) ═══ */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-b from-[#0e1326] via-[#0b1021] to-[#080c1a] border border-[#1e274a] shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Background ambient glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          {/* LEFT ZONE: Title, Subtitle & 3 Mini Metric Cards */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Main Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Backlinks <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">Intelligence & Outreach</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Track and analyze backlinks, verify link health, monitor domain ratings, and manage outreach campaigns.
            </p>

            {/* 3 Mini Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-3xl">
              {/* Card 1: Total Backlinks */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Backlinks
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {summary.total > 0 ? summary.total.toLocaleString() : '1,248'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      ↑ +12%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Referring Domains */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Referring Domains
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {referringDomainsCount > 0 ? referringDomainsCount.toLocaleString() : '320'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      ↑ +8%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Domain Rating */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30 flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Domain Rating
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {avgDomainRating || 72}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      ↑ +5%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ZONE: Action Sidebar Stack */}
          <div className="w-full lg:w-64 flex flex-col gap-2.5 justify-center flex-shrink-0">
            {/* 1. Primary Add Backlink Button */}
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(59,130,246,0.45)] hover:shadow-[0_0_30px_rgba(59,130,246,0.65)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Backlink</span>
            </button>

            {/* 2. Verify Links Button */}
            <button
              type="button"
              disabled={isVerifyingAll || projectActiveBacklinks.length === 0}
              onClick={handleVerifyAll}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-40"
              title="Scan and test live status for all backlinks"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isVerifyingAll ? 'animate-spin' : ''}`} />
              <span>Verify Links</span>
            </button>

            {/* 3. Bulk Import Button */}
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Bulk Import</span>
            </button>

            {/* 4. Export Buttons Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportBacklinksToExcel(filteredBacklinks, currentDomain)}
                className="py-2.5 px-3 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={() => exportBacklinksToPDF(filteredBacklinks, currentDomain)}
                className="py-2.5 px-3 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Export PDF Report"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SUMMARY STATS CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Backlinks Card */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Total Backlinks
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {summary.total}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {summary.liveCount} Live
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {summary.brokenCount} Broken
            </span>
          </div>
        </div>

        {/* Done Backlinks Card */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Completed (Done)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            {summary.done}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Active & approved outreach links</span>
          </p>
        </div>

        {/* Undone Backlinks Card */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Pending (Undone)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">
            {summary.undone}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5">
            Requires submission or outreach follow-up
          </p>
        </div>

        {/* Completion Progress Bar Card */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Outreach Completion
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {summary.completionPct}%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
            {summary.done} <span className="text-lg font-medium text-slate-400">/ {summary.total}</span>
          </div>
          {/* Glowing Animated Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden p-0.5 border border-slate-200/40 dark:border-slate-700/40">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${summary.completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ═══ VIEW TABS (All Backlinks vs Growth Velocity vs Lost Links) ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
          {/* Tab 1: All Backlinks */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Backlinks</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'all'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {projectActiveBacklinks.length}
            </span>
          </button>

          {/* Tab 2: Growth Velocity */}
          <button
            type="button"
            onClick={() => setActiveTab('growth')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'growth'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Growth & Velocity</span>
          </button>

          {/* Tab 3: Broken & Lost */}
          <button
            type="button"
            onClick={() => setActiveTab('lost')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'lost'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Broken & Lost</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'lost'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-rose-500/10 text-rose-500'
            }`}>
              {projectActiveBacklinks.filter((b) => b.verificationStatus === 'Broken' || b.verificationStatus === 'Not found').length}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ TAB 2: GROWTH VELOCITY CHART ═══ */}
      {activeTab === 'growth' && (
        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle>6-Month Backlink Acquisition & Velocity</CardTitle>
            <CardDescription>
              Monthly new backlinks acquired vs links lost for {currentDomain}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 12
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="newLinks" name="New Acquired Links" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lostLinks" name="Lost / Broken Links" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB 1 & 3: BACKLINKS DATA TABLE & TOOLBAR ═══ */}
      {activeTab !== 'growth' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 flex-wrap">
            {/* Search Input */}
            <div className="w-full lg:w-96 relative">
              <input
                type="text"
                placeholder="Search website, target URL, anchor text, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-[10px] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-400 font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
                  <option value="Done" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Done Only</option>
                  <option value="Undone" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Undone Only</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs shadow-2xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-400 font-semibold">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Types</option>
                  {BACKLINK_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-400 font-semibold">Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="sno" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Default S.No</option>
                  <option value="name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Website Name</option>
                  <option value="dr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Domain Rating (DR)</option>
                  <option value="date" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Date Submitted</option>
                  <option value="status" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Status</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortAsc(!sortAsc)}
                  className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500/20 cursor-pointer transition-colors text-[10px]"
                >
                  {sortAsc ? '▲ ASC' : '▼ DESC'}
                </button>
              </div>
            </div>
          </div>

          {/* ═══ BULK ACTIONS BAR (Appears when items are checked) ═══ */}
          {selectedIds.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 dark:text-white">
                <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {selectedIds.length}
                </span>
                <span>{selectedIds.length} {selectedIds.length === 1 ? 'backlink' : 'backlinks'} selected</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Deselect all
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkMarkDone}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkMarkUndone}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Mark Undone</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══ MAIN BACKLINKS TABLE ═══ */}
          <div className="tablewrap rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/40">
                  <th className="py-3.5 px-3 text-center" style={{ width: 42 }}>
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={handleSelectAllCurrent}
                      className="cursor-pointer rounded accent-indigo-600 w-4 h-4"
                      aria-label="Select all rows"
                    />
                  </th>
                  <th className="py-3.5 px-3 text-center" style={{ width: 50 }}>S.No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Website Name & Info</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Website URL (Source)</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Submitted URL (Target Page)</th>
                  <th className="py-3.5 px-3 text-center" style={{ width: 110 }}>Status</th>
                  <th className="py-3.5 px-3 text-center" style={{ width: 140 }}>Live Verification</th>
                  <th className="py-3.5 px-4 text-right" style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {paginatedBacklinks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
                          <Link2 className="w-7 h-7 opacity-80" />
                        </div>
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                          No backlinks recorded for this project
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Add target outreach websites or bulk import URLs to monitor backlink authority, crawler status, and submission progress.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Add Your First Backlink</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBacklinks.map((b, idx) => {
                    const isSelected = selectedIds.includes(b.id);
                    const serialNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={b.id}
                        className={`transition-colors duration-150 ${
                          isSelected
                            ? 'bg-indigo-500/10 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(b.id)}
                            className="cursor-pointer rounded accent-indigo-600 w-4 h-4"
                          />
                        </td>

                        {/* S.No */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                          {serialNumber}
                        </td>

                        {/* Website Name & Tag Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{b.websiteName}</span>
                            {b.domainRating && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black border border-slate-200/60 dark:border-slate-700/60">
                                DR {b.domainRating}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {b.type || 'Directory'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              {b.linkAttribute || 'Dofollow'}
                            </span>
                            {b.anchorText && (
                              <span className="text-[10px] text-slate-400 italic truncate max-w-[150px] bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded" title={b.anchorText}>
                                "{b.anchorText}"
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Website URL (Clickable external link) */}
                        <td className="py-3.5 px-4">
                          <a
                            href={b.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 truncate max-w-xs group font-semibold"
                            title={b.websiteUrl}
                          >
                            <span className="truncate">{b.websiteUrl}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </a>
                          {b.dateSubmitted && (
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Submitted: {b.dateSubmitted}
                            </span>
                          )}
                        </td>

                        {/* Submitted URL (Clickable page on my site) */}
                        <td className="py-3.5 px-4">
                          <a
                            href={b.submittedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-500 inline-flex items-center gap-1.5 truncate max-w-xs group font-semibold"
                            title={b.submittedUrl}
                          >
                            <span className="truncate">{b.submittedUrl}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </a>
                          {b.notes && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs mt-1" title={b.notes}>
                              💬 {b.notes}
                            </p>
                          )}
                        </td>

                        {/* Status (Clickable Badge to Flip Done/Undone) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(b.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                              b.status === 'Done'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                            title="Click to toggle Done/Undone"
                          >
                            {b.status === 'Done' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Undone</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Live Verification Status & Check Button */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                b.verificationStatus === 'Live'
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : b.verificationStatus === 'Broken'
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                b.verificationStatus === 'Live'
                                  ? 'bg-emerald-500'
                                  : b.verificationStatus === 'Broken'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`} />
                              {b.verificationStatus || 'Pending'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVerifyLink(b.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Test live verification"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                          {b.lastChecked && (
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {b.lastChecked}
                            </span>
                          )}
                        </td>

                        {/* Actions (Edit, Delete) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(b);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                              title="Edit Backlink"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBacklink(b)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ PAGINATION ═══ */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> backlinks
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalItems / pageSize)}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {isAddModalOpen && (
        <AddBacklinkModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          editItem={editingItem}
          currentProjectId={currentProjectId}
          defaultSubmittedUrl={`https://${currentDomain}`}
          onSave={(data) => {
            if (editingItem) {
              updateBacklink(editingItem.id, data);
              toast.success(`Updated backlink for ${data.websiteName}`);
            } else {
              addBacklink(data);
              toast.success(`Added backlink for ${data.websiteName}`);
            }
          }}
        />
      )}

      {/* ═══ BULK IMPORT MODAL ═══ */}
      {isBulkModalOpen && (
        <BulkImportBacklinksModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          currentProjectId={currentProjectId}
          currentProjectDomain={currentDomain}
          projectName={currentWebsite?.name || currentWebsite?.projectName || currentDomain}
          defaultSubmittedUrl={`https://${currentDomain}`}
          onImport={(items) => {
            bulkImportBacklinks(items);
          }}
        />
      )}

      {/* ═══ TRASH RECOVERY DRAWER ═══ */}
      {showTrash && (
        <TrashPanel
          isOpen={showTrash}
          onClose={() => setShowTrash(false)}
          trashedProjects={projects.filter((p) => p.deletedAt)}
          trashedCategories={categories.filter((c) => c.deletedAt)}
          trashedKeywords={useSEOStore.getState().keywords.filter((k) => k.deletedAt)}
          trashedBacklinks={trashedBacklinks}
          allProjects={projects}
          allCategories={categories}
          onRestoreProject={(p) => {
            restoreProject(p);
            toast.success("Project restored from Trash");
          }}
          onRestoreCategory={(c) => {
            restoreCategory(c);
            toast.success("Category restored from Trash");
          }}
          onRestoreKeyword={(k) => {
            useSEOStore.getState().restoreKeyword(k);
            toast.success("Keyword restored from Trash");
          }}
          onRestoreBacklink={(b) => {
            restoreBacklink(b);
            toast.success("Backlink restored from Trash");
          }}
          onPurgeProject={(p) => {
            purgeProject(p);
            toast.success("Project permanently deleted");
          }}
          onPurgeCategory={(c) => {
            purgeCategory(c);
            toast.success("Category permanently deleted");
          }}
          onPurgeKeyword={(k) => {
            useSEOStore.getState().purgeKeyword(k);
            toast.success("Keyword permanently deleted");
          }}
          onPurgeBacklink={(b) => {
            purgeBacklink(b);
            toast.success("Backlink permanently deleted");
          }}
          onBulkRestore={(type, ids) => {
            if (type === 'backlinks') ids.forEach((id) => restoreBacklink(id));
            else if (type === 'keywords') ids.forEach((id) => useSEOStore.getState().restoreKeyword(id));
            else if (type === 'categories') ids.forEach((id) => restoreCategory(id));
            else ids.forEach((id) => restoreProject(id));
            toast.success(`Restored ${ids.length} items from Trash`);
          }}
          onBulkPurge={(type, ids) => {
            if (type === 'backlinks') ids.forEach((id) => purgeBacklink(id));
            else if (type === 'keywords') ids.forEach((id) => useSEOStore.getState().purgeKeyword(id));
            else if (type === 'categories') ids.forEach((id) => purgeCategory(id));
            else ids.forEach((id) => purgeProject(id));
            toast.success(`Permanently deleted ${ids.length} items`);
          }}
          onEmptyTrash={() => {
            emptyTrash();
            toast.success('Trash emptied completely');
          }}
        />
      )}

      {/* ═══ UNDO TOAST ═══ */}
      {undoToast && (
        <UndoToast
          toast={undoToast}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </div>
  );
}

export default Backlinks;
