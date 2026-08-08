import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Loader2,
  Shield,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import { User } from '../types';
import { fetchUsersFromSupabase, checkIsSupabaseConfigured } from '../lib/supabase';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Load latest users from Supabase on mount
  useEffect(() => {
    if (checkIsSupabaseConfigured()) {
      fetchUsersFromSupabase().catch(() => {});
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);

    const trimmedInput = usernameInput.trim().toLowerCase();

    try {
      let userList = [...users];

      if (checkIsSupabaseConfigured()) {
        const remoteUsers = await fetchUsersFromSupabase();
        if (remoteUsers && remoteUsers.length > 0) {
          userList = remoteUsers;
        }
      }

      const foundUser = userList.find(
        (u) =>
          u.username.toLowerCase() === trimmedInput ||
          (u.email && u.email.toLowerCase() === trimmedInput)
      );

      if (!foundUser) {
        setErrorMsg('User account not found. Please check your username or email.');
        setIsLoggingIn(false);
        return;
      }

      if (foundUser.password && passwordInput !== foundUser.password) {
        setErrorMsg('Invalid password. Please try again.');
        setIsLoggingIn(false);
        return;
      }

      onLogin(foundUser);
    } catch (err) {
      console.error('Login authentication error:', err);
      setErrorMsg('Authentication error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-zinc-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Decorative Grids */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-300/30 rounded-none blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-zinc-300/30 rounded-none blur-3xl pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white rounded-none shadow-lg mb-1 font-black">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
            Information & Telecommunication Systems
          </h1>
          <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
            YTD Financial Ledger & Executive Budget Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-zinc-200/90 rounded-none p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">System Authentication</h2>
              <p className="text-xs text-zinc-500">Sign in to access corporate financial records</p>
            </div>
            <div className="p-2 bg-zinc-100 text-zinc-800 rounded-none">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-none text-xs font-bold flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Username or Corporate Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin or user@company.com"
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium px-4 py-3 rounded-none text-sm focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all pl-10 placeholder:text-zinc-400"
                  required
                />
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium px-4 py-3 rounded-none text-sm focus:outline-none focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-all pl-10 pr-10 placeholder:text-zinc-400"
                  required
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-black hover:bg-zinc-800 text-white font-bold text-sm py-3.5 rounded-none transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Authorized Access Notice */}
          <div className="pt-3 border-t border-zinc-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-600" />
              <span>Authorized Access Only</span>
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed bg-zinc-50 p-3.5 border border-zinc-200/80 rounded-none">
              This system is intended for authorized personnel only. Roles enforced: Administrator (Full Access + Settings), Manager (View & Edit Data, No Settings), Viewer (Read-Only Access).
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-zinc-400 text-[11px] font-medium flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-zinc-500" />
          <span>Secured Corporate Portal • Single Sign-On Ready</span>
        </div>
      </div>
    </div>
  );
};
