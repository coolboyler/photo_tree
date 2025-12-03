
import React, { Suspense, useState } from 'react';
import { TreeScene } from './components/TreeScene';
import { UIOverlay } from './components/UIOverlay';
import { TreeConfig } from './types';

const Loader = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-50">
      <div className="text-2xl font-light animate-pulse tracking-widest text-fuchsia-400">LOADING NEBULA...</div>
    </div>
  );
};

const DEFAULT_CONFIG: TreeConfig = {
  scatter: 0,
  glowStrength: 1.5,
  rotationSpeed: 0.2,
  photoBrightness: 0.8,
  decoBrightness: 1.0,
  decoSize: 1.0,
};

// Default placeholder photos
const DEFAULT_PHOTOS = Array.from({ length: 35 }).map((_, i) => 
  `https://picsum.photos/400/500?random=${i + 100}`
);

function App() {
  const [config, setConfig] = useState<TreeConfig>(DEFAULT_CONFIG);
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);

  const handleAddPhotos = (newPhotos: string[]) => {
    setPhotos(prev => [...newPhotos, ...prev]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <Suspense fallback={<Loader />}>
        <TreeScene config={config} photos={photos} />
      </Suspense>
      <UIOverlay 
        config={config} 
        setConfig={setConfig} 
        onAddPhotos={handleAddPhotos} 
      />
    </div>
  );
}

export default App;
