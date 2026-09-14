import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type GuideLine } from '../store/useStore';

interface GuideLineMeshProps {
  line: GuideLine;
}

export const GuideLineMesh: React.FC<GuideLineMeshProps> = ({ line }) => {
  const meshARef = useRef<THREE.Mesh>(null);
  const meshBRef = useRef<THREE.Mesh>(null);
  
  const setGuideLinePointMesh = useStore(state => state.setGuideLinePointMesh);
  const selectGuideLine = useStore(state => state.selectGuideLine);
  const selectGuideLinePoint = useStore(state => state.selectGuideLinePoint);
  
  const selectedGuideLine = useStore(state => state.selectedGuideLine);
  const selectedGuideLinePoint = useStore(state => state.selectedGuideLinePoint);
  const selectedSourceSparPoint = useStore(state => state.selectedSourceSparPoint);
  const selectTargetPoint = useStore(state => state.selectTargetPoint);
  const setContextMenu = useStore(state => state.setContextMenu);

  const isLineSelected = selectedGuideLine?.id === line.id;
  const isPointASelected = selectedGuideLinePoint?.lineId === line.id && selectedGuideLinePoint?.pointKey === 'A';
  const isPointBSelected = selectedGuideLinePoint?.lineId === line.id && selectedGuideLinePoint?.pointKey === 'B';

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      selectGuideLine(line);
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'guideLine', targetId: line.id });
    }
  };

  // Sync references with store
  useEffect(() => {
    if (meshARef.current) {
      setGuideLinePointMesh(line.id, 'A', meshARef.current);
    }
  }, [line.id, setGuideLinePointMesh]);

  useEffect(() => {
    if (meshBRef.current) {
      setGuideLinePointMesh(line.id, 'B', meshBRef.current);
    }
  }, [line.id, setGuideLinePointMesh]);

  // Compute cylinder transform between pointA and pointB
  const pA = line.pointA;
  const pB = line.pointB;
  const distance = pA.distanceTo(pB);
  const midPoint = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
  
  const direction = new THREE.Vector3().subVectors(pB, pA);
  const dirLength = direction.length();
  const quaternion = new THREE.Quaternion();
  if (dirLength > 0.0001) {
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }

  const handlePointClick = (e: ThreeEvent<MouseEvent>, key: 'A' | 'B') => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;

    const targetPos = key === 'A' ? pA : pB;
    if (selectedSourceSparPoint) {
      selectTargetPoint(targetPos, `Guide Line Point ${key}`);
      return;
    }

    selectGuideLinePoint(line.id, key);
  };

  const handleLineClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;

    if (selectedSourceSparPoint) {
      // snap to midpoint of guide line
      selectTargetPoint(midPoint, `Guide Line Midpoint`);
      return;
    }

    selectGuideLine(line);
  };

  return (
    <group visible={line.visible !== false}>
      {/* Endpoint A Handle */}
      <mesh
        ref={meshARef}
        position={pA}
        onClick={(e) => handlePointClick(e, 'A')}
        name="guideLinePointA"
        userData={{ id: line.id, pointKey: 'A' }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isPointASelected ? '#eab308' : '#8b5cf6'}
          emissive={isPointASelected ? '#eab308' : '#8b5cf6'}
          emissiveIntensity={isPointASelected ? 0.6 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Endpoint B Handle */}
      <mesh
        ref={meshBRef}
        position={pB}
        onClick={(e) => handlePointClick(e, 'B')}
        name="guideLinePointB"
        userData={{ id: line.id, pointKey: 'B' }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isPointBSelected ? '#eab308' : '#8b5cf6'}
          emissive={isPointBSelected ? '#eab308' : '#8b5cf6'}
          emissiveIntensity={isPointBSelected ? 0.6 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Connecting Guide Line (glowing cylinder) */}
      <mesh
        position={midPoint}
        quaternion={quaternion}
        onClick={handleLineClick}
        onPointerDown={handlePointerDown}
        name="guideLineCylinder"
        userData={{ id: line.id }}
      >
        <cylinderGeometry args={[0.015, 0.015, distance, 8, 1]} />
        <meshStandardMaterial
          color={isLineSelected ? '#eab308' : '#a855f7'}
          emissive={isLineSelected ? '#eab308' : '#a855f7'}
          emissiveIntensity={isLineSelected ? 0.8 : 0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
};

export default GuideLineMesh;
