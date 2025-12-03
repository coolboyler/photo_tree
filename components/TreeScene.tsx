
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
const NebulaParticles = ({ config }: { config: TreeConfig }) => {
    const count = 600;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Static positions
    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < count; i++) {
            // Spiral Cone distribution
            const t = i / count; // 0 to 1 (top to bottomish)
            const angle = t * 30 * Math.PI + Math.random() * Math.PI * 2;
            const radius = t * 6 + Math.random() * 2; // Cone shape
            const y = 8 - (t * 14); // Top to bottom

            p.push({
                x: Math.cos(angle) * radius,
                y: y + (Math.random() - 0.5) * 2,
                z: Math.sin(angle) * radius,
                scale: Math.random() * 0.5 + 0.2,
                speed: Math.random() * 0.5 + 0.5,
                offset: Math.random() * Math.PI * 2
            });
        }
        return p;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        
        particles.forEach((particle, i) => {
            // Apply Scatter
            const scatterX = Math.sin(time * 0.5 + particle.offset) * config.scatter;
            const scatterY = Math.cos(time * 0.3 + particle.offset) * config.scatter;
            
            dummy.position.set(
                particle.x + scatterX, 
                particle.y + scatterY, 
                particle.z + scatterX
            );

            // Pulse scale
            const pulse = 1 + Math.sin(time * particle.speed + particle.offset) * 0.3;
            const s = particle.scale * config.decoSize * pulse;
            
            dummy.scale.set(s, s, s);
            dummy.lookAt(state.camera.position); // Billboarding
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.8 * config.decoBrightness}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    );
};

// --- PHOTO GROUP ---
const PhotoSpiral = ({ photos, config }: { photos: string[], config: TreeConfig }) => {
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
                scale: 1.2
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
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas 
        camera={{ position: [0, 2, 18], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Environment - Space */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
        
        {/* Controls */}
        <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.5} 
            minDistance={5}
            maxDistance={30}
        />

        {/* Dynamic Rotation for the whole tree */}
        <RotatingGroup speed={config.rotationSpeed}>
             <NebulaParticles config={config} />
             <PhotoSpiral photos={photos} config={config} />
        </RotatingGroup>

        {/* Camera Shake for dynamic feel */}
        <CameraShake 
            maxYaw={0.05} 
            maxPitch={0.05} 
            maxRoll={0.05} 
            yawFrequency={0.1} 
            pitchFrequency={0.1} 
            rollFrequency={0.1} 
            intensity={0.5} 
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#d8b4fe" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#4c1d95" />
        
        {/* Center Glow */}
        <pointLight position={[0, 0, 0]} intensity={2} color="#f0abfc" distance={10} />

      </Canvas>
    </div>
  );
};
