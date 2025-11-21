import React, { useState } from 'react';
import { GenParams } from '../types';
import { generateParamsFromPrompt } from '../services/geminiService';
import { AspectRatio } from '../App';

interface ControlPanelProps {
  params: GenParams;
  setParams: (params: GenParams) => void;
  resolution: 'preview' | 'hd';
  setResolution: (res: 'preview' | 'hd') => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    params, 
    setParams, 
    resolution, 
    setResolution,
    aspectRatio,
    setAspectRatio
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (key: keyof GenParams, value: number | string) => {
    setParams({ ...params, [key]: value });
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const newParams = await generateParamsFromPrompt(prompt);
    if (newParams) {
      setParams(newParams);
    }
    setIsGenerating(false);
  };

  const randomize = () => {
    setParams({
      ...params,
      seed: Math.random() * 10000
    });
  };

  const ratios: { label: string, value: AspectRatio, icon: React.ReactNode }[] = [
      { 
          label: "1:1", 
          value: "1:1",
          icon: <div className="w-4 h-4 border-2 border-current rounded-sm"></div> 
      },
      { 
          label: "9:16", 
          value: "9:16",
          icon: <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
      },
      { 
          label: "16:9", 
          value: "16:9",
          icon: <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
      },
      { 
          label: "4:5", 
          value: "4:5",
          icon: <div className="w-3.5 h-4.5 border-2 border-current rounded-sm"></div>
      }
  ];

  return (
    <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col gap-8 text-slate-300 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700">
      
      {/* AI Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-xs">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
           AI Director
        </div>
        <div className="relative">
            <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a mood (e.g., 'banded agate layers' or 'blue liquid interference')"
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-3 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none h-24 text-xs leading-relaxed"
            />
            <button
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="absolute bottom-2 right-2 bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded disabled:opacity-50 transition-colors shadow-lg"
            >
            {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
            </button>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Format Section */}
      <div className="space-y-4">
         <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Canvas Format</div>
         <div className="grid grid-cols-4 gap-2">
            {ratios.map((r) => (
                <button
                    key={r.value}
                    onClick={() => setAspectRatio(r.value)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-all ${
                        aspectRatio === r.value 
                        ? 'bg-slate-800 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-950 border-transparent text-slate-500 hover:bg-slate-800'
                    }`}
                >
                    {r.icon}
                    <span className="text-[9px] font-bold">{r.label}</span>
                </button>
            ))}
         </div>
      </div>

      {/* Palette Section */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Chromatics</div>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <label>Base</label>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{params.baseColor}</span>
                <input type="color" value={params.baseColor} onChange={(e) => handleChange('baseColor', e.target.value)} className="bg-transparent border-none w-6 h-6 cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label>Mid</label>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{params.secondaryColor}</span>
                <input type="color" value={params.secondaryColor} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="bg-transparent border-none w-6 h-6 cursor-pointer" />
             </div>
          </div>
          <div className="flex items-center justify-between">
            <label>Highlight</label>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{params.accentColor}</span>
                <input type="color" value={params.accentColor} onChange={(e) => handleChange('accentColor', e.target.value)} className="bg-transparent border-none w-6 h-6 cursor-pointer" />
             </div>
          </div>
        </div>
      </div>

      {/* Physics Section */}
      <div className="space-y-6">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Fluid Physics</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Scale (Zoom)</label>
            <span className="text-cyan-400">{params.scale.toFixed(4)}</span>
          </div>
          <input 
            type="range" 
            min="0.0001" 
            max="0.02" 
            step="0.0001" 
            value={params.scale} 
            onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Distortion (Flow)</label>
            <span className="text-cyan-400">{params.distortion.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.1" 
            value={params.distortion} 
            onChange={(e) => handleChange('distortion', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Ripples (Phase)</label>
            <span className="text-cyan-400">{params.phase.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="20" 
            step="0.5" 
            value={params.phase} 
            onChange={(e) => handleChange('phase', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
           <div className="text-[10px] text-slate-500">Increases banding/layers.</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Complexity (Detail)</label>
            <span className="text-cyan-400">{params.detail}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="8" 
            step="1" 
            value={params.detail} 
            onChange={(e) => handleChange('detail', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Contrast</label>
            <span className="text-cyan-400">{params.contrast.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="3.0" 
            step="0.1" 
            value={params.contrast} 
            onChange={(e) => handleChange('contrast', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <label>Brightness</label>
            <span className="text-cyan-400">{params.brightness.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="-0.5" 
            max="0.5" 
            step="0.05" 
            value={params.brightness} 
            onChange={(e) => handleChange('brightness', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      <hr className="border-slate-800" />
      
      <div className="space-y-3 pb-6">
         <button 
          onClick={randomize}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-md transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-bold border border-slate-700"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            Reroll Pattern (Seed)
         </button>

         <div className="flex gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
                onClick={() => setResolution('preview')}
                className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${resolution === 'preview' ? 'bg-cyan-900/50 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Low Res
            </button>
            <button 
                onClick={() => setResolution('hd')}
                className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${resolution === 'hd' ? 'bg-cyan-900/50 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                2K Render
            </button>
         </div>
      </div>

    </div>
  );
};

export default ControlPanel;