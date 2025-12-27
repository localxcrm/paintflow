// Chat types for the separate chat feature

export interface Chat {
  id: string;
  workOrderId: string;
  organizationId: string;
  subcontractorId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCountCompany: number;
  unreadCountSubcontractor: number;
  createdAt: string;
  updatedAt: string;
  // Joined data (optional, populated by queries)
  workOrder?: {
    id: string;
    title: string;
    status: string;
    jobSite?: {
      address: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  subcontractor?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface ChatMessage {
  id: string;
  chatId: string;
  authorId: string | null;
  authorName: string;
  authorType: 'company' | 'subcontractor';
  text: string | null;
  type: 'text' | 'audio' | 'image' | 'video';
  mediaUrl: string | null;
  mediaPath: string | null;
  mediaDuration: number | null;
  mediaThumbnail: string | null;
  isRead: boolean;
  createdAt: string;
}

// Chat list item for displaying in the chat list
export interface ChatListItem extends Chat {
  workOrder: {
    id: string;
    title: string;
    status: string;
    jobSite?: {
      address: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  subcontractor?: {
    id: string;
    name: string;
    phone?: string;
  };
}

// Chat with messages for the chat view
export interface ChatWithMessages extends Chat {
  messages: ChatMessage[];
  workOrder: {
    id: string;
    title: string;
    status: string;
    jobSite?: {
      address: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  subcontractor?: {
    id: string;
    name: string;
    phone?: string;
  };
}

// API response types
export interface ChatListResponse {
  chats: ChatListItem[];
  totalUnread: number;
}

export interface ChatMessagesResponse {
  chat: ChatWithMessages;
  hasMore: boolean;
  nextCursor?: string;
}

// Message type labels (Portuguese)
export const MESSAGE_TYPE_LABELS: Record<ChatMessage['type'], string> = {
  text: 'Texto',
  audio: 'Áudio',
  image: 'Imagem',
  video: 'Vídeo',
};

// Message type icons
export const MESSAGE_TYPE_ICONS: Record<ChatMessage['type'], string> = {
  text: '💬',
  audio: '🎤',
  image: '📷',
  video: '🎥',
};
