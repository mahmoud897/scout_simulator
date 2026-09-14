import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type GuidePoint } from '../store/useStore';

interface GuidePointMeshProps {
  point: GuidePoint;
}

export const GuidePointMesh: React.FC<GuidePointMeshProps> = ({ point }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const setGuidePointMesh = useStore(state => state.setGuidePointMesh);
  const selectGuidePoint = useStore(state => state.selectGuidePoint);
  const selectedGuidePoint = useStore(state => state.selectedGuidePoint);
  const setContextMenu = useStore(state => state.setContextMenu);
  
  const selectedSourceSparPoint = useStore(state => state.selectedSourceSparPoint);
  const selectTargetPoint = useStore(state => state.selectTargetPoint);

  const isSelected = selectedGuidePoint?.id === point.id;

  useEffect(() => {
    if (meshRef.current) {
      setGuidePointMesh(point.id, meshRef.current);
    }
  }, [point.id, setGuidePointMesh]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return; // Left click only

    if (selectedSourceSparPoint) {
      selectTargetPoint(point.position, `Guide Point`);
      return;
    }

    selectGuidePoint(point);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      selectGuidePoint(point);
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'guidePoint', targetId: point.id });
    }
  };

  const [hovered, setHovered] = React.useState(false);

  // Set mouse cursor on hover
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  return (
    <mesh
      ref={meshRef}
      visible={point.visible !== false}
      position={point.position}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
      name="guidePoint"
      userData={{ id: point.id }}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={isSelected ? '#eab308' : (hovered ? '#22d3ee' : '#06b6d4')}
        emissive={isSelected ? '#eab308' : (hovered ? '#22d3ee' : '#06b6d4')}
        emissiveIntensity={isSelected ? 0.6 : (hovered ? 0.5 : 0.2)}
        roughness={0.1}
        metalness={0.1}
        transparent
        opacity={hovered ? 0.95 : 0.9}
      />
    </mesh>
  );
};

export default GuidePointMesh;
