export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  password?: string;
}

export interface LineItem {
  id: string;
  categoryId: string;
  name: string;
  isSubtotal?: boolean;
  isGroupTotal?: boolean;
  isGrandTotal?: boolean;
}

export interface Category {
  id: string;
  name: string;
  subtotalLabel: string;
  groupTotalLabel?: string;
}

export interface MonthLineValue {
  actual: number;
  budget: number;
  lastYear: number;
}

// Map of lineItemId -> MonthLineValue
export interface SingleMonthData {
  monthIndex: number; // 0 = Jan, 11 = Dec
  revenueBaseline?: number;
  items: Record<string, MonthLineValue>;
}

export interface YearData {
  year: number;
  departmentName: string;
  categories: Category[];
  lineItems: LineItem[];
  months: SingleMonthData[]; // 12 months
}

export interface ComputedLineSummary {
  lineItemId: string;
  name: string;
  categoryId: string;
  // Selected month values
  monthActual: number;
  monthActualPct: number;
  monthBudget: number;
  monthBudgetPct: number;
  monthLastYear: number;
  monthLastYearPct: number;
  // YTD values
  ytdActual: number;
  ytdActualPct: number;
  ytdBudget: number;
  ytdBudgetPct: number;
  ytdLastYear: number;
  ytdLastYearPct: number;
  // Variances
  ytdBudgetVariance: number; // Actual - Budget
  ytdBudgetVariancePct: number; // (Actual - Budget) / Budget
  ytdYoYVariance: number; // Actual - LastYear
  ytdYoYVariancePct: number;
}

export interface ComputedCategorySummary {
  categoryId: string;
  name: string;
  monthActual: number;
  monthBudget: number;
  monthLastYear: number;
  ytdActual: number;
  ytdBudget: number;
  ytdLastYear: number;
  ytdBudgetVariance: number;
}

export interface ComputedReportSummary {
  selectedMonthIndex: number;
  ytdThroughMonthIndex: number; // e.g. 6 = July (Jan-July inclusive)
  monthRevenueBaseline: number;
  ytdRevenueBaseline: number;
  // Grand totals
  monthTotalActual: number;
  monthTotalBudget: number;
  monthTotalLastYear: number;
  ytdTotalActual: number;
  ytdTotalBudget: number;
  ytdTotalLastYear: number;
  // Computed categories
  categorySummaries: Record<string, ComputedCategorySummary>;
  lineSummaries: Record<string, ComputedLineSummary>;
}

export type ViewMode = 'table' | 'visualizations' | 'reports' | 'data-entry' | 'insights';

export type DateRangePreset = 
  | 'ytd' 
  | 'full_year' 
  | 'q1' 
  | 'q2' 
  | 'q3' 
  | 'q4' 
  | 'last_3_months' 
  | 'last_6_months' 
  | 'custom';

export type ChartTypeOption = 'bar' | 'stacked_bar' | 'line' | 'pie' | 'area' | 'table';

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole | string;
  action: string;
  details: string;
  category: 'finance' | 'users' | 'system' | 'auth';
}

export interface CustomReportConfig {
  reportTitle: string;
  dateRangePreset: DateRangePreset;
  startMonthIndex: number; // 0..11
  endMonthIndex: number;   // 0..11
  selectedCategoryIds: string[]; // empty means all
  selectedLineItemIds: string[]; // empty means all
  chartType: ChartTypeOption;
  showBudgetComparison: boolean;
  showLastYearComparison: boolean;
  showVariancePercent: boolean;
  groupBy: 'category' | 'lineItem' | 'month';
}
