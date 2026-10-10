import React from 'react';
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
  TrendingUp,
  Award,
  Search,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';

export function Rankings() {
  const { keywords, getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();
  const siteKeywords = keywords.filter((k) => k.websiteId === currentWebsite?.id);

  // Position distribution brackets
  const distributionData = [
    { bracket: 'Top 1-3', count: siteKeywords.filter((k) => k.position <= 3).length, color: '#10b981' },
    { bracket: 'Top 4-10', count: siteKeywords.filter((k) => k.position >= 4 && k.position <= 10).length, color: '#6366f1' },
    { bracket: 'Top 11-20', count: siteKeywords.filter((k) => k.position >= 11 && k.position <= 20).length, color: '#38bdf8' },
    { bracket: 'Top 21-50', count: siteKeywords.filter((k) => k.position >= 21 && k.position <= 50).length, color: '#f59e0b' },
    { bracket: 'Top 51-100', count: siteKeywords.filter((k) => k.position >= 51 && k.position <= 100).length, color: '#94a3b8' },
  ];

  // Visibility Index Timeline (SERP Share of Voice)
  const visibilityTimeline = [
    { date: 'May', visibilityScore: 42.4, shareOfVoice: 18.2 },
    { date: 'Jun', visibilityScore: 48.1, shareOfVoice: 21.0 },
    { date: 'Jul', visibilityScore: 56.5, shareOfVoice: 24.8 },
    { date: 'Aug', visibilityScore: 61.2, shareOfVoice: 27.5 },
    { date: 'Sep', visibilityScore: 68.0, shareOfVoice: 31.4 },
    { date: 'Oct', visibilityScore: 74.8, shareOfVoice: 34.9 }
  ];

  // Top SERP features won
  const serpFeaturesList = [
    { name: 'Featured Snippets', count: 8, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'People Also Ask (PAA)', count: 18, icon: Search, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'SiteLinks Expanded', count: 12, icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Video Carousel', count: 5, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Rankings Distribution & Visibility Trends
            </h1>
            <Badge variant="primary" size="xs">
              SERP Intelligence
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detailed bracket distribution, SERP feature penetration, and search market visibility for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{currentWebsite?.domain}</span>.
          </p>
        </div>
      </div>

      {/* Distribution Bar Chart & Share of Voice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Keyword Ranking Distribution</CardTitle>
              <CardDescription>Number of tracked keywords in each position bucket</CardDescription>
            </div>
            <Badge variant="primary">Total: {siteKeywords.length} Keywords</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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

        {/* SERP Features Won */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>SERP Features Penetration</CardTitle>
              <CardDescription>Special result blocks owned</CardDescription>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            {serpFeaturesList.map((feat) => (
              <div
                key={feat.name}
                className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${feat.bg} ${feat.color}`}>
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{feat.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{feat.count}</span>
                  <span className="text-[10px] text-slate-400">queries</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Visibility Score Index Line Chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>SEO Visibility Index & Market Share of Voice</CardTitle>
            <CardDescription>Estimated percentage of total search demand captured over 6 months</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-2xs" />
              <span className="text-slate-600 dark:text-slate-400">Visibility Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
              <span className="text-slate-600 dark:text-slate-400">Share of Voice (%)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
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
                <Line type="monotone" dataKey="visibilityScore" stroke="#6366f1" strokeWidth={3} name="Visibility Index" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="shareOfVoice" stroke="#10b981" strokeWidth={2.5} name="Share of Voice (%)" dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
