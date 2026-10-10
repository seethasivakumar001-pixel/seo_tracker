import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSearch,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Globe,
  Sliders,
  Eye,
  Check,
  RotateCcw,
  Code2,
  Copy,
  Terminal,
  FileCode,
  Link,
  Layers
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

  const [targetUrl, setTargetUrl] = useState(`https://${currentWebsite?.domain || 'my99exch.ai'}/products/seo-suite`);
  const [targetKeyword, setTargetKeyword] = useState('enterprise cloud data platform');

  // Live editable SERP Preview Fields
  const [liveTitle, setLiveTitle] = useState('TechSphere Enterprise Cloud Data Architecture & Streaming Platform');
  const [liveDescription, setLiveDescription] = useState('Build, transform, and sync sub-second data pipelines across multi-cloud environments. Scale your enterprise data platform with TechSphere.');

  // BeautifulSoup HTML Optimizer Tool State
  const [rawHtml, setRawHtml] = useState(`<p>Read more on <a href="https://example.com">our guide</a> and explore <a href="https://my99exch.ai">my99exch.ai</a>.</p>`);
  const [linkStyle, setLinkStyle] = useState('text-decoration: none; color: #2563eb; background-color: rgba(37, 99, 235, 0.12); padding: 0 4px; border-radius: 4px;');
  const [includeOgTags, setIncludeOgTags] = useState(true);
  const [optimizerTab, setOptimizerTab] = useState('preview'); // 'preview' | 'html' | 'python'
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    data: analysisData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['onPageAnalysis', targetUrl, targetKeyword],
    queryFn: () => seoApi.analyzeOnPageUrl(targetUrl, targetKeyword)
  });

  // Sync real audited Title, Description & HTML into SERP preview & BeautifulSoup editor
  React.useEffect(() => {
    if (analysisData?.pageTitle !== undefined) {
      setLiveTitle(analysisData.pageTitle);
    }
    if (analysisData?.pageDescription !== undefined) {
      setLiveDescription(analysisData.pageDescription);
    }
    if (analysisData?.rawHtml) {
      setRawHtml(analysisData.rawHtml);
    }
  }, [analysisData]);

  const handleAnalyzeSubmit = (e) => {
    e.preventDefault();
    refetch();
    toast.success('Analyzing live page metadata and audit signals...');
  };

  // Generate Real-time Optimized HTML simulating BeautifulSoup
  const generatedHtml = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml.includes('<html') ? rawHtml : `<!DOCTYPE html><html><head></head><body>${rawHtml}</body></html>`, 'text/html');

      // Update or create <title>
      if (liveTitle) {
        let titleEl = doc.querySelector('title');
        if (!titleEl) {
          titleEl = doc.createElement('title');
          doc.head.appendChild(titleEl);
        }
        titleEl.textContent = liveTitle;
      }

      // Update or create <meta name="description">
      if (liveDescription) {
        let metaDesc = doc.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = doc.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          doc.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', liveDescription);
      }

      // Open Graph Tags
      if (includeOgTags) {
        const ogData = {
          'og:title': liveTitle,
          'og:description': liveDescription,
          'og:type': 'website'
        };
        Object.entries(ogData).forEach(([prop, val]) => {
          let ogMeta = doc.querySelector(`meta[property="${prop}"]`);
          if (!ogMeta) {
            ogMeta = doc.createElement('meta');
            ogMeta.setAttribute('property', prop);
            doc.head.appendChild(ogMeta);
          }
          ogMeta.setAttribute('content', val);
        });
      }

      // Apply link styles
      if (linkStyle) {
        doc.querySelectorAll('a[href]').forEach((a) => {
          a.setAttribute('style', linkStyle);
        });
      }

      return doc.documentElement.outerHTML;
    } catch (e) {
      return rawHtml;
    }
  }, [rawHtml, liveTitle, liveDescription, linkStyle, includeOgTags]);

  // Generated Python Code
  const pythonBs4Snippet = useMemo(() => {
    return `from bs4 import BeautifulSoup

html = """${rawHtml}"""

soup = BeautifulSoup(html, "html.parser")

# 1. Apply Link Styling for SEO Anchors
link_style = "${linkStyle.replace(/"/g, '\\"')}"
for a in soup.find_all("a", href=True):
    a["style"] = link_style

# 2. Ensure <head> Tag Exists
head = soup.head
if not head:
    head = soup.new_tag("head")
    if soup.html:
        soup.html.insert(0, head)
    else:
        soup.insert(0, head)

# 3. Inject Meta Title & Description
new_title = "${liveTitle.replace(/"/g, '\\"')}"
new_description = "${liveDescription.replace(/"/g, '\\"')}"

title_tag = head.find("title")
if title_tag:
    title_tag.string = new_title
else:
    new_t = soup.new_tag("title")
    new_t.string = new_title
    head.append(new_t)

desc_tag = head.find("meta", attrs={"name": lambda val: val and val.lower() == "description"})
if desc_tag:
    desc_tag["content"] = new_description
else:
    new_d = soup.new_tag("meta", attrs={"name": "description", "content": new_description})
    head.append(new_d)

${includeOgTags ? `# 4. Inject Open Graph Metadata
og_tags = {
    "og:title": new_title,
    "og:description": new_description,
    "og:type": "website",
}
for prop, content in og_tags.items():
    og_meta = head.find("meta", attrs={"property": prop})
    if og_meta:
        og_meta["content"] = content
    else:
        new_og = soup.new_tag("meta", attrs={"property": prop, "content": content})
        head.append(new_og)
` : ''}
print(soup.prettify())`;
  }, [rawHtml, liveTitle, liveDescription, linkStyle, includeOgTags]);

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
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
          On-Page SEO Analyzer & BeautifulSoup HTML Optimizer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Audit content depth, metadata optimization, styled anchor link injection, and preview how your listing looks on Google SERPs.
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
              <h3 className="text-base sm:text-lg font-semibold text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-tight pt-0.5">
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
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BEAUTIFULSOUP HTML METADATA & LINK OPTIMIZER SECTION ═══ */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Code2 className="w-4 h-4" />
                </div>
                <CardTitle>BeautifulSoup HTML Metadata & Link Style Injector</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Injects meta title, description, and custom styled links into HTML using BeautifulSoup (<code className="font-mono text-indigo-500">bs4</code>).
              </CardDescription>
            </div>

            {/* View Selector Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOptimizerTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  optimizerTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setOptimizerTab('html')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  optimizerTab === 'html'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Generated HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setOptimizerTab('python')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  optimizerTab === 'python'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Python bs4 Code</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls: Input HTML & Link Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Raw HTML Input Snippet
              </label>
              <textarea
                rows={4}
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="<p>Enter HTML snippet here with <a> links...</p>"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anchor Link Inline Style (<code className="font-mono text-[11px] text-indigo-500">&lt;a style="..."&gt;</code>)
                </label>
                <input
                  type="text"
                  value={linkStyle}
                  onChange={(e) => setLinkStyle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Include Open Graph (og:title, og:description)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeOgTags}
                  onChange={(e) => setIncludeOgTags(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Tab Content Box */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
              <span className="text-[11px] uppercase tracking-wider font-bold">
                {optimizerTab === 'preview' && 'Rendered Visual Preview (Styled Anchors)'}
                {optimizerTab === 'html' && 'Formatted HTML Output'}
                {optimizerTab === 'python' && 'Executable Python BeautifulSoup Script (bs4)'}
              </span>

              <button
                type="button"
                onClick={() => handleCopyCode(optimizerTab === 'python' ? pythonBs4Snippet : generatedHtml)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {optimizerTab === 'preview' && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-sans space-y-3">
                <div className="text-xs text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <span>&lt;title&gt;: <strong className="text-slate-800 dark:text-slate-200">{liveTitle}</strong></span>
                  <span className="text-indigo-500 font-mono text-[11px]">Styles Applied</span>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: rawHtml.replace(/<a\s+([^>]*?)href="([^"]*)"([^>]*)>/gi, `<a $1href="$2"$3 style="${linkStyle}">`)
                  }}
                />
              </div>
            )}

            {optimizerTab === 'html' && (
              <pre className="text-slate-200 whitespace-pre-wrap overflow-x-auto max-h-80 leading-relaxed">
                {generatedHtml}
              </pre>
            )}

            {optimizerTab === 'python' && (
              <pre className="text-indigo-300 whitespace-pre-wrap overflow-x-auto max-h-80 leading-relaxed">
                {pythonBs4Snippet}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

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
