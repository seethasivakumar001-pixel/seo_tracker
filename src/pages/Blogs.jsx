import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Clock,
  User,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Globe,
  SlidersHorizontal,
  Layers,
  FileText,
  KeyRound,
  Check,
  ArrowUpDown,
  Share2
} from 'lucide-react';
import { useBlogStore } from '../store/blogStore';
import { useSEOStore } from '../store/seoStore';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Pagination } from '../components/Pagination';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

function formatDisplayDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return val;
  }
}



const STATUS_CONFIG = {
  Published: {
    variant: 'success',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
  },
  Draft: {
    variant: 'warning',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    dotClass: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
  },
  Scheduled: {
    variant: 'primary',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    dotClass: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]'
  },
  'In Review': {
    variant: 'purple',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    dotClass: 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]'
  }
};

export function Blogs() {
  const { getSelectedWebsite, selectedWebsiteId } = useSEOStore();
  const { user } = useAuthStore();
  const currentWebsite = getSelectedWebsite();
  const currentProjectId = currentWebsite?.id || selectedWebsiteId || 'site-1';
  const currentDomain = currentWebsite?.domain || 'my99exch';

  const {
    blogs,
    isLoading,
    fetchDbBlogs,
    addBlog,
    updateBlog,
    softDeleteBlog
  } = useBlogStore();

  // Load from DB on mount
  useEffect(() => {
    fetchDbBlogs(currentProjectId, currentDomain);
  }, [fetchDbBlogs, currentProjectId, currentDomain]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('lastUpdated'); // 'title' | 'publishDate' | 'lastUpdated' | 'status'
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    focusKeyword: '',
    author: user?.name || 'Content Team',
    publishDate: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'Published'
  });

  // Filter out deleted blogs and match current website context
  const siteBlogs = useMemo(() => {
    const raw = blogs || [];
    const nonDeleted = raw.filter((b) => !b.deletedAt);
    const domainNorm = currentDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\..*$/, '');

    return nonDeleted.filter((b) => {
      if (b.projectId === currentProjectId || b.projectId === selectedWebsiteId) return true;
      if (b.domain && domainNorm && (b.domain.toLowerCase() === domainNorm || b.domain.toLowerCase().includes(domainNorm))) return true;
      return false;
    });
  }, [blogs, currentProjectId, selectedWebsiteId, currentDomain]);

  // Search & Filter
  const filteredBlogs = useMemo(() => {
    let result = [...siteBlogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.url?.toLowerCase().includes(q) ||
          b.focusKeyword?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((b) => b.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'publishDate' || sortField === 'lastUpdated') {
        const timeA = valA ? new Date(valA).getTime() : 0;
        const timeB = valB ? new Date(valB).getTime() : 0;
        return sortAsc ? timeA - timeB : timeB - timeA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return result;
  }, [siteBlogs, searchQuery, statusFilter, sortField, sortAsc]);

  // Pagination Slicing
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBlogs.slice(start, start + pageSize);
  }, [filteredBlogs, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / pageSize));

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = siteBlogs.length;
    const published = siteBlogs.filter((b) => b.status === 'Published').length;
    const draft = siteBlogs.filter((b) => b.status === 'Draft').length;
    const scheduled = siteBlogs.filter((b) => b.status === 'Scheduled' || b.status === 'In Review').length;
    return { total, published, draft, scheduled };
  }, [siteBlogs]);

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBlog(null);
    const domainPrefix = currentDomain ? (currentDomain.startsWith('http') ? currentDomain : `https://${currentDomain}`) : 'https://example.com';
    setFormData({
      title: '',
      url: `${domainPrefix}/blog/`,
      focusKeyword: '',
      author: user?.name || 'Content Team',
      publishDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      status: 'Published'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      url: blog.url || '',
      focusKeyword: blog.focusKeyword || '',
      author: blog.author || user?.name || 'Content Team',
      publishDate: blog.publishDate || '',
      lastUpdated: blog.lastUpdated || new Date().toISOString().split('T')[0],
      status: blog.status || 'Draft'
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Page Title is required');
      return;
    }
    if (!formData.url.trim()) {
      toast.error('Blog URL is required');
      return;
    }

    const payload = {
      projectId: currentProjectId,
      domain: currentDomain,
      title: formData.title.trim(),
      url: formData.url.trim(),
      focusKeyword: formData.focusKeyword.trim(),
      secondaryKeyword: editingBlog?.secondaryKeyword || '',
      category: editingBlog?.category || 'General',
      author: formData.author.trim() || 'Admin',
      publishDate: formData.publishDate || null,
      lastUpdated: formData.lastUpdated || new Date().toISOString().split('T')[0],
      status: formData.status
    };

    try {
      if (editingBlog) {
        await updateBlog(editingBlog.id, payload);
        toast.success(`Updated blog "${payload.title}"`);
      } else {
        await addBlog(payload);
        toast.success(`Created blog "${payload.title}"`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Operation failed. Please try again.');
    }
  };

  const handleDeleteBlog = async (blog) => {
    try {
      await softDeleteBlog(blog.id);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Moved &quot;{blog.title}&quot; to Trash</span>
        </div>,
        { duration: 4000 }
      );
    } catch {
      toast.error('Could not delete blog post');
    }
  };

  const handleQuickStatusChange = async (blog, newStatus) => {
    try {
      await updateBlog(blog.id, {
        status: newStatus,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
      toast.success(`Status updated to "${newStatus}"`);
    } catch {
      toast.error('Could not update status');
    }
  };

  const handleExportCSV = () => {
    if (filteredBlogs.length === 0) {
      toast.error('No blogs to export');
      return;
    }

    const headers = [
      'Page Title',
      'Blog URL',
      'Focus Keyword',
      'Author',
      'Publish Date',
      'Last Updated',
      'Status'
    ];

    const rows = filteredBlogs.map((b) => [
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.url || '').replace(/"/g, '""')}"`,
      `"${(b.focusKeyword || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${b.publishDate || ''}"`,
      `"${b.lastUpdated || ''}"`,
      `"${b.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `blogs_${currentDomain}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported blogs to CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0062ff] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Blog Management & Content SEO
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track page titles, target focus keywords, and monitor publishing pipelines.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-[#0062ff]" />
            <span className="text-slate-400">Domain:</span>
            <span className="text-slate-900 dark:text-white font-bold">{currentDomain}</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-blue-600 rounded-xl transition-all cursor-pointer shadow-md shadow-[#0062ff]/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Blog Post</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Blog Posts"
          value={metrics.total}
          icon={Layers}
          iconColor="text-[#0062ff]"
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          badgeText="Active"
        />
        <StatCard
          title="Published Articles"
          value={metrics.published}
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          badgeText="Live in SERP"
        />
        <StatCard
          title="Draft Pipeline"
          value={metrics.draft}
          icon={FileText}
          iconColor="text-amber-500"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          badgeText="In Progress"
        />
        <StatCard
          title="Scheduled / Review"
          value={metrics.scheduled}
          icon={Clock}
          iconColor="text-purple-500"
          iconBg="bg-purple-50 dark:bg-purple-950/50"
          badgeText="Upcoming"
        />
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, URL, focus keyword, author..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Review">In Review</option>
              </select>
            </div>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                <th className="py-3.5 px-4 min-w-[280px]">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Page Title &amp; Blog URL</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[180px]">
                  <button
                    onClick={() => handleSort('focusKeyword')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Focus Keyword</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleSort('author')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Author</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleSort('publishDate')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Publish Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleSort('lastUpdated')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Last Updated</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right min-w-[100px]">
                  <span>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111827]">
              {paginatedBlogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No blog posts found
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {searchQuery || statusFilter !== 'All'
                          ? 'No results match your search filters. Try resetting the filters.'
                          : 'You haven’t created any blog posts for this website yet. Click "Add Blog Post" to get started.'}
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-blue-600 rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add First Blog Post</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((blog) => {
                  const statusConf = STATUS_CONFIG[blog.status] || STATUS_CONFIG['Draft'];
                  return (
                    <tr
                      key={blog.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Page Title & 2. Blog URL */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div
                            onClick={() => handleOpenEditModal(blog)}
                            className="font-bold text-slate-900 dark:text-white hover:text-[#0062ff] dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-2 text-xs sm:text-[13px]"
                            title={blog.title}
                          >
                            {blog.title}
                          </div>
                          {blog.url ? (
                            <a
                              href={blog.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-[#0062ff] dark:hover:text-blue-400 transition-colors max-w-[260px] truncate"
                              title={blog.url}
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{blog.url}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No URL set</span>
                          )}
                        </div>
                      </td>

                      {/* Focus Keyword */}
                      <td className="py-3.5 px-4">
                        {blog.focusKeyword ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-[#0062ff] dark:text-blue-400 text-[11px] font-bold">
                            <KeyRound className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[180px]" title={blog.focusKeyword}>
                              {blog.focusKeyword}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No focus keyword</span>
                        )}
                      </td>

                      {/* 6. Author */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs flex-shrink-0">
                            {(blog.author || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]" title={blog.author}>
                            {blog.author || 'Admin'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Publish Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{formatDisplayDate(blog.publishDate)}</span>
                        </div>
                      </td>

                      {/* 8. Last Updated */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{formatDisplayDate(blog.lastUpdated)}</span>
                        </div>
                      </td>

                      {/* 9. Status */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={blog.status || 'Draft'}
                            onChange={(e) => handleQuickStatusChange(blog, e.target.value)}
                            className={cn(
                              'text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-full border cursor-pointer appearance-none transition-colors focus:outline-none focus:ring-1 focus:ring-[#0062ff]',
                              statusConf.badgeClass
                            )}
                          >
                            <option value="Published" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Published</option>
                            <option value="Draft" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Draft</option>
                            <option value="Scheduled" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Scheduled</option>
                            <option value="In Review" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">In Review</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(blog)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0062ff] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                            title="Edit Blog Post"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
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

        {/* Pagination Controls */}
        {filteredBlogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredBlogs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </Card>

      {/* Add / Edit Blog Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0062ff] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target website: <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDomain}</span> (Synced with DB)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Field 1: Page Title */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Page Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 10 Essential SEO Best Practices for Modern Web Apps in 2026"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                />
              </div>

              {/* Field 2: Blog URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Blog URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/blog/seo-best-practices-2026"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Focus Keyword & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Focus Keyword
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.focusKeyword}
                      onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                      placeholder="e.g. modern seo best practices"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Author
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="e.g. David Kim or Content Team"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Fields 7, 8 & 9: Publish Date, Last Updated & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Last Updated
                  </label>
                  <input
                    type="date"
                    value={formData.lastUpdated}
                    onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff]"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Review">In Review</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#0062ff] hover:bg-blue-600 rounded-xl transition-all cursor-pointer shadow-md shadow-[#0062ff]/20 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingBlog ? 'Save Changes' : 'Create Blog Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
