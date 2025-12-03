
import React, { useRef, useState } from 'react';
import { Image, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { TreeItemData, TreeConfig } from '../types';

interface TreeItemProps {
  data: TreeItemData;
  config: TreeConfig;
}

export const TreeItem: React.FC<TreeItemProps> = ({ data, config }) => {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Look at camera
      groupRef.current.lookAt(state.camera.position);
      
      // Hover Scale Effect
      const targetScale = hovered ? data.scale * 1.5 : data.scale;
      groupRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), delta * 8);

      // Scatter effect application (subtle drift based on config)
      if (config.scatter > 0) {
           groupRef.current.position.y += Math.sin(state.clock.elapsedTime + data.id) * 0.002 * config.scatter;
      }
    }
  });

  return (
      <group 
        ref={groupRef} 
        position={data.position} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
          {/* Back Glow Plane */}
          <mesh position={[0, 0, -0.05]}>
             <planeGeometry args={[1.1, 1.1]} />
             <meshBasicMaterial 
                color="#c026d3" // Fuchsia Glow
                transparent
                opacity={0.3 * config.glowStrength}
                toneMapped={false}
             />
          </mesh>

          {/* The Image */}
          <Image 
            url={data.url!} 
            transparent 
            opacity={1} 
            side={2}
            color={hovered ? '#ffffff' : `rgb(${Math.floor(255 * config.photoBrightness)}, ${Math.floor(255 * config.photoBrightness)}, ${Math.floor(255 * config.photoBrightness)})`}
          />
        </Float>
      </group>
    );
};
