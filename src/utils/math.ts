import * as THREE from 'three';

export interface ClosestPointsResult {
  pointS1: THREE.Vector3;
  pointS2: THREE.Vector3;
  distance: number;
}

// Computes the shortest distance and closest points between segments p1->p2 and q1->q2
export function getClosestPointsBetweenSegments(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  q1: THREE.Vector3,
  q2: THREE.Vector3
): ClosestPointsResult {
  const u = new THREE.Vector3().subVectors(p2, p1);
  const v = new THREE.Vector3().subVectors(q2, q1);
  const w0 = new THREE.Vector3().subVectors(p1, q1);
  
  const a = u.dot(u);
  const b = u.dot(v);
  const c = v.dot(v);
  const d = u.dot(w0);
  const e = v.dot(w0);
  
  const D = a * c - b * b;
  let sN: number, sD = D;
  let tN: number, tD = D;
  
  const SMALL_NUM = 0.0000001;

  if (a < SMALL_NUM && c < SMALL_NUM) {
    // Both segments are points
    return {
      pointS1: p1.clone(),
      pointS2: q1.clone(),
      distance: p1.distanceTo(q1)
    };
  }

  if (a < SMALL_NUM) {
    // First segment is a point
    sN = 0.0;
    sD = 1.0;
    tN = e;
    tD = c;
  } else if (c < SMALL_NUM) {
    // Second segment is a point
    tN = 0.0;
    tD = 1.0;
    sN = -d;
    sD = a;
  } else if (D < SMALL_NUM) {
    sN = 0.0;
    sD = 1.0;
    tN = e;
    tD = c;
  } else {
    sN = (b * e - c * d);
    tN = (a * e - b * d);
    if (sN < 0.0) {
      sN = 0.0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }
  
  if (tN < 0.0) {
    tN = 0.0;
    if (-d < 0.0) {
      sN = 0.0;
    } else if (-d > a) {
      sN = sD;
    } else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;
    if ((-d + b) < 0.0) {
      sN = 0;
    } else if ((-d + b) > a) {
      sN = sD;
    } else {
      sN = (-d + b);
      sD = a;
    }
  }
  
  const sc = Math.abs(sD) < SMALL_NUM ? 0.0 : THREE.MathUtils.clamp(sN / sD, 0.0, 1.0);
  const tc = Math.abs(tD) < SMALL_NUM ? 0.0 : THREE.MathUtils.clamp(tN / tD, 0.0, 1.0);
  
  const closestPointS1 = new THREE.Vector3().addScaledVector(u, Number.isFinite(sc) ? sc : 0).add(p1);
  const closestPointS2 = new THREE.Vector3().addScaledVector(v, Number.isFinite(tc) ? tc : 0).add(q1);
  
  return {
    pointS1: closestPointS1,
    pointS2: closestPointS2,
    distance: closestPointS1.distanceTo(closestPointS2)
  };
}

// Ray-casting algorithm to determine if a 2D point lies inside a 2D polygon
export function isPointInPolygon(pt: THREE.Vector2, poly: THREE.Vector2[]): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    
    const intersect = ((yi > pt.y) !== (yj > pt.y))
        && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface HullEdgeResult {
  pA: THREE.Vector2;
  pB: THREE.Vector2;
  normal: THREE.Vector2;
}

// Finds the closest edge of a 2D polygon hull relative to a 2D point
export function findClosestHullEdge(pt: THREE.Vector2, poly: THREE.Vector2[]): HullEdgeResult {
  let minDist = Infinity;
  let closestEdge: HullEdgeResult | null = null;

  for (let i = 0; i < poly.length; i++) {
    const pA = poly[i];
    const pB = poly[(i + 1) % poly.length];
    
    const edge = new THREE.Vector2().subVectors(pB, pA);
    const edgeLen = edge.length();
    if (edgeLen < 0.001) continue;
    
    const normal = new THREE.Vector2(-edge.y, edge.x).normalize();
    const toPt = new THREE.Vector2().subVectors(pt, pA);
    const dist = Math.abs(toPt.dot(normal));
    
    if (dist < minDist) {
      minDist = dist;
      closestEdge = { pA, pB, normal };
    }
  }

  if (!closestEdge) {
    const defaultA = poly[0]?.clone() || new THREE.Vector2(0, 0);
    const defaultB = poly[1]?.clone() || new THREE.Vector2(defaultA.x + 1, defaultA.y);
    return {
      pA: defaultA,
      pB: defaultB,
      normal: new THREE.Vector2(0, 1)
    };
  }

  return closestEdge;
}

export interface SparLike {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  radius: number;
  name?: string;
}

export interface WoodDetectionResult {
  hasWood: boolean;
  spar?: SparLike;
  distance: number;
  contactPoint?: THREE.Vector3;
}

// Checks if a 3D position is in contact with or near any existing wood/spar
export function checkWoodNearPosition(
  pos: THREE.Vector3,
  spars: SparLike[],
  excludeSparId?: string,
  thresholdMargin: number = 0.10
): WoodDetectionResult {
  let closestDist = Infinity;
  let closestSpar: SparLike | undefined;
  let closestContactPoint: THREE.Vector3 | undefined;

  for (const s of spars) {
    if (excludeSparId && s.id === excludeSparId) continue;

    const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quaternion).normalize();
    const halfLen = s.length / 2;
    const p1 = s.position.clone().addScaledVector(dir, -halfLen);
    const p2 = s.position.clone().addScaledVector(dir, halfLen);

    const seg = new THREE.Vector3().subVectors(p2, p1);
    const segLenSq = seg.lengthSq();
    let t = 0;
    if (segLenSq > 0.000001) {
      t = new THREE.Vector3().subVectors(pos, p1).dot(seg) / segLenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const closestOnAxis = p1.clone().addScaledVector(seg, t);
    const distToAxis = pos.distanceTo(closestOnAxis);
    const distToSurface = Math.max(0, distToAxis - s.radius);

    if (distToSurface <= thresholdMargin) {
      if (distToSurface < closestDist) {
        closestDist = distToSurface;
        closestSpar = s;
        closestContactPoint = closestOnAxis;
      }
    }
  }

  return {
    hasWood: closestSpar !== undefined,
    spar: closestSpar,
    distance: closestDist,
    contactPoint: closestContactPoint
  };
}

