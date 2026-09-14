import * as THREE from 'three';
import type { Spar } from '../store/useStore';
import { getClosestPointsBetweenSegments } from './math';

export type SnapLandmarkType = 
  | 'endpoint_exact'       // 0 cm - Physical tip (Ground, measurement)
  | 'lashing_offset'       // 7 cm - Scout safe lashing margin from tip
  | 'midpoint'             // 50% - Center of spar
  | 'third_one'            // 33.3% - Scout rule of thirds
  | 'third_two'            // 66.6% - Scout rule of thirds
  | 'surface_contact'      // Tangent cylinder contact
  | 'ground_contact';      // Floor Y = 0

export interface SparLandmark {
  sparId: string;
  type: SnapLandmarkType;
  pointKey: string;
  localPos: THREE.Vector3;
  worldPos: THREE.Vector3;
  labelAr: string;
}

export interface SnapCandidate {
  movingSparId: string;
  targetSparId?: string;
  snapTranslation: THREE.Vector3; // Vector to add to movingSpar.position
  sourcePoint: THREE.Vector3;      // Point on moving spar
  targetPoint: THREE.Vector3;      // Snapped point on target
  type: SnapLandmarkType;
  labelAr: string;
  distance: number;
  color: string;
}

function isFiniteVec(v: THREE.Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * Computes all semantic scout landmarks for a given spar in world space.
 */
export function computeSparLandmarks(
  spar: Spar,
  lashingOffset: number = 0.07
): SparLandmark[] {
  if (!isFiniteVec(spar.position)) return [];

  const halfLen = spar.length / 2;
  const safeOffset = Math.min(lashingOffset, halfLen * 0.45); // Guard against tiny spars

  // Spar direction along local Y
  const localYDir = new THREE.Vector3(0, 1, 0).applyQuaternion(spar.quaternion).normalize();
  if (!isFiniteVec(localYDir)) return [];

  const createLandmark = (
    type: SnapLandmarkType,
    pointKey: string,
    localY: number,
    labelAr: string
  ): SparLandmark => {
    const localPos = new THREE.Vector3(0, localY, 0);
    const worldPos = spar.position.clone().addScaledVector(localYDir, localY);
    return {
      sparId: spar.id,
      type,
      pointKey,
      localPos,
      worldPos,
      labelAr
    };
  };

  const landmarks: SparLandmark[] = [
    // 1. Exact geometric tips (0 cm)
    createLandmark('endpoint_exact', 'start_tip', -halfLen, 'طرف هندسي (بداية)'),
    createLandmark('endpoint_exact', 'end_tip', halfLen, 'طرف هندسي (نهاية)'),

    // 2. Scout Lashing Margin Points (7 cm setback)
    createLandmark('lashing_offset', 'start_lash', -halfLen + safeOffset, 'طرف كشفي (خلوص 7 سم)'),
    createLandmark('lashing_offset', 'end_lash', halfLen - safeOffset, 'طرف كشفي (خلوص 7 سم)'),

    // 3. Midpoint (50%)
    createLandmark('midpoint', 'midpoint', 0, 'منتصف العصا (50%)'),

    // 4. Scout Rule of Thirds (1/3 & 2/3)
    createLandmark('third_one', 'third_1', -halfLen + spar.length / 3, 'تثليث كشفي (1/3)'),
    createLandmark('third_two', 'third_2', -halfLen + (2 * spar.length) / 3, 'تثليث كشفي (2/3)')
  ];

  return landmarks.filter(lm => isFiniteVec(lm.worldPos));
}

/**
 * Finds the best snapping candidate for a spar being moved/dragged.
 */
export function findBestSnapCandidate(
  movingSpar: Spar,
  allSpars: Spar[],
  options: {
    lashingOffset?: number;
    threshold?: number;
    groundConstraintEnabled?: boolean;
    activeGuidePoints?: Array<{ id: string; position: THREE.Vector3; name?: string }>;
  } = {}
): SnapCandidate | null {
  if (!isFiniteVec(movingSpar.position)) return null;

  const {
    lashingOffset = 0.07,
    threshold = 0.32, // 32 cm magnetic reach
    groundConstraintEnabled = true,
    activeGuidePoints = []
  } = options;

  const movingLandmarks = computeSparLandmarks(movingSpar, lashingOffset);
  const otherSpars = allSpars.filter(s => s.id !== movingSpar.id && s.visible !== false && isFiniteVec(s.position));

  let bestCandidate: SnapCandidate | null = null;
  let minScore = Infinity;

  // 1. Check Landmark-to-Landmark Snapping across other spars
  for (const targetSpar of otherSpars) {
    const targetLandmarks = computeSparLandmarks(targetSpar, lashingOffset);

    for (const srcLm of movingLandmarks) {
      for (const tgtLm of targetLandmarks) {
        const dist = srcLm.worldPos.distanceTo(tgtLm.worldPos);
        if (dist > threshold || !Number.isFinite(dist)) continue;

        // Calculate surface clearance adjustment (r1 + r2)
        const combinedRadius = movingSpar.radius + targetSpar.radius;
        const dirA = new THREE.Vector3(0, 1, 0).applyQuaternion(movingSpar.quaternion).normalize();
        const dirB = new THREE.Vector3(0, 1, 0).applyQuaternion(targetSpar.quaternion).normalize();
        
        const normal = new THREE.Vector3().crossVectors(dirA, dirB);
        if (normal.lengthSq() < 0.001) {
          // Parallel spars: use vector connecting points
          normal.subVectors(srcLm.worldPos, tgtLm.worldPos);
          if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);
        }
        normal.normalize();

        // If normal points towards target, flip it so moving spar rests outside target
        const centerDiff = new THREE.Vector3().subVectors(movingSpar.position, targetSpar.position);
        if (normal.dot(centerDiff) < 0) {
          normal.negate();
        }

        // Target surface point
        const surfaceTarget = tgtLm.worldPos.clone().addScaledVector(normal, combinedRadius);
        const translation = new THREE.Vector3().subVectors(surfaceTarget, srcLm.worldPos);

        if (!isFiniteVec(translation) || !isFiniteVec(surfaceTarget)) continue;
        if (translation.length() > threshold * 1.5) continue;

        // Priority weighting: lashing_offset and midpoint get priority
        let priorityWeight = 1.0;
        let label: string;
        let color = '#38bdf8'; // sky blue default

        if (srcLm.type === 'lashing_offset' && tgtLm.type === 'lashing_offset') {
          priorityWeight = 0.7; // higher priority
          label = '🟢 طرف كشفي ↔ طرف (بروز 7 سم)';
          color = '#22c55e'; // green
        } else if (srcLm.type === 'lashing_offset' && tgtLm.type === 'midpoint') {
          priorityWeight = 0.75;
          label = '🔵 طرف كشفي ↔ منتصف العصا';
          color = '#0284c7'; // blue
        } else if (srcLm.type === 'lashing_offset' && (tgtLm.type === 'third_one' || tgtLm.type === 'third_two')) {
          priorityWeight = 0.8;
          label = '🟣 طرف كشفي ↔ ثلث العصا (تثليث كشفي)';
          color = '#a855f7'; // purple
        } else if (srcLm.type === 'midpoint' && tgtLm.type === 'midpoint') {
          priorityWeight = 0.85;
          label = '🔷 منتصف ↔ منتصف';
          color = '#06b6d4';
        } else {
          label = `🧲 محاذاة (${srcLm.labelAr} ↔ ${tgtLm.labelAr})`;
        }

        const score = dist * priorityWeight;
        if (score < minScore) {
          minScore = score;
          bestCandidate = {
            movingSparId: movingSpar.id,
            targetSparId: targetSpar.id,
            snapTranslation: translation,
            sourcePoint: srcLm.worldPos.clone(),
            targetPoint: surfaceTarget,
            type: tgtLm.type,
            labelAr: label,
            distance: dist,
            color
          };
        }
      }
    }
  }

  // 2. Check Continuous Surface-to-Surface Contact with other spars if no landmark match
  if (!bestCandidate || bestCandidate.distance > 0.15) {
    const halfLA = movingSpar.length / 2;
    const p1 = new THREE.Vector3(0, -halfLA, 0).applyQuaternion(movingSpar.quaternion).add(movingSpar.position);
    const p2 = new THREE.Vector3(0, halfLA, 0).applyQuaternion(movingSpar.quaternion).add(movingSpar.position);

    for (const targetSpar of otherSpars) {
      const halfLB = targetSpar.length / 2;
      const q1 = new THREE.Vector3(0, -halfLB, 0).applyQuaternion(targetSpar.quaternion).add(targetSpar.position);
      const q2 = new THREE.Vector3(0, halfLB, 0).applyQuaternion(targetSpar.quaternion).add(targetSpar.position);

      const res = getClosestPointsBetweenSegments(p1, p2, q1, q2);
      if (!Number.isFinite(res.distance) || !isFiniteVec(res.pointS1) || !isFiniteVec(res.pointS2)) continue;

      const combinedR = movingSpar.radius + targetSpar.radius;
      const gap = res.distance - combinedR;

      if (gap > -0.05 && gap < threshold * 0.75) {
        const snapDir = new THREE.Vector3().subVectors(res.pointS1, res.pointS2);
        if (snapDir.lengthSq() < 0.0001) snapDir.set(0, 1, 0);
        snapDir.normalize();

        const translation = snapDir.clone().multiplyScalar(-gap);
        if (!isFiniteVec(translation) || translation.length() > threshold * 1.5) continue;

        const score = Math.abs(gap) * 1.1;

        if (score < minScore) {
          minScore = score;
          bestCandidate = {
            movingSparId: movingSpar.id,
            targetSparId: targetSpar.id,
            snapTranslation: translation,
            sourcePoint: res.pointS1.clone(),
            targetPoint: res.pointS2.clone().addScaledVector(snapDir, combinedR),
            type: 'surface_contact',
            labelAr: '🟡 تلامس سطحي للعقدة (جاهز للربط)',
            distance: Math.abs(gap),
            color: '#eab308' // yellow
          };
        }
      }
    }
  }

  // 3. Check Guide Points snapping
  if (activeGuidePoints.length > 0) {
    for (const gp of activeGuidePoints) {
      if (!isFiniteVec(gp.position)) continue;
      for (const srcLm of movingLandmarks) {
        const dist = srcLm.worldPos.distanceTo(gp.position);
        if (dist < threshold && Number.isFinite(dist)) {
          const translation = new THREE.Vector3().subVectors(gp.position, srcLm.worldPos);
          if (!isFiniteVec(translation)) continue;

          const score = dist * 0.9;
          if (score < minScore) {
            minScore = score;
            bestCandidate = {
              movingSparId: movingSpar.id,
              snapTranslation: translation,
              sourcePoint: srcLm.worldPos.clone(),
              targetPoint: gp.position.clone(),
              type: 'endpoint_exact',
              labelAr: `📍 نقطة دليل (${gp.name || 'دليل'})`,
              distance: dist,
              color: '#38bdf8'
            };
          }
        }
      }
    }
  }

  // 4. Ground Contact Snapping (Floor Y = 0)
  if (groundConstraintEnabled) {
    const halfLen = movingSpar.length / 2;
    const localYDir = new THREE.Vector3(0, 1, 0).applyQuaternion(movingSpar.quaternion).normalize();
    const bottomTipWorld = movingSpar.position.clone().addScaledVector(localYDir, -halfLen);
    const topTipWorld = movingSpar.position.clone().addScaledVector(localYDir, halfLen);

    const lowestTip = bottomTipWorld.y < topTipWorld.y ? bottomTipWorld : topTipWorld;
    const lowestY = lowestTip.y - movingSpar.radius;

    if (Math.abs(lowestY) < 0.18 && Math.abs(lowestY) > 0.002 && Number.isFinite(lowestY)) {
      const translation = new THREE.Vector3(0, -lowestY, 0);
      const score = Math.abs(lowestY) * 0.8;
      if (score < minScore && isFiniteVec(translation)) {
        bestCandidate = {
          movingSparId: movingSpar.id,
          snapTranslation: translation,
          sourcePoint: lowestTip.clone(),
          targetPoint: new THREE.Vector3(lowestTip.x, movingSpar.radius, lowestTip.z),
          type: 'ground_contact',
          labelAr: '🌍 ارتكاز على سطح الأرض',
          distance: Math.abs(lowestY),
          color: '#10b981' // emerald
        };
      }
    }
  }

  return bestCandidate;
}
