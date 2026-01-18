import { createServerSupabaseClient } from '@/lib/supabase-server';

export type ProfitFlag = 'OK' | 'RAISE_PRICE' | 'FIX_SCOPE';

export interface JobFinancials {
  subMaterials: number;
  subLabor: number;
  subTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  depositRequired: number;
  balanceDue: number;
  subcontractorPrice: number;
  meetsMinGp: boolean;
  meetsTargetGm: boolean;
  profitFlag: ProfitFlag;
}

export interface BusinessSettingsForCalculation {
  subPayoutPct?: number;
  subMaterialsPct?: number;
  subLaborPct?: number;
  minGrossProfitPerJob?: number;
  targetGrossMarginPct?: number;
  defaultDepositPct?: number;
}

/**
 * Calculate job financials based on business settings
 *
 * @param jobValue - The total job value
 * @param organizationId - The organization ID to fetch settings from
 * @param existingSupabase - Optional existing Supabase client to reuse
 * @returns Calculated job financials
 */
export async function calculateJobFinancials(
  jobValue: number,
  organizationId: string,
  existingSupabase?: ReturnType<typeof createServerSupabaseClient>
): Promise<JobFinancials> {
  const supabase = existingSupabase || createServerSupabaseClient();

  const { data: settings } = await supabase
    .from('BusinessSettings')
    .select('subPayoutPct, subMaterialsPct, subLaborPct, minGrossProfitPerJob, targetGrossMarginPct, defaultDepositPct')
    .eq('organizationId', organizationId)
    .limit(1)
    .single();

  return calculateJobFinancialsFromSettings(jobValue, settings);
}

/**
 * Calculate job financials from provided settings (no DB fetch)
 * Useful when settings are already available
 *
 * @param jobValue - The total job value
 * @param settings - Business settings for calculation
 * @returns Calculated job financials
 */
export function calculateJobFinancialsFromSettings(
  jobValue: number,
  settings: BusinessSettingsForCalculation | null
): JobFinancials {
  const subPayoutPct = settings?.subPayoutPct ?? 60;
  const subMaterialsPct = settings?.subMaterialsPct ?? 15;
  const subLaborPct = settings?.subLaborPct ?? 45;
  const minGrossProfit = settings?.minGrossProfitPerJob ?? 900;
  const targetGrossMargin = settings?.targetGrossMarginPct ?? 40;
  const defaultDepositPct = settings?.defaultDepositPct ?? 30;

  const subMaterials = jobValue * (subMaterialsPct / 100);
  const subLabor = jobValue * (subLaborPct / 100);
  const subTotal = subMaterials + subLabor;
  const grossProfit = jobValue - subTotal;
  const grossMarginPct = jobValue > 0 ? (grossProfit / jobValue) * 100 : 0;
  const depositRequired = jobValue * (defaultDepositPct / 100);
  const subcontractorPrice = jobValue * (subPayoutPct / 100);

  let profitFlag: ProfitFlag = 'OK';
  if (jobValue > 0) {
    if (grossProfit < minGrossProfit) {
      profitFlag = 'RAISE_PRICE';
    } else if (grossMarginPct < targetGrossMargin) {
      profitFlag = 'FIX_SCOPE';
    }
  }

  return {
    subMaterials,
    subLabor,
    subTotal,
    grossProfit,
    grossMarginPct,
    depositRequired,
    balanceDue: jobValue - depositRequired,
    subcontractorPrice,
    meetsMinGp: grossProfit >= minGrossProfit,
    meetsTargetGm: grossMarginPct >= targetGrossMargin,
    profitFlag,
  };
}

/**
 * Recalculate commission amounts based on job value and commission percentages
 *
 * @param jobValue - The total job value
 * @param salesCommissionPct - Sales commission percentage
 * @param pmCommissionPct - Project manager commission percentage
 * @returns Calculated commission amounts
 */
export function calculateCommissions(
  jobValue: number,
  salesCommissionPct: number,
  pmCommissionPct: number
): { salesCommissionAmount: number; pmCommissionAmount: number } {
  return {
    salesCommissionAmount: jobValue * (salesCommissionPct / 100),
    pmCommissionAmount: jobValue * (pmCommissionPct / 100),
  };
}
