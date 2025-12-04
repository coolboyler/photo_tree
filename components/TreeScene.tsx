
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  Stars,
  CameraShake
} from '@react-three/drei';
import * as THREE from 'three';
import { TreeItem } from './PhotoOrnament';
import { TreeConfig } from '../types';

interface TreeSceneProps {
    config: TreeConfig;
    photos: string[];
}

// --- PARTICLE SYSTEM ---
const NebulaParticles = ({ config, quality = 'high' }: { config: TreeConfig, quality?: 'high' | 'medium' | 'low' }) => {
    const outerCount = quality === 'high' ? 200 : quality === 'medium' ? 120 : 60;
    const centerCount = quality === 'high' ? 100 : quality === 'medium' ? 60 : 30;
    const totalCount = outerCount + centerCount;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Static positions
    const particles = useMemo(() => {
        const p = [];

        // Outer spiral particles
        for (let i = 0; i < outerCount; i++) {
            // Spiral Cone distribution
            const t = i / outerCount; // 0 to 1 (top to bottomish)
            const angle = t * 30 * Math.PI + Math.random() * Math.PI * 2;
            const radius = t * 6 + Math.random() * 2; // Cone shape
            const y = 8 - (t * 14); // Top to bottom

            p.push({
                x: Math.cos(angle) * radius,
                y: y + (Math.random() - 0.5) * 2,
                z: Math.sin(angle) * radius,
                scale: Math.random() * 0.5 + 0.2,
                speed: Math.random() * 0.5 + 0.5,
                offset: Math.random() * Math.PI * 2,
                isCenter: false
            });
        }

        // Center bright particles
        for (let i = 0; i < centerCount; i++) {
            const t = i / centerCount;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 3; // Dense center
            const y = -6 + Math.random() * 14; // Full height range

            p.push({
                x: Math.cos(angle) * radius,
                y: y,
                z: Math.sin(angle) * radius,
                scale: Math.random() * 0.3 + 0.3, // Larger and brighter
                speed: Math.random() * 0.3 + 0.3,
                offset: Math.random() * Math.PI * 2,
                isCenter: true
            });
        }
        return p;
    }, [outerCount, centerCount]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((particle, i) => {
            // Remove scatter effect completely to prevent periodic movement
            dummy.position.set(
                particle.x,
                particle.y,
                particle.z
            );

            // Fixed scale (no pulsing)
            const s = particle.scale * config.decoSize * (particle.isCenter ? 1.5 : 1.0);

            dummy.scale.set(s, s, s);
            dummy.lookAt(state.camera.position); // Billboarding
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, totalCount]}>
            <planeGeometry args={[
                quality === 'high' ? 0.4 : quality === 'medium' ? 0.35 : 0.3,
                quality === 'high' ? 0.4 : quality === 'medium' ? 0.35 : 0.3
            ]} />
            <meshBasicMaterial
                color="#ffffff"
                transparent={false}
                opacity={1.0}
                blending={THREE.NormalBlending}
                depthWrite={true}
                depthTest={true}
                side={THREE.DoubleSide} // 双面渲染，确保从任何角度都能看到
            />
        </instancedMesh>
    );
};

// --- PHOTO GROUP ---
const PhotoSpiral = ({ photos, config, quality = 'high' }: { photos: string[], config: TreeConfig, quality?: 'high' | 'medium' | 'low' }) => {
    // Generate positions for photos
    const items = useMemo(() => {
        return photos.map((url, i) => {
            const t = i / photos.length;
            const turns = 8;
            const angle = t * Math.PI * 2 * turns;
            const y = 7 - (t * 12); // Height
            const baseRadius = 1 + t * 5; // Cone
            
            return {
                id: i,
                url,
                // Initial base position
                basePos: new THREE.Vector3(
                    Math.cos(angle) * baseRadius,
                    y,
                    Math.sin(angle) * baseRadius
                ),
                rotation: [0, 0, 0] as [number, number, number],
                scale: quality === 'high' ? 1.2 : quality === 'medium' ? 1.0 : 0.8
            };
        });
    }, [photos]);

    return (
        <group>
            {items.map((item, i) => {
                // We add some slight randomness per frame in the item component or just here?
                // For performance, let's keep static base positions but the Group rotates.
                return (
                    <TreeItem 
                        key={i} 
                        data={{
                             ...item, 
                             type: 'photo',
                             position: [item.basePos.x, item.basePos.y, item.basePos.z]
                        }} 
                        config={config}
                    />
                );
            })}
        </group>
    );
}

