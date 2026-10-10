import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Link2, KeyRound, Globe, FileSearch, ArrowRight, X, Command } from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useBacklinkStore } from '../store/backlinkStore';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { websites, keywords, setSelectedWebsiteId } = useSEOStore();
  const { backlinks } = useBacklinkStore();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedWebsites = websites
      .filter((w) => w.domain?.toLowerCase().includes(q) || w.projectName?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((w) => ({
        type: 'Project',
        title: w.projectName || w.domain,
        subtitle: w.domain,
        icon: Globe,
        action: () => {
          setSelectedWebsiteId(w.id);
          navigate('/dashboard');
          onClose();
        }
      }));

    const matchedKeywords = keywords
      .filter((k) => !k.deletedAt && k.keyword?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((k) => ({
        type: 'Keyword',
        title: k.keyword,
        subtitle: `Rank: #${k.position || '–'} | Vol: ${k.volume?.toLocaleString() || '–'}`,
        icon: KeyRound,
        action: () => {
          if (k.websiteId) setSelectedWebsiteId(k.websiteId);
          navigate(`/keywords?highlight=${k.id}`);
          onClose();
        }
      }));

    const matchedBacklinks = backlinks
      .filter((b) => !b.deletedAt && (b.websiteName?.toLowerCase().includes(q) || b.websiteUrl?.toLowerCase().includes(q) || b.submittedUrl?.toLowerCase().includes(q)))
      .slice(0, 4)
      .map((b) => ({
        type: 'Backlink',
        title: b.websiteName,
        subtitle: `${b.status} | ${b.websiteUrl}`,
        icon: Link2,
        action: () => {
          if (b.projectId) setSelectedWebsiteId(b.projectId);
          navigate('/backlinks');
          onClose();
        }
      }));

    return [...matchedWebsites, ...matchedKeywords, ...matchedBacklinks];
  }, [query, websites, keywords, backlinks, navigate, setSelectedWebsiteId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card max-w-xl w-full p-0 overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, keyword, backlink, or project..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching keywords, backlinks, or projects found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div className="p-3 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-600 dark:text-slate-300">Quick Navigation:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-500">
                <button
                  type="button"
                  onClick={() => { navigate('/dashboard'); onClose(); }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left text-xs flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dashboard Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/backlinks'); onClose(); }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left text-xs flex items-center gap-2"
                >
                  <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Backlinks Command Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/keywords'); onClose(); }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left text-xs flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Keyword Intelligence</span>
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/site-audit'); onClose(); }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left text-xs flex items-center gap-2"
                >
                  <FileSearch className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Site Health & Audit</span>
                </button>
              </div>
            </div>
          )}

          {results.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-sm">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Search projects, keywords & backlinks</span>
          <div className="flex items-center gap-2">
            <span>Navigate: ↑↓</span>
            <span>Select: ↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
