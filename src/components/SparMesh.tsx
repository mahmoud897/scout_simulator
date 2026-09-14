import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type Spar, computeBoundaryBounds, isSparOutOfBounds } from '../store/useStore';
import { woodBarkTexture, woodRingsTexture } from '../utils/textures';

interface SparMeshProps {
  spar: Spar;
}

export const SparMesh: React.FC<SparMeshProps> = ({ spar }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const toggleSparSelection = useStore(state => state.toggleSparSelection);
  const selectAssembly = useStore(state => state.selectAssembly);
  const selectedSpars = useStore(state => state.selectedSpars);
  const multiSelectActive = useStore(state => state.multiSelectActive);
  const setSparMesh = useStore(state => state.setSparMesh);
  const blueprintMode = useStore(state => state.blueprintMode);
  const snapHandlesVisible = useStore(state => state.snapHandlesVisible);
  const needRenderTrigger = useStore(state => state.needRenderTrigger);
  void needRenderTrigger;

  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);
  const setCameraFocusTarget = useStore(state => state.setCameraFocusTarget);

  const isOutOfBounds = React.useMemo(() => {
    if (!boundaryEnabled || assumeAllInsideBoundary) return false;
    const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
    return isSparOutOfBounds(spar, bounds);
  }, [
    boundaryEnabled, 
    assumeAllInsideBoundary, 
    boundaryWidth, 
    boundaryLength, 
    boundaryAlignment, 
    spar.position.x, 
    spar.position.y, 
    spar.position.z, 
    spar.quaternion.x, 
    spar.quaternion.y, 
    spar.quaternion.z, 
    spar.quaternion.w, 
    spar.length
  ]);

  const isSelected = selectedSpars.some(s => s.id === spar.id);
  const selectedSourceSparPoint = useStore(state => state.selectedSourceSparPoint);
  const selectSourceSparPoint = useStore(state => state.selectSourceSparPoint);
  const selectTargetPoint = useStore(state => state.selectTargetPoint);
  const selectedGuidePoint = useStore(state => state.selectedGuidePoint);
  const selectedStake = useStore(state => state.selectedStake);

  // Link R3F mesh reference to Zustand store on mount & keep transforms synced
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(spar.position);
      meshRef.current.quaternion.copy(spar.quaternion);
      meshRef.current.updateMatrixWorld(true);
      setSparMesh(spar.id, meshRef.current);
    }
  }, [spar.id, spar.position, spar.quaternion, setSparMesh]);

  const setContextMenu = useStore(state => state.setContextMenu);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Only handle left clicks
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;
    
    const isMulti = !!e.shiftKey || multiSelectActive;
    const forceSingle = !!e.altKey;
    toggleSparSelection(spar, isMulti, forceSingle);
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;
    selectAssembly(spar);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      const isSelected = selectedSpars.some(s => s.id === spar.id);
      if (!isSelected) {
        toggleSparSelection(spar, false);
      }
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'spar', targetId: spar.id });
    }
  };

  const lashingEndOffset = useStore(state => state.lashingEndOffset);
  const smartSnappingEnabled = useStore(state => state.smartSnappingEnabled);

  const handleHandleClick = (e: ThreeEvent<MouseEvent>, key: 'start' | 'end' | 'start_lash' | 'end_lash' | 'midpoint' | 'third_1' | 'third_2') => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return; // Left click only

    if (meshRef.current) {
      const safeOffset = Math.min(lashingEndOffset, spar.length * 0.45);
      let localY = 0;
      let keyLabel = 'نقطة ارتكاز';
      switch (key) {
        case 'start': localY = -spar.length / 2; keyLabel = 'طرف هندسي (بداية)'; break;
        case 'end': localY = spar.length / 2; keyLabel = 'طرف هندسي (نهاية)'; break;
        case 'start_lash': localY = -spar.length / 2 + safeOffset; keyLabel = 'طرف كشفي (خلوص 7 سم)'; break;
        case 'end_lash': localY = spar.length / 2 - safeOffset; keyLabel = 'طرف كشفي (خلوص 7 سم)'; break;
        case 'midpoint': localY = 0; keyLabel = 'منتصف العصا (50%)'; break;
        case 'third_1': localY = -spar.length / 2 + spar.length / 3; keyLabel = 'تثليث كشفي (1/3)'; break;
        case 'third_2': localY = -spar.length / 2 + (2 * spar.length) / 3; keyLabel = 'تثليث كشفي (2/3)'; break;
      }

      const localPos = new THREE.Vector3(0, localY, 0);
      const worldPos = localPos.clone().applyMatrix4(meshRef.current.matrixWorld);

      if (selectedSourceSparPoint) {
        if (selectedSourceSparPoint.sparId === spar.id) {
          if (selectedSourceSparPoint.pointKey === key) {
            // Toggle off
            selectSourceSparPoint(null);
          } else {
            // Switch source to this point
            selectSourceSparPoint(spar.id, key);
          }
        } else {
          // Different spar! Set as target
          const typeNames: Record<string, string> = {
            stave: 'عصا قصيرة',
            medium: 'خشب متوسط',
            long: 'خشب طويل',
            xlong: 'خشب طويل جداً'
          };
          selectTargetPoint(worldPos, `${typeNames[spar.type] || 'خشب'} - ${keyLabel}`);
        }
      } else {
        // Set as source
        selectSourceSparPoint(spar.id, key);

        // Auto-set target if a guide point or stake was already selected
        if (selectedGuidePoint) {
          selectTargetPoint(selectedGuidePoint.position, 'Guide Point');
        } else if (selectedStake) {
          selectTargetPoint(selectedStake.position, 'Stake');
        }
      }
    }
  };

  const [hovered, setHovered] = React.useState(false);
  const [hoveredHandleKey, setHoveredHandleKey] = React.useState<string | null>(null);

  // Set mouse cursor on hover
  useEffect(() => {
    if (hovered || hoveredHandleKey) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, hoveredHandleKey]);

  const safeOffset = Math.min(lashingEndOffset, spar.length * 0.45);
  const handlePoints: Array<{
    key: 'start' | 'end' | 'start_lash' | 'end_lash' | 'midpoint' | 'third_1' | 'third_2';
    y: number;
    color: string;
    activeColor: string;
    sizeScale: number;
    tip: string;
  }> = [
    { key: 'start', y: -spar.length / 2, color: '#0284c7', activeColor: '#38bdf8', sizeScale: 1.05, tip: 'طرف هندسي (0 سم)' },
    { key: 'start_lash', y: -spar.length / 2 + safeOffset, color: '#16a34a', activeColor: '#4ade80', sizeScale: 1.18, tip: 'طرف كشفي (خلوص 7 سم)' },
    { key: 'third_1', y: -spar.length / 2 + spar.length / 3, color: '#9333ea', activeColor: '#c084fc', sizeScale: 0.95, tip: 'تثليث كشفي (1/3)' },
    { key: 'midpoint', y: 0, color: '#0891b2', activeColor: '#22d3ee', sizeScale: 1.1, tip: 'منتصف العصا (50%)' },
    { key: 'third_2', y: -spar.length / 2 + (2 * spar.length) / 3, color: '#9333ea', activeColor: '#c084fc', sizeScale: 0.95, tip: 'تثليث كشفي (2/3)' },
    { key: 'end_lash', y: spar.length / 2 - safeOffset, color: '#16a34a', activeColor: '#4ade80', sizeScale: 1.18, tip: 'طرف كشفي (خلوص 7 سم)' },
    { key: 'end', y: spar.length / 2, color: '#0284c7', activeColor: '#38bdf8', sizeScale: 1.05, tip: 'طرف هندسي (0 سم)' },
  ];

  return (
    <group visible={spar.visible !== false}>
      <mesh
        ref={meshRef}
        name="spar"
        userData={{ id: spar.id, type: 'spar' }}
        position={spar.position}
        quaternion={spar.quaternion}
        castShadow={!blueprintMode}
        receiveShadow={!blueprintMode}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <cylinderGeometry args={[spar.radius, spar.radius, spar.length, 16]} />
        {blueprintMode ? (
          <meshBasicMaterial
            color={isSelected ? '#38bdf8' : (isOutOfBounds ? '#ef4444' : '#1e3a5f')}
            wireframe
          />
        ) : (
          <>
            {/* Cylinder Side Material */}
            <meshStandardMaterial
              attach="material-0"
              map={woodBarkTexture}
              roughness={0.8}
              metalness={0.05}
              bumpMap={woodBarkTexture}
              bumpScale={0.02}
              color={isSelected ? '#facc15' : (hovered ? '#fef08a' : (isOutOfBounds ? '#fca5a5' : '#ffffff'))}
              emissive={isOutOfBounds ? '#ef4444' : '#000000'}
              emissiveIntensity={isOutOfBounds ? (isSelected ? 0.35 : 0.6) : 0}
            />
            {/* Top Cap Material */}
            <meshStandardMaterial
              attach="material-1"
              map={woodRingsTexture}
              roughness={0.7}
              metalness={0.05}
              color={hovered && !isSelected ? '#fef08a' : (isOutOfBounds ? '#fca5a5' : '#ffffff')}
              emissive={isOutOfBounds ? '#ef4444' : '#000000'}
              emissiveIntensity={isOutOfBounds ? 0.4 : 0}
            />
            {/* Bottom Cap Material */}
            <meshStandardMaterial
              attach="material-2"
              map={woodRingsTexture}
              roughness={0.7}
              metalness={0.05}
              color={hovered && !isSelected ? '#fef08a' : (isOutOfBounds ? '#fca5a5' : '#ffffff')}
              emissive={isOutOfBounds ? '#ef4444' : '#000000'}
              emissiveIntensity={isOutOfBounds ? 0.4 : 0}
            />
          </>
        )}

        {/* Snap and Align Handles - Nested INSIDE mesh so they follow the spar in real time! */}
        {isSelected && (snapHandlesVisible || smartSnappingEnabled) && (
          <group>
            {handlePoints.map(hp => {
              const isSource = selectedSourceSparPoint?.sparId === spar.id && selectedSourceSparPoint.pointKey === hp.key;
              const isHov = hoveredHandleKey === hp.key;

              return (
                <group key={hp.key} position={[0, hp.y, 0]}>
                  <mesh
                    onClick={(e) => handleHandleClick(e, hp.key)}
                    onPointerOver={(e) => { e.stopPropagation(); setHoveredHandleKey(hp.key); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHoveredHandleKey(null); }}
                  >
                    <sphereGeometry args={[spar.radius * hp.sizeScale, 16, 16]} />
                    <meshStandardMaterial
                      color={isSource ? '#22c55e' : (isHov ? hp.activeColor : hp.color)}
                      emissive={isSource ? '#16a34a' : (isHov ? hp.activeColor : hp.color)}
                      emissiveIntensity={isHov || isSource ? 0.85 : 0.4}
                      transparent
                      opacity={isHov || isSource ? 0.95 : 0.75}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Outer Glowing Indicator Ring */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[spar.radius * (hp.sizeScale + 0.1), spar.radius * (hp.sizeScale + 0.35), 24]} />
                    <meshBasicMaterial
                      color={isSource ? '#4ade80' : (isHov ? hp.activeColor : hp.color)}
                      side={THREE.DoubleSide}
                      transparent
                      opacity={isSource || isHov ? 0.9 : 0.4}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        {/* Out-of-bounds 3D Warning Beacon & Click-to-Focus */}
        {isOutOfBounds && (
          <group
            position={[0, spar.length / 2 + 0.22, 0]}
            onClick={(e) => {
              e.stopPropagation();
              toggleSparSelection(spar, false);
              setCameraFocusTarget(spar.position.clone());
            }}
          >
            <mesh>
              <sphereGeometry args={[Math.max(spar.radius * 2.2, 0.1), 16, 16]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(spar.radius * 2.4, 0.12), Math.max(spar.radius * 3.6, 0.18), 24]} />
              <meshBasicMaterial color="#f97316" side={THREE.DoubleSide} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, -Math.max(spar.radius * 2.0, 0.1), 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[Math.max(spar.radius * 1.5, 0.08), Math.max(spar.radius * 2.4, 0.14), 12]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        )}
      </mesh>

      {blueprintMode && (
        <mesh
          position={spar.position}
          quaternion={spar.quaternion}
        >
          <cylinderGeometry args={[spar.radius * 1.01, spar.radius * 1.01, spar.length, 12, 1]} />
          <meshBasicMaterial
            color={isSelected ? '#facc15' : '#ffffff'}
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      )}
    </group>
  );
};
export default SparMesh;
