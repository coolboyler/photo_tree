
import React, { useState, useRef } from 'react';
import { generateChristmasWish } from '../services/geminiService';
import { TreeConfig } from '../types';

interface UIOverlayProps {
  config: TreeConfig;
  setConfig: React.Dispatch<React.SetStateAction<TreeConfig>>;
  onAddPhotos: (urls: string[]) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ config, setConfig, onAddPhotos }) => {
  const [wish, setWish] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateWish = async () => {
    setLoading(true);
    const message = await generateChristmasWish();
    setWish(message);
    setLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      Array.from(files).forEach(file => {
        newUrls.push(URL.createObjectURL(file));
      });
      onAddPhotos(newUrls);
    }
  };

  const updateConfig = (key: keyof TreeConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex">
      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Content Area (Left/Center) for Wish */}
      <div className="flex-1 flex flex-col justify-end pb-12 px-8">
         {wish && (
           <div className="pointer-events-auto self-start mb-4 max-w-md animate-fade-in-up">
             <div className="bg-black/40 backdrop-blur-md border border-fuchsia-500/30 p-6 rounded-lg shadow-[0_0_15px_rgba(192,38,211,0.2)]">
                <p className="text-fuchsia-100 font-sans tracking-wide text-lg italic glow-text">
                  "{wish}"
                </p>
             </div>
           </div>
         )}
      </div>

      {/* Right Control Panel */}
      <div className="w-80 h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col pointer-events-auto overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="mb-8 mt-2">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 tracking-tighter">
            NEBULA <span className="font-light text-white">TREE</span>
          </h1>
          <div className="text-xs text-purple-300/60 tracking-widest mt-1 text-right">[HIDE]</div>
        </div>

        {/* Add Memories Section */}
        <div className="mb-8">
          <label className="text-xs font-bold text-amber-100/70 tracking-widest uppercase mb-3 block">
            Add Memories
          </label>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border border-dashed border-fuchsia-500/50 rounded-lg text-fuchsia-200/80 hover:bg-fuchsia-500/10 hover:border-fuchsia-400 transition-all text-sm font-medium tracking-wide flex items-center justify-center gap-2"
          >
            <span>+ Click to Upload Photos</span>
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-6 flex-1">
          <SliderControl 
            label="SCATTER" 
            value={config.scatter} 
            min={0} max={2} step={0.1}
            onChange={(v) => updateConfig('scatter', v)}
          />
          
          <SliderControl 
            label="GLOW STRENGTH" 
            value={config.glowStrength} 
            min={0.5} max={3} step={0.1}
            onChange={(v) => updateConfig('glowStrength', v)}
          />

          <SliderControl 
            label="ROTATION SPEED" 
            value={config.rotationSpeed} 
            min={0} max={1} step={0.05}
            onChange={(v) => updateConfig('rotationSpeed', v)}
          />

          <SliderControl 
            label="PHOTO BRIGHTNESS" 
            value={config.photoBrightness} 
            min={0.2} max={1.5} step={0.1}
            onChange={(v) => updateConfig('photoBrightness', v)}
          />

          <div className="pt-4 border-t border-white/10">
            <label className="text-xs font-bold text-amber-100/70 tracking-widest uppercase mb-4 block">
               Decoration Settings
            </label>
             <SliderControl 
                label="DECO BRIGHTNESS" 
                value={config.decoBrightness} 
                min={0.2} max={2.0} step={0.1}
                onChange={(v) => updateConfig('decoBrightness', v)}
            />
            <SliderControl 
                label="DECO SIZE" 
                value={config.decoSize} 
                min={0.1} max={2.0} step={0.1}
                onChange={(v) => updateConfig('decoSize', v)}
            />
          </div>
        </div>

        {/* Footer / AI Button */}
        <div className="mt-8 pt-6 border-t border-white/10">
            <button
                onClick={handleGenerateWish}
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-700 to-purple-800 hover:from-fuchsia-600 hover:to-purple-700 text-white py-3 rounded-full font-bold shadow-lg shadow-fuchsia-900/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="animate-pulse">AI Thinking...</span>
                ) : (
                    <>
                    <span>✨ Generate Caption</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">{label}</span>
            <span className="text-xs font-mono text-fuchsia-300">{value.toFixed(2)}</span>
        </div>
        <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 hover:accent-fuchsia-400"
        />
        {/* Custom thumb styles would usually go in CSS, utilizing standard accent-color here for simplicity */}
    </div>
);
