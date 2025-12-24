/**
 * Constants for PaintPro application
 */

// US States for address forms
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington D.C.' },
] as const;

export type USState = (typeof US_STATES)[number]['value'];

// ===========================================
// Job Status Labels (PT-BR)
// ===========================================
export const JOB_STATUS_LABELS = {
  lead: 'Lead',
  got_the_job: 'Fechado',
  scheduled: 'Agendado',
  completed: 'Concluído',
} as const;

export type JobStatus = keyof typeof JOB_STATUS_LABELS;

// ===========================================
// Project Type Labels (PT-BR)
// ===========================================
export const PROJECT_TYPE_LABELS = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Ambos',
} as const;

export type ProjectType = keyof typeof PROJECT_TYPE_LABELS;

// ===========================================
// Payment Method Labels (PT-BR)
// ===========================================
export const PAYMENT_METHOD_LABELS = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  check: 'Cheque',
  bank_transfer: 'Transferência Bancária',
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD_LABELS;

// ===========================================
// Payment Type Labels (PT-BR)
// ===========================================
export const PAYMENT_TYPE_LABELS = {
  deposit: 'Entrada',
  final_payment: 'Pagamento Final',
  sales_commission: 'Comissão de Vendas',
  pm_commission: 'Comissão do Gerente',
  subcontractor: 'Pagamento Subcontratado',
} as const;

export type PaymentType = keyof typeof PAYMENT_TYPE_LABELS;

// ===========================================
// Lead Status Labels (PT-BR)
// ===========================================
export const LEAD_STATUS_LABELS = {
  new: 'Novo',
  contacted: 'Contactado',
  estimate_scheduled: 'Orçamento Agendado',
  estimated: 'Orçado',
  proposal_sent: 'Proposta Enviada',
  follow_up: 'Follow-up',
  won: 'Ganho',
  lost: 'Perdido',
} as const;

export type LeadStatus = keyof typeof LEAD_STATUS_LABELS;

// ===========================================
// Profit Flag Labels (PT-BR)
// ===========================================
export const PROFIT_FLAG_LABELS = {
  OK: 'OK',
  RAISE_PRICE: 'Aumentar Preço',
  FIX_SCOPE: 'Ajustar Escopo',
} as const;

export type ProfitFlag = keyof typeof PROFIT_FLAG_LABELS;

// ===========================================
// Team Member Role Labels (PT-BR)
// ===========================================
export const TEAM_ROLE_LABELS = {
  sales: 'Vendas',
  pm: 'Gerente de Projeto',
  both: 'Vendas e Gerente',
} as const;

export type TeamRole = keyof typeof TEAM_ROLE_LABELS;

// ===========================================
// Rock Status Labels (PT-BR)
// ===========================================
export const ROCK_STATUS_LABELS = {
  on_track: 'No Caminho',
  off_track: 'Atrasado',
  complete: 'Completo',
  dropped: 'Cancelado',
} as const;

export type RockStatus = keyof typeof ROCK_STATUS_LABELS;
