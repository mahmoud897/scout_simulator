import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type GuyLine } from '../store/useStore';
import { ropeTexture } from '../utils/textures';

interface GuyLineMeshProps {
  guyLine: GuyLine;
}

export const GuyLineMesh: React.FC<GuyLineMeshProps> = ({ guyLine }) => {
  const spars = useStore(state => state.spars);
  const stakes = useStore(state => state.stakes);
  
  const selectGuyLine = useStore(state => state.selectGuyLine);
  const selectedGuyLine = useStore(state => state.selectedGuyLine);
  const blueprintMode = useStore(state => state.blueprintMode);
  const setContextMenu = useStore(state => state.setContextMenu);

  const spar = spars.find(s => s.id === guyLine.sparId);
  const stake = stakes.find(s => s.id === guyLine.stakeId);

  if (!spar || !stake) return null;

  const isSelected = selectedGuyLine?.id === guyLine.id;

  // Calculate start position on the Spar (dynamic based on mesh world matrix if present)
  const startPos = new THREE.Vector3();
  if (spar.mesh) {
    startPos.set(0, guyLine.sparHeightOffset, 0).applyMatrix4(spar.mesh.matrixWorld);
  } else {
    const dirY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
    startPos.copy(spar.position).addScaledVector(dirY, guyLine.sparHeightOffset);
  }

  // Calculate end position on the Stake (dynamic top offset)
  const endPos = new THREE.Vector3();
  if (stake.mesh) {
    endPos.set(0, 0.2, 0).applyMatrix4(stake.mesh.matrixWorld);
  } else {
    const stakeDir = new THREE.Vector3(0, 1, 0).applyQuaternion(stake.quaternion).normalize();
    endPos.copy(stake.position).addScaledVector(stakeDir, 0.2);
  }

  // Vector from startPos to endPos
  const ropeVec = new THREE.Vector3().subVectors(endPos, startPos);
  const length = ropeVec.length();
  if (length < 0.001 || !Number.isFinite(length)) return null;

  const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

  const direction = ropeVec.clone().normalize();
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;
    selectGuyLine(guyLine);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      selectGuyLine(guyLine);
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'guyLine', targetId: guyLine.id });
    }
  };

  // Rope thickness based on tension
  const ropeRadius = 0.009 * (1.2 - guyLine.tension * 0.3);

  return (
    <mesh
      visible={guyLine.visible !== false}
      position={midpoint}
      quaternion={rotation}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      castShadow={!blueprintMode}
      name="guyLine"
    >
      <cylinderGeometry args={[ropeRadius, ropeRadius, length, 6, 1]} />
      {blueprintMode ? (
        <meshBasicMaterial
          color={isSelected ? '#eab308' : '#ffffff'}
          transparent
          opacity={0.85}
        />
      ) : (
        <meshStandardMaterial
          map={ropeTexture}
          roughness={0.9}
          color={isSelected ? '#eab308' : '#e2e8f0'}
        />
      )}
    </mesh>
  );
};

export default GuyLineMesh;
