import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSearch,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { seoApi } from '../api/seoApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { ScoreRing } from '../components/ScoreRing';
import { Badge } from '../components/Badge';
import { TableSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

export function OnPageSEO() {
  const { getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();

  const activeDomain = currentWebsite?.domain || 'my99exch.ai';
  const activeBrand = currentWebsite?.projectName || activeDomain.replace(/\.[a-z]+$/i, '');

  const [targetUrl, setTargetUrl] = useState(`https://${activeDomain}/`);
  const [targetKeyword, setTargetKeyword] = useState('');

  // Live editable SERP Preview Fields
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDescription, setLiveDescription] = useState('');

  // Synchronize fields when selected website changes
  React.useEffect(() => {
    if (currentWebsite?.domain) {
      const dom = currentWebsite.domain;
      setTargetUrl(`https://${dom}/`);
      setTargetKeyword('');
      setLiveTitle('');
      setLiveDescription('');
    }
  }, [currentWebsite?.id, currentWebsite?.domain]);

  const {
    data: analysisData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['onPageAnalysis', targetUrl, targetKeyword],
    queryFn: () => seoApi.analyzeOnPageUrl(targetUrl, targetKeyword)
  });

  // Sync real audited Title and Description into SERP preview
  React.useEffect(() => {
    if (analysisData?.pageTitle !== undefined) {
      setLiveTitle(analysisData.pageTitle);
    }
    if (analysisData?.pageDescription !== undefined) {
      setLiveDescription(analysisData.pageDescription);
    }
  }, [analysisData]);

  const handleAnalyzeSubmit = (e) => {
    e.preventDefault();
    refetch();
    toast.success('Analyzing live page metadata and audit signals...');
  };

  // Character counter limits
  const titleLen = liveTitle.length;
  const descLen = liveDescription.length;

  const isTitleOptimal = titleLen >= 50 && titleLen <= 60;
  const isTitleTooLong = titleLen > 65;
  const isTitleTooShort = titleLen < 40;

  const isDescOptimal = descLen >= 120 && descLen <= 160;
  const isDescTooLong = descLen > 165;
  const isDescTooShort = descLen < 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          On-Page SEO Analyzer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Audit content depth, metadata optimization, and preview how your listing looks on Google SERPs.
        </p>
      </div>

      {/* Target URL & Keyword Input Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleAnalyzeSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter URL to analyze..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="Target focus keyword..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-5 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Audit On-Page</span>
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Score Overview & SERP Live Preview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* On-Page Score Card */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing
            score={analysisData?.overallScore || 87}
            size={130}
            strokeWidth={11}
            label="On-Page Content Score"
            sublabel="Based on 8 core ranking factors"
            showGrade={true}
          />

          <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400">Word Count</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {analysisData?.metrics?.wordCount || 1840} words
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400">Reading Time</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {analysisData?.metrics?.readingTime || '7 min'}
              </p>
            </div>
          </div>
        </Card>

        {/* Live Google Search Preview Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Live Google SERP Snippet Simulator</CardTitle>
              <CardDescription>Edit title and description below to test desktop SERP CTR rendering</CardDescription>
            </div>
            <Badge variant="primary">Google US Desktop</Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google SERP Visual Box */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c1220] space-y-1">
              {/* SERP URL Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  G
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {targetUrl.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
                <span className="text-slate-400">›</span>
                <span className="text-slate-400 truncate">
                  {targetUrl.replace(/^https?:\/\/[^/]+/, '') || '/'}
                </span>
              </div>

              {/* SERP Title */}
              <h3 className="text-base sm:text-lg font-semibold text-[#0062ff] dark:text-[#38bdf8] hover:underline cursor-pointer leading-tight pt-0.5">
                {liveTitle || 'Enter page title...'}
              </h3>

              {/* SERP Meta Description */}
              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed pt-1">
                {liveDescription || 'Enter meta description to preview snippet...'}
              </p>
            </div>

            {/* Title & Description Editor Inputs */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Title Tag
                  </label>
                  <span
                    className={`font-semibold text-[11px] ${
                      isTitleOptimal
                        ? 'text-emerald-600'
                        : isTitleTooLong
                        ? 'text-rose-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {titleLen}/60 characters {isTitleOptimal ? '(Optimal)' : isTitleTooLong ? '(Too Long - will truncate)' : '(Short)'}
                  </span>
                </div>
                <input
                  type="text"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Meta Description
                  </label>
                  <span
                    className={`font-semibold text-[11px] ${
                      isDescOptimal
                        ? 'text-emerald-600'
                        : isDescTooLong
                        ? 'text-rose-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {descLen}/160 characters {isDescOptimal ? '(Optimal)' : isDescTooLong ? '(Too Long)' : '(Short)'}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={liveDescription}
                  onChange={(e) => setLiveDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Checklist of 8 On-Page Factors */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>On-Page Optimization Checklist</CardTitle>
            <CardDescription>Evaluation against top-ranking SERP competitors</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <TableSkeleton rows={4} cols={2} />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(analysisData?.checks || []).map((chk) => {
                const isGood = chk.status === 'good';
                return (
                  <div key={chk.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {isGood ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {chk.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {chk.message}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isGood ? 'success' : 'warning'} size="sm">
                      {isGood ? 'Optimal' : 'Needs Work'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
