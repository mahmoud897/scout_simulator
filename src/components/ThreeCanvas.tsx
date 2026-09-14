import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore, computeBoundaryBounds, isSparOutOfBounds, isStakeOutOfBounds, hasSnapshotChanged, type ActionHistorySnapshot } from '../store/useStore';
import SparMesh from './SparMesh';
import LashingMesh from './LashingMesh';
import StakeMesh from './StakeMesh';
import GuyLineMesh from './GuyLineMesh';
import GuidePointMesh from './GuidePointMesh';
import GuideLineMesh from './GuideLineMesh';
import { findBestSnapCandidate } from '../utils/snapInference';
import { Sounds } from '../utils/sound';
import { registerCaptureHandler, unregisterCaptureHandler, performSceneCapture, type OrbitControlsLike } from '../utils/reportGenerator';

// Inner component to capture camera reference
const CameraCapture: React.FC = () => {
  const { camera } = useThree();
  const setCameraRef = useStore(state => state.setCameraRef);
  useEffect(() => {
    setCameraRef(camera);
    return () => setCameraRef(null);
  }, [camera, setCameraRef]);
  return null;
};

// Physics Stability Simulation 3D animation loop
const SimulationAnimator: React.FC = () => {
  const simulationActive = useStore(state => state.simulationActive);
  const tippingComponents = useStore(state => state.tippingComponents);

  useFrame((_, delta) => {
    if (!simulationActive || !tippingComponents || tippingComponents.length === 0) return;

    tippingComponents.forEach(comp => {
      if (comp.type === 'fall' && comp.velocity) {
        comp.velocity.y -= 9.8 * delta;
        const dy = comp.velocity.y * delta;
        comp.meshes.forEach((m: THREE.Object3D) => {
          m.position.y += dy;
          if (m.position.y < 0.05) m.position.y = 0.05;
        });
      } else if (
        (comp.type === 'pivot1' || comp.type === 'pivot2') &&
        comp.pivot &&
        comp.axis &&
        comp.speed !== undefined &&
        comp.angleRotated !== undefined
      ) {
        if (comp.angleRotated < Math.PI / 2.2) {
          const stepAngle = comp.speed * (delta * 60);
          comp.angleRotated += stepAngle;

          const qDelta = new THREE.Quaternion().setFromAxisAngle(comp.axis, stepAngle);
          comp.meshes.forEach((m: THREE.Object3D) => {
            const offset = new THREE.Vector3().subVectors(m.position, comp.pivot!);
            offset.applyQuaternion(qDelta);
            m.position.copy(comp.pivot!).add(offset);
            m.quaternion.premultiply(qDelta);
            m.updateMatrixWorld(true);
          });
        }
      }
    });
  });

  return null;
};

// Bridge to allow report generation to take multi-angle clean renders
const SceneCaptureBridge: React.FC<{ orbitRef: React.RefObject<OrbitControlsLike | null> }> = ({ orbitRef }) => {
  const { gl, scene, camera } = useThree();
  const setCaptureSceneCallback = useStore(state => state.setCaptureSceneCallback);

  useEffect(() => {
    const handler = async () => {
      return await performSceneCapture(gl, scene, camera, orbitRef.current);
    };

    setCaptureSceneCallback(handler);
    registerCaptureHandler(handler);
    (window as unknown as { __CAMP_CAPTURE_BRIDGE__?: typeof handler }).__CAMP_CAPTURE_BRIDGE__ = handler;

    return () => {
      setCaptureSceneCallback(null);
      unregisterCaptureHandler();
      delete (window as unknown as { __CAMP_CAPTURE_BRIDGE__?: typeof handler }).__CAMP_CAPTURE_BRIDGE__;
    };
  }, [gl, scene, camera, orbitRef, setCaptureSceneCallback]);

  return null;
};

