import { Category, LineItem, SingleMonthData, YearData } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_salaries',
    name: 'Salaries, Wages, Service Charge & Bonus',
    subtotalLabel: 'Total Salaries, Wages, Service Charge & Bonus',
  },
  {
    id: 'cat_payroll',
    name: 'Payroll-Related Expenses',
    subtotalLabel: 'Total Payroll-Related Expenses',
    groupTotalLabel: 'Total Labor Costs and Related Expenses',
  },
  {
    id: 'cat_services',
    name: 'Cost of Services',
    subtotalLabel: 'Total Cost of Services',
  },
  {
    id: 'cat_systems',
    name: 'System Expenses',
    subtotalLabel: 'Total System Expenses',
  },
  {
    id: 'cat_other',
    name: 'Other Expenses',
    subtotalLabel: 'Total Other Expenses',
  },
];

export const DEFAULT_LINE_ITEMS: LineItem[] = [
  // Salaries, Wages, Service Charge & Bonus
  { id: 'item_salaries_wages', categoryId: 'cat_salaries', name: 'Salaries & Wages' },
  { id: 'item_service_charge', categoryId: 'cat_salaries', name: 'Service Charge Distribution' },
  { id: 'item_bonus_incentive', categoryId: 'cat_salaries', name: 'Bonus & Incentive' },
  { id: 'item_contracted_labor', categoryId: 'cat_salaries', name: 'Contracted, Leased and Outsourced Labour' },

  // Payroll-Related Expenses
  { id: 'item_payroll_taxes', categoryId: 'cat_payroll', name: 'Payroll Taxes' },
  { id: 'item_supplemental_pay', categoryId: 'cat_payroll', name: 'Supplemental Pay' },
  { id: 'item_employee_benefits', categoryId: 'cat_payroll', name: 'Employee Benefits' },

  // Cost of Services
  { id: 'item_cost_cellphones', categoryId: 'cat_services', name: 'Cost of Cell Phones' },
  { id: 'item_cost_internet', categoryId: 'cat_services', name: 'Cost of Internet Services' },
  { id: 'item_cost_local_calls', categoryId: 'cat_services', name: 'Cost of Local Calls' },
  { id: 'item_cost_long_distance', categoryId: 'cat_services', name: 'Cost of Long Distance Calls' },
  { id: 'item_cost_media_ent', categoryId: 'cat_services', name: 'Cost of Complimentary In-Rooms/ Media Entertainment' },
  { id: 'item_cost_other_services', categoryId: 'cat_services', name: 'Other Cost of Services' },

  // System Expenses
  { id: 'item_sys_admin', categoryId: 'cat_systems', name: 'Administrative Systems - Finance/HR/Security/Parking' },
  { id: 'item_sys_centralized', categoryId: 'cat_systems', name: 'Centralized Information System Charges' },
  { id: 'item_sys_fb_pos', categoryId: 'cat_systems', name: 'Food and Beverage - Reservation & POS' },
  { id: 'item_sys_hardware', categoryId: 'cat_systems', name: 'Hardware' },
  { id: 'item_sys_health_spa', categoryId: 'cat_systems', name: 'Health Club/Spa' },
  { id: 'item_sys_info_sec', categoryId: 'cat_systems', name: 'Information Security & Systems' },
  { id: 'item_sys_property_ops', categoryId: 'cat_systems', name: 'Property Operation, Maintenance & Energy Management' },
  { id: 'item_sys_rooms_res', categoryId: 'cat_systems', name: 'Rooms & Reservations' },
  { id: 'item_sys_sales_mktg', categoryId: 'cat_systems', name: 'Sales, Marketing & Revenue Management' },
  { id: 'item_sys_telecom', categoryId: 'cat_systems', name: 'Telecommunications' },
  { id: 'item_sys_other', categoryId: 'cat_systems', name: 'Other Systems' },

  // Other Expenses
  { id: 'item_oth_cluster_office', categoryId: 'cat_other', name: 'Cluster Services/Corporate Office Reimbursables' },
  { id: 'item_oth_contract_services', categoryId: 'cat_other', name: 'Contract Services' },
  { id: 'item_oth_dues_sub', categoryId: 'cat_other', name: 'Dues and Subscriptions' },
  { id: 'item_oth_equip_rental', categoryId: 'cat_other', name: 'Equipment Rental' },
  { id: 'item_oth_computer_leasing', categoryId: 'cat_other', name: 'Computer Leasing' },
  { id: 'item_oth_operating_supplies', categoryId: 'cat_other', name: 'Operating Supplies' },
  { id: 'item_oth_other_equipment', categoryId: 'cat_other', name: 'Other Equipment' },
  { id: 'item_oth_sys_storage', categoryId: 'cat_other', name: 'System Storage and Optimization' },
  { id: 'item_oth_training', categoryId: 'cat_other', name: 'Training' },
  { id: 'item_oth_travel', categoryId: 'cat_other', name: 'Travel' },
  { id: 'item_oth_uniform', categoryId: 'cat_other', name: 'Uniform Laundry & Other Costs' },
  { id: 'item_oth_brand_operator', categoryId: 'cat_other', name: 'Brand/Operator Costs' },
  { id: 'item_oth_other_it', categoryId: 'cat_other', name: 'Other IT Expenses' },
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Target July values matching screenshot
const JULY_DATA: Record<string, { actual: number; budget: number; lastYear: number }> = {
  item_salaries_wages: { actual: 3427, budget: 2932, lastYear: 2600 },
  item_service_charge: { actual: 1151, budget: 1701, lastYear: 1277 },
  item_bonus_incentive: { actual: 1113, budget: 678, lastYear: 308 },
  item_contracted_labor: { actual: 0, budget: 0, lastYear: 0 },

  item_payroll_taxes: { actual: 0, budget: 80, lastYear: 0 },
  item_supplemental_pay: { actual: 89, budget: 42, lastYear: 154 },
  item_employee_benefits: { actual: 787, budget: 1953, lastYear: 676 },

  item_cost_cellphones: { actual: 0, budget: 0, lastYear: 0 },
  item_cost_internet: { actual: 23091, budget: 30450, lastYear: 22851 },
  item_cost_local_calls: { actual: 2496, budget: 3998, lastYear: 2883 },
  item_cost_long_distance: { actual: 0, budget: 0, lastYear: 0 },
  item_cost_media_ent: { actual: 6720, budget: 7331, lastYear: 6813 },
  item_cost_other_services: { actual: 0, budget: 0, lastYear: 0 },

  item_sys_admin: { actual: 1174, budget: 2392, lastYear: 0 },
  item_sys_centralized: { actual: 3023, budget: 3713, lastYear: 3069 },
  item_sys_fb_pos: { actual: 745, budget: 1403, lastYear: 0 },
  item_sys_hardware: { actual: 0, budget: 1000, lastYear: 0 },
  item_sys_health_spa: { actual: 0, budget: 233, lastYear: 0 },
  item_sys_info_sec: { actual: 0, budget: 0, lastYear: 0 },
  item_sys_property_ops: { actual: 2242, budget: 1250, lastYear: 0 },
  item_sys_rooms_res: { actual: 0, budget: 1478, lastYear: 1508 },
  item_sys_sales_mktg: { actual: 0, budget: 133, lastYear: 0 },
  item_sys_telecom: { actual: 0, budget: 0, lastYear: 0 },
  item_sys_other: { actual: 533, budget: 658, lastYear: 247 },

  item_oth_cluster_office: { actual: 0, budget: 1278, lastYear: 0 },
  item_oth_contract_services: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_dues_sub: { actual: 12971, budget: 2098, lastYear: 4968 },
  item_oth_equip_rental: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_computer_leasing: { actual: 5, budget: 100, lastYear: 24 },
  item_oth_operating_supplies: { actual: 0, budget: 200, lastYear: 0 },
  item_oth_other_equipment: { actual: 455, budget: 500, lastYear: 228 },
  item_oth_sys_storage: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_training: { actual: 63, budget: 150, lastYear: 59 },
  item_oth_travel: { actual: 284, budget: 500, lastYear: 900 },
  item_oth_uniform: { actual: 5, budget: 30, lastYear: 1 },
  item_oth_brand_operator: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_other_it: { actual: 40, budget: 500, lastYear: 791 },
};

// Target YTD (Jan-July) totals matching screenshot exactly
const YTD_JULY_TARGET: Record<string, { actual: number; budget: number; lastYear: number }> = {
  item_salaries_wages: { actual: 23989, budget: 20521, lastYear: 17546 },
  item_service_charge: { actual: 13404, budget: 16355, lastYear: 13054 },
  item_bonus_incentive: { actual: 6501, budget: 4743, lastYear: 2274 },
  item_contracted_labor: { actual: 0, budget: 0, lastYear: 0 },

  item_payroll_taxes: { actual: 0, budget: 560, lastYear: 122 },
  item_supplemental_pay: { actual: 247, budget: 292, lastYear: 1751 },
  item_employee_benefits: { actual: 7131, budget: 13669, lastYear: 5132 },

  item_cost_cellphones: { actual: 0, budget: 0, lastYear: 0 },
  item_cost_internet: { actual: 168196, budget: 213150, lastYear: 164026 },
  item_cost_local_calls: { actual: 18416, budget: 27984, lastYear: 18233 },
  item_cost_long_distance: { actual: 0, budget: 0, lastYear: 0 },
  item_cost_media_ent: { actual: 47375, budget: 51319, lastYear: 47697 },
  item_cost_other_services: { actual: 0, budget: 0, lastYear: 0 },

  item_sys_admin: { actual: 11396, budget: 16742, lastYear: 4500 },
  item_sys_centralized: { actual: 24155, budget: 25990, lastYear: 14950 },
  item_sys_fb_pos: { actual: 13727, budget: 9818, lastYear: 1506 },
  item_sys_hardware: { actual: 4855, budget: 7000, lastYear: 0 },
  item_sys_health_spa: { actual: 400, budget: 1633, lastYear: 0 },
  item_sys_info_sec: { actual: 0, budget: 0, lastYear: 0 },
  item_sys_property_ops: { actual: 11473, budget: 8750, lastYear: 0 },
  item_sys_rooms_res: { actual: 7932, budget: 10348, lastYear: 18218 },
  item_sys_sales_mktg: { actual: 200, budget: 933, lastYear: 0 },
  item_sys_telecom: { actual: 0, budget: 0, lastYear: 0 },
  item_sys_other: { actual: 5678, budget: 4608, lastYear: 247 },

  item_oth_cluster_office: { actual: 1307, budget: 8948, lastYear: 0 },
  item_oth_contract_services: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_dues_sub: { actual: 32526, budget: 14686, lastYear: 30476 },
  item_oth_equip_rental: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_computer_leasing: { actual: 460, budget: 700, lastYear: 310 },
  item_oth_operating_supplies: { actual: 0, budget: 1400, lastYear: 0 },
  item_oth_other_equipment: { actual: 3897, budget: 3500, lastYear: 3272 },
  item_oth_sys_storage: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_training: { actual: 441, budget: 1050, lastYear: 402 },
  item_oth_travel: { actual: 825, budget: 3500, lastYear: 4616 },
  item_oth_uniform: { actual: 103, budget: 210, lastYear: 28 },
  item_oth_brand_operator: { actual: 0, budget: 0, lastYear: 0 },
  item_oth_other_it: { actual: 40, budget: 3500, lastYear: 4145 },
};

function generateInitialMonths(): SingleMonthData[] {
  const months: SingleMonthData[] = [];

  // Monthly revenue baseline estimate (around 1.55M/mo in Actual, 2.22M/mo in Budget)
  const monthlyRevenueBase = [
    1520000, 1480000, 1610000, 1580000, 1650000, 1590000, 1549051, 1600000, 1620000, 1680000,
    1720000, 1800000,
  ];

  for (let m = 0; m < 12; m++) {
    const items: Record<string, { actual: number; budget: number; lastYear: number }> = {};

    DEFAULT_LINE_ITEMS.forEach((item) => {
      const jul = JULY_DATA[item.id] || { actual: 0, budget: 0, lastYear: 0 };
      const ytd = YTD_JULY_TARGET[item.id] || { actual: 0, budget: 0, lastYear: 0 };

      if (m === 6) {
        // Month 6 = July
        items[item.id] = { ...jul };
      } else if (m < 6) {
        // Months Jan - June (m = 0..5): Distribute (ytd - July) across Jan-June
        const remainingActual = ytd.actual - jul.actual;
        const remainingBudget = ytd.budget - jul.budget;
        const remainingLastYear = ytd.lastYear - jul.lastYear;

        // Smooth distribution with slight seasonal variation factor
        const factor = 1 / 6;
        const variance = (m % 2 === 0 ? 1.05 : 0.95);

        // Make integer sums match exact remaining remainder on June (m=5)
        if (m === 5) {
          // Calculate sum of m = 0..4
          let sumA = 0, sumB = 0, sumL = 0;
          for (let prev = 0; prev < 5; prev++) {
            const prevFactor = 1 / 6;
            const prevVar = (prev % 2 === 0 ? 1.05 : 0.95);
            sumA += Math.round(remainingActual * prevFactor * prevVar);
            sumB += Math.round(remainingBudget * prevFactor * prevVar);
            sumL += Math.round(remainingLastYear * prevFactor * prevVar);
          }
          items[item.id] = {
            actual: Math.max(0, remainingActual - sumA),
            budget: Math.max(0, remainingBudget - sumB),
            lastYear: Math.max(0, remainingLastYear - sumL),
          };
        } else {
          items[item.id] = {
            actual: Math.max(0, Math.round(remainingActual * factor * variance)),
            budget: Math.max(0, Math.round(remainingBudget * factor * variance)),
            lastYear: Math.max(0, Math.round(remainingLastYear * factor * variance)),
          };
        }
      } else {
        // Months Aug - Dec (m = 7..11): Project based on July budget
        items[item.id] = {
          actual: 0, // Not yet entered
          budget: Math.round(jul.budget * (1 + (m - 6) * 0.01)),
          lastYear: Math.round(jul.lastYear * (1 + (m - 6) * 0.02)),
        };
      }
    });

    months.push({
      monthIndex: m,
      revenueBaseline: monthlyRevenueBase[m],
      items,
    });
  }

  return months;
}

export function createZeroedYearData(
  departmentName: string = 'Information & Telecommunication Systems',
  year: number = 2026,
  categories: Category[] = DEFAULT_CATEGORIES,
  lineItems: LineItem[] = DEFAULT_LINE_ITEMS,
  carryOverLastYearData?: SingleMonthData[]
): YearData {
  const months: SingleMonthData[] = [];
  for (let m = 0; m < 12; m++) {
    const items: Record<string, { actual: number; budget: number; lastYear: number }> = {};
    lineItems.forEach((item) => {
      let lastYearVal = 0;
      if (carryOverLastYearData && carryOverLastYearData[m] && carryOverLastYearData[m].items[item.id]) {
        // Use previous year's actual as the new year's lastYear figure
        lastYearVal = carryOverLastYearData[m].items[item.id].actual || 0;
      }
      items[item.id] = { actual: 0, budget: 0, lastYear: lastYearVal };
    });
    months.push({
      monthIndex: m,
      revenueBaseline: 0,
      items,
    });
  }
  return {
    year,
    departmentName,
    categories,
    lineItems,
    months,
  };
}

export const INITIAL_YEAR_DATA: YearData = createZeroedYearData();

