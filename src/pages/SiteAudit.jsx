import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Accessibility,
  Search,
  Code,
  Globe,
  Monitor,
  Smartphone
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { seoApi } from '../api/seoApi';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ScoreRing, getAuditGrade, getAuditScoreColor } from '../components/ScoreRing';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import toast from 'react-hot-toast';

const getScoreTextColor = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (s >= 50) return 'text-orange-500 dark:text-orange-400';
  return 'text-rose-500 dark:text-rose-400';
};

function AuditSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <Skeleton className="w-32 h-32 rounded-full mb-6" />
          <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SiteAudit() {
  const { getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();
  const projectId = currentWebsite?.id;
  const projectDomain = currentWebsite?.domain || currentWebsite?.url || '';

  const [strategy, setStrategy] = useState('desktop'); // 'desktop' | 'mobile'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [selectedIssueForModal, setSelectedIssueForModal] = useState(null);

  const queryClient = useQueryClient();

  // Fetch project audit with React Query
  const {
    data: auditData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['audit', projectId, strategy],
    queryFn: () => seoApi.getProjectAudit(projectId, strategy, false, projectDomain),
    enabled: !!projectId && !!projectDomain,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Re-run mutation calling API with refresh=true
  const rerunMutation = useMutation({
    mutationFn: () => seoApi.getProjectAudit(projectId, strategy, true, projectDomain),
    onSuccess: (newData) => {
      queryClient.setQueryData(['audit', projectId, strategy], newData);
      toast.success(`Audit updated for ${strategy === 'mobile' ? 'Mobile' : 'Desktop'}!`);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to rerun crawler. Please retry.');
    }
  });

  // Empty state when project has no URL
  if (!projectDomain) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Technical Site Audit & Health Crawler
          </h1>
        </div>

        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-12">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Website URL Configured
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
              The currently selected project (<strong>{currentWebsite?.projectName || 'Project'}</strong>) does not have a domain or URL specified. Please add a website URL in Project Settings to run live Google PageSpeed audits.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <AuditSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Technical Site Audit & Health Crawler
          </h1>
        </div>
        <ErrorState
          title="Technical Audit Unavailable"
          message={error?.message || 'Failed to fetch PageSpeed Insights data.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const issues = auditData?.issues || [];

  // Filter issue list by severity and category
  const filteredIssues = issues.filter((iss) => {
    if (activeCategoryFilter === 'critical') return iss.severity === 'critical';
    if (activeCategoryFilter === 'warning') return iss.severity === 'warning';
    if (activeCategoryFilter === 'passed') return iss.severity === 'passed';
    if (activeCategoryFilter === 'seo') return iss.category === 'seo';
    if (activeCategoryFilter === 'performance') return iss.category === 'performance';
    if (activeCategoryFilter === 'accessibility') return iss.category === 'accessibility';
    return true; // 'all'
  });

  // Calculate dynamic tab counts directly from API data
  const tabCounts = {
    all: issues.length,
    critical: auditData?.summary?.critical ?? issues.filter(i => i.severity === 'critical').length,
    warning: auditData?.summary?.warnings ?? issues.filter(i => i.severity === 'warning').length,
    passed: auditData?.summary?.passed ?? issues.filter(i => i.severity === 'passed').length,
    seo: issues.filter(i => i.category === 'seo').length,
    performance: issues.filter(i => i.category === 'performance').length,
    accessibility: issues.filter(i => i.category === 'accessibility').length,
  };

  const formattedCrawledAt = auditData?.crawledAt
    ? new Date(auditData.crawledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : 'Recently';

  const isRefreshing = rerunMutation.isPending || isFetching;

  return (
    <div className="space-y-6">
      {/* Top Header, Strategy Toggle & Re-run Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Technical Site Audit & Health Crawler
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ● Google PageSpeed API
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyzed live technical signals and URLs on <strong className="text-slate-800 dark:text-slate-200 font-semibold">{auditData?.url || projectDomain}</strong>. Last crawled on {formattedCrawledAt}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Mobile / Desktop Strategy Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStrategy('desktop')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                strategy === 'desktop'
                  ? 'bg-white dark:bg-[#111827] text-[#0062ff] dark:text-[#38bdf8] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setStrategy('mobile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                strategy === 'mobile'
                  ? 'bg-white dark:bg-[#111827] text-[#0062ff] dark:text-[#38bdf8] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Re-run Full Audit button */}
          <button
            type="button"
            onClick={() => rerunMutation.mutate()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Auditing with Google PSI...' : 'Re-run Full Audit'}</span>
          </button>
        </div>
      </div>

      {/* Health Score Ring & Category Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Score Ring Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing
            score={auditData?.healthScore ?? 0}
            size={130}
            strokeWidth={11}
            label="SEO Health Score"
            sublabel="Overall site technical rating"
            showGrade={true}
            useLetterGrades={true}
          />

          <div className="w-full grid grid-cols-3 gap-1.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Critical</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary?.critical ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Warnings</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary?.warnings ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Passed</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary?.passed ?? 0}
              </p>
            </div>
          </div>
        </Card>

        {/* 3 Category Breakdown Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* On-Page SEO */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">On-Page SEO</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-[#0062ff]/15 text-[#0062ff] dark:text-[#38bdf8]">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className={`text-3xl font-extrabold ${getScoreTextColor(auditData?.categories?.onPage?.score)}`}>
                {auditData?.categories?.onPage?.score ?? 0}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories?.onPage?.critical ?? 0} critical • {auditData?.categories?.onPage?.warnings ?? 0} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('seo')}
              className="text-xs font-bold text-[#0062ff] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect issues</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>

          {/* Performance */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className={`text-3xl font-extrabold ${getScoreTextColor(auditData?.categories?.performance?.score)}`}>
                {auditData?.categories?.performance?.score ?? 0}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories?.performance?.critical ?? 0} critical • {auditData?.categories?.performance?.warnings ?? 0} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('performance')}
              className="text-xs font-bold text-[#0062ff] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect issues</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>

          {/* Accessibility & A11y */}
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accessibility & A11Y</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Accessibility className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className={`text-3xl font-extrabold ${getScoreTextColor(auditData?.categories?.accessibility?.score)}`}>
                {auditData?.categories?.accessibility?.score ?? 0}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories?.accessibility?.critical ?? 0} critical • {auditData?.categories?.accessibility?.warnings ?? 0} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('accessibility')}
              className="text-xs font-bold text-[#0062ff] dark:text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect issues</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>
        </div>
      </div>

      {/* Filter Tabs for Issue List */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Issues', count: tabCounts.all },
          { id: 'critical', label: 'Critical Only', count: tabCounts.critical },
          { id: 'warning', label: 'Warnings', count: tabCounts.warning },
          { id: 'passed', label: 'Passed Checks', count: tabCounts.passed },
          { id: 'seo', label: 'SEO', count: tabCounts.seo },
          { id: 'performance', label: 'Performance', count: tabCounts.performance },
          { id: 'accessibility', label: 'Accessibility', count: tabCounts.accessibility }
        ].map((tab) => {
          const isSelected = activeCategoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0062ff] text-white border-[#0062ff] shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Issue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIssues.map((issue) => {
          const isCrit = issue.severity === 'critical';
          const isWarn = issue.severity === 'warning';
          const isPass = issue.severity === 'passed';

          return (
            <div
              key={`${issue.id}_${issue.category}`}
              onClick={() => setSelectedIssueForModal(issue)}
              className="p-5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0062ff]/40 dark:hover:border-[#0062ff]/40 shadow-xs cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCrit && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0062ff] dark:group-hover:text-[#38bdf8] transition-colors truncate">
                      {issue.title}
                    </h3>
                  </div>

                  <Badge
                    variant={isCrit ? 'danger' : isWarn ? 'warning' : 'success'}
                    size="sm"
                  >
                    {issue.severity}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {issue.description}
                </p>

                {issue.displayValue && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-sans text-[10px] uppercase font-semibold">Value:</span>
                    <span className="font-semibold">{issue.displayValue}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {issue.category === 'seo' ? 'SEO' : issue.category === 'performance' ? 'Performance' : 'Accessibility'}
                </span>
                <span className="text-[#0062ff] dark:text-[#38bdf8] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredIssues.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-10 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No issues found for this filter
            </p>
            <p className="text-xs text-slate-400 mt-1">
              All checks in this category or severity have passed.
            </p>
          </div>
        )}
      </div>

      {/* ISSUE DETAILS MODAL */}
      <Modal
        isOpen={!!selectedIssueForModal}
        onClose={() => setSelectedIssueForModal(null)}
        title={selectedIssueForModal?.title}
        description={selectedIssueForModal?.description}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                selectedIssueForModal?.severity === 'critical'
                  ? 'danger'
                  : selectedIssueForModal?.severity === 'warning'
                  ? 'warning'
                  : 'success'
              }
            >
              {selectedIssueForModal?.severity?.toUpperCase()}
            </Badge>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Category: {selectedIssueForModal?.category}
            </span>
          </div>

          {selectedIssueForModal?.displayValue && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recorded Metric Value
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {selectedIssueForModal.displayValue}
              </span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-[#0062ff]/10 border border-blue-200 dark:border-[#0062ff]/30">
            <div className="flex items-center gap-2 text-[#0062ff] dark:text-[#38bdf8] font-bold text-xs mb-1.5">
              <Code className="w-4 h-4" />
              <span>Diagnostic Information & Recommendation:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedIssueForModal?.description || 'Ensure this check satisfies Google Lighthouse web quality standards.'}
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Audit Check ID: <code className="font-mono text-slate-600 dark:text-slate-300">{selectedIssueForModal?.id}</code>
          </div>
        </div>
      </Modal>
    </div>
  );
}
