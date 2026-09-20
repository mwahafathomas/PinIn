import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  isRefreshing?: boolean;
}

const PULL_THRESHOLD = 55; // px to trigger refresh
const MAX_PULL_DISTANCE = 80; // max visual pull distance

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isRefreshing: externalIsRefreshing,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const isPointerDown = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedWheel = useRef<number>(0);

  const isRefreshing = externalIsRefreshing !== undefined ? externalIsRefreshing : internalRefreshing;

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setInternalRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setInternalRefreshing(false);
      setPullDistance(0);
      accumulatedWheel.current = 0;
    }
  }, [onRefresh, isRefreshing]);

  // Helper to check if scroll parent is at top
  const isAtTop = () => {
    const parent = containerRef.current?.closest('main') || containerRef.current?.parentElement;
    const parentScroll = parent?.scrollTop ?? window.scrollY ?? 0;
    return parentScroll <= 2;
  };

  // --- 1. TOUCH EVENTS (Mobile / Tablet) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (isAtTop()) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    } else {
      startY.current = null;
      isDragging.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startY.current === null || isRefreshing) return;
    if (!isAtTop()) {
      startY.current = null;
      isDragging.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const damping = 0.45;
      const distance = Math.min(diff * damping, MAX_PULL_DISTANCE);
      setPullDistance(distance);
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // --- 2. MOUSE / POINTER DRAG (Desktop Drag-to-Refresh) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isRefreshing || e.button !== 0) return; // Left click only
    if (isAtTop()) {
      startY.current = e.clientY;
      isPointerDown.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDown.current || startY.current === null || isRefreshing) return;
    if (!isAtTop()) {
      isPointerDown.current = false;
      startY.current = null;
      setPullDistance(0);
      return;
    }

    const diff = e.clientY - startY.current;
    if (diff > 0) {
      const damping = 0.4;
      const distance = Math.min(diff * damping, MAX_PULL_DISTANCE);
      setPullDistance(distance);
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    startY.current = null;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // --- 3. MOUSE WHEEL / TRACKPAD SCROLL-UP AT TOP OF PAGE ---
  useEffect(() => {
    const el = containerRef.current?.closest('main') || containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (isRefreshing) return;
      const parent = containerRef.current?.closest('main') || containerRef.current?.parentElement;
      const scrollTop = parent?.scrollTop ?? 0;

      // When at top and scrolling UP (negative deltaY)
      if (scrollTop <= 0 && e.deltaY < 0) {
        accumulatedWheel.current += Math.abs(e.deltaY) * 0.35;
        const currentDistance = Math.min(accumulatedWheel.current, MAX_PULL_DISTANCE);
        setPullDistance(currentDistance);

        if (wheelTimeout.current) {
          clearTimeout(wheelTimeout.current);
        }

        if (currentDistance >= PULL_THRESHOLD) {
          accumulatedWheel.current = 0;
          triggerRefresh();
        } else {
          // Reset if user stops scrolling
          wheelTimeout.current = setTimeout(() => {
            setPullDistance(0);
            accumulatedWheel.current = 0;
          }, 350);
        }
      } else if (scrollTop > 0) {
        accumulatedWheel.current = 0;
        setPullDistance(0);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    };
  }, [isRefreshing, triggerRefresh]);

  // Reset if external refreshing finishes
  useEffect(() => {
    if (!externalIsRefreshing && pullDistance > 0 && !isDragging.current && !isPointerDown.current) {
      setPullDistance(0);
    }
  }, [externalIsRefreshing, pullDistance]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isPastThreshold = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full min-h-full flex flex-col"
    >
      {/* Pull down & loading refresh indicator banner */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-200 ease-out select-none pointer-events-none shrink-0"
        style={{
          height: isRefreshing ? '52px' : `${pullDistance}px`,
          opacity: pullDistance > 6 || isRefreshing ? 1 : 0,
        }}
        aria-hidden={!pullDistance && !isRefreshing}
      >
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-200 shadow-md text-gray-700">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#0052FF]" />
              <span className="text-xs font-semibold text-gray-800">Refreshing feed...</span>
            </>
          ) : isPastThreshold ? (
            <>
              <div className="w-4 h-4 flex items-center justify-center text-[#0052FF]">
                <ArrowDown className="w-4 h-4 rotate-180 transition-transform" />
              </div>
              <span className="text-xs font-semibold text-[#0052FF]">Release to refresh</span>
            </>
          ) : (
            <>
              <div
                className="w-4 h-4 flex items-center justify-center text-gray-400 transition-transform"
                style={{ transform: `rotate(${progress * 180}deg)` }}
              >
                <ArrowDown className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-gray-500">Scroll to refresh</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col w-full transition-transform duration-150 ease-out"
        style={{
          transform: pullDistance > 0 && !isRefreshing ? `translateY(${pullDistance * 0.12}px)` : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
