import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Check,
  X
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { seoApi } from '../api/seoApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { ScoreRing } from '../components/ScoreRing';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import toast from 'react-hot-toast';

export function SiteAudit() {
  const { getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();
  const [selectedIssueForModal, setSelectedIssueForModal] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const {
    data: auditData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['siteAudit', currentWebsite?.id],
    queryFn: () => seoApi.getSiteAudit(currentWebsite?.id),
    enabled: !!currentWebsite
  });

  const rerunMutation = useMutation({
    mutationFn: () => seoApi.reRunAudit(currentWebsite?.id),
    onSuccess: () => {
      refetch();
      toast.success('Site audit crawl finished! Health score updated.');
    },
    onError: () => {
      toast.error('Failed to rerun crawler. Please retry.');
    }
  });

  if (isLoading) {
    return <TableSkeleton rows={8} cols={4} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Audit data unavailable"
        message={error?.message || 'Failed to fetch crawl records.'}
        onRetry={refetch}
      />
    );
  }

  const issues = auditData?.issues || [];
  const filteredIssues = issues.filter((iss) => {
    if (activeCategoryFilter === 'critical') return iss.severity === 'critical';
    if (activeCategoryFilter === 'warning') return iss.severity === 'warning';
    if (activeCategoryFilter === 'passed') return iss.severity === 'passed';
    if (activeCategoryFilter === 'seo') return iss.category === 'SEO';
    if (activeCategoryFilter === 'performance') return iss.category === 'Performance';
    if (activeCategoryFilter === 'accessibility') return iss.category === 'Accessibility';
    return true; // 'all'
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Re-run Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Technical Site Audit & Health Crawler
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analyzed {auditData?.totalPagesCrawled || 248} URLs on {currentWebsite?.domain}. Last crawled on {new Date(auditData?.crawlDate).toLocaleDateString('en-US')}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => rerunMutation.mutate()}
          disabled={rerunMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rerunMutation.isPending ? 'animate-spin' : ''}`} />
          <span>{rerunMutation.isPending ? 'Crawling 248 URLs...' : 'Re-run Full Audit'}</span>
        </button>
      </div>

      {/* Health Score Ring & Category Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Score Ring Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing
            score={auditData?.overallHealthScore || 82}
            size={130}
            strokeWidth={11}
            label="SEO Health Score"
            sublabel="Overall site technical rating"
            showGrade={true}
          />

          <div className="w-full grid grid-cols-3 gap-1.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <p className="text-[10px] font-bold text-rose-500 uppercase">Critical</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary.criticalCount || 6}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase">Warnings</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary.warningCount || 14}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Passed</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {auditData?.summary.passedCount || 22}
              </p>
            </div>
          </div>
        </Card>

        {/* 3 Category Breakdown Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">On-Page SEO</span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {auditData?.categories.seo.score || 85}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories.seo.critical} critical • {auditData?.categories.seo.warnings} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('seo')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Inspect issues</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Performance</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {auditData?.categories.performance.score || 76}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories.performance.critical} critical • {auditData?.categories.performance.warnings} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('performance')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Inspect issues</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Accessibility & A11y</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Accessibility className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {auditData?.categories.accessibility.score || 79}%
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {auditData?.categories.accessibility.critical} critical • {auditData?.categories.accessibility.warnings} warnings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('accessibility')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
          { id: 'all', label: 'All Issues' },
          { id: 'critical', label: 'Critical Only', count: auditData?.summary.criticalCount },
          { id: 'warning', label: 'Warnings', count: auditData?.summary.warningCount },
          { id: 'passed', label: 'Passed Checks', count: auditData?.summary.passedCount },
          { id: 'seo', label: 'SEO' },
          { id: 'performance', label: 'Performance' },
          { id: 'accessibility', label: 'Accessibility' }
        ].map((tab) => {
          const isSelected = activeCategoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#0062ff] text-white border-[#0062ff] shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  ({tab.count})
                </span>
              )}
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
              key={issue.id}
              onClick={() => setSelectedIssueForModal(issue)}
              className="p-5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isCrit && <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {issue.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {issue.affectedPagesCount > 0 ? `${issue.affectedPagesCount} affected URLs` : 'All 248 pages passed'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Inspect pages <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AFFECTED PAGES & HOW-TO-FIX MODAL */}
      <Modal
        isOpen={!!selectedIssueForModal}
        onClose={() => setSelectedIssueForModal(null)}
        title={selectedIssueForModal?.title}
        description={selectedIssueForModal?.description}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* How to fix hint banner */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs mb-1">
              <Code className="w-4 h-4" />
              <span>Recommended Fix:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {selectedIssueForModal?.howToFix}
            </p>
          </div>

          {/* List of Affected URLs */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Affected URLs ({selectedIssueForModal?.pages?.length || 0})
            </h4>

            {(!selectedIssueForModal?.pages || selectedIssueForModal.pages.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No affected URLs for this check. Everything is compliant.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {selectedIssueForModal.pages.map((pg, idx) => (
                  <div key={idx} className="p-3.5 bg-white dark:bg-[#111827] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <a
                        href={pg.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold truncate max-w-lg"
                      >
                        <span>{pg.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                        HTTP {pg.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Issue:</strong> {pg.detail}
                    </p>

                    {pg.recommendation && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                        <strong>Action:</strong> {pg.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
