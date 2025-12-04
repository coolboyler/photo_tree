
import React, { Suspense, useState, useEffect } from 'react';
import { TreeScene } from './components/TreeScene';
import { UIOverlay } from './components/UIOverlay';
import { TreeConfig } from './types';
import { getAllPhotos } from './services/localStorageService';

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

// Default placeholder photos (使用CORS友好的占位图)
const DEFAULT_PHOTOS = Array.from({ length: 35 }).map((_, i) =>
  `https://placehold.co/400x500/1a1a1a/ffffff?text=Photo+${i + 1}`
);

function App() {
  const [config, setConfig] = useState<TreeConfig>(DEFAULT_CONFIG);
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [loading, setLoading] = useState(false);

  // 从Supabase加载已上传的图片
  useEffect(() => {
    const loadPhotosFromSupabase = async () => {
      try {
        setLoading(true);
        const photoRecords = await getAllPhotos();
        const photoUrls = photoRecords.map(record => record.url);

        // 如果有从Supabase加载的图片，就使用它们
        if (photoUrls.length > 0) {
          setPhotos(photoUrls);
        }
      } catch (error) {
        console.error('从Supabase加载图片失败:', error);
        // 保持默认图片
      } finally {
        setLoading(false);
      }
    };

    loadPhotosFromSupabase();
  }, []);

  const handleAddPhotos = (newPhotos: string[]) => {
    setPhotos(prev => [...newPhotos, ...prev]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {loading && <Loader />}
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
