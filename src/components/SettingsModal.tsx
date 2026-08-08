import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Edit3,
  FileText,
  Filter,
  History,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { User, UserRole, AuditLog } from '../types';
import {
  checkIsSupabaseConfigured,
  getSupabaseCredentials,
  testSupabaseConnection,
  syncFinancialDataToSupabase,
} from '../lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: 'years' | 'users' | 'profile' | 'audit' | 'supabase';
  // Financial Year DB Props
  availableYears: number[];
  activeYear: number;
  onSelectYear: (year: number) => void;
  onCreateNewYear: (
    newYear: number,
    options: { carryOverActualsAsLastYear: boolean }
  ) => void;
  onDeleteYear: (year: number) => void;
  // User Management Props
  currentUser: User | null;
  users: User[];
  onAddUser: (newUser: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onChangePassword?: (userId: string, newPassword: string) => void;
  onLogout: () => void;
  // Audit Logs Props
  auditLogs?: AuditLog[];
  onClearAuditLogs?: () => void;
  activeYearData?: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeTab: initialActiveTab = 'years',
  availableYears,
  activeYear,
  onSelectYear,
  onCreateNewYear,
  onDeleteYear,
  currentUser,
  users,
  onAddUser,
  onUpdateUser,
  onUpdateUserRole,
  onDeleteUser,
  onChangePassword,
  onLogout,
  auditLogs = [],
  onClearAuditLogs,
  activeYearData,
}) => {
  const [activeTab, setActiveTab] = useState<'years' | 'users' | 'profile' | 'audit' | 'supabase'>(
    initialActiveTab || 'years'
  );

  // Supabase Sync State
  const [supabaseTesting, setSupabaseTesting] = useState<boolean>(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [supabaseSyncing, setSupabaseSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialActiveTab || 'years');
    }
  }, [initialActiveTab, isOpen]);

  // Financial Year State
  const highestYear = Math.max(...availableYears, 2026);
  const [newYearInput, setNewYearInput] = useState<number>(highestYear + 1);
  const [carryOverOption, setCarryOverOption] = useState<boolean>(true);

  // User Add Form State
  const [showAddUserForm, setShowAddUserForm] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('manager');
  const [newDept, setNewDept] = useState<string>('Finance & Planning');

  // User Edit Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('manager');
  const [editDept, setEditDept] = useState<string>('');

  // Password Change State
  const [passwordChangeInput, setPasswordChangeInput] = useState<string>('');

  // Audit Log State
  const [searchAudit, setSearchAudit] = useState<string>('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'all' | 'finance' | 'users' | 'system' | 'auth'>('all');

  // Toast / Status Message
  const [toastMsg, setToastMsg] = useState<string>('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleTestSupabaseConnection = async () => {
    setSupabaseTesting(true);
    setSupabaseStatusMsg(null);
    const result = await testSupabaseConnection();
    setSupabaseTesting(false);
    setSupabaseStatusMsg(result);
  };

  const handleSyncToSupabase = async () => {
    if (!activeYearData) {
      alert('No active financial year data available to sync.');
      return;
    }
    setSupabaseSyncing(true);
    setSupabaseStatusMsg(null);
    const result = await syncFinancialDataToSupabase(activeYear, activeYearData);
    setSupabaseSyncing(false);
    setSupabaseStatusMsg(result);
    if (result.success) {
      showToast(`FY ${activeYear} synced to Supabase database!`);
    }
  };

  const handleCreateYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput || newYearInput < 2000 || newYearInput > 2100) {
      alert('Please enter a valid financial year between 2000 and 2100.');
      return;
    }

    if (availableYears.includes(newYearInput)) {
      alert(`Financial Year ${newYearInput} already exists! Select it from the list above.`);
      return;
    }

    onCreateNewYear(newYearInput, { carryOverActualsAsLastYear: carryOverOption });
    showToast(`FY ${newYearInput} database successfully initialized!`);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Please fill in all required user fields.');
      return;
    }

    // Check duplicate username or email
    const duplicate = users.find(
      (u) =>
        u.username.toLowerCase() === newUsername.trim().toLowerCase() ||
        u.email.toLowerCase() === newEmail.trim().toLowerCase()
    );
    if (duplicate) {
      alert('A user account with this username or email already exists.');
      return;
    }

    onAddUser({
      username: newUsername.trim(),
      name: newName.trim(),
      email: newEmail.trim(),
      password: newPassword.trim(),
      role: newRole,
      department: newDept.trim() || 'General Department',
    });

    // Reset form
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setShowAddUserForm(false);
    showToast(`User account "${newName}" created successfully!`);
  };

  const handleStartEditingUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditUsername(u.username);
    setEditEmail(u.email);
    setEditPassword(u.password || '');
    setEditRole(u.role);
    setEditDept(u.department || 'Finance & Planning');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editUsername.trim() || !editEmail.trim()) {
      alert('Name, Username, and Email are required.');
      return;
    }

    // Check duplicate username/email amongst other users
    const duplicate = users.find(
      (u) =>
        u.id !== editingUser.id &&
        (u.username.toLowerCase() === editUsername.trim().toLowerCase() ||
          u.email.toLowerCase() === editEmail.trim().toLowerCase())
    );
    if (duplicate) {
      alert('Another user is already using this username or email.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editName.trim(),
      username: editUsername.trim(),
      email: editEmail.trim(),
      role: editRole,
      department: editDept.trim(),
      password: editPassword.trim() || editingUser.password,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    } else {
      onUpdateUserRole(editingUser.id, editRole);
    }

    setEditingUser(null);
    showToast(`Updated user account details for "${updatedUser.name}".`);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!passwordChangeInput.trim()) {
      alert('Password cannot be empty.');
      return;
    }

    if (onChangePassword) {
      onChangePassword(currentUser.id, passwordChangeInput.trim());
      setPasswordChangeInput('');
      showToast('Password updated successfully!');
    }
  };

  const handleExportAuditLogsCSV = () => {
    if (!auditLogs || auditLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }

    let csvContent = 'ID,Timestamp,Category,Action,User,Role,Details\n';
    auditLogs.forEach((log) => {
      const row = [
        `"${log.id}"`,
        `"${log.timestamp}"`,
        `"${log.category}"`,
        `"${log.action}"`,
        `"${log.userName.replace(/"/g, '""')}"`,
        `"${log.userRole}"`,
        `"${log.details.replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log exported to CSV!');
  };

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesCategory =
      auditCategoryFilter === 'all' || log.category === auditCategoryFilter;
    const query = searchAudit.toLowerCase().trim();
    const matchesSearch =
      !query ||
      log.userName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.userRole.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 text-zinc-900 rounded-none max-w-3xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-black p-1.5 rounded-none hover:bg-zinc-100 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-black text-white rounded-none shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black tracking-tight">
              System Settings & Security Audit
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Financial databases, authorized users, activity audit trails, and system access logs
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('years')}
            className={`px-3.5 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'years'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Financial Years ({availableYears.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
            }`}
          >
            <History className="w-4 h-4" />
            <span>System Audit ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Active Session</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50 font-black'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Supabase Database (Connected)</span>
          </button>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-black text-white p-3 rounded-none text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* TAB 1: FINANCIAL YEARS */}
        {activeTab === 'years' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            {/* Existing Years Grid */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-wider block">
                Available Financial Databases
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableYears.map((yr) => {
                  const isActive = yr === activeYear;
                  return (
                    <div
                      key={yr}
                      className={`p-3.5 rounded-none border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-zinc-50 text-zinc-900 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4" />
                        <span className="font-mono font-black text-sm">FY {yr}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded-none">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isActive && (
                          <button
                            onClick={() => onSelectYear(yr)}
                            className="text-xs font-bold px-3 py-1 bg-white text-black hover:bg-zinc-200 rounded-none transition-colors cursor-pointer"
                          >
                            Switch
                          </button>
                        )}
                        {availableYears.length > 1 && !isActive && currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete FY ${yr} database?`)) {
                                onDeleteYear(yr);
                                showToast(`Deleted FY ${yr} database.`);
                              }
                            }}
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded-none cursor-pointer"
                            title="Delete FY Database"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create New Financial Year Form */}
            <form
              onSubmit={handleCreateYearSubmit}
              className="bg-zinc-50 p-5 rounded-none border border-zinc-200 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-black" />
                <h3 className="text-sm font-black text-black">
                  Create New Financial Year Database
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Target Financial Year:
                  </label>
                  <input
                    type="number"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(Number(e.target.value))}
                    min={2020}
                    max={2100}
                    className="bg-white border border-zinc-300 font-mono text-black font-black px-4 py-2 rounded-none text-sm focus:outline-none focus:border-black w-full"
                    required
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-zinc-700 block">
                    Initialization Mode:
                  </label>
                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-none border border-zinc-200 cursor-pointer hover:border-zinc-300">
                    <input
                      type="radio"
                      name="rollover"
                      checked={carryOverOption}
                      onChange={() => setCarryOverOption(true)}
                      className="mt-0.5 accent-black"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-black block">
                        Rollover Previous Year's Actuals
                      </span>
                      <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                        Start all 12 months for FY {newYearInput} with $0 Actuals & Budget, while carry-over values populate as "Last Year" reference figures.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-none border border-zinc-200 cursor-pointer hover:border-zinc-300">
                    <input
                      type="radio"
                      name="rollover"
                      checked={!carryOverOption}
                      onChange={() => setCarryOverOption(false)}
                      className="mt-0.5 accent-black"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-black block">
                        Clean Slate ($0 across all columns)
                      </span>
                      <span className="text-zinc-500 text-[11px] leading-tight block mt-0.5">
                        Start completely fresh with $0 values across all months and columns.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-none transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Create FY {newYearInput} Database ($0 Initialized)</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-black uppercase tracking-wider">
                  Authorized User Accounts ({users.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Add, edit, or delete user accounts, update credentials, and security roles
                </p>
              </div>

              {currentUser?.role === 'admin' && !showAddUserForm && !editingUser && (
                <button
                  onClick={() => {
                    setShowAddUserForm(true);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add New User</span>
                </button>
              )}
            </div>

            {/* Edit User Form */}
            {editingUser && (
              <form
                onSubmit={handleSaveEditUser}
                className="bg-zinc-900 text-white p-4 rounded-none border border-zinc-800 space-y-3 animate-in fade-in duration-150 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-black text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-amber-400" />
                    Edit User Account: {editingUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="text-xs text-zinc-400 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Current or new password"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Security Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400 font-bold"
                    >
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="manager">Manager (Read & Edit Data)</option>
                      <option value="viewer">Viewer (Read Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Department</label>
                    <input
                      type="text"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 rounded-none transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-5 py-2 rounded-none transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Add New User Form */}
            {showAddUserForm && !editingUser && (
              <form
                onSubmit={handleAddUserSubmit}
                className="bg-zinc-50 p-4 rounded-none border border-zinc-200 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-xs font-black text-black flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    Create New Account
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddUserForm(false)}
                    className="text-xs text-zinc-400 hover:text-black font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Username</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. jdoe"
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="jdoe@company.com"
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Initial Password</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Set password"
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Security Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black font-bold"
                    >
                      <option value="admin">Administrator (Full Control)</option>
                      <option value="manager">Manager (Read & Edit Data)</option>
                      <option value="viewer">Viewer (Read Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 block mb-1">Department</label>
                    <input
                      type="text"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      placeholder="Department name"
                      className="w-full bg-white border border-zinc-300 text-black px-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black hover:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded-none transition-all cursor-pointer"
                >
                  Save & Provision User Account
                </button>
              </form>
            )}

            {/* Users List Table / Cards */}
            <div className="space-y-2.5">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const isAdmin = currentUser?.role === 'admin';
                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-none border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-md'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-none font-black text-sm flex items-center justify-center shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-amber-400 text-black font-mono'
                            : u.role === 'manager'
                            ? 'bg-blue-600 text-white font-mono'
                            : 'bg-zinc-300 text-zinc-800 font-mono'
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm leading-tight">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded-none uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70 font-mono mt-0.5">
                          @{u.username} • {u.email}
                        </div>
                        {u.department && (
                          <div className="text-[10px] opacity-60 font-medium">
                            {u.department}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/20">
                      {/* Role Badge or Selector */}
                      {isAdmin && !isCurrent ? (
                        <select
                          value={u.role}
                          onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-none border cursor-pointer ${
                            isCurrent
                              ? 'bg-zinc-800 text-white border-zinc-700'
                              : 'bg-white text-black border-zinc-300'
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-none uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30'
                              : u.role === 'manager'
                              ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}

                      {/* Edit User Button */}
                      {(isAdmin || isCurrent) && (
                        <button
                          onClick={() => handleStartEditingUser(u)}
                          className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 rounded-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Edit User Details"
                        >
                          <Pencil className="w-3.5 h-3.5 text-black" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete User Button */}
                      {isAdmin && !isCurrent && users.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete user account "${u.name}" (@${u.username})?`)) {
                              onDeleteUser(u.id);
                              showToast(`Removed user ${u.name}.`);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-none hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Header / Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none">
                <div className="text-[10px] font-bold text-zinc-500 uppercase">Total Activities</div>
                <div className="text-lg font-black text-black font-mono mt-0.5">{auditLogs.length}</div>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Financial Edits</div>
                <div className="text-lg font-black text-black font-mono mt-0.5">
                  {auditLogs.filter((l) => l.category === 'finance').length}
                </div>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none">
                <div className="text-[10px] font-bold text-amber-600 uppercase">User Accounts</div>
                <div className="text-lg font-black text-black font-mono mt-0.5">
                  {auditLogs.filter((l) => l.category === 'users' || l.category === 'auth').length}
                </div>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none">
                <div className="text-[10px] font-bold text-blue-600 uppercase">System & DB</div>
                <div className="text-lg font-black text-black font-mono mt-0.5">
                  {auditLogs.filter((l) => l.category === 'system').length}
                </div>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-zinc-100 p-2.5 rounded-none border border-zinc-200">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchAudit}
                  onChange={(e) => setSearchAudit(e.target.value)}
                  placeholder="Search audit logs by user, action, description..."
                  className="w-full bg-white border border-zinc-300 text-black pl-8 pr-3 py-1.5 rounded-none text-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {(['all', 'finance', 'users', 'system', 'auth'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAuditCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      auditCategoryFilter === cat
                        ? 'bg-black text-white'
                        : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Log Actions */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500">
                Showing {filteredAuditLogs.length} of {auditLogs.length} audit trail records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAuditLogsCSV}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-black text-white text-xs font-bold rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {currentUser?.role === 'admin' && onClearAuditLogs && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all system audit logs? This action cannot be undone.')) {
                        onClearAuditLogs();
                        showToast('System audit trail cleared.');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-none flex items-center gap-1 transition-all cursor-pointer"
                    title="Clear Audit Log History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audit Log Table / Timeline */}
            {filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-none text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-bold">No activity logs found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredAuditLogs.map((log) => {
                  const dateFormatted = new Date(log.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-zinc-50 border border-zinc-200 rounded-none hover:bg-zinc-100/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Category Badge */}
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider ${
                              log.category === 'finance'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : log.category === 'users'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : log.category === 'auth'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-purple-100 text-purple-800 border border-purple-300'
                            }`}
                          >
                            {log.category}
                          </span>

                          {/* Action Code */}
                          <span className="font-mono text-[10px] font-black text-black bg-zinc-200 px-2 py-0.5 rounded-none">
                            {log.action}
                          </span>

                          {/* Performed By User */}
                          <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                            <span className="text-zinc-400 font-normal">by</span>
                            {log.userName}
                            <span className="text-[10px] text-zinc-500 font-mono">({log.userRole})</span>
                          </span>
                        </div>

                        {/* Activity Details */}
                        <p className="text-xs text-zinc-700 font-medium pl-0.5 leading-snug">
                          {log.details}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <div className="text-[10px] font-mono text-zinc-400 whitespace-nowrap flex items-center gap-1 self-start sm:self-center shrink-0">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{dateFormatted}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACTIVE SESSION & PROFILE */}
        {activeTab === 'profile' && currentUser && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            <div className="bg-zinc-900 text-white p-5 rounded-none space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white text-black rounded-none font-black text-xl flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black">{currentUser.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    @{currentUser.username} • {currentUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-extrabold bg-amber-400 text-black px-2.5 py-0.5 rounded-none uppercase tracking-wider">
                      Role: {currentUser.role}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Dept: {currentUser.department || 'Finance'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            {onChangePassword && (
              <form
                onSubmit={handleChangePasswordSubmit}
                className="bg-zinc-50 p-4 rounded-none border border-zinc-200 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-black" />
                  <h4 className="text-xs font-black text-black">Update Your Security Password</h4>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={passwordChangeInput}
                    onChange={(e) => setPasswordChangeInput(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 bg-white border border-zinc-300 text-black px-3 py-2 rounded-none text-xs font-mono focus:outline-none focus:border-black"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-none transition-all cursor-pointer whitespace-nowrap"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {/* Sign Out Action */}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-black">Active Session Status</div>
                <div className="text-[11px] text-zinc-500">Authenticated & Encrypted session</div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-none transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SUPABASE DATABASE SYNC */}
        {activeTab === 'supabase' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-none space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black text-emerald-900">Supabase Cloud Database Integration</h3>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your application is configured with project <strong>gapnfllazdqklnylomnn</strong> on Supabase to automatically backup, sync, and persist multi-year financial records and user credentials across devices in real time.
              </p>
            </div>

            {/* Connection Details Summary Box */}
            <div className="bg-white border border-zinc-200 p-4 rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wider">Project Configuration</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    https://gapnfllazdqklnylomnn.supabase.co
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-none border bg-emerald-100 text-emerald-900 border-emerald-300">
                  Active & Connected
                </span>
              </div>

              {supabaseStatusMsg && (
                <div className={`p-3 text-xs font-semibold rounded-none border ${
                  supabaseStatusMsg.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  {supabaseStatusMsg.message}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={supabaseTesting}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-none flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${supabaseTesting ? 'animate-spin' : ''}`} />
                  <span>{supabaseTesting ? 'Testing...' : 'Test Database Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={supabaseSyncing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-none flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{supabaseSyncing ? 'Syncing...' : `Sync FY ${activeYear} Data to Supabase`}</span>
                </button>
              </div>
            </div>

            {/* Database Schema SQL Box */}
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none space-y-3">
              <h4 className="text-xs font-black text-black uppercase tracking-wider">Supabase Tables Schema</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                If needed, run the following SQL statements in your Supabase SQL Editor to create or update the required tables and Row-Level Security policies:
              </p>

              <div className="mt-2 bg-zinc-900 text-zinc-100 p-3 rounded-none font-mono text-[11px] relative">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400 font-sans">
                  <span className="font-bold uppercase tracking-wider text-emerald-400">Supabase SQL Schema Script</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `-- Create financial_records table
CREATE TABLE IF NOT EXISTS public.financial_records (
    year INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for financial_records" ON public.financial_records;

CREATE POLICY "Enable all access for financial_records" 
ON public.financial_records 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    department TEXT,
    password TEXT,
    created_at TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for app_users" ON public.app_users;

CREATE POLICY "Enable all access for app_users" 
ON public.app_users 
FOR ALL 
USING (true) 
WITH CHECK (true);`;
                      navigator.clipboard.writeText(sql);
                      showToast('SQL script copied to clipboard!');
                    }}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded-none cursor-pointer"
                  >
                    Copy SQL
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-emerald-300 font-mono text-[10px]">
{`-- Create financial_records table
CREATE TABLE IF NOT EXISTS public.financial_records (
    year INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for financial_records" ON public.financial_records;

CREATE POLICY "Enable all access for financial_records" 
ON public.financial_records 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    department TEXT,
    password TEXT,
    created_at TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for app_users" ON public.app_users;

CREATE POLICY "Enable all access for app_users" 
ON public.app_users 
FOR ALL 
USING (true) 
WITH CHECK (true);`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
