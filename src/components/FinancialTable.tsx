import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Filter,
  Info,
  Percent,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/defaultData';
import { ComputedReportSummary, User, YearData } from '../types';
import { formatCurrency, formatPercent } from '../utils/financialUtils';

interface FinancialTableProps {
  yearData: YearData;
  summary: ComputedReportSummary;
  selectedMonthIndex: number;
  ytdThroughMonthIndex: number;
  onUpdateMonthValue: (
    monthIndex: number,
    lineItemId: string,
    field: 'actual' | 'budget' | 'lastYear',
    value: number
  ) => void;
  onUpdateRevenueBaseline: (monthIndex: number, revenue: number) => void;
  pctBaselineMode: 'revenue' | 'totalExpenses';
  onTogglePctBaselineMode: (mode: 'revenue' | 'totalExpenses') => void;
  currentUser?: User | null;
}

export const FinancialTable: React.FC<FinancialTableProps> = ({
  yearData,
  summary,
  selectedMonthIndex,
  ytdThroughMonthIndex,
  onUpdateMonthValue,
  onUpdateRevenueBaseline,
  pctBaselineMode,
  onTogglePctBaselineMode,
  currentUser,
}) => {
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [editingCell, setEditingCell] = useState<{
    lineItemId: string;
    field: 'actual' | 'budget' | 'lastYear';
  } | null>(null);

  const [cellValue, setCellValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightMode, setHighlightMode] = useState<'all' | 'overBudget' | 'underBudget'>('all');
  const [showPercentageColumns, setShowPercentageColumns] = useState<boolean>(true);

  const monthName = MONTH_NAMES[selectedMonthIndex] || 'Selected Month';
  const ytdMonthName = MONTH_NAMES[ytdThroughMonthIndex] || 'YTD';

  // Handle cell edit trigger
  const handleStartEdit = (
    lineItemId: string,
    field: 'actual' | 'budget' | 'lastYear',
    currentVal: number
  ) => {
    if (!canEdit) return;
    setEditingCell({ lineItemId, field });
    setCellValue(currentVal === 0 ? '' : currentVal.toString());
  };

  const handleSaveCell = () => {
    if (editingCell) {
      const cleaned = cellValue.replace(/[^0-9.-]/g, '');
      const numVal = parseFloat(cleaned);
      onUpdateMonthValue(
        selectedMonthIndex,
        editingCell.lineItemId,
        editingCell.field,
        isNaN(numVal) ? 0 : numVal
      );
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveCell();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="pb-12 space-y-5">
      {/* Table Toolbar & Filters */}
      <div className="bg-white border border-zinc-200/80 rounded-none p-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search line items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-none focus:outline-none focus:border-black focus:bg-white text-zinc-900 transition-all font-semibold"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 rounded-none p-1 border border-zinc-200 text-xs overflow-x-auto no-scrollbar max-w-full">
              <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1.5 shrink-0" />
              <button
                onClick={() => setHighlightMode('all')}
                className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer whitespace-nowrap ${
                  highlightMode === 'all'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                All Rows
              </button>
              <button
                onClick={() => setHighlightMode('overBudget')}
                className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer whitespace-nowrap ${
                  highlightMode === 'overBudget'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Over Budget
              </button>
              <button
                onClick={() => setHighlightMode('underBudget')}
                className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer whitespace-nowrap ${
                  highlightMode === 'underBudget'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Under Budget
              </button>
            </div>
          </div>

          {/* Display Controls & Baseline Configuration */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* % Calculation Toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-1 rounded-none overflow-x-auto no-scrollbar max-w-full">
              <span className="text-zinc-500 font-bold flex items-center gap-1 px-2 whitespace-nowrap shrink-0">
                <Percent className="w-3 h-3 text-black" /> % Based On:
              </span>
              <button
                onClick={() => onTogglePctBaselineMode('revenue')}
                className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pctBaselineMode === 'revenue'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:bg-white hover:text-black'
                }`}
              >
                Revenue Baseline
              </button>
              <button
                onClick={() => onTogglePctBaselineMode('totalExpenses')}
                className={`px-2.5 py-1 rounded-none font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pctBaselineMode === 'totalExpenses'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:bg-white hover:text-black'
                }`}
              >
                Total Expenses
              </button>
            </div>

            {/* Toggle % Columns */}
            <button
              onClick={() => setShowPercentageColumns(!showPercentageColumns)}
              className="text-black hover:bg-zinc-100 border border-zinc-300 bg-white px-3 py-1.5 rounded-none font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              {showPercentageColumns ? 'Hide % Columns' : 'Show % Columns'}
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Bar Cards (Bento Grid B&W) */}
      <div className="max-w-7xl mx-auto px-4 mt-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Month Actual */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <p className="text-[11px] font-black text-zinc-700 uppercase tracking-wider flex items-center justify-between">
            <span>{monthName} Actual Expenses</span>
            <span className="text-[10px] text-white bg-black px-2.5 py-0.5 rounded-none font-bold">
              Active Month
            </span>
          </p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-black tracking-tight font-mono">
              ${formatCurrency(summary.monthTotalActual)}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-600">
            <span>Budget: ${formatCurrency(summary.monthTotalBudget)}</span>
            <span
              className={`px-2 py-0.5 rounded-none text-[11px] font-black ${
                summary.monthTotalActual <= summary.monthTotalBudget
                  ? 'bg-zinc-100 text-black border border-zinc-300'
                  : 'bg-black text-white'
              }`}
            >
              {summary.monthTotalActual <= summary.monthTotalBudget ? 'Favorable' : 'Over Budget'}
            </span>
          </div>
        </div>

        {/* Card 2: YTD Actual & Budget Progress */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <p className="text-[11px] font-black text-zinc-700 uppercase tracking-wider flex items-center justify-between">
            <span>YTD (Jan - {ytdMonthName})</span>
            <span className="text-[10px] text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-none font-bold">
              Cumulative
            </span>
          </p>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-black text-black tracking-tight font-mono">
              ${formatCurrency(summary.ytdTotalActual)}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-bold text-zinc-600 mb-1">
              <span>Target: ${formatCurrency(summary.ytdTotalBudget)}</span>
              <span className="font-mono text-black font-black">
                {summary.ytdTotalBudget > 0
                  ? ((summary.ytdTotalActual / summary.ytdTotalBudget) * 100).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
            <div className="w-full bg-zinc-100 h-2 rounded-none overflow-hidden">
              <div
                className="h-full bg-black rounded-none transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    summary.ytdTotalBudget > 0
                      ? (summary.ytdTotalActual / summary.ytdTotalBudget) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: YTD Budget Variance */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <p className="text-[11px] font-black text-zinc-700 uppercase tracking-wider">
            YTD Budget Variance
          </p>
          <div className="flex items-center justify-between mt-3">
            {summary.ytdTotalActual <= summary.ytdTotalBudget ? (
              <span className="text-3xl font-black text-black font-mono tracking-tight flex items-center gap-1">
                -${formatCurrency(summary.ytdTotalBudget - summary.ytdTotalActual)}
                <ArrowDownRight className="w-6 h-6 stroke-[3]" />
              </span>
            ) : (
              <span className="text-3xl font-black text-black font-mono tracking-tight flex items-center gap-1">
                +${formatCurrency(summary.ytdTotalActual - summary.ytdTotalBudget)}
                <ArrowUpRight className="w-6 h-6 stroke-[3]" />
              </span>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-600">Status:</span>
            <span
              className={`px-3 py-1 rounded-none text-xs font-black ${
                summary.ytdTotalActual <= summary.ytdTotalBudget
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-black border border-zinc-300'
              }`}
            >
              {summary.ytdTotalActual <= summary.ytdTotalBudget ? 'Under Budget (-)' : 'Over Budget (+)'}
            </span>
          </div>
        </div>

        {/* Card 4: YoY Growth vs Last Year */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <p className="text-[11px] font-black text-zinc-700 uppercase tracking-wider">
            YoY vs Last Year
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-3xl font-black text-black font-mono tracking-tight">
              {summary.ytdTotalActual >= summary.ytdTotalLastYear ? '+' : '-'}
              ${formatCurrency(Math.abs(summary.ytdTotalActual - summary.ytdTotalLastYear))}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-600">
            <span>Prior Year Total:</span>
            <span className="font-mono text-black font-black">
              ${formatCurrency(summary.ytdTotalLastYear)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Statement Grid Table */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="bg-white border border-zinc-200/80 rounded-none shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans min-w-[960px]">
            {/* Table Header Row 1: Section Dividers */}
            <thead>
              <tr className="bg-black text-white font-black tracking-wider uppercase border-b border-zinc-800">
                {/* Month Section Header */}
                <th
                  colSpan={showPercentageColumns ? 6 : 3}
                  className="px-3 py-3 text-center border-r border-zinc-800 bg-black"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-white font-black">{monthName}</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {canEdit ? '(Click cells to edit)' : '(Read-Only View)'}
                    </span>
                  </div>
                </th>

                {/* Center Title Header */}
                <th className="px-4 py-3 text-center text-sm font-black text-white tracking-wide border-r border-zinc-800 bg-zinc-900 min-w-[280px]">
                  {yearData.departmentName}
                </th>

                {/* YTD Section Header */}
                <th
                  colSpan={showPercentageColumns ? 6 : 3}
                  className="px-3 py-3 text-center border-l border-zinc-800 bg-black"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-white font-black">YTD (Jan - {ytdMonthName})</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      Cumulative Totals
                    </span>
                  </div>
                </th>
              </tr>

              {/* Table Header Row 2: Columns */}
              <tr className="bg-zinc-900 text-zinc-200 font-bold border-b border-zinc-800 text-[11px]">
                {/* Selected Month Columns */}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">Actual</th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right border-r border-zinc-800 w-14 text-zinc-400">
                    %
                  </th>
                )}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">
                  Budget
                </th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right border-r border-zinc-800 w-14 text-zinc-400">
                    %
                  </th>
                )}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">
                  Last Year
                </th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right border-r border-zinc-800 w-14 text-zinc-400">
                    %
                  </th>
                )}

                {/* Line Item Name Header */}
                <th className="px-4 py-2 text-left text-white font-black border-r border-zinc-800 bg-black">
                  Line Items & Categories
                </th>

                {/* YTD Columns */}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">Actual</th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right border-r border-zinc-800 w-14 text-zinc-400">
                    %
                  </th>
                )}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">
                  Budget
                </th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right border-r border-zinc-800 w-14 text-zinc-400">
                    %
                  </th>
                )}
                <th className="px-2.5 py-2 text-right border-r border-zinc-800 w-20">
                  Last Year
                </th>
                {showPercentageColumns && (
                  <th className="px-1.5 py-2 text-right w-14 text-zinc-400">%</th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-200">
              {yearData.categories.map((cat) => {
                const catItems = yearData.lineItems.filter((i) => i.categoryId === cat.id);
                const filteredCatItems = catItems.filter((item) => {
                  const ls = summary.lineSummaries[item.id];
                  if (!ls) return true;
                  const matchesSearch =
                    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!matchesSearch) return false;

                  if (highlightMode === 'overBudget') {
                    return ls.ytdBudgetVariance > 0;
                  }
                  if (highlightMode === 'underBudget') {
                    return ls.ytdBudgetVariance <= 0;
                  }
                  return true;
                });

                if (filteredCatItems.length === 0 && searchQuery) {
                  return null;
                }

                const catSum = summary.categorySummaries[cat.id];

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Header Row */}
                    <tr className="bg-zinc-100 font-bold text-zinc-900 border-t-2 border-zinc-300">
                      <td
                        colSpan={showPercentageColumns ? 13 : 7}
                        className="px-4 py-2 text-center text-zinc-900 font-black uppercase tracking-wider bg-zinc-200/90 text-xs border-y border-zinc-300"
                      >
                        {cat.name}
                      </td>
                    </tr>

                    {/* Category Line Items */}
                    {filteredCatItems.map((item, idx) => {
                      const ls = summary.lineSummaries[item.id];
                      if (!ls) return null;

                      const isOverBudget = ls.ytdBudgetVariance > 0;
                      const isRowEven = idx % 2 === 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-zinc-100/80 transition-colors ${
                            isRowEven ? 'bg-white' : 'bg-zinc-50/60'
                          }`}
                        >
                          {/* Selected Month Actual */}
                          <td
                            onClick={canEdit ? () => handleStartEdit(item.id, 'actual', ls.monthActual) : undefined}
                            className={`px-2.5 py-1.5 text-right font-mono text-zinc-900 border-r border-zinc-200 ${
                              canEdit ? 'cursor-pointer hover:bg-zinc-200 hover:font-bold' : 'cursor-default'
                            }`}
                            title={canEdit ? "Click to edit Actual" : undefined}
                          >
                            {editingCell?.lineItemId === item.id &&
                            editingCell?.field === 'actual' ? (
                              <input
                                type="number"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={handleSaveCell}
                                onKeyDown={handleKeyDown}
                                className="w-full text-right font-mono bg-amber-100 border border-amber-500 rounded-none px-1 py-0.5 focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              formatCurrency(ls.monthActual)
                            )}
                          </td>

                          {/* Selected Month Actual % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700 border-r border-zinc-200">
                              {formatPercent(ls.monthActualPct)}
                            </td>
                          )}

                          {/* Selected Month Budget */}
                          <td
                            onClick={canEdit ? () => handleStartEdit(item.id, 'budget', ls.monthBudget) : undefined}
                            className={`px-2.5 py-1.5 text-right font-mono text-zinc-900 border-r border-zinc-200 ${
                              canEdit ? 'cursor-pointer hover:bg-zinc-200 hover:font-bold' : 'cursor-default'
                            }`}
                            title={canEdit ? "Click to edit Budget" : undefined}
                          >
                            {editingCell?.lineItemId === item.id &&
                            editingCell?.field === 'budget' ? (
                              <input
                                type="number"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={handleSaveCell}
                                onKeyDown={handleKeyDown}
                                className="w-full text-right font-mono bg-amber-100 border border-amber-500 rounded-none px-1 py-0.5 focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              formatCurrency(ls.monthBudget)
                            )}
                          </td>

                          {/* Selected Month Budget % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700 border-r border-zinc-200">
                              {formatPercent(ls.monthBudgetPct)}
                            </td>
                          )}

                          {/* Selected Month Last Year */}
                          <td
                            onClick={canEdit ? () => handleStartEdit(item.id, 'lastYear', ls.monthLastYear) : undefined}
                            className={`px-2.5 py-1.5 text-right font-mono text-zinc-900 border-r border-zinc-200 ${
                              canEdit ? 'cursor-pointer hover:bg-zinc-200 hover:font-bold' : 'cursor-default'
                            }`}
                            title={canEdit ? "Click to edit Last Year" : undefined}
                          >
                            {editingCell?.lineItemId === item.id &&
                            editingCell?.field === 'lastYear' ? (
                              <input
                                type="number"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={handleSaveCell}
                                onKeyDown={handleKeyDown}
                                className="w-full text-right font-mono bg-amber-100 border border-amber-500 rounded-none px-1 py-0.5 focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              formatCurrency(ls.monthLastYear)
                            )}
                          </td>

                          {/* Selected Month Last Year % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700 border-r border-zinc-300">
                              {formatPercent(ls.monthLastYearPct)}
                            </td>
                          )}

                          {/* Line Item Label */}
                          <td className="px-4 py-1.5 text-zinc-900 font-bold border-r border-zinc-300 flex items-center justify-between">
                            <span>{item.name}</span>
                            {ls.ytdBudget > 0 && isOverBudget && (
                              <span
                                className="text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1 rounded-none ml-2"
                                title={`Over budget by $${formatCurrency(ls.ytdBudgetVariance)}`}
                              >
                                +${formatCurrency(ls.ytdBudgetVariance)}
                              </span>
                            )}
                          </td>

                          {/* YTD Actual */}
                          <td
                            className={`px-2.5 py-1.5 text-right font-mono border-r border-zinc-200 ${
                              isOverBudget ? 'font-black text-black' : 'text-zinc-800'
                            }`}
                          >
                            {formatCurrency(ls.ytdActual)}
                          </td>

                          {/* YTD Actual % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700 border-r border-zinc-200">
                              {formatPercent(ls.ytdActualPct)}
                            </td>
                          )}

                          {/* YTD Budget */}
                          <td className="px-2.5 py-1.5 text-right font-mono text-zinc-700 border-r border-zinc-200">
                            {formatCurrency(ls.ytdBudget)}
                          </td>

                          {/* YTD Budget % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700 border-r border-zinc-200">
                              {formatPercent(ls.ytdBudgetPct)}
                            </td>
                          )}

                          {/* YTD Last Year */}
                          <td className="px-2.5 py-1.5 text-right font-mono text-zinc-700 border-r border-zinc-200">
                            {formatCurrency(ls.ytdLastYear)}
                          </td>

                          {/* YTD Last Year % */}
                          {showPercentageColumns && (
                            <td className="px-1.5 py-1.5 text-right font-mono text-[11px] font-semibold text-zinc-700">
                              {formatPercent(ls.ytdLastYearPct)}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* Subtotal Row for Category */}
                    {catSum && (
                      <tr className="bg-zinc-200/90 font-black text-zinc-900 border-t border-b border-zinc-400">
                        {/* Month Subtotals */}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.monthActual)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px] border-r border-zinc-300">
                            {formatPercent(
                              (catSum.monthActual / summary.monthTotalActual) * 100 || 0
                            )}
                          </td>
                        )}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.monthBudget)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px] border-r border-zinc-300">
                            {formatPercent(
                              (catSum.monthBudget / summary.monthTotalBudget) * 100 || 0
                            )}
                          </td>
                        )}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.monthLastYear)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px] border-r border-zinc-400">
                            {formatPercent(
                              (catSum.monthLastYear / summary.monthTotalLastYear) * 100 || 0
                            )}
                          </td>
                        )}

                        {/* Category Subtotal Label */}
                        <td className="px-4 py-2 text-left font-black text-black border-r border-zinc-400 bg-zinc-200">
                          {cat.subtotalLabel}
                        </td>

                        {/* YTD Subtotals */}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.ytdActual)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px] border-r border-zinc-300">
                            {formatPercent(
                              (catSum.ytdActual / summary.ytdTotalActual) * 100 || 0
                            )}
                          </td>
                        )}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.ytdBudget)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px] border-r border-zinc-300">
                            {formatPercent(
                              (catSum.ytdBudget / summary.ytdTotalBudget) * 100 || 0
                            )}
                          </td>
                        )}
                        <td className="px-2.5 py-2 text-right font-mono border-r border-zinc-300">
                          {formatCurrency(catSum.ytdLastYear)}
                        </td>
                        {showPercentageColumns && (
                          <td className="px-1.5 py-2 text-right font-mono text-[11px]">
                            {formatPercent(
                              (catSum.ytdLastYear / summary.ytdTotalLastYear) * 100 || 0
                            )}
                          </td>
                        )}
                      </tr>
                    )}

                    {/* Special Group Total for Labor Costs (Salaries + Payroll-Related) */}
                    {cat.id === 'cat_payroll' && (
                      <tr className="bg-zinc-900 text-white font-black border-t-2 border-b-2 border-zinc-950">
                        {(() => {
                          const salSum = summary.categorySummaries['cat_salaries'];
                          const paySum = summary.categorySummaries['cat_payroll'];
                          const mAct = (salSum?.monthActual || 0) + (paySum?.monthActual || 0);
                          const mBud = (salSum?.monthBudget || 0) + (paySum?.monthBudget || 0);
                          const mLY = (salSum?.monthLastYear || 0) + (paySum?.monthLastYear || 0);

                          const yAct = (salSum?.ytdActual || 0) + (paySum?.ytdActual || 0);
                          const yBud = (salSum?.ytdBudget || 0) + (paySum?.ytdBudget || 0);
                          const yLY = (salSum?.ytdLastYear || 0) + (paySum?.ytdLastYear || 0);

                          return (
                            <>
                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(mAct)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] border-r border-zinc-800 text-zinc-300">
                                  {formatPercent((mAct / summary.monthTotalActual) * 100 || 0)}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(mBud)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] border-r border-zinc-800 text-zinc-300">
                                  {formatPercent((mBud / summary.monthTotalBudget) * 100 || 0)}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(mLY)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] border-r border-zinc-800 text-zinc-300">
                                  {formatPercent((mLY / summary.monthTotalLastYear) * 100 || 0)}
                                </td>
                              )}

                              <td className="px-4 py-2.5 text-left font-black tracking-wide text-white uppercase border-r border-zinc-800 bg-black">
                                Total Labor Costs and Related Expenses
                              </td>

                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(yAct)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] border-r border-zinc-800 text-zinc-300">
                                  {formatPercent((yAct / summary.ytdTotalActual) * 100 || 0)}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(yBud)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] border-r border-zinc-800 text-zinc-300">
                                  {formatPercent((yBud / summary.ytdTotalBudget) * 100 || 0)}
                                </td>
                              )}
                              <td className="px-2.5 py-2.5 text-right font-mono border-r border-zinc-800">
                                {formatCurrency(yLY)}
                              </td>
                              {showPercentageColumns && (
                                <td className="px-1.5 py-2.5 text-right font-mono text-[11px] text-zinc-300">
                                  {formatPercent((yLY / summary.ytdTotalLastYear) * 100 || 0)}
                                </td>
                              )}
                            </>
                          );
                        })()}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Grand Total Expenses Row */}
              <tr className="bg-black text-white font-black text-sm border-t-4 border-black">
                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.monthTotalActual)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400 border-r border-zinc-800">
                    100.0%
                  </td>
                )}
                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.monthTotalBudget)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400 border-r border-zinc-800">
                    100.0%
                  </td>
                )}
                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.monthTotalLastYear)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400 border-r border-zinc-800">
                    100.0%
                  </td>
                )}

                <td className="px-4 py-3 text-left font-black tracking-widest uppercase border-r border-zinc-800 bg-black text-white">
                  Total Expenses
                </td>

                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.ytdTotalActual)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400 border-r border-zinc-800">
                    100.0%
                  </td>
                )}
                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.ytdTotalBudget)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400 border-r border-zinc-800">
                    100.0%
                  </td>
                )}
                <td className="px-2.5 py-3 text-right font-mono border-r border-zinc-800 bg-black">
                  {formatCurrency(summary.ytdTotalLastYear)}
                </td>
                {showPercentageColumns && (
                  <td className="px-1.5 py-3 text-right font-mono text-xs text-zinc-400">
                    100.0%
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
