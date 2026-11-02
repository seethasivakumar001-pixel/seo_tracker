import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  Users,
  Clock,
  Target,
  Globe,
  ExternalLink,
  Search,
  ArrowUpRight,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Flame,
  Plus,
  RefreshCw
} from 'lucide-react';
import { seoApi } from '../api/seoApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Badge } from './Badge';
import { GA4ConnectModal } from './GA4ConnectModal';
import { cn } from '../utils/cn';

export function GA4OrganicSection({ currentDomain }) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [chartMetricTab, setChartMetricTab] = useState('traffic'); // 'traffic' | 'conversion'
  const [pageSearch, setPageSearch] = useState('');
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  const {
    data: ga4Data,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['ga4-report', currentDomain],
    queryFn: () => seoApi.getGA4Report({ domain: currentDomain }),
    staleTime: 1000 * 60 * 5,
  });

  const isConfigured = Boolean(ga4Data?.propertyId || ga4Data?.isConfigured);
  const isConnected = Boolean(ga4Data?.connected);
  const queryError = ga4Data?.queryError;
  const enableUrl = ga4Data?.enableUrl || 'https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=58100415026';
  const serviceEmail = ga4Data?.serviceEmail || 'reddybook@aerobic-name-512309-u1.iam.gserviceaccount.com';

  const activeData = (showDemoPreview && ga4Data?.mockPreview) ? ga4Data.mockPreview : ga4Data;
  const totals = activeData?.totals || {};
  const timeline = activeData?.timeline || [];
  const landingPages = activeData?.landingPages || [];

  const filteredPages = landingPages.filter((p) =>
    p.pagePath.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // If loading telemetry for current domain:
  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center min-h-[160px]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Checking Google Analytics status for {currentDomain || 'project'}...
          </span>
        </div>
      </div>
    );
  }

  // If this specific domain is NOT configured with a GA4 property ID:
  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-sm">
              <BarChart3 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Not Connected for {currentDomain || 'this project'}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Google Analytics 4 (GA4) Not Linked to {currentDomain}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Post-click organic sessions, conversions, engagement duration, and landing pages are strictly isolated per website. Connect the GA4 Property ID specifically for <strong>{currentDomain}</strong> to start streaming real analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Organic Sessions</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Track true visits from Google Organic search.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Engagement Rate</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Measure time spent and bounce retention.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Conversion Funnel</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Monitor lead signups, goals, and purchases.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Connect GA4 Property for {currentDomain}</span>
              </button>
            </div>
          </div>
        </div>

        {/* GA4 Connection Modal */}
        <GA4ConnectModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          onConnected={() => refetch()}
          currentDomain={currentDomain}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Google Analytics 4 (GA4) · Post-Click Organic Intelligence
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live GA4 Stream
                </span>
              ) : showDemoPreview ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Demo Preview Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  API Setup Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Tracking post-click organic traffic for <strong>{currentDomain}</strong> from Google Analytics 4 Property <code>{ga4Data?.propertyId}</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsConnectModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <BarChart3 className="w-4 h-4" />
          <span>GA4 Settings</span>
        </button>
      </div>

      {queryError && (
        <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <span>Action Required: Enable Google Analytics Data API in Google Cloud</span>
                  <Badge variant="warning" size="xs">Google Cloud 403</Badge>
                </h4>
                <div className="flex items-center gap-2">
                  {ga4Data?.mockPreview && (
                    <button
                      type="button"
                      onClick={() => setShowDemoPreview(!showDemoPreview)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                        showDemoPreview
                          ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                          : "bg-amber-200/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-300/80"
                      )}
                    >
                      {showDemoPreview ? '✓ Showing Demo Data' : 'Preview Demo Data'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-blue-600")} />
                    <span>Check Again</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Property ID <code className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 font-bold">{ga4Data?.propertyId}</code> is linked to <strong>{currentDomain}</strong>. However, Google returned an error:
              </p>
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 text-xs font-mono text-amber-950 dark:text-amber-200 leading-normal break-words">
                {queryError}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                How to resolve this (takes 1 minute):
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>
                  Click the <strong>"Enable API in Google Cloud"</strong> button on the right.
                </li>
                <li>
                  In Google Cloud Console, click the blue <strong>"ENABLE"</strong> button for <em>Google Analytics Data API</em>.
                </li>
                <li>
                  In Google Analytics (Admin &gt; Property Access Management), ensure <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">{serviceEmail}</code> has <strong>Viewer</strong> role.
                </li>
                <li>
                  Wait 1-2 minutes for Google Cloud to propagate, then click <strong>"Check Again"</strong> above.
                </li>
              </ol>
            </div>
            <a
              href={enableUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer self-start md:self-auto"
            >
              <span>Enable API in Google Cloud</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* 4 Core GA4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Organic Sessions & Users */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Organic Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totals.organicSessions ? totals.organicSessions.toLocaleString() : '0'}
            </span>
            {totals.sessionsChange ? (
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                +{totals.sessionsChange}%
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Unique Organic Visitors:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
              {totals.organicUsers ? totals.organicUsers.toLocaleString() : '0'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: totals.organicSessions > 0 ? '75%' : '0%' }} />
          </div>
        </div>

        {/* Metric 2: Engagement Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Engagement Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totals.engagementRate || 0}%
            </span>
            {totals.engagementRate > 60 ? (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                High Intent
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Industry Benchmark:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">54.0%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totals.engagementRate || 0}%` }} />
          </div>
        </div>

        {/* Metric 3: Time Spent / Session Duration */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Time Spent on Site
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totals.avgSessionDuration || '0s'}
            </span>
            <span className="text-xs font-semibold text-slate-400">avg / session</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Avg Engagement Time:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{totals.avgDurationSeconds || 0} seconds</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: totals.avgDurationSeconds > 0 ? '68%' : '0%' }} />
          </div>
        </div>

        {/* Metric 4: Conversions, Leads & Purchases */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Organic Conversions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totals.conversions ? totals.conversions.toLocaleString() : '0'}
            </span>
            {totals.conversionsChange ? (
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                +{totals.conversionsChange}%
              </span>
            ) : null}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Organic Conversion Rate:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
              {totals.conversionRate || '0.0%'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: totals.conversions > 0 ? '82%' : '0%' }} />
          </div>
        </div>
      </div>

      {/* Main Charts & Landing Pages Row */}
      {timeline.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* GA4 Post-Click Trend Chart (3 Cols) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div>
                  <CardTitle>Organic Search Engagement Trends</CardTitle>
                  <CardDescription>Daily post-click retention &amp; conversion velocity</CardDescription>
                </div>

                {/* Toggle metric tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChartMetricTab('traffic')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      chartMetricTab === 'traffic'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Sessions &amp; Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetricTab('conversion')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      chartMetricTab === 'conversion'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Conversions &amp; Engagement
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMetricTab === 'traffic' ? (
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#sessionsGrad)" name="Organic Sessions" />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#usersGrad)" name="Total Users" />
                    </AreaChart>
                  ) : (
                    <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                      <RechartsTooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Conversions" />
                      <Line yAxisId="right" type="monotone" dataKey="engagementRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Engagement Rate %" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Organic Conversion Funnel (2 Cols) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Organic Conversion Funnel</CardTitle>
              <CardDescription>Post-click efficiency breakdown</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Step 1 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">1. Organic Visits Landed</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                    {totals.organicSessions ? totals.organicSessions.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[10px] text-slate-400">100% of organic search traffic</span>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">2. Engaged Sessions (&gt;10s / 2+ pages)</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {totals.organicSessions && totals.engagementRate ? Math.round((totals.organicSessions * totals.engagementRate) / 100).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totals.engagementRate || 0}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">{totals.engagementRate || 0}% engagement retention</span>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">3. Conversions &amp; Leads Completed</span>
                  <span className="font-mono font-extrabold text-amber-500">
                    {totals.conversions ? totals.conversions.toLocaleString() : '0'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: totals.conversions > 0 ? '38%' : '0%' }} />
                </div>
                <span className="text-[10px] text-slate-400">{totals.conversionRate || '0.0%'} organic conversion rate</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Landing Pages Receiving Organic Visitors */}
      {landingPages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div>
                <CardTitle>Landing Pages Receiving Organic Visitors</CardTitle>
                <CardDescription>
                  Post-click performance broken down by individual entry URL from Google Search
                </CardDescription>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter landing pages..."
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-5 py-3">Landing Page URL</th>
                    <th className="px-4 py-3 text-right">Organic Sessions</th>
                    <th className="px-4 py-3 text-right">Unique Users</th>
                    <th className="px-4 py-3 text-right">Engagement Rate</th>
                    <th className="px-4 py-3 text-right">Avg Time Spent</th>
                    <th className="px-4 py-3 text-right">Conversions</th>
                    <th className="px-5 py-3 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredPages.map((page, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {page.pagePath}
                          </span>
                          <a
                            href={`https://${currentDomain || 'example.com'}${page.pagePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-indigo-500"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {page.sessions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                        {page.users.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-500">
                        {page.engagementRate}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                        {page.avgDuration}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-amber-500">
                        {page.conversions.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px]">
                          {page.conversionRate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GA4 Connection Modal */}
      <GA4ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => refetch()}
        currentDomain={currentDomain}
      />
    </div>
  );
}
