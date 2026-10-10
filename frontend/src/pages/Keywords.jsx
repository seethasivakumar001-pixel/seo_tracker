import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Plus,
  PlusCircle,
  Trash2,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  Search,
  Check,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  UploadCloud,
  Upload,
  LogIn,
  LogOut,
  Calendar,
  Activity,
  Flame,
  Trophy,
  Target,
  BarChart3,
  SlidersHorizontal,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSEOStore } from '../store/seoStore';
import { Sparkline } from '../components/Sparkline';
import TrashPanel from '../components/TrashPanel';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import UndoToast from '../components/UndoToast';
import AuthModal from '../components/AuthModal';
import AddKeywordView from '../components/AddKeywordView';
import {
  getDifficultyInfo,
  formatPosition,
  formatVolume,
  monthKeys,
  monthLabel,
  makeHistory
} from '../data/keywordData';
import toast from 'react-hot-toast';

export function Keywords() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    keywords,
    categories,
    projects,
    websites,
    selectedWebsiteId,
    activeProjectId,
    setActiveProjectId,
    getSelectedWebsite,
    dbStatus,
    currentUser,
    setUser,
    logout,
    loadDbData,
    addKeyword,
    updateKeyword,
    updateMonthlyPosition,
    softDeleteKeyword,
    restoreKeyword,
    purgeKeyword,
    softDeleteCategory,
    restoreCategory,
    purgeCategory,
    softDeleteProject,
    restoreProject,
    purgeProject,
    emptyTrash,
    bulkAddKeywords
  } = useSEOStore();

  const currentWebsite = getSelectedWebsite();
  const currentProjectDomain = currentWebsite?.domain || currentWebsite?.projectName || 'techsphere.io';

  // Tabs: 'daily' | 'monthly'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'monthly' ? 'monthly' : 'daily');

  // Daily Trend Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [difficultyFilter, setDifficultyFilter] = useState('All'); // 'All' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
  const [rankFilter, setRankFilter] = useState('All'); // 'All' | 'Top 10' | 'Top 20' | 'Top 30' | 'Top 40' | 'Top 50'

  // Monthly Comparison State
  const months = useMemo(() => monthKeys(6), []);
  const [fromMonth, setFromMonth] = useState(months[0]);
  const [toMonth, setToMonth] = useState(months.at(-1));

  // Inline Editable Cell for Monthly Rankings
  const [editingCell, setEditingCell] = useState(null); // { kwId: string, month: string, value: string }
  // Inline Editable Cell for Daily Trend Position
  const [editingDailyId, setEditingDailyId] = useState(null); // { kwId: string, value: string }

  // Modals & Drawers
  const [showTrash, setShowTrash] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddView, setShowAddView] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewingKeyword, setViewingKeyword] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [undoToast, setUndoToast] = useState(null);

  // Quick Modal Form State
  const [quickForm, setQuickForm] = useState({
    keyword: '',
    url: '',
    position: '3',
    volume: '2400',
    difficulty: '35',
    group: 'Automation'
  });

  // Edit Modal Form State
  const [editForm, setEditForm] = useState(null);

  // Import Modal State (Image 2)
  const [importTab, setImportTab] = useState('file'); // 'file' | 'text'
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [fileKeywords, setFileKeywords] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadDbData();
  }, []);

  // Handle URL query modal triggers (e.g. /keywords?modal=add)
  useEffect(() => {
    if (searchParams.get('modal') === 'add') {
      setShowAddView(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('modal');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Active Project & Domain resolution
  const activeKeywords = useMemo(() => {
    const currentWeb = getSelectedWebsite();
    const currentId = selectedWebsiteId || currentWeb?.id;
    const currentDom = currentWeb?.domain ? currentWeb.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';

    return keywords.filter((k) => {
      if (k.deletedAt) return false;
      if (!currentId) return true;
      const kwSiteId = k.websiteId || k.projectId;
      if (kwSiteId === currentId) return true;
      if (currentId === 'site-1' && (k.projectId === 'p1' || k.websiteId === 'site-1')) return true;
      if (currentId === 'site-2' && (k.projectId === 'p2' || k.websiteId === 'site-2')) return true;
      if (currentDom && ((k.url && k.url.toLowerCase().includes(currentDom)) || (k.targetUrl && k.targetUrl.toLowerCase().includes(currentDom)))) {
        return true;
      }
      return false;
    });
  }, [keywords, selectedWebsiteId, websites]);

  const trashedKeywords = useMemo(() => keywords.filter((k) => k.deletedAt), [keywords]);
  const trashedCategories = useMemo(() => categories.filter((c) => c.deletedAt), [categories]);
  const trashedProjects = useMemo(() => projects.filter((p) => p.deletedAt), [projects]);

  const activeCategories = useMemo(() => {
    return categories.filter((c) => !c.deletedAt);
  }, [categories]);

  // ═══ TOP 5 SUMMARY STATS (Dynamic calculations) ═══
  const stats = useMemo(() => {
    const total = activeKeywords.length;
    const rankedKeywords = activeKeywords.filter((k) => Number(k.position) > 0 && Number(k.position) <= 100);
    const top3 = rankedKeywords.filter((k) => Number(k.position) <= 3).length;
    const top10 = rankedKeywords.filter((k) => Number(k.position) <= 10).length;
    const totalVolume = activeKeywords.reduce((acc, k) => acc + (Number(k.volume) || 0), 0);
    const avgPosition =
      rankedKeywords.length > 0
        ? (rankedKeywords.reduce((acc, k) => acc + (Number(k.position) || 0), 0) / rankedKeywords.length).toFixed(1)
        : '0';
    const avgKd =
      total > 0
        ? Math.round(activeKeywords.reduce((acc, k) => acc + (Number(k.difficulty) || 0), 0) / total)
        : 0;
    const avgKdInfo = getDifficultyInfo(avgKd || 1);

    return {
      total,
      activeRanked: rankedKeywords.length,
      top3,
      top10,
      totalVolume,
      avgPosition,
      avgKd,
      avgKdInfo
    };
  }, [activeKeywords]);

  // ═══ FILTERED KEYWORDS FOR DAILY TREND (Image 1) ═══
  const filteredDailyKeywords = useMemo(() => {
    return activeKeywords.filter((k) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKw = k.keyword?.toLowerCase().includes(q);
        const matchUrl = k.url?.toLowerCase().includes(q);
        const matchGroup = k.group?.toLowerCase().includes(q);
        if (!matchKw && !matchUrl && !matchGroup) return false;
      }

      // Difficulty Filter
      if (difficultyFilter !== 'All') {
        const kd = getDifficultyInfo(k.difficulty || 40);
        if (kd.level.toLowerCase() !== difficultyFilter.toLowerCase()) return false;
      }

      // Rank Filter
      if (rankFilter !== 'All') {
        const pos = Number(k.position) || 999;
        if (rankFilter === 'Top 10' && pos > 10) return false;
        if (rankFilter === 'Top 20' && pos > 20) return false;
        if (rankFilter === 'Top 30' && pos > 30) return false;
        if (rankFilter === 'Top 40' && pos > 40) return false;
        if (rankFilter === 'Top 50' && pos > 50) return false;
      }

      return true;
    });
  }, [activeKeywords, searchQuery, difficultyFilter, rankFilter]);

  // ═══ MONTHLY VARIANCE DATA (Image 2) ═══
  const getPosForMonth = (k, m) => {
    return k.monthly?.[m] || k.monthlyPositions?.[m];
  };

  const getMonthDiff = (k) => {
    const start = getPosForMonth(k, fromMonth);
    const end = getPosForMonth(k, toMonth);
    if (start && end) {
      return start - end; // positive = improved ranking
    }
    return null;
  };

  const monthlyDiffs = useMemo(() => {
    return activeKeywords.map(getMonthDiff).filter((d) => d !== null);
  }, [activeKeywords, fromMonth, toMonth]);

  const monthlySummary = useMemo(() => {
    return {
      improved: monthlyDiffs.filter((d) => d > 0).length,
      dropped: monthlyDiffs.filter((d) => d < 0).length,
      unchanged: monthlyDiffs.filter((d) => d === 0).length
    };
  }, [monthlyDiffs]);

  // Inline Monthly Cell Change Handler
  const handleSaveMonthlyCell = (kw, month, rawVal) => {
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      setEditingCell(null);
      return;
    }
    const num = Number(rawVal);
    if (isNaN(num)) {
      toast.error('Please enter a valid rank number (1 - 100)');
      setEditingCell(null);
      return;
    }
    const boundedVal = Math.max(1, Math.min(100, Math.round(num)));
    updateMonthlyPosition(kw.id, month, boundedVal);
    toast.success(`Updated "${kw.keyword}" (${monthLabel(month)}) rank to #${boundedVal}`);
    setEditingCell(null);
  };

  // Inline Daily Position Change Handler
  const handleSaveDailyPosition = (kw, rawVal) => {
    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      setEditingDailyId(null);
      return;
    }
    const num = Number(rawVal);
    if (isNaN(num)) {
      toast.error('Please enter a valid rank number (1 - 100)');
      setEditingDailyId(null);
      return;
    }
    const boundedVal = Math.max(1, Math.min(100, Math.round(num)));
    updateKeyword(kw.id, { position: boundedVal });
    toast.success(`Updated "${kw.keyword}" current rank to #${boundedVal}`);
    setEditingDailyId(null);
  };

  // Handle Delete with Undo Toast
  const handleDeleteKeyword = async (k) => {
    await purgeKeyword(k.id);
    setUndoToast({
      message: `Keyword "${k.keyword}" deleted.`,
      undoAction: () => addKeyword(k),
      duration: 6000
    });
    toast.success(`Deleted "${k.keyword}" from database`);
  };

  // Open Edit Modal
  const handleOpenEdit = (k) => {
    setEditingKeyword(k);
    setEditForm({
      keyword: k.keyword || '',
      url: k.url || '',
      position: k.position || 50,
      volume: k.volume || 1000,
      difficulty: k.difficulty || 40,
      group: k.group || 'Automation'
    });
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.keyword.trim()) {
      toast.error('Keyword cannot be empty');
      return;
    }
    updateKeyword(editingKeyword.id, {
      ...editForm,
      position: Number(editForm.position) || 50,
      volume: Number(editForm.volume) || 1000,
      difficulty: Number(editForm.difficulty) || 40
    });
    toast.success(`Updated keyword "${editForm.keyword}"`);
    setEditingKeyword(null);
    setEditForm(null);
  };

  // Quick Add Submit
  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickForm.keyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }
    const pos = Number(quickForm.position) || 3;
    const vol = Number(quickForm.volume) || 2400;
    const diff = Number(quickForm.difficulty) || 35;
    const history = makeHistory(Date.now(), pos, 30);
    const monthly = {};
    months.forEach((m) => {
      monthly[m] = pos;
    });

    const newKw = {
      id: `kw-${Date.now()}`,
      keyword: quickForm.keyword.trim(),
      group: quickForm.group.trim() || 'Automation',
      url: quickForm.url.trim() || `https://${currentProjectDomain}/`,
      position: pos,
      volume: vol,
      difficulty: diff,
      history,
      monthly,
      websiteId: selectedWebsiteId || 'site-1',
      projectId: selectedWebsiteId || 'site-1',
      change: 0,
      deletedAt: null
    };

    addKeyword(newKw);
    toast.success(`Added "${newKw.keyword}" to tracking`);
    setQuickForm({
      keyword: '',
      url: '',
      position: '3',
      volume: '2400',
      difficulty: '35',
      group: 'Automation'
    });
    setShowQuickModal(false);
  };

  // Reactive parser for pasted text
  const textKeywords = useMemo(() => {
    if (!importText.trim()) return [];
    const lines = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines
      .map((line, idx) => {
        const parts = line.split(/[,;\t]/).map((s) => s.trim());
        const kw = parts[0] || '';
        if (!kw) return null;
        const pos = Number(parts[1]) || 3;
        const vol = Number(parts[2]) || 2400;
        const diff = Number(parts[3]) || 35;
        const grp = parts[4] || 'Automation';
        const url = parts[5] || `https://${currentProjectDomain}/`;

        return {
          id: `kw-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          keyword: kw,
          group: grp,
          url,
          position: pos,
          volume: vol,
          difficulty: diff,
          history: makeHistory(Date.now() + idx, pos, 30),
          monthly: Object.fromEntries(months.map((m) => [m, pos])),
          websiteId: selectedWebsiteId || 'site-1',
          projectId: selectedWebsiteId || 'site-1',
          change: 0,
          deletedAt: null
        };
      })
      .filter(Boolean);
  }, [importText, currentProjectDomain, months, selectedWebsiteId]);

  const activeParsedCount = importTab === 'file' ? fileKeywords.length : textKeywords.length;

  // Process uploaded Excel/CSV file with 6-month ranking columns
  const processImportFile = (file) => {
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawJson || rawJson.length < 2) {
          toast.error('The file appears to be empty or has no header row.');
          setFileKeywords([]);
          return;
        }

        const headers = rawJson[0].map((h) => String(h).trim().toLowerCase());
        const rows = rawJson.slice(1);

        const kwIdx = headers.findIndex((h) => h.includes('keyword') || h.includes('query') || h.includes('term'));
        const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('link') || h.includes('target'));
        const grpIdx = headers.findIndex((h) => h.includes('category') || h.includes('group') || h.includes('tag'));
        const volIdx = headers.findIndex((h) => h.includes('volume') || h.includes('vol') || h.includes('search'));
        const kdIdx = headers.findIndex((h) => h.includes('difficulty') || h.includes('kd') || h.includes('comp'));
        const posIdx = headers.findIndex((h) => h.includes('position') || h.includes('pos') || h.includes('rank'));

        // Map month columns: matches monthKeys or monthLabel formats
        const monthCols = [];
        months.forEach((mKey) => {
          const mLabel = monthLabel(mKey).toLowerCase();
          const foundIdx = headers.findIndex(
            (h) =>
              h === mKey.toLowerCase() ||
              h === mLabel ||
              h.includes(mLabel.replace(' ', '')) ||
              h.includes(mLabel) ||
              h.includes(mKey.replace('-', ''))
          );
          if (foundIdx !== -1) {
            monthCols.push({ key: mKey, idx: foundIdx });
          }
        });

        const parsed = [];
        rows.forEach((row, rowIdx) => {
          const kw = kwIdx !== -1 ? String(row[kwIdx] || '').trim() : String(row[0] || '').trim();
          if (!kw) return;

          const url = urlIdx !== -1 && row[urlIdx] ? String(row[urlIdx]).trim() : `https://${currentProjectDomain}/`;
          const grp = grpIdx !== -1 && row[grpIdx] ? String(row[grpIdx]).trim() : 'Automation';
          const vol = volIdx !== -1 && !isNaN(Number(row[volIdx])) ? Number(row[volIdx]) : 2400;
          const kd = kdIdx !== -1 && !isNaN(Number(row[kdIdx])) ? Number(row[kdIdx]) : 35;
          let pos = posIdx !== -1 && !isNaN(Number(row[posIdx])) ? Number(row[posIdx]) : 3;

          const monthly = {};
          monthCols.forEach(({ key, idx }) => {
            const val = row[idx];
            if (val !== undefined && val !== '' && !isNaN(Number(val))) {
              monthly[key] = Number(val);
            }
          });

          if (posIdx === -1 && monthCols.length > 0) {
            const lastMonthKey = months.at(-1);
            if (monthly[lastMonthKey]) {
              pos = monthly[lastMonthKey];
            }
          }

          months.forEach((m) => {
            if (!monthly[m]) {
              monthly[m] = pos;
            }
          });

          parsed.push({
            id: `kw-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 6)}`,
            keyword: kw,
            url,
            group: grp,
            volume: vol,
            difficulty: kd,
            position: pos,
            history: makeHistory(Date.now() + rowIdx, pos, 30),
            monthly,
            websiteId: selectedWebsiteId || 'site-1',
            projectId: selectedWebsiteId || 'site-1',
            change: 0,
            deletedAt: null
          });
        });

        if (parsed.length === 0) {
          toast.error('No keywords found in file.');
        } else {
          toast.success(`Parsed ${parsed.length} keywords from ${file.name}`);
        }
        setFileKeywords(parsed);
      } catch (err) {
        console.error('File parsing error:', err);
        toast.error('Failed to parse Excel/CSV file. Please check structure.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImportFile(file);
  };

  // Download Sample Excel Template
  const downloadSampleExcel = () => {
    const head = [
      'Keyword',
      'Target URL',
      'Category',
      'Search Volume',
      'Difficulty (KD)',
      'Current Position',
      ...months.map(monthLabel)
    ];

    const sampleRows = [
      [
        'automated serp tracking software',
        `https://${currentProjectDomain}/software`,
        'Automation',
        3600,
        35,
        3,
        12, 9, 7, 5, 4, 3
      ],
      [
        'My99Exch WhatsApp Number India',
        `https://${currentProjectDomain}/contact`,
        'Core Features',
        3000,
        8,
        3,
        15, 11, 8, 5, 3, 3
      ],
      [
        'daily keyword rank updates',
        `https://${currentProjectDomain}/daily-updates`,
        'Rankings',
        1900,
        28,
        8,
        25, 18, 14, 10, 8, 8
      ],
      [
        'My99exch best cricket betting app for IPL',
        `https://${currentProjectDomain}/app`,
        'Core Features',
        50000,
        27,
        12,
        40, 32, 24, 18, 14, 12
      ],
      [
        'google keyword position checker',
        `https://${currentProjectDomain}/checker`,
        'Core Features',
        12500,
        58,
        14,
        28, 24, 20, 18, 16, 14
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([head, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Keywords');
    XLSX.writeFile(wb, `${currentProjectDomain}_keyword_monthly_template.xlsx`);
    toast.success('Downloaded Sample Excel Template');
  };

  // Bulk Import Submit
  const handleBulkImport = async () => {
    const keywordsToImport = importTab === 'file' ? fileKeywords : textKeywords;
    if (!keywordsToImport || keywordsToImport.length === 0) {
      toast.error('No keywords to import. Please upload a file or paste keyword rows.');
      return;
    }

    try {
      if (bulkAddKeywords) {
        await bulkAddKeywords(keywordsToImport);
      } else {
        for (const k of keywordsToImport) {
          await addKeyword(k);
        }
      }

      toast.success(`Imported ${keywordsToImport.length} keywords successfully!`);
      setImportText('');
      setFileKeywords([]);
      setImportFileName('');
      setShowImportModal(false);
    } catch (err) {
      console.error('Bulk import error:', err);
      toast.error('Failed to import keywords: ' + err.message);
    }
  };

  // Monthly Export to Excel
  const exportMonthlyExcel = () => {
    const head = [
      'Keyword',
      'Group',
      'Volume',
      'Difficulty (KD)',
      ...months.map(monthLabel),
      `Change (${monthLabel(fromMonth)} vs ${monthLabel(toMonth)})`
    ];

    const body = activeKeywords.map((r) => {
      const kd = getDifficultyInfo(r.difficulty || 40);
      const d = getMonthDiff(r);
      return [
        r.keyword,
        r.group || 'Automation',
        r.volume ? r.volume.toLocaleString('en-IN') : '–',
        `${kd.score}% (${kd.level})`,
        ...months.map((m) => (getPosForMonth(r, m) ? formatPosition(getPosForMonth(r, m)) : '')),
        d ?? ''
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Comparison');
    XLSX.writeFile(wb, `${currentProjectDomain}-monthly-rankings.xlsx`);
    toast.success('Downloaded Monthly Rankings Excel');
  };

  // Monthly Export to PDF
  const exportMonthlyPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Keyword Monthly Variance Report - ${currentProjectDomain}`, 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Comparison: ${monthLabel(fromMonth)} vs ${monthLabel(toMonth)} | Improved: ${monthlySummary.improved}, Dropped: ${monthlySummary.dropped}, Unchanged: ${monthlySummary.unchanged}`,
      14,
      21
    );

    const head = [
      'Keyword',
      'Group',
      'Volume',
      'KD%',
      ...months.map(monthLabel),
      `Diff`
    ];

    const body = activeKeywords.map((r) => {
      const kd = getDifficultyInfo(r.difficulty || 40);
      const d = getMonthDiff(r);
      return [
        r.keyword,
        r.group || 'Automation',
        r.volume ? r.volume.toLocaleString('en-IN') : '–',
        `${kd.score}%`,
        ...months.map((m) => (getPosForMonth(r, m) ? formatPosition(getPosForMonth(r, m)) : '')),
        d === null ? '–' : d > 0 ? `+${d}` : `${d}`
      ];
    });

    autoTable(doc, {
      head: [head],
      body,
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${currentProjectDomain}-monthly-rankings.pdf`);
    toast.success('Downloaded Monthly Rankings PDF');
  };

  // Full Add Keyword View Render
  if (showAddView) {
    return (
      <AddKeywordView
        onBack={() => setShowAddView(false)}
        onAdd={(newKw) => {
          addKeyword({
            ...newKw,
            projectId: selectedWebsiteId || 'site-1',
            websiteId: selectedWebsiteId || 'site-1'
          });
          toast.success(`Added "${newKw.keyword}" to tracking`);
          setShowAddView(false);
        }}
        defaultDomain={currentProjectDomain}
        availableCategories={activeCategories.map((c) => c.name)}
      />
    );
  }

  return (
    <div className="keyword-intelligence-page space-y-6 animate-in fade-in duration-200">
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
              Keywords <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">Intelligence & SERP Tracker</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Monitor real-time Google search positions, historical rank sparklines, search volume, and monthly variance.
            </p>

            {/* 3 Mini Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-3xl">
              {/* Card 1: Total Keywords */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Keywords
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {stats.total.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {stats.total > 0 ? `${stats.activeRanked} tracked` : '0 active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Top 3 Ranks */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Top 3 Ranks
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {stats.top3.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      {stats.total > 0 ? `${Math.round((stats.top3 / stats.total) * 100)}% share` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Avg Position */}
              <div className="p-4 rounded-2xl bg-[#11172e]/80 border border-[#1f294a] backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30 flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Avg Position
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-white">
                      {stats.total > 0 && stats.activeRanked > 0 ? `#${stats.avgPosition}` : '–'}
                    </span>
                    <span className="text-[11px] font-bold text-blue-400">
                      Top 10: {stats.top10}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ZONE: Action Sidebar Stack */}
          <div className="w-full lg:w-64 flex flex-col gap-2.5 justify-center flex-shrink-0">
            {/* 1. Primary Add Keyword Button */}
            <button
              type="button"
              onClick={() => setShowAddView(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(59,130,246,0.45)] hover:shadow-[0_0_30px_rgba(59,130,246,0.65)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Keyword</span>
            </button>

            {/* 2. Quick Modal Button */}
            <button
              type="button"
              onClick={() => setShowQuickModal(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Add single keyword via quick modal"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Modal</span>
            </button>

            {/* 3. Bulk Import Button */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Import keywords from Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bulk Import</span>
            </button>

            {/* 4. Excel & PDF Export Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportMonthlyExcel}
                className="py-2 px-3 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Export keywords to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={exportMonthlyPDF}
                className="py-2 px-3 rounded-2xl bg-[#12182f]/90 hover:bg-[#1a2344] border border-[#232f58] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Export keywords to PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. TABS: Daily Trend vs Monthly Comparison ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Daily Trend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Monthly Comparison</span>
          </button>
        </div>
      </div>

      {/* ═══ 3. TOP 5 SUMMARY STAT CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Keywords */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Total Keywords
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            {stats.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Active tracking pool
          </p>
        </div>

        {/* Top 3 Rankings */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Top 3 Rankings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {stats.top3}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            High-intent podium ranks
          </p>
        </div>

        {/* Top 10 Rankings */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Top 10 Rankings
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-3 tracking-tight">
            {stats.top10}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            First page SERP results
          </p>
        </div>

        {/* Total Search Volume */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Total Search Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            {formatVolume(stats.totalVolume)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Monthly impressions scope
          </p>
        </div>

        {/* Avg KD (Easy) */}
        <div className="group p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500">
              Avg KD ({stats.avgKdInfo.level})
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-3 tracking-tight">
            {stats.avgKd}%
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Keyword competition index
          </p>
        </div>
      </div>

      {/* ═══ 4. TAB 1: DAILY TREND VIEW (Exact Image 1) ═══ */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Enhanced Filter Bar: Search on Top, Difficulty on Left, Rank on Right */}
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-xs space-y-3">
            {/* Top: Search Input */}
            <div className="w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search keywords or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs font-medium rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/40 focus:border-[#0062ff] text-slate-900 dark:text-white placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Bottom Row: Difficulty on Left, Rank on Right */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/50">
              {/* Left: DIFFICULTY Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0062ff]" />
                  Difficulty:
                </span>
                <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  {[
                    { label: 'All', dot: null },
                    { label: 'Easy', dot: 'bg-emerald-500' },
                    { label: 'Medium', dot: 'bg-amber-500' },
                    { label: 'Hard', dot: 'bg-orange-500' },
                    { label: 'Very Hard', dot: 'bg-rose-500' }
                  ].map(({ label, dot }) => {
                    const isSelected = difficultyFilter === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDifficultyFilter(label)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0062ff] text-white shadow-sm shadow-[#0062ff]/25 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {dot && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dot}`} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: RANK Filter & Actions */}
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                  <Target className="w-3.5 h-3.5 text-[#0062ff]" />
                  Rank:
                </span>
                <div className="inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  {['All', 'Top 10', 'Top 20', 'Top 30', 'Top 40', 'Top 50'].map((r) => {
                    const isSelected = rankFilter === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRankFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0062ff] text-white shadow-sm shadow-[#0062ff]/25 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                {/* Keyword count & Reset Filter button */}
                {(difficultyFilter !== 'All' || rankFilter !== 'All' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDifficultyFilter('All');
                      setRankFilter('All');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-rose-500 bg-slate-100 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}

                <span className="hidden 2xl:inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                  {filteredDailyKeywords.length} of {keywords.length} keywords
                </span>
              </div>
            </div>
          </div>

          {/* Daily Trend Table (Image 1) */}
          <div className="tablewrap rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4 min-w-[200px]">Keyword</th>
                  <th className="py-3 px-3 text-center" style={{ width: 90 }}>
                    Position ▲
                  </th>
                  <th className="py-3 px-3 text-center" style={{ width: 90 }}>
                    7D Change
                  </th>
                  <th className="py-3 px-4" style={{ width: 140 }}>
                    Search Volume
                  </th>
                  <th className="py-3 px-4 text-center" style={{ width: 140 }}>
                    Difficulty (KD)
                  </th>
                  <th className="py-3 px-4 text-center" style={{ width: 130 }}>
                    30D Trend
                  </th>
                  <th className="py-3 px-4 min-w-[180px]">Target URL</th>
                  <th className="py-3 px-4 text-right" style={{ width: 180 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredDailyKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <KeyRound className="w-8 h-8 text-indigo-500 mx-auto opacity-50" />
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          No keywords matching current filters
                        </p>
                        <p className="text-xs text-slate-400">
                          Try searching for a different term or adjust the difficulty and rank filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDailyKeywords.map((kw) => {
                    const kdInfo = getDifficultyInfo(kw.difficulty || 35);
                    const positionDisplay =
                      kw.position > 100 ? '>100' : `#${kw.position || '–'}`;

                    return (
                      <tr
                        key={kw.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Keyword Name + Category Subtitle */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {kw.keyword}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {kw.group || 'Automation'}
                          </span>
                        </td>

                        {/* Position (Clickable & Editable) */}
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                          {editingDailyId?.kwId === kw.id ? (
                            <input
                              type="number"
                              min="1"
                              max="100"
                              autoFocus
                              value={editingDailyId.value}
                              onChange={(e) => setEditingDailyId({ ...editingDailyId, value: e.target.value })}
                              onBlur={() => handleSaveDailyPosition(kw, editingDailyId.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveDailyPosition(kw, editingDailyId.value);
                                } else if (e.key === 'Escape') {
                                  setEditingDailyId(null);
                                }
                              }}
                              className="w-14 h-7 mx-auto rounded-lg text-center font-mono font-bold text-xs bg-[#0b1021] text-white border-2 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] focus:outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingDailyId({
                                  kwId: kw.id,
                                  value: kw.position ? String(kw.position) : ''
                                })
                              }
                              title="Click to edit current rank"
                              className="px-2.5 py-1 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer hover:scale-105"
                            >
                              {positionDisplay}
                            </button>
                          )}
                        </td>

                        {/* 7D Change */}
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {kw.change === 0 || !kw.change ? (
                            <span className="text-slate-400">–</span>
                          ) : kw.change > 0 ? (
                            <span className="text-emerald-500 font-bold">+{kw.change}</span>
                          ) : (
                            <span className="text-rose-500 font-bold">{kw.change}</span>
                          )}
                        </td>

                        {/* Search Volume */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {kw.volume ? kw.volume.toLocaleString('en-IN') : '1,820'}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">/ month</span>
                        </td>

                        {/* Difficulty (KD) Badge */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{
                              color: kdInfo.color,
                              background: kdInfo.bg,
                              borderColor: kdInfo.border
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: kdInfo.color }}
                            />
                            <span>
                              {kdInfo.score}% {kdInfo.level}
                            </span>
                          </span>
                        </td>

                        {/* 30D Trend Sparkline */}
                        <td className="py-3 px-4 text-center">
                          <Sparkline
                            data={
                              kw.history && kw.history.length > 1
                                ? kw.history
                                : makeHistory(kw.id.charCodeAt(0) || 10, kw.position || 5)
                            }
                            width={100}
                            height={26}
                          />
                        </td>

                        {/* Target URL */}
                        <td className="py-3 px-4">
                          <a
                            href={kw.url || `https://${currentProjectDomain}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-slate-400 hover:text-indigo-400 truncate max-w-[200px] block"
                            title={kw.url}
                          >
                            {kw.url || `https://${currentProjectDomain}/`}
                          </a>
                        </td>

                        {/* Action Buttons: View, Edit, Delete */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingKeyword(kw)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(kw)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit Keyword"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteKeyword(kw)}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Delete Keyword"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
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
        </div>
      )}

      {/* ═══ 5. TAB 2: MONTHLY COMPARISON VIEW (Exact Image 2) ═══ */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Monthly Controls Toolbar (Image 2) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-[#0f172a]/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
            {/* Compare Selectors & Variance Badges */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="text-slate-400 font-semibold">Compare from</span>
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {monthLabel(m)}
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-semibold">Compare to</span>
              <select
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {monthLabel(m)}
                  </option>
                ))}
              </select>

              {/* Improved / Dropped / Unchanged Counters */}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-emerald-500 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {monthlySummary.improved} Improved
                </span>
                <span className="text-rose-500 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded-md">
                  {monthlySummary.dropped} Dropped
                </span>
                <span className="text-slate-400 font-bold text-[11px] bg-slate-500/10 px-2 py-0.5 rounded-md">
                  {monthlySummary.unchanged} Unchanged
                </span>
              </div>

              {/* Interactive Tip */}
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Click any position to edit
              </span>
            </div>

            {/* Right Buttons: Download Excel / Download PDF */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportMonthlyExcel}
                className="px-3.5 py-1.5 rounded-xl bg-[#0062ff] hover:bg-[#004ecc] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#0062ff]/25 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel</span>
              </button>

              <button
                type="button"
                onClick={exportMonthlyPDF}
                className="px-3.5 py-1.5 rounded-xl bg-[#0062ff] hover:bg-[#004ecc] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#0062ff]/25 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Monthly Comparison Table Grid (Image 2) */}
          <div className="tablewrap rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4 min-w-[200px]">Keyword</th>
                  <th className="py-3 px-3 text-right" style={{ width: 100 }}>
                    Volume
                  </th>
                  <th className="py-3 px-3 text-center" style={{ width: 140 }}>
                    Difficulty (KD)
                  </th>
                  {months.map((m) => (
                    <th key={m} className="py-3 px-2 text-center" style={{ width: 68 }}>
                      {monthLabel(m).toUpperCase()}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center" style={{ width: 90 }}>
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {activeKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No keywords tracked for this project.
                    </td>
                  </tr>
                ) : (
                  activeKeywords.map((r) => {
                    const kd = getDifficultyInfo(r.difficulty || 35);
                    const d = getMonthDiff(r);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Keyword Name + Subtitle */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{r.keyword}</div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {r.group || 'Core Features'}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {r.volume ? r.volume.toLocaleString('en-IN') : '1,400'}
                        </td>

                        {/* Difficulty */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              color: kd.color,
                              background: kd.bg,
                              borderColor: kd.border
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: kd.color }}
                            />
                            <span>
                              {kd.score}% {kd.level}
                            </span>
                          </span>
                        </td>

                        {/* 6 Month Position Boxes (Clickable & Editable) */}
                        {months.map((m) => {
                          const val = getPosForMonth(r, m);
                          const isBlank = !val;
                          const isHigh = val > 100;
                          const isEditing = editingCell?.kwId === r.id && editingCell?.month === m;

                          return (
                            <td key={m} className="py-2.5 px-2 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  autoFocus
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => handleSaveMonthlyCell(r, m, editingCell.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveMonthlyCell(r, m, editingCell.value);
                                    } else if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="w-12 h-7 mx-auto rounded-lg text-center font-mono font-bold text-xs bg-[#0b1021] text-white border-2 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)] focus:outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingCell({
                                      kwId: r.id,
                                      month: m,
                                      value: val !== undefined && val !== null ? String(val) : ''
                                    })
                                  }
                                  title={`Click to edit ${monthLabel(m)} position for "${r.keyword}"`}
                                  className={`w-12 h-7 mx-auto rounded-lg flex items-center justify-center font-mono font-bold text-[11px] border transition-all cursor-pointer hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-indigo-500/50 hover:border-indigo-400 active:scale-95 ${
                                    isBlank
                                      ? 'bg-slate-100/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/40 text-slate-500 hover:border-indigo-400'
                                      : isHigh
                                      ? 'bg-slate-200/80 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-400'
                                      : val <= 3
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:border-emerald-400'
                                      : val <= 10
                                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:border-indigo-400'
                                      : 'bg-slate-200/80 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-200 hover:border-indigo-400'
                                  }`}
                                >
                                  <span>{isBlank ? '–' : isHigh ? '>100' : val}</span>
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Variance Change */}
                        <td className="py-3 px-3 text-center font-mono text-xs font-bold">
                          {d === null ? (
                            <span className="text-slate-400">–</span>
                          ) : d > 0 ? (
                            <span className="text-emerald-500">+{d}</span>
                          ) : d < 0 ? (
                            <span className="text-rose-500">{d}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ 6. MODALS & DRAWERS ═══ */}

      {/* Quick Add Modal */}
      {showQuickModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowQuickModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Quick Add Keyword</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keyword <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. cloud database platform"
                  value={quickForm.keyword}
                  onChange={(e) => setQuickForm({ ...quickForm, keyword: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Position
                  </label>
                  <input
                    type="number"
                    value={quickForm.position}
                    onChange={(e) => setQuickForm({ ...quickForm, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Search Volume
                  </label>
                  <input
                    type="number"
                    value={quickForm.volume}
                    onChange={(e) => setQuickForm({ ...quickForm, volume: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty (KD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quickForm.difficulty}
                    onChange={(e) => setQuickForm({ ...quickForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={quickForm.group}
                    onChange={(e) => setQuickForm({ ...quickForm, group: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  Add Keyword
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Keyword Modal */}
      {editingKeyword && editForm && (
        <div
          className="modal-overlay"
          onClick={() => setEditingKeyword(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                <span>Edit Keyword Details</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingKeyword(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keyword Name
                </label>
                <input
                  type="text"
                  value={editForm.keyword}
                  onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Position
                  </label>
                  <input
                    type="number"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Volume
                  </label>
                  <input
                    type="number"
                    value={editForm.volume}
                    onChange={(e) => setEditForm({ ...editForm, volume: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty (KD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editForm.group}
                    onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Landing Page URL
                </label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingKeyword(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Keyword Modal */}
      {viewingKeyword && (
        <div
          className="modal-overlay"
          onClick={() => setViewingKeyword(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {viewingKeyword.keyword}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingKeyword.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingKeyword(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Current Rank</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                  #{viewingKeyword.position || '–'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Search Volume</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                  {viewingKeyword.volume ? viewingKeyword.volume.toLocaleString('en-IN') : '–'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Difficulty</p>
                <p className="text-xl font-extrabold text-indigo-500 mt-1 font-mono">
                  {viewingKeyword.difficulty || 35}%
                </p>
              </div>
            </div>

            {/* Historical Trend Chart */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">30-Day SERP History</p>
              <div className="h-40 w-full p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(viewingKeyword.history || []).map((p, i) => ({ day: `D${i + 1}`, rank: p }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} />
                    <YAxis reversed domain={[1, 100]} stroke="#94a3b8" fontSize={9} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: 8,
                        fontSize: 11,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rank"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingKeyword(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import & Monthly Comparison Modal (Image 2) */}
      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card max-w-2xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-150 bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed) */}
            <div className="flex items-start justify-between p-5 pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base sm:text-lg">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span>Import Keywords & Monthly Comparison</span>
                </div>
                <p className="text-xs text-slate-500">
                  Target Project:{' '}
                  <span className="text-[#0062ff] font-semibold">
                    {currentProjectDomain}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 pr-3.5 scrollbar-thin">
              {/* Green Sample Template Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                    Need a template with monthly positions?
                  </h4>
                  <p className="text-[11px] sm:text-xs text-emerald-700">
                    Download our pre-formatted sample Excel sheet with 6-month ranking columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample (.xlsx)</span>
                </button>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setImportTab('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer ${
                    importTab === 'file'
                      ? 'bg-white text-[#0062ff] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Upload Excel / CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition cursor-pointer ${
                    importTab === 'text'
                      ? 'bg-white text-[#0062ff] shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#0062ff]" />
                  <span>Paste Text / CSV Rows</span>
                </button>
              </div>

              {/* Tab 1: File Upload / Drag & Drop */}
              {importTab === 'file' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        processImportFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('keyword-excel-input')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer transition ${
                      isDragging
                        ? 'border-[#0062ff] bg-blue-50/50'
                        : 'border-slate-300 hover:border-[#0062ff] bg-slate-50/70 hover:bg-blue-50/30'
                    }`}
                  >
                    <input
                      id="keyword-excel-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#0062ff]">
                      <UploadCloud className="w-5 h-5 text-[#0062ff]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        Drag and drop your Excel or CSV file here
                      </p>
                      <p className="text-xs text-slate-500">
                        or <span className="text-[#0062ff] underline font-medium">browse from your computer</span>
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      Supports keyword columns & monthly ranking columns (e.g. {months.map(monthLabel).slice(0, 3).join(', ')}...)
                    </p>
                  </div>

                  {importFileName && fileKeywords.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-medium">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>
                          <strong>{importFileName}</strong> — Ready to import{' '}
                          <strong>{fileKeywords.length}</strong> keywords with monthly rankings.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImportFileName('');
                          setFileKeywords([]);
                        }}
                        className="text-slate-400 hover:text-red-500 text-[11px] font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Paste Text / CSV Rows */}
              {importTab === 'text' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Paste keywords one per line, optionally with position, volume, and category separated by commas or tabs:
                  </p>
                  <textarea
                    rows={5}
                    placeholder={`react tutorials, 3, 14000, 35, Blog\nseo ranking tool, 5, 8200, 42, Features\nnextjs speed optimization, 12, 5400, 60, Guides`}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0062ff] text-slate-900 resize-none"
                  />
                  {textKeywords.length > 0 && (
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Detected {textKeywords.length} valid keyword lines
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={activeParsedCount === 0}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                  activeParsedCount > 0
                    ? 'bg-[#0062ff] hover:bg-[#004ecc] shadow-[#0062ff]/30'
                    : 'bg-[#0062ff]/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <span>Import {activeParsedCount} Keywords</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Trash Drawer Panel */}
      <TrashPanel
        isOpen={showTrash}
        onClose={() => setShowTrash(false)}
        trashedProjects={trashedProjects}
        trashedCategories={trashedCategories}
        trashedKeywords={trashedKeywords}
        allProjects={projects || []}
        allCategories={categories || []}
        onRestoreProject={(p) => {
          restoreProject(p);
          toast.success("Project restored from Trash");
        }}
        onRestoreCategory={(c) => {
          restoreCategory(c);
          toast.success("Category restored from Trash");
        }}
        onRestoreKeyword={(k) => {
          restoreKeyword(k);
          toast.success("Keyword restored from Trash");
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
          purgeKeyword(k);
          toast.success("Keyword permanently deleted");
        }}
        onBulkRestore={(type, ids) => {
          if (type === 'keywords') ids.forEach((id) => restoreKeyword(id));
          else if (type === 'categories') ids.forEach((id) => restoreCategory(id));
          else if (type === 'projects') ids.forEach((id) => restoreProject(id));
          toast.success(`Restored ${ids.length} items from Trash`);
        }}
        onBulkPurge={(type, ids) => {
          if (type === 'keywords') ids.forEach((id) => purgeKeyword(id));
          else if (type === 'categories') ids.forEach((id) => purgeCategory(id));
          else if (type === 'projects') ids.forEach((id) => purgeProject(id));
          toast.success(`Permanently deleted ${ids.length} items`);
        }}
        onEmptyTrash={() => {
          emptyTrash();
          toast.success('Trash emptied completely');
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => setUser(user, token)}
      />

      {/* Undo Toast Notification */}
      {undoToast && (
        <UndoToast
          message={undoToast.message}
          onUndo={undoToast.undoAction}
          onClose={() => setUndoToast(null)}
          duration={undoToast.duration || 5000}
        />
      )}
    </div>
  );
}
