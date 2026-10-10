import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  TrendingUp,
  Activity,
  FileSearch,
  Link2,
  Gauge,
  Bell,
  Settings,
  User,
  UserPlus,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Sun,
  Moon,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  FolderPlus,
  Folder,
  Trash2,
  PlusSquare,
  MoreHorizontal,
  Globe,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useBacklinkStore } from '../store/backlinkStore';
import { DateRangePicker } from '../components/DateRangePicker';
import { Tooltip } from '../components/Tooltip';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { AddBacklinkModal } from '../components/AddBacklinkModal';
import TrashPanel from '../components/TrashPanel';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/keywords', label: 'Keywords', icon: KeyRound },
  { path: '/rankings', label: 'Rankings', icon: TrendingUp },
  { path: '/site-audit', label: 'Site Audit', icon: Activity },
  { path: '/on-page-seo', label: 'On-Page SEO', icon: FileSearch },
  { path: '/backlinks', label: 'Backlinks', icon: Link2 },
  { path: '/performance', label: 'Performance', icon: Gauge },
];

const secondaryNavItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/users', label: 'Add User', icon: UserPlus, pmOnly: true },
  { path: '/profile', label: 'Profile', icon: User },
];

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const siteDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuthStore();
  const {
    websites,
    selectedWebsiteId,
    setSelectedWebsiteId,
    getSelectedWebsite,
    setGlobalSearchQuery,
    categories,
    keywords,
    projects,
    addCategory,
    softDeleteCategory,
    restoreCategory,
    purgeCategory,
    restoreKeyword,
    purgeKeyword,
    restoreProject,
    purgeProject,
    emptyTrash,
    addWebsite,
    loadDbData
  } = useSEOStore();
  const { backlinks, addBacklink, restoreBacklink, purgeBacklink } = useBacklinkStore();
  const { getUnreadCount } = useNotificationStore();

  const isPM = Boolean(user?.isPM || user?.role?.includes('PM') || user?.role?.includes('Project Manager'));

  useEffect(() => {
    loadDbData();
  }, []);

  const accessibleWebsites = useMemo(() => {
    return websites || [];
  }, [websites]);

  // Ensure selectedWebsiteId belongs to accessible projects
  useEffect(() => {
    if (accessibleWebsites.length > 0 && !accessibleWebsites.some((w) => w.id === selectedWebsiteId)) {
      setSelectedWebsiteId(accessibleWebsites[0].id);
    }
  }, [accessibleWebsites, selectedWebsiteId, setSelectedWebsiteId]);

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddBacklinkModalOpen, setIsAddBacklinkModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newProjDomain, setNewProjDomain] = useState('');
  const [newProjName, setNewProjName] = useState('');

  const currentSite = getSelectedWebsite();
  const unreadCount = getUnreadCount();

  const activeCategories = (categories || []).filter((c) => !c.deletedAt);

  const trashedKeywords = useMemo(() => (keywords || []).filter((k) => k.deletedAt), [keywords]);
  const trashedCategories = useMemo(() => (categories || []).filter((c) => c.deletedAt), [categories]);
  const trashedProjects = useMemo(() => (projects || []).filter((p) => p.deletedAt), [projects]);
  const trashedBacklinksList = useMemo(() => (backlinks || []).filter((b) => b.isDeleted || b.deletedAt), [backlinks]);
  const totalTrashCount = trashedKeywords.length + trashedCategories.length + trashedProjects.length + trashedBacklinksList.length;

  const handleBulkRestore = (type, ids) => {
    if (type === 'keywords') {
      ids.forEach((id) => restoreKeyword(id));
      toast.success(`Restored ${ids.length} keywords`);
    } else if (type === 'categories') {
      ids.forEach((id) => restoreCategory(id));
      toast.success(`Restored ${ids.length} categories`);
    } else if (type === 'projects') {
      ids.forEach((id) => restoreProject(id));
      toast.success(`Restored ${ids.length} projects`);
    } else if (type === 'backlinks') {
      ids.forEach((id) => restoreBacklink && restoreBacklink(id));
      toast.success(`Restored ${ids.length} backlinks`);
    }
  };

  const handleBulkPurge = (type, ids) => {
    if (type === 'keywords') {
      ids.forEach((id) => purgeKeyword(id));
      toast.success(`Permanently deleted ${ids.length} keywords`);
    } else if (type === 'categories') {
      ids.forEach((id) => purgeCategory(id));
      toast.success(`Permanently deleted ${ids.length} categories`);
    } else if (type === 'projects') {
      ids.forEach((id) => purgeProject(id));
      toast.success(`Permanently deleted ${ids.length} projects`);
    } else if (type === 'backlinks') {
      ids.forEach((id) => purgeBacklink && purgeBacklink(id));
      toast.success(`Permanently deleted ${ids.length} backlinks`);
    }
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    trashedBacklinksList.forEach((b) => purgeBacklink && purgeBacklink(b.id));
    toast.success('Trash emptied completely');
  };

  const getCategoryKeywordCount = (catName) => {
    return (keywords || []).filter(
      (k) => !k.deletedAt && k.group?.toLowerCase() === catName.toLowerCase()
    ).length;
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    const cat = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      projectId: selectedWebsiteId || 'site-1',
      deletedAt: null
    };
    addCategory(cat);
    toast.success(`Category "${cat.name}" added successfully`);
    setNewCatName('');
    setIsAddCategoryModalOpen(false);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjName.trim() && !newProjDomain.trim()) {
      toast.error('Please enter website name or URL');
      return;
    }
    const nameVal = newProjName.trim() || newProjDomain.trim();
    const domainVal = newProjDomain.trim() || (newProjName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + '.com');
    const site = addWebsite({
      domain: domainVal,
      projectName: nameVal
    });
    toast.success(`Website "${nameVal}" created`);
    setNewProjDomain('');
    setNewProjName('');
    setIsAddProjectModalOpen(false);
  };

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(e.target)) {
        setSiteDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSiteDropdownOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectSite = (siteId) => {
    setSelectedWebsiteId(siteId);
    setSiteDropdownOpen(false);
    toast.success(`Switched to ${websites.find(w => w.id === siteId)?.domain}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setGlobalSearchQuery(quickSearch.trim());
      navigate(`/keywords?search=${encodeURIComponent(quickSearch.trim())}`);
    }
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('SERP rankings and crawl metrics refreshed');
    }, 900);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Navigation - SysCorp Deep Navy Contrast with Pure White Main View */}
      <aside
        className={cn(
          'h-full flex-shrink-0 flex flex-col bg-[#071330] border-r border-[#183164]/80 text-white transition-all duration-300 ease-in-out z-40 lg:sticky lg:top-0 lg:h-screen shadow-[4px_0_24px_rgba(0,0,0,0.15)]',
          sidebarCollapsed ? 'w-[74px]' : 'w-64',
          mobileDrawerOpen ? 'fixed inset-y-0 left-0 z-50 translate-x-0' : 'fixed inset-y-0 left-0 z-50 -translate-x-full lg:static lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className={cn(
          'h-16 flex-shrink-0 flex items-center border-b border-[#183164]/70 transition-all bg-[#050e24]',
          sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}>
          {!sidebarCollapsed ? (
            <>
              <div
                className="flex items-center gap-2 overflow-hidden cursor-pointer group min-w-0"
                onClick={() => navigate('/dashboard')}
              >
                {/* Official SysCorp Logo (White Typography for Dark Navy Sidebar) */}
                <img
                  src="/syscorp-logo-dark.png"
                  alt="SysCorp <Think Simple/>"
                  className="h-8 max-w-[170px] object-contain group-hover:scale-[1.02] transition-transform duration-200"
                />
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f2452] transition-colors cursor-pointer"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Tooltip content="Expand Sidebar (Click)" position="right">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded-xl hover:bg-[#0f2452] flex items-center justify-center transition-all group relative cursor-pointer"
              >
                <img
                  src="/syscorp-icon-dark.png"
                  alt="SysCorp"
                  className="h-7 w-auto object-contain group-hover:scale-110 transition-transform"
                />
                <div className="absolute -right-1 -top-1 w-4 h-4 bg-[#050e24] border border-[#0062ff]/50 rounded-full flex items-center justify-center text-[#38bdf8] shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-2.5 h-2.5" />
                </div>
              </button>
            </Tooltip>
          )}

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f2452]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className={cn(
          'flex-1 overflow-y-auto overscroll-contain space-y-5',
          sidebarCollapsed ? 'px-2 py-4' : 'px-3 py-4'
        )}>
          {/* Main Section */}
          <div className="space-y-1.5 flex flex-col items-center">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase w-full">
                Analytics & Intel
              </p>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              const linkContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center rounded-xl text-xs font-semibold transition-all group relative',
                    sidebarCollapsed
                      ? 'w-10 h-10 justify-center'
                      : 'w-full gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-[#0062ff] to-[#004ecc] text-white shadow-lg shadow-[#0062ff]/35 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#0f2452]/70'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#38bdf8]')} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  
                  {item.hasBadge && unreadCount > 0 && (
                    <span
                      className={cn(
                        'rounded-full font-extrabold flex items-center justify-center',
                        sidebarCollapsed
                          ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px] bg-rose-500 text-white shadow-xs ring-2 ring-[#071330]'
                          : 'ml-auto px-1.5 py-0.5 text-[10px] ' + (isActive ? 'bg-white text-[#0062ff]' : 'bg-rose-500 text-white shadow-xs')
                      )}
                    >
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              );

              return sidebarCollapsed ? (
                <Tooltip key={item.path} content={item.label} position="right">
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              );
            })}

            {/* Trash & Recovery Option */}
            {(() => {
              const trashBtn = (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setIsTrashOpen(true);
                  }}
                  className={cn(
                    'flex items-center rounded-xl text-xs font-semibold transition-all group relative cursor-pointer',
                    sidebarCollapsed
                      ? 'w-10 h-10 justify-center'
                      : 'w-full gap-3 px-3 py-2.5',
                    isTrashOpen
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-300 hover:text-rose-400 hover:bg-rose-950/30'
                  )}
                >
                  <Trash2 className={cn(
                    'w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isTrashOpen ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'
                  )} />
                  {!sidebarCollapsed && <span className="truncate">Trash</span>}

                  {totalTrashCount > 0 && (
                    <span
                      className={cn(
                        'rounded-full font-extrabold flex items-center justify-center',
                        sidebarCollapsed
                          ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px] bg-rose-500 text-white shadow-xs ring-2 ring-[#071330]'
                          : 'ml-auto px-1.5 py-0.5 text-[10px] bg-rose-500 text-white shadow-xs'
                      )}
                    >
                      {totalTrashCount}
                    </span>
                  )}
                </button>
              );

              return sidebarCollapsed ? (
                <Tooltip key="trash-nav" content={`Trash (${totalTrashCount})`} position="right">
                  {trashBtn}
                </Tooltip>
              ) : (
                trashBtn
              );
            })()}
          </div>

          {/* Categories Section (Expanded Only) */}
          {!sidebarCollapsed && (
            <div className="border-t border-[#183164]/70 pt-3 space-y-1 w-full">
              <div className="px-3 pb-1 flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                  Categories
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-[#38bdf8] hover:text-white hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-0.5 max-h-36 overflow-y-auto px-1">
                {activeCategories.length === 0 ? (
                  <p className="px-3 py-1 text-[11px] text-slate-400 italic">No categories created</p>
                ) : (
                  activeCategories.map((cat) => {
                    const count = getCategoryKeywordCount(cat.name);
                    return (
                      <div
                        key={cat.id}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0f2452]/70 transition-all cursor-pointer"
                        onClick={() => navigate(`/keywords?category=${encodeURIComponent(cat.name)}`)}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#00d2ff] flex-shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              softDeleteCategory(cat.id);
                              toast.success(`Category "${cat.name}" moved to Trash`);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#0c1f4a] text-slate-300">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Section (Expanded Only) */}
          {!sidebarCollapsed && (
            <div className="border-t border-[#183164]/70 pt-3 space-y-1 w-full">
              <p className="px-3 pb-1 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                Quick Actions
              </p>

              <div className="space-y-1 px-1">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0f2452]/70 transition-all text-left cursor-pointer group"
                >
                  <PlusSquare className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>+ Add Project</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0f2452]/70 transition-all text-left cursor-pointer group"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>+ Add Category</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddBacklinkModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0f2452]/70 transition-all text-left cursor-pointer group"
                >
                  <Link2 className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>+ Add Backlink</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/keywords?modal=add')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#0f2452]/70 transition-all text-left cursor-pointer group"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span>+ Add Keyword</span>
                </button>
              </div>
            </div>
          )}

          {/* Configuration Section */}
          <div className={cn(
            'border-t border-[#183164]/70 pt-3 space-y-1.5 flex flex-col items-center',
            !sidebarCollapsed && 'w-full'
          )}>
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase w-full">
                System
              </p>
            )}
            {secondaryNavItems
              .filter((item) => !item.pmOnly || isPM)
              .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              const linkContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center rounded-xl text-xs font-semibold transition-all group',
                    sidebarCollapsed
                      ? 'w-10 h-10 justify-center'
                      : 'w-full gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-[#0062ff] to-[#004ecc] text-white shadow-lg shadow-[#0062ff]/35 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#0f2452]/70'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#38bdf8]')} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );

              return sidebarCollapsed ? (
                <Tooltip key={item.path} content={item.label} position="right">
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              );
            })}
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className={cn(
          'flex-shrink-0 p-3 border-t border-[#183164]/80 bg-[#050e24] flex items-center',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {sidebarCollapsed ? (
            <Tooltip content={`${user?.name || 'Account'} · Profile`} position="right">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="relative block rounded-xl focus:outline-hidden hover:scale-105 transition-transform cursor-pointer"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-xl ring-2 ring-[#0062ff]/40 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#050e24]" />
              </button>
            </Tooltip>
          ) : (
            <>
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/profile')}
              >
                <div className="relative">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full ring-2 ring-[#0062ff]/40 object-cover flex-shrink-0"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#050e24]" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.role || 'SEO Lead'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area - Fixed Viewport with Independent Scrolling */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#050e24]">
        {/* Topbar Header */}
        <header className="h-16 flex-shrink-0 px-4 sm:px-6 bg-white dark:bg-[#091838] border-b border-slate-200/80 dark:border-[#183164]/80 sticky top-0 z-30 flex items-center justify-between gap-3 shadow-xs">
          {/* Left: Mobile menu button & Active Project Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Project Switcher Dropdown */}
            <div className="relative" ref={siteDropdownRef}>
              <button
                type="button"
                onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                className="h-9 px-3 flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs transition-all cursor-pointer group max-w-[220px] sm:max-w-[280px]"
                title="Switch Active Project / Domain"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ring-2 animate-pulse ${isPM ? 'bg-amber-500 ring-amber-500/20' : 'bg-emerald-500 ring-emerald-500/20'}`} />
                <span className="truncate">{currentSite?.domain || currentSite?.projectName || 'Select Project'}</span>
                {isPM && (
                  <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-500 dark:text-amber-400">
                    PM
                  </span>
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 flex-shrink-0 ml-auto", siteDropdownOpen && "rotate-180")} />
              </button>

              {siteDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        {isPM ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>PM Monitor ({accessibleWebsites.length} Projects)</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>My Projects ({accessibleWebsites.length})</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isPM ? 'Viewing cross-team projects' : `Filtered for ${user?.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 px-1 space-y-0.5">
                    {accessibleWebsites.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
                        No projects assigned yet
                      </div>
                    ) : (
                      accessibleWebsites.map((site) => {
                        const isSelected = site.id === selectedWebsiteId;
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => handleSelectSite(site.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer",
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 font-medium"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <div className="truncate flex flex-col">
                                <span className="truncate">{site.domain}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-normal">
                                  {site.assignedName && (
                                    <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
                                      👤 {site.assignedName}
                                    </span>
                                  )}
                                  <span>• {site.totalKeywords || 0} kws</span>
                                </div>
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSiteDropdownOpen(false);
                        setIsAddProjectModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <PlusSquare className="w-3.5 h-3.5" />
                      <span>+ Add New Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Global Quick Search with Command Badge */}
          <div className="flex-1 max-w-md mx-2 lg:mx-4 min-w-[180px]">
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="w-full h-9 px-3.5 flex items-center justify-between text-xs bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-indigo-500/50 transition-all shadow-2xs group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                <span className="truncate">Search backlinks, keywords, projects...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-700/80 rounded-md border border-slate-200 dark:border-slate-600 shadow-2xs flex-shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Live Refresh Button */}
            <Tooltip content="Live SERP Refresh">
              <button
                type="button"
                onClick={handleRefreshData}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs flex-shrink-0 cursor-pointer',
                  isRefreshing && 'text-indigo-600 dark:text-indigo-400'
                )}
                aria-label="Refresh SERP ranking"
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-indigo-500')} />
              </button>
            </Tooltip>

            {/* Notifications Bell */}
            <Tooltip content="Notifications">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* User Dropdown */}
            <div className="relative flex-shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-9 px-2 flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:ring-2 hover:ring-indigo-500/30 transition-all flex-shrink-0 cursor-pointer"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user?.name}
                  className="w-6 h-6 rounded-lg object-cover flex-shrink-0"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[110px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                    <p className="text-[10px] text-indigo-400 font-medium mt-0.5">{user?.role}</p>
                  </div>

                  <div className="py-1 px-1">
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Account Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Platform Settings
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet - Independent Scroll View */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette / Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <FolderPlus className="w-4 h-4 text-indigo-500" />
                <span>Add New Category</span>
              </div>
              <button type="button" onClick={() => setIsAddCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Competitors, Rankings, Automation"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-lg shadow-sm shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProjectModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <PlusSquare className="w-5 h-5 text-[#0062ff]" />
                <span>Add Tracked Website</span>
              </div>
              <button type="button" onClick={() => setIsAddProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website Name <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. TechSphere Global"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0062ff] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. techsphere.io, mybrand.com"
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0062ff] text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0062ff] hover:bg-[#004ecc] rounded-xl shadow-md shadow-[#0062ff]/25 cursor-pointer transition-all"
                >
                  Create Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Backlink Modal */}
      <AddBacklinkModal
        isOpen={isAddBacklinkModalOpen}
        onClose={() => setIsAddBacklinkModalOpen(false)}
        onSave={(b) => {
          addBacklink(b);
          toast.success(`Backlink added for ${b.websiteName}`);
        }}
        currentProjectId={selectedWebsiteId}
        defaultSubmittedUrl={currentSite ? `https://${currentSite.domain}` : ''}
      />

      {/* Global Trash & Recovery Drawer Panel */}
      <TrashPanel
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashedProjects={trashedProjects}
        trashedCategories={trashedCategories}
        trashedKeywords={trashedKeywords}
        trashedBacklinks={trashedBacklinksList}
        allProjects={projects || []}
        allCategories={categories || []}
        onRestoreProject={(p) => {
          restoreProject(p);
          toast.success("Project restored from Trash");
        }}
        onRestoreCategory={(c) => {
          restoreCategory(c);
          toast.success("Category restored from Trash");
        }}
        onRestoreKeyword={(k) => {
          restoreKeyword(k);
          toast.success("Keyword restored from Trash");
        }}
        onRestoreBacklink={(b) => {
          restoreBacklink(b);
          toast.success("Backlink restored from Trash");
        }}
        onPurgeProject={(p) => {
          purgeProject(p);
          toast.success("Project permanently deleted");
        }}
        onPurgeCategory={(c) => {
          purgeCategory(c);
          toast.success("Category permanently deleted");
        }}
        onPurgeKeyword={(k) => {
          purgeKeyword(k);
          toast.success("Keyword permanently deleted");
        }}
        onPurgeBacklink={(b) => {
          purgeBacklink(b);
          toast.success("Backlink permanently deleted");
        }}
        onBulkRestore={handleBulkRestore}
        onBulkPurge={handleBulkPurge}
        onEmptyTrash={handleEmptyTrash}
      />
    </div>
  );
}
