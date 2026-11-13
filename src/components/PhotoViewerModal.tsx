import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 4.0;
const DOUBLE_TAP_SCALE = 2.5;

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = 'Listing photo',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState<number>(MIN_SCALE);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Gesture Tracking Refs
  const touchStateRef = useRef<{
    isPinching: boolean;
    isPanning: boolean;
    initialDistance: number;
    initialScale: number;
    initialPan: { x: number; y: number };
    startTouchX: number;
    startTouchY: number;
    lastTapTime: number;
    swipeStartX: number;
    swipeStartY: number;
  }>({
    isPinching: false,
    isPanning: false,
    initialDistance: 0,
    initialScale: 1,
    initialPan: { x: 0, y: 0 },
    startTouchX: 0,
    startTouchY: 0,
    lastTapTime: 0,
    swipeStartX: 0,
    swipeStartY: 0,
  });

  // Mouse Drag Tracking
  const mouseStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
  });

  // Synchronize initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(MIN_SCALE);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setScale(MIN_SCALE);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  // Calculate pan boundaries based on current scale and dimensions
  const getPanBounds = useCallback((targetScale: number) => {
    if (targetScale <= MIN_SCALE || !containerRef.current || !imgRef.current) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const naturalW = imgRef.current.naturalWidth || containerRect.width;
    const naturalH = imgRef.current.naturalHeight || containerRect.height;

    // Calculate rendered base dimensions under object-contain
    const imgAspect = naturalW / naturalH;
    const containerAspect = containerRect.width / containerRect.height;

    let baseW = containerRect.width;
    let baseH = containerRect.height;

    if (imgAspect > containerAspect) {
      // Wide image: fits width, height is proportional
      baseW = containerRect.width;
      baseH = containerRect.width / imgAspect;
    } else {
      // Tall / portrait image: fits height, width is proportional
      baseH = containerRect.height;
      baseW = containerRect.height * imgAspect;
    }

    const scaledW = baseW * targetScale;
    const scaledH = baseH * targetScale;

    // Generous overflow margin allows dragging all corners/edges into clear view
    const extraMargin = 40;
    const maxPanX = Math.max(0, (scaledW - containerRect.width) / 2) + extraMargin;
    const maxPanY = Math.max(0, (scaledH - containerRect.height) / 2) + extraMargin;

    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
    };
  }, []);

  const clampPan = useCallback(
    (x: number, y: number, currentScale: number) => {
      if (currentScale <= MIN_SCALE) return { x: 0, y: 0 };
      const bounds = getPanBounds(currentScale);
      return {
        x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
        y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
      };
    },
    [getPanBounds]
  );

  const resetZoom = useCallback(() => {
    setScale(MIN_SCALE);
    setPan({ x: 0, y: 0 });
  }, []);

  // Double-tap or double-click to toggle zoom at location
  const handleDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (scale > 1.2) {
        // Zoom out to normal
        resetZoom();
      } else {
        // Zoom in to 2.5x centered on the tapped point
        const targetScale = DOUBLE_TAP_SCALE;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const offsetX = clientX - centerX;
          const offsetY = clientY - centerY;

          const rawPanX = -offsetX * (targetScale - 1);
          const rawPanY = -offsetY * (targetScale - 1);
          const clamped = clampPan(rawPanX, rawPanY, targetScale);

          setScale(targetScale);
          setPan(clamped);
        } else {
          setScale(targetScale);
          setPan({ x: 0, y: 0 });
        }
      }
    },
    [scale, clampPan, resetZoom]
  );

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    const state = touchStateRef.current;
    setIsInteracting(true);

    if (touches.length === 2) {
      // 2-Finger Pinch Zoom
      state.isPinching = true;
      state.isPanning = false;
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      state.initialDistance = dist;
      state.initialScale = scale;
      state.initialPan = { ...pan };
    } else if (touches.length === 1) {
      // 1-Finger Touch (Double tap detection or Drag when zoomed, Swipe when 1x)
      const now = Date.now();
      const timeSinceLast = now - state.lastTapTime;
      const t = touches[0];

      if (timeSinceLast < 300) {
        // Double tap confirmed!
        handleDoubleTap(t.clientX, t.clientY);
        state.lastTapTime = 0;
        return;
      }
      state.lastTapTime = now;

      state.isPinching = false;
      state.isPanning = scale > 1.05;
      state.startTouchX = t.clientX;
      state.startTouchY = t.clientY;
      state.swipeStartX = t.clientX;
      state.swipeStartY = t.clientY;
      state.initialPan = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touches = e.touches;
    const state = touchStateRef.current;

    if (touches.length === 2 && state.isPinching) {
      e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      if (state.initialDistance > 0) {
        const factor = dist / state.initialDistance;
        const nextScale = Math.min(Math.max(MIN_SCALE, state.initialScale * factor), MAX_SCALE);
        setScale(nextScale);
        // Adjust pan to stay within valid bounds
        setPan((prev) => clampPan(prev.x, prev.y, nextScale));
      }
    } else if (touches.length === 1 && scale > 1.05) {
      // Free drag in ALL directions (top, bottom, left, right)
      e.preventDefault();
      const deltaX = touches[0].clientX - state.startTouchX;
      const deltaY = touches[0].clientY - state.startTouchY;

      const rawX = state.initialPan.x + deltaX;
      const rawY = state.initialPan.y + deltaY;

      setPan(clampPan(rawX, rawY, scale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsInteracting(false);
    const state = touchStateRef.current;

    if (e.touches.length === 0) {
      state.isPinching = false;
      state.isPanning = false;

      // When scale is close to 1x, reset to 1x and center
      if (scale < 1.08) {
        resetZoom();
      } else {
        // Re-clamp pan bounds to ensure image never gets stuck
        setPan((prev) => clampPan(prev.x, prev.y, scale));
      }

      // If at 1x, check for horizontal swipe between images
      if (scale <= 1.05 && images.length > 1 && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - state.swipeStartX;
        const diffY = touch.clientY - state.swipeStartY;

        // Horizontal swipe detected
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0 && currentIndex < images.length - 1) {
            // Next photo
            setCurrentIndex((prev) => prev + 1);
          } else if (diffX > 0 && currentIndex > 0) {
            // Previous photo
            setCurrentIndex((prev) => prev - 1);
          }
        }
      }
    }
  };

  // Mouse wheel zoom support for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.003;
    const nextScale = Math.min(Math.max(MIN_SCALE, scale + zoomDelta), MAX_SCALE);

    if (nextScale <= MIN_SCALE + 0.05) {
      resetZoom();
    } else {
      setScale(nextScale);
      setPan((prev) => clampPan(prev.x, prev.y, nextScale));
    }
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1.05) {
      e.preventDefault();
      setIsInteracting(true);
      mouseStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...pan },
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStateRef.current.isDragging && scale > 1.05) {
      e.preventDefault();
      const deltaX = e.clientX - mouseStateRef.current.startX;
      const deltaY = e.clientY - mouseStateRef.current.startY;
      const rawX = mouseStateRef.current.startPan.x + deltaX;
      const rawY = mouseStateRef.current.startPan.y + deltaY;
      setPan(clampPan(rawX, rawY, scale));
    }
  };

  const handleMouseUp = () => {
    setIsInteracting(false);
    mouseStateRef.current.isDragging = false;
    setPan((prev) => clampPan(prev.x, prev.y, scale));
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || '';

  return (
    <div
      className="fixed inset-0 z-60 bg-white flex flex-col justify-between items-center select-none overflow-hidden touch-none"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar with Go Back < (Pure White Background) */}
      <header className="w-full shrink-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            resetZoom();
            onClose();
          }}
          aria-label="Go back"
          className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-blue-50 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <span className="font-extrabold text-sm text-gray-900 truncate max-w-[200px]">
          {title}
        </span>

        {/* Reset zoom button if zoomed */}
        {scale > 1.05 ? (
          <button
            type="button"
            onClick={resetZoom}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#2D8EDE] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>1x</span>
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Center Zoomable Image Viewport with 4-directional matrix pan */}
      <main
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center overflow-hidden bg-white p-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
      >
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isInteracting ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
          className={`flex items-center justify-center w-full h-full ${
            scale > 1.05 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
        >
          <img
            ref={imgRef}
            src={currentImage}
            alt={title}
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain select-none pointer-events-none drop-shadow-xs"
            draggable={false}
          />
        </div>
      </main>

      {/* Bottom Photo Count Bar (Pure White Background) */}
      <footer className="w-full shrink-0 pb-6 pt-3 px-4 flex items-center justify-center z-20 bg-white border-t border-gray-100">
        {/* Counter */}
        {images.length > 0 && (
          <div className="bg-gray-100 px-3.5 py-1 rounded-full text-gray-900 text-xs font-bold border border-gray-200 shadow-xs pointer-events-none">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </footer>
    </div>
  );
};
