import LZString from 'lz-string';
import QRCode from 'qrcode';

export interface UltraCompactModel {
  v: 2;
  t?: string; // title
  s: Array<[number, number, [number, number, number], [number, number, number, number]]>; // [radius, length, [x,y,z], [qx,qy,qz,qw]]
  l?: Array<[number, [number, number, number]]>; // [typeIndex, [x,y,z]]
  st?: Array<[[number, number, number], [number, number, number, number]]>; // [[x,y,z], [qx,qy,qz,qw]]
  g?: Array<[number, number, number]>; // [sparIndex, stakeIndex, sparHeightOffset]
}

const STORAGE_KEY_CUSTOM_URL = 'pioneering_custom_viewer_url';
export const OFFICIAL_DEFAULT_VIEWER_URL = 'https://mahmoud897.github.io/scout_simulator/viewer.html';

const LASHING_TYPES = ['square', 'diagonal', 'shear', 'figure8'];

/**
 * Compacts and rounds numbers into ultra-dense array representation (Version 2)
 * Cuts data size by over 65% so even large structures easily fit in QR Codes!
 */
export function compactModelData(rawData: any, title = 'تصميم كشفي'): UltraCompactModel {
  const r2 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
  const r3 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;

  const rawSpars = rawData.spars || [];
  const sparIdToIndex = new Map<string, number>();

  const s: UltraCompactModel['s'] = rawSpars.map((spar: any, idx: number) => {
    sparIdToIndex.set(String(spar.id), idx);
    const pos = spar.mesh ? spar.mesh.position : (spar.position || { x: 0, y: 0, z: 0 });
    const quat = spar.mesh ? spar.mesh.quaternion : (spar.quaternion || { x: 0, y: 0, z: 0, w: 1 });

    return [
      r2(spar.radius || 0.05),
      r2(spar.length || 2.0),
      [r2(pos.x), r2(pos.y), r2(pos.z)],
      [r3(quat.x), r3(quat.y), r3(quat.z), r3(quat.w)]
    ];
  });

  const rawLashings = rawData.lashings || [];
  const l: UltraCompactModel['l'] = rawLashings.map((lash: any) => {
    const pos = lash.mesh ? lash.mesh.position : (lash.position || { x: 0, y: 0, z: 0 });
    let typeIdx = LASHING_TYPES.indexOf(lash.type);
    if (typeIdx === -1) typeIdx = 0;
    return [
      typeIdx,
      [r2(pos.x), r2(pos.y), r2(pos.z)]
    ];
  });

  const rawStakes = rawData.stakes || [];
  const stakeIdToIndex = new Map<string, number>();
  const st: UltraCompactModel['st'] = rawStakes.map((stake: any, idx: number) => {
    stakeIdToIndex.set(String(stake.id), idx);
    const pos = stake.mesh ? stake.mesh.position : (stake.position || { x: 0, y: 0, z: 0 });
    const quat = stake.mesh ? stake.mesh.quaternion : (stake.quaternion || { x: 0, y: 0, z: 0, w: 1 });
    return [
      [r2(pos.x), r2(pos.y), r2(pos.z)],
      [r3(quat.x), r3(quat.y), r3(quat.z), r3(quat.w)]
    ];
  });

  const rawGuyLines = rawData.guyLines || [];
  const g: UltraCompactModel['g'] = rawGuyLines.map((line: any) => {
    const sIdx = sparIdToIndex.get(String(line.sparId)) ?? 0;
    const stIdx = stakeIdToIndex.get(String(line.stakeId)) ?? 0;
    return [
      sIdx,
      stIdx,
      r2(line.sparHeightOffset || 0)
    ];
  });

  return {
    v: 2,
    t: title,
    s,
    l,
    st,
    g
  };
}

/**
 * Compresses model JSON into URL-safe encoded URI component using LZ-String
 */
export function compressModelToHash(data: UltraCompactModel): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Gets base URL for viewer, checking custom setting or current origin
 */
export function getBaseViewerURL(): string {
  const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_URL);
  if (saved && saved.trim()) {
    let clean = saved.trim();
    // Auto-fix accidental cutoff like viewer.h
    if (clean.endsWith('/viewer.h') || clean.endsWith('/viewer.htm')) {
      clean = clean.replace(/\/viewer\.h(tm)?$/i, '/viewer.html');
    }
    return clean;
  }

  // Official GitHub Pages link is the default so links work anywhere
  return OFFICIAL_DEFAULT_VIEWER_URL;
}

/**
 * Sets and saves custom viewer URL
 */
export function setBaseViewerURL(url: string): void {
  if (url && url.trim()) {
    let clean = url.trim();
    if (clean.endsWith('/viewer.h') || clean.endsWith('/viewer.htm')) {
      clean = clean.replace(/\/viewer\.h(tm)?$/i, '/viewer.html');
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_URL, clean);
  } else {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
  }
}

/**
 * Generates full viewer URL including #data=...
 */
export function generateViewerURL(rawData: any, customBase?: string, title?: string): string {
  const compact = compactModelData(rawData, title);
  const hash = compressModelToHash(compact);
  const base = customBase || getBaseViewerURL();
  return `${base}#data=${hash}`;
}

/**
 * Generates high-res QR Code as PNG Data URL
 * Uses Error Correction 'L' to maximize data capacity and speed
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'L',
      margin: 2,
      scale: 8,
      color: {
        dark: '#052e16', // Forest dark green
        light: '#ffffff'
      }
    });
  } catch (err: any) {
    // If still too big for single QR, throw descriptive error
    console.warn('QR Code generation failed, data might be too long:', err?.message);
    throw new Error('حجم التصميم كبير على رمز QR مباشر (يمكنك مشاركته عبر زر نسخ الرابط أو تحميل ملف HTML)');
  }
}
