import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Calendar,
  Globe,
  CheckCircle2,
  TrendingUp,
  Activity,
  KeyRound,
  Link2
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useBacklinkStore } from '../store/backlinkStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { formatNumber, formatPercent } from '../utils/formatters';
import { exportToExcel, exportToPDF, exportToCSV } from '../utils/exportHelpers';
import toast from 'react-hot-toast';

export function Reports() {
  const {
    websites,
    selectedWebsiteId,
    setSelectedWebsiteId,
    getSelectedWebsite,
    keywords,
    dateRange
  } = useSEOStore();
  const { backlinks } = useBacklinkStore();

  const currentWebsite = getSelectedWebsite();
  const siteKeywords = keywords.filter(
    (k) =>
      !k.deletedAt &&
      (!currentWebsite?.id ||
        k.websiteId === currentWebsite?.id ||
        k.projectId === currentWebsite?.id ||
        (currentWebsite?.id === 'site-1' && (k.projectId === 'p1' || k.websiteId === 'site-1' || !k.websiteId)) ||
        (currentWebsite?.id === 'site-2' && (k.projectId === 'p2' || k.websiteId === 'site-2')))
  );

  const siteBacklinks = backlinks.filter(
    (b) =>
      !b.deletedAt &&
      (!currentWebsite?.id ||
        b.projectId === currentWebsite?.id ||
        (currentWebsite?.id === 'site-1' && (b.projectId === 'p1' || b.projectId === 'site-1' || !b.projectId)) ||
        (currentWebsite?.id === 'site-2' && (b.projectId === 'p2' || b.projectId === 'site-2')))
  );

  const [includedSections, setIncludedSections] = useState({
    seoHealth: true,
    keywords: true,
    traffic: true,
    audit: true,
    backlinks: true
  });

  const toggleSection = (key) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportPDF = () => {
    const headers = ['Metric Category', 'Key Finding', 'Value', 'Change/Status'];
    const data = [
      ['SEO Health', 'Technical Crawl Score', `${currentWebsite?.seoScore || 91}/100`, 'Passed (Optimal)'],
      ['Organic Traffic', 'Estimated Monthly Visits', formatNumber(currentWebsite?.organicTraffic || 198400), `+${currentWebsite?.trafficChange || 18.4}%`],
      ['Keywords', 'Tracked Top 3 Keywords', `${siteKeywords.filter(k => Number(k.position) > 0 && Number(k.position) <= 3).length} keywords`, 'Dominating'],
      ['Keywords', 'Tracked Top 10 Keywords', `${siteKeywords.filter(k => Number(k.position) > 0 && Number(k.position) <= 10).length} keywords`, '+4 this month'],
      ['Backlinks', 'Total Inbound Links', `${siteBacklinks.length} backlinks`, `${siteBacklinks.length > 0 ? '+15.8%' : '0%'}`],
      ['Referring Domains', 'Unique Domain Sources', `${currentWebsite?.referringDomains || 1240}`, '+8.1% growth'],
      ['Domain Authority', 'Domain Rating (DR)', `DR ${currentWebsite?.domainRating || 68}`, 'Strong Equity']
    ];

    exportToPDF({
      title: 'Enterprise SEO Performance & Visibility Intelligence Report',
      subtitle: `Domain: ${currentWebsite?.domain} | Date Range: ${dateRange.label} (${dateRange.startDate} to ${dateRange.endDate})`,
      website: currentWebsite?.domain,
      headers,
      data,
      filename: `SysCorp_Report_${currentWebsite?.domain}`
    });
    toast.success('Downloaded Executive PDF Report');
  };

  const handleExportExcel = () => {
    const exportData = siteKeywords.map((k) => ({
      Domain: currentWebsite?.domain,
      Keyword: k.keyword,
      'Current Position': k.position,
      'Previous Position': k.previousPosition,
      Variance: k.change > 0 ? `+${k.change}` : k.change,
      'Search Volume': k.volume,
      Difficulty: k.difficulty,
      CPC: `$${k.cpc}`,
      'Target URL': k.targetUrl,
      Group: k.group
    }));

    exportToExcel(exportData, `SysCorp_SEO_Report_${currentWebsite?.domain}`);
    toast.success('Exported Excel Report');
  };

  const handleExportCSV = () => {
    const exportData = siteKeywords.map((k) => ({
      Domain: currentWebsite?.domain,
      Keyword: k.keyword,
      Position: k.position,
      Change: k.change,
      Volume: k.volume,
      Difficulty: k.difficulty,
      TargetURL: k.targetUrl
    }));

    exportToCSV(exportData, `SysCorp_SEO_Report_${currentWebsite?.domain}`);
    toast.success('Exported CSV Report');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SEO Intelligence & Executive Reports Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compile customized analytics reports for clients and stakeholders with 1-click PDF, Excel, and CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Report Customizer Controls */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Report Parameters & Modules</CardTitle>
            <CardDescription>Select which metrics sections to compile</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'seoHealth', label: 'SEO Health Score', icon: Activity },
              { id: 'keywords', label: 'Keyword Rankings', icon: KeyRound },
              { id: 'traffic', label: 'Organic Traffic', icon: TrendingUp },
              { id: 'audit', label: 'Technical Audit', icon: CheckCircle2 },
              { id: 'backlinks', label: 'Backlink Growth', icon: Link2 },
            ].map((sec) => {
              const isChecked = includedSections[sec.id];
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isChecked
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isChecked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <div className="mt-2">
                    <span className="text-xs font-bold block">{sec.label}</span>
                    <span className="text-[10px] text-slate-400">{isChecked ? 'Included' : 'Excluded'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Report Preview Document */}
      <Card className="p-6 sm:p-8 space-y-8 bg-white dark:bg-[#111827] shadow-lg">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Executive Summary Preview
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {currentWebsite?.projectName} SEO Intelligence Audit
            </h2>
            <p className="text-xs text-slate-400">
              Domain: <span className="font-mono text-slate-700 dark:text-slate-300">{currentWebsite?.domain}</span> • Generated {new Date().toLocaleDateString('en-US')}
            </p>
          </div>

          <Badge variant="primary" size="md">
            {dateRange.label} ({dateRange.startDate} – {dateRange.endDate})
          </Badge>
        </div>

        {/* Section 1: Executive KPI Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            1. Core SEO Performance Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">SEO Health Score</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{currentWebsite?.seoScore || 88}/100</p>
              <span className="text-[11px] text-slate-400">Optimal (Top 5%)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Organic Traffic</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{formatNumber(currentWebsite?.organicTraffic || 142850)}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">+{currentWebsite?.trafficChange || 14.8}% MoM</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Tracked Keywords</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{siteKeywords.length}</p>
              <span className="text-[11px] text-slate-400">{siteKeywords.filter(k => k.position <= 3).length} in Top 3</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">Total Backlinks</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(currentWebsite?.totalBacklinks || 18450)}</p>
              <span className="text-[11px] text-slate-400">DR {currentWebsite?.domainRating || 68}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Top Keyword Rankings Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            2. High-Impact Keyword Positions
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Keyword Query</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Change</th>
                  <th className="p-3">Monthly Volume</th>
                  <th className="p-3">Target Landing Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {siteKeywords.slice(0, 5).map((kw) => (
                  <tr key={kw.id}>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{kw.keyword}</td>
                    <td className="p-3 font-bold text-indigo-600">#{kw.position}</td>
                    <td className="p-3 text-emerald-600 font-bold">{kw.change > 0 ? `+${kw.change}` : kw.change}</td>
                    <td className="p-3">{formatNumber(kw.volume)}</td>
                    <td className="p-3 font-mono text-slate-400 truncate max-w-xs">{kw.targetUrl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
