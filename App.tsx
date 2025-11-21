import React, { useState } from 'react';
import CanvasDisplay from './components/CanvasDisplay';
import ControlPanel from './components/ControlPanel';
import { GenParams } from './types';

// Initial preset resembling the reference image (blue, liquid, smoky)
const initialParams: GenParams = {
  baseColor: '#0f172a', // Deep blue/slate
  secondaryColor: '#3b82f6', // Bright blue
  accentColor: '#bfdbfe', // Very light blue/white
  scale: 0.003,
  distortion: 4.5,
  detail: 4,
  phase: 5.0, // Start with some banding to show the effect
  contrast: 1.2,
  brightness: 0.0,
  seed: 12345
};

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '3:4';

function App() {
  const [params, setParams] = useState<GenParams>(initialParams);
  const [resolution, setResolution] = useState<'preview' | 'hd'>('preview');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-950 overflow-hidden">
      
      {/* Main Canvas Area */}
      <main className="flex-1 h-full relative p-4 lg:p-8 flex flex-col gap-4">
        <header className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold tracking-tighter text-white font-mono">AETHER<span className="text-cyan-500">LAB</span></h1>
                <p className="text-slate-500 text-xs font-mono mt-1">Procedural Fluid Synthesis Engine</p>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-[10px] text-slate-600 font-mono uppercase">Current Seed</div>
                <div className="text-xs text-slate-400 font-mono">{Math.floor(params.seed)}</div>
            </div>
        </header>
        
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <CanvasDisplay 
              params={params} 
              resolution={resolution} 
              aspectRatio={aspectRatio}
            />
        </div>
      </main>

      {/* Sidebar Controls */}
      <ControlPanel 
        params={params} 
        setParams={setParams} 
        resolution={resolution}
        setResolution={setResolution}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
      />
      
    </div>
  );
}

export default App;