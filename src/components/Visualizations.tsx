import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MONTH_NAMES } from '../data/defaultData';
import { ComputedReportSummary, YearData } from '../types';
import { formatCurrency } from '../utils/financialUtils';

interface VisualizationsProps {
  yearData: YearData;
  summary: ComputedReportSummary;
  selectedMonthIndex: number;
  ytdThroughMonthIndex: number;
}

const BW_CATEGORY_COLORS = ['#222934', '#5F6B7A', '#8795A7', '#B8C4CE', '#CFD6DE', '#E1E7EC'];

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
          const displayName = rawName === 'variance' ? 'Variance vs Budget' : rawName;
          const val = entry.value;
          const color = entry.color || entry.fill || '#B8C4CE';
          const formattedVal =
            val === null || val === undefined
              ? 'Not Entered'
              : typeof val === 'number'
              ? `$${formatCurrency(val)}`
              : val;

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 font-mono">
              <span className="flex items-center gap-2 text-[#B8C4CE] font-semibold truncate">
                <span className="w-2.5 h-2.5 rounded-none shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{displayName}:</span>
              </span>
              <span className="font-bold text-white shrink-0">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Visualizations: React.FC<VisualizationsProps> = ({
  yearData,
  summary,
  selectedMonthIndex,
  ytdThroughMonthIndex,
}) => {
  const [selectedLineItemId, setSelectedLineItemId] = useState<string>(
    yearData.lineItems[0]?.id || ''
  );

  const ytdMonthName = MONTH_NAMES[ytdThroughMonthIndex] || 'YTD';

  // 1. Prepare Category Breakdown Data
  const categoryPieData = yearData.categories.map((cat, idx) => {
    const catSum = summary.categorySummaries[cat.id];
    return {
      name: cat.name,
      value: catSum?.ytdActual || 0,
      budget: catSum?.ytdBudget || 0,
      color: BW_CATEGORY_COLORS[idx % BW_CATEGORY_COLORS.length],
    };
  });

  // 2. Prepare 12-Month Trend Data
  const monthlyTrendData = yearData.months.map((m) => {
    const monthName = MONTH_NAMES[m.monthIndex];
    let actualSum = 0;
    let budgetSum = 0;
    let lastYearSum = 0;

    yearData.lineItems.forEach((item) => {
      const v = m.items[item.id];
      if (v) {
        actualSum += v.actual || 0;
        budgetSum += v.budget || 0;
        lastYearSum += v.lastYear || 0;
      }
    });

    return {
      month: monthName.slice(0, 3),
      fullMonthName: monthName,
      Actual: m.monthIndex <= ytdThroughMonthIndex ? actualSum : null,
      Budget: budgetSum,
      'Last Year': lastYearSum,
    };
  });

  // 3. Prepare Top Budget Variances (Over & Under)
  const lineItemVariances = yearData.lineItems
    .map((item) => {
      const ls = summary.lineSummaries[item.id];
      return {
        id: item.id,
        name: item.name,
        variance: ls ? ls.ytdBudgetVariance : 0,
        actual: ls ? ls.ytdActual : 0,
        budget: ls ? ls.ytdBudget : 0,
      };
    })
    .filter((i) => i.budget > 0 || i.actual > 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10);

  // 4. Prepare Single Line Item 12-Month Trajectory
  const singleLineItemTrend = yearData.months.map((m) => {
    const v = m.items[selectedLineItemId] || { actual: 0, budget: 0, lastYear: 0 };
    return {
      month: MONTH_NAMES[m.monthIndex].slice(0, 3),
      Actual: m.monthIndex <= ytdThroughMonthIndex ? v.actual : null,
      Budget: v.budget,
      'Last Year': v.lastYear,
    };
  });

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-black tracking-tight">Financial Statistics & Analytics</h2>
          <p className="text-xs text-zinc-500 font-medium">Visual monochrome breakdown of YTD performance</p>
        </div>
      </div>

      {/* Top Section: Category Breakdown & Top Variances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share Donut Chart */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-6 shadow-xs">
          <h3 className="text-sm font-black text-black mb-0.5">
            YTD Category Share (Jan - {ytdMonthName})
          </h3>
          <p className="text-xs text-zinc-500 mb-4 font-medium">
            Total spending: ${formatCurrency(summary.ytdTotalActual)}
          </p>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100 text-xs font-bold">
            {categoryPieData.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-2.5 rounded-none bg-zinc-50 border border-zinc-200/60"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-3 h-3 rounded-none shrink-0 border border-zinc-400"
                    style={{ backgroundColor: cat.color }}
                  ></span>
                  <span className="truncate text-zinc-800" title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <span className="font-mono text-black">${formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Variances Horizontal Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-none p-6 shadow-xs">
          <h3 className="text-sm font-black text-black mb-0.5">
            Top 10 Budget Variances ($)
          </h3>
          <p className="text-xs text-zinc-500 mb-4 font-medium">
            Over-budget variances (Dark) vs under-budget savings (Light)
          </p>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={lineItemVariances}
                layout="vertical"
                margin={{ left: 150, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${formatCurrency(val)}`}
                  textAnchor="end"
                  stroke="#52525b"
                  fontSize={11}
                  fontWeight="bold"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 10, fill: '#222934', fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="variance" radius={[0, 0, 0, 0]}>
                  {lineItemVariances.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.variance > 0 ? '#222934' : '#8795A7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Section: Monochrome Curve Line Chart */}
      <div className="bg-white border border-zinc-200/80 rounded-none p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-black">
              Your Statistics: 12-Month Trajectory
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Smooth monochrome trend showing actual monthly spending vs budget baseline
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} fontWeight="bold" />
              <YAxis
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                stroke="#71717a"
                fontSize={12}
                fontWeight="bold"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#222934"
                strokeWidth={3}
                dot={{ r: 6, fill: '#222934', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="Budget"
                stroke="#5F6B7A"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Last Year"
                stroke="#B8C4CE"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Single Line Item Deep Dive */}
      <div className="bg-white border border-zinc-200/80 rounded-none p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-black">Line Item Deep-Dive Explorer</h3>
            <p className="text-xs text-zinc-500 font-medium">
              Inspect any individual expense across the full 12-month period
            </p>
          </div>

          <div className="min-w-[260px]">
            <select
              value={selectedLineItemId}
              onChange={(e) => setSelectedLineItemId(e.target.value)}
              className="w-full bg-zinc-100 border border-zinc-300 text-black text-xs font-black rounded-none px-3 py-2 focus:outline-none cursor-pointer"
            >
              {yearData.lineItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={singleLineItemTrend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} fontWeight="bold" />
              <YAxis
                tickFormatter={(val) => `${formatCurrency(val)}`}
                stroke="#71717a"
                fontSize={12}
                fontWeight="bold"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
              <Bar dataKey="Actual" fill="#222934" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Budget" fill="#5F6B7A" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Last Year" fill="#B8C4CE" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
