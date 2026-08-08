import React, { useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  Filter,
  Download,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Table as TableIcon,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#222934] border border-[#5F6B7A] p-3 shadow-xl rounded-none text-white text-xs max-w-xs z-50">
      {label && (
        <p className="font-black text-[#CFD6DE] tracking-wide mb-1.5 pb-1 border-b border-[#364150]">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const rawName = entry.name || entry.dataKey || 'Value';
          const val = entry.value;
          const color = entry.color || entry.fill || '#B8C4CE';
          const formattedVal =
            val === null || val === undefined
              ? 'N/A'
              : typeof val === 'number'
              ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
              : val;

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 font-mono">
              <span className="flex items-center gap-2 text-[#B8C4CE] font-semibold truncate">
                <span className="w-2.5 h-2.5 rounded-none shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{rawName}:</span>
              </span>
              <span className="font-bold text-white shrink-0">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { MONTH_NAMES } from '../data/defaultData';
import { ChartTypeOption, DateRangePreset, YearData } from '../types';
import {
  computeCustomReportData,
  formatCurrency,
  formatPercent,
} from '../utils/financialUtils';

interface CustomReportsProps {
  yearData: YearData;
  selectedMonthIndex: number;
  ytdThroughMonthIndex: number;
}

const CATEGORY_COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Soft Indigo
];

export const CustomReports: React.FC<CustomReportsProps> = ({
  yearData,
  selectedMonthIndex,
  ytdThroughMonthIndex,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Config State
  const [reportTitle, setReportTitle] = useState(
    `${yearData.departmentName} - Financial Executive Summary`
  );
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('ytd');
  const [startMonthIndex, setStartMonthIndex] = useState<number>(0);
  const [endMonthIndex, setEndMonthIndex] = useState<number>(ytdThroughMonthIndex);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>([]);

  const [chartType, setChartType] = useState<ChartTypeOption>('bar');
  const [groupBy, setGroupBy] = useState<'category' | 'lineItem' | 'month'>('category');

  const [showBudgetComparison, setShowBudgetComparison] = useState<boolean>(true);
  const [showLastYearComparison, setShowLastYearComparison] = useState<boolean>(true);
  const [showVariancePercent, setShowVariancePercent] = useState<boolean>(true);

  // Filter drawer/accordion states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Preset Handler
  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    switch (preset) {
      case 'ytd':
        setStartMonthIndex(0);
        setEndMonthIndex(ytdThroughMonthIndex);
        break;
      case 'full_year':
        setStartMonthIndex(0);
        setEndMonthIndex(11);
        break;
      case 'q1':
        setStartMonthIndex(0);
        setEndMonthIndex(2);
        break;
      case 'q2':
        setStartMonthIndex(3);
        setEndMonthIndex(5);
        break;
      case 'q3':
        setStartMonthIndex(6);
        setEndMonthIndex(8);
        break;
      case 'q4':
        setStartMonthIndex(9);
        setEndMonthIndex(11);
        break;
      case 'last_3_months':
        setEndMonthIndex(selectedMonthIndex);
        setStartMonthIndex(Math.max(0, selectedMonthIndex - 2));
        break;
      case 'last_6_months':
        setEndMonthIndex(selectedMonthIndex);
        setStartMonthIndex(Math.max(0, selectedMonthIndex - 5));
        break;
      case 'custom':
        break;
    }
  };

  // Compute aggregated report data
  const reportData = computeCustomReportData(
    yearData,
    startMonthIndex,
    endMonthIndex,
    selectedCategoryIds,
    selectedLineItemIds
  );

  // Line item selection handlers
  const handleToggleCategory = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const handleToggleLineItem = (itemId: string) => {
    if (selectedLineItemIds.includes(itemId)) {
      setSelectedLineItemIds(selectedLineItemIds.filter((id) => id !== itemId));
    } else {
      setSelectedLineItemIds([...selectedLineItemIds, itemId]);
    }
  };

  const handleSelectAllFilters = () => {
    setSelectedCategoryIds([]);
    setSelectedLineItemIds([]);
  };

  // Prepare chart dataset based on grouping option
  const getChartDataset = () => {
    if (groupBy === 'month') {
      return reportData.monthlyData.map((m) => ({
        name: m.monthName,
        Actual: m.actual,
        Budget: m.budget,
        'Last Year': m.lastYear,
        Variance: m.variance,
        'Variance %': m.variancePct,
      }));
    } else if (groupBy === 'category') {
      return reportData.categoryDataPoints.map((c) => ({
        name: c.label,
        Actual: c.actual,
        Budget: c.budget,
        'Last Year': c.lastYear,
        Variance: c.variance,
        'Variance %': c.variancePct,
      }));
    } else {
      // lineItem
      return reportData.itemDataPoints.map((item) => ({
        name: item.label,
        Actual: item.actual,
        Budget: item.budget,
        'Last Year': item.lastYear,
        Variance: item.variance,
        'Variance %': item.variancePct,
        Category: item.categoryName,
      }));
    }
  };

  const chartDataset = getChartDataset();

  // Export PDF Handler using html2canvas & jsPDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      setIsExportingPdf(true);
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `${reportTitle.replace(/\s+/g, '_')}_${reportData.startMonthName}_to_${reportData.endMonthName}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('An error occurred while generating PDF report.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Custom Report CSV Handler
  const handleExportReportCSV = () => {
    const headers = ['Group/Name', 'Actual ($)', 'Budget ($)', 'Last Year ($)', 'Variance ($)', 'Variance %'];
    const rows: string[][] = [
      [`"Report Title: ${reportTitle}"`],
      [`"Date Range: ${reportData.startMonthName} to ${reportData.endMonthName} (${reportData.monthCount} Months)"`],
      [],
      headers,
    ];

    if (groupBy === 'month') {
      reportData.monthlyData.forEach((m) => {
        rows.push([
          `"${m.monthName}"`,
          m.actual.toString(),
          m.budget.toString(),
          m.lastYear.toString(),
          m.variance.toString(),
          m.variancePct.toFixed(1) + '%',
        ]);
      });
    } else if (groupBy === 'category') {
      reportData.categoryDataPoints.forEach((c) => {
        rows.push([
          `"${c.label}"`,
          c.actual.toString(),
          c.budget.toString(),
          c.lastYear.toString(),
          c.variance.toString(),
          c.variancePct.toFixed(1) + '%',
        ]);
      });
    } else {
      reportData.itemDataPoints.forEach((i) => {
        rows.push([
          `"${i.label} (${i.categoryName})"`,
          i.actual.toString(),
          i.budget.toString(),
          i.lastYear.toString(),
          i.variance.toString(),
          i.variancePct.toFixed(1) + '%',
        ]);
      });
    }

    rows.push([]);
    rows.push([
      '"TOTAL"',
      reportData.totalActual.toString(),
      reportData.totalBudget.toString(),
      reportData.totalLastYear.toString(),
      reportData.totalVariance.toString(),
      reportData.totalVariancePct.toFixed(1) + '%',
    ]);

    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${reportTitle.replace(/\s+/g, '_')}_${reportData.startMonthName}_${reportData.endMonthName}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Control Panel Card */}
      <div className="bg-white border border-zinc-200/80 rounded-none shadow-xs p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black rounded-none text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-black">Customizable Executive Reporting</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Configure date ranges, filter specific line items, choose visualization styles, and export to PDF / CSV.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="px-4 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white rounded-none text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              {isExportingPdf ? 'Generating PDF...' : 'Export PDF Report'}
            </button>

            <button
              onClick={handleExportReportCSV}
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-black border border-zinc-200 hover:border-zinc-300 rounded-none text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export Custom CSV
            </button>
          </div>
        </div>

        {/* Report Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Report Title Input */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-zinc-800">Report Title Header</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-none px-3.5 py-2 font-bold text-zinc-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* 2. Date Range Presets */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-zinc-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-black" />
              Date Range Preset
            </label>
            <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-none border border-zinc-200">
              {[
                { id: 'ytd', label: `YTD (Jan-${reportData.endMonthName})` },
                { id: 'full_year', label: 'Full Year' },
                { id: 'q1', label: 'Q1' },
                { id: 'q2', label: 'Q2' },
                { id: 'q3', label: 'Q3' },
                { id: 'q4', label: 'Q4' },
                { id: 'last_3_months', label: 'Last 3M' },
                { id: 'last_6_months', label: 'Last 6M' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as DateRangePreset)}
                  className={`px-2.5 py-1 rounded-none font-bold transition-all text-[11px] cursor-pointer ${
                    dateRangePreset === p.id
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-black hover:bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Month Selectors if 'custom' date range */}
          {dateRangePreset === 'custom' && (
            <div className="space-y-1.5 md:col-span-2 flex items-center gap-3 bg-zinc-100 p-3 rounded-none border border-zinc-200">
              <div className="flex-1">
                <span className="text-[11px] font-bold text-zinc-700 block mb-1">Start Month:</span>
                <select
                  value={startMonthIndex}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStartMonthIndex(val);
                    if (val > endMonthIndex) setEndMonthIndex(val);
                  }}
                  className="w-full bg-white border border-zinc-300 rounded-none p-1.5 text-xs font-bold text-zinc-900"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold text-zinc-700 block mb-1">End Month:</span>
                <select
                  value={endMonthIndex}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEndMonthIndex(val);
                    if (val < startMonthIndex) setStartMonthIndex(val);
                  }}
                  className="w-full bg-white border border-zinc-300 rounded-none p-1.5 text-xs font-bold text-zinc-900"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 3. Grouping Options */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-black" />
              Data Grouping
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-none px-3 py-2 font-bold text-zinc-900 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="category">Group by Category</option>
              <option value="lineItem">Group by Line Item</option>
              <option value="month">Group by Month (Trend)</option>
            </select>
          </div>

          {/* 4. Preferred Visualization Type */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-black" />
              Visualization Style
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartTypeOption)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-none px-3 py-2 font-bold text-zinc-900 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="bar">Bar Chart (Side-by-Side)</option>
              <option value="stacked_bar">Stacked Bar Chart</option>
              <option value="line">Line Graph Trend</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart (Category Share)</option>
              <option value="table">Data Table View Only</option>
            </select>
          </div>

          {/* 5. Metrics Display Toggles */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-zinc-800 block">Include Metrics</label>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-zinc-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBudgetComparison}
                  onChange={(e) => setShowBudgetComparison(e.target.checked)}
                  className="rounded-none accent-black"
                />
                <span>Budget Comparison</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLastYearComparison}
                  onChange={(e) => setShowLastYearComparison(e.target.checked)}
                  className="rounded-none accent-black"
                />
                <span>Last Year Benchmark</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-800 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVariancePercent}
                  onChange={(e) => setShowVariancePercent(e.target.checked)}
                  className="rounded-none accent-black"
                />
                <span>Variance % Badge</span>
              </label>
            </div>
          </div>
        </div>

        {/* Accordion Toggle for Line Item Filter */}
        <div className="border-t border-zinc-100 pt-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center justify-between w-full text-xs font-bold text-black bg-zinc-50 hover:bg-zinc-100 p-3 rounded-none transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-black" />
              <span>
                Filter Specific Line Items ({reportData.activeItems.length} of {yearData.lineItems.length} Included)
              </span>
              {(selectedCategoryIds.length > 0 || selectedLineItemIds.length > 0) && (
                <span className="text-[10px] bg-black text-white font-bold px-2 py-0.5 rounded-none">
                  Filter Active
                </span>
              )}
            </div>
            {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isFilterOpen && (
            <div className="mt-3 p-4 bg-zinc-50 rounded-none border border-zinc-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Search items to filter..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="text-xs bg-white border border-zinc-300 rounded-none px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:border-black font-semibold text-black"
                />

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={handleSelectAllFilters}
                    className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-none font-bold text-zinc-800 cursor-pointer"
                  >
                    Include All Items
                  </button>
                </div>
              </div>

              {/* Categories & Line Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pt-1">
                {yearData.categories.map((cat) => {
                  const catItems = yearData.lineItems.filter(
                    (i) =>
                      i.categoryId === cat.id &&
                      (filterSearch === '' || i.name.toLowerCase().includes(filterSearch.toLowerCase()))
                  );

                  if (catItems.length === 0) return null;

                  const isCatSelected = selectedCategoryIds.includes(cat.id);

                  return (
                    <div key={cat.id} className="bg-white p-3 rounded-none border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                        <button
                          onClick={() => handleToggleCategory(cat.id)}
                          className="flex items-center gap-1.5 font-black text-black text-xs hover:text-zinc-600 cursor-pointer"
                        >
                          {isCatSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-black" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span>{cat.name}</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        {catItems.map((item) => {
                          const isItemSelected = selectedLineItemIds.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleToggleLineItem(item.id)}
                              className="flex items-center gap-2 text-left text-[11px] text-zinc-700 hover:text-black w-full pl-2 py-0.5 cursor-pointer"
                            >
                              {isItemSelected ? (
                                <CheckSquare className="w-3 h-3 text-black shrink-0" />
                              ) : (
                                <Square className="w-3 h-3 text-zinc-300 shrink-0" />
                              )}
                              <span className="truncate font-semibold">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Report Canvas (This element is captured into PDF) */}
      <div ref={reportRef} className="bg-white border border-zinc-200/80 rounded-none shadow-sm p-6 space-y-6">
        {/* Report Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <span className="text-[10px] font-black text-black uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-none border border-zinc-200">
              {yearData.departmentName}
            </span>
            <h1 className="text-2xl font-black text-black tracking-tight mt-2">{reportTitle}</h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Custom Range: <strong className="text-black">{reportData.startMonthName} to {reportData.endMonthName}</strong> ({reportData.monthCount} Months) • Grouped by <span className="capitalize font-bold text-black">{groupBy}</span>
            </p>
          </div>

          <div className="text-right sm:text-right text-xs text-zinc-500 font-mono space-y-0.5">
            <p>Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-[11px] text-black font-bold">{reportData.activeItems.length} Line Items Filtered</p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-none p-4">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Selected Period Actual
            </p>
            <p className="text-2xl font-black text-black font-mono tracking-tight mt-1">
              ${formatCurrency(reportData.totalActual)}
            </p>
          </div>

          {showBudgetComparison && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-none p-4">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Selected Period Budget
              </p>
              <p className="text-2xl font-black text-black font-mono tracking-tight mt-1">
                ${formatCurrency(reportData.totalBudget)}
              </p>
            </div>
          )}

          {showBudgetComparison && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-none p-4">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Budget Variance ($)
              </p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-2xl font-black font-mono tracking-tight ${
                    reportData.totalVariance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {reportData.totalVariance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(reportData.totalVariance))}
                </p>
                {showVariancePercent && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-none ${
                      reportData.totalVariance <= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {formatPercent(reportData.totalVariancePct)}
                  </span>
                )}
              </div>
            </div>
          )}

          {showLastYearComparison && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-none p-4">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Prior Year Benchmark
              </p>
              <p className="text-2xl font-black text-black font-mono tracking-tight mt-1">
                ${formatCurrency(reportData.totalLastYear)}
              </p>
            </div>
          )}
        </div>

        {/* Visualization Render Section */}
        {chartType !== 'table' && (
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-none p-5 space-y-3">
            <h3 className="text-sm font-black text-black">
              Interactive Visualization ({chartType.replace('_', ' ').toUpperCase()})
            </h3>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartDataset}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} stroke="#71717a" fontSize={11} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Actual" fill="#222934" radius={[0, 0, 0, 0]} />
                    {showBudgetComparison && <Bar dataKey="Budget" fill="#5F6B7A" radius={[0, 0, 0, 0]} />}
                    {showLastYearComparison && <Bar dataKey="Last Year" fill="#B8C4CE" radius={[0, 0, 0, 0]} />}
                  </BarChart>
                ) : chartType === 'stacked_bar' ? (
                  <BarChart data={chartDataset}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} stroke="#71717a" fontSize={11} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Actual" stackId="a" fill="#222934" radius={[0, 0, 0, 0]} />
                    {showBudgetComparison && <Bar dataKey="Budget" stackId="a" fill="#5F6B7A" radius={[0, 0, 0, 0]} />}
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartDataset}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} stroke="#71717a" fontSize={11} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="Actual" stroke="#222934" strokeWidth={3} dot={{ r: 5, fill: '#222934' }} />
                    {showBudgetComparison && <Line type="monotone" dataKey="Budget" stroke="#5F6B7A" strokeWidth={2} strokeDasharray="5 5" />}
                    {showLastYearComparison && <Line type="monotone" dataKey="Last Year" stroke="#B8C4CE" strokeWidth={2} />}
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartDataset}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} stroke="#71717a" fontSize={11} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="Actual" fill="#5F6B7A" stroke="#222934" fillOpacity={0.2} />
                    {showBudgetComparison && <Area type="monotone" dataKey="Budget" fill="#CFD6DE" stroke="#5F6B7A" fillOpacity={0.3} />}
                  </AreaChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartDataset}
                      dataKey="Actual"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.Actual)}`}
                    >
                      {chartDataset.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-black">
            Financial Breakdown Summary ({reportData.startMonthName} to {reportData.endMonthName})
          </h3>

          <div className="overflow-x-auto border border-zinc-200 rounded-none">
            <table className="w-full text-left text-xs font-sans border-collapse min-w-[680px]">
              <thead className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-200">
                <tr>
                  <th className="p-3 font-black">Line / Group Name</th>
                  <th className="p-3 text-right font-black">Actual ($)</th>
                  {showBudgetComparison && <th className="p-3 text-right font-black">Budget ($)</th>}
                  {showBudgetComparison && <th className="p-3 text-right font-black">Variance ($)</th>}
                  {showVariancePercent && showBudgetComparison && (
                    <th className="p-3 text-right font-black">Variance %</th>
                  )}
                  {showLastYearComparison && <th className="p-3 text-right font-black">Last Year ($)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {groupBy === 'month'
                  ? reportData.monthlyData.map((m) => (
                      <tr key={m.monthName} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-bold text-zinc-900">{m.monthName}</td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          ${formatCurrency(m.actual)}
                        </td>
                        {showBudgetComparison && (
                          <td className="p-3 text-right font-mono text-zinc-600">
                            ${formatCurrency(m.budget)}
                          </td>
                        )}
                        {showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              m.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {m.variance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(m.variance))}
                          </td>
                        )}
                        {showVariancePercent && showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              m.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatPercent(m.variancePct)}
                          </td>
                        )}
                        {showLastYearComparison && (
                          <td className="p-3 text-right font-mono text-zinc-500">
                            ${formatCurrency(m.lastYear)}
                          </td>
                        )}
                      </tr>
                    ))
                  : groupBy === 'category'
                  ? reportData.categoryDataPoints.map((c) => (
                      <tr key={c.label} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-bold text-zinc-900">{c.label}</td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          ${formatCurrency(c.actual)}
                        </td>
                        {showBudgetComparison && (
                          <td className="p-3 text-right font-mono text-zinc-600">
                            ${formatCurrency(c.budget)}
                          </td>
                        )}
                        {showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              c.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {c.variance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(c.variance))}
                          </td>
                        )}
                        {showVariancePercent && showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              c.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatPercent(c.variancePct)}
                          </td>
                        )}
                        {showLastYearComparison && (
                          <td className="p-3 text-right font-mono text-zinc-500">
                            ${formatCurrency(c.lastYear)}
                          </td>
                        )}
                      </tr>
                    ))
                  : reportData.itemDataPoints.map((i) => (
                      <tr key={i.label} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-zinc-900">{i.label}</div>
                          <div className="text-[10px] text-zinc-500">{i.categoryName}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          ${formatCurrency(i.actual)}
                        </td>
                        {showBudgetComparison && (
                          <td className="p-3 text-right font-mono text-zinc-600">
                            ${formatCurrency(i.budget)}
                          </td>
                        )}
                        {showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              i.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {i.variance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(i.variance))}
                          </td>
                        )}
                        {showVariancePercent && showBudgetComparison && (
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              i.variance <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatPercent(i.variancePct)}
                          </td>
                        )}
                        {showLastYearComparison && (
                          <td className="p-3 text-right font-mono text-zinc-500">
                            ${formatCurrency(i.lastYear)}
                          </td>
                        )}
                      </tr>
                    ))}
              </tbody>
              <tfoot className="bg-black text-white font-black border-t-2 border-black">
                <tr>
                  <td className="p-3 uppercase tracking-wider">Total Expenses</td>
                  <td className="p-3 text-right font-mono text-white">
                    ${formatCurrency(reportData.totalActual)}
                  </td>
                  {showBudgetComparison && (
                    <td className="p-3 text-right font-mono text-zinc-300">
                      ${formatCurrency(reportData.totalBudget)}
                    </td>
                  )}
                  {showBudgetComparison && (
                    <td
                      className={`p-3 text-right font-mono ${
                        reportData.totalVariance <= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {reportData.totalVariance <= 0 ? '-' : '+'}${formatCurrency(Math.abs(reportData.totalVariance))}
                    </td>
                  )}
                  {showVariancePercent && showBudgetComparison && (
                    <td
                      className={`p-3 text-right font-mono ${
                        reportData.totalVariance <= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatPercent(reportData.totalVariancePct)}
                    </td>
                  )}
                  {showLastYearComparison && (
                    <td className="p-3 text-right font-mono text-zinc-400">
                      ${formatCurrency(reportData.totalLastYear)}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
