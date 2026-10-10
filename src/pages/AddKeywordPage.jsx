import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Globe, ShieldCheck } from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { AddKeywordForm } from '../components/AddKeywordForm';
import { Badge } from '../components/Badge';

export function AddKeywordPage() {
  const navigate = useNavigate();
  const { getSelectedWebsite } = useSEOStore();
  const currentWebsite = getSelectedWebsite();

  const handleSuccess = (createdKeyword) => {
    navigate(`/keywords?highlight=${createdKeyword.id}`);
  };

  const handleCancel = () => {
    navigate('/keywords');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <Link
            to="/keywords"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Keyword Intelligence</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Add New Keyword
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track a target query and monitor its SERP rankings in real time.
          </p>
        </div>

        {/* Selected Website Badge */}
        {currentWebsite && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {currentWebsite.domain.charAt(0).toUpperCase()}
            </div>
            <div className="text-left pr-1">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                {currentWebsite.domain}
              </p>
              <p className="text-[10px] text-slate-400">
                Target: {currentWebsite.targetCountry || 'United States'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MAIN FORM CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Keyword Configuration</CardTitle>
          <CardDescription>
            Configure query parameters, target landing URL, search engine location, and initial position.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddKeywordForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default AddKeywordPage;
