import { create } from 'zustand';
import * as THREE from 'three';
import { getClosestPointsBetweenSegments, checkWoodNearPosition } from '../utils/math';
import { Sounds, type SoundProfile } from '../utils/sound';
import { scoutingTemplates } from '../utils/templateBuilders';
import type { SnapCandidate } from '../utils/snapInference';
import type { CampSnapshot } from '../utils/reportGenerator';

export interface Spar {
  id: string;
  type: string;
  length: number;
  radius: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  mesh?: THREE.Mesh;
  name?: string;
  visible?: boolean;
  groupId?: string;
}

export interface Lashing {
  id: string;
  type: string;
  sparA: Spar;
  sparB: Spar;
  position: THREE.Vector3;
  angle: number;
  mesh?: THREE.Group;
  name?: string;
  visible?: boolean;
  groupId?: string;
}

export interface Stake {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  mesh?: THREE.Mesh;
  name?: string;
  visible?: boolean;
  groupId?: string;
}

export interface GuyLine {
  id: string;
  sparId: string;
  stakeId: string;
  sparHeightOffset: number; // distance from spar center
  tension: number; // 0 to 1
  mesh?: THREE.Mesh;
  name?: string;
  visible?: boolean;
  groupId?: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: 'اساسي' | 'خيام' | 'جسور' | 'مطبخ' | 'ادوات';
  createdAt: string;
  spars: Array<{
    type: string;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
  }>;
  lashings: Array<{
    type: string;
    sparAIndex: number;
    sparBIndex: number;
    position: { x: number; y: number; z: number };
    angle: number;
  }>;
  stakes?: Array<{
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
  }>;
  guyLines?: Array<{
    sparIndex: number;
    stakeIndex: number;
    sparHeightOffset: number;
    tension: number;
  }>;
}

export interface ProximityCandidate {
  sparA: Spar;
  sparB: Spar;
  point: THREE.Vector3;
  angle: number;
  type: string;
}

export interface ActionHistorySnapshot {
  spars: Array<{
    id: string;
    type: string;
    length: number;
    radius: number;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    name?: string;
    visible?: boolean;
    groupId?: string;
  }>;
  lashings: Array<{
    id: string;
    type: string;
    sparAId: string;
    sparBId: string;
    position: THREE.Vector3;
    angle: number;
    name?: string;
    visible?: boolean;
    groupId?: string;
  }>;
  stakes: Array<{
    id: string;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    name?: string;
    visible?: boolean;
    groupId?: string;
  }>;
  guyLines: Array<{
    id: string;
    sparId: string;
    stakeId: string;
    sparHeightOffset: number;
    tension: number;
    name?: string;
    visible?: boolean;
  }>;
  guidePoints: Array<{
    id: string;
    position: THREE.Vector3;
    name?: string;
    visible?: boolean;
  }>;
  guideLines: Array<{
    id: string;
    pointA: THREE.Vector3;
    pointB: THREE.Vector3;
    name?: string;
    visible?: boolean;
  }>;
  selectedSparIds: string[];
  selectedStakeId?: string;
  selectedLashingId?: string;
  selectedGuyLineId?: string;
  selectedGuidePointId?: string;
  selectedGuideLinePoint?: { lineId: string; pointKey: 'A' | 'B' } | null;
}

export interface ActionHistoryStep {
  action: string;
  label?: string;
  timestamp?: number;
  snapshot: ActionHistorySnapshot;
}

export interface GuidePoint {
  id: string;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
  name?: string;
  visible?: boolean;
}

export interface GuideLine {
  id: string;
  pointA: THREE.Vector3;
  pointB: THREE.Vector3;
  meshA?: THREE.Mesh;
  meshB?: THREE.Mesh;
  name?: string;
  visible?: boolean;
}

export type BoundaryAlignment = 'corner' | 'center-grid' | 'center';

export function computeBoundaryBounds(width: number, length: number, alignment: BoundaryAlignment = 'corner') {
  if (alignment === 'corner') {
    return {
      minX: 0,
      maxX: width,
      minZ: 0,
      maxZ: length,
      centerX: width / 2,
      centerZ: length / 2
    };
  } else if (alignment === 'center-grid') {
    const halfW = width / 2;
    const halfL = length / 2;
    const minX = -Math.floor(halfW);
    const maxX = Math.ceil(halfW);
    const minZ = -Math.floor(halfL);
    const maxZ = Math.ceil(halfL);
    return {
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2
    };
  } else {
    const halfW = width / 2;
    const halfL = length / 2;
    return {
      minX: -halfW,
      maxX: halfW,
      minZ: -halfL,
      maxZ: halfL,
      centerX: 0,
      centerZ: 0
    };
  }
}

export function isSparOutOfBounds(
  spar: Spar, 
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  margin = 0.02
): boolean {
  // Check center position
  if (
    spar.position.x < bounds.minX - margin || 
    spar.position.x > bounds.maxX + margin || 
    spar.position.z < bounds.minZ - margin || 
    spar.position.z > bounds.maxZ + margin
  ) {
    return true;
  }
  // Check both tip endpoints along spar local Y axis
  const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion);
  const halfL = (spar.length || 3.0) / 2;
  const tip1X = spar.position.x + dir.x * halfL;
  const tip1Z = spar.position.z + dir.z * halfL;
  const tip2X = spar.position.x - dir.x * halfL;
  const tip2Z = spar.position.z - dir.z * halfL;

  if (tip1X < bounds.minX - margin || tip1X > bounds.maxX + margin || tip1Z < bounds.minZ - margin || tip1Z > bounds.maxZ + margin) {
    return true;
  }
  if (tip2X < bounds.minX - margin || tip2X > bounds.maxX + margin || tip2Z < bounds.minZ - margin || tip2Z > bounds.maxZ + margin) {
    return true;
  }

  return false;
}

export function isStakeOutOfBounds(
  stake: Stake, 
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  margin = 0.02
): boolean {
  return (
    stake.position.x < bounds.minX - margin || 
    stake.position.x > bounds.maxX + margin || 
    stake.position.z < bounds.minZ - margin || 
    stake.position.z > bounds.maxZ + margin
  );
}

export const SPAR_TYPES: Record<string, { length: number; radius: number; mass: number }> = {
  stave: { length: 1.0, radius: 0.025, mass: 1 },
  medium: { length: 3.0, radius: 0.04, mass: 4 },
  long: { length: 4.0, radius: 0.05, mass: 7 },
  xlong: { length: 5.0, radius: 0.05, mass: 10 }
};

export interface TippingComponent {
  meshes: THREE.Object3D[];
  type: 'fall' | 'pivot1' | 'pivot2';
  velocity?: THREE.Vector3;
  pivot?: THREE.Vector3;
  axis?: THREE.Vector3;
  angleRotated?: number;
  speed?: number;
  tipDir?: THREE.Vector3;
}

interface StoreState {
  spars: Spar[];
  lashings: Lashing[];
  lashingGraph: Map<string, Set<{ neighborId: string; lashingId: string }>>;
  
  selectedSpars: Spar[];
  selectedLashing: Lashing | null;
  multiSelectActive: boolean;
  lashingLocked: boolean;
  transformMode: 'translate' | 'rotate';
  activeTool: 'select_box' | 'select_lasso' | null;
  soundEnabled: boolean;
  soundVolume: number;
  soundProfile: SoundProfile;
  
  proximityActive: boolean;
  currentProximityCandidate: ProximityCandidate | null;
  
  simulationActive: boolean;
  simulationStateSaved: {
    spars: Array<{ id: string; position: THREE.Vector3; rotation: THREE.Quaternion }>;
    lashings: Array<{ id: string; position: THREE.Vector3 }>;
  } | null;
  tippingComponents: TippingComponent[];
  
  stakes: Stake[];
  guyLines: GuyLine[];
  guyLinePlacementActive: boolean;
  guyLineSourceSparId: string | null;
  selectedStake: Stake | null;
  selectedGuyLine: GuyLine | null;
  
  boundaryEnabled: boolean;
  boundaryWidth: number;
  boundaryLength: number;
  boundaryAlignment: BoundaryAlignment;
  assumeAllInsideBoundary: boolean;
  blueprintMode: boolean;

  spawnZoneEnabled: boolean;
  spawnZoneWidth: number;
  spawnZoneLength: number;
  spawnZoneCenter: THREE.Vector3;
  spawnZoneSelected: boolean;
  spawnZoneVisible: boolean;

  guidePoints: GuidePoint[];
  guideLines: GuideLine[];
  selectedGuidePoint: GuidePoint | null;
  selectedGuideLine: GuideLine | null;
  selectedGuideLinePoint: { lineId: string; pointKey: 'A' | 'B' } | null;
  selectedSourceSparPoint: { sparId: string; pointKey: 'start' | 'end' | 'start_lash' | 'end_lash' | 'midpoint' | 'third_1' | 'third_2' } | null;
  selectedTargetPoint: { position: THREE.Vector3; label: string } | null;
  groundConstraintEnabled: boolean;
  gridSnappingEnabled: boolean;
  gridSize: number;
  angleSnappingEnabled: boolean;
  angleSize: number;
  smartSnappingEnabled: boolean;
  toggleSmartSnapping: () => void;
  setSmartSnappingEnabled: (enabled: boolean) => void;
  lashingEndOffset: number;
  setLashingEndOffset: (offset: number) => void;
  activeSnapCandidate: SnapCandidate | null;
  setActiveSnapCandidate: (candidate: SnapCandidate | null) => void;
  isAltSnapSuppressed: boolean;
  setIsAltSnapSuppressed: (suppressed: boolean) => void;
  toggleGridSnapping: () => void;
  setGridSize: (size: number) => void;
  toggleAngleSnapping: () => void;
  setAngleSize: (angle: number) => void;
  createLinearArray: (sparId: string, count: number, distance: number, axis: 'x' | 'y' | 'z') => void;
  dropFlatEnabled: boolean;
  toggleDropFlat: () => void;
  setDropFlatEnabled: (enabled: boolean) => void;
  
  actionHistory: ActionHistoryStep[];
  needRenderTrigger: number;
  sceneRevision: number;
  
  triggerRender: () => void;
  setSparMesh: (id: string, mesh: THREE.Mesh) => void;
  setLashingMesh: (id: string, mesh: THREE.Group) => void;
  setStakeMesh: (id: string, mesh: THREE.Mesh) => void;
  setGuidePointMesh: (id: string, mesh: THREE.Mesh) => void;
  setGuideLinePointMesh: (id: string, pointKey: 'A' | 'B', mesh: THREE.Mesh) => void;
  
  addSpar: (type: string, position?: THREE.Vector3, rotation?: THREE.Quaternion, recordHistory?: boolean) => Spar;
  addSparAlongSegment: (type: string, pA: THREE.Vector3, pB: THREE.Vector3, recordHistory?: boolean) => Spar;
  deleteSparById: (id: string, recordHistory?: boolean) => void;
  addLashing: (sparA: Spar, sparB: Spar, point: THREE.Vector3, angle: number, type: string, recordHistory?: boolean, triggerSnap?: boolean) => Lashing | null;
  breakLashingById: (id: string, recordHistory?: boolean) => void;
  
  addStake: (position?: THREE.Vector3, recordHistory?: boolean) => Stake;
  deleteStake: (id: string, recordHistory?: boolean) => void;
  updateStakePosition: (id: string, position: THREE.Vector3) => void;
  selectStake: (stake: Stake | null) => void;
  
  startGuyLinePlacement: (sparId: string) => void;
  cancelGuyLinePlacement: () => void;
  addGuyLine: (sparId: string, stakeId: string, recordHistory?: boolean) => GuyLine | null;
  deleteGuyLine: (id: string, recordHistory?: boolean) => void;
  setGuyLineTension: (id: string, tension: number) => void;
  selectGuyLine: (guyLine: GuyLine | null) => void;
  
  toggleSparSelection: (spar: Spar, append?: boolean, forceSingle?: boolean) => void;
  selectAssembly: (spar: Spar) => void;
  selectMultipleSpars: (spars: Spar[], append?: boolean) => void;
  selectAll: () => void;
  selectLashing: (lashing: Lashing) => void;
  clearSelection: () => void;
  
  deleteSelected: (recordHistory?: boolean) => void;
  undo: () => { success: boolean; label?: string } | void;
  clearScene: () => void;
  
  setTransformMode: (mode: 'translate' | 'rotate') => void;
  setActiveTool: (tool: 'select_box' | 'select_lasso' | null) => void;
  toggleLashingLock: () => void;
  toggleMultiSelect: () => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  setSoundProfile: (profile: SoundProfile) => void;
  
  checkProximity: (movingMeshId?: string) => void;
  updateLashingsDynamic: (movingMeshId: string) => void;
  
  buildTripodTemplate: () => void;
  buildAFrameTemplate: () => void;
  buildPlatformTowerTemplate: () => void;
  
  runStabilitySimulation: () => void;
  stopStabilitySimulation: () => void;
  
  toggleBoundary: () => void;
  setBoundaryDimensions: (width: number, length: number) => void;
  setBoundaryAlignment: (alignment: BoundaryAlignment) => void;
  toggleAssumeAllInsideBoundary: (val?: boolean) => void;
  getOutOfBoundsSpars: () => Spar[];
  focusNextOutOfBoundsSpar: () => void;
  selectOutOfBoundsSpars: () => void;
  selectInsideBoundarySpars: () => void;
  moveOutOfBoundsSparsInside: () => void;
  addGuidePointAtOrigin: () => void;

  toggleSpawnZone: () => void;
  setSpawnZoneDimensions: (width: number, length: number) => void;
  setSpawnZoneCenter: (center: THREE.Vector3) => void;
  selectSpawnZone: (selected: boolean) => void;
  toggleSpawnZoneVisibility: () => void;

  addGuidePoint: (position?: THREE.Vector3, recordHistory?: boolean) => GuidePoint;
  deleteGuidePoint: (id: string, recordHistory?: boolean) => void;
  selectGuidePoint: (point: GuidePoint | null) => void;
  updateGuidePointPosition: (id: string, position: THREE.Vector3) => void;
  
  addGuideLine: (pointA?: THREE.Vector3, pointB?: THREE.Vector3, recordHistory?: boolean) => GuideLine;
  deleteGuideLine: (id: string, recordHistory?: boolean) => void;
  selectGuideLine: (line: GuideLine | null) => void;
  selectGuideLinePoint: (lineId: string | null, pointKey?: 'A' | 'B') => void;
  updateGuideLinePointPosition: (id: string, pointKey: 'A' | 'B', position: THREE.Vector3) => void;

  selectSourceSparPoint: (sparId: string | null, pointKey?: 'start' | 'end' | 'start_lash' | 'end_lash' | 'midpoint' | 'third_1' | 'third_2') => void;
  selectTargetPoint: (position: THREE.Vector3 | null, label?: string) => void;
  
  moveSparToTarget: () => void;
  dropSparToGround: () => void;
  toggleGroundConstraint: () => void;
  toggleBlueprintMode: () => void;
  setBlueprintMode: (mode: boolean) => void;
  exportToJSON: () => string;
  importFromJSON: (jsonStr: string) => boolean;
  saveBlueprintLocal: (name: string) => void;
  loadBlueprintLocal: (name: string) => void;
  deleteBlueprintLocal: (name: string) => void;
  getLocalBlueprintNames: () => string[];
  duplicateSelectedSpar: () => void;
  alignSelectedSpar: () => void;
  buildScoutBridgeTemplate: () => void;
  buildTemplate: (templateId: string, rotationDegrees?: number) => void;
  customTemplates: CustomTemplate[];
  saveCustomTemplate: (name: string, description?: string, category?: string) => string | null;
  deleteCustomTemplate: (id: string) => void;
  batchBuilding: boolean;
  nudgeSelectedSpars: (axis: 'x' | 'y' | 'z', amount: number) => void;
  rotateSelectedSpars: (axis: 'x' | 'y' | 'z', angleDeg: number) => void;
  snapSparPointToTarget: (sparId: string, pointKey: 'start' | 'end' | 'start_lash' | 'end_lash' | 'midpoint' | 'third_1' | 'third_2', targetPos: THREE.Vector3) => void;
  alignSparBetweenPoints: (
    sparId: string,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    options?: {
      adjustLength?: boolean;
      hasWoodAtStart?: boolean;
      hasWoodAtEnd?: boolean;
      startOffset?: number;
      endOffset?: number;
      autoLash?: boolean;
    }
  ) => void;
  addGuidePointAtPosition: (position: THREE.Vector3) => void;
  createSceneSnapshot: () => ActionHistorySnapshot;
  saveHistoryStep: (actionName: string, customLabel?: string) => void;
  saveHistoryStepWithSnapshot: (actionName: string, snapshot: ActionHistorySnapshot, customLabel?: string) => void;
  historyToastMessage: string | null;
  setHistoryToastMessage: (msg: string | null) => void;

  cameraFocusTarget: THREE.Vector3 | null;
  cameraRef: THREE.Camera | null;
  setCameraRef: (camera: THREE.Camera | null) => void;
  captureSceneCallback: (() => Promise<CampSnapshot[]>) | null;
  setCaptureSceneCallback: (cb: (() => Promise<CampSnapshot[]>) | null) => void;
  setCameraFocusTarget: (target: THREE.Vector3 | null) => void;
  setItemName: (type: 'spar' | 'stake' | 'lashing' | 'guyLine' | 'guidePoint' | 'guideLine', id: string, name: string) => void;
  toggleItemVisibility: (type: 'spar' | 'stake' | 'lashing' | 'guyLine' | 'guidePoint' | 'guideLine', id: string) => void;

  actionRedoHistory: ActionHistoryStep[];
  updateSparDimensions: (id: string, length: number, radius: number) => void;
  groupSelectedSpars: () => void;
  ungroupSelectedSpars: () => void;
  redo: () => { success: boolean; label?: string } | void;
  contextMenu: { x: number; y: number; type: 'canvas' | 'spar' | 'lashing' | 'stake' | 'guyLine' | 'guidePoint' | 'guideLine'; targetId?: string } | null;
  setContextMenu: (menu: { x: number; y: number; type: 'canvas' | 'spar' | 'lashing' | 'stake' | 'guyLine' | 'guidePoint' | 'guideLine'; targetId?: string } | null) => void;

  gizmoSpace: 'world' | 'local';
  toggleGizmoSpace: () => void;
  setGizmoSpace: (space: 'world' | 'local') => void;

  pivotMode: 'center' | 'base';
  togglePivotMode: () => void;
  setPivotMode: (mode: 'center' | 'base') => void;

  snapHandlesVisible: boolean;
  toggleSnapHandles: () => void;
  setSnapHandlesVisible: (visible: boolean) => void;

