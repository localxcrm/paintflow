'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Minimum pull distance to trigger refresh (default 80px)
  maxPull?: number; // Maximum pull distance (default 120px)
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  reset: () => void;
}

/**
 * Hook for implementing pull-to-refresh gesture
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance to make it feel natural
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, maxPull);
      setPullDistance(pull);
    }
  }, [isPulling, disabled, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, disabled]);

  const reset = useCallback(() => {
    setPullDistance(0);
    setIsRefreshing(false);
    setIsPulling(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    containerRef,
    reset,
  };
}

/**
 * Pull-to-refresh indicator component
 */
interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 pointer-events-none"
      style={{ transform: `translateY(${pullDistance - 40}px)` }}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent ${
          isRefreshing ? 'animate-spin' : ''
        }`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          opacity: Math.min(progress * 2, 1),
        }}
      />
    </div>
  );
}
