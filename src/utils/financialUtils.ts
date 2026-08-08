import { MONTH_NAMES } from '../data/defaultData';
import {
  Category,
  ComputedCategorySummary,
  ComputedLineSummary,
  ComputedReportSummary,
  LineItem,
  SingleMonthData,
  YearData,
} from '../types';

export function formatCurrency(value: number, showSymbol = false): string {
  if (value === 0) return '0';
  const formatted = Math.abs(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
  const prefix = value < 0 ? '-' : '';
  const symbol = showSymbol ? '$' : '';
  return `${prefix}${symbol}${formatted}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value) || value === 0) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function computeReportSummary(
  yearData: YearData,
  selectedMonthIndex: number,
  ytdThroughMonthIndex: number,
  pctBaselineMode: 'revenue' | 'totalExpenses' = 'revenue'
): ComputedReportSummary {
  const { categories, lineItems, months } = yearData;

  const selectedMonth = months[selectedMonthIndex] || months[0];
  const ytdMonths = months.slice(0, ytdThroughMonthIndex + 1);

  // Revenue Baselines
  const monthRevenueBaseline = selectedMonth.revenueBaseline || 1500000;
  const ytdRevenueBaseline = ytdMonths.reduce(
    (acc, m) => acc + (m.revenueBaseline || 1500000),
    0
  );

  // 1. Calculate line item totals for selected month & YTD
  const lineSummaries: Record<string, ComputedLineSummary> = {};

  lineItems.forEach((item) => {
    // Selected Month
    const mVal = selectedMonth.items[item.id] || { actual: 0, budget: 0, lastYear: 0 };
    const monthActual = mVal.actual || 0;
    const monthBudget = mVal.budget || 0;
    const monthLastYear = mVal.lastYear || 0;

    // YTD
    let ytdActual = 0;
    let ytdBudget = 0;
    let ytdLastYear = 0;

    ytdMonths.forEach((m) => {
      const v = m.items[item.id];
      if (v) {
        ytdActual += v.actual || 0;
        ytdBudget += v.budget || 0;
        ytdLastYear += v.lastYear || 0;
      }
    });

    const ytdBudgetVariance = ytdActual - ytdBudget;
    const ytdBudgetVariancePct = ytdBudget !== 0 ? (ytdBudgetVariance / ytdBudget) * 100 : 0;

    const ytdYoYVariance = ytdActual - ytdLastYear;
    const ytdYoYVariancePct = ytdLastYear !== 0 ? (ytdYoYVariance / ytdLastYear) * 100 : 0;

    lineSummaries[item.id] = {
      lineItemId: item.id,
      name: item.name,
      categoryId: item.categoryId,
      monthActual,
      monthActualPct: 0, // Calculated below after grand total
      monthBudget,
      monthBudgetPct: 0,
      monthLastYear,
      monthLastYearPct: 0,
      ytdActual,
      ytdActualPct: 0,
      ytdBudget,
      ytdBudgetPct: 0,
      ytdLastYear,
      ytdLastYearPct: 0,
      ytdBudgetVariance,
      ytdBudgetVariancePct,
      ytdYoYVariance,
      ytdYoYVariancePct,
    };
  });

  // 2. Calculate category summaries & grand totals
  const categorySummaries: Record<string, ComputedCategorySummary> = {};

  let monthTotalActual = 0;
  let monthTotalBudget = 0;
  let monthTotalLastYear = 0;

  let ytdTotalActual = 0;
  let ytdTotalBudget = 0;
  let ytdTotalLastYear = 0;

  categories.forEach((cat) => {
    const catItems = lineItems.filter((i) => i.categoryId === cat.id);

    let catMonthActual = 0;
    let catMonthBudget = 0;
    let catMonthLastYear = 0;

    let catYtdActual = 0;
    let catYtdBudget = 0;
    let catYtdLastYear = 0;

    catItems.forEach((item) => {
      const summary = lineSummaries[item.id];
      if (summary) {
        catMonthActual += summary.monthActual;
        catMonthBudget += summary.monthBudget;
        catMonthLastYear += summary.monthLastYear;

        catYtdActual += summary.ytdActual;
        catYtdBudget += summary.ytdBudget;
        catYtdLastYear += summary.ytdLastYear;
      }
    });

    categorySummaries[cat.id] = {
      categoryId: cat.id,
      name: cat.name,
      monthActual: catMonthActual,
      monthBudget: catMonthBudget,
      monthLastYear: catMonthLastYear,
      ytdActual: catYtdActual,
      ytdBudget: catYtdBudget,
      ytdLastYear: catYtdLastYear,
      ytdBudgetVariance: catYtdActual - catYtdBudget,
    };

    monthTotalActual += catMonthActual;
    monthTotalBudget += catMonthBudget;
    monthTotalLastYear += catMonthLastYear;

    ytdTotalActual += catYtdActual;
    ytdTotalBudget += catYtdBudget;
    ytdTotalLastYear += catYtdLastYear;
  });

  // 3. Compute Percentages
  const mBaseline = pctBaselineMode === 'revenue' ? monthRevenueBaseline : monthTotalActual;
  const mBudgetBaseline = pctBaselineMode === 'revenue' ? monthRevenueBaseline : monthTotalBudget;
  const mLastYearBaseline = pctBaselineMode === 'revenue' ? monthRevenueBaseline : monthTotalLastYear;

  const yBaseline = pctBaselineMode === 'revenue' ? ytdRevenueBaseline : ytdTotalActual;
  const yBudgetBaseline = pctBaselineMode === 'revenue' ? ytdRevenueBaseline : ytdTotalBudget;
  const yLastYearBaseline = pctBaselineMode === 'revenue' ? ytdRevenueBaseline : ytdTotalLastYear;

  Object.values(lineSummaries).forEach((summary) => {
    summary.monthActualPct = mBaseline > 0 ? (summary.monthActual / mBaseline) * 100 : 0;
    summary.monthBudgetPct = mBudgetBaseline > 0 ? (summary.monthBudget / mBudgetBaseline) * 100 : 0;
    summary.monthLastYearPct = mLastYearBaseline > 0 ? (summary.monthLastYear / mLastYearBaseline) * 100 : 0;

    summary.ytdActualPct = yBaseline > 0 ? (summary.ytdActual / yBaseline) * 100 : 0;
    summary.ytdBudgetPct = yBudgetBaseline > 0 ? (summary.ytdBudget / yBudgetBaseline) * 100 : 0;
    summary.ytdLastYearPct = yLastYearBaseline > 0 ? (summary.ytdLastYear / yLastYearBaseline) * 100 : 0;
  });

  return {
    selectedMonthIndex,
    ytdThroughMonthIndex,
    monthRevenueBaseline,
    ytdRevenueBaseline,
    monthTotalActual,
    monthTotalBudget,
    monthTotalLastYear,
    ytdTotalActual,
    ytdTotalBudget,
    ytdTotalLastYear,
    categorySummaries,
    lineSummaries,
  };
}

export function exportToCSV(
  yearData: YearData,
  selectedMonthIndex: number,
  ytdThroughMonthIndex: number
): string {
  const selectedMonthName = MONTH_NAMES[selectedMonthIndex] || MONTH_NAMES[0];
  const ytdMonthName = MONTH_NAMES[ytdThroughMonthIndex] || MONTH_NAMES[0];

  const summary = computeReportSummary(
    yearData,
    selectedMonthIndex,
    ytdThroughMonthIndex
  );

  const headers = [
    'Category',
    'Line Item',
    `${selectedMonthName} Actual`,
    `${selectedMonthName} Actual %`,
    `${selectedMonthName} Budget`,
    `${selectedMonthName} Budget %`,
    `${selectedMonthName} Last Year`,
    `${selectedMonthName} Last Year %`,
    `YTD (${ytdMonthName}) Actual`,
    `YTD Actual %`,
    `YTD Budget`,
    `YTD Budget %`,
    `YTD Last Year`,
    `YTD Last Year %`,
    `YTD Budget Variance ($)`,
  ];

  const rows: string[][] = [headers];

  yearData.categories.forEach((cat) => {
    const items = yearData.lineItems.filter((i) => i.categoryId === cat.id);
    items.forEach((item) => {
      const ls = summary.lineSummaries[item.id];
      if (ls) {
        rows.push([
          `"${cat.name}"`,
          `"${item.name}"`,
          ls.monthActual.toString(),
          ls.monthActualPct.toFixed(2) + '%',
          ls.monthBudget.toString(),
          ls.monthBudgetPct.toFixed(2) + '%',
          ls.monthLastYear.toString(),
          ls.monthLastYearPct.toFixed(2) + '%',
          ls.ytdActual.toString(),
          ls.ytdActualPct.toFixed(2) + '%',
          ls.ytdBudget.toString(),
          ls.ytdBudgetPct.toFixed(2) + '%',
          ls.ytdLastYear.toString(),
          ls.ytdLastYearPct.toFixed(2) + '%',
          ls.ytdBudgetVariance.toString(),
        ]);
      }
    });

    const catSum = summary.categorySummaries[cat.id];
    if (catSum) {
      rows.push([
        `"${cat.name}"`,
        `"SUBTOTAL: ${cat.subtotalLabel}"`,
        catSum.monthActual.toString(),
        '',
        catSum.monthBudget.toString(),
        '',
        catSum.monthLastYear.toString(),
        '',
        catSum.ytdActual.toString(),
        '',
        catSum.ytdBudget.toString(),
        '',
        catSum.ytdLastYear.toString(),
        '',
        catSum.ytdBudgetVariance.toString(),
      ]);
    }
  });

  rows.push([
    'TOTAL',
    '"GRAND TOTAL EXPENSES"',
    summary.monthTotalActual.toString(),
    '',
    summary.monthTotalBudget.toString(),
    '',
    summary.monthTotalLastYear.toString(),
    '',
    summary.ytdTotalActual.toString(),
    '',
    summary.ytdTotalBudget.toString(),
    '',
    summary.ytdTotalLastYear.toString(),
    '',
    (summary.ytdTotalActual - summary.ytdTotalBudget).toString(),
  ]);

  return rows.map((r) => r.join(',')).join('\n');
}

export interface ReportDataPoint {
  id?: string;
  label: string;
  actual: number;
  budget: number;
  lastYear: number;
  variance: number;
  variancePct: number;
  categoryName?: string;
}

export function computeCustomReportData(
  yearData: YearData,
  startMonthIndex: number,
  endMonthIndex: number,
  selectedCategoryIds: string[],
  selectedLineItemIds: string[]
) {
  const { categories, lineItems, months } = yearData;

  const validStart = Math.max(0, Math.min(startMonthIndex, 11));
  const validEnd = Math.max(validStart, Math.min(endMonthIndex, 11));
  const selectedMonths = months.slice(validStart, validEnd + 1);

  // Filter line items
  let activeItems = lineItems;
  if (selectedCategoryIds.length > 0) {
    activeItems = activeItems.filter((i) => selectedCategoryIds.includes(i.categoryId));
  }
  if (selectedLineItemIds.length > 0) {
    activeItems = activeItems.filter((i) => selectedLineItemIds.includes(i.id));
  }

  // Monthly Trend Data
  const monthlyData = selectedMonths.map((m) => {
    let actual = 0;
    let budget = 0;
    let lastYear = 0;

    activeItems.forEach((item) => {
      const v = m.items[item.id];
      if (v) {
        actual += v.actual || 0;
        budget += v.budget || 0;
        lastYear += v.lastYear || 0;
      }
    });

    const variance = actual - budget;
    const variancePct = budget !== 0 ? (variance / budget) * 100 : 0;

    return {
      monthName: MONTH_NAMES[m.monthIndex],
      monthIndex: m.monthIndex,
      actual,
      budget,
      lastYear,
      variance,
      variancePct,
    };
  });

  // Line Item Aggregation across the selected months
  const itemDataPoints: ReportDataPoint[] = activeItems.map((item) => {
    let actual = 0;
    let budget = 0;
    let lastYear = 0;

    selectedMonths.forEach((m) => {
      const v = m.items[item.id];
      if (v) {
        actual += v.actual || 0;
        budget += v.budget || 0;
        lastYear += v.lastYear || 0;
      }
    });

    const category = categories.find((c) => c.id === item.categoryId);
    const variance = actual - budget;
    const variancePct = budget !== 0 ? (variance / budget) * 100 : 0;

    return {
      id: item.id,
      label: item.name,
      actual,
      budget,
      lastYear,
      variance,
      variancePct,
      categoryName: category?.name || 'Other',
    };
  });

  // Category Aggregation across the selected months
  const activeCategories = categories.filter(
    (c) => selectedCategoryIds.length === 0 || selectedCategoryIds.includes(c.id)
  );

  const categoryDataPoints: ReportDataPoint[] = activeCategories.map((cat) => {
    const catItems = activeItems.filter((i) => i.categoryId === cat.id);
    let actual = 0;
    let budget = 0;
    let lastYear = 0;

    catItems.forEach((item) => {
      selectedMonths.forEach((m) => {
        const v = m.items[item.id];
        if (v) {
          actual += v.actual || 0;
          budget += v.budget || 0;
          lastYear += v.lastYear || 0;
        }
      });
    });

    const variance = actual - budget;
    const variancePct = budget !== 0 ? (variance / budget) * 100 : 0;

    return {
      id: cat.id,
      label: cat.name,
      actual,
      budget,
      lastYear,
      variance,
      variancePct,
    };
  });

  // Totals
  const totalActual = monthlyData.reduce((acc, m) => acc + m.actual, 0);
  const totalBudget = monthlyData.reduce((acc, m) => acc + m.budget, 0);
  const totalLastYear = monthlyData.reduce((acc, m) => acc + m.lastYear, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePct = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

  return {
    startMonthName: MONTH_NAMES[validStart],
    endMonthName: MONTH_NAMES[validEnd],
    monthCount: validEnd - validStart + 1,
    monthlyData,
    itemDataPoints,
    categoryDataPoints,
    totalActual,
    totalBudget,
    totalLastYear,
    totalVariance,
    totalVariancePct,
    activeItems,
    activeCategories,
  };
}

