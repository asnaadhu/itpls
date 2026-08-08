import React from 'react';
import {
  Calendar,
  Download,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/defaultData';
import { User } from '../types';

interface HeaderProps {
  departmentName: string;
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
  ytdThroughMonthIndex: number;
  onSelectYtdMonth: (index: number) => void;
  onExportCSV: () => void;
  currentYear: number;
  currentUser: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  departmentName,
  selectedMonthIndex,
  onSelectMonth,
  ytdThroughMonthIndex,
  onSelectYtdMonth,
  onExportCSV,
  currentYear,
  currentUser,
}) => {
  const userName = currentUser?.name || 'Financial Manager';

  return (
    <header className="mb-6 space-y-4">
      {/* Top Banner Grid - Matches Reference Hero Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Welcome & Status Banner (Matches Reference Image "Hello Josh!") */}
        <div className="md:col-span-2 bg-white rounded-none p-6 border border-zinc-200/80 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2.5 max-w-xs sm:max-w-sm md:max-w-md z-10">
            <div className="flex items-center gap-2 text-zinc-600 text-xs font-bold uppercase tracking-wider">
              <span>{departmentName}</span>
              <span>•</span>
              <span className="text-black font-black">FY {currentYear}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              Hello {currentUser?.name ? currentUser.name : 'Financial Manager'}!
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-700 font-semibold leading-relaxed">
              It's good to see you again. Here is your department's financial performance overview.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-none border ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-100 text-purple-900 border-purple-200'
                  : currentUser?.role === 'manager'
                  ? 'bg-blue-100 text-blue-900 border-blue-200'
                  : 'bg-amber-100 text-amber-900 border-amber-200'
              }`}>
                Role: {currentUser?.role || 'admin'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold bg-zinc-100 text-zinc-800 px-3 py-1 rounded-none">
                YTD Engine Active
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold bg-black text-white px-3 py-1 rounded-none flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-white" />
                AI Vision Statement Parser
              </span>
            </div>
          </div>

          {/* Waving Guy Illustration located in the right-hand empty area of the card with NO box container */}
          <div className="hidden sm:flex items-center justify-center shrink-0 ml-4 self-end sm:self-center z-10">
            <svg
              viewBox="0 0 100 120"
              className="w-28 h-32 sm:w-36 sm:h-40 text-black shrink-0 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Solid Black T-Shirt Body */}
              <path
                d="M 22 92 C 30 84 40 84 50 84 C 60 84 70 84 78 92 L 92 120 L 8 120 Z"
                fill="black"
              />

              {/* Raised Arm (Sleeve & Arm) */}
              <path
                d="M 24 90 C 18 80 14 70 12 55"
                stroke="black"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Waving Hand with 5 fingers */}
              {/* Palm */}
              <path
                d="M 12 55 Q 6 52 8 42 Q 12 38 18 45 L 16 55 Z"
                fill="white"
                stroke="black"
                strokeWidth="2"
              />
              {/* Thumb */}
              <path d="M 17 48 Q 23 46 21 52" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Index finger */}
              <path d="M 14 41 Q 12 28 17 38" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Middle finger */}
              <path d="M 10 42 Q 7 26 12 38" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Ring finger */}
              <path d="M 7 45 Q 3 31 8 41" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Pinky finger */}
              <path d="M 5 49 Q 0 38 5 46" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Neck */}
              <rect x="44" y="64" width="12" height="22" fill="white" stroke="black" strokeWidth="2" />

              {/* Head */}
              <rect x="36" y="24" width="28" height="42" rx="14" fill="white" stroke="black" strokeWidth="2.5" />

              {/* Ears */}
              <path d="M 36 40 C 32 40 32 48 36 48" fill="white" stroke="black" strokeWidth="2" />
              <circle cx="34" cy="44" r="1" fill="black" />
              <path d="M 64 40 C 68 40 68 48 64 48" fill="white" stroke="black" strokeWidth="2" />
              <circle cx="66" cy="44" r="1" fill="black" />

              {/* Hair - Black swooped style */}
              <path
                d="M 35 30 C 33 16 45 8 55 8 C 65 8 68 16 65 30 C 60 22 45 22 35 30 Z"
                fill="black"
              />
              <path
                d="M 42 12 C 48 4 60 6 62 16 C 56 10 48 10 42 12 Z"
                fill="black"
              />

              {/* Glasses */}
              <circle cx="43" cy="38" r="8" fill="white" stroke="black" strokeWidth="2.2" />
              <circle cx="57" cy="38" r="8" fill="white" stroke="black" strokeWidth="2.2" />
              <line x1="51" y1="38" x2="49" y2="38" stroke="black" strokeWidth="2" />

              {/* Pupils */}
              <circle cx="43" cy="38" r="2" fill="black" />
              <circle cx="57" cy="38" r="2" fill="black" />

              {/* Eyebrows */}
              <path d="M 37 27 Q 43 25 48 27" stroke="black" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 52 27 Q 57 25 63 27" stroke="black" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Nose */}
              <path d="M 50 43 Q 52 46 50 48" stroke="black" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Smile */}
              <path d="M 44 54 Q 50 59 56 54" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* Selected Period & YTD Selector Card (Matches Reference Card Aesthetic) */}
        <div className="bg-white rounded-none p-6 border border-zinc-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Active Statement Period
            </span>
            <span className="w-2.5 h-2.5 rounded-none bg-black ring-4 ring-zinc-100 animate-pulse"></span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-black shrink-0" />
              <select
                value={selectedMonthIndex}
                onChange={(e) => onSelectMonth(Number(e.target.value))}
                className="bg-zinc-100 border border-zinc-200 text-black text-xs sm:text-sm font-black px-3 py-2 rounded-none focus:outline-none cursor-pointer w-full transition-colors hover:bg-zinc-200/60"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name} Statement
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 w-20 sm:w-24 shrink-0">YTD Through:</span>
              <select
                value={ytdThroughMonthIndex}
                onChange={(e) => onSelectYtdMonth(Number(e.target.value))}
                className="bg-zinc-100 border border-zinc-200 text-black text-xs font-bold px-3 py-1.5 rounded-none focus:outline-none cursor-pointer w-full transition-colors hover:bg-zinc-200/60"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    Jan - {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Financial Statement
            </span>
            <button
              onClick={onExportCSV}
              className="text-xs font-black text-black hover:opacity-75 flex items-center gap-1.5 cursor-pointer transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