export const ThreeCanvas: React.FC = () => {
  const sceneRevision = useStore(state => state.sceneRevision);
  const spars = useStore(state => state.spars);
  const lashings = useStore(state => state.lashings);
  const transformMode = useStore(state => state.transformMode);
  const blueprintMode = useStore(state => state.blueprintMode);
  const gizmoSpace = useStore(state => state.gizmoSpace);
  const pivotMode = useStore(state => state.pivotMode);
  
  const selectedSpars = useStore(state => state.selectedSpars);
  const lashingLocked = useStore(state => state.lashingLocked);
  const simulationActive = useStore(state => state.simulationActive);
  
  const stakes = useStore(state => state.stakes);
  const guyLines = useStore(state => state.guyLines);
  const selectedStake = useStore(state => state.selectedStake);
  
  const selectedGuidePoint = useStore(state => state.selectedGuidePoint);
  const selectedGuideLinePoint = useStore(state => state.selectedGuideLinePoint);
  const guideLines = useStore(state => state.guideLines);
  const guidePoints = useStore(state => state.guidePoints);
  const groundConstraintEnabled = useStore(state => state.groundConstraintEnabled);
  const gridSnappingEnabled = useStore(state => state.gridSnappingEnabled);
  const gridSize = useStore(state => state.gridSize);
  const angleSnappingEnabled = useStore(state => state.angleSnappingEnabled);
  const angleSize = useStore(state => state.angleSize);

  const boundaryEnabled = useStore(state => state.boundaryEnabled);
  const boundaryWidth = useStore(state => state.boundaryWidth);
  const boundaryLength = useStore(state => state.boundaryLength);
  const boundaryAlignment = useStore(state => state.boundaryAlignment);
  const assumeAllInsideBoundary = useStore(state => state.assumeAllInsideBoundary);

  const spawnZoneEnabled = useStore(state => state.spawnZoneEnabled);
  const spawnZoneWidth = useStore(state => state.spawnZoneWidth);
  const spawnZoneLength = useStore(state => state.spawnZoneLength);
  const spawnZoneCenter = useStore(state => state.spawnZoneCenter);
  const spawnZoneSelected = useStore(state => state.spawnZoneSelected);
  const spawnZoneVisible = useStore(state => state.spawnZoneVisible);
  const selectSpawnZone = useStore(state => state.selectSpawnZone);
  const activeSnapCandidate = useStore(state => state.activeSnapCandidate);
  
  const proximityActive = useStore(state => state.proximityActive);
  const currentProximityCandidate = useStore(state => state.currentProximityCandidate);
  
  const checkProximity = useStore(state => state.checkProximity);
  const updateLashingsDynamic = useStore(state => state.updateLashingsDynamic);
  const triggerRender = useStore(state => state.triggerRender);
  const clearSelection = useStore(state => state.clearSelection);
  const cameraFocusTarget = useStore(state => state.cameraFocusTarget);
  const setCameraFocusTarget = useStore(state => state.setCameraFocusTarget);
  const activeTool = useStore(state => state.activeTool);
  const needRenderTrigger = useStore(state => state.needRenderTrigger);
  const setContextMenu = useStore(state => state.setContextMenu);
  void needRenderTrigger;

  useEffect(() => {
    if (cameraFocusTarget && orbitRef.current) {
      const controls = orbitRef.current;
      const camera = controls.object;
      
      controls.target.copy(cameraFocusTarget);
      
      const offset = new THREE.Vector3(3, 4, 5);
      camera.position.copy(cameraFocusTarget).add(offset);
      
      camera.updateProjectionMatrix();
      controls.update();
      
      setCameraFocusTarget(null);
    }
  }, [cameraFocusTarget, setCameraFocusTarget]);

  // Check if any element goes out of bounds
  const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
  let hasViolation = false;
  if (boundaryEnabled && !assumeAllInsideBoundary) {
    hasViolation = spars.some(s => s.visible !== false && isSparOutOfBounds(s, bounds)) ||
                   stakes.some(s => s.visible !== false && isStakeOutOfBounds(s, bounds));
  }
  
  interface TransformControlsElement {
    dragging?: boolean;
    mode?: string;
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
  }

  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const transformRef = useRef<React.ComponentRef<typeof TransformControls>>(null);
  const spawnZoneGroupRef = useRef<THREE.Group | null>(null);
  const [spawnZoneGroup, setSpawnZoneGroup] = useState<THREE.Group | null>(null);

  // Synchronize spawnZoneGroup position when spawnZoneCenter changes externally (undo/redo, project load)
  useEffect(() => {
    if (spawnZoneGroupRef.current && !dragSyncActive.current) {
      spawnZoneGroupRef.current.position.set(spawnZoneCenter.x, 0, spawnZoneCenter.z);
    }
  }, [spawnZoneCenter]);

  // Group Ground Pivot Anchor
  const groupPivotRef = useRef<THREE.Group | null>(null);
  const [groupPivotMesh, setGroupPivotMesh] = useState<THREE.Group | null>(null);

  const groupPivotPos = useMemo(() => {
    if (selectedSpars.length === 0) return null;
    
    // When pivotMode is explicitly 'center' and only 1 spar is selected, let TransformControls attach directly to that spar
    if (selectedSpars.length === 1 && pivotMode === 'center') return null;

    if (selectedSpars.length === 1) {
      const s = selectedSpars[0];
      const halfL = s.length / 2;
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
      
      // Calculate two end tips of the spar
      const tipA = s.position.clone().addScaledVector(dir, halfL);
      const tipB = s.position.clone().addScaledVector(dir, -halfL);
      const baseTip = tipA.y <= tipB.y ? tipA : tipB;
      
      // Pivot is at the base footprint on ground (y = 0 or lowest point)
      const pivotY = Math.max(0, baseTip.y - s.radius);
      return new THREE.Vector3(baseTip.x, pivotY, baseTip.z);
    }

    let sumX = 0;
    let sumZ = 0;
    let minY = Infinity;
    let count = 0;

    selectedSpars.forEach(s => {
      sumX += s.position.x;
      sumZ += s.position.z;
      const halfL = s.length / 2;
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
      const lowestY = s.position.y - halfL * Math.abs(dir.y) - s.radius;
      if (lowestY < minY) minY = lowestY;
      count++;
    });

    if (count === 0) return null;
    return new THREE.Vector3(sumX / count, Math.max(0, minY), sumZ / count);
  }, [selectedSpars, sceneRevision, pivotMode]);

  useEffect(() => {
    if (groupPivotRef.current && groupPivotPos && !dragSyncActive.current) {
      groupPivotRef.current.position.copy(groupPivotPos);
      groupPivotRef.current.rotation.set(0, 0, 0);
      groupPivotRef.current.quaternion.set(0, 0, 0, 1);
      groupPivotRef.current.updateMatrixWorld(true);
    }
  }, [groupPivotPos]);

  // Rigid assembly / Multi drag sync state
  const dragSyncActive = useRef(false);
  const dragSyncLeader = useRef<THREE.Mesh | null>(null);
  const dragSyncLeaderStartInv = useRef(new THREE.Matrix4());
  const dragSyncFollowers = useRef<Array<{ mesh: THREE.Object3D; startMatrix: THREE.Matrix4 }>>([]);
  const preDragSnapshotRef = useRef<ActionHistorySnapshot | null>(null);

  const selectedSpar = selectedSpars[0];

  let selectedGuideLineMesh: THREE.Mesh | undefined = undefined;
  if (selectedGuideLinePoint) {
    const lineObj = guideLines.find(l => l.id === selectedGuideLinePoint.lineId);
    if (lineObj) {
      selectedGuideLineMesh = selectedGuideLinePoint.pointKey === 'A' ? lineObj.meshA : lineObj.meshB;
    }
  }



  // Hook matrix synchronization directly to TransformControls change events
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current as unknown as TransformControlsElement;
      
      const handleMouseDown = () => {
        if (!controls.dragging) return;
        // Capture snapshot at drag START (deferred commit - will only be recorded if transformation actually changes)
        preDragSnapshotRef.current = useStore.getState().createSceneSnapshot();
        if (orbitRef.current) orbitRef.current.enabled = false;
        
        if (spawnZoneSelected && spawnZoneGroupRef.current) {
          dragSyncActive.current = true;
          return;
        }

        if (selectedGuidePoint?.mesh || selectedGuideLineMesh) {
          dragSyncActive.current = true;
          return;
        }

        if (selectedStake?.mesh) {
          dragSyncActive.current = true;
          return;
        }

        if (selectedSpars.length === 0) return;

        // When groupPivot is active (for templates, groups, or single spar base pivot), groupPivotRef is the leader!
        if (groupPivotRef.current && groupPivotPos) {
          const leader = groupPivotRef.current;
          dragSyncLeader.current = leader as unknown as THREE.Mesh;
          leader.updateMatrixWorld(true);
          dragSyncLeaderStartInv.current.copy(leader.matrixWorld).invert();
          dragSyncFollowers.current = [];

          const followerMeshes = new Set<THREE.Object3D>();

          // All selected spars are followers
          selectedSpars.forEach(s => {
            if (s.mesh) followerMeshes.add(s.mesh);
          });

          // All group stakes are followers
          const currentGroupIds = new Set(selectedSpars.map(s => s.groupId).filter(Boolean));
          if (currentGroupIds.size > 0) {
            useStore.getState().stakes.forEach(st => {
              if (st.groupId && currentGroupIds.has(st.groupId) && st.mesh) {
                followerMeshes.add(st.mesh);
              }
            });
          }

          // All connected lashings are followers
          useStore.getState().lashings.forEach(l => {
            if (l.mesh) {
              const inGroup = l.groupId && currentGroupIds.has(l.groupId);
              const connectsSelected = selectedSpars.some(s => s.id === l.sparA.id) && selectedSpars.some(s => s.id === l.sparB.id);
              if (inGroup || connectsSelected) {
                followerMeshes.add(l.mesh);
              }
            }
          });

          followerMeshes.forEach(mesh => {
            mesh.updateMatrixWorld(true);
            dragSyncFollowers.current.push({
              mesh,
              startMatrix: mesh.matrixWorld.clone()
            });
          });

          dragSyncActive.current = true;
          return;
        }

        const leader = selectedSpars[0].mesh;
        if (!leader) return;

        dragSyncLeader.current = leader;
        leader.updateMatrixWorld(true);
        dragSyncLeaderStartInv.current.copy(leader.matrixWorld).invert();
        dragSyncFollowers.current = [];

        const followerMeshes = new Set<THREE.Object3D>();

        // Multi-select followers
        if (selectedSpars.length > 1) {
          selectedSpars.forEach(s => {
            if (s.mesh && s.mesh !== leader) {
              followerMeshes.add(s.mesh);
            }
          });
        }

        // Group stakes followers
        const currentGroupIds = new Set(selectedSpars.map(s => s.groupId).filter(Boolean));
        if (currentGroupIds.size > 0) {
          useStore.getState().stakes.forEach(st => {
            if (st.groupId && currentGroupIds.has(st.groupId) && st.mesh) {
              followerMeshes.add(st.mesh);
            }
          });
        }

        // Rigid assembly followers
        if (lashingLocked) {
          const graph = useStore.getState().lashingGraph;
          const startIds = selectedSpars.map(s => s.id);
          
          startIds.forEach(startId => {
            // BFS traversal
            const visitedSpars = new Set<string>();
            const visitedLashings = new Set<string>();
            const queue = [startId];
            visitedSpars.add(startId);

            while (queue.length > 0) {
              const curr = queue.shift()!;
              const edges = graph.get(curr);
              if (edges) {
                for (const edge of edges) {
                  visitedLashings.add(edge.lashingId);
                  if (!visitedSpars.has(edge.neighborId)) {
                    visitedSpars.add(edge.neighborId);
                    queue.push(edge.neighborId);
                  }
                }
              }
            }

            visitedSpars.forEach(id => {
              const s = useStore.getState().spars.find(x => x.id === id);
              if (s?.mesh && s.mesh !== leader) followerMeshes.add(s.mesh);
            });

            visitedLashings.forEach(id => {
              const l = useStore.getState().lashings.find(x => x.id === id);
              if (l?.mesh) followerMeshes.add(l.mesh);
            });
          });
        }

        followerMeshes.forEach(mesh => {
          mesh.updateMatrixWorld(true);
          dragSyncFollowers.current.push({
            mesh,
            startMatrix: mesh.matrixWorld.clone()
          });
        });

        dragSyncActive.current = true;
      };

      const handleObjectChange = () => {
        if (!dragSyncActive.current || !controls.dragging) return;

        if (spawnZoneSelected && spawnZoneGroupRef.current) {
          const group = spawnZoneGroupRef.current;
          group.position.y = 0; // Lock to ground height
          group.updateMatrixWorld(true);
          spawnZoneCenter.copy(group.position);
          return;
        }

        if (selectedGuidePoint?.mesh) {
          const mesh = selectedGuidePoint.mesh;
          if (groundConstraintEnabled && mesh.position.y < 0) {
            mesh.position.y = 0;
          }
          selectedGuidePoint.position.copy(mesh.position);
          useStore.getState().updateGuidePointPosition(selectedGuidePoint.id, mesh.position);
          triggerRender();
          return;
        }

        if (selectedGuideLinePoint && selectedGuideLineMesh) {
          const mesh = selectedGuideLineMesh;
          if (groundConstraintEnabled && mesh.position.y < 0) {
            mesh.position.y = 0;
          }
          useStore.getState().updateGuideLinePointPosition(
            selectedGuideLinePoint.lineId,
            selectedGuideLinePoint.pointKey,
            mesh.position
          );
          triggerRender();
          return;
        }

        if (selectedStake?.mesh) {
          const mesh = selectedStake.mesh;
          mesh.position.y = 0.1;
          mesh.updateMatrixWorld(true);
          selectedStake.position.copy(mesh.position);
          useStore.getState().updateStakePosition(selectedStake.id, mesh.position);
          triggerRender();
          return;
        }

        if (!dragSyncLeader.current) return;

        const leader = dragSyncLeader.current;
        const isGroupPivot = (groupPivotRef.current && leader === (groupPivotRef.current as unknown as THREE.Mesh));
        const leaderObj = isGroupPivot ? null : useStore.getState().spars.find(s => s.mesh === leader);

        // Ground constraint enforcement for rigid assembly or group pivot
        if (groundConstraintEnabled) {
          let maxViolation = 0;
          if (leaderObj) {
            const halfL = leaderObj.length / 2;
            const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(leader.quaternion).normalize();
            const lowestY = leader.position.y - halfL * Math.abs(dir.y) - leaderObj.radius;
            if (lowestY < 0) {
              maxViolation = Math.max(maxViolation, -lowestY);
            }
          }

          const currentMatrix = leader.matrixWorld;
          const deltaMatrix = new THREE.Matrix4().multiplyMatrices(currentMatrix, dragSyncLeaderStartInv.current);

          dragSyncFollowers.current.forEach(follower => {
            if (follower.mesh.name === 'spar') {
              const sparId = (follower.mesh.userData as { id?: string }).id;
              const sObj = useStore.getState().spars.find(x => x.id === sparId);
              if (sObj) {
                const testMat = new THREE.Matrix4().multiplyMatrices(deltaMatrix, follower.startMatrix);
                const testPos = new THREE.Vector3().setFromMatrixPosition(testMat);
                const testRot = new THREE.Quaternion().setFromRotationMatrix(testMat);
                const halfL = sObj.length / 2;
                const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(testRot).normalize();
                const lowestY = testPos.y - halfL * Math.abs(dir.y) - sObj.radius;
                if (lowestY < 0) {
                  maxViolation = Math.max(maxViolation, -lowestY);
                }
              }
            }
          });

          if (maxViolation > 0) {
            leader.position.y += maxViolation;
            leader.updateMatrixWorld(true);
          }
        }

        leader.updateMatrixWorld(true);

        // Update positions/rotations of store representations
        if (leaderObj) {
          leaderObj.position.copy(leader.position);
          leaderObj.quaternion.copy(leader.quaternion);
        }

        const currentMatrix = leader.matrixWorld;
        const deltaMatrix = new THREE.Matrix4().multiplyMatrices(currentMatrix, dragSyncLeaderStartInv.current);

        dragSyncFollowers.current.forEach(follower => {
          const newMatrix = new THREE.Matrix4().multiplyMatrices(deltaMatrix, follower.startMatrix);
          newMatrix.decompose(follower.mesh.position, follower.mesh.quaternion, follower.mesh.scale);
          follower.mesh.updateMatrixWorld(true);

          // Update back to store representations
          if (follower.mesh.name === 'spar') {
            const sparId = (follower.mesh.userData as { id?: string }).id;
            const sObj = useStore.getState().spars.find(x => x.id === sparId);
            if (sObj) {
              sObj.position.copy(follower.mesh.position);
              sObj.quaternion.copy(follower.mesh.quaternion);
            }
          } else if (follower.mesh.name === 'lashing') {
            const lashingId = (follower.mesh.userData as { id?: string }).id;
            const lObj = useStore.getState().lashings.find(x => x.id === lashingId);
            if (lObj) {
              lObj.position.copy(follower.mesh.position);
            }
          } else if (follower.mesh.name === 'stake') {
            const stakeId = (follower.mesh.userData as { id?: string }).id;
            const stObj = useStore.getState().stakes.find(x => x.id === stakeId);
            if (stObj) {
              stObj.position.copy(follower.mesh.position);
              stObj.quaternion.copy(follower.mesh.quaternion);
            }
          }
        });

        // Smart Scouting Snapping inference
        const {
          smartSnappingEnabled,
          isAltSnapSuppressed,
          lashingEndOffset,
          spars,
          guidePoints,
          setActiveSnapCandidate
        } = useStore.getState();

        if (smartSnappingEnabled && !isAltSnapSuppressed && leaderObj && controls.mode === 'translate') {
          try {
            const candidate = findBestSnapCandidate(leaderObj, spars, {
              lashingOffset: lashingEndOffset,
              groundConstraintEnabled,
              activeGuidePoints: guidePoints
            });

            const prevCandidate = useStore.getState().activeSnapCandidate;

            if (
              candidate &&
              Number.isFinite(candidate.snapTranslation.x) &&
              Number.isFinite(candidate.snapTranslation.y) &&
              Number.isFinite(candidate.snapTranslation.z)
            ) {
              // Only play sound and update state when snapping target changes
              if (!prevCandidate || prevCandidate.type !== candidate.type || prevCandidate.targetSparId !== candidate.targetSparId) {
                Sounds.playSnap();
                setActiveSnapCandidate(candidate);
              }
            } else {
              if (prevCandidate) {
                setActiveSnapCandidate(null);
              }
            }
          } catch (err) {
            console.warn('Smart snap calculation suppressed error:', err);
          }
        }

        checkProximity();
        selectedSpars.forEach(s => {
          updateLashingsDynamic(s.id);
        });
        triggerRender();
      };

      const handleMouseUp = () => {
        if (orbitRef.current) orbitRef.current.enabled = true;
        const activeSnap = useStore.getState().activeSnapCandidate;
        if (activeSnap && dragSyncLeader.current && controls.mode === 'translate') {
          const lenSq = activeSnap.snapTranslation.lengthSq();
          if (lenSq > 0.0001 && lenSq < 0.25) {
            dragSyncLeader.current.position.add(activeSnap.snapTranslation);
            dragSyncLeader.current.updateMatrixWorld(true);
            const leaderObj = useStore.getState().spars.find(s => s.id === (dragSyncLeader.current?.userData as { id?: string })?.id) || selectedSpar;
            if (leaderObj) {
              leaderObj.position.copy(dragSyncLeader.current.position);
              useStore.getState().updateLashingsDynamic(leaderObj.id);
            }
          }
        }
        if (spawnZoneSelected && spawnZoneGroupRef.current) {
          const group = spawnZoneGroupRef.current;
          group.position.y = 0;
          group.updateMatrixWorld(true);
          useStore.getState().setSpawnZoneCenter(group.position);
        }

        dragSyncActive.current = false;
        dragSyncLeader.current = null;
        dragSyncFollowers.current = [];
        useStore.getState().setActiveSnapCandidate(null);

        // Commit updated state arrays to Zustand to notify subscribers and trigger autosave
        const stateNow = useStore.getState();
        useStore.setState({
          spars: [...stateNow.spars],
          lashings: [...stateNow.lashings],
          stakes: [...stateNow.stakes],
          selectedSpars: [...stateNow.selectedSpars],
        });

        // Start-Commit verification: Only record history if an actual physical transform occurred!
        if (preDragSnapshotRef.current) {
          const currentSnapshot = useStore.getState().createSceneSnapshot();
          if (hasSnapshotChanged(preDragSnapshotRef.current, currentSnapshot)) {
            const modeLabel = controls.mode === 'rotate' ? 'تدوير خشب' : 'تحريك خشب';
            useStore.getState().saveHistoryStepWithSnapshot('drag', preDragSnapshotRef.current, modeLabel);
          }
          preDragSnapshotRef.current = null;
        }

        triggerRender();
      };

      controls.addEventListener('mouseDown', handleMouseDown);
      controls.addEventListener('change', handleObjectChange);
      controls.addEventListener('mouseUp', handleMouseUp);

      return () => {
        controls.removeEventListener('mouseDown', handleMouseDown);
        controls.removeEventListener('change', handleObjectChange);
        controls.removeEventListener('mouseUp', handleMouseUp);
      };
    }
  }, [selectedSpar, selectedSpars, groupPivotMesh, groupPivotPos, pivotMode, selectedStake, selectedGuidePoint, selectedGuideLinePoint, selectedGuideLineMesh, guideLines, lashingLocked, checkProximity, updateLashingsDynamic, triggerRender, groundConstraintEnabled, spawnZoneSelected, spawnZoneVisible, gizmoSpace]);

  return (
    <div className="w-full h-full absolute inset-0 select-none outline-none" tabIndex={0}>
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          dom.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              console.warn('WebGL context lost, auto-recovering...');
            },
            false
          );
          dom.addEventListener(
            'webglcontextrestored',
            () => {
              console.info('WebGL context successfully restored.');
              triggerRender();
            },
            false
          );
        }}
        onPointerDown={(e: React.PointerEvent) => {
          // Blur any focused input or textarea when clicking on 3D Canvas
          const activeEl = document.activeElement as HTMLElement | null;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            activeEl.blur();
          }

          if (e.button === 2) {
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' });
          } else if (e.target === e.currentTarget) {
            clearSelection();
            setContextMenu(null);
          }
        }}
      >
        <color attach="background" args={[blueprintMode ? '#0a1d37' : '#0c1219']} />
        <CameraCapture />
        <SimulationAnimator />
        <SceneCaptureBridge orbitRef={orbitRef} />
        {!blueprintMode && <fogExp2 attach="fog" args={['#0c1219', 0.018]} />}

        {/* Studio Ambient & Hemispherical Lighting */}
        <ambientLight intensity={blueprintMode ? 0.95 : 0.65} />
        <hemisphereLight 
          args={[
            blueprintMode ? '#e0f2fe' : '#fef3c7', 
            blueprintMode ? '#1e3a8a' : '#1e293b', 
            0.55
          ]} 
          position={[0, 25, 0]} 
        />

        {/* Directional Sunlight with Rich Soft Shadows */}
        {!blueprintMode && (
          <directionalLight
            castShadow
            position={[14, 24, 10]}
            intensity={1.35}
            color="#fffbeb"
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0004}
            shadow-camera-left={-18}
            shadow-camera-right={18}
            shadow-camera-top={18}
            shadow-camera-bottom={-18}
          />
        )}
        {blueprintMode && (
          <directionalLight
            position={[5, 20, 5]}
            intensity={0.8}
            color="#bae6fd"
          />
        )}

        {/* Tactical Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!blueprintMode}>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial 
            color={blueprintMode ? '#0c1e35' : '#14211a'} 
            roughness={0.9} 
            metalness={0.02} 
          />
        </mesh>
        
        {/* Plot Boundary Area Visualizers */}
        {boundaryEnabled && (
          <group>
            {/* Transparent floor representing boundary area */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.centerX, 0.005, bounds.centerZ]}>
              <planeGeometry args={[boundaryWidth, boundaryLength]} />
              <meshBasicMaterial
                color={hasViolation ? '#ef4444' : '#10b981'}
                transparent
                opacity={0.16}
                depthWrite={false}
              />
            </mesh>

            {/* Glowing borders of the boundary fence */}
            {/* Left fence (at minX) */}
            <mesh position={[bounds.minX, 0.01, bounds.centerZ]}>
              <boxGeometry args={[0.04, 0.02, boundaryLength]} />
              <meshBasicMaterial color={hasViolation ? '#f97316' : '#34d399'} />
            </mesh>
            {/* Right fence (at maxX) */}
            <mesh position={[bounds.maxX, 0.01, bounds.centerZ]}>
              <boxGeometry args={[0.04, 0.02, boundaryLength]} />
              <meshBasicMaterial color={hasViolation ? '#f97316' : '#34d399'} />
            </mesh>
            {/* Far fence (at maxZ) */}
            <mesh position={[bounds.centerX, 0.01, bounds.maxZ]}>
              <boxGeometry args={[boundaryWidth, 0.02, 0.04]} />
              <meshBasicMaterial color={hasViolation ? '#f97316' : '#34d399'} />
            </mesh>
            {/* Near fence (at minZ) */}
            <mesh position={[bounds.centerX, 0.01, bounds.minZ]}>
              <boxGeometry args={[boundaryWidth, 0.02, 0.04]} />
              <meshBasicMaterial color={hasViolation ? '#f97316' : '#34d399'} />
            </mesh>

            {/* If corner mode, render an origin pin at (0, 0) */}
            {boundaryAlignment === 'corner' && (
              <group position={[0, 0.01, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.08, 0.14, 24]} />
                  <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} transparent opacity={0.85} />
                </mesh>
                <mesh position={[0, 0.04, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.08, 12]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              </group>
            )}
          </group>
        )}

        {/* Plot Custom Spawn Zone Visualizers */}
        {spawnZoneEnabled && spawnZoneVisible && (
          <group
            ref={(node: THREE.Group | null) => {
              spawnZoneGroupRef.current = node;
              if (spawnZoneGroup !== node) {
                setSpawnZoneGroup(node);
              }
            }}
            position={[spawnZoneCenter.x, 0, spawnZoneCenter.z]}
          >
            {/* Transparent floor representing spawn zone */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 0.006, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <planeGeometry args={[spawnZoneWidth, spawnZoneLength]} />
              <meshBasicMaterial
                color={spawnZoneSelected ? '#3b82f6' : '#60a5fa'}
                transparent
                opacity={0.12}
                depthWrite={false}
              />
            </mesh>

            {/* Glowing borders of the spawn zone */}
            <mesh 
              position={[-spawnZoneWidth / 2, 0.012, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
            >
              <boxGeometry args={[0.04, 0.02, spawnZoneLength]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#60a5fa'} />
            </mesh>
            <mesh 
              position={[spawnZoneWidth / 2, 0.012, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
            >
              <boxGeometry args={[0.04, 0.02, spawnZoneLength]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#60a5fa'} />
            </mesh>
            <mesh 
              position={[0, 0.012, spawnZoneLength / 2]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
            >
              <boxGeometry args={[spawnZoneWidth, 0.02, 0.04]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#60a5fa'} />
            </mesh>
            <mesh 
              position={[0, 0.012, -spawnZoneLength / 2]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
            >
              <boxGeometry args={[spawnZoneWidth, 0.02, 0.04]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#60a5fa'} />
            </mesh>

            {/* Spawn Zone Center Anchor Marker */}
            <mesh 
              position={[0, 0.1, 0]}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectSpawnZone(true);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#3b82f6'} />
            </mesh>
            
            {/* Visual target ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
              <ringGeometry args={[0.18, 0.22, 32]} />
              <meshBasicMaterial color={spawnZoneSelected ? '#2563eb' : '#60a5fa'} side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
          </group>
        )}

        {/* Ground coordinate grid */}
        <gridHelper 
          args={[80, 80, blueprintMode ? '#38bdf8' : '#2d4739', blueprintMode ? '#1e3a8a' : '#1b2d24']} 
          position={[0, 0.001, 0]} 
        />

        {/* Render all wood poles */}
        {spars.map(spar => (
          <SparMesh key={`${spar.id}_${sceneRevision}`} spar={spar} />
        ))}

        {/* Render all ground stakes */}
        {stakes.map(stake => (
          <StakeMesh key={`${stake.id}_${sceneRevision}`} stake={stake} />
        ))}

        {/* Render all guide points */}
        {guidePoints.map(point => (
          <GuidePointMesh key={`${point.id}_${sceneRevision}`} point={point} />
        ))}

        {/* Render all guide lines */}
        {guideLines.map(line => (
          <GuideLineMesh key={`${line.id}_${sceneRevision}`} line={line} />
        ))}

        {/* Render all flexible guy ropes */}
        {guyLines.map(guyLine => (
          <GuyLineMesh key={`${guyLine.id}_${sceneRevision}`} guyLine={guyLine} />
        ))}

        {/* Render all rope lashings */}
        {lashings.map(lashing => (
          <LashingMesh key={`${lashing.id}_${sceneRevision}`} lashing={lashing} />
        ))}

        {/* Dynamic smart snapping 3D indicators - 100% pure Three.js meshes */}
        {activeSnapCandidate && Number.isFinite(activeSnapCandidate.targetPoint.x) && (
          <group>
            {/* Target Snap Ring & Core */}
            <group position={[activeSnapCandidate.targetPoint.x, activeSnapCandidate.targetPoint.y, activeSnapCandidate.targetPoint.z]}>
              <mesh>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshBasicMaterial color={activeSnapCandidate.color} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.15, 0.23, 24]} />
                <meshBasicMaterial color={activeSnapCandidate.color} side={THREE.DoubleSide} transparent opacity={0.8} />
              </mesh>
            </group>

            {/* Source Point on Moving Spar */}
            {Number.isFinite(activeSnapCandidate.sourcePoint.x) && (
              <mesh position={[activeSnapCandidate.sourcePoint.x, activeSnapCandidate.sourcePoint.y, activeSnapCandidate.sourcePoint.z]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshBasicMaterial color={activeSnapCandidate.color} transparent opacity={0.85} />
              </mesh>
            )}
          </group>
        )}

        {/* Dynamic snapping connection ring */}
        {proximityActive && currentProximityCandidate && (
          <group position={currentProximityCandidate.point}>
            <mesh>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={0xeab308} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.18, 0.22, 16]} />
              <meshBasicMaterial color={0xeab308} side={THREE.DoubleSide} transparent opacity={0.8} />
            </mesh>
          </group>
        )}

        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minDistance={1}
          maxDistance={40}
          enabled={!activeTool}
        />

        {/* Group Ground Pivot Target Object */}
        <group
          ref={(node) => {
            groupPivotRef.current = node;
            if (node && node !== groupPivotMesh) setGroupPivotMesh(node);
          }}
        />

        {/* Dynamic Transform gizmos for Ground Pivot (when template, group, or base pivot is active) */}
        {selectedSpars.length > 0 && groupPivotMesh && groupPivotPos && !simulationActive && (
          <>
            {/* Visual Ground Anchor Disc */}
            <group position={groupPivotPos}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.26, 0.34, 36]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.75} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[0.09, 24]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} />
              </mesh>
              {[-0.42, 0.42].map(offset => (
                <React.Fragment key={offset}>
                  <mesh position={[offset, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.12, 0.025]} />
                    <meshBasicMaterial color="#f59e0b" />
                  </mesh>
                  <mesh position={[0, 0.02, offset]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.025, 0.12]} />
                    <meshBasicMaterial color="#f59e0b" />
                  </mesh>
                </React.Fragment>
              ))}
            </group>

            <TransformControls
              ref={transformRef}
              object={groupPivotMesh}
              mode={transformMode}
              space="world"
              size={0.9}
              translationSnap={gridSnappingEnabled ? gridSize : null}
              rotationSnap={angleSnappingEnabled ? THREE.MathUtils.degToRad(angleSize) : null}
            />
          </>
        )}

        {/* Dynamic Transform gizmos for Single Spar in Center / Local mode */}
        {selectedSpars.length === 1 && !groupPivotPos && selectedSpar?.mesh && selectedSpar.visible !== false && !simulationActive && (
          <TransformControls
            ref={transformRef}
            object={selectedSpar.mesh}
            mode={transformMode}
            space={gizmoSpace}
            size={0.85}
            translationSnap={gridSnappingEnabled ? gridSize : null}
            rotationSnap={angleSnappingEnabled ? THREE.MathUtils.degToRad(angleSize) : null}
          />
        )}

        {/* Dynamic Transform gizmos for Stake */}
        {selectedStake?.mesh && selectedStake.visible !== false && !simulationActive && (
          <TransformControls
            ref={transformRef}
            object={selectedStake.mesh}
            mode="translate"
            size={0.85}
            translationSnap={gridSnappingEnabled ? gridSize : null}
          />
        )}

        {/* Dynamic Transform gizmos for Guide Point */}
        {selectedGuidePoint?.mesh && selectedGuidePoint.visible !== false && !simulationActive && (
          <TransformControls
            ref={transformRef}
            object={selectedGuidePoint.mesh}
            mode="translate"
            size={0.85}
            translationSnap={gridSnappingEnabled ? gridSize : null}
          />
        )}

        {/* Dynamic Transform gizmos for Guide Line Point */}
        {selectedGuideLineMesh && guideLines.find(l => l.id === selectedGuideLinePoint?.lineId)?.visible !== false && !simulationActive && (
          <TransformControls
            ref={transformRef}
            object={selectedGuideLineMesh}
            mode="translate"
            size={0.85}
            translationSnap={gridSnappingEnabled ? gridSize : null}
          />
        )}

        {/* Dynamic Transform gizmos for Spawn Zone */}
        {spawnZoneSelected && spawnZoneGroup && !simulationActive && (
          <TransformControls
            ref={transformRef}
            object={spawnZoneGroup}
            mode="translate"
            size={0.85}
            translationSnap={gridSnappingEnabled ? gridSize : null}
          />
        )}
      </Canvas>
    </div>
  );
};
export default ThreeCanvas;
