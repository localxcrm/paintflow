'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkOrderComment } from '@/types/work-order';

// Key format: unread_lastRead_{workOrderId}_{userType}
const getStorageKey = (workOrderId: string, userType: 'admin' | 'subcontractor') =>
  `unread_lastRead_${workOrderId}_${userType}`;

/**
 * Hook to track unread messages in work order chat
 * Uses localStorage to persist the last read message timestamp
 */
export function useUnreadMessages(
  workOrderId: string | undefined,
  comments: WorkOrderComment[] | undefined,
  userType: 'admin' | 'subcontractor'
) {
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load last read timestamp from localStorage
  useEffect(() => {
    if (!workOrderId) return;

    const stored = localStorage.getItem(getStorageKey(workOrderId, userType));
    setLastReadTimestamp(stored);
  }, [workOrderId, userType]);

  // Calculate unread count
  useEffect(() => {
    if (!comments || comments.length === 0) {
      setUnreadCount(0);
      return;
    }

    // Filter messages from the OTHER party (not our own messages)
    const otherPartyType = userType === 'admin' ? 'subcontractor' : 'company';
    const otherPartyMessages = comments.filter((c: any) => c.authorType === otherPartyType);

    if (otherPartyMessages.length === 0) {
      setUnreadCount(0);
      return;
    }

    // If no last read timestamp, all other party messages are unread
    if (!lastReadTimestamp) {
      setUnreadCount(otherPartyMessages.length);
      return;
    }

    // Count messages newer than last read
    const unread = otherPartyMessages.filter(
      c => new Date(c.createdAt) > new Date(lastReadTimestamp)
    );
    setUnreadCount(unread.length);
  }, [comments, lastReadTimestamp, userType]);

  // Mark all messages as read
  const markAsRead = useCallback(() => {
    if (!workOrderId || !comments || comments.length === 0) return;

    const latestMessage = comments[comments.length - 1];
    const timestamp = latestMessage.createdAt;

    localStorage.setItem(getStorageKey(workOrderId, userType), timestamp);
    setLastReadTimestamp(timestamp);
    setUnreadCount(0);
  }, [workOrderId, comments, userType]);

  // Check if there are any unread messages
  const hasUnread = unreadCount > 0;

  return {
    unreadCount,
    hasUnread,
    markAsRead,
    lastReadTimestamp,
  };
}

/**
 * Get unread count for a specific work order (static function for use outside React)
 */
export function getUnreadCount(
  workOrderId: string,
  comments: WorkOrderComment[],
  userType: 'admin' | 'subcontractor'
): number {
  if (!comments || comments.length === 0) return 0;

  const stored = localStorage.getItem(getStorageKey(workOrderId, userType));
  const otherPartyType = userType === 'admin' ? 'subcontractor' : 'company';
  const otherPartyMessages = comments.filter((c: any) => c.authorType === otherPartyType);

  if (otherPartyMessages.length === 0) return 0;
  if (!stored) return otherPartyMessages.length;

  return otherPartyMessages.filter(
    c => new Date(c.createdAt) > new Date(stored)
  ).length;
}
