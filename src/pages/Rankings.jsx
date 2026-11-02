import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import {
  Search,
  Globe,
  MousePointerClick,
  Eye,
  Percent,
  Hash,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { GSCConnectModal } from '../components/GSCConnectModal';
import { seoApi } from '../api/seoApi';

export function Rankings() {
  const { keywords, getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();
  const siteKeywords = keywords.filter(
    (k) =>
      !k.deletedAt &&
      (k.websiteId === currentWebsite?.id ||
        k.projectId === currentWebsite?.id ||
        (currentWebsite?.domain && k.url?.toLowerCase().includes(currentWebsite.domain.toLowerCase())))
  );

  // Position distribution brackets
  const distributionData = [
    { bracket: 'Top 1-3', count: siteKeywords.filter((k) => k.position <= 3).length, color: '#10b981' },
    { bracket: 'Top 4-10', count: siteKeywords.filter((k) => k.position >= 4 && k.position <= 10).length, color: '#6366f1' },
    { bracket: 'Top 11-20', count: siteKeywords.filter((k) => k.position >= 11 && k.position <= 20).length, color: '#38bdf8' },
    { bracket: 'Top 21-50', count: siteKeywords.filter((k) => k.position >= 21 && k.position <= 50).length, color: '#f59e0b' },
    { bracket: 'Top 51-100', count: siteKeywords.filter((k) => k.position >= 51 && k.position <= 100).length, color: '#94a3b8' },
  ];

  // Google Search Console (GSC) States
  const [gscStatus, setGscStatus] = useState(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscTotals, setGscTotals] = useState(null);
  const [gscDaily, setGscDaily] = useState([]);
  const [gscQueries, setGscQueries] = useState([]);
  const [gscDateRange, setGscDateRange] = useState('3months'); // '28days' | '3months' | '6months'
  const [isGSCModalOpen, setIsGSCModalOpen] = useState(false);
  const [queryFilter, setQueryFilter] = useState('');
  const [showClicks, setShowClicks] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);
  const [selectedGscProperty, setSelectedGscProperty] = useState('');

  // Calculate start & end date strings
  const getDateRangeParams = useCallback((rangeKey) => {
    const end = new Date();
    const start = new Date();
    if (rangeKey === '28days') {
      start.setDate(end.getDate() - 28);
    } else if (rangeKey === '6months') {
      start.setMonth(end.getMonth() - 6);
    } else {
      // 3months default
      start.setDate(end.getDate() - 90);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, []);

  // Fetch GSC data for a given siteUrl
  const loadGSCData = useCallback(async (siteUrl, rangeKey = gscDateRange) => {
    if (!siteUrl) return;
    setGscLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams(rangeKey);

      // 1. Fetch daily performance (totals + timeline)
      const dailyRes = await seoApi.queryGSC({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['date']
      });

      // 2. Fetch top search queries
      const queryRes = await seoApi.queryGSC({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 100
      });

      setGscTotals(dailyRes.totals || null);
      setGscDaily(dailyRes.rows || []);
      setGscQueries(queryRes.rows || []);
    } catch (err) {
      console.warn('Error fetching GSC data:', err);
      setGscTotals(null);
      setGscDaily([]);
      setGscQueries([]);
    } finally {
      setGscLoading(false);
    }
  }, [getDateRangeParams, gscDateRange]);

  // Check GSC status on mount & domain change
  const refreshGSCStatus = useCallback(async () => {
    const currentDomain = currentWebsite?.domain || '';
    if (!currentDomain) {
      setGscStatus({ connected: false });
      setSelectedGscProperty('');
      setGscTotals(null);
      setGscDaily([]);
      setGscQueries([]);
      return;
    }

    try {
      const statusRes = await seoApi.getGSCStatus(currentDomain);
      setGscStatus(statusRes);

      // Strictly verify that the CURRENT domain is verified for this GSC account
      if (statusRes.isDomainVerified && statusRes.matchedSiteUrl) {
        setSelectedGscProperty(statusRes.matchedSiteUrl);
        await loadGSCData(statusRes.matchedSiteUrl, gscDateRange);
      } else {
        // Domain not connected to GSC: do NOT show data from other websites/projects!
        setSelectedGscProperty('');
        setGscTotals(null);
        setGscDaily([]);
        setGscQueries([]);
      }
    } catch (e) {
      console.warn('Failed to refresh GSC status:', e);
      setGscStatus({ connected: false });
      setSelectedGscProperty('');
      setGscTotals(null);
      setGscDaily([]);
      setGscQueries([]);
    }
  }, [currentWebsite?.domain, loadGSCData, gscDateRange]);

  useEffect(() => {
    refreshGSCStatus();
  }, [currentWebsite?.domain, gscDateRange]);

  // Is GSC verified and connected specifically for the current project
  const isProjectConnected = Boolean(gscStatus?.isDomainVerified && selectedGscProperty);

  // Filtered and sorted queries
  const filteredQueries = useMemo(() => {
    let list = [...gscQueries];
    if (queryFilter.trim()) {
      const q = queryFilter.toLowerCase();
      list = list.filter((item) => (item.query || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (b.clicks || 0) - (a.clicks || 0) || (b.impressions || 0) - (a.impressions || 0));
  }, [gscQueries, queryFilter]);

  // Formatted daily chart data for Recharts
  const formattedDailyChart = useMemo(() => {
    return gscDaily.map((item) => {
      const d = item.date || '';
      const parts = d.split('-');
      const label = parts.length === 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : d;
      return {
        ...item,
        displayDate: label
      };
    });
  }, [gscDaily]);

  // Custom high-contrast Tooltip for Distribution Bar Chart
  const CustomDistributionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-white mb-1.5">{label}</p>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.payload?.color || '#38bdf8' }}
            />
            <span className="text-slate-300 font-medium">Keyword Count:</span>
            <span className="font-extrabold text-white text-sm">{item.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom high-contrast Tooltip for Google Search Console Daily Chart
  const CustomGSCTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const fullDate = payload[0]?.payload?.date || label;
      return (
        <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-white mb-2">{fullDate}</p>
          <div className="space-y-1.5 text-xs">
            {payload.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}:
                </span>
                <span className="font-extrabold text-white text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Page Header with GSC Quick Connect Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Rankings & Google Search Console
            </h1>
            <Badge variant="primary" size="xs">
              Live SERP Intelligence
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real search positions, click-through distribution, and official Google Search Console queries for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {currentWebsite?.domain || 'your domain'}
            </span>.
          </p>
        </div>

        {/* GSC Action Header Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsGSCModalOpen(true)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isProjectConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-100'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {isProjectConnected ? 'GSC Connected' : 'Connect Search Console'}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: GOOGLE SEARCH CONSOLE REAL PERFORMANCE HERO */}
      {/* ========================================================= */}
      {isProjectConnected ? (
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-md">
          <CardHeader className="flex items-center justify-end gap-3 pb-2 pt-4 px-6">
            {/* Date range filter pills */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
                {[
                  { key: '28days', label: '28 days' },
                  { key: '3months', label: '3 months' },
                  { key: '6months', label: '6 months' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGscDateRange(key)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      gscDateRange === key
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => loadGSCData(selectedGscProperty, gscDateRange)}
                disabled={gscLoading}
                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh Google Search Console data"
              >
                <RefreshCw className={`w-4 h-4 ${gscLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* GSC 4 Main KPI Cards (Styled after Google Search Console) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Total Clicks */}
            <div
              onClick={() => setShowClicks(!showClicks)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                showClicks
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showClicks}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Clicks</span>
                </div>
                <MousePointerClick className="w-4 h-4 opacity-80" />
              </div>
              <div className="mt-2.5 text-3xl font-black">
                {gscTotals ? gscTotals.clicks.toLocaleString() : gscLoading ? '...' : '0'}
              </div>
            </div>

            {/* 2. Total Impressions */}
            <div
              onClick={() => setShowImpressions(!showImpressions)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                showImpressions
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/25'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showImpressions}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Impressions</span>
                </div>
                <Eye className="w-4 h-4 opacity-80" />
              </div>
              <div className="mt-2.5 text-3xl font-black">
                {gscTotals ? gscTotals.impressions.toLocaleString() : gscLoading ? '...' : '0'}
              </div>
            </div>

            {/* 3. Average CTR */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Average CTR
                </span>
                <Percent className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2.5 text-3xl font-black text-slate-900 dark:text-white">
                {gscTotals?.avgCtr != null ? `${gscTotals.avgCtr}%` : gscLoading ? '...' : '—'}
              </div>
            </div>

            {/* 4. Average Position */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Average Position
                </span>
                <Hash className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2.5 text-3xl font-black text-slate-900 dark:text-white">
                {gscTotals?.avgPosition != null && gscTotals.avgPosition > 0
                  ? gscTotals.avgPosition
                  : gscLoading
                  ? '...'
                  : '—'}
              </div>
            </div>
          </div>

          {/* Clicks & Impressions Daily Timeline Line Chart */}
          {formattedDailyChart.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedDailyChart} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<CustomGSCTooltip />} />
                  {showClicks && (
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      name="Clicks"
                      dot={{ r: 2, fill: '#2563eb' }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {showImpressions && (
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Impressions"
                      dot={{ r: 2, fill: '#8b5cf6' }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
              <Globe className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedGscProperty
                  ? `No search queries logged in this period for ${selectedGscProperty}`
                  : 'Google Search Console Not Connected'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Connect your Google Search Console service account or OAuth token to load real-time organic clicks, impressions, and query rankings.
              </p>
              <button
                type="button"
                onClick={() => setIsGSCModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Connect Search Console
              </button>
            </div>
          )}

          {/* Top Search Queries Table */}
          {gscQueries.length > 0 && (
            <div className="mt-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/30">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Google Search Queries</span>
                    <Badge variant="primary" size="xs">
                      {filteredQueries.length} Queries
                    </Badge>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official search terms that brought users to {selectedGscProperty || 'your website'}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search queries..."
                    value={queryFilter}
                    onChange={(e) => setQueryFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Top Query</th>
                      <th className="py-3 px-4 text-center">Clicks</th>
                      <th className="py-3 px-4 text-center">Impressions</th>
                      <th className="py-3 px-4 text-center">CTR</th>
                      <th className="py-3 px-4 text-center">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredQueries.map((row, idx) => (
                      <tr
                        key={row.query || idx}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="text-slate-400 font-normal w-5">{idx + 1}.</span>
                          <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                            {row.query}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            {row.clicks}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                          {row.impressions}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-emerald-600 dark:text-emerald-400">
                          {row.ctr}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              row.position <= 3
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : row.position <= 10
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            #{row.position}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800/80 shadow-md">
          <CardContent className="pt-6">
            <div className="py-10 px-4 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
              <Globe className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Google Search Console is not connected for {currentWebsite?.domain || 'this project'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
                Connect your Google Search Console credentials for{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentWebsite?.domain || 'this project'}
                </span>{' '}
                to view its official organic clicks, search impressions, and keyword query rankings.
              </p>
              <button
                type="button"
                onClick={() => setIsGSCModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer inline-flex items-center gap-2"
              >
                <Globe className="w-3.5 h-3.5" />
                Connect Search Console for {currentWebsite?.domain || 'Project'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: TRACKED KEYWORDS RANKING DISTRIBUTION */}
      {/* ========================================================= */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tracked Keywords Ranking Distribution</CardTitle>
            <CardDescription>Number of tracked keywords in each position bucket</CardDescription>
          </div>
          <Badge variant="primary">Total: {siteKeywords.length} Keywords</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="bracket"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomDistributionTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Keyword Count">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* GSC Connect Modal */}
      <GSCConnectModal
        isOpen={isGSCModalOpen}
        onClose={() => setIsGSCModalOpen(false)}
        onConnected={refreshGSCStatus}
        currentDomain={currentWebsite?.domain || ''}
      />
    </div>
  );
}

