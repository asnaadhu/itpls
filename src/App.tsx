/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AiInsights } from './components/AiInsights';
import { CustomReports } from './components/CustomReports';
import { ExportImportModal } from './components/ExportImportModal';
import { FinancialTable } from './components/FinancialTable';
import { Header } from './components/Header';
import { LineItemManagerModal } from './components/LineItemManagerModal';
import { QuickDataEntry } from './components/QuickDataEntry';
import { LoginPage } from './components/LoginPage';
import { ScreenshotUploadModal } from './components/ScreenshotUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { Visualizations } from './components/Visualizations';
import { DEFAULT_USERS } from './data/defaultUsers';
import { createZeroedYearData, INITIAL_YEAR_DATA, MONTH_NAMES } from './data/defaultData';
import { User, UserRole, ViewMode, YearData, AuditLog } from './types';
import { computeReportSummary, exportToCSV } from './utils/financialUtils';
import {
  checkIsSupabaseConfigured,
  getSupabase,
  fetchAllFinancialRecordsFromSupabase,
  syncFinancialDataToSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
} from './lib/supabase';

const MULTI_YEAR_STORAGE_KEY = 'ytd_expense_tracker_multi_year_v2';
const LEGACY_STORAGE_KEY = 'ytd_expense_tracker_data_v3';
const USERS_STORAGE_KEY = 'ytd_users_list_v1';
const AUTH_USER_KEY = 'ytd_current_user_v1';
const AUDIT_LOGS_KEY = 'ytd_audit_logs_v1';