const RotatingGroup = ({ children, speed }: { children: React.ReactNode, speed: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * speed;
        }
    });
    return <group ref={ref}>{children}</group>;
}

export const TreeScene: React.FC<TreeSceneProps> = ({ config, photos }) => {
  const [webglError, setWebglError] = React.useState(false);
  const [webglInitialized, setWebglInitialized] = React.useState(false);
  const [renderAttempts, setRenderAttempts] = React.useState(0);
  const [renderQuality, setRenderQuality] = React.useState<'high' | 'medium' | 'low'>('high');
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // 检查WebGL支持的函数
  const checkWebGLSupport = React.useCallback(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }, []);

  // 初始化时检查WebGL支持
  React.useEffect(() => {
    const hasWebGL = checkWebGLSupport();
    if (!hasWebGL) {
      console.error('WebGL is not supported in this browser');
      setWebglError(true);
    }
  }, [checkWebGLSupport]);

  // 监控WebGL状态和调整渲染质量
  React.useEffect(() => {
    if (!webglInitialized && !webglError) {
      const timer = setTimeout(() => {
        console.log('WebGL initialization timeout, checking status...');
        const hasWebGL = checkWebGLSupport();
        if (!hasWebGL) {
          setWebglError(true);
        } else {
          setWebglInitialized(true);
        }
      }, 2000); // 2秒后检查是否初始化成功

      return () => clearTimeout(timer);
    }

    // 根据尝试次数调整渲染质量
    if (renderAttempts > 0) {
      if (renderAttempts === 1) {
        setRenderQuality('medium');
        console.log('降低渲染质量为中等');
      } else if (renderAttempts >= 2) {
        setRenderQuality('low');
        console.log('降低渲染质量为低');
      }
    }
  }, [webglInitialized, webglError, checkWebGLSupport, renderAttempts]);

  if (webglError) {
    return (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center p-8 max-w-md bg-black/80 backdrop-blur-sm rounded-xl border border-fuchsia-500/30">
          <h2 className="text-2xl text-fuchsia-400 mb-4">⚠️ WebGL渲染问题</h2>
          <p className="text-gray-300 mb-4">
            3D渲染遇到问题，可能是以下原因：
          </p>
          <div className="text-left text-sm text-gray-400 mb-6 space-y-2">
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2">•</span>
              <span>浏览器不支持WebGL或WebGL被禁用</span>
            </div>
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2">•</span>
              <span>显卡驱动程序需要更新</span>
            </div>
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2">•</span>
              <span>GPU内存不足或其他应用占用资源</span>
            </div>
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2">•</span>
              <span>浏览器硬件加速被关闭</span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setRenderAttempts(prev => prev + 1);
                setWebglError(false);
                setWebglInitialized(false);
              }}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity font-medium"
            >
              重试渲染 ({renderAttempts + 1}/3)
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-800 text-gray-300 px-6 py-3 rounded-full hover:bg-gray-700 transition-colors font-medium"
            >
              刷新页面
            </button>
            <button
              onClick={() => {
                window.open('https://get.webgl.org/', '_blank');
              }}
              className="w-full bg-gray-800 text-gray-300 px-6 py-3 rounded-full hover:bg-gray-700 transition-colors font-medium"
            >
              查看WebGL设置指南
            </button>
          </div>
          {renderAttempts >= 3 && (
            <p className="text-xs text-gray-500 mt-4">
              多次尝试失败，建议检查浏览器设置或使用其他浏览器
            </p>
          )}
        </div>
      </div>
    );
  }

  // 显示加载状态
  if (!webglInitialized && !webglError) {
    return (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-2xl font-light animate-pulse tracking-widest text-fuchsia-400 mb-4">
            初始化3D渲染...
          </div>
          <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 animate-pulse"></div>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            正在检查WebGL支持，请稍候...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 2, 18], fov: 50 }}
        gl={{
          antialias: false, // 关闭抗锯齿以降低GPU负载
          toneMapping: THREE.NoToneMapping, // 简化色调映射
          powerPreference: "default", // 改为default避免强制高性能模式
          alpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: true // 如果性能不足则失败
        }}
        onCreated={({ gl }) => {
          console.log('WebGL context created successfully');
          setWebglInitialized(true);

          // 定期检查WebGL上下文状态
          const checkContextStatus = () => {
            // Check if isContextLost method exists (not available in all browsers)
            if (gl.isContextLost && gl.isContextLost()) {
              console.warn('WebGL context is lost');
              setWebglError(true);
              return false;
            }
            return true;
          };

          // 初始检查
          if (!checkContextStatus()) {
            return;
          }

          // 设置定期检查
          const checkInterval = setInterval(() => {
            if (!checkContextStatus()) {
              clearInterval(checkInterval);
            }
          }, 1000); // 每秒检查一次

          // 处理WebGL上下文丢失
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            console.warn('WebGL context lost event received');
            setWebglError(true);
            clearInterval(checkInterval);
          };

          const handleContextRestored = () => {
            console.log('WebGL context restored');
            setWebglError(false);
            setWebglInitialized(true);
          };

          gl.domElement.addEventListener('webglcontextlost', handleContextLost);
          gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);

          // 清理函数
          return () => {
            clearInterval(checkInterval);
            gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
            gl.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
          };
        }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Environment - Space */}
        <Stars
          radius={renderQuality === 'high' ? 80 : renderQuality === 'medium' ? 60 : 40}
          depth={renderQuality === 'high' ? 30 : renderQuality === 'medium' ? 20 : 15}
          count={renderQuality === 'high' ? 1000 : renderQuality === 'medium' ? 600 : 300}
          factor={renderQuality === 'high' ? 3 : renderQuality === 'medium' ? 2 : 1.5}
          saturation={renderQuality === 'high' ? 0.8 : renderQuality === 'medium' ? 0.6 : 0.4}
          fade
          speed={renderQuality === 'high' ? 0.5 : renderQuality === 'medium' ? 0.3 : 0.2}
        />
        
        {/* Controls */}
        <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={5}
            maxDistance={30}
            makeDefault
        />

        {/* Dynamic Rotation for the whole tree */}
        <RotatingGroup speed={config.rotationSpeed}>
             <NebulaParticles config={config} quality={renderQuality} />
             <PhotoSpiral photos={photos} config={config} quality={renderQuality} />
        </RotatingGroup>

        {/* Camera Shake - 完全移除以降低负载 */}
        {/* <CameraShake
            maxYaw={0.01}
            maxPitch={0.01}
            maxRoll={0.01}
            yawFrequency={0.02}
            pitchFrequency={0.02}
            rollFrequency={0.02}
            intensity={0.1}
        /> */}
        
        {/* Lighting - 根据质量调整 */}
        <ambientLight intensity={renderQuality === 'high' ? 0.3 : renderQuality === 'medium' ? 0.25 : 0.2} />
        <pointLight
          position={[5, 5, 5]}
          intensity={renderQuality === 'high' ? 0.8 : renderQuality === 'medium' ? 0.6 : 0.4}
          color="#d8b4fe"
        />

        {/* Center Glow */}
        <pointLight
          position={[0, 0, 0]}
          intensity={renderQuality === 'high' ? 2.0 : renderQuality === 'medium' ? 1.5 : 1.2}
          color="#f0abfc"
          distance={renderQuality === 'high' ? 10 : renderQuality === 'medium' ? 8 : 6}
        />


        {/* Christmas Tree Star */}
        <mesh position={[0, 8, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffaa00"
            emissiveIntensity={1.5}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>


      </Canvas>
    </div>
  );
};
