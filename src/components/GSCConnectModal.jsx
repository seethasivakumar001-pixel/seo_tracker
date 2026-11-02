import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { seoApi } from '../api/seoApi';
import { Modal } from './Modal';
import { Badge } from './Badge';

export function GSCConnectModal({ isOpen, onClose, onConnected, currentDomain }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeInputTab, setActiveInputTab] = useState('json'); // 'json' | 'fields' | 'token'
  
  // Form states
  const [jsonKey, setJsonKey] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await seoApi.getGSCStatus(currentDomain);
      setStatus(res);
    } catch {
      setStatus({ connected: false });
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

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = { domain: currentDomain };
      if (activeInputTab === 'json') {
        if (!jsonKey.trim()) {
          toast.error('Please paste your Google Service Account JSON key');
          setLoading(false);
          return;
        }
        payload.jsonKey = jsonKey.trim();
      } else if (activeInputTab === 'fields') {
        if (!clientEmail.trim() || !privateKey.trim()) {
          toast.error('Please enter both client email and private key');
          setLoading(false);
          return;
        }
        payload.clientEmail = clientEmail.trim();
        payload.privateKey = privateKey.trim();
      } else {
        if (!accessToken.trim()) {
          toast.error('Please enter a Google OAuth access token');
          setLoading(false);
          return;
        }
        payload.accessToken = accessToken.trim();
      }

      const res = await seoApi.saveGSCCredentials(payload);
      toast.success(res.message || 'Google Search Console connected successfully!');
      await fetchStatus();
      if (onConnected) onConnected();
    } catch (err) {
      toast.error(err.message || 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect Google Search Console for ${currentDomain || 'this site'}?`)) return;
    setLoading(true);
    try {
      await seoApi.disconnectGSC(currentDomain);
      toast.success('Google Search Console disconnected.');
      setStatus({ connected: false });
      setTestResult(null);
      if (onConnected) onConnected();
    } catch (err) {
      toast.error('Failed to disconnect: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = async () => {
    if (!currentDomain) {
      toast.error('No target domain found to test');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const data = await seoApi.queryGSC({
        siteUrl: currentDomain,
        startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date'],
        rowLimit: 30
      });
      setTestResult(data);
      toast.success(`Success! Fetched ${data.rows?.length || 0} real search analytics rows from Google.`);
    } catch (err) {
      setTestResult({ error: err.message });
      toast.error('Google query failed: ' + err.message);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Search Console (GSC) Integration"
      description={currentDomain ? `Verified real search analytics, queries, and ranking positions for ${currentDomain}` : 'Connect your Google Search Console property'}
      size="xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-200">
        {/* Status Banner */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          status?.connected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              {status?.connected ? (
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {status?.connected
                    ? `Connected to ${currentDomain}`
                    : `Access Required for ${currentDomain || 'this domain'}`}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {status?.connected
                    ? `Real Google search analytics are active for ${status?.matchedSiteUrl || currentDomain}.`
                    : status?.hasCredentials
                      ? `Server has credentials for "${status.sites?.map((s) => s.siteUrl).join(', ') || 'other properties'}", but not for ${currentDomain}.`
                      : `Connect official Search Console property to pull 100% verified organic clicks, impressions, and keywords.`}
                </p>
              </div>
            </div>

            {status?.connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer shrink-0 py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Disconnect
              </button>
            )}
          </div>

          {/* Connected Email Display */}
          {status?.connected && status.email && (
            <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl font-mono text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Service Account Email
                </span>
                <button
                  type="button"
                  onClick={() => copyEmail(status.email)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Email!' : 'Copy Email'}</span>
                </button>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                {status.email}
              </div>
            </div>
          )}

          {/* If Credentials Exist for another domain, show the 2 clear connection options */}
          {!status?.connected && status?.hasCredentials && (
            <div className="mt-3.5 pt-3.5 border-t border-amber-500/20 space-y-3">
              <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-300/50 dark:border-amber-700/50 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">1</span>
                    Option 1 (Recommended — 1 min): Add existing Service Account to {currentDomain}
                  </div>
                  <a
                    href="https://search.google.com/search-console/users"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    Open GSC Users &amp; Permissions <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Account Email</span>
                    <button
                      type="button"
                      onClick={() => copyEmail(status.email)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Email'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                    {status.email}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add this email as a <strong>User</strong> with <strong>Full</strong> or <strong>Restricted</strong> permission in Google Search Console for {currentDomain}. Once added, click &quot;Test Live Query&quot; or re-open this modal.
                </p>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">2</span>
                <strong>Option 2:</strong> Or paste a dedicated Service Account JSON key below specifically for <strong>{currentDomain}</strong>:
              </div>
            </div>
          )}
        </div>

        {/* If Connected, show Live Test & Verified Properties */}
        {status?.connected ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Target Domain: {currentDomain || 'None'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verify live access to your search analytics property
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestQuery}
                  disabled={testing}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Test Live Query
                </button>
              </div>

              {testResult && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-52 overflow-y-auto">
                  {testResult.error ? (
                    <div className="text-rose-400">
                      <strong>Error:</strong> {testResult.error}
                      <p className="mt-1 text-[11px] text-slate-400">
                        Make sure the service account email has been added as a <strong>User</strong> in Google Search Console for property: <code>{currentDomain}</code>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Connected to {testResult.siteUrl}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center mb-3">
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Clicks</span>
                          <span className="text-base font-bold text-white">{testResult.totals?.clicks?.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Impressions</span>
                          <span className="text-base font-bold text-white">{testResult.totals?.impressions?.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg CTR</span>
                          <span className="text-base font-bold text-emerald-400">{testResult.totals?.avgCtr}%</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Position</span>
                          <span className="text-base font-bold text-amber-400">{testResult.totals?.avgPosition}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ✓ {testResult.rows?.length} daily data points loaded. Your dashboard will now automatically render these real values!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {status.sites && status.sites.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Verified Properties in this Google Account ({status.sites.length}):
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {status.sites.map((s, i) => (
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
          /* If Not Connected for this domain, show segmented tabs & input form */
          <div className="space-y-4">
            {/* Clean Segmented Tab Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs font-medium border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('json')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeInputTab === 'json'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Service Account JSON
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('fields')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeInputTab === 'fields'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Manual Keys
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('token')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeInputTab === 'token'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  OAuth Token
                </button>
              </div>

              {currentDomain && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 shrink-0 self-start sm:self-auto">
                  Target Domain: <strong className="font-bold">{currentDomain}</strong>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {activeInputTab === 'json' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Paste Google Service Account JSON Key
                    </label>
                    <span className="text-[11px] text-slate-400 font-normal">
                      .json format
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={jsonKey}
                    onChange={(e) => setJsonKey(e.target.value)}
                    placeholder='{"type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----...", "client_email": "...@...iam.gserviceaccount.com"}'
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Download this JSON key from <strong>Google Cloud Console &gt; IAM &amp; Admin &gt; Service Accounts &gt; Keys</strong>.
                  </p>
                </div>
              )}

              {activeInputTab === 'fields' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Service Account Client Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seo-service@your-project.iam.gserviceaccount.com"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Private Key (PEM format)
                    </label>
                    <textarea
                      rows={4}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {activeInputTab === 'token' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Google OAuth2 Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="ya29.a0AfH6SM..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Token requires scope: <code>https://www.googleapis.com/auth/webmasters.readonly</code>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {activeInputTab === 'json'
                    ? `Save JSON for ${currentDomain || 'Target Domain'}`
                    : activeInputTab === 'fields'
                    ? `Save Keys for ${currentDomain || 'Target Domain'}`
                    : `Save Token for ${currentDomain || 'Target Domain'}`}
                </button>
              </div>
            </form>

            {/* Quick 3-Step Setup Guide */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
              <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                How to connect {currentDomain || 'your site'} to Google Search Console:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                <li>
                  Open{' '}
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Google Search Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and select property for <strong>{currentDomain}</strong>.
                </li>
                <li>
                  Go to <strong>Settings &gt; Users &amp; permissions</strong> &gt; click <strong>Add User</strong>.
                </li>
                <li>
                  Paste your Service Account email: <code>{status?.email || 'your-service-account@iam.gserviceaccount.com'}</code> and select permission <strong>Full</strong> or <strong>Restricted</strong>.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
