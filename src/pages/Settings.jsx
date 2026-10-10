import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Globe,
  Sliders,
  Bell,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  Check,
  Save
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useThemeStore } from '../store/themeStore';
import { searchEngineOptions, countryOptions } from '../data/mockWebsites';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

export function Settings() {
  const navigate = useNavigate();
  const {
    websites,
    selectedWebsiteId,
    getSelectedWebsite,
    updateWebsite,
    deleteWebsite
  } = useSEOStore();
  const { theme, setTheme } = useThemeStore();

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
          { id: 'location', label: 'Search Engine' },
          { id: 'frequency', label: 'Tracking Cadence' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'appearance', label: 'Appearance' },
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: APPEARANCE */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Interface Theme</CardTitle>
              <CardDescription>Select between sleek dark mode or clean light mode</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-center transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Light Mode</span>
                <span className="text-[10px] text-slate-400">Crisp white & slate</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-center transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/50 shadow-md ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Moon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Dark Mode</span>
                <span className="text-[10px] text-slate-400">Deep obsidian & navy</span>
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
