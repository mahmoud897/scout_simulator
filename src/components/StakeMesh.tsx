import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type Stake, computeBoundaryBounds, isStakeOutOfBounds } from '../store/useStore';
import { woodBarkTexture, woodRingsTexture } from '../utils/textures';

interface StakeMeshProps {
  stake: Stake;
}

export const StakeMesh: React.FC<StakeMeshProps> = ({ stake }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const setStakeMesh = useStore(state => state.setStakeMesh);
  const selectStake = useStore(state => state.selectStake);
  const selectedStake = useStore(state => state.selectedStake);
  const setContextMenu = useStore(state => state.setContextMenu);
  
  const guyLinePlacementActive = useStore(state => state.guyLinePlacementActive);
  const guyLineSourceSparId = useStore(state => state.guyLineSourceSparId);
  const addGuyLine = useStore(state => state.addGuyLine);
  const blueprintMode = useStore(state => state.blueprintMode);

  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);
  const setCameraFocusTarget = useStore(state => state.setCameraFocusTarget);

  const isOutOfBounds = React.useMemo(() => {
    if (!boundaryEnabled || assumeAllInsideBoundary) return false;
    const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
    return isStakeOutOfBounds(stake, bounds);
  }, [boundaryEnabled, assumeAllInsideBoundary, boundaryWidth, boundaryLength, boundaryAlignment, stake.position.x, stake.position.z]);

  const isSelected = selectedStake?.id === stake.id;

  // Link R3F mesh reference to store on mount & keep transforms synced
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(stake.position);
      meshRef.current.quaternion.copy(stake.quaternion);
      meshRef.current.updateMatrixWorld(true);
      setStakeMesh(stake.id, meshRef.current);
    }
  }, [stake.id, stake.position, stake.quaternion, setStakeMesh]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;

    if (guyLinePlacementActive && guyLineSourceSparId) {
      addGuyLine(guyLineSourceSparId, stake.id);
      return;
    }

    selectStake(stake);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      selectStake(stake);
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'stake', targetId: stake.id });
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
      visible={stake.visible !== false}
      position={stake.position}
      quaternion={stake.quaternion}
      castShadow={!blueprintMode}
      receiveShadow={!blueprintMode}
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
      name="stake"
      userData={{ id: stake.id, type: 'stake' }}
    >
      {/* Driven peg: radius 0.02, length 0.4 */}
      <cylinderGeometry args={[0.02, 0.015, 0.4, 8, 1]} />
      
      {blueprintMode ? (
        <>
          <meshBasicMaterial
            attach="material-0"
            color={isSelected ? '#eab308' : (hovered ? '#d8b4fe' : '#c084fc')}
            transparent
            opacity={hovered ? 0.95 : 0.8}
          />
          <meshBasicMaterial
            attach="material-1"
            color={isSelected ? '#eab308' : (hovered ? '#d8b4fe' : '#c084fc')}
            transparent
            opacity={hovered ? 0.95 : 0.8}
          />
          <meshBasicMaterial
            attach="material-2"
            color={isSelected ? '#eab308' : (hovered ? '#d8b4fe' : '#c084fc')}
            transparent
            opacity={hovered ? 0.95 : 0.8}
          />
        </>
      ) : (
        <>
          {/* Side bark material */}
          <meshStandardMaterial
            attach="material-0"
            map={woodBarkTexture}
            roughness={0.95}
            metalness={0.05}
            color={isSelected ? '#eab308' : (hovered ? '#c084fc' : '#a78bfa')}
          />
          {/* Top Cap */}
          <meshStandardMaterial
            attach="material-1"
            map={woodRingsTexture}
            roughness={0.75}
            color={hovered && !isSelected ? '#f1f5f9' : '#ffffff'}
          />
          {/* Bottom Cap */}
          <meshStandardMaterial
            attach="material-2"
            map={woodRingsTexture}
            roughness={0.75}
            color={hovered && !isSelected ? '#f1f5f9' : '#ffffff'}
          />
        </>
      )}

      {isOutOfBounds && (
        <group 
          position={[0, 0.25, 0]}
          onClick={(e) => {
            e.stopPropagation();
            selectStake(stake);
            setCameraFocusTarget(stake.position.clone());
          }}
        >
          <mesh>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.12, 16]} />
            <meshBasicMaterial color="#f97316" side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
        </group>
      )}
    </mesh>
  );
};

export default StakeMesh;
