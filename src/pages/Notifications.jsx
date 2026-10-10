import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Link2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { formatTimeAgo } from '../utils/formatters';
import toast from 'react-hot-toast';

export function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification
  } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.read;
    if (activeFilter === 'rankings') return notif.category === 'rankings';
    if (activeFilter === 'backlinks') return notif.category === 'backlinks';
    if (activeFilter === 'crawl') return notif.category === 'crawl';
    return true; // 'all'
  });

  const handleSimulateNewAlert = () => {
    const alertTypes = [
      {
        type: 'ranking_drop',
        category: 'rankings',
        title: 'Keyword Drop Alert: "data governance tools for enterprises"',
        message: 'Rank slipped from #12 to #15 (-3 positions). Competitor Collibra launched new page.',
        link: '/keywords'
      },
      {
        type: 'ranking_gain',
        category: 'rankings',
        title: 'Top 3 Ranking Milestone: "rag pipeline data preprocessing"',
        message: 'Your article advanced to #4 (+4 positions) in Google US.',
        link: '/keywords'
      },
      {
        type: 'new_backlink',
        category: 'backlinks',
        title: 'High-DR Backlink Detected: Forbes Tech Council (DR 94)',
        message: 'Featured as a recommended cloud data warehouse provider.',
        link: '/backlinks'
      },
      {
        type: 'technical_error',
        category: 'crawl',
        title: 'Crawl Alert: 3 Canonical Tag Mismatches',
        message: 'Found non-self-referencing canonical URLs in blog pagination archive.',
        link: '/site-audit'
      }
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    addNotification(randomAlert);
    toast(randomAlert.title, {
      icon: '🔔',
      duration: 5000
    });
  };

  const getNotifIcon = (type) => {
    if (type === 'ranking_gain') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (type === 'ranking_drop') return <TrendingDown className="w-4 h-4 text-rose-500" />;
    if (type === 'new_backlink') return <Link2 className="w-4 h-4 text-sky-500" />;
    if (type === 'technical_error') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <RefreshCw className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Alerts & SEO Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time triggers for ranking volatility, crawl warnings, and high-authority link discoveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateNewAlert}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Live Alert</span>
          </button>

          <button
            type="button"
            onClick={() => {
              markAllAsRead();
              toast.success('Marked all notifications as read');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: 'Unread Only' },
          { id: 'rankings', label: 'Rankings' },
          { id: 'backlinks', label: 'Backlinks' },
          { id: 'crawl', label: 'Site Audit & Crawl' }
        ].map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No notifications matching your filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    !notif.read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>{formatTimeAgo(notif.timestamp)}</span>
                        {notif.link && (
                          <button
                            type="button"
                            onClick={() => {
                              markAsRead(notif.id);
                              navigate(notif.link);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notif.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
