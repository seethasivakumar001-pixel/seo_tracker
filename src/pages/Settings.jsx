import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Globe,
  Sliders,
  Trash2,
  AlertTriangle,
  Check,
  Save,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  Loader2,
  RefreshCw,
  HelpCircle,
  Copy
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useAuthStore } from '../store/authStore';
import { searchEngineOptions, countryOptions } from '../data/mockWebsites';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { seoApi } from '../api/seoApi';
import toast from 'react-hot-toast';

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPM = Boolean(user?.isPM || user?.role?.includes('PM') || user?.role?.includes('Project Manager'));
  const {
    websites,
    selectedWebsiteId,
    getSelectedWebsite,
    updateWebsite,
    deleteWebsite,
    assignWebsite
  } = useSEOStore();

  const currentWebsite = getSelectedWebsite();

  const [activeTab, setActiveTab] = useState('project');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states initialized with current website
  const [formData, setFormData] = useState({
    projectName: currentWebsite?.projectName || '',
    domain: currentWebsite?.domain || '',
    searchEngine: currentWebsite?.searchEngine || 'Google US (google.com)',
    country: currentWebsite?.country || 'United States',
    trackingFrequency: currentWebsite?.trackingFrequency || 'Daily',
    notifyRankingDrops: true,
    notifyNewBacklinks: true,
    notifyCrawlErrors: true,
    emailWeeklyDigest: true
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (currentWebsite) {
      updateWebsite(currentWebsite.id, {
        projectName: formData.projectName,
        searchEngine: formData.searchEngine,
        country: formData.country,
        trackingFrequency: formData.trackingFrequency
      });
      toast.success('Project settings saved successfully');
    }
  };

  // GSC State
  const [gscStatus, setGscStatus] = useState(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscTesting, setGscTesting] = useState(false);
  const [gscInputTab, setGscInputTab] = useState('json');
  const [gscJsonKey, setGscJsonKey] = useState('');
  const [gscClientEmail, setGscClientEmail] = useState('');
  const [gscPrivateKey, setGscPrivateKey] = useState('');
  const [gscAccessToken, setGscAccessToken] = useState('');
  const [gscTestResult, setGscTestResult] = useState(null);
  const [gscCopied, setGscCopied] = useState(false);

  useEffect(() => {
    if (activeTab === 'gsc') {
      loadGscStatus();
    }
  }, [activeTab, currentWebsite?.domain]);

  const loadGscStatus = async () => {
    setGscLoading(true);
    try {
      const res = await seoApi.getGSCStatus(currentWebsite?.domain);
      setGscStatus(res);
    } catch {
      setGscStatus({ connected: false });
    } finally {
      setGscLoading(false);
    }
  };

  const handleSaveGsc = async (e) => {
    e.preventDefault();
    setGscLoading(true);
    try {
      let payload = { domain: currentWebsite?.domain };
      if (gscInputTab === 'json') {
        if (!gscJsonKey.trim()) {
          toast.error('Please paste your Google Service Account JSON key');
          setGscLoading(false);
          return;
        }
        payload.jsonKey = gscJsonKey.trim();
      } else if (gscInputTab === 'fields') {
        if (!gscClientEmail.trim() || !gscPrivateKey.trim()) {
          toast.error('Please enter both client email and private key');
          setGscLoading(false);
          return;
        }
        payload.clientEmail = gscClientEmail.trim();
        payload.privateKey = gscPrivateKey.trim();
      } else {
        if (!gscAccessToken.trim()) {
          toast.error('Please enter an access token');
          setGscLoading(false);
          return;
        }
        payload.accessToken = gscAccessToken.trim();
      }

      const res = await seoApi.saveGSCCredentials(payload);
      toast.success(res.message || 'Google Search Console connected successfully!');
      await loadGscStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to save credentials');
    } finally {
      setGscLoading(false);
    }
  };

  const handleDisconnectGsc = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Google Search Console for ${currentWebsite?.domain || 'this site'}?`)) return;
    setGscLoading(true);
    try {
      await seoApi.disconnectGSC(currentWebsite?.domain);
      toast.success('Google Search Console disconnected.');
      setGscStatus({ connected: false });
      setGscTestResult(null);
    } catch (err) {
      toast.error('Failed to disconnect: ' + err.message);
    } finally {
      setGscLoading(false);
    }
  };

  const handleTestGscQuery = async () => {
    if (!currentWebsite?.domain) {
      toast.error('No target domain found');
      return;
    }
    setGscTesting(true);
    setGscTestResult(null);
    try {
      const data = await seoApi.queryGSC({
        siteUrl: currentWebsite.domain,
        startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date'],
        rowLimit: 30
      });
      setGscTestResult(data);
      toast.success(`Success! Fetched ${data.rows?.length || 0} real data rows directly from Google Search Console.`);
    } catch (err) {
      setGscTestResult({ error: err.message });
      toast.error('Google query failed: ' + err.message);
    } finally {
      setGscTesting(false);
    }
  };

  // GA4 State
  const [ga4Status, setGa4Status] = useState(null);
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Testing, setGa4Testing] = useState(false);
  const [ga4TestResult, setGa4TestResult] = useState(null);

  useEffect(() => {
    if (activeTab === 'ga4') {
      loadGa4Status();
    }
  }, [activeTab, currentWebsite?.domain]);

  const loadGa4Status = async () => {
    setGa4Loading(true);
    try {
      const res = await seoApi.getGA4Status(currentWebsite?.domain);
      setGa4Status(res);
      if (res.propertyId) setGa4PropertyId(res.propertyId);
      else setGa4PropertyId('');
    } catch {
      setGa4Status({ connected: false });
      setGa4PropertyId('');
    } finally {
      setGa4Loading(false);
    }
  };

  const handleSaveGa4 = async (e) => {
    e.preventDefault();
    if (!ga4PropertyId.trim()) {
      toast.error('Please enter your GA4 Property ID');
      return;
    }
    setGa4Loading(true);
    try {
      const res = await seoApi.configureGA4({
        propertyId: ga4PropertyId.trim(),
        domain: currentWebsite?.domain
      });
      toast.success(res.message || 'GA4 configuration saved successfully!');
      await loadGa4Status();
    } catch (err) {
      toast.error(err.message || 'Failed to save GA4 configuration');
    } finally {
      setGa4Loading(false);
    }
  };

  const handleDisconnectGa4 = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Google Analytics 4 for ${currentWebsite?.domain || 'this project'}?`)) return;
    setGa4Loading(true);
    try {
      await seoApi.disconnectGA4(currentWebsite?.domain);
      setGa4PropertyId('');
      toast.success('GA4 property disconnected');
      await loadGa4Status();
    } catch (err) {
      toast.error(err.message || 'Failed to disconnect GA4');
    } finally {
      setGa4Loading(false);
    }
  };

  const handleTestGa4 = async () => {
    setGa4Testing(true);
    setGa4TestResult(null);
    try {
      const data = await seoApi.getGA4Report({
        domain: currentWebsite?.domain,
        propertyId: ga4PropertyId.trim() || undefined
      });
      setGa4TestResult(data);
      if (data.isMock) {
        toast('Preview data loaded. Ensure your Service Account has Viewer access to stream live GA4 data.', { icon: 'ℹ️' });
      } else {
        toast.success(`Success! Fetched ${data.landingPages?.length || 0} organic landing pages from GA4 Data API.`);
      }
    } catch (err) {
      setGa4TestResult({ error: err.message });
      toast.error('GA4 test query failed: ' + err.message);
    } finally {
      setGa4Testing(false);
    }
  };

  const handleConfirmDelete = () => {
    if (currentWebsite) {
      deleteWebsite(currentWebsite.id);
      toast.success(`Project "${currentWebsite.projectName}" deleted`);
      setIsDeleteModalOpen(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Project Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure tracking frequency, search engine locations, notifications, and project metadata for {currentWebsite?.domain}.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'project', label: 'Project Info' },
          { id: 'gsc', label: 'Google Search Console (GSC)' },
          { id: 'ga4', label: 'Google Analytics 4 (GA4)' },
          { id: 'team', label: isPM ? '👑 Team Assignments (PM)' : 'Team & Ownership' },
          { id: 'location', label: 'Search Engine' },
          { id: 'frequency', label: 'Tracking Cadence' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'danger', label: 'Danger Zone' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: PROJECT INFO */}
      {activeTab === 'project' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Primary identifiers for this tracking project</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Domain
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.domain}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB: GOOGLE SEARCH CONSOLE INTEGRATION */}
      {activeTab === 'gsc' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Google Search Console API</CardTitle>
                <CardDescription>
                  Direct connection to Google Search Console for 100% verified real organic clicks, impressions, and search queries.
                </CardDescription>
              </div>
              <Badge variant={gscStatus?.connected ? 'success' : 'warning'}>
                {gscStatus?.connected ? 'GSC Active (Live)' : 'Not Connected'}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                gscStatus?.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              }`}>
                {gscStatus?.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div className="font-bold text-sm mb-1">
                    {gscStatus?.connected
                      ? '🟢 Google Search Console is Active & Ready'
                      : '🟡 Google Search Console is Not Connected'}
                  </div>
                  <p className="opacity-90 leading-relaxed">
                    {gscStatus?.connected
                      ? `Real organic traffic & impressions are actively fetched from Google's official Search Analytics API for ${currentWebsite?.domain || 'your domain'}.`
                      : 'Provide a Google Cloud Service Account JSON key or OAuth credentials to stream real Google clicks and search queries directly into your dashboard.'}
                  </p>

                  {gscStatus?.connected && gscStatus.email && (
                    <div className="mt-2.5 flex items-center gap-2 bg-emerald-500/15 py-1.5 px-2.5 rounded-lg font-mono text-[11px] text-emerald-800 dark:text-emerald-300 w-fit">
                      <span>Service Account: {gscStatus.email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(gscStatus.email);
                          setGscCopied(true);
                          toast.success('Copied service account email');
                          setTimeout(() => setGscCopied(false), 2000);
                        }}
                        className="hover:opacity-80 p-0.5 text-emerald-600 dark:text-emerald-300 cursor-pointer"
                        title="Copy email"
                      >
                        {gscCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {gscStatus?.connected && (
                  <button
                    type="button"
                    onClick={handleDisconnectGsc}
                    disabled={gscLoading}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer shrink-0 py-1.5 px-3 rounded-xl hover:bg-rose-500/10 transition-colors border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                )}
              </div>

              {/* If Connected, show Live Test & Verified Properties */}
              {gscStatus?.connected ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Test Live Connection: {currentWebsite?.domain || 'Target Domain'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Query Google Search Console directly for the last 30 days of search analytics
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTestGscQuery}
                        disabled={gscTesting}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer w-fit"
                      >
                        {gscTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Run Live Test Query
                      </button>
                    </div>

                    {gscTestResult && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-56 overflow-y-auto">
                        {gscTestResult.error ? (
                          <div className="text-rose-400">
                            <strong>Query Error:</strong> {gscTestResult.error}
                            <p className="mt-1 text-[11px] text-slate-400 font-sans">
                              Ensure that <code>{gscStatus.email || 'your service account'}</code> has been added as a <strong>User</strong> in Google Search Console for property: <code>{currentWebsite?.domain}</code>.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Successfully queried {gscTestResult.siteUrl}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
                              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Clicks</span>
                                <span className="text-base font-extrabold text-white">{gscTestResult.totals?.clicks?.toLocaleString()}</span>
                              </div>
                              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Impressions</span>
                                <span className="text-base font-extrabold text-white">{gscTestResult.totals?.impressions?.toLocaleString()}</span>
                              </div>
                              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg CTR</span>
                                <span className="text-base font-extrabold text-emerald-400">{gscTestResult.totals?.avgCtr}%</span>
                              </div>
                              <div className="bg-slate-800/80 p-2.5 rounded-lg">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg Position</span>
                                <span className="text-base font-extrabold text-amber-400">{gscTestResult.totals?.avgPosition}</span>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans">
                              Retrieved {gscTestResult.rows?.length} daily rows from Google Search Console. Dashboard will now render this live data automatically!
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {gscStatus.sites && gscStatus.sites.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                        Accessible GSC Properties ({gscStatus.sites.length}):
                      </h5>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {gscStatus.sites.map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs">
                            <span className="font-mono text-slate-700 dark:text-slate-200">{s.siteUrl}</span>
                            <Badge variant="secondary" size="xs">{s.permissionLevel}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Input Form when not connected */
                <div className="space-y-5">
                  <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setGscInputTab('json')}
                      className={`pb-2.5 transition-colors cursor-pointer ${
                        gscInputTab === 'json'
                          ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      Service Account JSON (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGscInputTab('fields')}
                      className={`pb-2.5 transition-colors cursor-pointer ${
                        gscInputTab === 'fields'
                          ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      Manual Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setGscInputTab('token')}
                      className={`pb-2.5 transition-colors cursor-pointer ${
                        gscInputTab === 'token'
                          ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      OAuth Access Token
                    </button>
                  </div>

                  <form onSubmit={handleSaveGsc} className="space-y-4">
                    {gscInputTab === 'json' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Paste Service Account JSON Key
                        </label>
                        <textarea
                          rows={6}
                          value={gscJsonKey}
                          onChange={(e) => setGscJsonKey(e.target.value)}
                          placeholder='{"type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----...", "client_email": "...@...iam.gserviceaccount.com"}'
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Generated from Google Cloud Console &gt; IAM &amp; Admin &gt; Service Accounts &gt; Keys.
                        </p>
                      </div>
                    )}

                    {gscInputTab === 'fields' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Service Account Email
                          </label>
                          <input
                            type="email"
                            value={gscClientEmail}
                            onChange={(e) => setGscClientEmail(e.target.value)}
                            placeholder="seo-service@project.iam.gserviceaccount.com"
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Private Key
                          </label>
                          <textarea
                            rows={4}
                            value={gscPrivateKey}
                            onChange={(e) => setGscPrivateKey(e.target.value)}
                            placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {gscInputTab === 'token' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Google OAuth2 Access Token
                        </label>
                        <input
                          type="password"
                          value={gscAccessToken}
                          onChange={(e) => setGscAccessToken(e.target.value)}
                          placeholder="ya29.a0AfH6SM..."
                          className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="submit"
                        disabled={gscLoading}
                        className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {gscLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Save &amp; Connect Google Search Console
                      </button>
                    </div>
                  </form>

                  {/* 3-Step Setup Instructions */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
                    <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      How to get your free Google Service Account Key (2-minute guide):
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      <li>
                        Open{' '}
                        <a
                          href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        and click <strong>Enable</strong> for the <em>Google Search Console API</em>.
                      </li>
                      <li>
                        Go to <strong>IAM &amp; Admin &gt; Service Accounts</strong>, create a service account, then click <strong>Keys &gt; Add Key &gt; Create new key (JSON)</strong>.
                      </li>
                      <li>
                        Open{' '}
                        <a
                          href="https://search.google.com/search-console"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                        >
                          Google Search Console <ExternalLink className="w-3 h-3" />
                        </a>
                        , select your website property, go to <strong>Settings &gt; Users &amp; permissions</strong>, click <strong>Add User</strong>, and paste your Service Account email.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: GOOGLE ANALYTICS 4 (GA4) INTEGRATION */}
      {activeTab === 'ga4' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Google Analytics 4 (GA4) API</CardTitle>
                <CardDescription>
                  Tracks post-click organic performance: sessions, users, engagement rate, average time spent, conversions, and organic landing pages.
                </CardDescription>
              </div>
              <Badge variant={ga4Status?.connected ? 'success' : 'warning'}>
                {ga4Status?.connected ? 'GA4 Active (Live)' : 'Property ID Needed'}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  ga4Status?.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}
              >
                {ga4Status?.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div className="font-bold text-sm mb-1">
                    {ga4Status?.connected
                      ? `🟢 GA4 Property Connected (ID: ${ga4Status.propertyId})`
                      : '🟡 Google Analytics 4 Setup Required'}
                  </div>
                  <p className="opacity-90 leading-relaxed">
                    {ga4Status?.connected
                      ? `Live Google Analytics 4 post-click data is streaming for ${currentWebsite?.domain || 'your domain'}.`
                      : 'Enter your GA4 Property ID below. The Google service account credentials will be used to query the official Google Analytics Data API.'}
                  </p>

                  {ga4Status?.serviceEmail && (
                    <div className="mt-2.5 flex items-center gap-2 bg-emerald-500/15 py-1.5 px-2.5 rounded-lg font-mono text-[11px] text-emerald-800 dark:text-emerald-300 w-fit">
                      <span>Service Account: {ga4Status.serviceEmail}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(ga4Status.serviceEmail);
                          toast.success('Copied service account email');
                        }}
                        className="hover:opacity-80 p-0.5 text-emerald-600 dark:text-emerald-300 cursor-pointer"
                        title="Copy email"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveGa4} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    GA4 Property ID (numeric digits only)
                  </label>
                  <input
                    type="text"
                    value={ga4PropertyId}
                    onChange={(e) => setGa4PropertyId(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 419827402"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Find this in Google Analytics &gt; Admin (gear icon) &gt; Property details &gt; Property ID.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestGa4}
                      disabled={ga4Testing}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {ga4Testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Run Live Test Query
                    </button>
                    {ga4Status?.connected && (
                      <button
                        type="button"
                        onClick={handleDisconnectGa4}
                        disabled={ga4Loading}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 transition-colors cursor-pointer"
                      >
                        Disconnect GA4
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={ga4Loading}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {ga4Loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save GA4 Property Configuration
                  </button>
                </div>
              </form>

              {/* Test Result */}
              {ga4TestResult && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-56 overflow-y-auto">
                  {ga4TestResult.error ? (
                    <div className="text-rose-400">
                      <strong>Error:</strong> {ga4TestResult.error}
                    </div>
                  ) : (
                    <div>
                      <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {ga4TestResult.isMock ? 'Demo GA4 Report Loaded' : `Successfully queried GA4 Property: ${ga4TestResult.propertyId}`}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-2">
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Organic Sessions</span>
                          <span className="text-sm font-bold text-white">{ga4TestResult.totals?.organicSessions?.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Organic Users</span>
                          <span className="text-sm font-bold text-white">{ga4TestResult.totals?.organicUsers?.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Engagement Rate</span>
                          <span className="text-sm font-bold text-emerald-400">{ga4TestResult.totals?.engagementRate}%</span>
                        </div>
                        <div className="bg-slate-800/80 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Conversions</span>
                          <span className="text-sm font-bold text-amber-400">{ga4TestResult.totals?.conversions}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Retrieved {ga4TestResult.landingPages?.length || 0} organic landing pages.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
                <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Granting GA4 Access to your Service Account:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Go to{' '}
                    <a
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      Google Analytics 4 <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and click <strong>Admin</strong> (gear icon).
                  </li>
                  <li>
                    Select your website property, go to <strong>Property details</strong>, and copy the numeric <strong>Property ID</strong>.
                  </li>
                  <li>
                    Click <strong>Property Access Management</strong> &gt; <strong>+ (Add users)</strong>. Paste your Service Account email: <code>{ga4Status?.serviceEmail || 'your-service-account@iam.gserviceaccount.com'}</code> and assign the <strong>Viewer</strong> role.
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: TEAM ASSIGNMENTS & OWNERSHIP */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Active User Account Summary */}
          <div className="p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                alt={user?.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#0062ff]/20 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'SEO Specialist'}</p>
                  {isPM && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/15 text-[#0062ff]">
                      Manager
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <p className="text-[11px] font-semibold text-[#0062ff] mt-0.5">
                  Connected to Database Account
                </p>
              </div>
            </div>
          </div>

          {/* Project Assignments Management Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0062ff]" />
                    <span>Project Ownership & Assignments</span>
                  </CardTitle>
                  <CardDescription>
                    Overview of your tracked domains and website ownership.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                      <th className="pb-3 px-3">Website Domain</th>
                      <th className="pb-3 px-3">Project Name</th>
                      <th className="pb-3 px-3">Keywords</th>
                      <th className="pb-3 px-3">SEO Health</th>
                      <th className="pb-3 px-3">Assigned Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {websites.map((site) => {
                      return (
                        <tr key={site.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              <span>{site.domain}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {site.projectName}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-[#0062ff]">
                            {site.totalKeywords || 0}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                              {site.seoScore || 85}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              👤 {site.assignedName || user?.name || 'Owner'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SEARCH ENGINE & LOCATION */}
      {activeTab === 'location' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Search Engine Localization</CardTitle>
              <CardDescription>Configure Google locale and geographical IP simulation</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Search Engine
                  </label>
                  <select
                    value={formData.searchEngine}
                    onChange={(e) => setFormData({ ...formData, searchEngine: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {searchEngineOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country Locale
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {countryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Localization</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TRACKING CADENCE */}
      {activeTab === 'frequency' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Crawl & Tracking Cadence</CardTitle>
              <CardDescription>Determine how frequently SERP positions are scraped</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Daily', 'Weekly', 'Hourly (Enterprise)'].map((freq) => (
                <label
                  key={freq}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.trackingFrequency === freq.split(' ')[0]
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{freq}</span>
                    <input
                      type="radio"
                      name="cadence"
                      value={freq.split(' ')[0]}
                      checked={formData.trackingFrequency === freq.split(' ')[0]}
                      onChange={(e) => setFormData({ ...formData, trackingFrequency: e.target.value })}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {freq.includes('Daily') && 'Standard daily SERP refresh at 00:00 UTC.'}
                    {freq.includes('Weekly') && 'Lightweight weekly check on Sundays.'}
                    {freq.includes('Hourly') && 'Continuous real-time SERP volatility monitor.'}
                  </p>
                </label>
              ))}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Cadence</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Alert & Email Preferences</CardTitle>
              <CardDescription>Manage automated email and dashboard alerts</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'notifyRankingDrops', label: 'Ranking Drop Alerts (when keyword drops > 2 spots)' },
              { id: 'notifyNewBacklinks', label: 'High-Authority Backlink Discoveries (DR > 70)' },
              { id: 'notifyCrawlErrors', label: 'Technical Crawl & 404 Error Warnings' },
              { id: 'emailWeeklyDigest', label: 'Weekly Executive SEO Performance Digest' },
            ].map((item) => (
              <label key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={formData[item.id]}
                  onChange={(e) => setFormData({ ...formData, [item.id]: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>
            ))}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => toast.success('Notification preferences saved')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* TAB 6: DANGER ZONE */}
      {activeTab === 'danger' && (
        <Card className="border-rose-200 dark:border-rose-900/40">
          <CardHeader className="bg-rose-50/30 dark:bg-rose-950/20">
            <div>
              <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for {currentWebsite?.domain}</CardDescription>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Delete Website Project
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Permanently erase tracked keywords, historical positions, and crawl cache.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs flex-shrink-0"
              >
                Delete {currentWebsite?.domain}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DELETE PROJECT MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Website Project"
        description="This action cannot be undone. Are you sure you want to proceed?"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Project: <strong className="text-slate-900 dark:text-white">{currentWebsite?.projectName}</strong> ({currentWebsite?.domain})
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
