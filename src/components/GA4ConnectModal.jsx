import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Hash,
  Key,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { seoApi } from '../api/seoApi';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { cn } from '../utils/cn';

export function GA4ConnectModal({ isOpen, onClose, onConnected, currentDomain }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [jsonKey, setJsonKey] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await seoApi.getGA4Status(currentDomain);
      setStatus(res);
      if (res.propertyId) {
        setPropertyId(res.propertyId);
      } else {
        setPropertyId('');
      }
    } catch {
      setStatus({ connected: false });
      setPropertyId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen, currentDomain]);

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    if (!propertyId.trim()) {
      toast.error('Please enter your GA4 Property ID (numeric digits)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        domain: currentDomain,
        propertyId: propertyId.trim()
      };
      if (showJsonInput && jsonKey.trim()) {
        payload.jsonKey = jsonKey.trim();
      }

      const res = await seoApi.configureGA4(payload);
      toast.success(res.message || `GA4 configuration saved for ${currentDomain}!`);
      await fetchStatus();
      if (onConnected) onConnected();
    } catch (err) {
      toast.error(err.message || 'Failed to save GA4 configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Disconnect Google Analytics 4 for ${currentDomain || 'this website'}?`)) return;
    setLoading(true);
    try {
      await seoApi.disconnectGA4(currentDomain);
      toast.success(`Disconnected GA4 for ${currentDomain}`);
      setPropertyId('');
      setStatus({ connected: false });
      setTestResult(null);
      if (onConnected) onConnected();
    } catch (err) {
      toast.error('Failed to disconnect: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestReport = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await seoApi.getGA4Report({
        domain: currentDomain,
        propertyId: propertyId.trim() || undefined,
        startDate: '30daysAgo',
        endDate: 'today',
      });
      setTestResult(data);
      if (data.isMock) {
        toast('Retrieved preview organic data. Provide a valid GA4 Property ID with Viewer access to stream live reports.', { icon: 'ℹ️' });
      } else {
        toast.success(`Success! Fetched ${data.landingPages?.length || 0} organic landing pages from GA4 Data API.`);
      }
    } catch (err) {
      setTestResult({ error: err.message });
      toast.error('GA4 test query notice: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const copyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success('Service account email copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const serviceEmail = status?.serviceEmail || 'reddybook@aerobic-name-512309-u1.iam.gserviceaccount.com';

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={handleTestReport}
        disabled={testing}
        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0062ff]" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span>Test Live Query</span>
      </button>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-blue-600 rounded-xl shadow-md shadow-[#0062ff]/20 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
          <span>Save &amp; Connect GA4</span>
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Analytics 4 (GA4) Integration"
      description={currentDomain ? `Post-click engagement, organic sessions, conversions & landing pages for ${currentDomain}` : 'Connect your Google Analytics 4 property'}
      size="xl"
      footer={modalFooter}
    >
      <div className="space-y-4 text-slate-800 dark:text-slate-200">
        {/* Status Banner */}
        <div
          className={cn(
            'p-4 sm:p-5 rounded-2xl border transition-all',
            status?.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-100'
          )}
        >
          <div className="flex items-start gap-3.5">
            {status?.connected ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/30">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {status?.connected
                      ? `Connected to GA4 Property: ${status.propertyId}`
                      : `GA4 Setup for ${currentDomain || 'this domain'}`}
                  </h4>
                  <Badge variant={status?.connected ? 'success' : 'warning'} size="xs" dot>
                    {status?.connected ? `Active on ${currentDomain}` : 'Not Connected'}
                  </Badge>
                </div>

                {status?.connected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                  >
                    <span>Disconnect</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {status?.connected
                  ? 'Streaming live organic search post-click sessions, engagement rates, conversions, and landing page metrics from Google Analytics 4 Data API.'
                  : 'Enter your 9-digit GA4 Property ID. Your existing Google Service Account credentials authenticate with the official Google Analytics Data API.'}
              </p>

              {/* Dedicated Service Account Credential Card */}
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0062ff]" />
                    <span>Authorized Service Account Email</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyEmail(serviceEmail)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#0062ff] hover:bg-blue-600 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Email!' : 'Copy Email'}</span>
                  </button>
                </div>
                <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                  {serviceEmail}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step Setup Instructions Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-[#0062ff] dark:text-blue-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#0062ff]" />
              <span>How to grant access in Google Analytics 4 (2-minute guide):</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{showGuide ? 'Hide Guide' : 'Show Guide'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showGuide && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40">
              {/* Step 1 */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/30 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-[#0062ff] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Open Admin</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Open{' '}
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0062ff] dark:text-blue-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Google Analytics <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  and click the <strong>Admin (gear icon)</strong> at the bottom left.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/30 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-[#0062ff] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Copy Property ID</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Under <strong>Property details</strong>, copy your 9-digit <strong>Property ID</strong> and paste it below.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900/30 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-[#0062ff] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Add as Viewer</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Under <strong>Property Access Management</strong>, click <strong>+ Add users</strong>, paste the service email with <strong>Viewer</strong> role.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Input */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
              GA4 Property ID (numeric) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 419827402"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0062ff]/30 focus:border-[#0062ff] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Find this in Google Analytics &gt; Admin (gear icon) &gt; Property Settings &gt; Property details &gt; Property ID.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowJsonInput(!showJsonInput)}
              className="text-xs text-[#0062ff] dark:text-blue-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showJsonInput ? '− Hide Custom Service Account Key' : '+ Use a custom Service Account JSON key (optional)'}</span>
            </button>
            {showJsonInput && (
              <div className="mt-2.5">
                <textarea
                  rows={4}
                  value={jsonKey}
                  onChange={(e) => setJsonKey(e.target.value)}
                  placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 shadow-lg">
            {testResult.error ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>GA4 Query Notice</span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-rose-900/40">
                  {testResult.error}
                </div>
                {testResult.error.includes('analyticsdata.googleapis.com') && (
                  <div className="pt-1">
                    <a
                      href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold"
                    >
                      <span>Enable Google Analytics Data API</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-emerald-400 font-bold mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{testResult.isMock ? 'Demo GA4 Telemetry Loaded' : `Connected to GA4 Property: ${testResult.propertyId}`}</span>
                  </div>
                  <Badge variant="success" size="xs">Live Verified</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-2 font-sans">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Organic Sessions</span>
                    <span className="text-base font-extrabold text-white">{testResult.totals?.organicSessions?.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Organic Users</span>
                    <span className="text-base font-extrabold text-white">{testResult.totals?.organicUsers?.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Engagement Rate</span>
                    <span className="text-base font-extrabold text-emerald-400">{testResult.totals?.engagementRate}%</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Conversions</span>
                    <span className="text-base font-extrabold text-amber-400">{testResult.totals?.conversions}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-sans pt-1">
                  ✓ {testResult.landingPages?.length || 0} organic landing pages successfully indexed.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
