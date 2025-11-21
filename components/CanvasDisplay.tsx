import React, { useRef, useEffect, useState } from 'react';
import { GenParams } from '../types';
import { seedNoise, pattern } from '../utils/noise';
import { AspectRatio } from '../App';

interface CanvasDisplayProps {
  params: GenParams;
  resolution: 'preview' | 'hd';
  aspectRatio: AspectRatio;
}

// Helper to convert hex to rgb
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Linear interpolation between two colors
const lerpColor = (c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}, t: number) => {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t
  };
};

const CanvasDisplay: React.FC<CanvasDisplayProps> = ({ params, resolution, aspectRatio }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Calculate dimensions based on resolution and aspect ratio
  const getDimensions = () => {
    // Base max dimension: 2048 for HD (2K), 600 for preview
    const maxDim = resolution === 'hd' ? 2048 : 600;
    
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;

    let width, height;

    if (ratio >= 1) {
        // Landscape or Square
        width = maxDim;
        height = Math.round(maxDim / ratio);
    } else {
        // Portrait
        height = maxDim;
        width = Math.round(maxDim * ratio);
    }

    return { width, height };
  };

  const { width, height } = getDimensions();

  useEffect(() => {
    const render = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsRendering(true);

        // Seed the noise engine
        seedNoise(Math.floor(params.seed));

        // Pre-calculate colors
        const c1 = hexToRgb(params.baseColor);
        const c2 = hexToRgb(params.secondaryColor);
        const c3 = hexToRgb(params.accentColor);

        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;

        // Use a time-slicing approach to avoid blocking UI completely for HD renders
        const chunkSize = 50; // rows per frame
        let y = 0;

        const processChunk = () => {
            const endY = Math.min(y + chunkSize, height);
            
            for (let row = y; row < endY; row++) {
                for (let x = 0; x < width; x++) {
                    // Normalized coordinates
                    // We scale differently based on aspect ratio to ensure the noise "zoom" feels consistent
                    // Taking the smaller dimension as the normalizer helps consistency
                    const minDim = Math.min(width, height);
                    
                    // Offset coordinates slightly so we aren't always in top-left corner of noise space
                    // The * 1000 is a convenience multiplier so the slider values are readable (0.001 vs 0.000001)
                    const nx = (x / minDim) * params.scale * 1000; 
                    const ny = (row / minDim) * params.scale * 1000;

                    // Calculate warping value
                    // pattern(x, y, scale, distortion, detail, phase, qx, qy)
                    // We pass 1.0 for scale here because we already applied scale to nx/ny
                    const v = pattern(nx, ny, 1.0, params.distortion, params.detail, params.phase, 0.0, 0.0);
                    
                    // Normalize v roughly from [-1, 1] to [0, 1]
                    let val = (v + 1.0) * 0.5;
                    
                    // Apply contrast/brightness
                    val = (val - 0.5) * params.contrast + 0.5 + params.brightness;
                    val = Math.max(0, Math.min(1, val)); // clamp

                    // Map value to color gradient
                    // 0.0 -> Base, 0.5 -> Secondary, 1.0 -> Accent
                    let finalColor;
                    if (val < 0.5) {
                        finalColor = lerpColor(c1, c2, val * 2.0);
                    } else {
                        finalColor = lerpColor(c2, c3, (val - 0.5) * 2.0);
                    }

                    const cell = (row * width + x) * 4;
                    data[cell] = finalColor.r;
                    data[cell + 1] = finalColor.g;
                    data[cell + 2] = finalColor.b;
                    data[cell + 3] = 255; // Alpha
                }
            }

            ctx.putImageData(imgData, 0, 0);
            y = endY;

            if (y < height) {
                // If unmounted/re-triggered, we should probably stop, but 
                // useRef check handles basic safety.
                requestAnimationFrame(processChunk);
            } else {
                setIsRendering(false);
            }
        };

        requestAnimationFrame(processChunk);
    };

    // Debounce slightly to prevent rapid firing if props change fast
    const timer = setTimeout(() => {
        render();
    }, 50);

    return () => clearTimeout(timer);

  }, [params, width, height]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `aether-lab-${params.seed.toFixed(0)}-${aspectRatio.replace(':','x')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="relative group flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden shadow-2xl border border-slate-800 max-w-full max-h-full p-2">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            aspectRatio: aspectRatio.replace(':', '/')
        }}
        className="object-contain shadow-lg"
      />
      
      {isRendering && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
             <span className="text-cyan-400 font-mono text-sm">Rendering {resolution.toUpperCase()}...</span>
             <span className="text-slate-500 text-[10px] font-mono">{width}x{height}px</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button 
            onClick={downloadImage}
            disabled={isRendering}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-md shadow-lg font-mono text-xs flex items-center gap-2 border border-slate-600"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download {resolution === 'hd' ? 'HD' : 'Preview'}
        </button>
      </div>
    </div>
  );
};

export default CanvasDisplay;