export default function App() {
  // User Management & Authentication State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load users list:', e);
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users list:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to persist auth state:', e);
    }
  }, [currentUser]);

  // Financial Multi-Year Data State
  const [allYearsData, setAllYearsData] = useState<Record<number, YearData>>(() => {
    try {
      const savedMulti = localStorage.getItem(MULTI_YEAR_STORAGE_KEY);
      if (savedMulti) {
        const parsed = JSON.parse(savedMulti);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
      const savedSingle = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedSingle) {
        const parsedSingle = JSON.parse(savedSingle);
        const year = parsedSingle.year || 2026;
        return { [year]: parsedSingle };
      }
    } catch (e) {
      console.error('Failed to load saved financial multi-year DB:', e);
    }
    return { 2026: INITIAL_YEAR_DATA };
  });

  const availableYears = Object.keys(allYearsData).map(Number).sort((a, b) => a - b);

  const [activeYear, setActiveYear] = useState<number>(() => {
    const keys = Object.keys(allYearsData).map(Number);
    return keys.length > 0 ? keys[0] : 2026;
  });

  const yearData = allYearsData[activeYear] || createZeroedYearData('Information & Telecommunication Systems', activeYear);

  const setYearData = (updater: YearData | ((prev: YearData) => YearData)) => {
    setAllYearsData((prevAll) => {
      const current = prevAll[activeYear] || createZeroedYearData('Information & Telecommunication Systems', activeYear);
      const updated = typeof updater === 'function' ? updater(current) : updater;
      return { ...prevAll, [activeYear]: updated };
    });
  };

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0); // January
  const [ytdThroughMonthIndex, setYtdThroughMonthIndex] = useState<number>(0); // January
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [pctBaselineMode, setPctBaselineMode] = useState<'revenue' | 'totalExpenses'>('revenue');

  // System Audit Logging State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
    return [
      {
        id: 'init-1',
        timestamp: new Date().toISOString(),
        userName: 'System Initialization',
        userRole: 'admin',
        action: 'SYSTEM_STARTUP',
        details: 'System Audit Logging active. System initialized securely.',
        category: 'system',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Failed to persist audit logs:', e);
    }
  }, [auditLogs]);

  const addAuditLog = (
    action: string,
    details: string,
    category: 'finance' | 'users' | 'system' | 'auth' = 'system'
  ) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Authorized User',
      userRole: currentUser?.role || 'user',
      action,
      details,
      category,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    addAuditLog('CLEAR_AUDIT_LOGS', 'System audit logs were cleared by administrator.', 'system');
  };

  // Modals
  const [isAddLineItemOpen, setIsAddLineItemOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'years' | 'users' | 'profile' | 'audit'>('years');

  const handleOpenSettings = (tab: 'years' | 'users' | 'profile' | 'audit' = 'years') => {
    if (currentUser?.role !== 'admin') {
      alert('Access Denied: Settings are restricted to Administrators.');
      return;
    }
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // User Management Handlers
  const handleAddUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...newUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, user]);
    if (checkIsSupabaseConfigured()) {
      saveUserToSupabase(user);
    }
    addAuditLog(
      'ADD_USER',
      `Added new user "${user.name}" (@${user.username}) with role: ${user.role.toUpperCase()}`,
      'users'
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    if (checkIsSupabaseConfigured()) {
      saveUserToSupabase(updatedUser);
    }
    addAuditLog(
      'UPDATE_USER',
      `Updated profile details for user "${updatedUser.name}" (@${updatedUser.username})`,
      'users'
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole };
          if (checkIsSupabaseConfigured()) saveUserToSupabase(updated);
          return updated;
        }
        return u;
      })
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    addAuditLog(
      'UPDATE_USER_ROLE',
      `Changed security role for "${target?.name || userId}" to ${newRole.toUpperCase()}`,
      'users'
    );
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (checkIsSupabaseConfigured()) {
      deleteUserFromSupabase(userId);
    }
    addAuditLog(
      'DELETE_USER',
      `Deleted user account "${target?.name || userId}" (@${target?.username || ''})`,
      'users'
    );
  };

  const handleChangePassword = (userId: string, newPassword: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: newPassword };
          if (checkIsSupabaseConfigured()) saveUserToSupabase(updated);
          return updated;
        }
        return u;
      })
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPassword } : null));
    }
    addAuditLog(
      'CHANGE_PASSWORD',
      `Updated password for user "${target?.name || userId}"`,
      'users'
    );
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      details: `User "${user.name}" (@${user.username}) logged in successfully.`,
      category: 'auth',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', `User "${currentUser.name}" logged out.`, 'auth');
    }
    setCurrentUser(null);
  };

  // Continuous Multi-Device Sync & Realtime Channel Listener
  useEffect(() => {
    let isSubscribed = true;

    const syncRemoteData = async () => {
      if (!checkIsSupabaseConfigured()) return;

      try {
        // 1. Fetch Users from Supabase
        const remoteUsers = await fetchUsersFromSupabase();
        if (isSubscribed && remoteUsers && remoteUsers.length > 0) {
          setUsers(remoteUsers);
        } else if (isSubscribed && (!remoteUsers || remoteUsers.length === 0)) {
          DEFAULT_USERS.forEach((u) => saveUserToSupabase(u));
        }

        // 2. Fetch Financial Records from Supabase
        const remoteRecords = await fetchAllFinancialRecordsFromSupabase();
        if (isSubscribed && remoteRecords && Object.keys(remoteRecords).length > 0) {
          setAllYearsData(remoteRecords);
        } else if (isSubscribed && (!remoteRecords || Object.keys(remoteRecords).length === 0)) {
          syncFinancialDataToSupabase(2026, INITIAL_YEAR_DATA);
        }
      } catch (err) {
        console.warn('Background sync error:', err);
      }
    };

    // Initial load
    syncRemoteData();

    // Poll every 6 seconds for live multi-device sync
    const interval = setInterval(syncRemoteData, 6000);

    // Sync on window/tab focus
    const handleFocus = () => syncRemoteData();
    window.addEventListener('focus', handleFocus);

    // Supabase Realtime Postgres Changes Subscription
    let channel: any = null;
    const client = getSupabase();
    if (client) {
      try {
        channel = client
          .channel('public-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            syncRemoteData();
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (channel && client) {
        try {
          client.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, []);

  // Save to LocalStorage whenever allYearsData updates & push to Supabase
  useEffect(() => {
    try {
      localStorage.setItem(MULTI_YEAR_STORAGE_KEY, JSON.stringify(allYearsData));
    } catch (e) {
      console.error('Failed to persist multi-year data:', e);
    }

    if (checkIsSupabaseConfigured()) {
      Object.entries(allYearsData).forEach(([yrStr, data]) => {
        const yr = Number(yrStr);
        if (yr && data) {
          syncFinancialDataToSupabase(yr, data as YearData);
        }
      });
    }
  }, [allYearsData]);

  // Year Manager Handlers
  const handleSelectYear = (yr: number) => {
    if (allYearsData[yr]) {
      setActiveYear(yr);
      addAuditLog('SWITCH_YEAR', `Switched active database to FY ${yr}`, 'system');
    }
  };

  const handleCreateNewYear = (
    newYear: number,
    options: { carryOverActualsAsLastYear: boolean }
  ) => {
    const newYearData = createZeroedYearData(
      yearData.departmentName,
      newYear,
      yearData.categories,
      yearData.lineItems,
      options.carryOverActualsAsLastYear ? yearData.months : undefined
    );

    setAllYearsData((prev) => ({
      ...prev,
      [newYear]: newYearData,
    }));
    setActiveYear(newYear);
    addAuditLog(
      'CREATE_YEAR',
      `Created new FY ${newYear} database (Rollover option: ${options.carryOverActualsAsLastYear ? 'Yes' : 'Clean Slate'})`,
      'system'
    );
  };

  const handleDeleteYear = (yr: number) => {
    setAllYearsData((prev) => {
      const next = { ...prev };
      delete next[yr];
      return next;
    });
    const remaining = Object.keys(allYearsData).map(Number).filter((y) => y !== yr);
    if (remaining.length > 0) {
      setActiveYear(remaining[0]);
    }
    addAuditLog('DELETE_YEAR', `Deleted FY ${yr} financial database`, 'system');
  };

  // Compute summary metrics
  const summary = computeReportSummary(
    yearData,
    selectedMonthIndex,
    ytdThroughMonthIndex,
    pctBaselineMode
  );

  // Handlers
  const handleUpdateDepartmentName = (name: string) => {
    setYearData((prev) => ({ ...prev, departmentName: name }));
    addAuditLog('UPDATE_DEPT', `Renamed department to "${name}"`, 'system');
  };

  const handleUpdateMonthValue = (
    monthIndex: number,
    lineItemId: string,
    field: 'actual' | 'budget' | 'lastYear',
    value: number
  ) => {
    setYearData((prev) => {
      const newMonths = [...prev.months];
      const monthObj = { ...newMonths[monthIndex] };
      const newItems = { ...monthObj.items };

      newItems[lineItemId] = {
        ...(newItems[lineItemId] || { actual: 0, budget: 0, lastYear: 0 }),
        [field]: value,
      };

      monthObj.items = newItems;
      newMonths[monthIndex] = monthObj;

      return { ...prev, months: newMonths };
    });
    const itemObj = yearData.lineItems.find((i) => i.id === lineItemId);
    addAuditLog(
      'FINANCE_UPDATE',
      `Updated ${field.toUpperCase()} for "${itemObj?.name || lineItemId}" in ${MONTH_NAMES[monthIndex]} (${yearData.year}) to $${value.toLocaleString()}`,
      'finance'
    );
  };

  const handleBulkUpdateMonth = (
    monthIndex: number,
    items: Record<string, { actual: number; budget: number; lastYear: number }>
  ) => {
    setYearData((prev) => {
      const newMonths = [...prev.months];
      newMonths[monthIndex] = {
        ...newMonths[monthIndex],
        items,
      };
      return { ...prev, months: newMonths };
    });
    addAuditLog(
      'FINANCE_BULK_UPDATE',
      `Bulk updated entries for ${MONTH_NAMES[monthIndex]} (${yearData.year})`,
      'finance'
    );
  };

  const handleUpdateRevenueBaseline = (monthIndex: number, revenue: number) => {
    setYearData((prev) => {
      const newMonths = [...prev.months];
      newMonths[monthIndex] = {
        ...newMonths[monthIndex],
        revenueBaseline: revenue,
      };
      return { ...prev, months: newMonths };
    });
    addAuditLog(
      'FINANCE_REVENUE',
      `Set revenue baseline for ${MONTH_NAMES[monthIndex]} to $${revenue.toLocaleString()}`,
      'finance'
    );
  };

  const handleAddLineItem = (categoryId: string, name: string) => {
    const newId = 'custom_' + Date.now();
    const newItem = { id: newId, categoryId, name };

    setYearData((prev) => {
      const newLineItems = [...prev.lineItems, newItem];
      const newMonths = prev.months.map((m) => ({
        ...m,
        items: {
          ...m.items,
          [newId]: { actual: 0, budget: 0, lastYear: 0 },
        },
      }));

      return {
        ...prev,
        lineItems: newLineItems,
        months: newMonths,
      };
    });
    addAuditLog('ADD_LINE_ITEM', `Added new expense line item "${name}"`, 'finance');
  };

  const handleDeleteLineItem = (lineItemId: string) => {
    const item = yearData.lineItems.find((i) => i.id === lineItemId);
    if (confirm('Are you sure you want to delete this custom line item?')) {
      setYearData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((i) => i.id !== lineItemId),
      }));
      addAuditLog('DELETE_LINE_ITEM', `Deleted line item "${item?.name || lineItemId}"`, 'finance');
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(
      yearData,
      selectedMonthIndex,
      ytdThroughMonthIndex
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${yearData.departmentName.replace(/\s+/g, '_')}_YTD_${MONTH_NAMES[ytdThroughMonthIndex]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectActiveMonth = (idx: number) => {
    setSelectedMonthIndex(idx);
    setYtdThroughMonthIndex(idx);
  };

  if (!currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-zinc-900 font-sans flex flex-col lg:flex-row selection:bg-black selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        departmentName={yearData.departmentName}
        onUpdateDepartmentName={handleUpdateDepartmentName}
        currentYear={activeYear}
        availableYears={availableYears}
        onSelectYear={handleSelectYear}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        currentUser={currentUser}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        onOpenAddLineItem={() => setIsAddLineItemOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 lg:pl-72 pt-16 lg:pt-0 min-w-0 transition-all p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* App Header / Dashboard Banner */}
          <Header
            departmentName={yearData.departmentName}
            selectedMonthIndex={selectedMonthIndex}
            onSelectMonth={handleSelectActiveMonth}
            ytdThroughMonthIndex={ytdThroughMonthIndex}
            onSelectYtdMonth={setYtdThroughMonthIndex}
            onExportCSV={handleExportCSV}
            currentYear={activeYear}
            currentUser={currentUser}
          />

          {/* Main Content Area */}
          <main className="flex-1">
            {viewMode === 'table' && (
              <FinancialTable
                yearData={yearData}
                summary={summary}
                selectedMonthIndex={selectedMonthIndex}
                ytdThroughMonthIndex={ytdThroughMonthIndex}
                onUpdateMonthValue={handleUpdateMonthValue}
                onUpdateRevenueBaseline={handleUpdateRevenueBaseline}
                pctBaselineMode={pctBaselineMode}
                onTogglePctBaselineMode={setPctBaselineMode}
                currentUser={currentUser}
              />
            )}

            {viewMode === 'visualizations' && (
              <Visualizations
                yearData={yearData}
                summary={summary}
                selectedMonthIndex={selectedMonthIndex}
                ytdThroughMonthIndex={ytdThroughMonthIndex}
              />
            )}

            {viewMode === 'reports' && (
              <CustomReports
                yearData={yearData}
                selectedMonthIndex={selectedMonthIndex}
                ytdThroughMonthIndex={ytdThroughMonthIndex}
              />
            )}

            {viewMode === 'data-entry' && (
              <QuickDataEntry
                yearData={yearData}
                selectedMonthIndex={selectedMonthIndex}
                onSelectMonth={handleSelectActiveMonth}
                onUpdateMonthValue={handleUpdateMonthValue}
                onBulkUpdateMonth={handleBulkUpdateMonth}
                onOpenScreenshotModal={() => setIsScreenshotModalOpen(true)}
                currentUser={currentUser}
              />
            )}

            {viewMode === 'insights' && (
              <AiInsights
                yearData={yearData}
                summary={summary}
                selectedMonthIndex={selectedMonthIndex}
                ytdThroughMonthIndex={ytdThroughMonthIndex}
                onSelectMonth={handleSelectActiveMonth}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="mt-8 pt-4 border-t border-zinc-200 text-zinc-500 py-3 text-center text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© {activeYear} {yearData.departmentName} • YTD Financial Engine</p>
              <div className="flex items-center gap-3 text-zinc-600 font-medium">
                <span>Auto-saved</span>
                <span>•</span>
                <button
                  onClick={() => setIsExportImportOpen(true)}
                  className="hover:text-black underline font-bold cursor-pointer"
                >
                  Data Export & Backup
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Modals */}
      <LineItemManagerModal
        isOpen={isAddLineItemOpen}
        onClose={() => setIsAddLineItemOpen(false)}
        yearData={yearData}
        onAddLineItem={handleAddLineItem}
        onDeleteLineItem={handleDeleteLineItem}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        yearData={yearData}
        onImportJSON={(data) => setYearData(data)}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
      />

      <ScreenshotUploadModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        yearData={yearData}
        activeMonthIndex={selectedMonthIndex}
        onBulkUpdateMonth={handleBulkUpdateMonth}
        onSelectMonth={handleSelectActiveMonth}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeTab={settingsTab}
        availableYears={availableYears}
        activeYear={activeYear}
        onSelectYear={handleSelectYear}
        onCreateNewYear={handleCreateNewYear}
        onDeleteYear={handleDeleteYear}
        currentUser={currentUser}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onUpdateUserRole={handleUpdateUserRole}
        onDeleteUser={handleDeleteUser}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
        auditLogs={auditLogs}
        onClearAuditLogs={handleClearAuditLogs}
        activeYearData={yearData}
      />
    </div>
  );
}