  tieSelectedSpars: (type?: string) => Lashing | null;
  setSparPosition: (id: string, position: THREE.Vector3) => void;
  setSparRotationEuler: (id: string, eulerDeg: { x: number; y: number; z: number }) => void;
}

const loadCustomTemplatesFromStorage = (): CustomTemplate[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('scout_custom_templates');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  } catch {
    return [];
  }
};

export const useStore = create<StoreState>((set, get) => ({
  customTemplates: loadCustomTemplatesFromStorage(),
  batchBuilding: false,
  spars: [],
  lashings: [],
  lashingGraph: new Map(),
  
  selectedSpars: [],
  selectedLashing: null,
  multiSelectActive: false,
  lashingLocked: true,
  transformMode: 'translate',
  activeTool: null,
  soundEnabled: Sounds.getEnabled(),
  soundVolume: Sounds.getVolume(),
  soundProfile: Sounds.getProfile(),
  
  proximityActive: false,
  currentProximityCandidate: null,
  
  simulationActive: false,
  simulationStateSaved: null,
  tippingComponents: [],
  
  stakes: [],
  guyLines: [],
  guyLinePlacementActive: false,
  guyLineSourceSparId: null,
  selectedStake: null,
  selectedGuyLine: null,
  
  boundaryEnabled: false,
  boundaryWidth: 5,
  boundaryLength: 10,
  boundaryAlignment: 'corner',
  assumeAllInsideBoundary: false,
  blueprintMode: false,
  
  spawnZoneEnabled: false,
  spawnZoneWidth: 5,
  spawnZoneLength: 5,
  spawnZoneCenter: new THREE.Vector3(0, 0, 0),
  spawnZoneSelected: false,
  spawnZoneVisible: true,
  
  guidePoints: [],
  guideLines: [],
  selectedGuidePoint: null,
  selectedGuideLine: null,
  selectedGuideLinePoint: null,
  selectedSourceSparPoint: null,
  selectedTargetPoint: null,
  groundConstraintEnabled: true,
  gridSnappingEnabled: false,
  gridSize: 0.25,
  angleSnappingEnabled: false,
  angleSize: 15,
  smartSnappingEnabled: true,
  lashingEndOffset: 0.07,
  activeSnapCandidate: null,
  isAltSnapSuppressed: false,
  dropFlatEnabled: true,

  gizmoSpace: 'world',
  toggleGizmoSpace: () => set(state => {
    const next = state.gizmoSpace === 'world' ? 'local' : 'world';
    return { gizmoSpace: next };
  }),
  setGizmoSpace: (space) => set({ gizmoSpace: space }),

  pivotMode: 'base',
  togglePivotMode: () => set(state => {
    const next = state.pivotMode === 'center' ? 'base' : 'center';
    return { pivotMode: next };
  }),
  setPivotMode: (mode) => set({ pivotMode: mode }),

  snapHandlesVisible: true,
  toggleSnapHandles: () => set(state => ({ snapHandlesVisible: !state.snapHandlesVisible })),
  setSnapHandlesVisible: (visible) => set({ snapHandlesVisible: visible }),

  cameraFocusTarget: null,
  cameraRef: null,
  setCameraRef: (camera) => set({ cameraRef: camera }),
  captureSceneCallback: null,
  setCaptureSceneCallback: (cb) => set({ captureSceneCallback: cb }),
  setCameraFocusTarget: (target) => {
    set({ cameraFocusTarget: target });
    get().triggerRender();
  },

  setItemName: (type, id, name) => {
    get().saveHistoryStep('setItemName');
    set(state => {
      if (type === 'spar') {
        const spars = state.spars.map(s => s.id === id ? { ...s, name } : s);
        const selectedSpars = state.selectedSpars.map(s => s.id === id ? { ...s, name } : s);
        return { spars, selectedSpars };
      } else if (type === 'stake') {
        const stakes = state.stakes.map(s => s.id === id ? { ...s, name } : s);
        const selectedStake = state.selectedStake?.id === id ? { ...state.selectedStake, name } : state.selectedStake;
        return { stakes, selectedStake };
      } else if (type === 'lashing') {
        const lashings = state.lashings.map(l => l.id === id ? { ...l, name } : l);
        const selectedLashing = state.selectedLashing?.id === id ? { ...state.selectedLashing, name } : state.selectedLashing;
        return { lashings, selectedLashing };
      } else if (type === 'guyLine') {
        const guyLines = state.guyLines.map(g => g.id === id ? { ...g, name } : g);
        const selectedGuyLine = state.selectedGuyLine?.id === id ? { ...state.selectedGuyLine, name } : state.selectedGuyLine;
        return { guyLines, selectedGuyLine };
      } else if (type === 'guidePoint') {
        const guidePoints = state.guidePoints.map(p => p.id === id ? { ...p, name } : p);
        const selectedGuidePoint = state.selectedGuidePoint?.id === id ? { ...state.selectedGuidePoint, name } : state.selectedGuidePoint;
        return { guidePoints, selectedGuidePoint };
      } else if (type === 'guideLine') {
        const guideLines = state.guideLines.map(l => l.id === id ? { ...l, name } : l);
        const selectedGuideLine = state.selectedGuideLine?.id === id ? { ...state.selectedGuideLine, name } : state.selectedGuideLine;
        return { guideLines, selectedGuideLine };
      }
      return {};
    });
    get().triggerRender();
  },

  toggleItemVisibility: (type, id) => {
    get().saveHistoryStep('toggleItemVisibility');
    set(state => {
      let isHiding = false;
      const findAndToggle = <T extends { id: string; visible?: boolean }>(list: T[]): T[] => list.map(item => {
        if (item.id === id) {
          const nextVal = item.visible === false;
          isHiding = !nextVal;
          return { ...item, visible: nextVal };
        }
        return item;
      });

      if (type === 'spar') {
        const spars = findAndToggle(state.spars);
        let selectedSpars = [...state.selectedSpars];
        if (isHiding) {
          selectedSpars = selectedSpars.filter(s => s.id !== id);
        }
        return { spars, selectedSpars };
      } else if (type === 'stake') {
        const stakes = findAndToggle(state.stakes);
        let selectedStake = state.selectedStake;
        if (isHiding && selectedStake?.id === id) {
          selectedStake = null;
        }
        return { stakes, selectedStake };
      } else if (type === 'lashing') {
        const lashings = findAndToggle(state.lashings);
        let selectedLashing = state.selectedLashing;
        if (isHiding && selectedLashing?.id === id) {
          selectedLashing = null;
        }
        return { lashings, selectedLashing };
      } else if (type === 'guyLine') {
        const guyLines = findAndToggle(state.guyLines);
        let selectedGuyLine = state.selectedGuyLine;
        if (isHiding && selectedGuyLine?.id === id) {
          selectedGuyLine = null;
        }
        return { guyLines, selectedGuyLine };
      } else if (type === 'guidePoint') {
        const guidePoints = findAndToggle(state.guidePoints);
        let selectedGuidePoint = state.selectedGuidePoint;
        if (isHiding && selectedGuidePoint?.id === id) {
          selectedGuidePoint = null;
        }
        return { guidePoints, selectedGuidePoint };
      } else if (type === 'guideLine') {
        const guideLines = findAndToggle(state.guideLines);
        let selectedGuideLine = state.selectedGuideLine;
        let selectedGuideLinePoint = state.selectedGuideLinePoint;
        if (isHiding) {
          if (selectedGuideLine?.id === id) {
            selectedGuideLine = null;
          }
          if (selectedGuideLinePoint?.lineId === id) {
            selectedGuideLinePoint = null;
          }
        }
        return { guideLines, selectedGuideLine, selectedGuideLinePoint };
      }
      return {};
    });
    get().triggerRender();
  },

  actionHistory: [],
  actionRedoHistory: [],
  historyToastMessage: null,
  setHistoryToastMessage: (msg) => set({ historyToastMessage: msg }),
  createSceneSnapshot: () => createSceneSnapshotFromState(get()),
  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),
  needRenderTrigger: 0,
  sceneRevision: 0,
  
  triggerRender: () => set(state => ({ needRenderTrigger: state.needRenderTrigger + 1 })),
  
  setSparMesh: (id, mesh) => {
    set(state => {
      const spars = state.spars.map(s => s.id === id ? { ...s, mesh } : s);
      const selectedSpars = state.selectedSpars.map(s => s.id === id ? { ...s, mesh } : s);
      return { spars, selectedSpars };
    });
    get().triggerRender();
  },

  setLashingMesh: (id, mesh) => {
    set(state => {
      const lashings = state.lashings.map(l => l.id === id ? { ...l, mesh } : l);
      const selectedLashing = state.selectedLashing?.id === id ? { ...state.selectedLashing, mesh } : state.selectedLashing;
      return { lashings, selectedLashing };
    });
    get().triggerRender();
  },

  setStakeMesh: (id, mesh) => {
    set(state => {
      const stakes = state.stakes.map(s => s.id === id ? { ...s, mesh } : s);
      const selectedStake = state.selectedStake?.id === id ? { ...state.selectedStake, mesh } : state.selectedStake;
      return { stakes, selectedStake };
    });
    get().triggerRender();
  },

  setGuidePointMesh: (id, mesh) => {
    set(state => {
      const guidePoints = state.guidePoints.map(p => p.id === id ? { ...p, mesh } : p);
      const selected = state.selectedGuidePoint?.id === id ? { ...state.selectedGuidePoint, mesh } : state.selectedGuidePoint;
      return { guidePoints, selectedGuidePoint: selected };
    });
    get().triggerRender();
  },

  setGuideLinePointMesh: (id, pointKey, mesh) => {
    set(state => {
      const guideLines = state.guideLines.map(l => {
        if (l.id === id) {
          return {
            ...l,
            [pointKey === 'A' ? 'meshA' : 'meshB']: mesh
          };
        }
        return l;
      });
      const selected = state.selectedGuideLine?.id === id ? guideLines.find(x => x.id === id)! : state.selectedGuideLine;
      return { guideLines, selectedGuideLine: selected };
    });
    get().triggerRender();
  },

  addStake: (position, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addStake');
    const id = THREE.MathUtils.generateUUID();
    let pos: THREE.Vector3;
    if (position) {
      pos = position.clone();
    } else if (get().spawnZoneEnabled) {
      const rx = get().spawnZoneCenter.x + (Math.random() - 0.5) * get().spawnZoneWidth;
      const rz = get().spawnZoneCenter.z + (Math.random() - 0.5) * get().spawnZoneLength;
      pos = new THREE.Vector3(rx, 0.1, rz);
    } else {
      pos = new THREE.Vector3((Math.random() - 0.5) * 2, 0.1, (Math.random() - 0.5) * 2);
    }
    pos.y = 0.1;
    const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, 0));
    
    const newStake: Stake = {
      id,
      position: pos,
      quaternion: rot,
      name: `وتد تثبيت ${get().stakes.length + 1}`,
      visible: true
    };
    
    set(state => ({
      stakes: [...state.stakes, newStake]
    }));
    
    if (!get().batchBuilding) {
      Sounds.playThud();
      get().clearSelection();
      get().selectStake(newStake);
    }
    get().triggerRender();
    return newStake;
  },

  deleteStake: (id, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('deleteStake');
    // Delete connected guy lines
    const connected = get().guyLines.filter(g => g.stakeId === id);
    connected.forEach(g => {
      set(state => ({
        guyLines: state.guyLines.filter(x => x.id !== g.id),
        selectedGuyLine: state.selectedGuyLine?.id === g.id ? null : state.selectedGuyLine
      }));
    });

    set(state => ({
      stakes: state.stakes.filter(s => s.id !== id),
      selectedStake: state.selectedStake?.id === id ? null : state.selectedStake
    }));
    Sounds.playThud();
    get().triggerRender();
  },

  updateStakePosition: (id: string, position: THREE.Vector3) => {
    set(state => {
      const stakes = state.stakes.map(s => {
        if (s.id === id) {
          s.position.copy(position);
          if (s.mesh) {
            s.mesh.position.copy(position);
            s.mesh.updateMatrixWorld(true);
          }
          return { ...s, position: position.clone() };
        }
        return s;
      });
      const selected = state.selectedStake?.id === id ? { ...state.selectedStake, position: position.clone() } : state.selectedStake;
      return { stakes, selectedStake: selected };
    });
    get().triggerRender();
  },

  selectStake: (stake) => {
    set({
      selectedSpars: [],
      selectedLashing: null,
      selectedStake: stake,
      selectedGuyLine: null,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  startGuyLinePlacement: (sparId) => {
    set({
      guyLinePlacementActive: true,
      guyLineSourceSparId: sparId
    });
    get().triggerRender();
  },

  cancelGuyLinePlacement: () => {
    set({
      guyLinePlacementActive: false,
      guyLineSourceSparId: null
    });
    get().triggerRender();
  },

  addGuyLine: (sparId, stakeId, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addGuyLine');
    const spar = get().spars.find(s => s.id === sparId);
    const stake = get().stakes.find(s => s.id === stakeId);
    if (!spar || !stake) return null;

    const id = THREE.MathUtils.generateUUID();
    const newGuy: GuyLine = {
      id,
      sparId,
      stakeId,
      sparHeightOffset: spar.length / 2 - 0.1,
      tension: 0.8,
      name: `حبل شد ${get().guyLines.length + 1}`,
      visible: true
    };

    set(state => ({
      guyLines: [...state.guyLines, newGuy],
      guyLinePlacementActive: false,
      guyLineSourceSparId: null
    }));

    if (!get().batchBuilding) {
      Sounds.playLash();
      get().selectGuyLine(newGuy);
    }
    get().triggerRender();
    return newGuy;
  },

  deleteGuyLine: (id, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('deleteGuyLine');
    set(state => ({
      guyLines: state.guyLines.filter(g => g.id !== id),
      selectedGuyLine: state.selectedGuyLine?.id === id ? null : state.selectedGuyLine
    }));
    Sounds.playThud();
    get().triggerRender();
  },

  setGuyLineTension: (id, tension) => {
    get().saveHistoryStep('setGuyLineTension');
    set(state => ({
      guyLines: state.guyLines.map(g => g.id === id ? { ...g, tension } : g)
    }));
    get().triggerRender();
  },

  selectGuyLine: (guyLine) => {
    set({
      selectedSpars: [],
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: guyLine,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  addSpar: (type, position, rotation, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addSpar');
    const config = SPAR_TYPES[type];
    const id = THREE.MathUtils.generateUUID();
    
    let pos = position ? position.clone() : new THREE.Vector3(0, config.length / 2, 0);
    let rot = rotation ? rotation.clone() : new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.1));

    if (!position) {
      if (get().spawnZoneEnabled) {
        const rx = get().spawnZoneCenter.x + (Math.random() - 0.5) * get().spawnZoneWidth;
        const rz = get().spawnZoneCenter.z + (Math.random() - 0.5) * get().spawnZoneLength;
        pos = new THREE.Vector3(rx, config.length / 2, rz);
      } else if (!rotation) {
        const { selectedGuideLine, selectedGuidePoint } = get();
        if (selectedGuideLine) {
          // Spawn along the selected guide line
          const pA = selectedGuideLine.pointA;
          const pB = selectedGuideLine.pointB;
          pos = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
          const dir = new THREE.Vector3().subVectors(pB, pA).normalize();
          rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        } else if (selectedGuidePoint) {
          // Spawn centered at the guide point
          pos = selectedGuidePoint.position.clone();
        }
      }
    }

    const typeNames: Record<string, string> = {
      stave: 'عصا قصيرة',
      medium: 'خشب متوسط',
      long: 'خشب طويل',
      xlong: 'خشب طويل جداً'
    };
    const newSpar: Spar = {
      id,
      type,
      length: config.length,
      radius: config.radius,
      position: pos,
      quaternion: rot,
      name: `${typeNames[type] || 'خشب'} ${get().spars.filter(s => s.type === type).length + 1}`,
      visible: true
    };

    set(state => {
      const newGraph = new Map(state.lashingGraph);
      newGraph.set(id, new Set());
      
      return {
        spars: [...state.spars, newSpar],
        lashingGraph: newGraph
      };
    });

    Sounds.playThud();
    get().clearSelection();
    get().toggleSparSelection(newSpar, false);
    
    return newSpar;
  },

  addSparAlongSegment: (type, pA, pB, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addSparAlongSegment');
    const config = SPAR_TYPES[type];
    const id = THREE.MathUtils.generateUUID();
    
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(pB, pA).normalize();
    const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    const typeNames: Record<string, string> = {
      stave: 'عصا قصيرة',
      medium: 'خشب متوسط',
      long: 'خشب طويل',
      xlong: 'خشب طويل جداً'
    };
    const newSpar: Spar = {
      id,
      type,
      length: config.length,
      radius: config.radius,
      position: mid,
      quaternion: rot,
      name: `${typeNames[type] || 'خشب'} ${get().spars.filter(s => s.type === type).length + 1}`,
      visible: true
    };

    set(state => {
      const newGraph = new Map(state.lashingGraph);
      newGraph.set(id, new Set());
      
      return {
        spars: [...state.spars, newSpar],
        lashingGraph: newGraph
      };
    });

    return newSpar;
  },

  addLashing: (sparA, sparB, point, angle, type, recordHistory = true, triggerSnap = true) => {
    if (recordHistory) get().saveHistoryStep('addLashing');
    if (triggerSnap && sparA.mesh && sparB.mesh) {
      const halfLA = sparA.length / 2;
      const p1 = new THREE.Vector3(0, -halfLA, 0).applyMatrix4(sparA.mesh.matrixWorld);
      const p2 = new THREE.Vector3(0, halfLA, 0).applyMatrix4(sparA.mesh.matrixWorld);

      const halfLB = sparB.length / 2;
      const q1 = new THREE.Vector3(0, -halfLB, 0).applyMatrix4(sparB.mesh.matrixWorld);
      const q2 = new THREE.Vector3(0, halfLB, 0).applyMatrix4(sparB.mesh.matrixWorld);

      const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);
      const gap = res.distance - (sparA.radius + sparB.radius);

      if (gap > 0.001) {
        const snapDirection = new THREE.Vector3().subVectors(res.pointS1, res.pointS2).normalize();
        const snapTranslation = snapDirection.clone().multiplyScalar(gap);
        
        sparB.mesh.position.add(snapTranslation);
        sparB.mesh.updateMatrixWorld(true);
        
        sparB.position.copy(sparB.mesh.position);
        sparB.quaternion.copy(sparB.mesh.quaternion);

        const newQ1 = new THREE.Vector3(0, -halfLB, 0).applyMatrix4(sparB.mesh.matrixWorld);
        const newQ2 = new THREE.Vector3(0, halfLB, 0).applyMatrix4(sparB.mesh.matrixWorld);
        const newRes = getClosestPointsBetweenSegments(p1, p2, newQ1, newQ2);
        point.copy(new THREE.Vector3().addVectors(newRes.pointS1, newRes.pointS2).multiplyScalar(0.5));
        
        Sounds.playSnap();
      }
    }

    const id = THREE.MathUtils.generateUUID();
    const lashingTypesArabic: Record<string, string> = {
      square: 'ربطة مربعة',
      diagonal: 'ربطة قطرية',
      shear: 'ربطة قص',
      tripod: 'ربطة ثلاثية'
    };
    const newLashing: Lashing = {
      id,
      type,
      sparA,
      sparB,
      position: point.clone(),
      angle,
      name: `${lashingTypesArabic[type] || 'ربطة'} ${get().lashings.length + 1}`,
      visible: true
    };

    set(state => {
      const newGraph = new Map(state.lashingGraph);
      newGraph.get(sparA.id)?.add({ neighborId: sparB.id, lashingId: id });
      newGraph.get(sparB.id)?.add({ neighborId: sparA.id, lashingId: id });

      return {
        lashings: [...state.lashings, newLashing],
        lashingGraph: newGraph,
        proximityActive: false,
        currentProximityCandidate: null
      };
    });

    if (!get().batchBuilding) {
      Sounds.playLash();
      get().selectLashing(newLashing);
    }
    get().triggerRender();

    return newLashing;
  },

  breakLashingById: (id, recordHistory = true) => {
    const lash = get().lashings.find(l => l.id === id);
    if (!lash) return;

    if (recordHistory) {
      get().saveHistoryStep('breakLashing');
    }

    set(state => {
      const newGraph = new Map(state.lashingGraph);
      const setA = newGraph.get(lash.sparA.id);
      if (setA) {
        for (const e of setA) { if (e.lashingId === id) { setA.delete(e); break; } }
      }
      const setB = newGraph.get(lash.sparB.id);
      if (setB) {
        for (const e of setB) { if (e.lashingId === id) { setB.delete(e); break; } }
      }

      return {
        lashings: state.lashings.filter(l => l.id !== id),
        lashingGraph: newGraph
      };
    });

    Sounds.playThud();
    get().triggerRender();
  },

  toggleSparSelection: (spar, append = false, forceSingle = false) => {
    set(state => {
      const currentSpar = state.spars.find(s => s.id === spar.id) || spar;
      if (currentSpar.visible === false) return {};

      let selected = [...state.selectedSpars];
      let groupSpars: Spar[];

      if (forceSingle || (!state.lashingLocked && !currentSpar.groupId)) {
        groupSpars = [currentSpar];
      } else {
        const sparIdSet = new Set<string>();

        // 1. If part of an explicit group (like spawned templates), include all group members
        if (currentSpar.groupId) {
          state.spars
            .filter(s => s.groupId === currentSpar.groupId && s.visible !== false)
            .forEach(s => sparIdSet.add(s.id));
        } else {
          sparIdSet.add(currentSpar.id);
        }

        // 2. If lashingLocked is active, find all connected spars in the rigid assembly via BFS
        if (state.lashingLocked) {
          const graph = state.lashingGraph;
          const queue = [currentSpar.id];
          const visited = new Set<string>([currentSpar.id]);

          while (queue.length > 0) {
            const currId = queue.shift()!;
            const edges = graph.get(currId);
            if (edges) {
              for (const edge of edges) {
                if (!visited.has(edge.neighborId)) {
                  visited.add(edge.neighborId);
                  queue.push(edge.neighborId);
                }
              }
            }
          }

          visited.forEach(id => {
            const s = state.spars.find(x => x.id === id);
            if (s && s.visible !== false) sparIdSet.add(s.id);
          });
        }

        groupSpars = state.spars.filter(s => sparIdSet.has(s.id));
        if (groupSpars.length === 0) groupSpars = [currentSpar];
      }

      if (!append) {
        const allGroupSelected = groupSpars.every(gs => selected.some(s => s.id === gs.id));
        if (allGroupSelected && selected.length === groupSpars.length) {
          selected = [];
        } else {
          selected = [...groupSpars];
        }
      } else {
        const anySelected = groupSpars.some(gs => selected.some(s => s.id === gs.id));
        if (anySelected) {
          selected = selected.filter(s => !groupSpars.some(gs => gs.id === s.id));
        } else {
          selected.push(...groupSpars);
        }
      }
      
      return {
        selectedSpars: selected,
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        selectedGuidePoint: null,
        selectedGuideLine: null,
        spawnZoneSelected: false
      };
    });
    
    Sounds.playClick();
    get().triggerRender();
  },

  selectAssembly: (spar) => {
    set(state => {
      const currentSpar = state.spars.find(s => s.id === spar.id) || spar;
      if (currentSpar.visible === false) return {};

      const sparIdSet = new Set<string>();
      if (currentSpar.groupId) {
        state.spars
          .filter(s => s.groupId === currentSpar.groupId && s.visible !== false)
          .forEach(s => sparIdSet.add(s.id));
      } else {
        sparIdSet.add(currentSpar.id);
      }

      const graph = state.lashingGraph;
      const queue = [currentSpar.id];
      const visited = new Set<string>([currentSpar.id]);

      while (queue.length > 0) {
        const currId = queue.shift()!;
        const edges = graph.get(currId);
        if (edges) {
          for (const edge of edges) {
            if (!visited.has(edge.neighborId)) {
              visited.add(edge.neighborId);
              queue.push(edge.neighborId);
            }
          }
        }
      }

      visited.forEach(id => {
        const s = state.spars.find(x => x.id === id);
        if (s && s.visible !== false) sparIdSet.add(s.id);
      });

      const selected = state.spars.filter(s => sparIdSet.has(s.id));
      return {
        selectedSpars: selected.length > 0 ? selected : [currentSpar],
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        selectedGuidePoint: null,
        selectedGuideLine: null,
        spawnZoneSelected: false
      };
    });

    Sounds.playSnap();
    get().triggerRender();
  },

  selectMultipleSpars: (sparsToSelect, append = false) => {
    set(state => {
      const selected = append ? [...state.selectedSpars] : [];
      const expandedSparIds = new Set<string>();
      
      sparsToSelect.forEach(spar => {
        const currentSpar = state.spars.find(s => s.id === spar.id) || spar;
        if (currentSpar.visible === false) return;

        if (currentSpar.groupId) {
          state.spars
            .filter(m => m.groupId === currentSpar.groupId && m.visible !== false)
            .forEach(m => expandedSparIds.add(m.id));
        } else {
          expandedSparIds.add(currentSpar.id);
        }

        if (state.lashingLocked) {
          const graph = state.lashingGraph;
          const queue = [currentSpar.id];
          const visited = new Set<string>([currentSpar.id]);
          while (queue.length > 0) {
            const curr = queue.shift()!;
            const edges = graph.get(curr);
            if (edges) {
              for (const edge of edges) {
                if (!visited.has(edge.neighborId)) {
                  visited.add(edge.neighborId);
                  queue.push(edge.neighborId);
                }
              }
            }
          }
          visited.forEach(id => expandedSparIds.add(id));
        }
      });

      const expandedSpars = state.spars.filter(s => expandedSparIds.has(s.id) && s.visible !== false);
      expandedSpars.forEach(spar => {
        if (!selected.some(s => s.id === spar.id)) {
          selected.push(spar);
        }
      });

      return {
        selectedSpars: selected,
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        selectedGuidePoint: null,
        selectedGuideLine: null,
        spawnZoneSelected: false
      };
    });
    if (sparsToSelect.length > 0) Sounds.playClick();
    get().triggerRender();
  },

  selectAll: () => {
    const visibleSpars = get().spars.filter(s => s.visible !== false);
    if (visibleSpars.length === 0) return;
    set({
      selectedSpars: visibleSpars,
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: null,
      selectedGuideLine: null,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  selectLashing: (lashing) => {
    set({
      selectedSpars: [],
      selectedLashing: lashing,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  clearSelection: () => {
    set({
      selectedSpars: [],
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: null,
      selectedGuideLine: null,
      selectedGuideLinePoint: null,
      selectedSourceSparPoint: null,
      selectedTargetPoint: null,
      spawnZoneSelected: false
    });
    get().triggerRender();
  },

  deleteSparById: (id, recordHistory = true) => {
    const s = get().spars.find(x => x.id === id);
    if (!s) return;

    if (recordHistory) {
      get().saveHistoryStep('delete');
    }

    // Delete connected guy lines without creating double history
    const connectedGuyLines = get().guyLines.filter(g => g.sparId === id);
    connectedGuyLines.forEach(g => get().deleteGuyLine(g.id, false));

    // Collect and delete connected lashings
    const edges = Array.from(get().lashingGraph.get(id) || []);
    edges.forEach(edge => {
      get().breakLashingById(edge.lashingId);
    });

    set(state => {
      const newGraph = new Map(state.lashingGraph);
      newGraph.delete(id);
      return {
        spars: state.spars.filter(x => x.id !== id),
        selectedSpars: state.selectedSpars.filter(x => x.id !== id),
        lashingGraph: newGraph
      };
    });

    Sounds.playThud();
    get().triggerRender();
  },

  deleteSelected: (recordHistory = true) => {
    const { selectedSpars, selectedLashing, selectedStake, selectedGuyLine, selectedGuidePoint, selectedGuideLine } = get();

    if (selectedSpars.length === 0 && !selectedLashing && !selectedStake && !selectedGuyLine && !selectedGuidePoint && !selectedGuideLine) return;

    if (selectedGuidePoint) {
      get().deleteGuidePoint(selectedGuidePoint.id, recordHistory);
      return;
    }
    if (selectedGuideLine) {
      get().deleteGuideLine(selectedGuideLine.id, recordHistory);
      return;
    }

    if (selectedStake) {
      get().deleteStake(selectedStake.id, recordHistory);
      return;
    }
    if (selectedGuyLine) {
      get().deleteGuyLine(selectedGuyLine.id, recordHistory);
      return;
    }

    if (recordHistory) {
      get().saveHistoryStep('delete');
    }

    if (selectedSpars.length > 0) {
      const sparIds = selectedSpars.map(s => s.id);
      sparIds.forEach(id => {
        get().deleteSparById(id, false);
      });
      set({ selectedSpars: [] });
    } else if (selectedLashing) {
      const lash = selectedLashing;
      get().breakLashingById(lash.id);
      set({ selectedLashing: null });
    }

    Sounds.playThud();
    get().triggerRender();
  },

  undo: () => {
    const history = [...get().actionHistory];
    if (history.length === 0) return { success: false };
    const step = history.pop()!;

    // Capture current state for redo history using centralized snapshot
    const currentSnapshot = createSceneSnapshotFromState(get());
    const label = step.label || ACTION_LABELS[step.action] || (step.action.startsWith('template_') ? 'إدراج نموذج كشفي' : step.action);

    const newRedoHistory: ActionHistoryStep[] = [
      ...get().actionRedoHistory,
      { action: step.action, label, timestamp: Date.now(), snapshot: currentSnapshot }
    ];
    if (newRedoHistory.length > 50) {
      newRedoHistory.shift();
    }

    restoreFromSnapshot(step, set, get);

    const feedbackMsg = `تراجع عن: ${label}`;
    set({
      actionHistory: history,
      actionRedoHistory: newRedoHistory,
      historyToastMessage: feedbackMsg
    });

    Sounds.playClick();
    get().triggerRender();
    return { success: true, label };
  },

  redo: () => {
    const redoHistory = [...get().actionRedoHistory];
    if (redoHistory.length === 0) return { success: false };
    const step = redoHistory.pop()!;

    // Capture current state for undo history using centralized snapshot
    const currentSnapshot = createSceneSnapshotFromState(get());
    const label = step.label || ACTION_LABELS[step.action] || (step.action.startsWith('template_') ? 'إدراج نموذج كشفي' : step.action);

    const newHistory: ActionHistoryStep[] = [
      ...get().actionHistory,
      { action: step.action, label, timestamp: Date.now(), snapshot: currentSnapshot }
    ];
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    restoreFromSnapshot(step, set, get);

    const feedbackMsg = `إعادة: ${label}`;
    set({
      actionHistory: newHistory,
      actionRedoHistory: redoHistory,
      historyToastMessage: feedbackMsg
    });

    Sounds.playClick();
    get().triggerRender();
    return { success: true, label };
  },

  updateSparDimensions: (id, length, radius) => {
    get().saveHistoryStep('resize');
    set(state => {
      const spars = state.spars.map(s => {
        if (s.id === id) {
          const updated = { ...s, length, radius };
          if (s.mesh) {
            if (state.groundConstraintEnabled) {
              const halfL = length / 2;
              const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
              const lowestY = s.position.y - halfL * Math.abs(dir.y) - radius;
              if (lowestY < 0) {
                s.position.y += -lowestY;
              }
            }
            s.mesh.position.copy(s.position);
            s.mesh.updateMatrixWorld(true);
          }
          return updated;
        }
        return s;
      });

      const selectedSpars = state.selectedSpars.map(s => {
        if (s.id === id) {
          const found = spars.find(x => x.id === id);
          return found ? found : { ...s, length, radius };
        }
        return s;
      });

      return { spars, selectedSpars };
    });

    get().updateLashingsDynamic(id);
    get().triggerRender();
  },

  groupSelectedSpars: () => {
    const { selectedSpars } = get();
    if (selectedSpars.length < 2) return;

    get().saveHistoryStep('group');
    const newGroupId = THREE.MathUtils.generateUUID();
    set(state => {
      const updatedSpars = state.spars.map(s => {
        if (selectedSpars.some(x => x.id === s.id)) {
          return { ...s, groupId: newGroupId };
        }
        return s;
      });

      const updatedSelected = state.selectedSpars.map(s => ({ ...s, groupId: newGroupId }));

      return {
        spars: updatedSpars,
        selectedSpars: updatedSelected
      };
    });
    get().triggerRender();
  },

  ungroupSelectedSpars: () => {
    const { selectedSpars } = get();
    if (selectedSpars.length === 0) return;

    get().saveHistoryStep('ungroup');
    const groupIdsToClear = new Set<string>();
    selectedSpars.forEach(s => {
      if (s.groupId) groupIdsToClear.add(s.groupId);
    });

    if (groupIdsToClear.size === 0) return;

    set(state => {
      const updatedSpars = state.spars.map(s => {
        if (s.groupId && groupIdsToClear.has(s.groupId)) {
          return { ...s, groupId: undefined };
        }
        return s;
      });

      const updatedSelected = state.selectedSpars.map(s => {
        if (s.groupId && groupIdsToClear.has(s.groupId)) {
          return { ...s, groupId: undefined };
        }
        return s;
      });

      return {
        spars: updatedSpars,
        selectedSpars: updatedSelected
      };
    });
    get().triggerRender();
  },

  clearScene: () => {
    if (confirm('هل أنت متأكد من مسح جميع عناصر المشهد؟')) {
      get().saveHistoryStep('clearScene');
      set({
        sceneRevision: (get().sceneRevision || 0) + 1,
        spars: [],
        lashings: [],
        lashingGraph: new Map(),
        stakes: [],
        guyLines: [],
        selectedSpars: [],
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        guidePoints: [],
        guideLines: [],
        selectedGuidePoint: null,
        selectedGuideLine: null,
        selectedGuideLinePoint: null,
        selectedSourceSparPoint: null,
        selectedTargetPoint: null
      });
      Sounds.playCollapse();
      get().triggerRender();
    }
  },

  setTransformMode: (mode) => set({ transformMode: mode, activeTool: null }),
  setActiveTool: (tool) => set(state => ({ activeTool: state.activeTool === tool ? null : tool })),
  toggleLashingLock: () => set(state => ({ lashingLocked: !state.lashingLocked })),
  toggleMultiSelect: () => set(state => {
    const active = !state.multiSelectActive;
    if (!active) get().clearSelection();
    return { multiSelectActive: active };
  }),
  toggleSound: () => set(state => {
    const enabled = !state.soundEnabled;
    Sounds.setEnabled(enabled);
    return { soundEnabled: enabled };
  }),
  setSoundVolume: (volume: number) => {
    Sounds.setVolume(volume);
    set({ soundVolume: volume });
  },
  setSoundProfile: (profile: SoundProfile) => {
    Sounds.setProfile(profile);
    set({ soundProfile: profile });
  },

  checkProximity: () => {
    const { spars, simulationActive } = get();
    if (spars.length < 2 || simulationActive) {
      set({ proximityActive: false, currentProximityCandidate: null });
      return;
    }

    let closestPair: { sparA: Spar; sparB: Spar; ptA: THREE.Vector3; ptB: THREE.Vector3; distance: number } | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < spars.length; i++) {
      const sA = spars[i];
      if (!sA.mesh) continue;

      const halfLenA = sA.length / 2;
      const p1 = new THREE.Vector3(0, -halfLenA, 0).applyMatrix4(sA.mesh.matrixWorld);
      const p2 = new THREE.Vector3(0, halfLenA, 0).applyMatrix4(sA.mesh.matrixWorld);

      for (let j = i + 1; j < spars.length; j++) {
        const sB = spars[j];
        if (!sB.mesh) continue;

        // Skip if already connected
        let connected = false;
        const edges = get().lashingGraph.get(sA.id);
        if (edges) {
          for (const e of edges) {
            if (e.neighborId === sB.id) { connected = true; break; }
          }
        }
        if (connected) continue;

        const halfLenB = sB.length / 2;
        const q1 = new THREE.Vector3(0, -halfLenB, 0).applyMatrix4(sB.mesh.matrixWorld);
        const q2 = new THREE.Vector3(0, halfLenB, 0).applyMatrix4(sB.mesh.matrixWorld);

        const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);
        const physicalDist = res.distance - (sA.radius + sB.radius);

        if (physicalDist < minDistance) {
          minDistance = physicalDist;
          closestPair = {
            sparA: sA,
            sparB: sB,
            ptA: res.pointS1,
            ptB: res.pointS2,
            distance: physicalDist
          };
        }
      }
    }

    if (closestPair && closestPair.distance < 0.3) {
      const midPoint = new THREE.Vector3().addVectors(closestPair.ptA, closestPair.ptB).multiplyScalar(0.5);
      
      const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(closestPair.sparA.quaternion).normalize();
      const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(closestPair.sparB.quaternion).normalize();
      const angleRad = dirA.angleTo(dirB);
      let angleDeg = THREE.MathUtils.radToDeg(angleRad);
      if (angleDeg > 90) angleDeg = 180 - angleDeg;

      let lashType = 'diagonal';
      if (angleDeg > 70) {
        lashType = 'square';
      } else if (angleDeg < 15) {
        lashType = 'shear';
      }

      set({
        proximityActive: true,
        currentProximityCandidate: {
          sparA: closestPair.sparA,
          sparB: closestPair.sparB,
          point: midPoint,
          angle: angleDeg,
          type: lashType
        }
      });
    } else {
      set({ proximityActive: false, currentProximityCandidate: null });
    }
  },

  updateLashingsDynamic: () => {
    if (get().lashingLocked) return;

    const { lashings, spars } = get();

    lashings.forEach(l => {
      const sA = spars.find(s => s.id === l.sparA.id) || l.sparA;
      const sB = spars.find(s => s.id === l.sparB.id) || l.sparB;
      if (!sA.mesh || !sB.mesh) return;

      l.sparA = sA;
      l.sparB = sB;

      const halfLA = sA.length / 2;
      const p1 = new THREE.Vector3(0, -halfLA, 0).applyMatrix4(sA.mesh.matrixWorld);
      const p2 = new THREE.Vector3(0, halfLA, 0).applyMatrix4(sA.mesh.matrixWorld);

      const halfLB = sB.length / 2;
      const q1 = new THREE.Vector3(0, -halfLB, 0).applyMatrix4(sB.mesh.matrixWorld);
      const q2 = new THREE.Vector3(0, halfLB, 0).applyMatrix4(sB.mesh.matrixWorld);

      const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);

      const midPoint = new THREE.Vector3().addVectors(res.pointS1, res.pointS2).multiplyScalar(0.5);
      l.position.copy(midPoint);
      if (l.mesh) {
        l.mesh.position.copy(midPoint);
      }

      const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(sA.quaternion).normalize();
      const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(sB.quaternion).normalize();
      const angleRad = dirA.angleTo(dirB);
      let angleDeg = THREE.MathUtils.radToDeg(angleRad);
      if (angleDeg > 90) angleDeg = 180 - angleDeg;
      l.angle = angleDeg;
    });
  },

  tieSelectedSpars: (typePreference?: string) => {
    const { selectedSpars } = get();
    if (selectedSpars.length < 2) return null;

    const sA = selectedSpars[0];
    const sB = selectedSpars[1];
    if (!sA.mesh || !sB.mesh) return null;

    const halfLA = sA.length / 2;
    const p1 = new THREE.Vector3(0, -halfLA, 0).applyMatrix4(sA.mesh.matrixWorld);
    const p2 = new THREE.Vector3(0, halfLA, 0).applyMatrix4(sA.mesh.matrixWorld);

    const halfLB = sB.length / 2;
    const q1 = new THREE.Vector3(0, -halfLB, 0).applyMatrix4(sB.mesh.matrixWorld);
    const q2 = new THREE.Vector3(0, halfLB, 0).applyMatrix4(sB.mesh.matrixWorld);

    const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);
    const midPoint = new THREE.Vector3().addVectors(res.pointS1, res.pointS2).multiplyScalar(0.5);

    const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(sA.quaternion).normalize();
    const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(sB.quaternion).normalize();
    const angleRad = dirA.angleTo(dirB);
    let angleDeg = THREE.MathUtils.radToDeg(angleRad);
    if (angleDeg > 90) angleDeg = 180 - angleDeg;

    let lType = typePreference;
    if (!lType) {
      if (selectedSpars.length >= 3) {
        lType = 'tripod';
      } else if (angleDeg > 70) {
        lType = 'square';
      } else if (angleDeg < 25) {
        lType = 'shear';
      } else {
        lType = 'diagonal';
      }
    }

    if (selectedSpars.length >= 3 && lType === 'tripod') {
      const sC = selectedSpars[2];
      const l1 = get().addLashing(sA, sB, midPoint, angleDeg, 'tripod', true, true);
      if (sC.mesh) {
        const halfLC = sC.length / 2;
        const r1 = new THREE.Vector3(0, -halfLC, 0).applyMatrix4(sC.mesh.matrixWorld);
        const r2 = new THREE.Vector3(0, halfLC, 0).applyMatrix4(sC.mesh.matrixWorld);
        const resBC = getClosestPointsBetweenSegments(q1, q2, r1, r2);
        const midBC = new THREE.Vector3().addVectors(resBC.pointS1, resBC.pointS2).multiplyScalar(0.5);
        get().addLashing(sB, sC, midBC, angleDeg, 'tripod', false, true);
      }
      return l1;
    }

    return get().addLashing(sA, sB, midPoint, angleDeg, lType, true, true);
  },

  setSparPosition: (id: string, newPos: THREE.Vector3) => {
    get().saveHistoryStep('setSparPosition');
    set(state => {
      const spars = state.spars.map(s => {
        if (s.id === id) {
          s.position.copy(newPos);
          if (s.mesh) {
            s.mesh.position.copy(newPos);
            s.mesh.updateMatrixWorld(true);
          }
          return { ...s, position: newPos.clone() };
        }
        return s;
      });
      const selectedSpars = state.selectedSpars.map(s => {
        const found = spars.find(x => x.id === s.id);
        return found || s;
      });
      return { spars, selectedSpars };
    });
    get().updateLashingsDynamic(id);
    get().triggerRender();
  },

  setSparRotationEuler: (id: string, eulerDeg: { x: number; y: number; z: number }) => {
    get().saveHistoryStep('setSparRotation');
    const radX = THREE.MathUtils.degToRad(eulerDeg.x);
    const radY = THREE.MathUtils.degToRad(eulerDeg.y);
    const radZ = THREE.MathUtils.degToRad(eulerDeg.z);
    const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
    const newQuat = new THREE.Quaternion().setFromEuler(euler);

    set(state => {
      const spars = state.spars.map(s => {
        if (s.id === id) {
          s.quaternion.copy(newQuat);
          if (s.mesh) {
            s.mesh.quaternion.copy(newQuat);
            s.mesh.updateMatrixWorld(true);
          }
          return { ...s, quaternion: newQuat.clone() };
        }
        return s;
      });
      const selectedSpars = state.selectedSpars.map(s => {
        const found = spars.find(x => x.id === s.id);
        return found || s;
      });
      return { spars, selectedSpars };
    });
    get().updateLashingsDynamic(id);
    get().triggerRender();
  },

  buildTripodTemplate: () => {
    get().buildTemplate('tripod');
  },

  buildAFrameTemplate: () => {
    get().buildTemplate('aframe');
  },

  buildPlatformTowerTemplate: () => {
    get().buildTemplate('platform_tower');
  },

  buildTemplate: (templateId, rotationDegrees = 0) => {
    const custom = get().customTemplates.find(t => t.id === templateId);
    const standard = scoutingTemplates.find(t => t.id === templateId);
    if (!custom && !standard) return;

    get().saveHistoryStep(`template_${templateId}`);

    const { selectedGuidePoint, spawnZoneEnabled, spawnZoneCenter, spawnZoneWidth, spawnZoneLength } = get();
    let offset: THREE.Vector3;
    if (spawnZoneEnabled) {
      const rx = spawnZoneCenter.x + (Math.random() - 0.5) * spawnZoneWidth;
      const rz = spawnZoneCenter.z + (Math.random() - 0.5) * spawnZoneLength;
      offset = new THREE.Vector3(rx, 0, rz);
    } else if (selectedGuidePoint) {
      offset = new THREE.Vector3(selectedGuidePoint.position.x, 0, selectedGuidePoint.position.z);
    } else {
      offset = new THREE.Vector3(0, 0, 0);
    }

    const prevSparIds = new Set(get().spars.map(s => s.id));
    const prevLashingIds = new Set(get().lashings.map(l => l.id));
    const prevStakeIds = new Set(get().stakes.map(s => s.id));
    const prevGuyLineIds = new Set(get().guyLines.map(g => g.id));

    set({ batchBuilding: true });

    if (custom) {
      const spawnedSparsList: Spar[] = [];
      custom.spars.forEach(sData => {
        const pos = new THREE.Vector3(sData.position.x, sData.position.y, sData.position.z).add(offset);
        const rot = new THREE.Quaternion(sData.quaternion.x, sData.quaternion.y, sData.quaternion.z, sData.quaternion.w);
        const spar = get().addSpar(sData.type, pos, rot, false);
        spawnedSparsList.push(spar);
      });

      const spawnedStakesList: Stake[] = [];
      if (custom.stakes) {
        custom.stakes.forEach(stData => {
          const pos = new THREE.Vector3(stData.position.x, stData.position.y, stData.position.z).add(offset);
          const rot = new THREE.Quaternion(stData.quaternion.x, stData.quaternion.y, stData.quaternion.z, stData.quaternion.w);
          const stake = get().addStake(pos, false);
          stake.quaternion.copy(rot);
          spawnedStakesList.push(stake);
        });
      }

      custom.lashings.forEach(lData => {
        const sA = spawnedSparsList[lData.sparAIndex];
        const sB = spawnedSparsList[lData.sparBIndex];
        if (sA && sB) {
          const pt = new THREE.Vector3(lData.position.x, lData.position.y, lData.position.z).add(offset);
          get().addLashing(sA, sB, pt, lData.angle, lData.type, false, false);
        }
      });

      if (custom.guyLines) {
        custom.guyLines.forEach(gData => {
          const sp = spawnedSparsList[gData.sparIndex];
          const st = spawnedStakesList[gData.stakeIndex];
          if (sp && st) {
            get().addGuyLine(sp.id, st.id, false);
          }
        });
      }
    } else if (standard) {
      standard.buildFn(get(), offset);
    }

    set({ batchBuilding: false });

    // Diff newly spawned items
    const newSpars = get().spars.filter(s => !prevSparIds.has(s.id));
    const newLashings = get().lashings.filter(l => !prevLashingIds.has(l.id));
    const newStakes = get().stakes.filter(s => !prevStakeIds.has(s.id));
    const newGuyLines = get().guyLines.filter(g => !prevGuyLineIds.has(g.id));

    const newGroupId = THREE.MathUtils.generateUUID();

    // Rotate around Y axis through offset if rotationDegrees is specified
    if (rotationDegrees !== 0) {
      const rotRad = THREE.MathUtils.degToRad(rotationDegrees);
      const qRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotRad);

      newSpars.forEach(s => {
        const rel = s.position.clone().sub(offset);
        rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotRad);
        s.position.copy(offset).add(rel);
        s.quaternion.premultiply(qRot);
      });

      newStakes.forEach(st => {
        const rel = st.position.clone().sub(offset);
        rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotRad);
        st.position.copy(offset).add(rel);
        st.quaternion.premultiply(qRot);
      });

      newLashings.forEach(l => {
        const rel = l.position.clone().sub(offset);
        rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotRad);
        l.position.copy(offset).add(rel);
      });
    }

    // Set unified groupId
    newSpars.forEach(s => { s.groupId = newGroupId; });
    newStakes.forEach(st => { st.groupId = newGroupId; });
    newLashings.forEach(l => { l.groupId = newGroupId; });
    newGuyLines.forEach(g => { g.groupId = newGroupId; });

    set(state => {
      const updatedSpars = state.spars.map(s => {
        if (newSpars.some(x => x.id === s.id)) return { ...s, groupId: newGroupId };
        return s;
      });
      const updatedStakes = state.stakes.map(st => {
        if (newStakes.some(x => x.id === st.id)) return { ...st, groupId: newGroupId };
        return st;
      });
      const updatedLashings = state.lashings.map(l => {
        if (newLashings.some(x => x.id === l.id)) return { ...l, groupId: newGroupId };
        return l;
      });
      const updatedGuyLines = state.guyLines.map(g => {
        if (newGuyLines.some(x => x.id === g.id)) return { ...g, groupId: newGroupId };
        return g;
      });

      return {
        spars: updatedSpars,
        stakes: updatedStakes,
        lashings: updatedLashings,
        guyLines: updatedGuyLines,
        selectedSpars: updatedSpars.filter(s => s.groupId === newGroupId),
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null
      };
    });

    Sounds.playSnap();
    get().triggerRender();
  },

  saveCustomTemplate: (name, description = '', category = 'ادوات') => {
    const { selectedSpars } = get();
    if (selectedSpars.length === 0) return null;

    const center = new THREE.Vector3();
    selectedSpars.forEach(s => center.add(s.position));
    center.divideScalar(selectedSpars.length);
    center.y = 0;

    const sparIdToIndex = new Map<string, number>();
    const sparsData = selectedSpars.map((s, idx) => {
      sparIdToIndex.set(s.id, idx);
      const relPos = s.position.clone().sub(center);
      return {
        type: s.type,
        position: { x: relPos.x, y: relPos.y, z: relPos.z },
        quaternion: { x: s.quaternion.x, y: s.quaternion.y, z: s.quaternion.z, w: s.quaternion.w }
      };
    });

    const relevantLashings = get().lashings.filter(l =>
      sparIdToIndex.has(l.sparA.id) && sparIdToIndex.has(l.sparB.id)
    );
    const lashingsData = relevantLashings.map(l => {
      const relPos = l.position.clone().sub(center);
      return {
        type: l.type,
        sparAIndex: sparIdToIndex.get(l.sparA.id)!,
        sparBIndex: sparIdToIndex.get(l.sparB.id)!,
        position: { x: relPos.x, y: relPos.y, z: relPos.z },
        angle: l.angle
      };
    });

    const connectedGuyLines = get().guyLines.filter(g => sparIdToIndex.has(g.sparId));
    const stakeIdToIndex = new Map<string, number>();
    const stakesData: Array<{ position: { x: number; y: number; z: number }; quaternion: { x: number; y: number; z: number; w: number } }> = [];

    connectedGuyLines.forEach(g => {
      if (!stakeIdToIndex.has(g.stakeId)) {
        const st = get().stakes.find(s => s.id === g.stakeId);
        if (st) {
          const idx = stakesData.length;
          stakeIdToIndex.set(g.stakeId, idx);
          const relPos = st.position.clone().sub(center);
          stakesData.push({
            position: { x: relPos.x, y: relPos.y, z: relPos.z },
            quaternion: { x: st.quaternion.x, y: st.quaternion.y, z: st.quaternion.z, w: st.quaternion.w }
          });
        }
      }
    });

    const guyLinesData = connectedGuyLines.map(g => ({
      sparIndex: sparIdToIndex.get(g.sparId)!,
      stakeIndex: stakeIdToIndex.get(g.stakeId)!,
      sparHeightOffset: g.sparHeightOffset,
      tension: g.tension
    }));

    const id = `custom_${Date.now()}`;
    const newTemplate: CustomTemplate = {
      id,
      name,
      description: description || 'نموذج كشفي مخصص تم حفظه بواسطة المستخدم',
      category: category as any,
      createdAt: new Date().toLocaleDateString('ar-EG'),
      spars: sparsData,
      lashings: lashingsData,
      stakes: stakesData,
      guyLines: guyLinesData
    };

    const updated = [...get().customTemplates, newTemplate];
    set({ customTemplates: updated });
    try {
      localStorage.setItem('scout_custom_templates', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist custom template:', e);
    }
    Sounds.playSnap();
    return id;
  },

  deleteCustomTemplate: (id) => {
    const updated = get().customTemplates.filter(t => t.id !== id);
    set({ customTemplates: updated });
    try {
      localStorage.setItem('scout_custom_templates', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete custom template from storage:', e);
    }
    Sounds.playThud();
  },

  runStabilitySimulation: () => {
    const { spars, simulationActive } = get();
    if (simulationActive || spars.length === 0) return;

    get().clearSelection();
    
    // Save current state
    const saved = {
      spars: spars.map(s => ({ id: s.id, position: s.position.clone(), rotation: s.quaternion.clone() })),
      lashings: get().lashings.map(l => ({ id: l.id, position: l.position.clone() }))
    };

    set({
      simulationActive: true,
      simulationStateSaved: saved
    });

    // 1. Group connected components
    const visited = new Set<string>();
    const components: Array<{ sparIds: string[]; lashingIds: string[] }> = [];

    spars.forEach(s => {
      if (!visited.has(s.id)) {
        const comp = getConnectedComponent(s.id);
        comp.sparIds.forEach(id => visited.add(id));
        components.push(comp);
      }
    });

    const tipping: TippingComponent[] = [];
    let stable = true;

    components.forEach(comp => {
      const meshes: THREE.Object3D[] = [];
      comp.sparIds.forEach((id: string) => {
        const s = spars.find(x => x.id === id);
        if (s?.mesh) meshes.push(s.mesh);
      });
      comp.lashingIds.forEach((id: string) => {
        const l = get().lashings.find(x => x.id === id);
        if (l?.mesh) meshes.push(l.mesh);
      });

      // Center of mass
      const com = new THREE.Vector3();
      let totalMass = 0;
      comp.sparIds.forEach((id: string) => {
        const s = spars.find(x => x.id === id);
        if (s?.mesh) {
          const mass = Math.PI * s.radius * s.radius * s.length * 800; // dynamic mass (vol * 800kg/m3)
          com.addScaledVector(s.mesh.position, mass);
          totalMass += mass;
        }
      });
      com.divideScalar(totalMass);

      // Contacts
      const contacts: Array<{ point: THREE.Vector3; spar: Spar }> = [];
      comp.sparIds.forEach((id: string) => {
        const s = spars.find(x => x.id === id);
        if (s?.mesh) {
          const halfL = s.length / 2;
          const p1 = new THREE.Vector3(0, -halfL, 0).applyMatrix4(s.mesh.matrixWorld);
          const p2 = new THREE.Vector3(0, halfL, 0).applyMatrix4(s.mesh.matrixWorld);
          const epsilon = s.radius + 0.05;

          if (p1.y <= epsilon) contacts.push({ point: p1.clone(), spar: s });
          if (p2.y <= epsilon) contacts.push({ point: p2.clone(), spar: s });
        }
      });

      if (contacts.length === 0) {
        stable = false;
        tipping.push({ meshes, type: 'fall', velocity: new THREE.Vector3(0, 0, 0) });
      } else if (contacts.length === 1) {
        stable = false;
        const pivot = contacts[0].point.clone();
        const toCom = new THREE.Vector3(com.x - pivot.x, 0, com.z - pivot.z);
        const tipDir = toCom.lengthSq() < 0.001 ? new THREE.Vector3(1, 0, 0) : toCom.normalize();
        const axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tipDir).normalize();
        
        tipping.push({
          meshes,
          type: 'pivot1',
          pivot,
          axis,
          angleRotated: 0,
          speed: 0.02
        });
      } else if (contacts.length === 2) {
        stable = false;
        const pA = contacts[0].point.clone();
        const pB = contacts[1].point.clone();
        
        const hingeAxis = new THREE.Vector3().subVectors(pB, pA).normalize();
        const lineVec = new THREE.Vector3().subVectors(com, pA);
        const projLen = lineVec.dot(hingeAxis);
        const projPt = new THREE.Vector3().addScaledVector(hingeAxis, projLen).add(pA);
        const toComDir = new THREE.Vector3().subVectors(com, projPt);
        const tipDir = new THREE.Vector3(toComDir.x, 0, toComDir.z).normalize();
        
        tipping.push({
          meshes,
          type: 'pivot2',
          pivot: projPt,
          axis: hingeAxis,
          angleRotated: 0,
          speed: 0.025,
          tipDir
        });
      } else {
        // Multi-point contact stability checks
        const comGround = new THREE.Vector2(com.x, com.z);
        const poly = contacts.map(c => new THREE.Vector2(c.point.x, c.point.z));
        
        // Raycast point in polygon bounding check
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x, yi = poly[i].y;
          const xj = poly[j].x, yj = poly[j].y;
          
          const intersect = ((yi > comGround.y) !== (yj > comGround.y))
              && (comGround.x < (xj - xi) * (comGround.y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }

        if (!inside) {
          stable = false;
          // Find closest edge to tip over
          let minDist = Infinity;
          let closestEdge: { pA: THREE.Vector2; pB: THREE.Vector2; normal: THREE.Vector2 } | null = null;

          for (let i = 0; i < poly.length; i++) {
            const pA = poly[i];
            const pB = poly[(i + 1) % poly.length];
            
            const edge = new THREE.Vector2().subVectors(pB, pA);
            const edgeLen = edge.length();
            if (edgeLen < 0.001) continue;
            
            const normal = new THREE.Vector2(-edge.y, edge.x).normalize();
            const toPt = new THREE.Vector2().subVectors(comGround, pA);
            const dist = Math.abs(toPt.dot(normal));
            
            if (dist < minDist) {
              minDist = dist;
              closestEdge = { pA, pB, normal };
            }
          }

          if (closestEdge) {
            const pivotPoint = new THREE.Vector3(closestEdge.pA.x, 0, closestEdge.pA.y);
            const edgeVec = new THREE.Vector3(closestEdge.pB.x - closestEdge.pA.x, 0, closestEdge.pB.y - closestEdge.pA.y).normalize();
            
            tipping.push({
              meshes,
              type: 'pivot2',
              pivot: pivotPoint,
              axis: edgeVec,
              angleRotated: 0,
              speed: 0.02,
              tipDir: new THREE.Vector3(closestEdge.normal.x, 0, closestEdge.normal.y)
            });
          } else {
            tipping.push({ meshes, type: 'fall', velocity: new THREE.Vector3(0, 0, 0) });
          }
        }
      }
    });

    set({ tippingComponents: tipping });

    if (stable) {
      Sounds.playLash();
    } else {
      Sounds.playCollapse();
    }

    get().triggerRender();
  },

  stopStabilitySimulation: () => {
    if (!get().simulationActive) return;
    
    const saved = get().simulationStateSaved;
    if (saved) {
      get().spars.forEach(s => {
        const savedSpar = saved.spars.find(x => x.id === s.id);
        if (savedSpar) {
          s.position.copy(savedSpar.position);
          s.quaternion.copy(savedSpar.rotation);
          if (s.mesh) {
            s.mesh.position.copy(savedSpar.position);
            s.mesh.quaternion.copy(savedSpar.rotation);
            s.mesh.updateMatrixWorld(true);
          }
        }
      });
      get().lashings.forEach(l => {
        const savedLash = saved.lashings.find(x => x.id === l.id);
        if (savedLash) {
          l.position.copy(savedLash.position);
          if (l.mesh) {
            l.mesh.position.copy(savedLash.position);
            l.mesh.updateMatrixWorld(true);
          }
        }
      });
    }

    set({
      simulationActive: false,
      tippingComponents: []
    });
    get().triggerRender();
  },

  toggleBoundary: () => {
    set(state => ({ boundaryEnabled: !state.boundaryEnabled }));
    get().triggerRender();
  },

  setBoundaryDimensions: (width, length) => {
    set({
      boundaryWidth: Math.max(1, Math.min(30, width)),
      boundaryLength: Math.max(1, Math.min(30, length))
    });
    get().triggerRender();
  },

  setBoundaryAlignment: (alignment) => {
    set({ boundaryAlignment: alignment });
    get().triggerRender();
  },

  toggleAssumeAllInsideBoundary: (val?: boolean) => {
    set(state => ({
      assumeAllInsideBoundary: val !== undefined ? val : !state.assumeAllInsideBoundary
    }));
    get().triggerRender();
  },

  getOutOfBoundsSpars: () => {
    const { spars, boundaryWidth, boundaryLength, boundaryAlignment, boundaryEnabled, assumeAllInsideBoundary } = get();
    if (!boundaryEnabled || assumeAllInsideBoundary) return [];
    const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
    return spars.filter(s => s.visible !== false && isSparOutOfBounds(s, bounds));
  },

  focusNextOutOfBoundsSpar: () => {
    const outSpars = get().getOutOfBoundsSpars();
    if (outSpars.length === 0) return;

    const currentSelected = get().selectedSpars;
    let nextIdx = 0;
    if (currentSelected.length === 1) {
      const currIdx = outSpars.findIndex(s => s.id === currentSelected[0].id);
      if (currIdx !== -1) {
        nextIdx = (currIdx + 1) % outSpars.length;
      }
    }

    const targetSpar = outSpars[nextIdx];
    get().toggleSparSelection(targetSpar, false);
    get().setCameraFocusTarget(targetSpar.position.clone());
    Sounds.playClick();
    get().triggerRender();
  },

  selectOutOfBoundsSpars: () => {
    const outSpars = get().getOutOfBoundsSpars();
    if (outSpars.length === 0) return;
    set({
      selectedSpars: outSpars,
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: null,
      selectedGuideLine: null,
      spawnZoneSelected: false
    });
    if (outSpars[0]) {
      get().setCameraFocusTarget(outSpars[0].position.clone());
    }
    Sounds.playClick();
    get().triggerRender();
  },

  selectInsideBoundarySpars: () => {
    const { spars, boundaryWidth, boundaryLength, boundaryAlignment } = get();
    const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
    const insideSpars = spars.filter(s => s.visible !== false && !isSparOutOfBounds(s, bounds));
    if (insideSpars.length === 0) return;
    set({
      selectedSpars: insideSpars,
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: null,
      selectedGuideLine: null,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  moveOutOfBoundsSparsInside: () => {
    const { spars, boundaryWidth, boundaryLength, boundaryAlignment } = get();
    const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
    const outSpars = spars.filter(s => s.visible !== false && isSparOutOfBounds(s, bounds));
    if (outSpars.length === 0) return;

    get().saveHistoryStep('move_inside');

    const updatedSpars = spars.map(s => {
      if (!outSpars.some(os => os.id === s.id)) return s;
      
      const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion);
      const halfL = (s.length || 3.0) / 2;
      const extentX = Math.abs(dir.x) * halfL + 0.1;
      const extentZ = Math.abs(dir.z) * halfL + 0.1;

      const minAllowedX = bounds.minX + extentX;
      const maxAllowedX = bounds.maxX - extentX;
      const minAllowedZ = bounds.minZ + extentZ;
      const maxAllowedZ = bounds.maxZ - extentZ;

      let newX = s.position.x;
      let newZ = s.position.z;

      if (minAllowedX <= maxAllowedX) {
        newX = Math.max(minAllowedX, Math.min(maxAllowedX, newX));
      } else {
        newX = bounds.centerX;
      }

      if (minAllowedZ <= maxAllowedZ) {
        newZ = Math.max(minAllowedZ, Math.min(maxAllowedZ, newZ));
      } else {
        newZ = bounds.centerZ;
      }

      return {
        ...s,
        position: new THREE.Vector3(newX, s.position.y, newZ)
      };
    });

    set({ spars: updatedSpars });
    outSpars.forEach(s => get().updateLashingsDynamic(s.id));
    Sounds.playSnap();
    get().triggerRender();
  },

  addGuidePointAtOrigin: () => {
    const pt = get().addGuidePoint(new THREE.Vector3(0, 0, 0));
    get().selectGuidePoint(pt);
    get().setItemName('guidePoint', pt.id, 'نقطة مرجعية [0,0]');
    Sounds.playSnap();
  },

  toggleSpawnZone: () => {
    set(state => ({ spawnZoneEnabled: !state.spawnZoneEnabled }));
    get().triggerRender();
  },

  setSpawnZoneDimensions: (width, length) => {
    set({
      spawnZoneWidth: Math.max(1, Math.min(30, width)),
      spawnZoneLength: Math.max(1, Math.min(30, length))
    });
    get().triggerRender();
  },

  setSpawnZoneCenter: (center) => {
    set({ spawnZoneCenter: center.clone() });
    get().triggerRender();
  },

  selectSpawnZone: (selected) => {
    if (selected) {
      set({
        selectedSpars: [],
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        selectedGuidePoint: null,
        selectedGuideLine: null,
        selectedGuideLinePoint: null,
        selectedSourceSparPoint: null,
        selectedTargetPoint: null,
        spawnZoneSelected: true
      });
    } else {
      set({ spawnZoneSelected: false });
    }
    get().triggerRender();
  },

  toggleSpawnZoneVisibility: () => {
    set(state => ({ spawnZoneVisible: !state.spawnZoneVisible }));
    get().triggerRender();
  },

  addGuidePoint: (position, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addGuidePoint');
    const id = THREE.MathUtils.generateUUID();
    let pos: THREE.Vector3;
    if (position) {
      pos = position.clone();
    } else if (get().spawnZoneEnabled) {
      const rx = get().spawnZoneCenter.x + (Math.random() - 0.5) * get().spawnZoneWidth;
      const rz = get().spawnZoneCenter.z + (Math.random() - 0.5) * get().spawnZoneLength;
      pos = new THREE.Vector3(rx, 0.2, rz);
    } else {
      pos = new THREE.Vector3((Math.random() - 0.5) * 2, 0.2, (Math.random() - 0.5) * 2);
    }
    if (!position) pos.y = 0.2;
    
    const newPoint: GuidePoint = {
      id,
      position: pos,
      name: `نقطة دليل ${get().guidePoints.length + 1}`,
      visible: true
    };
    
    set(state => ({
      guidePoints: [...state.guidePoints, newPoint]
    }));
    
    Sounds.playThud();
    get().clearSelection();
    get().selectGuidePoint(newPoint);
    get().triggerRender();
    return newPoint;
  },

  deleteGuidePoint: (id, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('deleteGuidePoint');
    set(state => ({
      guidePoints: state.guidePoints.filter(p => p.id !== id),
      selectedGuidePoint: state.selectedGuidePoint?.id === id ? null : state.selectedGuidePoint,
      selectedTargetPoint: state.selectedTargetPoint?.label === `Guide Point (${id})` ? null : state.selectedTargetPoint
    }));
    Sounds.playThud();
    get().triggerRender();
  },

  selectGuidePoint: (point) => {
    set({
      selectedSpars: [],
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: point,
      selectedGuideLine: null,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  updateGuidePointPosition: (id, position) => {
    set(state => {
      const guidePoints = state.guidePoints.map(p => p.id === id ? { ...p, position: position.clone() } : p);
      const selected = state.selectedGuidePoint?.id === id ? { ...state.selectedGuidePoint, position: position.clone() } : state.selectedGuidePoint;
      return { guidePoints, selectedGuidePoint: selected };
    });
    get().triggerRender();
  },

  addGuideLine: (pointA, pointB, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('addGuideLine');
    const id = THREE.MathUtils.generateUUID();
    const pA = pointA ? pointA.clone() : new THREE.Vector3((Math.random() - 0.5) * 2, 0.2, (Math.random() - 0.5) * 2 - 0.5);
    const pB = pointB ? pointB.clone() : new THREE.Vector3((Math.random() - 0.5) * 2, 0.2, (Math.random() - 0.5) * 2 + 0.5);
    
    const newLine: GuideLine = {
      id,
      pointA: pA,
      pointB: pB,
      name: `خط دليل ${get().guideLines.length + 1}`,
      visible: true
    };
    
    set(state => ({
      guideLines: [...state.guideLines, newLine]
    }));
    
    Sounds.playThud();
    get().clearSelection();
    get().selectGuideLine(newLine);
    get().triggerRender();
    return newLine;
  },

  deleteGuideLine: (id, recordHistory = true) => {
    if (recordHistory) get().saveHistoryStep('deleteGuideLine');
    set(state => ({
      guideLines: state.guideLines.filter(l => l.id !== id),
      selectedGuideLine: state.selectedGuideLine?.id === id ? null : state.selectedGuideLine
    }));
    Sounds.playThud();
    get().triggerRender();
  },

  selectGuideLine: (line) => {
    set({
      selectedSpars: [],
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null,
      selectedGuidePoint: null,
      selectedGuideLine: line,
      selectedGuideLinePoint: null,
      spawnZoneSelected: false
    });
    Sounds.playClick();
    get().triggerRender();
  },

  selectGuideLinePoint: (lineId, pointKey) => {
    if (lineId === null) {
      set({ selectedGuideLinePoint: null });
    } else {
      set({
        selectedSpars: [],
        selectedLashing: null,
        selectedStake: null,
        selectedGuyLine: null,
        selectedGuidePoint: null,
        selectedGuideLinePoint: { lineId, pointKey: pointKey! },
        spawnZoneSelected: false
      });
    }
    Sounds.playClick();
    get().triggerRender();
  },

  updateGuideLinePointPosition: (id, pointKey, position) => {
    set(state => {
      const guideLines = state.guideLines.map(l => {
        if (l.id === id) {
          return {
            ...l,
            [pointKey === 'A' ? 'pointA' : 'pointB']: position.clone()
          };
        }
        return l;
      });
      const selected = state.selectedGuideLine?.id === id ? guideLines.find(x => x.id === id)! : state.selectedGuideLine;
      return { guideLines, selectedGuideLine: selected };
    });
    get().triggerRender();
  },

  selectSourceSparPoint: (sparId, pointKey) => {
    if (sparId === null) {
      set({ selectedSourceSparPoint: null });
    } else {
      set({ selectedSourceSparPoint: { sparId, pointKey: pointKey! } });
    }
    get().triggerRender();
  },

  selectTargetPoint: (position, label) => {
    if (position === null) {
      set({ selectedTargetPoint: null });
    } else {
      set({ selectedTargetPoint: { position: position.clone(), label: label || 'Target Point' } });
    }
    get().triggerRender();
  },

  moveSparToTarget: () => {
    const { selectedSourceSparPoint, selectedTargetPoint, spars } = get();
    if (!selectedSourceSparPoint || !selectedTargetPoint) return;
    
    const spar = spars.find(s => s.id === selectedSourceSparPoint.sparId);
    if (!spar) return;
    
    get().saveHistoryStep('moveSparToTarget');

    // Calculate current source point world position using its position and quaternion
    const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
    const halfLen = spar.length / 2;
    const safeOffset = Math.min(get().lashingEndOffset, halfLen * 0.45);
    let localYOffset: number;

    switch (selectedSourceSparPoint.pointKey) {
      case 'start': localYOffset = -halfLen; break;
      case 'end': localYOffset = halfLen; break;
      case 'start_lash': localYOffset = -halfLen + safeOffset; break;
      case 'end_lash': localYOffset = halfLen - safeOffset; break;
      case 'midpoint': localYOffset = 0; break;
      case 'third_1': localYOffset = -halfLen + spar.length / 3; break;
      case 'third_2': localYOffset = -halfLen + (2 * spar.length) / 3; break;
      default: localYOffset = 0;
    }

    const sourcePos = spar.position.clone().addScaledVector(localY, localYOffset);
    
    const translation = new THREE.Vector3().subVectors(selectedTargetPoint.position, sourcePos);
    const newPosition = spar.position.clone().add(translation);
    
    set(state => ({
      spars: state.spars.map(s => s.id === spar.id ? { ...s, position: newPosition } : s)
    }));
    
    // Update mesh position if it exists
    if (spar.mesh) {
      spar.mesh.position.copy(newPosition);
      spar.mesh.updateMatrixWorld(true);
    }
    
    // Update lashings connected to this spar
    get().updateLashingsDynamic(spar.id);
    
    // Reset selections
    set({
      selectedSourceSparPoint: null,
      selectedTargetPoint: null
    });
    
    Sounds.playSnap();
    get().triggerRender();
  },

  dropSparToGround: () => {
    const { selectedSpars, selectedGuidePoint, dropFlatEnabled } = get();
    if (selectedSpars.length === 0 && !selectedGuidePoint) return;

    get().saveHistoryStep('dropSparToGround');

    if (selectedGuidePoint) {
      const newPos = selectedGuidePoint.position.clone();
      newPos.y = 0; // Ground level for guide points

      if (selectedGuidePoint.mesh) {
        selectedGuidePoint.mesh.position.copy(newPos);
        selectedGuidePoint.mesh.updateMatrixWorld(true);
      }

      get().updateGuidePointPosition(selectedGuidePoint.id, newPos);
      Sounds.playThud();
      get().triggerRender();
      return;
    }

    if (selectedSpars.length === 0) return;
    
    if (!dropFlatEnabled) {
      // Drop selection rigidly (preserving relative positions and rotations)
      let minLowestY = Infinity;
      selectedSpars.forEach(s => {
        const halfL = s.length / 2;
        const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
        const lowestY = s.position.y - halfL * Math.abs(dir.y) - s.radius;
        if (lowestY < minLowestY) {
          minLowestY = lowestY;
        }
      });

      // Shift amount to reach exactly ground level (minLowestY = 0)
      const shiftY = minLowestY;

      set(state => {
        const updatedSpars = state.spars.map(s => {
          const isSelected = state.selectedSpars.some(sel => sel.id === s.id);
          if (!isSelected) return s;

          const newPos = s.position.clone();
          newPos.y -= shiftY;

          if (s.mesh) {
            s.mesh.position.copy(newPos);
            s.mesh.updateMatrixWorld(true);
          }

          return {
            ...s,
            position: newPos
          };
        });

        // Also shift connected lashings when assemblies are dropped rigidly
        const updatedLashings = state.lashings.map(l => {
          const sparASelected = state.selectedSpars.some(sel => sel.id === l.sparA.id);
          const sparBSelected = state.selectedSpars.some(sel => sel.id === l.sparB.id);
          if (sparASelected && sparBSelected) {
            const newPos = l.position.clone();
            newPos.y -= shiftY;
            if (l.mesh) {
              l.mesh.position.copy(newPos);
              l.mesh.updateMatrixWorld(true);
            }
            return {
              ...l,
              position: newPos
            };
          }
          return l;
        });

        const newSelected = state.selectedSpars.map(s => {
          const found = updatedSpars.find(x => x.id === s.id);
          return found ? found : s;
        });

        return {
          spars: updatedSpars,
          lashings: updatedLashings,
          selectedSpars: newSelected
        };
      });
    } else {
      // Drop flat (lay horizontal) individually
      set(state => {
        const updatedSpars = state.spars.map(s => {
          const isSelected = state.selectedSpars.some(sel => sel.id === s.id);
          if (!isSelected) return s;
          
          // Project direction onto XZ plane to lay it flat
          const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
          const dirXZ = new THREE.Vector3(dir.x, 0, dir.z);
          const newRot = new THREE.Quaternion();
          
          if (dirXZ.lengthSq() > 0.0001) {
            dirXZ.normalize();
            newRot.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirXZ);
          } else {
            // Default horizontal direction
            newRot.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
          }
          
          const newPos = s.position.clone();
          newPos.y = s.radius; // resting on the ground
          
          if (s.mesh) {
            s.mesh.position.copy(newPos);
            s.mesh.quaternion.copy(newRot);
            s.mesh.updateMatrixWorld(true);
          }
          
          return {
            ...s,
            position: newPos,
            quaternion: newRot
          };
        });
        
        const newSelected = state.selectedSpars.map(s => {
          const found = updatedSpars.find(x => x.id === s.id);
          return found ? found : s;
        });
        
        return {
          spars: updatedSpars,
          selectedSpars: newSelected
        };
      });
    }

    // Update lashings dynamically
    selectedSpars.forEach(s => {
      get().updateLashingsDynamic(s.id);
    });

    Sounds.playThud();
    get().triggerRender();
  },

  toggleGroundConstraint: () => {
    set(state => ({ groundConstraintEnabled: !state.groundConstraintEnabled }));
    get().triggerRender();
  },

  toggleGridSnapping: () => {
    set(state => ({ gridSnappingEnabled: !state.gridSnappingEnabled }));
    get().triggerRender();
  },

  setGridSize: (size) => {
    set({ gridSize: size });
    get().triggerRender();
  },

  toggleAngleSnapping: () => {
    set(state => ({ angleSnappingEnabled: !state.angleSnappingEnabled }));
    get().triggerRender();
  },

  setAngleSize: (angle) => {
    set({ angleSize: angle });
    get().triggerRender();
  },

  toggleSmartSnapping: () => {
    set(state => ({ smartSnappingEnabled: !state.smartSnappingEnabled }));
    get().triggerRender();
  },

  setSmartSnappingEnabled: (enabled) => {
    set({ smartSnappingEnabled: enabled });
    get().triggerRender();
  },

  setLashingEndOffset: (offset) => {
    set({ lashingEndOffset: offset });
    get().triggerRender();
  },

  setActiveSnapCandidate: (candidate) => {
    set({ activeSnapCandidate: candidate });
    get().triggerRender();
  },

  setIsAltSnapSuppressed: (suppressed) => {
    set({ isAltSnapSuppressed: suppressed });
  },

  toggleDropFlat: () => {
    set(state => ({ dropFlatEnabled: !state.dropFlatEnabled }));
  },

  setDropFlatEnabled: (enabled) => {
    set({ dropFlatEnabled: enabled });
  },

  createLinearArray: (sparId, count, distance, axis) => {
    const spar = get().spars.find(s => s.id === sparId);
    if (!spar) return;

    get().saveHistoryStep('create_array');
    const newSpars: Spar[] = [];
    const dir = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );

    const groupId = spar.groupId || THREE.MathUtils.generateUUID();

    for (let i = 1; i <= count; i++) {
      const offset = dir.clone().multiplyScalar(distance * i);
      const newPos = spar.position.clone().add(offset);
      const newId = THREE.MathUtils.generateUUID();
      const newSparItem: Spar = {
        id: newId,
        type: spar.type,
        length: spar.length,
        radius: spar.radius,
        position: newPos,
        quaternion: spar.quaternion.clone(),
        groupId,
        name: `${spar.name || spar.type}_مكرر_${i}`,
        visible: true
      };
      newSpars.push(newSparItem);
    }

    set(state => {
      const updatedSpars = state.spars.map(s => s.id === sparId ? { ...s, groupId } : s);
      const groupSpars = updatedSpars.filter(s => s.groupId === groupId && s.visible !== false);
      return {
        spars: [...updatedSpars, ...newSpars],
        selectedSpars: [...groupSpars, ...newSpars]
      };
    });

    get().triggerRender();
  },

  toggleBlueprintMode: () => {
    set(state => ({ blueprintMode: !state.blueprintMode }));
    get().triggerRender();
  },

  setBlueprintMode: (mode) => {
    set({ blueprintMode: mode });
    get().triggerRender();
  },

  exportToJSON: () => {
    const state = get();
    // 1. Flush any live Three.js mesh transforms directly into store state before serializing
    state.spars.forEach(s => {
      if (s.mesh) {
        s.position.copy(s.mesh.position);
        s.quaternion.copy(s.mesh.quaternion);
      }
    });
    state.stakes.forEach(s => {
      if (s.mesh) {
        s.position.copy(s.mesh.position);
        s.quaternion.copy(s.mesh.quaternion);
      }
    });
    state.lashings.forEach(l => {
      if (l.mesh) {
        l.position.copy(l.mesh.position);
      }
    });
    state.guidePoints.forEach(p => {
      if (p.mesh) {
        p.position.copy(p.mesh.position);
      }
    });
    state.guideLines.forEach(l => {
      if (l.meshA) l.pointA.copy(l.meshA.position);
      if (l.meshB) l.pointB.copy(l.meshB.position);
    });

    const data = {
      spars: state.spars.map(s => {
        const pos = s.mesh ? s.mesh.position : s.position;
        const quat = s.mesh ? s.mesh.quaternion : s.quaternion;
        return {
          id: s.id,
          type: s.type,
          length: s.length,
          radius: s.radius,
          position: { 
            x: Number.isFinite(pos.x) ? pos.x : 0, 
            y: Number.isFinite(pos.y) ? pos.y : 0, 
            z: Number.isFinite(pos.z) ? pos.z : 0 
          },
          quaternion: { 
            x: Number.isFinite(quat.x) ? quat.x : 0, 
            y: Number.isFinite(quat.y) ? quat.y : 0, 
            z: Number.isFinite(quat.z) ? quat.z : 0, 
            w: Number.isFinite(quat.w) ? quat.w : 1 
          },
          name: s.name,
          visible: s.visible,
          groupId: s.groupId
        };
      }),
      lashings: state.lashings.map(l => {
        const pos = l.mesh ? l.mesh.position : l.position;
        return {
          id: l.id,
          type: l.type,
          sparAId: l.sparA.id,
          sparBId: l.sparB.id,
          position: { 
            x: Number.isFinite(pos.x) ? pos.x : 0, 
            y: Number.isFinite(pos.y) ? pos.y : 0, 
            z: Number.isFinite(pos.z) ? pos.z : 0 
          },
          angle: Number.isFinite(l.angle) ? l.angle : 90,
          name: l.name,
          visible: l.visible
        };
      }),
      stakes: state.stakes.map(s => {
        const pos = s.mesh ? s.mesh.position : s.position;
        const quat = s.mesh ? s.mesh.quaternion : s.quaternion;
        return {
          id: s.id,
          position: { 
            x: Number.isFinite(pos.x) ? pos.x : 0, 
            y: Number.isFinite(pos.y) ? pos.y : 0.1, 
            z: Number.isFinite(pos.z) ? pos.z : 0 
          },
          quaternion: { 
            x: Number.isFinite(quat.x) ? quat.x : 0, 
            y: Number.isFinite(quat.y) ? quat.y : 0, 
            z: Number.isFinite(quat.z) ? quat.z : 0, 
            w: Number.isFinite(quat.w) ? quat.w : 1 
          },
          name: s.name,
          visible: s.visible
        };
      }),
      guyLines: state.guyLines.map(g => ({
        id: g.id,
        sparId: g.sparId,
        stakeId: g.stakeId,
        sparHeightOffset: Number.isFinite(g.sparHeightOffset) ? g.sparHeightOffset : 0,
        tension: Number.isFinite(g.tension) ? g.tension : 0.8,
        name: g.name,
        visible: g.visible
      })),
      boundary: {
        enabled: state.boundaryEnabled,
        width: state.boundaryWidth,
        length: state.boundaryLength,
        alignment: state.boundaryAlignment,
        assumeAllInside: state.assumeAllInsideBoundary
      },
      spawnZone: {
        enabled: state.spawnZoneEnabled,
        visible: state.spawnZoneVisible,
        width: state.spawnZoneWidth,
        length: state.spawnZoneLength,
        center: { 
          x: Number.isFinite(state.spawnZoneCenter.x) ? state.spawnZoneCenter.x : 0, 
          y: Number.isFinite(state.spawnZoneCenter.y) ? state.spawnZoneCenter.y : 0, 
          z: Number.isFinite(state.spawnZoneCenter.z) ? state.spawnZoneCenter.z : 0 
        }
      },
      guidePoints: state.guidePoints.map(p => {
        const pos = p.mesh ? p.mesh.position : p.position;
        return {
          id: p.id,
          position: { 
            x: Number.isFinite(pos.x) ? pos.x : 0, 
            y: Number.isFinite(pos.y) ? pos.y : 0, 
            z: Number.isFinite(pos.z) ? pos.z : 0 
          },
          name: p.name,
          visible: p.visible
        };
      }),
      guideLines: state.guideLines.map(l => {
        const posA = l.meshA ? l.meshA.position : l.pointA;
        const posB = l.meshB ? l.meshB.position : l.pointB;
        return {
          id: l.id,
          pointA: { 
            x: Number.isFinite(posA.x) ? posA.x : 0, 
            y: Number.isFinite(posA.y) ? posA.y : 0, 
            z: Number.isFinite(posA.z) ? posA.z : 0 
          },
          pointB: { 
            x: Number.isFinite(posB.x) ? posB.x : 0, 
            y: Number.isFinite(posB.y) ? posB.y : 0, 
            z: Number.isFinite(posB.z) ? posB.z : 0 
          },
          name: l.name,
          visible: l.visible
        };
      })
    };
    return JSON.stringify(data);
  },

  importFromJSON: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || !Array.isArray(data.spars)) return false;

      get().saveHistoryStep('import');
      get().clearSelection();

      const typeNames: Record<string, string> = {
        stave: 'عصا قصيرة',
        medium: 'خشب متوسط',
        long: 'خشب طويل',
        xlong: 'خشب طويل جداً'
      };

      interface SerializedSpar {
        id?: string;
        type: string;
        length?: number;
        radius?: number;
        position: { x: number; y: number; z: number };
        quaternion: { x: number; y: number; z: number; w: number };
        name?: string;
        visible?: boolean;
        groupId?: string;
      }
      interface SerializedStake {
        id?: string;
        position: { x: number; y: number; z: number };
        quaternion: { x: number; y: number; z: number; w: number };
        name?: string;
        visible?: boolean;
      }
      interface SerializedGuidePoint {
        id?: string;
        position: { x: number; y: number; z: number };
        name?: string;
        visible?: boolean;
      }
      interface SerializedGuideLine {
        id?: string;
        pointA: { x: number; y: number; z: number };
        pointB: { x: number; y: number; z: number };
        name?: string;
        visible?: boolean;
      }
      interface SerializedLashing {
        id?: string;
        type: string;
        sparAId: string;
        sparBId: string;
        position: { x: number; y: number; z: number };
        angle?: number;
        name?: string;
        visible?: boolean;
      }
      interface SerializedGuyLine {
        id?: string;
        sparId: string;
        stakeId: string;
        sparHeightOffset: number;
        tension: number;
        name?: string;
        visible?: boolean;
      }
      interface SerializedProject {
        spars: SerializedSpar[];
        stakes?: SerializedStake[];
        guidePoints?: SerializedGuidePoint[];
        guideLines?: SerializedGuideLine[];
        lashings?: SerializedLashing[];
        guyLines?: SerializedGuyLine[];
        boundary?: { enabled?: boolean; width?: number; length?: number; alignment?: BoundaryAlignment };
        spawnZone?: { enabled?: boolean; visible?: boolean; width?: number; length?: number; center?: { x: number; y: number; z: number } };
      }

      const parsed = data as SerializedProject;

      const loadedSpars: Spar[] = parsed.spars.map((s: SerializedSpar, idx: number) => {
        const posX = Number.isFinite(s.position?.x) ? s.position.x : 0;
        const posY = Number.isFinite(s.position?.y) ? s.position.y : 1.5;
        const posZ = Number.isFinite(s.position?.z) ? s.position.z : 0;

        const quatX = Number.isFinite(s.quaternion?.x) ? s.quaternion.x : 0;
        const quatY = Number.isFinite(s.quaternion?.y) ? s.quaternion.y : 0;
        const quatZ = Number.isFinite(s.quaternion?.z) ? s.quaternion.z : 0;
        const quatW = Number.isFinite(s.quaternion?.w) ? s.quaternion.w : 1;

        return {
          id: s.id || THREE.MathUtils.generateUUID(),
          type: s.type,
          length: s.length !== undefined ? s.length : (SPAR_TYPES[s.type]?.length || 3.0),
          radius: s.radius !== undefined ? s.radius : (SPAR_TYPES[s.type]?.radius || 0.04),
          position: new THREE.Vector3(posX, posY, posZ),
          quaternion: new THREE.Quaternion(quatX, quatY, quatZ, quatW).normalize(),
          name: s.name || `${typeNames[s.type] || 'خشب'} ${idx + 1}`,
          visible: s.visible !== false,
          groupId: s.groupId
        };
      });

      const loadedStakes: Stake[] = (parsed.stakes || []).map((s: SerializedStake, idx: number) => {
        const posX = Number.isFinite(s.position?.x) ? s.position.x : 0;
        const posY = Number.isFinite(s.position?.y) ? s.position.y : 0.1;
        const posZ = Number.isFinite(s.position?.z) ? s.position.z : 0;

        const quatX = Number.isFinite(s.quaternion?.x) ? s.quaternion.x : 0;
        const quatY = Number.isFinite(s.quaternion?.y) ? s.quaternion.y : 0;
        const quatZ = Number.isFinite(s.quaternion?.z) ? s.quaternion.z : 0;
        const quatW = Number.isFinite(s.quaternion?.w) ? s.quaternion.w : 1;

        return {
          id: s.id || THREE.MathUtils.generateUUID(),
          position: new THREE.Vector3(posX, posY, posZ),
          quaternion: new THREE.Quaternion(quatX, quatY, quatZ, quatW).normalize(),
          name: s.name || `وتد تثبيت ${idx + 1}`,
          visible: s.visible !== false
        };
      });

      const loadedGuidePoints: GuidePoint[] = (parsed.guidePoints || []).map((p: SerializedGuidePoint, idx: number) => ({
        id: p.id || THREE.MathUtils.generateUUID(),
        position: new THREE.Vector3(
          Number.isFinite(p.position?.x) ? p.position.x : 0,
          Number.isFinite(p.position?.y) ? p.position.y : 0,
          Number.isFinite(p.position?.z) ? p.position.z : 0
        ),
        name: p.name || `نقطة دليل ${idx + 1}`,
        visible: p.visible !== false
      }));

      const loadedGuideLines: GuideLine[] = (parsed.guideLines || []).map((l: SerializedGuideLine, idx: number) => ({
        id: l.id || THREE.MathUtils.generateUUID(),
        pointA: new THREE.Vector3(
          Number.isFinite(l.pointA?.x) ? l.pointA.x : -1,
          Number.isFinite(l.pointA?.y) ? l.pointA.y : 0.2,
          Number.isFinite(l.pointA?.z) ? l.pointA.z : 0
        ),
        pointB: new THREE.Vector3(
          Number.isFinite(l.pointB?.x) ? l.pointB.x : 1,
          Number.isFinite(l.pointB?.y) ? l.pointB.y : 0.2,
          Number.isFinite(l.pointB?.z) ? l.pointB.z : 0
        ),
        name: l.name || `خط دليل ${idx + 1}`,
        visible: l.visible !== false
      }));

      // Reconstruct graph & lashings with automatic Self-Healing
      const loadedLashings: Lashing[] = [];
      const newGraph = new Map<string, Set<{ neighborId: string; lashingId: string }>>();
      
      loadedSpars.forEach(s => {
        newGraph.set(s.id, new Set());
      });

      const lashingTypesArabic: Record<string, string> = {
        square: 'ربطة مربعة',
        diagonal: 'ربطة قطرية',
        shear: 'ربطة قص',
        tripod: 'ربطة ثلاثية'
      };

      (parsed.lashings || []).forEach((l: SerializedLashing, idx: number) => {
        const sA = loadedSpars.find(x => x.id === l.sparAId);
        const sB = loadedSpars.find(x => x.id === l.sparBId);
        if (sA && sB) {
          // Calculate true contact midpoint between line segments of sA and sB
          const halfLA = sA.length / 2;
          const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(sA.quaternion).normalize();
          const p1 = sA.position.clone().addScaledVector(dirA, -halfLA);
          const p2 = sA.position.clone().addScaledVector(dirA, halfLA);

          const halfLB = sB.length / 2;
          const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(sB.quaternion).normalize();
          const q1 = sB.position.clone().addScaledVector(dirB, -halfLB);
          const q2 = sB.position.clone().addScaledVector(dirB, halfLB);

          const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);
          const contactMid = new THREE.Vector3().addVectors(res.pointS1, res.pointS2).multiplyScalar(0.5);

          // Self-Healing: If saved position drifted or is far from contact (> 0.75m), heal to contactMid!
          let finalPos: THREE.Vector3;
          if (l.position && Number.isFinite(l.position.x) && Number.isFinite(l.position.y) && Number.isFinite(l.position.z)) {
            const savedPos = new THREE.Vector3(l.position.x, l.position.y, l.position.z);
            if (savedPos.distanceTo(contactMid) < 0.75) {
              finalPos = savedPos;
            } else {
              finalPos = contactMid;
            }
          } else {
            finalPos = contactMid;
          }

          // Recalculate true angle
          const angleRad = dirA.angleTo(dirB);
          let angleDeg = THREE.MathUtils.radToDeg(angleRad);
          if (angleDeg > 90) angleDeg = 180 - angleDeg;
          if (!Number.isFinite(angleDeg) || angleDeg < 1) angleDeg = l.angle || 90;

          const newLash: Lashing = {
            id: l.id || THREE.MathUtils.generateUUID(),
            type: l.type,
            sparA: sA,
            sparB: sB,
            position: finalPos,
            angle: angleDeg,
            name: l.name || `${lashingTypesArabic[l.type] || 'ربطة'} ${idx + 1}`,
            visible: l.visible !== false
          };
          loadedLashings.push(newLash);
          newGraph.get(sA.id)?.add({ neighborId: sB.id, lashingId: newLash.id });
          newGraph.get(sB.id)?.add({ neighborId: sA.id, lashingId: newLash.id });
        }
      });

      const loadedGuyLines: GuyLine[] = (parsed.guyLines || []).map((g: SerializedGuyLine, idx: number) => ({
        id: g.id || THREE.MathUtils.generateUUID(),
        sparId: g.sparId,
        stakeId: g.stakeId,
        sparHeightOffset: Number.isFinite(g.sparHeightOffset) ? g.sparHeightOffset : 0,
        tension: Number.isFinite(g.tension) ? g.tension : 0.8,
        name: g.name || `حبل شد ${idx + 1}`,
        visible: g.visible !== false
      })).filter((g: SerializedGuyLine) => loadedSpars.some(s => s.id === g.sparId) && loadedStakes.some(s => s.id === g.stakeId));

      // Auto-heal connected components into cohesive groups if they lack groupId
      const visitedForGroup = new Set<string>();
      loadedSpars.forEach(s => {
        if (!s.groupId && !visitedForGroup.has(s.id)) {
          const comp: string[] = [];
          const q = [s.id];
          visitedForGroup.add(s.id);
          while (q.length > 0) {
            const curr = q.shift()!;
            comp.push(curr);
            const edges = newGraph.get(curr);
            if (edges) {
              for (const edge of edges) {
                if (!visitedForGroup.has(edge.neighborId)) {
                  visitedForGroup.add(edge.neighborId);
                  q.push(edge.neighborId);
                }
              }
            }
          }
          if (comp.length > 1) {
            const newGid = THREE.MathUtils.generateUUID();
            comp.forEach(id => {
              const sp = loadedSpars.find(x => x.id === id);
              if (sp) sp.groupId = newGid;
            });
            loadedLashings.forEach(l => {
              if (comp.includes(l.sparA.id) && comp.includes(l.sparB.id)) {
                l.groupId = newGid;
              }
            });
          }
        }
      });

      const nextRevision = (get().sceneRevision || 0) + 1;

      set({
        sceneRevision: nextRevision,
        spars: loadedSpars,
        stakes: loadedStakes,
        lashings: loadedLashings,
        lashingGraph: newGraph,
        guyLines: loadedGuyLines,
        guidePoints: loadedGuidePoints,
        guideLines: loadedGuideLines,
        boundaryEnabled: !!data.boundary?.enabled,
        boundaryWidth: data.boundary?.width || 10,
        boundaryLength: data.boundary?.length || 10,
        boundaryAlignment: data.boundary?.alignment || 'corner',
        assumeAllInsideBoundary: !!data.boundary?.assumeAllInside,
        spawnZoneEnabled: !!data.spawnZone?.enabled,
        spawnZoneWidth: data.spawnZone?.width || 5,
        spawnZoneLength: data.spawnZone?.length || 5,
        spawnZoneVisible: data.spawnZone?.visible !== undefined ? !!data.spawnZone.visible : true,
        spawnZoneCenter: data.spawnZone?.center 
          ? new THREE.Vector3(data.spawnZone.center.x, data.spawnZone.center.y, data.spawnZone.center.z)
          : new THREE.Vector3(0, 0, 0)
      });

      // Smoothly frame loaded design with camera
      if (loadedSpars.length > 0) {
        const box = new THREE.Box3();
        loadedSpars.forEach(s => box.expandByPoint(s.position));
        const center = new THREE.Vector3();
        box.getCenter(center);
        get().setCameraFocusTarget(center);
      }

      Sounds.playThud();
      setTimeout(() => {
        Sounds.playLash();
      }, 150);

      get().triggerRender();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  saveBlueprintLocal: (name) => {
    if (!name.trim()) return;
    const json = get().exportToJSON();
    let saves: Record<string, string>;
    try {
      saves = JSON.parse(localStorage.getItem('pioneering_saves') || '{}');
    } catch {
      saves = {};
    }
    saves[name.trim()] = json;
    localStorage.setItem('pioneering_saves', JSON.stringify(saves));
    Sounds.playClick();
  },

  loadBlueprintLocal: (name) => {
    try {
      const saves: Record<string, string> = JSON.parse(localStorage.getItem('pioneering_saves') || '{}');
      const json = saves[name];
      if (json) {
        get().importFromJSON(json);
      }
    } catch {
      // Ignore JSON parse failure
    }
  },

  deleteBlueprintLocal: (name) => {
    try {
      const saves: Record<string, string> = JSON.parse(localStorage.getItem('pioneering_saves') || '{}');
      delete saves[name];
      localStorage.setItem('pioneering_saves', JSON.stringify(saves));
      Sounds.playClick();
    } catch {
      // Ignore JSON parse failure
    }
  },

  getLocalBlueprintNames: () => {
    try {
      const saves: Record<string, string> = JSON.parse(localStorage.getItem('pioneering_saves') || '{}');
      return Object.keys(saves);
    } catch {
      return [];
    }
  },

  duplicateSelectedSpar: () => {
    const { selectedSpars } = get();
    if (selectedSpars.length === 0) return;

    get().saveHistoryStep('duplicateSpar');
    
    // Map of old groupId to new groupId for the duplicates
    const groupIdMap = new Map<string, string>();
    selectedSpars.forEach(s => {
      if (s.groupId && !groupIdMap.has(s.groupId)) {
        groupIdMap.set(s.groupId, THREE.MathUtils.generateUUID());
      }
    });

    const duplicates: Spar[] = [];
    selectedSpars.forEach(s => {
      const id = THREE.MathUtils.generateUUID();
      // Offset slightly on X & Z so they don't overlap, while keeping the exact same vertical height (Y = 0)
      const newPos = s.position.clone().add(new THREE.Vector3(0.4, 0, 0.4));
      const newSpar: Spar = {
        id,
        type: s.type,
        length: s.length,
        radius: s.radius,
        position: newPos,
        quaternion: s.quaternion.clone(),
        groupId: s.groupId ? groupIdMap.get(s.groupId) : undefined
      };
      
      set(state => {
        const newGraph = new Map(state.lashingGraph);
        newGraph.set(id, new Set());
        return {
          spars: [...state.spars, newSpar],
          lashingGraph: newGraph
        };
      });
      duplicates.push(newSpar);
    });

    Sounds.playThud();
    // Select the newly duplicated spars
    set({
      selectedSpars: duplicates,
      selectedLashing: null,
      selectedStake: null,
      selectedGuyLine: null
    });
    get().triggerRender();
  },

  alignSelectedSpar: () => {
    const { selectedSpars } = get();
    if (selectedSpars.length === 0) return;

    get().saveHistoryStep('alignSpar');
    set(state => {
      const updatedSpars = state.spars.map(s => {
        const isSelected = state.selectedSpars.some(sel => sel.id === s.id);
        if (!isSelected) return s;

        const euler = new THREE.Euler().setFromQuaternion(s.quaternion);
        // Snap each angle to nearest 90 deg (PI/2)
        const snapAngle = (angle: number) => {
          const halfPi = Math.PI / 2;
          return Math.round(angle / halfPi) * halfPi;
        };
        const newEuler = new THREE.Euler(snapAngle(euler.x), snapAngle(euler.y), snapAngle(euler.z));
        const newRot = new THREE.Quaternion().setFromEuler(newEuler);

        if (s.mesh) {
          s.mesh.quaternion.copy(newRot);
          s.mesh.updateMatrixWorld(true);
        }

        return {
          ...s,
          quaternion: newRot
        };
      });

      const newSelected = state.selectedSpars.map(s => {
        const found = updatedSpars.find(x => x.id === s.id);
        return found ? found : s;
      });

      return {
        spars: updatedSpars,
        selectedSpars: newSelected
      };
    });

    selectedSpars.forEach(s => {
      get().updateLashingsDynamic(s.id);
    });

    Sounds.playSnap();
    get().triggerRender();
  },

  buildScoutBridgeTemplate: () => {
    get().buildTemplate('scout_bridge');
  },

  nudgeSelectedSpars: (axis, amount) => {
    const { selectedSpars, selectedGuidePoint, selectedStake } = get();
    if (selectedSpars.length === 0 && !selectedGuidePoint && !selectedStake) return;

    get().saveHistoryStep('nudge');

    // If a guide point is selected
    if (selectedGuidePoint) {
      const newPos = selectedGuidePoint.position.clone();
      newPos[axis] += amount;
      if (get().groundConstraintEnabled && newPos.y < 0) newPos.y = 0;
      
      if (selectedGuidePoint.mesh) {
        selectedGuidePoint.mesh.position.copy(newPos);
        selectedGuidePoint.mesh.updateMatrixWorld(true);
      }
      get().updateGuidePointPosition(selectedGuidePoint.id, newPos);
      get().triggerRender();
      return;
    }

    // If a stake is selected
    if (selectedStake) {
      const newPos = selectedStake.position.clone();
      newPos[axis] += amount;
      newPos.y = 0.1; // lock stakes to ground height
      
      if (selectedStake.mesh) {
        selectedStake.mesh.position.copy(newPos);
        selectedStake.mesh.updateMatrixWorld(true);
      }
      get().triggerRender();
      return;
    }

    if (selectedSpars.length === 0) return;

    // Calculate a single global adjustment if Y axis and ground constraint are enabled
    let correctedAmount = amount;
    if (axis === 'y' && get().groundConstraintEnabled) {
      let maxOverpenetration = 0;
      selectedSpars.forEach(s => {
        const targetY = s.position.y + amount;
        const halfL = s.length / 2;
        const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
        const lowestY = targetY - halfL * Math.abs(dir.y) - s.radius;
        if (lowestY < 0) {
          maxOverpenetration = Math.max(maxOverpenetration, -lowestY);
        }
      });
      correctedAmount += maxOverpenetration;
    }

    set(state => {
      const updatedSpars = state.spars.map(s => {
        const isSelected = state.selectedSpars.some(sel => sel.id === s.id);
        if (!isSelected) return s;

        const newPos = s.position.clone();
        newPos[axis] += correctedAmount;

        // Extra safety clamp per-spar just in case (e.g. if floating point issue)
        if (axis === 'y' && state.groundConstraintEnabled) {
          const halfL = s.length / 2;
          const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
          const lowestY = newPos.y - halfL * Math.abs(dir.y) - s.radius;
          if (lowestY < -0.0001) {
            newPos.y += -lowestY;
          }
        }

        if (s.mesh) {
          s.mesh.position.copy(newPos);
          s.mesh.updateMatrixWorld(true);
        }

        return {
          ...s,
          position: newPos
        };
      });

      const currentGroupIds = new Set(selectedSpars.map(s => s.groupId).filter(Boolean));
      const updatedStakes = state.stakes.map(st => {
        if (!st.groupId || !currentGroupIds.has(st.groupId)) return st;
        const newPos = st.position.clone();
        newPos[axis] += correctedAmount;
        if (st.mesh) {
          st.mesh.position.copy(newPos);
          st.mesh.updateMatrixWorld(true);
        }
        return { ...st, position: newPos };
      });

      const newSelected = state.selectedSpars.map(s => {
        const found = updatedSpars.find(x => x.id === s.id);
        return found ? found : s;
      });

      return {
        spars: updatedSpars,
        stakes: updatedStakes,
        selectedSpars: newSelected
      };
    });

    // Update lashings dynamically
    selectedSpars.forEach(s => {
      get().updateLashingsDynamic(s.id);
    });

    get().triggerRender();
  },

  rotateSelectedSpars: (axis, angleDeg) => {
    const { selectedSpars } = get();
    if (selectedSpars.length === 0) return;

    get().saveHistoryStep('rotate');
    const rad = THREE.MathUtils.degToRad(angleDeg);

    const isMulti = selectedSpars.length > 1;
    const groupCenter = new THREE.Vector3();
    if (isMulti) {
      selectedSpars.forEach(s => {
        groupCenter.x += s.position.x;
        groupCenter.z += s.position.z;
      });
      groupCenter.x /= selectedSpars.length;
      groupCenter.z /= selectedSpars.length;
      let minY = Infinity;
      selectedSpars.forEach(s => {
        const halfL = s.length / 2;
        const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
        const lowestY = s.position.y - halfL * Math.abs(dir.y) - s.radius;
        if (lowestY < minY) minY = lowestY;
      });
      groupCenter.y = Math.max(0, minY);
    }

    const rotAxis = new THREE.Vector3();
    if (axis === 'x') rotAxis.set(1, 0, 0);
    else if (axis === 'y') rotAxis.set(0, 1, 0);
    else if (axis === 'z') rotAxis.set(0, 0, 1);
    const qDiff = new THREE.Quaternion().setFromAxisAngle(rotAxis, rad);

    set(state => {
      const updatedSpars = state.spars.map(s => {
        const isSelected = state.selectedSpars.some(sel => sel.id === s.id);
        if (!isSelected) return s;

        const newRot = qDiff.clone().multiply(s.quaternion).normalize();
        const newPos = s.position.clone();
        if (isMulti) {
          const relPos = s.position.clone().sub(groupCenter);
          relPos.applyAxisAngle(rotAxis, rad);
          newPos.copy(groupCenter).add(relPos);
        }

        // Ground constraint check after rotation
        if (state.groundConstraintEnabled) {
          const halfL = s.length / 2;
          const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(newRot).normalize();
          const lowestY = newPos.y - halfL * Math.abs(dir.y) - s.radius;
          if (lowestY < 0) {
            newPos.y += -lowestY;
          }
        }

        if (s.mesh) {
          s.mesh.quaternion.copy(newRot);
          s.mesh.position.copy(newPos);
          s.mesh.updateMatrixWorld(true);
        }

        return {
          ...s,
          quaternion: newRot,
          position: newPos
        };
      });

      const currentGroupIds = new Set(selectedSpars.map(s => s.groupId).filter(Boolean));
      const updatedStakes = state.stakes.map(st => {
        if (!st.groupId || !currentGroupIds.has(st.groupId)) return st;
        const newPos = st.position.clone();
        if (isMulti) {
          const relPos = st.position.clone().sub(groupCenter);
          relPos.applyAxisAngle(rotAxis, rad);
          newPos.copy(groupCenter).add(relPos);
        }
        const newRot = qDiff.clone().multiply(st.quaternion).normalize();
        if (st.mesh) {
          st.mesh.position.copy(newPos);
          st.mesh.quaternion.copy(newRot);
          st.mesh.updateMatrixWorld(true);
        }
        return { ...st, position: newPos, quaternion: newRot };
      });

      const newSelected = state.selectedSpars.map(s => {
        const found = updatedSpars.find(x => x.id === s.id);
        return found ? found : s;
      });

      return {
        spars: updatedSpars,
        stakes: updatedStakes,
        selectedSpars: newSelected
      };
    });

    selectedSpars.forEach(s => {
      get().updateLashingsDynamic(s.id);
    });

    get().triggerRender();
  },

  snapSparPointToTarget: (sparId, pointKey, targetPos) => {
    const spar = get().spars.find(s => s.id === sparId);
    if (!spar) return;

    get().saveHistoryStep('snap');
    const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
    const halfLen = spar.length / 2;
    const safeOffset = Math.min(get().lashingEndOffset, halfLen * 0.45);
    let localYOffset: number;

    switch (pointKey) {
      case 'start': localYOffset = -halfLen; break;
      case 'end': localYOffset = halfLen; break;
      case 'start_lash': localYOffset = -halfLen + safeOffset; break;
      case 'end_lash': localYOffset = halfLen - safeOffset; break;
      case 'midpoint': localYOffset = 0; break;
      case 'third_1': localYOffset = -halfLen + spar.length / 3; break;
      case 'third_2': localYOffset = -halfLen + (2 * spar.length) / 3; break;
      default: localYOffset = 0;
    }

    const sourcePos = spar.position.clone().addScaledVector(localY, localYOffset);

    const translation = new THREE.Vector3().subVectors(targetPos, sourcePos);
    const newPosition = spar.position.clone().add(translation);

    // Enforce ground constraint if needed
    if (get().groundConstraintEnabled) {
      const lowestY = newPosition.y - halfLen * Math.abs(localY.y) - spar.radius;
      if (lowestY < 0) {
        newPosition.y += -lowestY;
      }
    }

    set(state => ({
      spars: state.spars.map(s => {
        if (s.id === sparId) {
          if (s.mesh) {
            s.mesh.position.copy(newPosition);
            s.mesh.updateMatrixWorld(true);
          }
          return { ...s, position: newPosition };
        }
        return s;
      })
    }));

    // If the spar is in selection, update selection state
    const isSelected = get().selectedSpars.some(s => s.id === sparId);
    if (isSelected) {
      set(state => ({
        selectedSpars: state.selectedSpars.map(s => s.id === sparId ? { ...s, position: newPosition } : s)
      }));
    }

    get().updateLashingsDynamic(sparId);
    Sounds.playSnap();
    get().triggerRender();
  },

  alignSparBetweenPoints: (sparId, startPos, endPos, options) => {
    const spar = get().spars.find(s => s.id === sparId);
    if (!spar) return;

    const vec = new THREE.Vector3().subVectors(endPos, startPos);
    const dist = vec.length();
    if (dist < 0.001) return;

    get().saveHistoryStep('alignSparBetweenPoints');

    const dir = vec.clone().normalize();
    const adjustLength = options?.adjustLength ?? true;

    // Check for wood near start and end points
    const otherSpars = get().spars.filter(s => s.id !== sparId);
    const woodStart = checkWoodNearPosition(startPos, otherSpars, sparId);
    const woodEnd = checkWoodNearPosition(endPos, otherSpars, sparId);

    const hasWoodStart = options?.hasWoodAtStart ?? woodStart.hasWood;
    const hasWoodEnd = options?.hasWoodAtEnd ?? woodEnd.hasWood;

    // Lashing clearance: 7 cm default when wood is present
    const defaultOffset = get().lashingEndOffset; // typically 0.07m
    const startOffset = options?.startOffset !== undefined ? options.startOffset : (hasWoodStart ? defaultOffset : 0);
    const endOffset = options?.endOffset !== undefined ? options.endOffset : (hasWoodEnd ? defaultOffset : 0);

    // Calculate physical ends
    const physicalStart = startPos.clone().addScaledVector(dir, -startOffset);
    const physicalEnd = endPos.clone().addScaledVector(dir, endOffset);

    const newLength = adjustLength ? physicalStart.distanceTo(physicalEnd) : spar.length;

    let newPosition: THREE.Vector3;
    if (adjustLength) {
      newPosition = new THREE.Vector3().addVectors(physicalStart, physicalEnd).multiplyScalar(0.5);
    } else {
      newPosition = physicalStart.clone().addScaledVector(dir, newLength / 2);
    }

    const newQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    // Enforce ground constraint if needed
    if (get().groundConstraintEnabled) {
      const halfLen = newLength / 2;
      const lowestY = newPosition.y - halfLen * Math.abs(dir.y) - spar.radius;
      if (lowestY < 0) {
        newPosition.y += -lowestY;
      }
    }

    set(state => {
      const spars = state.spars.map(s => {
        if (s.id === sparId) {
          const updated = {
            ...s,
            length: newLength,
            position: newPosition.clone(),
            quaternion: newQuaternion.clone()
          };
          if (s.mesh) {
            s.mesh.position.copy(newPosition);
            s.mesh.quaternion.copy(newQuaternion);
            s.mesh.updateMatrixWorld(true);
          }
          return updated;
        }
        return s;
      });

      const selectedSpars = state.selectedSpars.map(s => {
        if (s.id === sparId) {
          const found = spars.find(x => x.id === sparId);
          return found ? found : { ...s, length: newLength, position: newPosition.clone(), quaternion: newQuaternion.clone() };
        }
        return s;
      });

      return { spars, selectedSpars };
    });

    // Optionally auto-tie lashings if requested
    if (options?.autoLash) {
      const updatedSpar = get().spars.find(s => s.id === sparId);
      if (updatedSpar) {
        if (hasWoodStart && woodStart.spar) {
          const targetSpar = get().spars.find(s => s.id === woodStart.spar!.id);
          if (targetSpar) {
            get().addLashing(updatedSpar, targetSpar, startPos, 90, 'square', false, false);
          }
        }
        if (hasWoodEnd && woodEnd.spar) {
          const targetSpar = get().spars.find(s => s.id === woodEnd.spar!.id);
          if (targetSpar && (!woodStart.spar || targetSpar.id !== woodStart.spar.id)) {
            get().addLashing(updatedSpar, targetSpar, endPos, 90, 'square', false, false);
          }
        }
      }
    }

    get().updateLashingsDynamic(sparId);
    Sounds.playSnap();
    get().triggerRender();
  },

  addGuidePointAtPosition: (position) => {
    get().saveHistoryStep('addGuidePoint');
    const id = THREE.MathUtils.generateUUID();
    const newPoint: GuidePoint = {
      id,
      position: position.clone(),
      name: `نقطة دليل ${get().guidePoints.length + 1}`,
      visible: true
    };
    set(state => ({
      guidePoints: [...state.guidePoints, newPoint]
    }));
    Sounds.playThud();
    get().clearSelection();
    get().selectGuidePoint(newPoint);
    get().triggerRender();
  },

  saveHistoryStep: (actionName, customLabel) => {
    const now = Date.now();
    const actionHistory = get().actionHistory;
    const label = customLabel || ACTION_LABELS[actionName] || (actionName.startsWith('template_') ? 'إدراج نموذج كشفي' : actionName);

    // Coalesce rapid slider adjustments (e.g. resize) within 450ms
    if (actionName === 'resize' && actionHistory.length > 0) {
      const lastStep = actionHistory[actionHistory.length - 1];
      if (lastStep.action === 'resize' && lastStep.timestamp && now - lastStep.timestamp < 450) {
        lastStep.timestamp = now;
        return;
      }
    }

    const snapshot = createSceneSnapshotFromState(get());
    const newStep: ActionHistoryStep = {
      action: actionName,
      label,
      timestamp: now,
      snapshot
    };

    const newHistory = [...actionHistory, newStep];
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({ actionHistory: newHistory, actionRedoHistory: [] });
  },

  saveHistoryStepWithSnapshot: (actionName, snapshot, customLabel) => {
    const label = customLabel || ACTION_LABELS[actionName] || (actionName.startsWith('template_') ? 'إدراج نموذج كشفي' : actionName);
    const actionHistory = get().actionHistory;
    const newStep: ActionHistoryStep = {
      action: actionName,
      label,
      timestamp: Date.now(),
      snapshot
    };

    const newHistory = [...actionHistory, newStep];
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    set({ actionHistory: newHistory, actionRedoHistory: [] });
  }
}));

// Arabic labels dictionary for actions
export const ACTION_LABELS: Record<string, string> = {
  drag: 'تحريك / تدوير',
  addSpar: 'إضافة خشب',
  addSparAlongSegment: 'تثبيت خشب بين نقطتين',
  delete: 'حذف عناصر',
  addLashing: 'إضافة ربطة',
  breakLashing: 'فك ربطة',
  addStake: 'إضافة وتد',
  deleteStake: 'حذف وتد',
  addGuyLine: 'إضافة حبل شد',
  deleteGuyLine: 'حذف حبل شد',
  setGuyLineTension: 'تعديل شد الحبل',
  resize: 'تعديل الأبعاد',
  group: 'تجميع عناصر',
  ungroup: 'فك التجميع',
  clearScene: 'مسح المشهد',
  setSparPosition: 'تغيير الموضع',
  setSparRotation: 'تدوير الخشب',
  move_inside: 'نقل داخل الحدود',
  addGuidePoint: 'إضافة نقطة إرشاد',
  deleteGuidePoint: 'حذف نقطة إرشاد',
  addGuideLine: 'إضافة خط إرشاد',
  deleteGuideLine: 'حذف خط إرشاد',
  moveSparToTarget: 'محاذاة للهدف',
  dropSparToGround: 'إنزال للأرض',
  create_array: 'تكرار الخشب',
  import: 'استيراد مخطط',
  duplicateSpar: 'مضاعفة الخشب',
  alignSpar: 'محاذاة',
  nudge: 'إزاحة دقيقة',
  rotate: 'تدوير',
  snap: 'جذب ومحاذاة',
  alignSparBetweenPoints: 'تركيب بين نقطتين',
  setItemName: 'تغيير الاسم',
  toggleItemVisibility: 'تعديل الظهور'
};

// Centralized helper to create a clean, deep-cloned snapshot of the current scene state
export function createSceneSnapshotFromState(state: {
  spars: Spar[];
  lashings: Lashing[];
  stakes: Stake[];
  guyLines: GuyLine[];
  guidePoints: GuidePoint[];
  guideLines: GuideLine[];
  selectedSpars?: Spar[];
  selectedStake?: Stake | null;
  selectedLashing?: Lashing | null;
  selectedGuyLine?: GuyLine | null;
  selectedGuidePoint?: GuidePoint | null;
  selectedGuideLinePoint?: { lineId: string; pointKey: 'A' | 'B' } | null;
}): ActionHistorySnapshot {
  return {
    spars: state.spars.map(s => ({
      id: s.id,
      type: s.type,
      length: s.length,
      radius: s.radius,
      position: s.position.clone(),
      quaternion: s.quaternion.clone(),
      name: s.name,
      visible: s.visible,
      groupId: s.groupId
    })),
    lashings: state.lashings.map(l => ({
      id: l.id,
      type: l.type,
      sparAId: l.sparA.id,
      sparBId: l.sparB.id,
      position: l.position.clone(),
      angle: l.angle,
      name: l.name,
      visible: l.visible,
      groupId: l.groupId
    })),
    stakes: state.stakes.map(s => ({
      id: s.id,
      position: s.position.clone(),
      quaternion: s.quaternion.clone(),
      name: s.name,
      visible: s.visible,
      groupId: s.groupId
    })),
    guyLines: state.guyLines.map(g => ({
      id: g.id,
      sparId: g.sparId,
      stakeId: g.stakeId,
      sparHeightOffset: g.sparHeightOffset,
      tension: g.tension,
      name: g.name,
      visible: g.visible
    })),
    guidePoints: state.guidePoints.map(p => ({
      id: p.id,
      position: p.position.clone(),
      name: p.name,
      visible: p.visible
    })),
    guideLines: state.guideLines.map(l => ({
      id: l.id,
      pointA: l.pointA.clone(),
      pointB: l.pointB.clone(),
      name: l.name,
      visible: l.visible
    })),
    selectedSparIds: state.selectedSpars ? state.selectedSpars.map(s => s.id) : [],
    selectedStakeId: state.selectedStake?.id,
    selectedLashingId: state.selectedLashing?.id,
    selectedGuyLineId: state.selectedGuyLine?.id,
    selectedGuidePointId: state.selectedGuidePoint?.id,
    selectedGuideLinePoint: state.selectedGuideLinePoint ? { ...state.selectedGuideLinePoint } : null
  };
}

// Compare two snapshots to detect whether an actual physical transformation occurred
export function hasSnapshotChanged(snapA: ActionHistorySnapshot, snapB: ActionHistorySnapshot): boolean {
  if (snapA.spars.length !== snapB.spars.length) return true;
  if (snapA.stakes.length !== snapB.stakes.length) return true;
  if (snapA.guidePoints.length !== snapB.guidePoints.length) return true;
  if (snapA.guideLines.length !== snapB.guideLines.length) return true;
  if (snapA.lashings.length !== snapB.lashings.length) return true;

  const EPSILON_SQ = 0.000025; // 5mm tolerance
  const ROT_EPSILON = 0.0002;

  for (let i = 0; i < snapA.spars.length; i++) {
    const sA = snapA.spars[i];
    const sB = snapB.spars.find(s => s.id === sA.id);
    if (!sB) return true;
    if (sA.position.distanceToSquared(sB.position) > EPSILON_SQ) return true;
    if (
      Math.abs(sA.quaternion.x - sB.quaternion.x) > ROT_EPSILON ||
      Math.abs(sA.quaternion.y - sB.quaternion.y) > ROT_EPSILON ||
      Math.abs(sA.quaternion.z - sB.quaternion.z) > ROT_EPSILON ||
      Math.abs(sA.quaternion.w - sB.quaternion.w) > ROT_EPSILON
    ) {
      return true;
    }
  }

  for (let i = 0; i < snapA.stakes.length; i++) {
    const stA = snapA.stakes[i];
    const stB = snapB.stakes.find(s => s.id === stA.id);
    if (!stB) return true;
    if (stA.position.distanceToSquared(stB.position) > EPSILON_SQ) return true;
  }

  for (let i = 0; i < snapA.guidePoints.length; i++) {
    const pA = snapA.guidePoints[i];
    const pB = snapB.guidePoints.find(p => p.id === pA.id);
    if (!pB) return true;
    if (pA.position.distanceToSquared(pB.position) > EPSILON_SQ) return true;
  }

  return false;
}

// Local BFS graph traversal
function getConnectedComponent(startSparId: string) {
  const visitedSpars = new Set<string>();
  const visitedLashings = new Set<string>();
  const queue = [startSparId];
  visitedSpars.add(startSparId);

  const graph = useStore.getState().lashingGraph;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const edges = graph.get(current);
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

  return {
    sparIds: Array.from(visitedSpars),
    lashingIds: Array.from(visitedLashings)
  };
}

type StoreSet = (partial: StoreState | Partial<StoreState> | ((state: StoreState) => StoreState | Partial<StoreState>)) => void;
type StoreGet = () => StoreState;

// Restore a state snapshot for Undo / Redo with group and selection preservation
function restoreFromSnapshot(step: ActionHistoryStep, set: StoreSet, get: StoreGet) {
  const currentSpars = get().spars;
  const currentStakes = get().stakes;
  const currentGuidePoints = get().guidePoints;
  const currentGuideLines = get().guideLines;
  const currentLashings = get().lashings;
  const currentGuyLines = get().guyLines;

  // Reconstruct spars
  const restoredSpars = step.snapshot.spars.map(snapSpar => {
    const existing = currentSpars.find((s: Spar) => s.id === snapSpar.id);
    const config = SPAR_TYPES[snapSpar.type] || { length: 3.0, radius: 0.04 };
    const newSpar: Spar = {
      id: snapSpar.id,
      type: snapSpar.type,
      length: snapSpar.length !== undefined ? snapSpar.length : config.length,
      radius: snapSpar.radius !== undefined ? snapSpar.radius : config.radius,
      position: snapSpar.position.clone(),
      quaternion: snapSpar.quaternion.clone(),
      mesh: existing?.mesh,
      name: snapSpar.name,
      visible: snapSpar.visible,
      groupId: snapSpar.groupId
    };
    if (newSpar.mesh) {
      newSpar.mesh.position.copy(newSpar.position);
      newSpar.mesh.quaternion.copy(newSpar.quaternion);
      newSpar.mesh.updateMatrixWorld(true);
    }
    return newSpar;
  });

  // Reconstruct stakes
  const restoredStakes = step.snapshot.stakes.map(snapStake => {
    const existing = currentStakes.find((s: Stake) => s.id === snapStake.id);
    const newStake: Stake = {
      id: snapStake.id,
      position: snapStake.position.clone(),
      quaternion: snapStake.quaternion.clone(),
      mesh: existing?.mesh,
      name: snapStake.name,
      visible: snapStake.visible,
      groupId: snapStake.groupId
    };
    if (newStake.mesh) {
      newStake.mesh.position.copy(newStake.position);
      newStake.mesh.quaternion.copy(newStake.quaternion);
      newStake.mesh.updateMatrixWorld(true);
    }
    return newStake;
  });

  // Reconstruct guide points
  const restoredGuidePoints = step.snapshot.guidePoints.map(snapPoint => {
    const existing = currentGuidePoints.find((p: GuidePoint) => p.id === snapPoint.id);
    const newPoint: GuidePoint = {
      id: snapPoint.id,
      position: snapPoint.position.clone(),
      mesh: existing?.mesh,
      name: snapPoint.name,
      visible: snapPoint.visible
    };
    if (newPoint.mesh) {
      newPoint.mesh.position.copy(newPoint.position);
      newPoint.mesh.updateMatrixWorld(true);
    }
    return newPoint;
  });

  // Reconstruct guide lines
  const restoredGuideLines = step.snapshot.guideLines.map(snapLine => {
    const existing = currentGuideLines.find((l: GuideLine) => l.id === snapLine.id);
    const newLine: GuideLine = {
      id: snapLine.id,
      pointA: snapLine.pointA.clone(),
      pointB: snapLine.pointB.clone(),
      meshA: existing?.meshA,
      meshB: existing?.meshB,
      name: snapLine.name,
      visible: snapLine.visible
    };
    if (newLine.meshA) {
      newLine.meshA.position.copy(newLine.pointA);
      newLine.meshA.updateMatrixWorld(true);
    }
    if (newLine.meshB) {
      newLine.meshB.position.copy(newLine.pointB);
      newLine.meshB.updateMatrixWorld(true);
    }
    return newLine;
  });

  // Reconstruct lashings
  const restoredLashings: Lashing[] = [];
  step.snapshot.lashings.forEach(snapLash => {
    const sparA = restoredSpars.find((s: Spar) => s.id === snapLash.sparAId);
    const sparB = restoredSpars.find((s: Spar) => s.id === snapLash.sparBId);
    if (sparA && sparB) {
      const existing = currentLashings.find((l: Lashing) => l.id === snapLash.id);
      const newLash: Lashing = {
        id: snapLash.id,
        type: snapLash.type,
        sparA,
        sparB,
        position: snapLash.position.clone(),
        angle: snapLash.angle,
        mesh: existing?.mesh,
        name: snapLash.name,
        visible: snapLash.visible,
        groupId: snapLash.groupId
      };
      if (newLash.mesh) {
        newLash.mesh.position.copy(newLash.position);
        newLash.mesh.updateMatrixWorld(true);
      }
      restoredLashings.push(newLash);
    }
  });

  // Rebuild lashing graph
  const newGraph = new Map<string, Set<{ neighborId: string; lashingId: string }>>();
  restoredSpars.forEach((s: Spar) => {
    newGraph.set(s.id, new Set());
  });
  restoredLashings.forEach((l: Lashing) => {
    newGraph.get(l.sparA.id)?.add({ neighborId: l.sparB.id, lashingId: l.id });
    newGraph.get(l.sparB.id)?.add({ neighborId: l.sparA.id, lashingId: l.id });
  });

  // Reconstruct guy lines
  const restoredGuyLines: GuyLine[] = [];
  step.snapshot.guyLines.forEach(snapGuy => {
    const sparExists = restoredSpars.some((s: Spar) => s.id === snapGuy.sparId);
    const stakeExists = restoredStakes.some((s: Stake) => s.id === snapGuy.stakeId);
    if (sparExists && stakeExists) {
      const existing = currentGuyLines.find((g: GuyLine) => g.id === snapGuy.id);
      restoredGuyLines.push({
        id: snapGuy.id,
        sparId: snapGuy.sparId,
        stakeId: snapGuy.stakeId,
        sparHeightOffset: snapGuy.sparHeightOffset,
        tension: snapGuy.tension,
        mesh: existing?.mesh,
        name: snapGuy.name,
        visible: snapGuy.visible
      });
    }
  });

  // Restore selection smartly (preserve selection of restored items instead of clearing)
  const restoredSelectedSpars: Spar[] = [];
  if (step.snapshot.selectedSparIds && step.snapshot.selectedSparIds.length > 0) {
    step.snapshot.selectedSparIds.forEach(id => {
      const sp = restoredSpars.find(s => s.id === id);
      if (sp) restoredSelectedSpars.push(sp);
    });
  }

  const restoredSelectedStake = step.snapshot.selectedStakeId ? restoredStakes.find(s => s.id === step.snapshot.selectedStakeId) || null : null;
  const restoredSelectedLashing = step.snapshot.selectedLashingId ? restoredLashings.find(l => l.id === step.snapshot.selectedLashingId) || null : null;
  const restoredSelectedGuyLine = step.snapshot.selectedGuyLineId ? restoredGuyLines.find(g => g.id === step.snapshot.selectedGuyLineId) || null : null;
  const restoredSelectedGuidePoint = step.snapshot.selectedGuidePointId ? restoredGuidePoints.find(p => p.id === step.snapshot.selectedGuidePointId) || null : null;

  set({
    spars: restoredSpars,
    stakes: restoredStakes,
    guidePoints: restoredGuidePoints,
    guideLines: restoredGuideLines,
    lashings: restoredLashings,
    lashingGraph: newGraph,
    guyLines: restoredGuyLines,
    selectedSpars: restoredSelectedSpars,
    selectedStake: restoredSelectedStake,
    selectedLashing: restoredSelectedLashing,
    selectedGuyLine: restoredSelectedGuyLine,
    selectedGuidePoint: restoredSelectedGuidePoint,
    selectedGuideLinePoint: step.snapshot.selectedGuideLinePoint || null,
    sceneRevision: (get().sceneRevision || 0) + 1
  });

  // Dynamically update lashings for all restored spars
  restoredSpars.forEach(s => {
    get().updateLashingsDynamic(s.id);
  });
}
