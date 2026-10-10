import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';
import {
  TrendingUp,
  Activity,
  KeyRound,
  Link2,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useBacklinkStore } from '../store/backlinkStore';
import { seoApi } from '../api/seoApi';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { StatCardSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { formatNumber } from '../utils/formatters';

export function Dashboard() {
  const navigate = useNavigate();
  const { getSelectedWebsite, keywords, loadDbData } = useSEOStore();
  const { backlinks, getProjectSummary, fetchDbBacklinks } = useBacklinkStore();
  const currentWebsite = getSelectedWebsite();

  useEffect(() => {
    loadDbData();
    fetchDbBacklinks(currentWebsite?.id);
  }, [currentWebsite?.id]);

  const activeKeywords = useMemo(() => {
    const currentDom = currentWebsite?.domain ? currentWebsite.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';
    return keywords.filter(
      (k) =>
        !k.deletedAt &&
        (!currentWebsite?.id ||
          k.websiteId === currentWebsite?.id ||
          k.projectId === currentWebsite?.id ||
          (currentWebsite?.id === 'site-1' && (k.projectId === 'p1' || k.websiteId === 'site-1' || !k.websiteId)) ||
          (currentWebsite?.id === 'site-2' && (k.projectId === 'p2' || k.websiteId === 'site-2')) ||
          (currentDom && ((k.url && k.url.toLowerCase().includes(currentDom)) || (k.targetUrl && k.targetUrl.toLowerCase().includes(currentDom)))))
    );
  }, [keywords, currentWebsite]);

  const activeBacklinks = useMemo(() => {
    const currentDom = currentWebsite?.domain ? currentWebsite.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';
    return backlinks.filter(
      (b) =>
        !b.deletedAt &&
        (!currentWebsite?.id ||
          b.projectId === currentWebsite?.id ||
          (currentWebsite?.id === 'site-1' && (b.projectId === 'p1' || b.projectId === 'site-1' || !b.projectId)) ||
          (currentWebsite?.id === 'site-2' && (b.projectId === 'p2' || b.projectId === 'site-2')) ||
          (currentDom && b.submittedUrl && b.submittedUrl.toLowerCase().includes(currentDom)))
    );
  }, [backlinks, currentWebsite]);

  const backlinkSummary = getProjectSummary(currentWebsite?.id || 'site-1');

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboardOverview', currentWebsite?.id, activeKeywords.length, activeBacklinks.length],
    queryFn: () => seoApi.getDashboardOverview(currentWebsite, activeKeywords, activeBacklinks),
    enabled: !!currentWebsite
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load dashboard analytics"
        message={error?.message || 'Error communicating with SERP intelligence engine.'}
        onRetry={refetch}
      />
    );
  }

  const stats = dashboardData?.stats;
  const topKeywords = [...activeKeywords]
    .filter((k) => Number(k.position) > 0)
    .sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999))
    .slice(0, 5);
  const droppedKeywords = [...activeKeywords].filter((k) => Number(k.change) < 0).slice(0, 5);

  const totalKeywordsCount = activeKeywords.length;
  const totalBacklinksCount = activeBacklinks.length;

  const pieData = dashboardData ? [
    { name: 'Critical Issues', value: dashboardData.auditBreakdown.critical, color: '#ef4444' },
    { name: 'Warnings', value: dashboardData.auditBreakdown.warnings, color: '#f59e0b' },
    { name: 'Passed Checks', value: dashboardData.auditBreakdown.passed, color: '#10b981' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/90 via-white to-sky-50/80 dark:from-[#0062ff]/20 dark:via-slate-900/80 dark:to-[#00d2ff]/10 border border-blue-200/80 dark:border-[#0062ff]/30 shadow-sm dark:shadow-xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient decoration */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#0062ff]/10 dark:bg-[#0062ff]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
              SEO Performance Overview
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Tracking rankings, Core Web Vitals, and organic search visibility for{' '}
            <span className="font-bold text-[#0062ff] dark:text-[#38bdf8]">{currentWebsite?.domain}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <span>Team & Ownership</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/keywords?modal=add')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-lg shadow-[#0062ff]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Keywords</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="SEO Health Score"
            value={`${stats?.seoScore || 91}/100`}
            change={stats?.seoScoreChange}
            changeLabel="vs previous audit"
            icon={Activity}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          />
          <StatCard
            title="Monthly Organic Traffic"
            value={formatNumber(stats?.organicTraffic || 198400)}
            change={stats?.trafficChange}
            changeLabel="vs last month"
            icon={TrendingUp}
            iconColor="text-[#0062ff]"
            iconBg="bg-blue-50 dark:bg-[#0062ff]/15"
          />
          <StatCard
            title="Tracked Keywords"
            value={totalKeywordsCount}
            change={totalKeywordsCount > 0 ? `+${totalKeywordsCount}` : 0}
            changeLabel="active keywords"
            icon={KeyRound}
            iconColor="text-cyan-500"
            iconBg="bg-cyan-50 dark:bg-cyan-950/40"
          />
          <StatCard
            title="Total Backlinks"
            value={totalBacklinksCount}
            change={totalBacklinksCount > 0 ? `+${totalBacklinksCount}` : 0}
            changeLabel="in database"
            icon={Link2}
            iconColor="text-sky-500"
            iconBg="bg-sky-50 dark:bg-sky-950/40"
          />
        </div>
      )}

      {/* Main Charts Row: Organic Traffic & Ranking Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organic Traffic Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Organic Traffic & Impressions</CardTitle>
              <CardDescription>Daily estimated clicks vs SERP impressions</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0062ff] shadow-2xs" />
                <span className="text-slate-600 dark:text-slate-400">Clicks (Traffic)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-400 shadow-2xs" />
                <span className="text-slate-600 dark:text-slate-400">Impressions (x10)</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData?.trafficTimeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(51, 65, 85, 0.6)',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="traffic"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#trafficGradient)"
                    name="Organic Traffic"
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#impressionsGradient)"
                    name="SERP Impressions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Site Audit Donut & Score Ring */}
        <Card className="flex flex-col">
          <CardHeader>
            <div>
              <CardTitle>SEO Audit Issues</CardTitle>
              <CardDescription>Breakdown by health severity</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => navigate('/site-audit')}
              className="text-xs font-bold text-[#0062ff] dark:text-[#38bdf8] hover:underline flex items-center gap-1"
            >
              <span>View Audit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid rgba(51, 65, 85, 0.6)',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {dashboardData?.auditBreakdown.healthScore || 82}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Health
                </span>
              </div>
            </div>

            {/* Legend Slices */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/40 dark:border-rose-900/40">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Critical</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                  {dashboardData?.auditBreakdown.critical || 6}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/40 dark:border-amber-900/40">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Warnings</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                  {dashboardData?.auditBreakdown.warnings || 14}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/40 dark:border-emerald-900/40">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Passed</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                  {dashboardData?.auditBreakdown.passed || 42}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keywords Performance Row: Top Gainers vs Drops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Ranking Keywords */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <CardTitle>Top Ranking Keywords</CardTitle>
                <CardDescription>Positions #1 to #10 in SERPs</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/keywords')}
              className="text-xs font-bold text-[#0062ff] dark:text-[#38bdf8] hover:underline"
            >
              All Keywords
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {topKeywords.map((kw) => (
                <div
                  key={kw.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {kw.keyword}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Vol: {formatNumber(kw.volume)}/mo · KD: {kw.difficulty}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      #{kw.position}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      +{Math.abs(kw.change || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dropped Keywords / Opportunities */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <CardTitle>Keywords with Position Drops</CardTitle>
                <CardDescription>Requires immediate on-page attention</CardDescription>
              </div>
            </div>
            <Badge variant="danger" size="xs">
              Action Needed
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {droppedKeywords.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No keyword position drops detected this week! 🎉
                </div>
              ) : (
                droppedKeywords.map((kw) => (
                  <div
                    key={kw.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {kw.keyword}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Vol: {formatNumber(kw.volume)}/mo · Intent: {kw.intent}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        #{kw.position}
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center">
                        {kw.change}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backlink Campaign Progress & Status Widget */}
      <Card className="bg-gradient-to-r from-blue-50/80 via-white to-sky-50/70 dark:from-slate-900 dark:via-[#0062ff]/15 dark:to-slate-900 border-blue-200/80 dark:border-[#0062ff]/20 shadow-sm dark:shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0062ff]/10 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0062ff]/15 dark:bg-[#0062ff]/20 border border-[#0062ff]/30 flex items-center justify-center text-[#0062ff] dark:text-[#38bdf8]">
                <Link2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Backlinks Pipeline for {currentWebsite?.domain}
              </h3>
              <Badge variant="primary" size="xs">
                {backlinkSummary.completionPct}% Completed
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {backlinkSummary.done} of {backlinkSummary.total} backlinks submitted and verified for this project.
              {backlinkSummary.brokenCount > 0 && (
                <span className="text-rose-500 dark:text-rose-400 font-semibold ml-1.5">
                  ({backlinkSummary.brokenCount} broken link{backlinkSummary.brokenCount > 1 ? 's' : ''} require attention)
                </span>
              )}
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-300/60 dark:border-slate-700/60 mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#0062ff] to-[#00d2ff] rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(5, backlinkSummary.completionPct)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-shrink-0">
            <div className="flex items-center gap-4 text-center">
              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Done</p>
                <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">{backlinkSummary.done}</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Undone</p>
                <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">{backlinkSummary.undone}</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50 shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Live Links</p>
                <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">{backlinkSummary.liveCount}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/backlinks')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-lg shadow-[#0062ff]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Manage Backlinks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
