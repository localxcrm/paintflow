// Room Type (Tipo de Cômodo) Types

export interface RoomType {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: 'room' | 'area' | 'exterior';
  defaultScope: string[];
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Type labels em português
export const ROOM_TYPE_TYPE_LABELS: Record<RoomType['type'], string> = {
  room: 'Cômodo',
  area: 'Área',
  exterior: 'Exterior',
};

// Default scope items
export const DEFAULT_SCOPE_OPTIONS = [
  'Paredes',
  'Teto',
  'Rodapé',
  'Portas',
  'Janelas',
  'Acabamentos',
  'Armários',
];
