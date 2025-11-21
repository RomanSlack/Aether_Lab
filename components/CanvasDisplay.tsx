import React, { useRef, useEffect, useState } from 'react';
import { GenParams } from '../types';
import { seedNoise, pattern } from '../utils/noise';

interface CanvasDisplayProps {
  params: GenParams;
  resolution: 'preview' | 'hd';
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

const CanvasDisplay: React.FC<CanvasDisplayProps> = ({ params, resolution }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Dimensions based on resolution
  const width = resolution === 'hd' ? 1920 : 600;
  const height = resolution === 'hd' ? 1920 : 600; // Square for art

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
                    // Use params.scale effectively
                    // 0.005 is a good baseline.
                    const nx = x * params.scale;
                    const ny = row * params.scale;

                    // Get noise value (0 to 1 approx, pattern returns -1 to 1? check utils)
                    // The pattern function in utils uses fbm which is roughly -1 to 1 depending on settings, 
                    // but our recursive pattern might drift. We normalize manually.
                    
                    // To vary the pattern significantly, we offset by seed
                    // But seed is used in `seedNoise`.
                    
                    // Calculate warping value
                    const v = pattern(nx, ny, 1.0, params.distortion, 0.0, 0.0);
                    
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
                requestAnimationFrame(processChunk);
            } else {
                setIsRendering(false);
            }
        };

        requestAnimationFrame(processChunk);
    };

    render();

  }, [params, width, height]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `aether-lab-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="relative group w-full h-full flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden shadow-2xl border border-slate-800">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="w-full h-full object-contain max-h-[70vh]"
      />
      
      {isRendering && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
             <span className="text-cyan-400 font-mono text-sm">Rendering {resolution.toUpperCase()}...</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={downloadImage}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md shadow-lg font-mono text-xs flex items-center gap-2 border border-slate-600"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PNG
        </button>
      </div>
    </div>
  );
};

export default CanvasDisplay;
