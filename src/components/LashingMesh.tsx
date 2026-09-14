import React, { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore, type Lashing } from '../store/useStore';
import { ropeTexture } from '../utils/textures';

interface LashingMeshProps {
  lashing: Lashing;
}

export const LashingMesh: React.FC<LashingMeshProps> = ({ lashing }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const selectLashing = useStore(state => state.selectLashing);
  const selectedLashing = useStore(state => state.selectedLashing);
  const setLashingMesh = useStore(state => state.setLashingMesh);
  const blueprintMode = useStore(state => state.blueprintMode);
  const setContextMenu = useStore(state => state.setContextMenu);

  const isSelected = selectedLashing?.id === lashing.id;

  const spars = useStore(state => state.spars);
  const sparA = spars.find(s => s.id === lashing.sparA.id) || lashing.sparA;
  const sparB = spars.find(s => s.id === lashing.sparB.id) || lashing.sparB;
  const { type, position } = lashing;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.nativeEvent?.button !== undefined && e.nativeEvent.button !== 0) return;
    selectLashing(lashing);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2) {
      e.stopPropagation();
      selectLashing(lashing);
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'lashing', targetId: lashing.id });
    }
  };

  // Link R3F group reference to store on mount and keep transforms synchronized
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(lashing.position);
      groupRef.current.updateMatrixWorld(true);
      setLashingMesh(lashing.id, groupRef.current);
    }
  }, [lashing.id, lashing.position, setLashingMesh]);
  
  // Calculate relative directions and alignments
  const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(sparA.quaternion).normalize();
  const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(sparB.quaternion).normalize();

  const qA = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirA);
  const qB = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirB);

  const mainRadius = (sparA.radius + sparB.radius) * 1.1;
  const ropeRadius = 0.012;

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

  const needRenderTrigger = useStore(state => state.needRenderTrigger);
  void needRenderTrigger;

  // Build the torus components array based on lashing type
  const loops: React.ReactNode[] = [];

  const ropeColor = isSelected ? '#facc15' : (hovered ? '#fef08a' : '#e6a15c');
  const bpRopeColor = isSelected ? '#eab308' : (hovered ? '#fdba74' : '#fb923c');
  const bpOpacity = isSelected ? 0.95 : (hovered ? 0.95 : 0.9);

  if (type === 'square' || type === 'diagonal') {
    // 3 wraps along A
    [-1, 0, 1].forEach((i, idx) => {
      const posOffset = dirA.clone().multiplyScalar(i * 0.022);
      // Lie flat around cylinder axis: rotate X by 90 deg
      const qTorus = qA.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      
      loops.push(
        <mesh key={`a-${idx}`} position={posOffset} quaternion={qTorus} castShadow={!blueprintMode}>
          <torusGeometry args={[sparA.radius + ropeRadius * 1.15, ropeRadius, 10, 24]} />
          {blueprintMode ? (
            <meshBasicMaterial color={bpRopeColor} transparent opacity={bpOpacity} />
          ) : (
            <meshStandardMaterial map={ropeTexture} roughness={0.88} bumpMap={ropeTexture} bumpScale={0.015} color={ropeColor} />
          )}
        </mesh>
      );
    });

    // 3 wraps along B
    [-1, 0, 1].forEach((i, idx) => {
      const posOffset = dirB.clone().multiplyScalar(i * 0.022);
      const qTorus = qB.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      
      loops.push(
        <mesh key={`b-${idx}`} position={posOffset} quaternion={qTorus} castShadow={!blueprintMode}>
          <torusGeometry args={[sparB.radius + ropeRadius * 1.15, ropeRadius, 10, 24]} />
          {blueprintMode ? (
            <meshBasicMaterial color={bpRopeColor} transparent opacity={bpOpacity} />
          ) : (
            <meshStandardMaterial map={ropeTexture} roughness={0.88} bumpMap={ropeTexture} bumpScale={0.015} color={ropeColor} />
          )}
        </mesh>
      );
    });

    // 2 frapping turns connecting the intersection
    const crossDir = new THREE.Vector3().addVectors(dirA, dirB).normalize();
    const qFrap = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), crossDir);
    [-0.5, 0.5].forEach((frapOffset, fIdx) => {
      const fPos = crossDir.clone().multiplyScalar(frapOffset * 0.018);
      loops.push(
        <mesh key={`frap-${fIdx}`} position={fPos} quaternion={qFrap} castShadow={!blueprintMode}>
          <torusGeometry args={[mainRadius * 0.85, ropeRadius * 1.35, 10, 24]} />
          {blueprintMode ? (
            <meshBasicMaterial color={bpRopeColor} transparent opacity={bpOpacity} />
          ) : (
            <meshStandardMaterial map={ropeTexture} roughness={0.88} bumpMap={ropeTexture} bumpScale={0.015} color={ropeColor} />
          )}
        </mesh>
      );
    });

  } else if (type === 'shear') {
    const avgDir = new THREE.Vector3().addVectors(dirA, dirB).normalize();
    const qAvg = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), avgDir);
    const qTorus = qAvg.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));

    [-2, -1, 0, 1, 2].forEach((i, idx) => {
      const posOffset = avgDir.clone().multiplyScalar(i * 0.024);
      loops.push(
        <mesh key={`loop-${idx}`} position={posOffset} quaternion={qTorus} scale={[1.4, 0.85, 1.0]} castShadow={!blueprintMode}>
          <torusGeometry args={[(sparA.radius + sparB.radius) * 0.85, ropeRadius, 10, 24]} />
          {blueprintMode ? (
            <meshBasicMaterial color={bpRopeColor} transparent opacity={bpOpacity} />
          ) : (
            <meshStandardMaterial map={ropeTexture} roughness={0.88} bumpMap={ropeTexture} bumpScale={0.015} color={ropeColor} />
          )}
        </mesh>
      );
    });
  } else if (type === 'tripod') {
    const qTorus = qA.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
    
    [-1.5, -0.5, 0.5, 1.5].forEach((i, idx) => {
      const posOffset = dirA.clone().multiplyScalar(i * 0.028);
      loops.push(
        <mesh key={`tri-${idx}`} position={posOffset} quaternion={qTorus} castShadow={!blueprintMode}>
          <torusGeometry args={[(sparA.radius + sparB.radius) * 1.2, ropeRadius * 1.45, 10, 24]} />
          {blueprintMode ? (
            <meshBasicMaterial color={bpRopeColor} transparent opacity={bpOpacity} />
          ) : (
            <meshStandardMaterial map={ropeTexture} roughness={0.88} bumpMap={ropeTexture} bumpScale={0.015} color={ropeColor} />
          )}
        </mesh>
      );
    });
  }

  return (
    <group
      ref={groupRef}
      visible={lashing.visible !== false}
      position={position}
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
      name="lashing"
      userData={{ id: lashing.id, type: 'lashing' }}
    >
      {loops}
    </group>
  );
};
export default LashingMesh;
