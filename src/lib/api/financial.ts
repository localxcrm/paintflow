import type {
  SubcontractorFinancialsListResponse,
  SubcontractorFinancialDetailResponse,
} from '@/types/financial';

export async function fetchSubcontractorFinancials(): Promise<SubcontractorFinancialsListResponse> {
  const res = await fetch('/api/admin/subcontractor-financials');
  if (!res.ok) {
    throw new Error('Failed to fetch subcontractor financials');
  }
  return res.json();
}

export async function fetchSubcontractorFinancialDetail(
  id: string
): Promise<SubcontractorFinancialDetailResponse> {
  const res = await fetch(`/api/admin/subcontractor-financials/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch subcontractor financial detail');
  }
  return res.json();
}

export const financialApi = {
  fetchList: fetchSubcontractorFinancials,
  fetchDetail: fetchSubcontractorFinancialDetail,
};
