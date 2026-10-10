import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Globe, Plus, Sparkles, Layers, ArrowLeft } from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { searchEngineOptions, countryOptions } from '../data/mockWebsites';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import toast from 'react-hot-toast';

const websiteSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain is required')
    .regex(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/, 'Please enter a valid domain name (e.g. yourcompany.com)'),
  projectName: z.string().min(2, 'Project name must be at least 2 characters'),
  searchEngine: z.string().min(1, 'Please select a search engine'),
  country: z.string().min(1, 'Please select a country'),
  trackingFrequency: z.string().min(1, 'Tracking frequency is required'),
  seedKeywords: z.string().optional()
});

export function AddWebsite() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addWebsite, bulkAddKeywords } = useSEOStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      domain: '',
      projectName: '',
      searchEngine: 'Google US (google.com)',
      country: 'United States',
      trackingFrequency: 'Daily',
      seedKeywords: 'enterprise cloud data platform\nreal time data pipelines\nvector database semantic search'
    }
  });

  const domainValue = watch('domain');

  // Auto-generate project name when domain changes
  const handleDomainBlur = () => {
    if (domainValue && !watch('projectName')) {
      const clean = domainValue.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
      setValue('projectName', `${capitalized} Global`);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const countryObj = countryOptions.find((c) => c.value === data.country) || { code: 'US' };
      
      const newSite = addWebsite({
        domain: data.domain,
        projectName: data.projectName,
        searchEngine: data.searchEngine,
        country: data.country,
        countryCode: countryObj.code,
        trackingFrequency: data.trackingFrequency
      });

      // Parse seed keywords if entered
      if (data.seedKeywords && data.seedKeywords.trim()) {
        const lines = data.seedKeywords
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          bulkAddKeywords(lines, {
            targetUrl: `https://${newSite.domain}/`,
            location: data.country
          });
        }
      }

      toast.success(`Project "${data.projectName}" created successfully!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to create website project');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Add New Website Project
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure your domain, target search engine, and track keyword rankings in real-time.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Website Configuration</CardTitle>
            <CardDescription>
              Specify your project details and tracking location preferences.
            </CardDescription>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Domain & Project Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Domain Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    {...register('domain')}
                    onBlur={handleDomainBlur}
                    placeholder="example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {errors.domain && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.domain.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('projectName')}
                  placeholder="e.g. My Brand Global"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.projectName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.projectName.message}</p>
                )}
              </div>
            </div>

            {/* Search Engine & Country Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Search Engine & Location
                </label>
                <select
                  {...register('searchEngine')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {searchEngineOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Country
                </label>
                <select
                  {...register('country')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {countryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tracking Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tracking Frequency
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Daily', 'Weekly', 'Hourly (Enterprise)'].map((freq) => (
                  <label
                    key={freq}
                    className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
                  >
                    <input
                      type="radio"
                      value={freq.split(' ')[0]}
                      {...register('trackingFrequency')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{freq}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Initial Seed Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Seed Keywords (Optional)
                </label>
                <span className="text-[11px] text-slate-400">One keyword per line</span>
              </div>
              <textarea
                rows={4}
                {...register('seedKeywords')}
                placeholder="Enter keywords to immediately start tracking..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Launch Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
