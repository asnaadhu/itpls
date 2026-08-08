import React, { useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Edit3,
  FileSpreadsheet,
  FileText,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Table as TableIcon,
  X,
} from 'lucide-react';
import { User, ViewMode } from '../types';

interface SidebarProps {
  departmentName: string;
  onUpdateDepartmentName: (name: string) => void;
  currentYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  currentUser: User | null;
  onOpenSettings: (tab?: 'years' | 'users' | 'profile') => void;
  onLogout: () => void;
  onOpenAddLineItem: () => void;
  onOpenExportImport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  departmentName,
  onUpdateDepartmentName,
  currentYear,
  availableYears,
  onSelectYear,
  viewMode,
  onSelectViewMode,
  currentUser,
  onOpenSettings,
  onLogout,
  onOpenAddLineItem,
  onOpenExportImport,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(departmentName);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onUpdateDepartmentName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const navItems: Array<{ mode: ViewMode; label: string; icon: React.ReactNode; badge?: string }> = [
    { mode: 'table', label: 'Financial Grid', icon: <TableIcon className="w-4 h-4" /> },
    { mode: 'visualizations', label: 'Analytics & Charts', icon: <BarChart3 className="w-4 h-4" /> },
    { mode: 'reports', label: 'Custom Reports', icon: <FileText className="w-4 h-4" /> },
    { mode: 'data-entry', label: 'Monthly Input Form', icon: <Sliders className="w-4 h-4" /> },
    { mode: 'insights', label: 'AI Assistance', icon: <Sparkles className="w-4 h-4 text-amber-300" />, badge: 'AI' },
  ];

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black text-white px-4 py-3 border-b border-zinc-800 flex items-center justify-between shadow-md print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-white text-black flex items-center justify-center font-black text-base shadow-sm">
            F.
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-sm text-white truncate max-w-[180px] sm:max-w-[280px]">
              {departmentName}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              FY {currentYear} • YTD Manager
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all cursor-pointer"
          title="Toggle Navigation Menu"
        >
          {isOpenMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Main Sidebar Container (Desktop Sidebar + Mobile Slide-Over Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-black text-white p-5 flex flex-col justify-between border-r border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out select-none print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-none bg-white text-black flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                F.
              </div>
              <div className="min-w-0">
                {isEditingTitle ? (
                  <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 text-white text-xs font-black px-2 py-1 rounded-none focus:outline-none w-full max-w-[130px]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-white text-black p-1 rounded-none text-xs font-bold shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <h1
                    onClick={() => {
                      if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
                        setIsEditingTitle(true);
                      }
                    }}
                    className={`text-base font-black tracking-tight text-white flex items-center gap-1.5 group transition-colors ${
                      currentUser?.role === 'admin' || currentUser?.role === 'manager'
                        ? 'hover:text-zinc-300 cursor-pointer'
                        : 'cursor-default'
                    }`}
                    title={
                      currentUser?.role === 'admin' || currentUser?.role === 'manager'
                        ? 'Click to edit department name'
                        : undefined
                    }
                  >
                    <span className="truncate max-w-[150px]">{departmentName}</span>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity shrink-0" />
                    )}
                  </h1>
                )}
                <p className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase">
                  Financial Controller
                </p>
              </div>
            </div>

            {/* Mobile Close Button inside Drawer */}
            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Financial Year Selector Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-none flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Active Financial Year
              </span>
              <select
                value={currentYear}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    onOpenSettings('years');
                  } else {
                    onSelectYear(Number(e.target.value));
                  }
                }}
                className="bg-transparent text-white font-mono font-black text-sm cursor-pointer focus:outline-none pt-0.5"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-zinc-900 text-white font-bold">
                    FY {yr}
                  </option>
                ))}
                {currentUser?.role === 'admin' && (
                  <option value="new" className="bg-zinc-900 text-amber-400 font-bold">
                    + New FY...
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-2">
              Navigation Menu
            </p>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = viewMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => {
                      onSelectViewMode(item.mode);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-none text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1 pt-2 border-t border-zinc-800/80">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 mb-2">
              Quick Ledger Tools
            </p>

            {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <button
                onClick={() => {
                  onOpenAddLineItem();
                  setIsOpenMobile(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-none transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Add Custom Line Item</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenExportImport();
                setIsOpenMobile(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-none transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Backup & Import JSON</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: My Profile & Sign Out */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          {currentUser && (
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-none space-y-3">
              {/* User Profile Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-none font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-sm ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-400 text-black'
                        : currentUser.role === 'manager'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 text-white'
                    }`}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-black text-white truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings Button with Gear Icon - ADMIN ONLY */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    onOpenSettings('years');
                    setIsOpenMobile(false);
                  }}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-none text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Settings</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-200 hover:text-white rounded-none text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Sign Out of Account"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-zinc-500 font-semibold text-center">
            YTD Ledger Engine v2.5
          </p>
        </div>
      </aside>
    </>
  );
};
