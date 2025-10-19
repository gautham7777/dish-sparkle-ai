import React, { useState, useRef, WheelEvent, MouseEvent, TouchEvent, useCallback } from 'react';

// --- Icon components for controls ---
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" /></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" /></svg>;
const ResetZoomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0 8.25 8.25 0 0 0 0-11.667l-3.182-3.182m0 0-3.182 3.182m3.182-3.182L6.34 6.34m11.667 11.667-3.182-3.182" /></svg>;

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_SENSITIVITY = 0.002;

interface ZoomableImageProps {
  src: string;
  alt: string;
}

const getDistance = (p1: React.Touch, p2: React.Touch) => Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startTouchDistance = useRef<number | null>(null);
  const startScale = useRef<number>(1);


  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  const updatePosition = (newX: number, newY: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const maxOffset = ((container.offsetWidth * scale) - container.offsetWidth) / 2 / scale;
    setPosition({
      x: clamp(newX, -maxOffset, maxOffset),
      y: clamp(newY, -maxOffset, maxOffset),
    });
  }
  
  const updateScale = (newScale: number) => {
    const clampedScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
    if (clampedScale <= MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
        setScale(MIN_SCALE);
    } else {
        setScale(clampedScale);
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newScale = scale - e.deltaY * ZOOM_SENSITIVITY;
    updateScale(newScale);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    isPanning.current = true;
    startPos.current = { x: e.clientX - position.x * scale, y: e.clientY - position.y * scale };
    if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const newX = (e.clientX - startPos.current.x) / scale;
    const newY = (e.clientY - startPos.current.y) / scale;
    updatePosition(newX, newY);
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    isPanning.current = false;
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
  };
  
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
        startTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
        startScale.current = scale;
        isPanning.current = false;
    } else if (e.touches.length === 1) {
        isPanning.current = true;
        startPos.current = { x: e.touches[0].clientX - position.x * scale, y: e.touches[0].clientY - position.y * scale };
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && startTouchDistance.current !== null) {
        const newDist = getDistance(e.touches[0], e.touches[1]);
        const newScale = startScale.current * (newDist / startTouchDistance.current);
        updateScale(newScale);
    } else if (e.touches.length === 1 && isPanning.current) {
        const newX = (e.touches[0].clientX - startPos.current.x) / scale;
        const newY = (e.touches[0].clientY - startPos.current.y) / scale;
        updatePosition(newX, newY);
    }
  };

  const handleTouchEnd = () => {
    isPanning.current = false;
    startTouchDistance.current = null;
  };

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-white/20 rounded-2xl cursor-grab select-none touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={src}
        alt={alt}
        className="object-contain w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          willChange: 'transform'
        }}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-full shadow-md p-1">
        <button onClick={() => updateScale(scale + 0.5)} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Zoom in"><ZoomInIcon/></button>
        <button onClick={() => updateScale(scale - 0.5)} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Zoom out"><ZoomOutIcon/></button>
        <button onClick={handleReset} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Reset zoom"><ResetZoomIcon/></button>
      </div>
    </div>
  );
};