import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  PieChart,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/defaultData';
import { ComputedReportSummary, YearData } from '../types';
import { formatCurrency, formatPercent } from '../utils/financialUtils';

interface AiInsightsProps {
  yearData: YearData;
  summary: ComputedReportSummary;
  selectedMonthIndex: number;
  ytdThroughMonthIndex: number;
  onSelectMonth?: (index: number) => void;
}

export const AiInsights: React.FC<AiInsightsProps> = ({
  yearData,
  summary,
  selectedMonthIndex,
  ytdThroughMonthIndex,
  onSelectMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'matrix' | 'drivers' | 'strategy'>('briefing');
  const [viewMode, setViewMode] = useState<'separate' | 'combined'>('combined');
  const [copiedToast, setCopiedToast] = useState(false);

  const selectedMonthName = MONTH_NAMES[selectedMonthIndex] || MONTH_NAMES[0];
  const monthsPassed = selectedMonthIndex + 1;
  const prevMonthIndex = Math.max(0, selectedMonthIndex - 1);
  const prevMonthName = MONTH_NAMES[prevMonthIndex];

  // -------------------------------------------------------------
  // 1. MTD COMPUTATIONS (For selectedMonthIndex)
  // -------------------------------------------------------------
  const monthSelected = yearData.months[selectedMonthIndex] || yearData.months[0];
  const prevMonthSelected = yearData.months[prevMonthIndex] || yearData.months[0];

  let mtdActual = 0;
  let mtdBudget = 0;
  let mtdLastYear = 0;
  let prevMtdActual = 0;

  const mtdLineDetails = yearData.lineItems.map((item) => {
    const val = monthSelected.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };
    const pVal = prevMonthSelected.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };

    mtdActual += val.actual || 0;
    mtdBudget += val.budget || 0;
    mtdLastYear += val.lastYear || 0;
    prevMtdActual += pVal.actual || 0;

    const variance = (val.actual || 0) - (val.budget || 0);
    const variancePct = (val.budget || 0) !== 0 ? (variance / (val.budget || 1)) * 100 : 0;

    return {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      actual: val.actual || 0,
      budget: val.budget || 0,
      lastYear: val.lastYear || 0,
      variance,
      variancePct,
    };
  });

  const mtdVariance = mtdActual - mtdBudget;
  const mtdVariancePct = mtdBudget !== 0 ? (mtdVariance / mtdBudget) * 100 : 0;
  const mtdMomChange = selectedMonthIndex > 0 ? mtdActual - prevMtdActual : 0;

  const mtdOverBudget = [...mtdLineDetails]
    .filter((i) => i.variance > 0)
    .sort((a, b) => b.variance - a.variance);

  const mtdUnderBudget = [...mtdLineDetails]
    .filter((i) => i.variance < 0)
    .sort((a, b) => a.variance - b.variance);

  // Labor MTD
  const laborLineIds = yearData.lineItems
    .filter((i) => i.categoryId === 'cat_salaries' || i.categoryId === 'cat_payroll')
    .map((i) => i.id);

  const mtdLaborActual = mtdLineDetails
    .filter((i) => laborLineIds.includes(i.id))
    .reduce((acc, i) => acc + i.actual, 0);

  const mtdLaborRatio = mtdActual > 0 ? (mtdLaborActual / mtdActual) * 100 : 0;

  // -------------------------------------------------------------
  // 2. YTD COMPUTATIONS (Jan through selectedMonthIndex)
  // -------------------------------------------------------------
  const ytdMonthsList = yearData.months.slice(0, selectedMonthIndex + 1);

  let ytdActual = 0;
  let ytdBudget = 0;
  let ytdLastYear = 0;

  const ytdLineDetails = yearData.lineItems.map((item) => {
    let itemYtdActual = 0;
    let itemYtdBudget = 0;
    let itemYtdLastYear = 0;

    ytdMonthsList.forEach((m) => {
      const v = m.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };
      itemYtdActual += v.actual || 0;
      itemYtdBudget += v.budget || 0;
      itemYtdLastYear += v.lastYear || 0;
    });

    ytdActual += itemYtdActual;
    ytdBudget += itemYtdBudget;
    ytdLastYear += itemYtdLastYear;

    const variance = itemYtdActual - itemYtdBudget;
    const variancePct = itemYtdBudget !== 0 ? (variance / itemYtdBudget) * 100 : 0;

    return {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      actual: itemYtdActual,
      budget: itemYtdBudget,
      lastYear: itemYtdLastYear,
      variance,
      variancePct,
    };
  });

  const ytdVariance = ytdActual - ytdBudget;
  const ytdVariancePct = ytdBudget !== 0 ? (ytdVariance / ytdBudget) * 100 : 0;

  const ytdOverBudget = [...ytdLineDetails]
    .filter((i) => i.variance > 0)
    .sort((a, b) => b.variance - a.variance);

  const ytdUnderBudget = [...ytdLineDetails]
    .filter((i) => i.variance < 0)
    .sort((a, b) => a.variance - b.variance);

  // Annual EOY Projection
  const monthlyAverageSpend = monthsPassed > 0 ? ytdActual / monthsPassed : 0;
  const eoyProjectedSpend = monthlyAverageSpend * 12;

  // Total Annual Budget across all 12 months
  let totalAnnualBudget = 0;
  yearData.months.forEach((m) => {
    yearData.lineItems.forEach((i) => {
      totalAnnualBudget += m.items[i.id]?.budget || 0;
    });
  });
  const eoyProjectedVariance = eoyProjectedSpend - totalAnnualBudget;

  // Labor YTD
  const ytdLaborActual = ytdLineDetails
    .filter((i) => laborLineIds.includes(i.id))
    .reduce((acc, i) => acc + i.actual, 0);

  const ytdLaborRatio = ytdActual > 0 ? (ytdLaborActual / ytdActual) * 100 : 0;

  // -------------------------------------------------------------
  // 3. GENERATE INITIAL AUTOMATED AI EXECUTIVE NOTES
  // -------------------------------------------------------------
  const generateInitialMtdNotes = () => {
    const deptName = yearData.departmentName || 'Information Technology';
    const yearStr = yearData.year || '2026';

    let notes = `${deptName}\nMTD Executive Summary (${selectedMonthName} ${yearStr})\n`;
    notes += `Total Expenses: $${formatCurrency(mtdActual)} (Budget: $${formatCurrency(mtdBudget)} | Last Year: $${formatCurrency(mtdLastYear)})\n`;

    let totalBullet = '';
    if (mtdVariance <= 0) {
      const saved = Math.abs(mtdVariance);
      totalBullet = `${selectedMonthName} spending remained below budget${saved > 0 ? ` by $${formatCurrency(saved)}` : ''}, reflecting continued cost discipline${
        mtdActual > mtdLastYear ? ' despite increased operational utilization compared to last year' : ' and lower overall spend compared to prior year'
      }.`;
    } else {
      totalBullet = `${selectedMonthName} total expenses exceeded budget by $${formatCurrency(mtdVariance)}, primarily driven by operational cost increases compared to monthly target.`;
    }
    notes += `\t• ${totalBullet}\n`;

    yearData.categories.forEach((cat) => {
      const catLineItems = yearData.lineItems.filter((i) => i.categoryId === cat.id);
      let catActual = 0;
      let catBudget = 0;
      let catLastYear = 0;

      catLineItems.forEach((i) => {
        const itemVal = monthSelected.items[i.id] || { actual: 0, budget: 0, lastYear: 0 };
        catActual += itemVal.actual || 0;
        catBudget += itemVal.budget || 0;
        catLastYear += itemVal.lastYear || 0;
      });

      const catVar = catActual - catBudget;
      notes += `${cat.name}: $${formatCurrency(catActual)} (Budget: $${formatCurrency(catBudget)} | Last Year: $${formatCurrency(catLastYear)})\n`;

      const overItems = catLineItems
        .map((i) => ({
          name: i.name,
          diff: (monthSelected.items[i.id]?.actual || 0) - (monthSelected.items[i.id]?.budget || 0),
        }))
        .filter((i) => i.diff > 0)
        .sort((a, b) => b.diff - a.diff);

      const underItems = catLineItems
        .map((i) => ({
          name: i.name,
          diff: (monthSelected.items[i.id]?.actual || 0) - (monthSelected.items[i.id]?.budget || 0),
        }))
        .filter((i) => i.diff < 0)
        .sort((a, b) => a.diff - b.diff);

      let catBullet = '';
      if (catVar <= 0) {
        if (underItems.length > 0) {
          catBullet = `${cat.name} expenses, mainly ${underItems[0].name.toLowerCase()}, were well controlled and closed under budget.`;
        } else {
          catBullet = `${cat.name} remained below budget, supporting overall monthly savings.`;
        }
      } else {
        if (overItems.length > 0) {
          catBullet = `${cat.name} exceeded budget, primarily due to higher ${overItems[0].name.toLowerCase()} charges and increased operational system usage compared to last year.`;
        } else {
          catBullet = `${cat.name} exceeded budget, reflecting higher operational charges for the month.`;
        }
      }

      notes += `\t• ${catBullet}\n`;
    });

    return notes.trim();
  };

  const generateInitialYtdNotes = () => {
    const deptName = yearData.departmentName || 'Information Technology';
    const yearStr = yearData.year || '2026';

    let notes = `YTD Executive Summary – ${yearStr} (as of ${selectedMonthName})\n`;
    notes += `Total Expenses: $${formatCurrency(ytdActual)} (Budget: $${formatCurrency(ytdBudget)} | Last Year: $${formatCurrency(ytdLastYear)})\n`;

    let totalBullet = '';
    if (ytdVariance <= 0) {
      totalBullet = `Year‑to‑date ${deptName.toLowerCase()} spending remains below budget, demonstrating effective cost management across the first ${monthsPassed} month${monthsPassed > 1 ? 's' : ''} of the year.`;
    } else {
      totalBullet = `Year‑to‑date spending exceeds budget by $${formatCurrency(ytdVariance)}, reflecting cumulative cost overruns through ${selectedMonthName}.`;
    }
    notes += `\t• ${totalBullet}\n`;

    yearData.categories.forEach((cat) => {
      const catLineItems = yearData.lineItems.filter((i) => i.categoryId === cat.id);
      let catYtdActual = 0;
      let catYtdBudget = 0;
      let catYtdLastYear = 0;

      catLineItems.forEach((i) => {
        ytdMonthsList.forEach((m) => {
          const itemVal = m.items[i.id] || { actual: 0, budget: 0, lastYear: 0 };
          catYtdActual += itemVal.actual || 0;
          catYtdBudget += itemVal.budget || 0;
          catYtdLastYear += itemVal.lastYear || 0;
        });
      });

      const catYtdVar = catYtdActual - catYtdBudget;
      notes += `${cat.name}: $${formatCurrency(catYtdActual)} (Budget: $${formatCurrency(catYtdBudget)} | Last Year: $${formatCurrency(catYtdLastYear)})\n`;

      let catBullet = '';
      if (catYtdVar <= 0) {
        catBullet = `YTD ${cat.name.toLowerCase()} are tracking favorably against budget, with efficiencies maintained in core operational lines.`;
      } else {
        catBullet = `YTD ${cat.name.toLowerCase()} are above budget and prior year, reflecting expanded system coverage and increased centralized charges.`;
      }

      notes += `\t• ${catBullet}\n`;
    });

    return notes.trim();
  };

  const [mtdNotes, setMtdNotes] = useState<string>(generateInitialMtdNotes());
  const [ytdNotes, setYtdNotes] = useState<string>(generateInitialYtdNotes());

  useEffect(() => {
    setMtdNotes(generateInitialMtdNotes());
    setYtdNotes(generateInitialYtdNotes());
  }, [selectedMonthIndex, yearData]);

  const handleRegenerateNotes = () => {
    setMtdNotes(generateInitialMtdNotes());
    setYtdNotes(generateInitialYtdNotes());
  };

  const combinedBriefingText = `${mtdNotes}\n\n${ytdNotes}`;

  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(combinedBriefingText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleDownloadBriefing = () => {
    const element = document.createElement('a');
    const file = new Blob([combinedBriefingText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${yearData.departmentName}_Executive_Summary_${selectedMonthName}_${yearData.year || '2026'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6 select-none font-sans">
      {/* AI Assistance Header Banner */}
      <div className="bg-black text-white rounded-none p-6 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white text-black rounded-none shadow-lg shrink-0">
              <Sparkles className="w-7 h-7 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  AI Financial Assistance Portal
                </h2>
                <span className="text-[10px] font-extrabold bg-amber-400 text-black px-2.5 py-0.5 rounded-none uppercase tracking-wider">
                  Executive Briefing Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Deep-dive variance analysis & executive summary notes for{' '}
                <span className="font-bold text-white">{yearData.departmentName}</span>
              </p>
            </div>
          </div>

          {/* Month Selector in AI Assistance Banner */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-none shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 pl-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Analyzing Month:</span>
            </div>
            <select
              value={selectedMonthIndex}
              onChange={(e) => onSelectMonth && onSelectMonth(Number(e.target.value))}
              className="bg-black text-white font-mono font-black text-xs px-3.5 py-2 rounded-none border border-zinc-700 focus:outline-none focus:border-white cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m} (Month {idx + 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top KPI Quick Strip */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-zinc-800">
          <div className="bg-zinc-950/80 p-3.5 rounded-none border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              {selectedMonthName} MTD Spend
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white block mt-0.5">
              ${formatCurrency(mtdActual)}
            </span>
            <span
              className={`text-[11px] font-bold block mt-0.5 ${
                mtdVariance <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {mtdVariance <= 0 ? '▼ Favorable' : '▲ Over Target'} (${formatCurrency(Math.abs(mtdVariance))})
            </span>
          </div>

          <div className="bg-zinc-950/80 p-3.5 rounded-none border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Jan–{selectedMonthName} YTD Spend
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white block mt-0.5">
              ${formatCurrency(ytdActual)}
            </span>
            <span
              className={`text-[11px] font-bold block mt-0.5 ${
                ytdVariance <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {ytdVariance <= 0 ? '▼ Favorable' : '▲ Over Target'} (${formatCurrency(Math.abs(ytdVariance))})
            </span>
          </div>

          <div className="bg-zinc-950/80 p-3.5 rounded-none border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              EOY Projected Run-Rate
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white block mt-0.5">
              ${formatCurrency(eoyProjectedSpend)}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              ${formatCurrency(monthlyAverageSpend)}/mo avg
            </span>
          </div>

          <div className="bg-zinc-950/80 p-3.5 rounded-none border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Labor Share (YTD)
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white block mt-0.5">
              {ytdLaborRatio.toFixed(1)}%
            </span>
            <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
              ${formatCurrency(ytdLaborActual)} Total
            </span>
          </div>
        </div>
      </div>

      {/* Internal View Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'briefing'
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-zinc-600 hover:text-black border border-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Executive Summary Notes (MTD vs YTD)</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-zinc-600 hover:text-black border border-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Category Deep Dive Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-zinc-600 hover:text-black border border-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Variance Spikes & Drivers</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2.5 rounded-none text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'strategy'
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-zinc-600 hover:text-black border border-zinc-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Strategic Recommendations</span>
          </button>
        </div>

        {/* Global Briefing Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerateNotes}
            className="px-3 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-xs rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Reset to freshly computed AI notes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Notes</span>
          </button>

          <button
            onClick={handleCopyBriefing}
            className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Briefing</span>
          </button>
        </div>
      </div>

      {/* Copy Toast Notification */}
      {copiedToast && (
        <div className="bg-black text-white p-3 rounded-none text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Executive Briefing (MTD & YTD Notes) copied to clipboard!</span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: EXECUTIVE BRIEFING NOTES (MTD & YTD) */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'briefing' && (
        <div className="space-y-6">
          {/* Sub-header Controls for Notes View Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 p-3 rounded-none border border-zinc-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-700">Display Layout:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-none border border-zinc-200">
                <button
                  onClick={() => setViewMode('combined')}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'combined'
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Full Executive Summary (Combined)
                </button>
                <button
                  onClick={() => setViewMode('separate')}
                  className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'separate'
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  Side-by-Side Cards (MTD & YTD)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyBriefing}
                className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </button>

              <button
                onClick={handleDownloadBriefing}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-xs rounded-none transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>
            </div>
          </div>

          {/* COMBINED VIEW MODE */}
          {viewMode === 'combined' && (
            <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-black text-white rounded-none">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black">
                      {yearData.departmentName} - Combined MTD & YTD Executive Summary
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Formatted financial executive briefing for {selectedMonthName} {yearData.year || '2026'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded-none font-mono">
                    Structured Format
                  </span>
                </div>
              </div>

              {/* Formatted Text Box for Combined Briefing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Complete MTD & YTD Executive Notes</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">Editable</span>
                </div>

                <textarea
                  value={combinedBriefingText}
                  onChange={(e) => {
                    // Split user edit back into MTD and YTD if split marker exists, else store in mtd
                    const text = e.target.value;
                    const parts = text.split(/\n\n(?=YTD Executive Summary)/);
                    if (parts.length >= 2) {
                      setMtdNotes(parts[0]);
                      setYtdNotes(parts.slice(1).join('\n\n'));
                    } else {
                      setMtdNotes(text);
                    }
                  }}
                  rows={18}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-none p-4 text-xs font-mono font-medium text-zinc-900 focus:outline-none focus:border-black focus:bg-white leading-relaxed transition-all whitespace-pre-wrap select-text"
                  placeholder="Generating MTD and YTD executive notes..."
                />
              </div>
            </div>
          )}

          {/* SEPARATE CARDS VIEW MODE */}
          {viewMode === 'separate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CARD 1: MONTH-TO-DATE (MTD) EXECUTIVE SUMMARY NOTES */}
              <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-black text-white rounded-none">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-black">
                          MTD Executive Notes ({selectedMonthName})
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Single month financial performance summary
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-none ${
                        mtdVariance <= 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {mtdVariance <= 0 ? 'MTD Favorable' : 'MTD Over Budget'}
                    </span>
                  </div>

                  {/* MTD Metrics Highlights */}
                  <div className="grid grid-cols-3 gap-2 my-4 bg-zinc-50 p-3 rounded-none border border-zinc-200/80 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        MTD Actual
                      </span>
                      <span className="text-sm font-mono font-black text-black block mt-0.5">
                        ${formatCurrency(mtdActual)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        MTD Budget
                      </span>
                      <span className="text-sm font-mono font-bold text-zinc-600 block mt-0.5">
                        ${formatCurrency(mtdBudget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        MTD Variance
                      </span>
                      <span
                        className={`text-sm font-mono font-black block mt-0.5 ${
                          mtdVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {mtdVariance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(mtdVariance))}
                      </span>
                    </div>
                  </div>

                  {/* MTD Executive Notes Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Executive Commentary & Findings (MTD)</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">Editable</span>
                    </div>

                    <textarea
                      value={mtdNotes}
                      onChange={(e) => setMtdNotes(e.target.value)}
                      rows={10}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none p-3.5 text-xs font-mono font-medium text-zinc-800 focus:outline-none focus:border-black focus:bg-white leading-relaxed transition-all whitespace-pre-wrap select-text"
                      placeholder="Enter MTD executive notes..."
                    />
                  </div>
                </div>

                {/* MTD Top Driver Breakdown */}
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <span className="text-[11px] font-black text-black uppercase tracking-wider block">
                    Key MTD Drivers ({selectedMonthName})
                  </span>
                  <div className="space-y-1.5">
                    {mtdOverBudget.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs flex items-center justify-between p-2 rounded-none bg-rose-50/60 border border-rose-100"
                      >
                        <span className="font-bold text-rose-950">{item.name}</span>
                        <span className="font-mono font-bold text-rose-700">
                          +${formatCurrency(item.variance)} (+{item.variancePct.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                    {mtdOverBudget.length === 0 && (
                      <div className="text-xs text-zinc-500 italic p-2 bg-zinc-50 rounded-none">
                        No over-budget items in {selectedMonthName}.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: YEAR-TO-DATE (YTD) EXECUTIVE SUMMARY NOTES */}
              <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-black text-white rounded-none">
                        <PieChart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-black">
                          YTD Executive Notes (Jan - {selectedMonthName})
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Cumulative fiscal year performance summary
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-none ${
                        ytdVariance <= 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {ytdVariance <= 0 ? 'YTD Favorable' : 'YTD Over Budget'}
                    </span>
                  </div>

                  {/* YTD Metrics Highlights */}
                  <div className="grid grid-cols-3 gap-2 my-4 bg-zinc-50 p-3 rounded-none border border-zinc-200/80 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        YTD Actual
                      </span>
                      <span className="text-sm font-mono font-black text-black block mt-0.5">
                        ${formatCurrency(ytdActual)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        YTD Budget
                      </span>
                      <span className="text-sm font-mono font-bold text-zinc-600 block mt-0.5">
                        ${formatCurrency(ytdBudget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                        YTD Variance
                      </span>
                      <span
                        className={`text-sm font-mono font-black block mt-0.5 ${
                          ytdVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {ytdVariance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(ytdVariance))}
                      </span>
                    </div>
                  </div>

                  {/* YTD Executive Notes Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Executive Commentary & Findings (YTD)</span>
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">Editable</span>
                    </div>

                    <textarea
                      value={ytdNotes}
                      onChange={(e) => setYtdNotes(e.target.value)}
                      rows={10}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-none p-3.5 text-xs font-mono font-medium text-zinc-800 focus:outline-none focus:border-black focus:bg-white leading-relaxed transition-all whitespace-pre-wrap select-text"
                      placeholder="Enter YTD executive notes..."
                    />
                  </div>
                </div>

                {/* YTD EOY Forecast Breakdown */}
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <span className="text-[11px] font-black text-black uppercase tracking-wider block">
                    YTD Annual Run-Rate Projection
                  </span>
                  <div className="p-3 bg-zinc-50 rounded-none border border-zinc-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-black">Projected Full Year Expense:</div>
                      <div className="text-[11px] text-zinc-500 font-medium">
                        Based on ${formatCurrency(monthlyAverageSpend)}/mo average spend
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-sm text-black">
                        ${formatCurrency(eoyProjectedSpend)}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          eoyProjectedVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {eoyProjectedVariance <= 0 ? 'Under EOY Budget' : 'Exceeds EOY Budget'} ($
                        {formatCurrency(Math.abs(eoyProjectedVariance))})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 2: CATEGORY DEEP DIVE MATRIX */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-black text-black">
                Category Performance Deep Dive Matrix
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Side-by-side comparative analysis of MTD ({selectedMonthName}) vs YTD (Jan - {selectedMonthName})
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-mono text-[10px] tracking-wider bg-zinc-50">
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold text-right">MTD Actual</th>
                  <th className="p-3 font-bold text-right">MTD Budget</th>
                  <th className="p-3 font-bold text-right">MTD Variance</th>
                  <th className="p-3 font-bold text-right">YTD Actual</th>
                  <th className="p-3 font-bold text-right">YTD Budget</th>
                  <th className="p-3 font-bold text-right">YTD Variance</th>
                  <th className="p-3 font-bold text-center">YTD Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-900">
                {yearData.categories.map((cat) => {
                  const catLineItems = yearData.lineItems.filter((i) => i.categoryId === cat.id);

                  // MTD Category sum
                  let catMtdActual = 0;
                  let catMtdBudget = 0;

                  catLineItems.forEach((i) => {
                    const m = monthSelected.items[i.id];
                    if (m) {
                      catMtdActual += m.actual || 0;
                      catMtdBudget += m.budget || 0;
                    }
                  });

                  const catMtdVar = catMtdActual - catMtdBudget;

                  // YTD Category sum
                  let catYtdActual = 0;
                  let catYtdBudget = 0;

                  catLineItems.forEach((i) => {
                    ytdMonthsList.forEach((m) => {
                      const val = m.items[i.id];
                      if (val) {
                        catYtdActual += val.actual || 0;
                        catYtdBudget += val.budget || 0;
                      }
                    });
                  });

                  const catYtdVar = catYtdActual - catYtdBudget;
                  const utilizationPct = catYtdBudget > 0 ? (catYtdActual / catYtdBudget) * 100 : 0;

                  return (
                    <tr key={cat.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-black text-black">{cat.name}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        ${formatCurrency(catMtdActual)}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-500">
                        ${formatCurrency(catMtdBudget)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          catMtdVar <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {catMtdVar <= 0 ? '-' : '+'}${formatCurrency(Math.abs(catMtdVar))}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        ${formatCurrency(catYtdActual)}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-500">
                        ${formatCurrency(catYtdBudget)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          catYtdVar <= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {catYtdVar <= 0 ? '-' : '+'}${formatCurrency(Math.abs(catYtdVar))}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-zinc-200 h-2 rounded-none overflow-hidden">
                            <div
                              className={`h-full ${
                                utilizationPct > 100 ? 'bg-rose-500' : 'bg-black'
                              }`}
                              style={{ width: `${Math.min(100, utilizationPct)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold">
                            {utilizationPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 3: VARIANCE SPIKES & DRIVERS */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MTD Overruns */}
          <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-black">
                  MTD Cost Spikes ({selectedMonthName})
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Line items exceeding monthly target budgets
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-rose-500" />
            </div>

            <div className="space-y-2.5">
              {mtdOverBudget.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-none flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-xs text-black">{item.name}</h4>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Actual: ${formatCurrency(item.actual)} | Budget: ${formatCurrency(item.budget)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-xs text-rose-600 block">
                      +${formatCurrency(item.variance)}
                    </span>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-none inline-block mt-0.5">
                      +{item.variancePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {mtdOverBudget.length === 0 && (
                <div className="p-6 text-center text-xs font-bold text-zinc-500 bg-zinc-50 rounded-none">
                  Zero MTD budget overruns recorded for {selectedMonthName}.
                </div>
              )}
            </div>
          </div>

          {/* YTD Cumulative Overruns */}
          <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-black text-black">
                  YTD Cumulative Overruns (Jan - {selectedMonthName})
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Cumulative line item cost drivers across fiscal year
                </p>
              </div>
              <PieChart className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-2.5">
              {ytdOverBudget.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-none flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-black text-xs text-black">{item.name}</h4>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Actual: ${formatCurrency(item.actual)} | Budget: ${formatCurrency(item.budget)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-xs text-rose-600 block">
                      +${formatCurrency(item.variance)}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-none inline-block mt-0.5">
                      +{item.variancePct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {ytdOverBudget.length === 0 && (
                <div className="p-6 text-center text-xs font-bold text-zinc-500 bg-zinc-50 rounded-none">
                  Zero cumulative YTD budget overruns recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 4: STRATEGIC RECOMMENDATIONS */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'strategy' && (
        <div className="bg-white border border-zinc-200/90 rounded-none p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-3">
            <div className="p-2 bg-black text-white rounded-none">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">
                Executive AI Recommendations & Action Plan
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Tailored financial optimizations for {yearData.departmentName} ({selectedMonthName})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-none space-y-2">
              <span className="text-[10px] font-bold bg-black text-white px-2.5 py-0.5 rounded-none uppercase">
                Priority 1: Contract Review
              </span>
              <h4 className="font-black text-xs text-black">Audit Contract Services</h4>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Review vendor billing cycles for contract services. Re-negotiate recurring milestone payments or shift non-urgent task orders to Q4.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-none space-y-2">
              <span className="text-[10px] font-bold bg-black text-white px-2.5 py-0.5 rounded-none uppercase">
                Priority 2: Labor Capacity
              </span>
              <h4 className="font-black text-xs text-black">Monitor Overtime & Temporary Staffing</h4>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Labor represents {ytdLaborRatio.toFixed(1)}% of total expenses. Audit overtime hour approvals to prevent wage creep.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-none space-y-2">
              <span className="text-[10px] font-bold bg-black text-white px-2.5 py-0.5 rounded-none uppercase">
                Priority 3: Subscriptions
              </span>
              <h4 className="font-black text-xs text-black">SaaS License Consolidation</h4>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Consolidate enterprise software subscriptions and purge inactive seat licenses across IT and operations teams.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
