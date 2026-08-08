import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/defaultData';
import { User, YearData } from '../types';
import { formatCurrency } from '../utils/financialUtils';

interface QuickDataEntryProps {
  yearData: YearData;
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
  onUpdateMonthValue: (
    monthIndex: number,
    lineItemId: string,
    field: 'actual' | 'budget' | 'lastYear',
    value: number
  ) => void;
  onBulkUpdateMonth: (
    monthIndex: number,
    items: Record<string, { actual: number; budget: number; lastYear: number }>
  ) => void;
  onOpenScreenshotModal?: () => void;
  currentUser?: User | null;
}

export const QuickDataEntry: React.FC<QuickDataEntryProps> = ({
  yearData,
  selectedMonthIndex,
  onSelectMonth,
  onUpdateMonthValue,
  onBulkUpdateMonth,
  onOpenScreenshotModal,
  currentUser,
}) => {
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentMonthData = yearData.months[selectedMonthIndex] || yearData.months[0];
  const monthName = MONTH_NAMES[selectedMonthIndex];

  // Helper action: Copy previous month budget
  const handleCopyPrevMonthBudget = () => {
    if (!canEdit) return;
    if (selectedMonthIndex === 0) return;
    const prevMonthData = yearData.months[selectedMonthIndex - 1];
    if (!prevMonthData) return;

    const newItems = { ...currentMonthData.items };
    yearData.lineItems.forEach((item) => {
      const prevVal = prevMonthData.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };
      newItems[item.id] = {
        ...newItems[item.id],
        budget: prevVal.budget,
      };
    });

    onBulkUpdateMonth(selectedMonthIndex, newItems);
    showToast('Copied budget values from ' + MONTH_NAMES[selectedMonthIndex - 1]);
  };

  // Helper action: Copy Last Year to Budget
  const handleCopyLastYearToBudget = () => {
    if (!canEdit) return;
    const newItems = { ...currentMonthData.items };
    yearData.lineItems.forEach((item) => {
      const cur = newItems[item.id] || { actual: 0, budget: 0, lastYear: 0 };
      newItems[item.id] = {
        ...cur,
        budget: cur.lastYear,
      };
    });

    onBulkUpdateMonth(selectedMonthIndex, newItems);
    showToast('Copied Last Year values into Budget column');
  };

  // Helper action: Clear month actuals
  const handleClearActuals = () => {
    if (!canEdit) return;
    if (confirm(`Clear all Actual expenses for ${monthName}?`)) {
      const newItems = { ...currentMonthData.items };
      yearData.lineItems.forEach((item) => {
        const cur = newItems[item.id] || { actual: 0, budget: 0, lastYear: 0 };
        newItems[item.id] = { ...cur, actual: 0 };
      });
      onBulkUpdateMonth(selectedMonthIndex, newItems);
      showToast(`Cleared all Actuals for ${monthName}`);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="bg-white border border-zinc-200/80 rounded-none shadow-xs overflow-hidden">
        {/* Form Header */}
        <div className="bg-black text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white text-black rounded-none shadow-sm">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black">Monthly Data Input Form</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Select a month and enter numbers line-by-line. Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded-none text-[10px]">Tab</kbd> to jump between fields.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-300 font-bold">Active Month:</label>
            <select
              value={selectedMonthIndex}
              onChange={(e) => onSelectMonth(Number(e.target.value))}
              className="bg-zinc-800 text-white border border-zinc-700 rounded-none px-4 py-2 text-sm font-black focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Action Tools Bar */}
        {!canEdit ? (
          <div className="bg-amber-50 border-b border-amber-200 p-3.5 px-6 text-xs text-amber-900 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Read-Only Mode: You are logged in as a Viewer. Input fields and batch editing actions are disabled.</span>
          </div>
        ) : (
          <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {onOpenScreenshotModal && (
                <button
                  onClick={onOpenScreenshotModal}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-none font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  Upload Screenshot AI Auto-Fill
                </button>
              )}

              <button
                onClick={handleCopyPrevMonthBudget}
                disabled={selectedMonthIndex === 0}
                className="px-3.5 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 text-black rounded-none font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-black" />
                Copy Prev Budget
              </button>

              <button
                onClick={handleCopyLastYearToBudget}
                className="px-3.5 py-2 bg-white border border-zinc-300 hover:bg-zinc-100 text-black rounded-none font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-black" />
                Budget = Last Year
              </button>

              <button
                onClick={handleClearActuals}
                className="px-3.5 py-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-none font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Clear Actuals
              </button>
            </div>

            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search lines..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="text-xs bg-white border border-zinc-300 rounded-none px-3.5 py-2 focus:outline-none focus:border-black w-48 font-semibold"
            />
          </div>
        )}

        {/* Toast Alert */}
        {successMessage && (
          <div className="bg-black text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Input Form Table */}
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs font-sans min-w-[620px]">
            <thead className="bg-zinc-100 text-black font-black sticky top-0 z-10 border-b border-zinc-300">
              <tr>
                <th className="px-5 py-3 text-left min-w-[280px]">Line Item Name</th>
                <th className="px-4 py-3 text-right w-36 bg-zinc-200 text-black border-x border-zinc-300">
                  {monthName} Actual ($)
                </th>
                <th className="px-4 py-3 text-right w-36">Budget ($)</th>
                <th className="px-4 py-3 text-right w-36">Last Year ($)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200">
              {yearData.categories.map((cat) => {
                const catItems = yearData.lineItems.filter(
                  (i) =>
                    i.categoryId === cat.id &&
                    (!searchFilter || i.name.toLowerCase().includes(searchFilter.toLowerCase()))
                );

                if (catItems.length === 0) return null;

                return (
                  <React.Fragment key={cat.id}>
                    {/* Category Header */}
                    <tr className="bg-zinc-900 text-white font-black">
                      <td colSpan={4} className="px-5 py-2 text-xs uppercase tracking-wider">
                        {cat.name}
                      </td>
                    </tr>

                    {/* Category Line Items */}
                    {catItems.map((item) => {
                      const v = currentMonthData.items[item.id] || {
                        actual: 0,
                        budget: 0,
                        lastYear: 0,
                      };

                      return (
                        <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-5 py-2.5 text-zinc-900 font-bold">{item.name}</td>

                          {/* Actual Input */}
                          <td className="px-2 py-1.5 bg-zinc-100/80 border-x border-zinc-200">
                            <input
                              type="number"
                              step="any"
                              disabled={!canEdit}
                              value={v.actual === 0 ? '' : v.actual}
                              onChange={(e) =>
                                onUpdateMonthValue(
                                  selectedMonthIndex,
                                  item.id,
                                  'actual',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full bg-white border border-zinc-300 text-black font-mono font-bold text-right px-3 py-1.5 rounded-none focus:outline-none focus:border-black focus:ring-2 focus:ring-black disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Budget Input */}
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              step="any"
                              disabled={!canEdit}
                              value={v.budget === 0 ? '' : v.budget}
                              onChange={(e) =>
                                onUpdateMonthValue(
                                  selectedMonthIndex,
                                  item.id,
                                  'budget',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full bg-white border border-zinc-200 text-zinc-900 font-mono font-bold text-right px-3 py-1.5 rounded-none focus:outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Last Year Input */}
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              step="any"
                              disabled={!canEdit}
                              value={v.lastYear === 0 ? '' : v.lastYear}
                              onChange={(e) =>
                                onUpdateMonthValue(
                                  selectedMonthIndex,
                                  item.id,
                                  'lastYear',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-full bg-white border border-zinc-200 text-zinc-700 font-mono font-bold text-right px-3 py-1.5 rounded-none focus:outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
