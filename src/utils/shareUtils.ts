import LZString from 'lz-string';
import QRCode from 'qrcode';

export interface CompactModelData {
  title?: string;
  spars: Array<{
    id: string;
    radius: number;
    length: number;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
  }>;
  lashings?: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; z: number };
    angle?: number;
  }>;
  stakes?: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    quaternion: { x: number; y: number; z: number; w: number };
  }>;
  guyLines?: Array<{
    id: string;
    sparId: string;
    stakeId: string;
    sparHeightOffset: number;
  }>;
}

const STORAGE_KEY_CUSTOM_URL = 'pioneering_custom_viewer_url';

/**
 * Compacts and rounds numbers in model data to minimize compressed URL length
 */
export function compactModelData(rawData: any, title = 'تصميم كشفي'): CompactModelData {
  const r3 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;
  const r4 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 10000) / 10000;

  const spars = (rawData.spars || []).map((s: any) => {
    const pos = s.mesh ? s.mesh.position : (s.position || { x: 0, y: 0, z: 0 });
    const quat = s.mesh ? s.mesh.quaternion : (s.quaternion || { x: 0, y: 0, z: 0, w: 1 });

    return {
      id: String(s.id),
      radius: r3(s.radius || 0.05),
      length: r3(s.length || 2.0),
      position: { x: r3(pos.x), y: r3(pos.y), z: r3(pos.z) },
      quaternion: { x: r4(quat.x), y: r4(quat.y), z: r4(quat.z), w: r4(quat.w) }
    };
  });

  const lashings = (rawData.lashings || []).map((l: any) => {
    const pos = l.mesh ? l.mesh.position : (l.position || { x: 0, y: 0, z: 0 });
    return {
      id: String(l.id),
      type: l.type || 'square',
      position: { x: r3(pos.x), y: r3(pos.y), z: r3(pos.z) },
      angle: r3(l.angle || 90)
    };
  });

  const stakes = (rawData.stakes || []).map((st: any) => {
    const pos = st.mesh ? st.mesh.position : (st.position || { x: 0, y: 0, z: 0 });
    const quat = st.mesh ? st.mesh.quaternion : (st.quaternion || { x: 0, y: 0, z: 0, w: 1 });
    return {
      id: String(st.id),
      position: { x: r3(pos.x), y: r3(pos.y), z: r3(pos.z) },
      quaternion: { x: r4(quat.x), y: r4(quat.y), z: r4(quat.z), w: r4(quat.w) }
    };
  });

  const guyLines = (rawData.guyLines || []).map((g: any) => ({
    id: String(g.id),
    sparId: String(g.sparId),
    stakeId: String(g.stakeId),
    sparHeightOffset: r3(g.sparHeightOffset || 0)
  }));

  return {
    title,
    spars,
    lashings,
    stakes,
    guyLines
  };
}

/**
 * Compresses model JSON into URL-safe encoded URI component using LZ-String
 */
export function compressModelToHash(data: CompactModelData): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decompresses model hash back to CompactModelData
 */
export function decompressHashToModel(hash: string): CompactModelData | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (e) {
    console.error('Failed to decompress model hash:', e);
    return null;
  }
}

/**
 * Gets base URL for viewer, checking custom setting or current origin
 */
export function getBaseViewerURL(): string {
  const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_URL);
  if (saved && saved.trim()) {
    return saved.trim();
  }

  // If running on GitHub Pages or by default, use the official GitHub Pages URL
  return 'https://mahmoud897.github.io/scout_simulator/viewer.html';
}

/**
 * Sets and saves custom viewer URL (e.g. GitHub Pages URL)
 */
export function setBaseViewerURL(url: string): void {
  if (url && url.trim()) {
    localStorage.setItem(STORAGE_KEY_CUSTOM_URL, url.trim());
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
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 10,
    color: {
      dark: '#052e16', // Forest dark green
      light: '#ffffff'
    }
  });
}
