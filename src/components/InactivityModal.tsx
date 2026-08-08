import React from 'react';
import { AlertTriangle, Clock, LogOut, ShieldAlert } from 'lucide-react';

interface InactivityModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const InactivityModal: React.FC<InactivityModalProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border-2 border-amber-500 shadow-2xl max-w-md w-full p-6 rounded-none space-y-5 relative">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-none shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
              <span>Session Inactivity Warning</span>
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              You have been inactive for almost 5 minutes. To protect your financial data and user account, your session will automatically terminate.
            </p>
          </div>
        </div>

        {/* Countdown Visual Badge */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-none text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-amber-900 font-mono text-2xl font-black">
            <Clock className="w-6 h-6 animate-pulse text-amber-600" />
            <span>00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</span>
          </div>
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Auto Logout in {secondsRemaining} seconds
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onLogoutNow}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-none flex items-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Now</span>
          </button>
          <button
            type="button"
            onClick={onStayLoggedIn}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-none flex items-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
