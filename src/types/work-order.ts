// Work Order (Ordem de Serviço) Types

export interface WorkOrder {
  id: string;
  organizationId: string;
  jobId: string;

  // Identificação
  osNumber: string;           // OS-2024-0001
  publicToken: string;        // Token para link público

  // Status
  status: 'draft' | 'sent' | 'in_progress' | 'completed';

  // Datas
  scheduledDate: string | null;
  estimatedDuration: number | null;  // horas
  actualStartDate: string | null;
  actualEndDate: string | null;

  // Escopo por Cômodo
  rooms: WorkOrderRoom[];

  // Checklist Geral
  tasks: WorkOrderTask[];

  // Materiais
  materials: WorkOrderMaterial[];

  // Fotos e Comentários
  photos: WorkOrderPhoto[];
  comments: WorkOrderComment[];

  // Financeiro (do subcontratado)
  subcontractorPrice: number | null;

  // Dados do Job (preenchidos via join)
  job?: {
    jobNumber: string;
    clientName: string;
    address: string;
    city: string;
    state: string | null;
    zipCode: string | null;
    projectType: string;
    subcontractorId: string | null;
  };

  // Dados da Organização (preenchidos via API pública)
  organization?: {
    name: string;
    logo: string | null;
  };

  createdAt: string;
  updatedAt: string;
}

// Cômodo/Área
export interface WorkOrderRoom {
  id: string;
  name: string;              // "Sala de Estar", "Quarto 1"
  type: 'room' | 'area' | 'exterior';
  scope: string[];           // ["Paredes", "Teto", "Acabamento"]
  color?: string;            // Cor da tinta
  colorCode?: string;        // Código Sherwin Williams
  notes?: string;
  completed: boolean;
}

// Tarefa do Checklist
export interface WorkOrderTask {
  id: string;
  description: string;       // "Preparar superfícies"
  order: number;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

// Material
export interface WorkOrderMaterial {
  id: string;
  name: string;              // "Tinta Sherwin Williams"
  brand?: string;
  color?: string;
  colorCode?: string;
  quantity: number;
  unit: string;              // "galões", "latas"
  notes?: string;
  provided: boolean;         // Fornecido pelo cliente?
}

// Foto
export interface WorkOrderPhoto {
  id: string;
  url: string;
  path?: string;             // Path no Storage para deletar
  type: 'before' | 'progress' | 'after';
  roomId?: string;           // Foto de qual cômodo?
  caption?: string;
  uploadedAt: string;
  uploadedBy: 'company' | 'subcontractor';
}

// Comentário (com suporte a mídia)
export interface WorkOrderComment {
  id: string;
  text?: string;              // Texto opcional (pode ser só mídia)
  type: 'text' | 'audio' | 'image' | 'video';
  mediaUrl?: string;          // URL do arquivo no Supabase Storage
  mediaPath?: string;         // Path para deletar do Storage
  mediaDuration?: number;     // Duração do áudio/vídeo em segundos
  mediaThumbnail?: string;    // Thumbnail para vídeos
  author: string;
  authorType: 'company' | 'subcontractor';
  createdAt: string;
}

// Comment type labels
export const COMMENT_TYPE_LABELS: Record<WorkOrderComment['type'], string> = {
  text: 'Texto',
  audio: 'Áudio',
  image: 'Imagem',
  video: 'Vídeo',
};

// Status labels em português
export const WORK_ORDER_STATUS_LABELS: Record<WorkOrder['status'], string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

// Cores dos status
export const WORK_ORDER_STATUS_COLORS: Record<WorkOrder['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

// Room types em português
export const ROOM_TYPE_LABELS: Record<WorkOrderRoom['type'], string> = {
  room: 'Cômodo',
  area: 'Área',
  exterior: 'Exterior',
};

// Photo types em português
export const PHOTO_TYPE_LABELS: Record<WorkOrderPhoto['type'], string> = {
  before: 'Antes',
  progress: 'Durante',
  after: 'Depois',
};

// Default tasks for painting jobs
export const DEFAULT_PAINTING_TASKS: Omit<WorkOrderTask, 'id'>[] = [
  { description: 'Cobrir móveis e pisos', order: 1, completed: false },
  { description: 'Preparar superfícies', order: 2, completed: false },
  { description: 'Aplicar primer (se necessário)', order: 3, completed: false },
  { description: 'Primeira demão', order: 4, completed: false },
  { description: 'Segunda demão', order: 5, completed: false },
  { description: 'Retoques finais', order: 6, completed: false },
  { description: 'Limpeza do local', order: 7, completed: false },
];

// Common room presets
export const COMMON_ROOMS = [
  'Sala de Estar',
  'Sala de Jantar',
  'Cozinha',
  'Quarto Principal',
  'Quarto 1',
  'Quarto 2',
  'Quarto 3',
  'Banheiro Social',
  'Banheiro Suíte',
  'Lavabo',
  'Escritório',
  'Área de Serviço',
  'Varanda',
  'Garagem',
  'Fachada',
  'Muro',
];

// Common scope items
export const COMMON_SCOPE_ITEMS = [
  'Paredes',
  'Teto',
  'Rodapé',
  'Portas',
  'Janelas',
  'Acabamentos',
  'Armários',
];
