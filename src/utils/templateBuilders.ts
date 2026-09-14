import * as THREE from 'three';
import type { useStore, Spar } from '../store/useStore';

type StoreType = ReturnType<typeof useStore.getState>;

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: 'اساسي' | 'خيام' | 'جسور' | 'مطبخ' | 'ادوات';
  iconSvg: string;
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
  materials: {
    staves: number;
    medium: number;
    long: number;
    xlong: number;
    lashings: number;
    ropeLength: number;
    stakes?: number;
    guyLines?: number;
  };
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  buildFn: (store: StoreType, offset: THREE.Vector3) => Spar[];
}

export const scoutingTemplates: TemplateDefinition[] = [
  // -------------------------------------------------------------
  // 1. TRIPOD
  // -------------------------------------------------------------
  {
    id: 'tripod',
    name: 'حامل ثلاثي مقوى (Reinforced Tripod)',
    description: 'قاعدة الهياكل الأساسية. يتكون من 3 قوائم بارتفاع 2.7م وربطة ثلاثية في الأعلى مع 3 عوارض ربط سفلية تمنع انفراج الأرجل.',
    category: 'اساسي',
    difficulty: 'مبتدئ',
    dimensions: { width: 2.4, length: 2.4, height: 2.75 },
    materials: { staves: 3, medium: 3, long: 0, xlong: 0, lashings: 6, ropeLength: 24 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="8" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="28" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="18" y2="32" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" stroke-linecap="round"/>
        <line x1="11" y1="24" x2="25" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="18" cy="6" r="2.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pTop = new THREE.Vector3(0, 2.75, 0).add(offset);
      const r = 1.25;
      const f1 = new THREE.Vector3(0, 0.05, r).add(offset);
      const f2 = new THREE.Vector3(r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);
      const f3 = new THREE.Vector3(-r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);

      const s1 = store.addSparAlongSegment('medium', f1, pTop, false);
      const s2 = store.addSparAlongSegment('medium', f2, pTop, false);
      const s3 = store.addSparAlongSegment('medium', f3, pTop, false);

      // Bottom perimeter spreader staves at y = 0.48m
      const b1 = new THREE.Vector3().lerpVectors(f1, pTop, 0.16);
      const b2 = new THREE.Vector3().lerpVectors(f2, pTop, 0.16);
      const b3 = new THREE.Vector3().lerpVectors(f3, pTop, 0.16);

      // Outward radial offset so spreaders rest on outside of legs
      const b1Out = b1.clone().add(new THREE.Vector3(0, 0, 0.06));
      const b2Out = b2.clone().add(new THREE.Vector3(0.06 * Math.cos(Math.PI / 6), 0, -0.06 * Math.sin(Math.PI / 6)));
      const b3Out = b3.clone().add(new THREE.Vector3(-0.06 * Math.cos(Math.PI / 6), 0, -0.06 * Math.sin(Math.PI / 6)));

      const sp12 = store.addSparAlongSegment('stave', b1Out, b2Out, false);
      const sp23 = store.addSparAlongSegment('stave', b2Out, b3Out, false);
      const sp31 = store.addSparAlongSegment('stave', b3Out, b1Out, false);

      // Apex tripod lashings
      store.addLashing(s1, s2, pTop, 20.0, 'tripod', false, false);
      store.addLashing(s2, s3, pTop, 20.0, 'tripod', false, false);
      store.addLashing(s3, s1, pTop, 20.0, 'tripod', false, false);

      // Base spreader square lashings (tied on BOTH ends to the corresponding legs)
      store.addLashing(s1, sp12, b1, 90.0, 'square', false, false);
      store.addLashing(s2, sp12, b2, 90.0, 'square', false, false);

      store.addLashing(s2, sp23, b2, 90.0, 'square', false, false);
      store.addLashing(s3, sp23, b3, 90.0, 'square', false, false);

      store.addLashing(s3, sp31, b3, 90.0, 'square', false, false);
      store.addLashing(s1, sp31, b1, 90.0, 'square', false, false);

      return [s1, s2, s3, sp12, sp23, sp31];
    }
  },

  // -------------------------------------------------------------
  // 2. A-FRAME
  // -------------------------------------------------------------
  {
    id: 'aframe',
    name: 'إطار ثنائي مدعم (Supported A-Frame)',
    description: 'قائم ثنائي بضلعين متقاطعين وعارضة أفقية مع ربطة رأسية مقصية ودعامتي شد وتدية للاستقرار التام.',
    category: 'اساسي',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.8, length: 1.5, height: 2.75 },
    materials: { staves: 2, medium: 2, long: 0, xlong: 0, lashings: 4, ropeLength: 16, stakes: 2, guyLines: 2 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="8" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="28" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="11" y1="20" x2="25" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="18" cy="7" r="2" fill="#facc15"/>
        <circle cx="12" cy="20" r="1.5" fill="#facc15"/>
        <circle cx="24" cy="20" r="1.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pTop = new THREE.Vector3(0, 2.75, 0).add(offset);
      const f1 = new THREE.Vector3(-0.85, 0.05, 0).add(offset);
      const f2 = new THREE.Vector3(0.85, 0.05, 0).add(offset);

      const legL = store.addSparAlongSegment('medium', f1, pTop, false);
      const legR = store.addSparAlongSegment('medium', f2, pTop, false);

      // Crossbar at y = 0.8m (leg spacing is ~1.3m, we use medium or stave resting on z = 0.06m)
      const pLeft = new THREE.Vector3(-0.65, 0.8, 0.05).add(offset);
      const pRight = new THREE.Vector3(0.65, 0.8, 0.05).add(offset);
      const cross = store.addSparAlongSegment('stave', pLeft, pRight, false);

      // Base tie stave between feet
      const bLeft = new THREE.Vector3(-0.75, 0.2, -0.05).add(offset);
      const bRight = new THREE.Vector3(0.75, 0.2, -0.05).add(offset);
      const baseTie = store.addSparAlongSegment('stave', bLeft, bRight, false);

      // Apex shear lashing
      store.addLashing(legL, legR, pTop, 25.0, 'shear', false, false);
      // Crossbar square lashings
      store.addLashing(legL, cross, pLeft, 80.0, 'square', false, false);
      store.addLashing(legR, cross, pRight, 80.0, 'square', false, false);
      // Base tie lashings (both legs firmly tied)
      store.addLashing(legL, baseTie, bLeft, 80.0, 'square', false, false);
      store.addLashing(legR, baseTie, bRight, 80.0, 'square', false, false);

      // Anchoring stakes for vertical stability
      const stFront = store.addStake(new THREE.Vector3(0, 0.1, 1.8).add(offset), false);
      const stBack = store.addStake(new THREE.Vector3(0, 0.1, -1.8).add(offset), false);
      store.addGuyLine(legL.id, stFront.id, false);
      store.addGuyLine(legR.id, stBack.id, false);

      return [legL, legR, cross, baseTie];
    }
  },

  // -------------------------------------------------------------
  // 3. PLATFORM TOWER
  // -------------------------------------------------------------
  {
    id: 'platform_tower',
    name: 'برج منصة هندسي متزن (Platform Tower)',
    description: 'برج مربع القوائم بارتفاع 3 أمتار مدعم بمقصات X جانبية وأرضية وقوف علوية و20 ربطة كشفية لضمان الاستقرار التام.',
    category: 'جسور',
    difficulty: 'متوسط',
    dimensions: { width: 1.2, length: 1.2, height: 3.1 },
    materials: { staves: 14, medium: 4, long: 0, xlong: 0, lashings: 20, ropeLength: 65 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="7" width="16" height="23" stroke="currentColor" stroke-width="1.5"/>
        <line x1="10" y1="13" x2="26" y2="23" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="26" y1="13" x2="10" y2="23" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="10" y1="13" x2="26" y2="13" stroke="currentColor" stroke-width="1.5"/>
        <line x1="10" y1="23" x2="26" y2="23" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const r = 0.45;
      const c1 = store.addSparAlongSegment('medium', new THREE.Vector3(-r, 0.05, -r).add(offset), new THREE.Vector3(-r, 3.05, -r).add(offset), false);
      const c2 = store.addSparAlongSegment('medium', new THREE.Vector3(r, 0.05, -r).add(offset), new THREE.Vector3(r, 3.05, -r).add(offset), false);
      const c3 = store.addSparAlongSegment('medium', new THREE.Vector3(r, 0.05, r).add(offset), new THREE.Vector3(r, 3.05, r).add(offset), false);
      const c4 = store.addSparAlongSegment('medium', new THREE.Vector3(-r, 0.05, r).add(offset), new THREE.Vector3(-r, 3.05, r).add(offset), false);

      // Top ledger ring at y = 2.6m (with realistic wood thickness offsets)
      const yt = 2.6;
      const t12 = store.addSparAlongSegment('stave', new THREE.Vector3(-r, yt, -r - 0.05).add(offset), new THREE.Vector3(r, yt, -r - 0.05).add(offset), false);
      const t34 = store.addSparAlongSegment('stave', new THREE.Vector3(r, yt, r + 0.05).add(offset), new THREE.Vector3(-r, yt, r + 0.05).add(offset), false);
      const t23 = store.addSparAlongSegment('stave', new THREE.Vector3(r + 0.05, yt - 0.07, -r).add(offset), new THREE.Vector3(r + 0.05, yt - 0.07, r).add(offset), false);
      const t41 = store.addSparAlongSegment('stave', new THREE.Vector3(-r - 0.05, yt - 0.07, r).add(offset), new THREE.Vector3(-r - 0.05, yt - 0.07, -r).add(offset), false);

      // Bottom ledger ring at y = 0.5m
      const yb = 0.5;
      const b12 = store.addSparAlongSegment('stave', new THREE.Vector3(-r, yb, -r - 0.05).add(offset), new THREE.Vector3(r, yb, -r - 0.05).add(offset), false);
      const b34 = store.addSparAlongSegment('stave', new THREE.Vector3(r, yb, r + 0.05).add(offset), new THREE.Vector3(-r, yb, r + 0.05).add(offset), false);
      const b23 = store.addSparAlongSegment('stave', new THREE.Vector3(r + 0.05, yb - 0.07, -r).add(offset), new THREE.Vector3(r + 0.05, yb - 0.07, r).add(offset), false);
      const b41 = store.addSparAlongSegment('stave', new THREE.Vector3(-r - 0.05, yb - 0.07, r).add(offset), new THREE.Vector3(-r - 0.05, yb - 0.07, -r).add(offset), false);

      // Diagonal X braces on Front and Back faces
      const xF1 = store.addSparAlongSegment('stave', new THREE.Vector3(-r, yb + 0.1, -r - 0.08).add(offset), new THREE.Vector3(r, yt - 0.1, -r - 0.08).add(offset), false);
      const xF2 = store.addSparAlongSegment('stave', new THREE.Vector3(r, yb + 0.1, -r - 0.12).add(offset), new THREE.Vector3(-r, yt - 0.1, -r - 0.12).add(offset), false);

      // Top platform flooring planks
      const fPlank1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.25, yt + 0.05, -r).add(offset), new THREE.Vector3(-0.25, yt + 0.05, r).add(offset), false);
      const fPlank2 = store.addSparAlongSegment('stave', new THREE.Vector3(0, yt + 0.05, -r).add(offset), new THREE.Vector3(0, yt + 0.05, r).add(offset), false);
      const fPlank3 = store.addSparAlongSegment('stave', new THREE.Vector3(0.25, yt + 0.05, -r).add(offset), new THREE.Vector3(0.25, yt + 0.05, r).add(offset), false);

      // Top lashings
      store.addLashing(c1, t12, new THREE.Vector3(-r, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c2, t12, new THREE.Vector3(r, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c2, t23, new THREE.Vector3(r, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c3, t23, new THREE.Vector3(r, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(c3, t34, new THREE.Vector3(r, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(c4, t34, new THREE.Vector3(-r, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(c4, t41, new THREE.Vector3(-r, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(c1, t41, new THREE.Vector3(-r, yt, -r).add(offset), 90, 'square', false, false);

      // Bottom lashings
      store.addLashing(c1, b12, new THREE.Vector3(-r, yb, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c2, b12, new THREE.Vector3(r, yb, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c2, b23, new THREE.Vector3(r, yb, -r).add(offset), 90, 'square', false, false);
      store.addLashing(c3, b23, new THREE.Vector3(r, yb, r).add(offset), 90, 'square', false, false);
      store.addLashing(c3, b34, new THREE.Vector3(r, yb, r).add(offset), 90, 'square', false, false);
      store.addLashing(c4, b34, new THREE.Vector3(-r, yb, r).add(offset), 90, 'square', false, false);
      store.addLashing(c4, b41, new THREE.Vector3(-r, yb, r).add(offset), 90, 'square', false, false);
      store.addLashing(c1, b41, new THREE.Vector3(-r, yb, -r).add(offset), 90, 'square', false, false);

      // Floor plank lashings (tied on both front and back beams)
      store.addLashing(t12, fPlank1, new THREE.Vector3(-0.25, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(t34, fPlank1, new THREE.Vector3(-0.25, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(t12, fPlank2, new THREE.Vector3(0, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(t34, fPlank2, new THREE.Vector3(0, yt, r).add(offset), 90, 'square', false, false);
      store.addLashing(t12, fPlank3, new THREE.Vector3(0.25, yt, -r).add(offset), 90, 'square', false, false);
      store.addLashing(t34, fPlank3, new THREE.Vector3(0.25, yt, r).add(offset), 90, 'square', false, false);

      // X-brace corner square lashings & center intersection
      store.addLashing(c1, xF1, new THREE.Vector3(-r, yb + 0.1, -r).add(offset), 60, 'square', false, false);
      store.addLashing(c2, xF1, new THREE.Vector3(r, yt - 0.1, -r).add(offset), 60, 'square', false, false);
      store.addLashing(c2, xF2, new THREE.Vector3(r, yb + 0.1, -r).add(offset), 60, 'square', false, false);
      store.addLashing(c1, xF2, new THREE.Vector3(-r, yt - 0.1, -r).add(offset), 60, 'square', false, false);
      store.addLashing(xF1, xF2, new THREE.Vector3(0, (yt + yb) / 2, -r - 0.1).add(offset), 90, 'diagonal', false, false);

      return [c1, c2, c3, c4, t12, t23, t34, t41, b12, b23, b34, b41, xF1, xF2, fPlank1, fPlank2, fPlank3];
    }
  },

  // -------------------------------------------------------------
  // 4. SCOUT FOOTBRIDGE
  // -------------------------------------------------------------
  {
    id: 'scout_bridge',
    name: 'جسر كشفي للمشاة (Scout Footbridge)',
    description: 'جسر مشاة كلاسيكي بقائمين مقصيين وسكتين طوليتين 4 أمتار مكسوتين بـ 5 ألواح خشبية للمشي ودرابزين أمان.',
    category: 'جسور',
    difficulty: 'متوسط',
    dimensions: { width: 1.4, length: 4.2, height: 2.2 },
    materials: { staves: 8, medium: 4, long: 4, xlong: 0, lashings: 18, ropeLength: 54 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="28" x2="14" y2="12" stroke="currentColor" stroke-width="1.5"/>
        <line x1="14" y1="28" x2="8" y2="12" stroke="currentColor" stroke-width="1.5"/>
        <line x1="28" y1="28" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/>
        <line x1="22" y1="28" x2="28" y2="12" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const zT1 = -1.2;
      const zT2 = 1.2;

      // Trestle 1
      const leg1A = store.addSparAlongSegment('medium', new THREE.Vector3(-0.55, 0.05, zT1).add(offset), new THREE.Vector3(0.4, 2.2, zT1).add(offset), false);
      const leg1B = store.addSparAlongSegment('medium', new THREE.Vector3(0.55, 0.05, zT1).add(offset), new THREE.Vector3(-0.4, 2.2, zT1).add(offset), false);
      const cross1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.5, 0.9, zT1 + 0.06).add(offset), new THREE.Vector3(0.5, 0.9, zT1 + 0.06).add(offset), false);

      // Trestle 2
      const leg2A = store.addSparAlongSegment('medium', new THREE.Vector3(-0.55, 0.05, zT2).add(offset), new THREE.Vector3(0.4, 2.2, zT2).add(offset), false);
      const leg2B = store.addSparAlongSegment('medium', new THREE.Vector3(0.55, 0.05, zT2).add(offset), new THREE.Vector3(-0.4, 2.2, zT2).add(offset), false);
      const cross2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.5, 0.9, zT2 - 0.06).add(offset), new THREE.Vector3(0.5, 0.9, zT2 - 0.06).add(offset), false);

      // Walkway Stringers (4m long spars)
      const railL = store.addSparAlongSegment('long', new THREE.Vector3(-0.25, 0.98, -2.0).add(offset), new THREE.Vector3(-0.25, 0.98, 2.0).add(offset), false);
      const railR = store.addSparAlongSegment('long', new THREE.Vector3(0.25, 0.98, -2.0).add(offset), new THREE.Vector3(0.25, 0.98, 2.0).add(offset), false);

      // Handrails (4m long spars at y = 1.7m)
      const handL = store.addSparAlongSegment('long', new THREE.Vector3(-0.35, 1.7, -2.0).add(offset), new THREE.Vector3(-0.35, 1.7, 2.0).add(offset), false);
      const handR = store.addSparAlongSegment('long', new THREE.Vector3(0.35, 1.7, -2.0).add(offset), new THREE.Vector3(0.35, 1.7, 2.0).add(offset), false);

      // Deck walkway planks (staves across rails)
      const planks: Spar[] = [];
      [-1.4, -0.7, 0.0, 0.7, 1.4].forEach(zPos => {
        const p = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 1.05, zPos).add(offset), new THREE.Vector3(0.35, 1.05, zPos).add(offset), false);
        planks.push(p);
      });

      // Trestle apex and cross lashings
      store.addLashing(leg1A, leg1B, new THREE.Vector3(0, 1.15, zT1).add(offset), 45, 'diagonal', false, false);
      store.addLashing(leg1A, cross1, new THREE.Vector3(-0.25, 0.9, zT1).add(offset), 75, 'square', false, false);
      store.addLashing(leg1B, cross1, new THREE.Vector3(0.25, 0.9, zT1).add(offset), 75, 'square', false, false);

      store.addLashing(leg2A, leg2B, new THREE.Vector3(0, 1.15, zT2).add(offset), 45, 'diagonal', false, false);
      store.addLashing(leg2A, cross2, new THREE.Vector3(-0.25, 0.9, zT2).add(offset), 75, 'square', false, false);
      store.addLashing(leg2B, cross2, new THREE.Vector3(0.25, 0.9, zT2).add(offset), 75, 'square', false, false);

      // Stringers to crossbars
      store.addLashing(cross1, railL, new THREE.Vector3(-0.25, 0.9, zT1).add(offset), 90, 'square', false, false);
      store.addLashing(cross1, railR, new THREE.Vector3(0.25, 0.9, zT1).add(offset), 90, 'square', false, false);
      store.addLashing(cross2, railL, new THREE.Vector3(-0.25, 0.9, zT2).add(offset), 90, 'square', false, false);
      store.addLashing(cross2, railR, new THREE.Vector3(0.25, 0.9, zT2).add(offset), 90, 'square', false, false);

      // Handrails to trestles
      store.addLashing(leg1A, handL, new THREE.Vector3(-0.35, 1.7, zT1).add(offset), 90, 'square', false, false);
      store.addLashing(leg1B, handR, new THREE.Vector3(0.35, 1.7, zT1).add(offset), 90, 'square', false, false);
      store.addLashing(leg2A, handL, new THREE.Vector3(-0.35, 1.7, zT2).add(offset), 90, 'square', false, false);
      store.addLashing(leg2B, handR, new THREE.Vector3(0.35, 1.7, zT2).add(offset), 90, 'square', false, false);

      // Planks to both rails
      planks.forEach(p => {
        store.addLashing(railL, p, new THREE.Vector3(-0.25, 1.05, p.position.z).add(offset), 90, 'square', false, false);
        store.addLashing(railR, p, new THREE.Vector3(0.25, 1.05, p.position.z).add(offset), 90, 'square', false, false);
      });

      return [leg1A, leg1B, cross1, leg2A, leg2B, cross2, railL, railR, handL, handR, ...planks];
    }
  },

  // -------------------------------------------------------------
  // 5. FLAGPOLE (ساري علم متزن كشفياً)
  // -------------------------------------------------------------
  {
    id: 'flagpole',
    name: 'ساري علم كشفي متزن (Scout Flagpole)',
    description: 'ساري علم رأسي بارتفاع 5 أمتار مثبت بقاعدة أرضية و3 أوتاد موزعة بزوايا 120° على مسافة 3.2م تحقق زاوية شد مثالية 45° ومقاومة للرياح.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 6.5, length: 6.5, height: 5.1 },
    materials: { staves: 0, medium: 0, long: 0, xlong: 1, lashings: 0, ropeLength: 22, stakes: 3, guyLines: 3 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="4" x2="18" y2="32" stroke="currentColor" stroke-width="2"/>
        <path d="M18 6H28V12H18V6Z" fill="#22c55e" stroke="currentColor" stroke-width="1"/>
        <line x1="18" y1="14" x2="8" y2="30" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="18" y1="14" x2="28" y2="30" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pole = store.addSparAlongSegment('xlong', new THREE.Vector3(0, 0.05, 0).add(offset), new THREE.Vector3(0, 5.05, 0).add(offset), false);

      const r = 3.2;
      const st1 = store.addStake(new THREE.Vector3(0, 0.1, r).add(offset), false);
      const st2 = store.addStake(new THREE.Vector3(r * Math.cos(Math.PI / 6), 0.1, -r * Math.sin(Math.PI / 6)).add(offset), false);
      const st3 = store.addStake(new THREE.Vector3(-r * Math.cos(Math.PI / 6), 0.1, -r * Math.sin(Math.PI / 6)).add(offset), false);

      store.addGuyLine(pole.id, st1.id, false);
      store.addGuyLine(pole.id, st2.id, false);
      store.addGuyLine(pole.id, st3.id, false);

      return [pole];
    }
  },

  // -------------------------------------------------------------
  // 6. QUADPOD (حامل رباعي)
  // -------------------------------------------------------------
  {
    id: 'quadpod',
    name: 'حامل رباعي مقوى (Reinforced Quadpod)',
    description: 'حامل رباعي القوائم ذو استقرار ممتاز للأعمال الشاقة مدعم بـ 4 عوارض سفلية لمنع انزلاق الأرجل.',
    category: 'اساسي',
    difficulty: 'متوسط',
    dimensions: { width: 2.2, length: 2.2, height: 2.75 },
    materials: { staves: 4, medium: 4, long: 0, xlong: 0, lashings: 8, ropeLength: 32 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="6" x2="8" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="18" y1="6" x2="28" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="18" y1="6" x2="13" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <line x1="18" y1="6" x2="23" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <line x1="10" y1="24" x2="26" y2="24" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="18" cy="6" r="2.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pTop = new THREE.Vector3(0, 2.75, 0).add(offset);
      const d = 0.9;
      const f1 = new THREE.Vector3(-d, 0.05, -d).add(offset);
      const f2 = new THREE.Vector3(d, 0.05, -d).add(offset);
      const f3 = new THREE.Vector3(d, 0.05, d).add(offset);
      const f4 = new THREE.Vector3(-d, 0.05, d).add(offset);

      const s1 = store.addSparAlongSegment('medium', f1, pTop, false);
      const s2 = store.addSparAlongSegment('medium', f2, pTop, false);
      const s3 = store.addSparAlongSegment('medium', f3, pTop, false);
      const s4 = store.addSparAlongSegment('medium', f4, pTop, false);

      const b1 = new THREE.Vector3().lerpVectors(f1, pTop, 0.16);
      const b2 = new THREE.Vector3().lerpVectors(f2, pTop, 0.16);
      const b3 = new THREE.Vector3().lerpVectors(f3, pTop, 0.16);
      const b4 = new THREE.Vector3().lerpVectors(f4, pTop, 0.16);

      const sp12 = store.addSparAlongSegment('stave', b1, b2, false);
      const sp23 = store.addSparAlongSegment('stave', b2, b3, false);
      const sp34 = store.addSparAlongSegment('stave', b3, b4, false);
      const sp41 = store.addSparAlongSegment('stave', b4, b1, false);

      store.addLashing(s1, s2, pTop, 20, 'tripod', false, false);
      store.addLashing(s2, s3, pTop, 20, 'tripod', false, false);
      store.addLashing(s3, s4, pTop, 20, 'tripod', false, false);
      store.addLashing(s4, s1, pTop, 20, 'tripod', false, false);

      // Base perimeter square lashings tied to both adjacent legs
      store.addLashing(s1, sp12, b1, 90, 'square', false, false);
      store.addLashing(s2, sp12, b2, 90, 'square', false, false);

      store.addLashing(s2, sp23, b2, 90, 'square', false, false);
      store.addLashing(s3, sp23, b3, 90, 'square', false, false);

      store.addLashing(s3, sp34, b3, 90, 'square', false, false);
      store.addLashing(s4, sp34, b4, 90, 'square', false, false);

      store.addLashing(s4, sp41, b4, 90, 'square', false, false);
      store.addLashing(s1, sp41, b1, 90, 'square', false, false);

      return [s1, s2, s3, s4, sp12, sp23, sp34, sp41];
    }
  },

  // -------------------------------------------------------------
  // 7. TRESTLE (حامل مقصي H)
  // -------------------------------------------------------------
  {
    id: 'trestle',
    name: 'حامل مقصي كشفي (Trestle H-Frame)',
    description: 'قائم ثنائي بضلعين متوازيين وعارضتين أفقيتين ودعامتين مقصيتين X وقاعدتي ارتكاز أرضيتين للاستقرار.',
    category: 'اساسي',
    difficulty: 'متوسط',
    dimensions: { width: 1.2, length: 1.2, height: 3.1 },
    materials: { staves: 6, medium: 2, long: 0, xlong: 0, lashings: 11, ropeLength: 35 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="11" y1="6" x2="11" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="25" y1="6" x2="25" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="10" x2="28" y2="10" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="26" x2="28" y2="26" stroke="currentColor" stroke-width="1.5"/>
        <line x1="11" y1="10" x2="25" y2="26" stroke="currentColor" stroke-width="1.2"/>
        <line x1="25" y1="10" x2="11" y2="26" stroke="currentColor" stroke-width="1.2"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const p1 = store.addSparAlongSegment('medium', new THREE.Vector3(-0.4, 0.05, 0).add(offset), new THREE.Vector3(-0.4, 3.05, 0).add(offset), false);
      const p2 = store.addSparAlongSegment('medium', new THREE.Vector3(0.4, 0.05, 0).add(offset), new THREE.Vector3(0.4, 3.05, 0).add(offset), false);

      const top = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 2.5, 0.05).add(offset), new THREE.Vector3(0.55, 2.5, 0.05).add(offset), false);
      const bottom = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.5, 0.05).add(offset), new THREE.Vector3(0.55, 0.5, 0.05).add(offset), false);

      const d1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.6, -0.05).add(offset), new THREE.Vector3(0.4, 2.4, -0.05).add(offset), false);
      const d2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.4, 0.6, -0.09).add(offset), new THREE.Vector3(-0.4, 2.4, -0.09).add(offset), false);

      const footL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.05, -0.5).add(offset), new THREE.Vector3(-0.4, 0.05, 0.5).add(offset), false);
      const footR = store.addSparAlongSegment('stave', new THREE.Vector3(0.4, 0.05, -0.5).add(offset), new THREE.Vector3(0.4, 0.05, 0.5).add(offset), false);

      store.addLashing(p1, top, new THREE.Vector3(-0.4, 2.5, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p2, top, new THREE.Vector3(0.4, 2.5, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p1, bottom, new THREE.Vector3(-0.4, 0.5, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p2, bottom, new THREE.Vector3(0.4, 0.5, 0).add(offset), 90, 'square', false, false);

      store.addLashing(p1, d1, new THREE.Vector3(-0.4, 0.6, 0).add(offset), 60, 'square', false, false);
      store.addLashing(p2, d1, new THREE.Vector3(0.4, 2.4, 0).add(offset), 60, 'square', false, false);
      store.addLashing(p2, d2, new THREE.Vector3(0.4, 0.6, 0).add(offset), 60, 'square', false, false);
      store.addLashing(p1, d2, new THREE.Vector3(-0.4, 2.4, 0).add(offset), 60, 'square', false, false);
      store.addLashing(d1, d2, new THREE.Vector3(0, 1.5, -0.07).add(offset), 90, 'diagonal', false, false);

      store.addLashing(p1, footL, new THREE.Vector3(-0.4, 0.05, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p2, footR, new THREE.Vector3(0.4, 0.05, 0).add(offset), 90, 'square', false, false);

      return [p1, p2, top, bottom, d1, d2, footL, footR];
    }
  },

  // -------------------------------------------------------------
  // 8. CAMP TABLE (طاولة تخييم متكاملة)
  // -------------------------------------------------------------
  {
    id: 'camp_table',
    name: 'طاولة طليعة كشفية (Patrol Dining Table)',
    description: 'طاولة طعام وإعداد متكاملة مكونة من حاملين H وألواح سطح مربوطة بالكامل مع عوارض ربط سفلية.',
    category: 'مطبخ',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.0, length: 1.3, height: 1.0 },
    materials: { staves: 14, medium: 0, long: 0, xlong: 0, lashings: 16, ropeLength: 48 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="16" x2="28" y2="16" stroke="currentColor" stroke-width="2.5"/>
        <line x1="11" y1="16" x2="11" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="25" y1="16" x2="25" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="25" x2="28" y2="25" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const z1 = -0.45;
      const z2 = 0.45;

      const p11 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z1).add(offset), new THREE.Vector3(-0.35, 1.0, z1).add(offset), false);
      const p12 = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z1).add(offset), new THREE.Vector3(0.35, 1.0, z1).add(offset), false);
      const t1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.88, z1 + 0.05).add(offset), new THREE.Vector3(0.45, 0.88, z1 + 0.05).add(offset), false);
      const b1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.25, z1 + 0.05).add(offset), new THREE.Vector3(0.45, 0.25, z1 + 0.05).add(offset), false);

      const p21 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z2).add(offset), new THREE.Vector3(-0.35, 1.0, z2).add(offset), false);
      const p22 = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z2).add(offset), new THREE.Vector3(0.35, 1.0, z2).add(offset), false);
      const t2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.88, z2 - 0.05).add(offset), new THREE.Vector3(0.45, 0.88, z2 - 0.05).add(offset), false);
      const b2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.25, z2 - 0.05).add(offset), new THREE.Vector3(0.45, 0.25, z2 - 0.05).add(offset), false);

      const lSprL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.25, -0.55).add(offset), new THREE.Vector3(-0.35, 0.25, 0.55).add(offset), false);
      const lSprR = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.25, -0.55).add(offset), new THREE.Vector3(0.35, 0.25, 0.55).add(offset), false);

      const tab1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.3, 0.94, -0.6).add(offset), new THREE.Vector3(-0.3, 0.94, 0.6).add(offset), false);
      const tab2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.1, 0.94, -0.6).add(offset), new THREE.Vector3(-0.1, 0.94, 0.6).add(offset), false);
      const tab3 = store.addSparAlongSegment('stave', new THREE.Vector3(0.1, 0.94, -0.6).add(offset), new THREE.Vector3(0.1, 0.94, 0.6).add(offset), false);
      const tab4 = store.addSparAlongSegment('stave', new THREE.Vector3(0.3, 0.94, -0.6).add(offset), new THREE.Vector3(0.3, 0.94, 0.6).add(offset), false);

      store.addLashing(p11, t1, new THREE.Vector3(-0.35, 0.88, z1).add(offset), 90, 'square', false, false);
      store.addLashing(p12, t1, new THREE.Vector3(0.35, 0.88, z1).add(offset), 90, 'square', false, false);
      store.addLashing(p11, b1, new THREE.Vector3(-0.35, 0.25, z1).add(offset), 90, 'square', false, false);
      store.addLashing(p12, b1, new THREE.Vector3(0.35, 0.25, z1).add(offset), 90, 'square', false, false);

      store.addLashing(p21, t2, new THREE.Vector3(-0.35, 0.88, z2).add(offset), 90, 'square', false, false);
      store.addLashing(p22, t2, new THREE.Vector3(0.35, 0.88, z2).add(offset), 90, 'square', false, false);
      store.addLashing(p21, b2, new THREE.Vector3(-0.35, 0.25, z2).add(offset), 90, 'square', false, false);
      store.addLashing(p22, b2, new THREE.Vector3(0.35, 0.25, z2).add(offset), 90, 'square', false, false);

      store.addLashing(b1, lSprL, new THREE.Vector3(-0.35, 0.25, z1).add(offset), 90, 'square', false, false);
      store.addLashing(b1, lSprR, new THREE.Vector3(0.35, 0.25, z1).add(offset), 90, 'square', false, false);
      store.addLashing(b2, lSprL, new THREE.Vector3(-0.35, 0.25, z2).add(offset), 90, 'square', false, false);
      store.addLashing(b2, lSprR, new THREE.Vector3(0.35, 0.25, z2).add(offset), 90, 'square', false, false);

      [tab1, tab2, tab3, tab4].forEach(tab => {
        store.addLashing(t1, tab, new THREE.Vector3(tab.position.x, 0.94, z1).add(offset), 90, 'square', false, false);
        store.addLashing(t2, tab, new THREE.Vector3(tab.position.x, 0.94, z2).add(offset), 90, 'square', false, false);
      });

      return [p11, p12, t1, b1, p21, p22, t2, b2, lSprL, lSprR, tab1, tab2, tab3, tab4];
    }
  },

  // -------------------------------------------------------------
  // 9. CAMP GATE (بوابة معسكر كبرى مدعمة)
  // -------------------------------------------------------------
  {
    id: 'camp_gate',
    name: 'بوابة معسكر كشفية مدعمة (Pioneer Camp Gate)',
    description: 'بوابة دخول رئيسية بقائمين رأسيين 3م وعارضة علوية 4م مدعمة بقائمتين مائلتين 45° في الخلف لتأمين ثبات ذاتي بدون حبال شد تعيق المرور.',
    category: 'خيام',
    difficulty: 'متوسط',
    dimensions: { width: 4.2, length: 1.8, height: 3.1 },
    materials: { staves: 2, medium: 4, long: 1, xlong: 0, lashings: 6, ropeLength: 22 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="12" x2="10" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="26" y1="12" x2="26" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="6" y1="12" x2="30" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="10" y1="20" x2="4" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <line x1="26" y1="20" x2="32" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="10" cy="12" r="2.5" fill="#facc15"/>
        <circle cx="26" cy="12" r="2.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const p1 = store.addSparAlongSegment('medium', new THREE.Vector3(-1.2, 0.05, 0).add(offset), new THREE.Vector3(-1.2, 3.05, 0).add(offset), false);
      const p2 = store.addSparAlongSegment('medium', new THREE.Vector3(1.2, 0.05, 0).add(offset), new THREE.Vector3(1.2, 3.05, 0).add(offset), false);

      const lintel = store.addSparAlongSegment('long', new THREE.Vector3(-2.0, 2.9, 0.05).add(offset), new THREE.Vector3(2.0, 2.9, 0.05).add(offset), false);

      const butt1 = store.addSparAlongSegment('medium', new THREE.Vector3(-1.2, 2.0, 0).add(offset), new THREE.Vector3(-1.2, 0.05, -1.8).add(offset), false);
      const butt2 = store.addSparAlongSegment('medium', new THREE.Vector3(1.2, 2.0, 0).add(offset), new THREE.Vector3(1.2, 0.05, -1.8).add(offset), false);

      const brk1 = store.addSparAlongSegment('stave', new THREE.Vector3(-1.2, 2.3, 0.05).add(offset), new THREE.Vector3(-0.6, 2.9, 0.05).add(offset), false);
      const brk2 = store.addSparAlongSegment('stave', new THREE.Vector3(1.2, 2.3, 0.05).add(offset), new THREE.Vector3(0.6, 2.9, 0.05).add(offset), false);

      store.addLashing(p1, lintel, new THREE.Vector3(-1.2, 2.9, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p2, lintel, new THREE.Vector3(1.2, 2.9, 0).add(offset), 90, 'square', false, false);

      store.addLashing(p1, butt1, new THREE.Vector3(-1.2, 2.0, 0).add(offset), 45, 'diagonal', false, false);
      store.addLashing(p2, butt2, new THREE.Vector3(1.2, 2.0, 0).add(offset), 45, 'diagonal', false, false);

      store.addLashing(p1, brk1, new THREE.Vector3(-1.2, 2.3, 0.05).add(offset), 45, 'square', false, false);
      store.addLashing(p2, brk2, new THREE.Vector3(1.2, 2.3, 0.05).add(offset), 45, 'square', false, false);

      return [p1, p2, lintel, butt1, butt2, brk1, brk2];
    }
  },

  // -------------------------------------------------------------
  // 10. WATCHTOWER (برج مراقبة واستطلاع)
  // -------------------------------------------------------------
  {
    id: 'watchtower',
    name: 'برج استطلاع ومراقبة هرمي (Pyramid Watchtower)',
    description: 'برج مراقبة مخروطي بارتفاع 4.2 متر بقوائم طويلة وأرضية منصة علوية وسياج أمان ودعامات X متكاملة الربطات.',
    category: 'جسور',
    difficulty: 'متقدم',
    dimensions: { width: 1.8, length: 1.8, height: 4.2 },
    materials: { staves: 16, medium: 0, long: 4, xlong: 0, lashings: 24, ropeLength: 78 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="12" y1="4" x2="8" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="24" y1="4" x2="28" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="10" y1="12" x2="26" y2="12" stroke="currentColor" stroke-width="1.5"/>
        <line x1="11" y1="22" x2="25" y2="22" stroke="currentColor" stroke-width="1.5"/>
        <line x1="11" y1="12" x2="25" y2="22" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="25" y1="12" x2="11" y2="22" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const c1 = store.addSparAlongSegment('long', new THREE.Vector3(-0.8, 0.05, -0.8).add(offset), new THREE.Vector3(-0.4, 4.05, -0.4).add(offset), false);
      const c2 = store.addSparAlongSegment('long', new THREE.Vector3(0.8, 0.05, -0.8).add(offset), new THREE.Vector3(0.4, 4.05, -0.4).add(offset), false);
      const c3 = store.addSparAlongSegment('long', new THREE.Vector3(0.8, 0.05, 0.8).add(offset), new THREE.Vector3(0.4, 4.05, 0.4).add(offset), false);
      const c4 = store.addSparAlongSegment('long', new THREE.Vector3(-0.8, 0.05, 0.8).add(offset), new THREE.Vector3(-0.4, 4.05, 0.4).add(offset), false);

      const yt = 3.3;
      const rt = 0.45;
      const t12 = store.addSparAlongSegment('stave', new THREE.Vector3(-rt, yt, -rt).add(offset), new THREE.Vector3(rt, yt, -rt).add(offset), false);
      const t23 = store.addSparAlongSegment('stave', new THREE.Vector3(rt, yt - 0.06, -rt).add(offset), new THREE.Vector3(rt, yt - 0.06, rt).add(offset), false);
      const t34 = store.addSparAlongSegment('stave', new THREE.Vector3(rt, yt, rt).add(offset), new THREE.Vector3(-rt, yt, rt).add(offset), false);
      const t41 = store.addSparAlongSegment('stave', new THREE.Vector3(-rt, yt - 0.06, rt).add(offset), new THREE.Vector3(-rt, yt - 0.06, -rt).add(offset), false);

      const yb = 1.6;
      const rb = 0.62;
      const b12 = store.addSparAlongSegment('stave', new THREE.Vector3(-rb, yb, -rb).add(offset), new THREE.Vector3(rb, yb, -rb).add(offset), false);
      const b23 = store.addSparAlongSegment('stave', new THREE.Vector3(rb, yb - 0.06, -rb).add(offset), new THREE.Vector3(rb, yb - 0.06, rb).add(offset), false);
      const b34 = store.addSparAlongSegment('stave', new THREE.Vector3(rb, yb, rb).add(offset), new THREE.Vector3(-rb, yb, rb).add(offset), false);
      const b41 = store.addSparAlongSegment('stave', new THREE.Vector3(-rb, yb - 0.06, rb).add(offset), new THREE.Vector3(-rb, yb - 0.06, -rb).add(offset), false);

      const yh = 3.9;
      const rh = 0.42;
      const h12 = store.addSparAlongSegment('stave', new THREE.Vector3(-rh, yh, -rh).add(offset), new THREE.Vector3(rh, yh, -rh).add(offset), false);
      const h34 = store.addSparAlongSegment('stave', new THREE.Vector3(rh, yh, rh).add(offset), new THREE.Vector3(-rh, yh, rh).add(offset), false);

      const f1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.18, yt + 0.05, -rt).add(offset), new THREE.Vector3(-0.18, yt + 0.05, rt).add(offset), false);
      const f2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.18, yt + 0.05, -rt).add(offset), new THREE.Vector3(0.18, yt + 0.05, rt).add(offset), false);

      const x1 = store.addSparAlongSegment('stave', new THREE.Vector3(-rb, yb, -rb - 0.05).add(offset), new THREE.Vector3(rt, yt, -rt - 0.05).add(offset), false);
      const x2 = store.addSparAlongSegment('stave', new THREE.Vector3(rb, yb, -rb - 0.08).add(offset), new THREE.Vector3(-rt, yt, -rt - 0.08).add(offset), false);

      store.addLashing(c1, t12, new THREE.Vector3(-rt, yt, -rt).add(offset), 90, 'square', false, false);
      store.addLashing(c2, t12, new THREE.Vector3(rt, yt, -rt).add(offset), 90, 'square', false, false);
      store.addLashing(c2, t23, new THREE.Vector3(rt, yt, -rt).add(offset), 90, 'square', false, false);
      store.addLashing(c3, t23, new THREE.Vector3(rt, yt, rt).add(offset), 90, 'square', false, false);
      store.addLashing(c3, t34, new THREE.Vector3(rt, yt, rt).add(offset), 90, 'square', false, false);
      store.addLashing(c4, t34, new THREE.Vector3(-rt, yt, rt).add(offset), 90, 'square', false, false);
      store.addLashing(c4, t41, new THREE.Vector3(-rt, yt, rt).add(offset), 90, 'square', false, false);
      store.addLashing(c1, t41, new THREE.Vector3(-rt, yt, -rt).add(offset), 90, 'square', false, false);

      store.addLashing(c1, b12, new THREE.Vector3(-rb, yb, -rb).add(offset), 90, 'square', false, false);
      store.addLashing(c2, b12, new THREE.Vector3(rb, yb, -rb).add(offset), 90, 'square', false, false);
      store.addLashing(c2, b23, new THREE.Vector3(rb, yb, -rb).add(offset), 90, 'square', false, false);
      store.addLashing(c3, b23, new THREE.Vector3(rb, yb, rb).add(offset), 90, 'square', false, false);
      store.addLashing(c3, b34, new THREE.Vector3(rb, yb, rb).add(offset), 90, 'square', false, false);
      store.addLashing(c4, b34, new THREE.Vector3(-rb, yb, rb).add(offset), 90, 'square', false, false);
      store.addLashing(c4, b41, new THREE.Vector3(-rb, yb, rb).add(offset), 90, 'square', false, false);
      store.addLashing(c1, b41, new THREE.Vector3(-rb, yb, -rb).add(offset), 90, 'square', false, false);

      store.addLashing(c1, h12, new THREE.Vector3(-rh, yh, -rh).add(offset), 90, 'square', false, false);
      store.addLashing(c2, h12, new THREE.Vector3(rh, yh, -rh).add(offset), 90, 'square', false, false);
      store.addLashing(c3, h34, new THREE.Vector3(rh, yh, rh).add(offset), 90, 'square', false, false);
      store.addLashing(c4, h34, new THREE.Vector3(-rh, yh, rh).add(offset), 90, 'square', false, false);

      store.addLashing(t12, f1, new THREE.Vector3(-0.18, yt, -rt).add(offset), 90, 'square', false, false);
      store.addLashing(t34, f1, new THREE.Vector3(-0.18, yt, rt).add(offset), 90, 'square', false, false);
      store.addLashing(t12, f2, new THREE.Vector3(0.18, yt, -rt).add(offset), 90, 'square', false, false);
      store.addLashing(t34, f2, new THREE.Vector3(0.18, yt, rt).add(offset), 90, 'square', false, false);

      store.addLashing(c1, x1, new THREE.Vector3(-rb, yb, -rb).add(offset), 60, 'square', false, false);
      store.addLashing(c2, x1, new THREE.Vector3(rt, yt, -rt).add(offset), 60, 'square', false, false);
      store.addLashing(c2, x2, new THREE.Vector3(rb, yb, -rb).add(offset), 60, 'square', false, false);
      store.addLashing(c1, x2, new THREE.Vector3(-rt, yt, -rt).add(offset), 60, 'square', false, false);
      store.addLashing(x1, x2, new THREE.Vector3(0, (yt + yb) / 2, -0.5).add(offset), 90, 'diagonal', false, false);

      return [c1, c2, c3, c4, t12, t23, t34, t41, b12, b23, b34, b41, h12, h34, f1, f2, x1, x2];
    }
  },

  // -------------------------------------------------------------
  // 11. MONKEY BRIDGE (جسر القرود المعلق)
  // -------------------------------------------------------------
  {
    id: 'monkey_bridge',
    name: 'جسر معلق كشفي متزن (Monkey Bridge)',
    description: 'جسر معلق كلاسيكي بقائمين ثنائيين وحبل مسار سفلي وحبلي درابزين ومثبت بـ 4 أوتاد شد أرضية.',
    category: 'جسور',
    difficulty: 'متقدم',
    dimensions: { width: 1.2, length: 4.8, height: 1.8 },
    materials: { staves: 6, medium: 0, long: 3, xlong: 0, lashings: 10, ropeLength: 42, stakes: 4, guyLines: 4 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="24" x2="32" y2="24" stroke="currentColor" stroke-width="2"/>
        <line x1="4" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
        <line x1="12" y1="10" x2="12" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="24" y1="10" x2="24" y2="28" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const zCenter = 1.5;

      const leg1L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.05, -zCenter).add(offset), new THREE.Vector3(0, 1.25, -zCenter).add(offset), false);
      const leg1R = store.addSparAlongSegment('stave', new THREE.Vector3(0.45, 0.05, -zCenter).add(offset), new THREE.Vector3(0, 1.25, -zCenter).add(offset), false);
      const cross1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.35, -zCenter).add(offset), new THREE.Vector3(0.4, 0.35, -zCenter).add(offset), false);

      const leg2L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, 0.05, zCenter).add(offset), new THREE.Vector3(0, 1.25, zCenter).add(offset), false);
      const leg2R = store.addSparAlongSegment('stave', new THREE.Vector3(0.45, 0.05, zCenter).add(offset), new THREE.Vector3(0, 1.25, zCenter).add(offset), false);
      const cross2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.35, zCenter).add(offset), new THREE.Vector3(0.4, 0.35, zCenter).add(offset), false);

      const walk = store.addSparAlongSegment('long', new THREE.Vector3(0, 0.38, -2.0).add(offset), new THREE.Vector3(0, 0.38, 2.0).add(offset), false);
      const railL = store.addSparAlongSegment('long', new THREE.Vector3(-0.25, 1.15, -2.0).add(offset), new THREE.Vector3(-0.25, 1.15, 2.0).add(offset), false);
      const railR = store.addSparAlongSegment('long', new THREE.Vector3(0.25, 1.15, -2.0).add(offset), new THREE.Vector3(0.25, 1.15, 2.0).add(offset), false);

      store.addLashing(leg1L, leg1R, new THREE.Vector3(0, 1.25, -zCenter).add(offset), 45, 'shear', false, false);
      store.addLashing(leg1L, cross1, new THREE.Vector3(-0.3, 0.35, -zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(leg1R, cross1, new THREE.Vector3(0.3, 0.35, -zCenter).add(offset), 90, 'square', false, false);

      store.addLashing(leg2L, leg2R, new THREE.Vector3(0, 1.25, zCenter).add(offset), 45, 'shear', false, false);
      store.addLashing(leg2L, cross2, new THREE.Vector3(-0.3, 0.35, zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(leg2R, cross2, new THREE.Vector3(0.3, 0.35, zCenter).add(offset), 90, 'square', false, false);

      store.addLashing(cross1, walk, new THREE.Vector3(0, 0.35, -zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(cross2, walk, new THREE.Vector3(0, 0.35, zCenter).add(offset), 90, 'square', false, false);

      store.addLashing(leg1L, railL, new THREE.Vector3(-0.25, 1.15, -zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(leg1R, railR, new THREE.Vector3(0.25, 1.15, -zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(leg2L, railL, new THREE.Vector3(-0.25, 1.15, zCenter).add(offset), 90, 'square', false, false);
      store.addLashing(leg2R, railR, new THREE.Vector3(0.25, 1.15, zCenter).add(offset), 90, 'square', false, false);

      const st1 = store.addStake(new THREE.Vector3(-0.8, 0.1, -2.4).add(offset), false);
      const st2 = store.addStake(new THREE.Vector3(0.8, 0.1, -2.4).add(offset), false);
      const st3 = store.addStake(new THREE.Vector3(-0.8, 0.1, 2.4).add(offset), false);
      const st4 = store.addStake(new THREE.Vector3(0.8, 0.1, 2.4).add(offset), false);

      store.addGuyLine(leg1L.id, st1.id, false);
      store.addGuyLine(leg1R.id, st2.id, false);
      store.addGuyLine(leg2L.id, st3.id, false);
      store.addGuyLine(leg2R.id, st4.id, false);

      return [leg1L, leg1R, cross1, leg2L, leg2R, cross2, walk, railL, railR];
    }
  },

  // -------------------------------------------------------------
  // 12. DOUBLE FLAGPOLE
  // -------------------------------------------------------------
  {
    id: 'double_flagpole',
    name: 'ساري علم مركب (Compound Flagpole)',
    description: 'ساري علم ممتد مكوّن من ساريتين متراكبتين ومربوطتين برباطي قص مع 4 حبال شد متباعدة بزاوية 45° للاستقرار التام.',
    category: 'ادوات',
    difficulty: 'متوسط',
    dimensions: { width: 5.5, length: 5.5, height: 4.8 },
    materials: { staves: 0, medium: 2, long: 0, xlong: 0, lashings: 2, ropeLength: 26, stakes: 4, guyLines: 4 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="16" y1="4" x2="16" y2="22" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="14" x2="20" y2="32" stroke="currentColor" stroke-width="2"/>
        <rect x="15" y="16" width="6" height="4" rx="1" fill="#facc15" opacity="0.8"/>
        <path d="M16 6H26V11H16V6Z" fill="#3b82f6" stroke="currentColor" stroke-width="1"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const lower = store.addSparAlongSegment('medium', new THREE.Vector3(0, 0.05, 0).add(offset), new THREE.Vector3(0, 3.05, 0).add(offset), false);
      const upper = store.addSparAlongSegment('medium', new THREE.Vector3(0.08, 1.5, 0).add(offset), new THREE.Vector3(0.08, 4.50, 0).add(offset), false);

      const r = 2.6;
      const st1 = store.addStake(new THREE.Vector3(-r, 0.1, -r).add(offset), false);
      const st2 = store.addStake(new THREE.Vector3(r, 0.1, -r).add(offset), false);
      const st3 = store.addStake(new THREE.Vector3(r, 0.1, r).add(offset), false);
      const st4 = store.addStake(new THREE.Vector3(-r, 0.1, r).add(offset), false);

      store.addLashing(lower, upper, new THREE.Vector3(0.04, 1.8, 0).add(offset), 0, 'shear', false, false);
      store.addLashing(lower, upper, new THREE.Vector3(0.04, 2.7, 0).add(offset), 0, 'shear', false, false);

      store.addGuyLine(upper.id, st1.id, false);
      store.addGuyLine(upper.id, st2.id, false);
      store.addGuyLine(upper.id, st3.id, false);
      store.addGuyLine(upper.id, st4.id, false);

      return [lower, upper];
    }
  },

  // -------------------------------------------------------------
  // 13. CAMP CHAIR (كرسي معسكر بمسند ظهر)
  // -------------------------------------------------------------
  {
    id: 'camp_chair',
    name: 'كرسي معسكر كشفي مريح (Rustic Camp Chair)',
    description: 'كرسي كشفي مريح وقوي بمسند ظهر وقوائم أربعة وألواح جلوس متماسكة ومربوطة بالكامل.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 0.8, length: 0.8, height: 1.0 },
    materials: { staves: 9, medium: 0, long: 0, xlong: 0, lashings: 10, ropeLength: 28 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="8" x2="10" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="24" y1="18" x2="24" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="18" x2="26" y2="18" stroke="currentColor" stroke-width="2.5"/>
        <line x1="8" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const bL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.25, 0.05, -0.25).add(offset), new THREE.Vector3(-0.25, 0.95, -0.25).add(offset), false);
      const bR = store.addSparAlongSegment('stave', new THREE.Vector3(0.25, 0.05, -0.25).add(offset), new THREE.Vector3(0.25, 0.95, -0.25).add(offset), false);

      const fL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.25, 0.05, 0.25).add(offset), new THREE.Vector3(-0.25, 0.55, 0.25).add(offset), false);
      const fR = store.addSparAlongSegment('stave', new THREE.Vector3(0.25, 0.05, 0.25).add(offset), new THREE.Vector3(0.25, 0.55, 0.25).add(offset), false);

      const sRailL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.25, 0.45, -0.3).add(offset), new THREE.Vector3(-0.25, 0.45, 0.3).add(offset), false);
      const sRailR = store.addSparAlongSegment('stave', new THREE.Vector3(0.25, 0.45, -0.3).add(offset), new THREE.Vector3(0.25, 0.45, 0.3).add(offset), false);

      const slat1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.3, 0.5, -0.1).add(offset), new THREE.Vector3(0.3, 0.5, -0.1).add(offset), false);
      const slat2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.3, 0.5, 0.1).add(offset), new THREE.Vector3(0.3, 0.5, 0.1).add(offset), false);

      const backrest = store.addSparAlongSegment('stave', new THREE.Vector3(-0.3, 0.85, -0.25).add(offset), new THREE.Vector3(0.3, 0.85, -0.25).add(offset), false);

      store.addLashing(bL, sRailL, new THREE.Vector3(-0.25, 0.45, -0.25).add(offset), 90, 'square', false, false);
      store.addLashing(bR, sRailR, new THREE.Vector3(0.25, 0.45, -0.25).add(offset), 90, 'square', false, false);
      store.addLashing(fL, sRailL, new THREE.Vector3(-0.25, 0.45, 0.25).add(offset), 90, 'square', false, false);
      store.addLashing(fR, sRailR, new THREE.Vector3(0.25, 0.45, 0.25).add(offset), 90, 'square', false, false);

      store.addLashing(sRailL, slat1, new THREE.Vector3(-0.25, 0.5, -0.1).add(offset), 90, 'square', false, false);
      store.addLashing(sRailR, slat1, new THREE.Vector3(0.25, 0.5, -0.1).add(offset), 90, 'square', false, false);
      store.addLashing(sRailL, slat2, new THREE.Vector3(-0.25, 0.5, 0.1).add(offset), 90, 'square', false, false);
      store.addLashing(sRailR, slat2, new THREE.Vector3(0.25, 0.5, 0.1).add(offset), 90, 'square', false, false);

      store.addLashing(bL, backrest, new THREE.Vector3(-0.25, 0.85, -0.25).add(offset), 90, 'square', false, false);
      store.addLashing(bR, backrest, new THREE.Vector3(0.25, 0.85, -0.25).add(offset), 90, 'square', false, false);

      return [bL, bR, fL, fR, sRailL, sRailR, slat1, slat2, backrest];
    }
  },

  // -------------------------------------------------------------
  // 14. KITCHEN RACK (رف مطبخ وأواني كشفي)
  // -------------------------------------------------------------
  {
    id: 'kitchen_rack',
    name: 'رف مطبخ وأواني كشفي (Kitchen Utility Rack)',
    description: 'رف تجفيف وتخزين أواني الطهي الكشفي بطابقين وعارضة علوية لتعليق أدوات الطبخ.',
    category: 'مطبخ',
    difficulty: 'مبتدئ',
    dimensions: { width: 0.9, length: 1.2, height: 1.1 },
    materials: { staves: 11, medium: 0, long: 0, xlong: 0, lashings: 14, ropeLength: 38 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="20" x2="28" y2="20" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="10" x2="8" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="24" y1="10" x2="28" y2="28" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const z1 = -0.45;
      const z2 = 0.45;

      const l1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z1).add(offset), new THREE.Vector3(0, 1.05, z1).add(offset), false);
      const r1 = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z1).add(offset), new THREE.Vector3(0, 1.05, z1).add(offset), false);
      const c1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.35, z1).add(offset), new THREE.Vector3(0.35, 0.35, z1).add(offset), false);

      const l2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z2).add(offset), new THREE.Vector3(0, 1.05, z2).add(offset), false);
      const r2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z2).add(offset), new THREE.Vector3(0, 1.05, z2).add(offset), false);
      const c2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.35, z2).add(offset), new THREE.Vector3(0.35, 0.35, z2).add(offset), false);

      const sLow1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.15, 0.38, -0.55).add(offset), new THREE.Vector3(-0.15, 0.38, 0.55).add(offset), false);
      const sLow2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.15, 0.38, -0.55).add(offset), new THREE.Vector3(0.15, 0.38, 0.55).add(offset), false);

      const sUp1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.12, 0.72, -0.55).add(offset), new THREE.Vector3(-0.12, 0.72, 0.55).add(offset), false);
      const sUp2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.12, 0.72, -0.55).add(offset), new THREE.Vector3(0.12, 0.72, 0.55).add(offset), false);

      const ridge = store.addSparAlongSegment('stave', new THREE.Vector3(0, 1.05, -0.55).add(offset), new THREE.Vector3(0, 1.05, 0.55).add(offset), false);

      store.addLashing(l1, r1, new THREE.Vector3(0, 1.05, z1).add(offset), 45, 'shear', false, false);
      store.addLashing(l2, r2, new THREE.Vector3(0, 1.05, z2).add(offset), 45, 'shear', false, false);

      store.addLashing(l1, c1, new THREE.Vector3(-0.25, 0.35, z1).add(offset), 90, 'square', false, false);
      store.addLashing(r1, c1, new THREE.Vector3(0.25, 0.35, z1).add(offset), 90, 'square', false, false);
      store.addLashing(l2, c2, new THREE.Vector3(-0.25, 0.35, z2).add(offset), 90, 'square', false, false);
      store.addLashing(r2, c2, new THREE.Vector3(0.25, 0.35, z2).add(offset), 90, 'square', false, false);

      store.addLashing(c1, sLow1, new THREE.Vector3(-0.15, 0.38, z1).add(offset), 90, 'square', false, false);
      store.addLashing(c2, sLow1, new THREE.Vector3(-0.15, 0.38, z2).add(offset), 90, 'square', false, false);
      store.addLashing(c1, sLow2, new THREE.Vector3(0.15, 0.38, z1).add(offset), 90, 'square', false, false);
      store.addLashing(c2, sLow2, new THREE.Vector3(0.15, 0.38, z2).add(offset), 90, 'square', false, false);

      store.addLashing(l1, sUp1, new THREE.Vector3(-0.12, 0.72, z1).add(offset), 90, 'square', false, false);
      store.addLashing(r1, sUp2, new THREE.Vector3(0.12, 0.72, z1).add(offset), 90, 'square', false, false);
      store.addLashing(l2, sUp1, new THREE.Vector3(-0.12, 0.72, z2).add(offset), 90, 'square', false, false);
      store.addLashing(r2, sUp2, new THREE.Vector3(0.12, 0.72, z2).add(offset), 90, 'square', false, false);

      store.addLashing(l1, ridge, new THREE.Vector3(0, 1.05, z1).add(offset), 90, 'square', false, false);
      store.addLashing(l2, ridge, new THREE.Vector3(0, 1.05, z2).add(offset), 90, 'square', false, false);

      return [l1, r1, c1, l2, r2, c2, sLow1, sLow2, sUp1, sUp2, ridge];
    }
  },

  // -------------------------------------------------------------
  // 15. SHOE RACK (رف أحذية كشفي دورين)
  // -------------------------------------------------------------
  {
    id: 'shoe_rack',
    name: 'رف أحذية كشفي مستويين (Two-Tier Shoe Rack)',
    description: 'حامل كشفي منظم لأحذية الطليعة بمستويين مربوطين بالكامل وقوائم مستقرة على الأرض.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 0.6, length: 1.1, height: 0.95 },
    materials: { staves: 10, medium: 0, long: 0, xlong: 0, lashings: 12, ropeLength: 32 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="8" x2="8" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="28" y1="8" x2="28" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="6" y1="14" x2="30" y2="14" stroke="currentColor" stroke-width="1.5"/>
        <line x1="6" y1="24" x2="30" y2="24" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const w = 0.45;
      const d = 0.18;

      const v1 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.05, -d).add(offset), new THREE.Vector3(-w, 0.95, -d).add(offset), false);
      const v2 = store.addSparAlongSegment('stave', new THREE.Vector3(w, 0.05, -d).add(offset), new THREE.Vector3(w, 0.95, -d).add(offset), false);
      const v3 = store.addSparAlongSegment('stave', new THREE.Vector3(w, 0.05, d).add(offset), new THREE.Vector3(w, 0.95, d).add(offset), false);
      const v4 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.05, d).add(offset), new THREE.Vector3(-w, 0.95, d).add(offset), false);

      const h1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.25, -d - 0.04).add(offset), new THREE.Vector3(0.55, 0.25, -d - 0.04).add(offset), false);
      const h2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.25, d + 0.04).add(offset), new THREE.Vector3(0.55, 0.25, d + 0.04).add(offset), false);

      const h3 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.65, -d - 0.04).add(offset), new THREE.Vector3(0.55, 0.65, -d - 0.04).add(offset), false);
      const h4 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.65, d + 0.04).add(offset), new THREE.Vector3(0.55, 0.65, d + 0.04).add(offset), false);

      const sideTieL = store.addSparAlongSegment('stave', new THREE.Vector3(-w - 0.04, 0.25, -0.3).add(offset), new THREE.Vector3(-w - 0.04, 0.25, 0.3).add(offset), false);
      const sideTieR = store.addSparAlongSegment('stave', new THREE.Vector3(w + 0.04, 0.25, -0.3).add(offset), new THREE.Vector3(w + 0.04, 0.25, 0.3).add(offset), false);

      store.addLashing(v1, h1, new THREE.Vector3(-w, 0.25, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v2, h1, new THREE.Vector3(w, 0.25, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v4, h2, new THREE.Vector3(-w, 0.25, d).add(offset), 90, 'square', false, false);
      store.addLashing(v3, h2, new THREE.Vector3(w, 0.25, d).add(offset), 90, 'square', false, false);

      store.addLashing(v1, h3, new THREE.Vector3(-w, 0.65, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v2, h3, new THREE.Vector3(w, 0.65, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v4, h4, new THREE.Vector3(-w, 0.65, d).add(offset), 90, 'square', false, false);
      store.addLashing(v3, h4, new THREE.Vector3(w, 0.65, d).add(offset), 90, 'square', false, false);

      store.addLashing(v1, sideTieL, new THREE.Vector3(-w, 0.25, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v4, sideTieL, new THREE.Vector3(-w, 0.25, d).add(offset), 90, 'square', false, false);
      store.addLashing(v2, sideTieR, new THREE.Vector3(w, 0.25, -d).add(offset), 90, 'square', false, false);
      store.addLashing(v3, sideTieR, new THREE.Vector3(w, 0.25, d).add(offset), 90, 'square', false, false);

      return [v1, v2, v3, v4, h1, h2, h3, h4, sideTieL, sideTieR];
    }
  },

  // -------------------------------------------------------------
  // 16. CLOTHES RACK (منشر غسيل كشفي)
  // -------------------------------------------------------------
  {
    id: 'clothes_rack',
    name: 'منشر غسيل كشفي متزن (Camp Clothes Rack)',
    description: 'منشر غسيل كشفي مكوّن من حاملين ثلاثيين متزنين وعارضة أفقية 4 أمتار مربوطة برباطات مربعة.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.2, length: 4.2, height: 1.0 },
    materials: { staves: 6, medium: 0, long: 1, xlong: 0, lashings: 8, ropeLength: 26 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="12" x2="32" y2="12" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="12" x2="4" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="12" x2="12" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="28" y1="12" x2="24" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <line x1="28" y1="12" x2="32" y2="28" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const zDist = 1.4;

      const t11 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, -zDist).add(offset), new THREE.Vector3(-0.35, 0.05, -zDist - 0.25).add(offset), false);
      const t12 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, -zDist).add(offset), new THREE.Vector3(0.35, 0.05, -zDist - 0.25).add(offset), false);
      const t13 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, -zDist).add(offset), new THREE.Vector3(0, 0.05, -zDist + 0.35).add(offset), false);

      const t21 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, zDist).add(offset), new THREE.Vector3(-0.35, 0.05, zDist - 0.35).add(offset), false);
      const t22 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, zDist).add(offset), new THREE.Vector3(0.35, 0.05, zDist - 0.35).add(offset), false);
      const t23 = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.95, zDist).add(offset), new THREE.Vector3(0, 0.05, zDist + 0.25).add(offset), false);

      const cross = store.addSparAlongSegment('long', new THREE.Vector3(0, 0.98, -2.0).add(offset), new THREE.Vector3(0, 0.98, 2.0).add(offset), false);

      store.addLashing(t11, t12, new THREE.Vector3(0, 0.95, -zDist).add(offset), 20, 'tripod', false, false);
      store.addLashing(t12, t13, new THREE.Vector3(0, 0.95, -zDist).add(offset), 20, 'tripod', false, false);
      store.addLashing(t13, t11, new THREE.Vector3(0, 0.95, -zDist).add(offset), 20, 'tripod', false, false);

      store.addLashing(t21, t22, new THREE.Vector3(0, 0.95, zDist).add(offset), 20, 'tripod', false, false);
      store.addLashing(t22, t23, new THREE.Vector3(0, 0.95, zDist).add(offset), 20, 'tripod', false, false);
      store.addLashing(t23, t21, new THREE.Vector3(0, 0.95, zDist).add(offset), 20, 'tripod', false, false);

      store.addLashing(t11, cross, new THREE.Vector3(0, 0.95, -zDist).add(offset), 90, 'square', false, false);
      store.addLashing(t21, cross, new THREE.Vector3(0, 0.95, zDist).add(offset), 90, 'square', false, false);

      return [t11, t12, t13, t21, t22, t23, cross];
    }
  },

  // -------------------------------------------------------------
  // 17. SWING GATE (بوابة متأرجحة)
  // -------------------------------------------------------------
  {
    id: 'swing_gate',
    name: 'بوابة متأرجحة كشفية (Pioneer Swing Gate)',
    description: 'بوابة معسكر ممتازة بقائمين مدعمين وعارضة إغلاق مائلة ومتحركة بمفصلة حبال كشفية.',
    category: 'خيام',
    difficulty: 'متوسط',
    dimensions: { width: 3.2, length: 1.6, height: 3.1 },
    materials: { staves: 2, medium: 4, long: 0, xlong: 0, lashings: 7, ropeLength: 26 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="10" x2="8" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="28" y1="10" x2="28" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="5" y1="10" x2="31" y2="10" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="24" x2="28" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const p1 = store.addSparAlongSegment('medium', new THREE.Vector3(-1.0, 0.05, 0).add(offset), new THREE.Vector3(-1.0, 3.05, 0).add(offset), false);
      const p2 = store.addSparAlongSegment('medium', new THREE.Vector3(1.0, 0.05, 0).add(offset), new THREE.Vector3(1.0, 3.05, 0).add(offset), false);
      const lintel = store.addSparAlongSegment('medium', new THREE.Vector3(-1.4, 2.9, 0.05).add(offset), new THREE.Vector3(1.4, 2.9, 0.05).add(offset), false);

      const butt1 = store.addSparAlongSegment('stave', new THREE.Vector3(-1.0, 1.5, 0).add(offset), new THREE.Vector3(-1.0, 0.05, -1.0).add(offset), false);
      const butt2 = store.addSparAlongSegment('stave', new THREE.Vector3(1.0, 1.5, 0).add(offset), new THREE.Vector3(1.0, 0.05, -1.0).add(offset), false);

      const gate = store.addSparAlongSegment('medium', new THREE.Vector3(-1.05, 1.4, 0.08).add(offset), new THREE.Vector3(1.05, 1.0, 0.08).add(offset), false);

      store.addLashing(p1, lintel, new THREE.Vector3(-1.0, 2.9, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p2, lintel, new THREE.Vector3(1.0, 2.9, 0).add(offset), 90, 'square', false, false);
      store.addLashing(p1, butt1, new THREE.Vector3(-1.0, 1.5, 0).add(offset), 45, 'diagonal', false, false);
      store.addLashing(p2, butt2, new THREE.Vector3(1.0, 1.5, 0).add(offset), 45, 'diagonal', false, false);
      store.addLashing(p1, gate, new THREE.Vector3(-1.0, 1.4, 0.08).add(offset), 80, 'shear', false, false);

      return [p1, p2, lintel, butt1, butt2, gate];
    }
  },

  // -------------------------------------------------------------
  // 18. RAISED PLATFORM (منصة مرتفعة متزنة)
  // -------------------------------------------------------------
  {
    id: 'raised_platform',
    name: 'منصة مراقبة مرتفعة (Raised Platform)',
    description: 'منصة كشفية مرتفعة 1.6 متر مدعومة بـ 4 قوائم متينة وعوارض محيطية وألواح سطح مربوطة بالكامل مع دعامات X.',
    category: 'جسور',
    difficulty: 'متوسط',
    dimensions: { width: 1.8, length: 1.8, height: 2.1 },
    materials: { staves: 6, medium: 8, long: 0, xlong: 0, lashings: 16, ropeLength: 52 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="6" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="2.5"/>
        <line x1="9" y1="16" x2="9" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="27" y1="16" x2="27" y2="30" stroke="currentColor" stroke-width="2"/>
        <path d="M7 16H29" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const w = 0.65;
      const c1 = store.addSparAlongSegment('medium', new THREE.Vector3(-w, 0.05, -w).add(offset), new THREE.Vector3(-w, 2.05, -w).add(offset), false);
      const c2 = store.addSparAlongSegment('medium', new THREE.Vector3(w, 0.05, -w).add(offset), new THREE.Vector3(w, 2.05, -w).add(offset), false);
      const c3 = store.addSparAlongSegment('medium', new THREE.Vector3(w, 0.05, w).add(offset), new THREE.Vector3(w, 2.05, w).add(offset), false);
      const c4 = store.addSparAlongSegment('medium', new THREE.Vector3(-w, 0.05, w).add(offset), new THREE.Vector3(-w, 2.05, w).add(offset), false);

      const y = 1.5;
      const r1 = store.addSparAlongSegment('medium', new THREE.Vector3(-0.85, y, -w - 0.05).add(offset), new THREE.Vector3(0.85, y, -w - 0.05).add(offset), false);
      const r2 = store.addSparAlongSegment('medium', new THREE.Vector3(w + 0.05, y - 0.07, -0.85).add(offset), new THREE.Vector3(w + 0.05, y - 0.07, 0.85).add(offset), false);
      const r3 = store.addSparAlongSegment('medium', new THREE.Vector3(0.85, y, w + 0.05).add(offset), new THREE.Vector3(-0.85, y, w + 0.05).add(offset), false);
      const r4 = store.addSparAlongSegment('medium', new THREE.Vector3(-w - 0.05, y - 0.07, 0.85).add(offset), new THREE.Vector3(-w - 0.05, y - 0.07, -0.85).add(offset), false);

      const d1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, y + 0.06, -w).add(offset), new THREE.Vector3(-0.45, y + 0.06, w).add(offset), false);
      const d2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.15, y + 0.06, -w).add(offset), new THREE.Vector3(-0.15, y + 0.06, w).add(offset), false);
      const d3 = store.addSparAlongSegment('stave', new THREE.Vector3(0.15, y + 0.06, -w).add(offset), new THREE.Vector3(0.15, y + 0.06, w).add(offset), false);
      const d4 = store.addSparAlongSegment('stave', new THREE.Vector3(0.45, y + 0.06, -w).add(offset), new THREE.Vector3(0.45, y + 0.06, w).add(offset), false);

      store.addLashing(c1, r1, new THREE.Vector3(-w, y, -w).add(offset), 90, 'square', false, false);
      store.addLashing(c2, r1, new THREE.Vector3(w, y, -w).add(offset), 90, 'square', false, false);
      store.addLashing(c2, r2, new THREE.Vector3(w, y, -w).add(offset), 90, 'square', false, false);
      store.addLashing(c3, r2, new THREE.Vector3(w, y, w).add(offset), 90, 'square', false, false);
      store.addLashing(c3, r3, new THREE.Vector3(w, y, w).add(offset), 90, 'square', false, false);
      store.addLashing(c4, r3, new THREE.Vector3(-w, y, w).add(offset), 90, 'square', false, false);
      store.addLashing(c4, r4, new THREE.Vector3(-w, y, w).add(offset), 90, 'square', false, false);
      store.addLashing(c1, r4, new THREE.Vector3(-w, y, -w).add(offset), 90, 'square', false, false);

      [d1, d2, d3, d4].forEach(d => {
        store.addLashing(r1, d, new THREE.Vector3(d.position.x, y + 0.06, -w).add(offset), 90, 'square', false, false);
        store.addLashing(r3, d, new THREE.Vector3(d.position.x, y + 0.06, w).add(offset), 90, 'square', false, false);
      });

      return [c1, c2, c3, c4, r1, r2, r3, r4, d1, d2, d3, d4];
    }
  },

  // -------------------------------------------------------------
  // 19. LIGHT TOWER (برج إضاءة كشفي)
  // -------------------------------------------------------------
  {
    id: 'light_tower',
    name: 'برج إضاءة كشفي متين (Pioneer Light Tower)',
    description: 'قائم ثلاثي مقوى مثبت بعصا علوية لتعليق الفانوس ودعامات سفلية تضمن استقراره في ساحة المعسكر.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.8, length: 1.8, height: 3.6 },
    materials: { staves: 4, medium: 3, long: 0, xlong: 0, lashings: 7, ropeLength: 28 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="4" x2="8" y2="30" stroke="currentColor" stroke-width="1.5"/>
        <line x1="18" y1="4" x2="28" y2="30" stroke="currentColor" stroke-width="1.5"/>
        <line x1="18" y1="15" x2="18" y2="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="18" cy="2" r="1.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pTop = new THREE.Vector3(0, 2.75, 0).add(offset);
      const r = 1.0;
      const f1 = new THREE.Vector3(0, 0.05, r).add(offset);
      const f2 = new THREE.Vector3(r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);
      const f3 = new THREE.Vector3(-r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);

      const s1 = store.addSparAlongSegment('medium', f1, pTop, false);
      const s2 = store.addSparAlongSegment('medium', f2, pTop, false);
      const s3 = store.addSparAlongSegment('medium', f3, pTop, false);

      const lantern = store.addSparAlongSegment('stave', new THREE.Vector3(0, 2.5, 0).add(offset), new THREE.Vector3(0, 3.5, 0).add(offset), false);

      const b1 = new THREE.Vector3().lerpVectors(f1, pTop, 0.16);
      const b2 = new THREE.Vector3().lerpVectors(f2, pTop, 0.16);
      const b3 = new THREE.Vector3().lerpVectors(f3, pTop, 0.16);

      const sp12 = store.addSparAlongSegment('stave', b1, b2, false);
      const sp23 = store.addSparAlongSegment('stave', b2, b3, false);
      const sp31 = store.addSparAlongSegment('stave', b3, b1, false);

      store.addLashing(s1, s2, pTop, 20.0, 'tripod', false, false);
      store.addLashing(s2, s3, pTop, 20.0, 'tripod', false, false);
      store.addLashing(s3, lantern, pTop, 90.0, 'square', false, false);

      store.addLashing(s1, sp12, b1, 90.0, 'square', false, false);
      store.addLashing(s2, sp23, b2, 90.0, 'square', false, false);
      store.addLashing(s3, sp31, b3, 90.0, 'square', false, false);

      return [s1, s2, s3, lantern, sp12, sp23, sp31];
    }
  },

  // -------------------------------------------------------------
  // 20. DOUBLE LOCK BRIDGE (جسر القفل المزدوج)
  // -------------------------------------------------------------
  {
    id: 'double_lock_bridge',
    name: 'جسر القفل المزدوج الكشفي (Double Lock Bridge)',
    description: 'جسر ليوناردو الكشفي الشهير مكوّن من إطارين مقصيين متشابكين عند المنتصف دون دعامة وسطية ومربوط بألواح المشي.',
    category: 'جسور',
    difficulty: 'متقدم',
    dimensions: { width: 1.2, length: 3.2, height: 1.9 },
    materials: { staves: 4, medium: 6, long: 0, xlong: 0, lashings: 11, ropeLength: 36 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 22L12 14H24L32 22" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="12" y1="14" x2="16" y2="30" stroke="currentColor" stroke-width="1.5"/>
        <line x1="24" y1="14" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const leg1A = store.addSparAlongSegment('medium', new THREE.Vector3(-0.45, 0.05, -1.0).add(offset), new THREE.Vector3(-0.45, 1.8, 0.15).add(offset), false);
      const leg1B = store.addSparAlongSegment('medium', new THREE.Vector3(0.45, 0.05, -1.0).add(offset), new THREE.Vector3(0.45, 1.8, 0.15).add(offset), false);
      const cross1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.9, -0.5).add(offset), new THREE.Vector3(0.55, 0.9, -0.5).add(offset), false);

      const leg2A = store.addSparAlongSegment('medium', new THREE.Vector3(-0.45, 0.05, 1.0).add(offset), new THREE.Vector3(-0.45, 1.8, -0.15).add(offset), false);
      const leg2B = store.addSparAlongSegment('medium', new THREE.Vector3(0.45, 0.05, 1.0).add(offset), new THREE.Vector3(0.45, 1.8, -0.15).add(offset), false);
      const cross2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 0.9, 0.5).add(offset), new THREE.Vector3(0.55, 0.9, 0.5).add(offset), false);

      const lockBar = store.addSparAlongSegment('stave', new THREE.Vector3(-0.55, 1.35, 0.0).add(offset), new THREE.Vector3(0.55, 1.35, 0.0).add(offset), false);

      const plankL = store.addSparAlongSegment('medium', new THREE.Vector3(-0.2, 1.4, -1.3).add(offset), new THREE.Vector3(-0.2, 1.4, 1.3).add(offset), false);
      const plankR = store.addSparAlongSegment('medium', new THREE.Vector3(0.2, 1.4, -1.3).add(offset), new THREE.Vector3(0.2, 1.4, 1.3).add(offset), false);

      store.addLashing(leg1A, cross1, new THREE.Vector3(-0.45, 0.9, -0.5).add(offset), 90, 'square', false, false);
      store.addLashing(leg1B, cross1, new THREE.Vector3(0.45, 0.9, -0.5).add(offset), 90, 'square', false, false);

      store.addLashing(leg2A, cross2, new THREE.Vector3(-0.45, 0.9, 0.5).add(offset), 90, 'square', false, false);
      store.addLashing(leg2B, cross2, new THREE.Vector3(0.45, 0.9, 0.5).add(offset), 90, 'square', false, false);

      store.addLashing(leg1A, lockBar, new THREE.Vector3(-0.45, 1.35, 0.0).add(offset), 90, 'square', false, false);
      store.addLashing(leg1B, lockBar, new THREE.Vector3(0.45, 1.35, 0.0).add(offset), 90, 'square', false, false);
      store.addLashing(leg2A, lockBar, new THREE.Vector3(-0.45, 1.35, 0.0).add(offset), 90, 'square', false, false);
      store.addLashing(leg2B, lockBar, new THREE.Vector3(0.45, 1.35, 0.0).add(offset), 90, 'square', false, false);

      store.addLashing(lockBar, plankL, new THREE.Vector3(-0.2, 1.4, 0.0).add(offset), 90, 'square', false, false);
      store.addLashing(lockBar, plankR, new THREE.Vector3(0.2, 1.4, 0.0).add(offset), 90, 'square', false, false);

      return [leg1A, leg1B, cross1, leg2A, leg2B, cross2, lockBar, plankL, plankR];
    }
  },

  // -------------------------------------------------------------
  // 21. CAMP KITCHEN COMPLEX (كادج المطبخ الكشفي المتكامل) - NEW!
  // -------------------------------------------------------------
  {
    id: 'camp_kitchen_complex',
    name: 'كادج المطبخ الكشفي المتكامل (Camp Kitchen Complex)',
    description: 'نموذج مطبخ المعسكر القياسي لمسابقات الجوالة: طاولة إعداد، رف أواني معلق، موقد طهي مرتفع، وحامل أدوات.',
    category: 'مطبخ',
    difficulty: 'متقدم',
    dimensions: { width: 2.2, length: 1.6, height: 1.8 },
    materials: { staves: 16, medium: 4, long: 0, xlong: 0, lashings: 22, ropeLength: 68 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="14" width="24" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <line x1="6" y1="8" x2="30" y2="8" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="14" stroke="currentColor" stroke-width="1.5"/>
        <line x1="24" y1="8" x2="24" y2="14" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="18" cy="21" r="3" stroke="#facc15" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const w = 0.8;
      const d = 0.5;
      const p1 = store.addSparAlongSegment('medium', new THREE.Vector3(-w, 0.05, -d).add(offset), new THREE.Vector3(-w, 1.8, -d).add(offset), false);
      const p2 = store.addSparAlongSegment('medium', new THREE.Vector3(w, 0.05, -d).add(offset), new THREE.Vector3(w, 1.8, -d).add(offset), false);
      const p3 = store.addSparAlongSegment('medium', new THREE.Vector3(w, 0.05, d).add(offset), new THREE.Vector3(w, 1.1, d).add(offset), false);
      const p4 = store.addSparAlongSegment('medium', new THREE.Vector3(-w, 0.05, d).add(offset), new THREE.Vector3(-w, 1.1, d).add(offset), false);

      const t12 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.9, -d).add(offset), new THREE.Vector3(w, 0.9, -d).add(offset), false);
      const t34 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.9, d).add(offset), new THREE.Vector3(w, 0.9, d).add(offset), false);
      const tSideL = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.85, -d).add(offset), new THREE.Vector3(-w, 0.85, d).add(offset), false);
      const tSideR = store.addSparAlongSegment('stave', new THREE.Vector3(w, 0.85, -d).add(offset), new THREE.Vector3(w, 0.85, d).add(offset), false);

      const cSlats: Spar[] = [];
      [-0.45, -0.15, 0.15, 0.45].forEach(xP => {
        const sl = store.addSparAlongSegment('stave', new THREE.Vector3(xP, 0.95, -d).add(offset), new THREE.Vector3(xP, 0.95, d).add(offset), false);
        cSlats.push(sl);
      });

      const topRack = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 1.7, -d).add(offset), new THREE.Vector3(w, 1.7, -d).add(offset), false);

      const bLow1 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.3, -d).add(offset), new THREE.Vector3(w, 0.3, -d).add(offset), false);
      const bLow2 = store.addSparAlongSegment('stave', new THREE.Vector3(-w, 0.3, d).add(offset), new THREE.Vector3(w, 0.3, d).add(offset), false);

      store.addLashing(p1, t12, new THREE.Vector3(-w, 0.9, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p2, t12, new THREE.Vector3(w, 0.9, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p4, t34, new THREE.Vector3(-w, 0.9, d).add(offset), 90, 'square', false, false);
      store.addLashing(p3, t34, new THREE.Vector3(w, 0.9, d).add(offset), 90, 'square', false, false);

      store.addLashing(p1, tSideL, new THREE.Vector3(-w, 0.85, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p4, tSideL, new THREE.Vector3(-w, 0.85, d).add(offset), 90, 'square', false, false);
      store.addLashing(p2, tSideR, new THREE.Vector3(w, 0.85, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p3, tSideR, new THREE.Vector3(w, 0.85, d).add(offset), 90, 'square', false, false);

      store.addLashing(p1, topRack, new THREE.Vector3(-w, 1.7, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p2, topRack, new THREE.Vector3(w, 1.7, -d).add(offset), 90, 'square', false, false);

      store.addLashing(p1, bLow1, new THREE.Vector3(-w, 0.3, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p2, bLow1, new THREE.Vector3(w, 0.3, -d).add(offset), 90, 'square', false, false);
      store.addLashing(p4, bLow2, new THREE.Vector3(-w, 0.3, d).add(offset), 90, 'square', false, false);
      store.addLashing(p3, bLow2, new THREE.Vector3(w, 0.3, d).add(offset), 90, 'square', false, false);

      cSlats.forEach(sl => {
        store.addLashing(t12, sl, new THREE.Vector3(sl.position.x, 0.95, -d).add(offset), 90, 'square', false, false);
      });

      return [p1, p2, p3, p4, t12, t34, tSideL, tSideR, topRack, bLow1, bLow2, ...cSlats];
    }
  },

  // -------------------------------------------------------------
  // 22. TRIPOD FLAGPOLE (ساري علم ثلاثي القوائم متزن ذاتياً) - NEW!
  // -------------------------------------------------------------
  {
    id: 'tripod_flagpole',
    name: 'ساري علم ثلاثي القوائم (Tripod-Stood Flagpole)',
    description: 'سارية علم قياسية بارتفاع 5 أمتار مثبتة في قاعدة حامل ثلاثي متزن ذاتياً لا يتطلب حفر أو أوتاد أرضية.',
    category: 'ادوات',
    difficulty: 'متوسط',
    dimensions: { width: 2.4, length: 2.4, height: 5.1 },
    materials: { staves: 3, medium: 3, long: 0, xlong: 1, lashings: 8, ropeLength: 32 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="2" x2="18" y2="34" stroke="currentColor" stroke-width="2"/>
        <line x1="18" y1="18" x2="8" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <line x1="18" y1="18" x2="28" y2="32" stroke="currentColor" stroke-width="1.5"/>
        <line x1="11" y1="28" x2="25" y2="28" stroke="currentColor" stroke-width="1.5"/>
        <path d="M18 4H28V9H18V4Z" fill="#ef4444" stroke="currentColor" stroke-width="1"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pole = store.addSparAlongSegment('xlong', new THREE.Vector3(0, 0.05, 0).add(offset), new THREE.Vector3(0, 5.05, 0).add(offset), false);

      const pTop = new THREE.Vector3(0, 2.65, 0).add(offset);
      const r = 1.25;
      const f1 = new THREE.Vector3(0, 0.05, r).add(offset);
      const f2 = new THREE.Vector3(r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);
      const f3 = new THREE.Vector3(-r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);

      const s1 = store.addSparAlongSegment('medium', f1, pTop, false);
      const s2 = store.addSparAlongSegment('medium', f2, pTop, false);
      const s3 = store.addSparAlongSegment('medium', f3, pTop, false);

      const b1 = new THREE.Vector3().lerpVectors(f1, pTop, 0.16);
      const b2 = new THREE.Vector3().lerpVectors(f2, pTop, 0.16);
      const b3 = new THREE.Vector3().lerpVectors(f3, pTop, 0.16);

      const sp12 = store.addSparAlongSegment('stave', b1, b2, false);
      const sp23 = store.addSparAlongSegment('stave', b2, b3, false);
      const sp31 = store.addSparAlongSegment('stave', b3, b1, false);

      store.addLashing(s1, s2, pTop, 20, 'tripod', false, false);
      store.addLashing(s2, s3, pTop, 20, 'tripod', false, false);
      store.addLashing(s1, pole, pTop, 0, 'shear', false, false);
      store.addLashing(s2, pole, pTop, 0, 'shear', false, false);
      store.addLashing(s3, pole, pTop, 0, 'shear', false, false);

      store.addLashing(s1, sp12, b1, 90, 'square', false, false);
      store.addLashing(s2, sp12, b2, 90, 'square', false, false);

      store.addLashing(s2, sp23, b2, 90, 'square', false, false);
      store.addLashing(s3, sp23, b3, 90, 'square', false, false);

      store.addLashing(s3, sp31, b3, 90, 'square', false, false);
      store.addLashing(s1, sp31, b1, 90, 'square', false, false);

      return [pole, s1, s2, s3, sp12, sp23, sp31];
    }
  },

  // -------------------------------------------------------------
  // 23. PATROL TABLE & BENCHES (طاولة طليعة مدمجة بمقاعدها) - NEW!
  // -------------------------------------------------------------
  {
    id: 'patrol_table_benches',
    name: 'طاولة طليعة مدمجة بمقاعدها (Patrol Picnic Table)',
    description: 'طاولة طعام واجتماعات كشفية متكاملة تتسع لـ 8 جوالة مع مقعدين مدمجين بنفس الهيكل المتين.',
    category: 'مطبخ',
    difficulty: 'متوسط',
    dimensions: { width: 1.8, length: 1.6, height: 1.0 },
    materials: { staves: 14, medium: 2, long: 0, xlong: 0, lashings: 18, ropeLength: 56 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="14" x2="26" y2="14" stroke="currentColor" stroke-width="2.5"/>
        <line x1="4" y1="22" x2="32" y2="22" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="14" x2="6" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="24" y1="14" x2="30" y2="30" stroke="currentColor" stroke-width="2"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const z1 = -0.55;
      const z2 = 0.55;

      const leg1L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.6, 0.05, z1).add(offset), new THREE.Vector3(-0.15, 0.9, z1).add(offset), false);
      const leg1R = store.addSparAlongSegment('stave', new THREE.Vector3(0.6, 0.05, z1).add(offset), new THREE.Vector3(0.15, 0.9, z1).add(offset), false);
      const tableCross1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.88, z1).add(offset), new THREE.Vector3(0.4, 0.88, z1).add(offset), false);
      const benchCross1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.8, 0.45, z1).add(offset), new THREE.Vector3(0.8, 0.45, z1).add(offset), false);

      const leg2L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.6, 0.05, z2).add(offset), new THREE.Vector3(-0.15, 0.9, z2).add(offset), false);
      const leg2R = store.addSparAlongSegment('stave', new THREE.Vector3(0.6, 0.05, z2).add(offset), new THREE.Vector3(0.15, 0.9, z2).add(offset), false);
      const tableCross2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.4, 0.88, z2).add(offset), new THREE.Vector3(0.4, 0.88, z2).add(offset), false);
      const benchCross2 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.8, 0.45, z2).add(offset), new THREE.Vector3(0.8, 0.45, z2).add(offset), false);

      const tPlank1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.2, 0.94, -0.7).add(offset), new THREE.Vector3(-0.2, 0.94, 0.7).add(offset), false);
      const tPlank2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.0, 0.94, -0.7).add(offset), new THREE.Vector3(0.0, 0.94, 0.7).add(offset), false);
      const tPlank3 = store.addSparAlongSegment('stave', new THREE.Vector3(0.2, 0.94, -0.7).add(offset), new THREE.Vector3(0.2, 0.94, 0.7).add(offset), false);

      const bPlankL = store.addSparAlongSegment('stave', new THREE.Vector3(-0.65, 0.5, -0.7).add(offset), new THREE.Vector3(-0.65, 0.5, 0.7).add(offset), false);
      const bPlankR = store.addSparAlongSegment('stave', new THREE.Vector3(0.65, 0.5, -0.7).add(offset), new THREE.Vector3(0.65, 0.5, 0.7).add(offset), false);

      const spine = store.addSparAlongSegment('medium', new THREE.Vector3(0, 0.25, -0.9).add(offset), new THREE.Vector3(0, 0.25, 0.9).add(offset), false);

      store.addLashing(leg1L, tableCross1, new THREE.Vector3(-0.2, 0.88, z1).add(offset), 90, 'square', false, false);
      store.addLashing(leg1R, tableCross1, new THREE.Vector3(0.2, 0.88, z1).add(offset), 90, 'square', false, false);
      store.addLashing(leg1L, benchCross1, new THREE.Vector3(-0.45, 0.45, z1).add(offset), 90, 'square', false, false);
      store.addLashing(leg1R, benchCross1, new THREE.Vector3(0.45, 0.45, z1).add(offset), 90, 'square', false, false);

      store.addLashing(leg2L, tableCross2, new THREE.Vector3(-0.2, 0.88, z2).add(offset), 90, 'square', false, false);
      store.addLashing(leg2R, tableCross2, new THREE.Vector3(0.2, 0.88, z2).add(offset), 90, 'square', false, false);
      store.addLashing(leg2L, benchCross2, new THREE.Vector3(-0.45, 0.45, z2).add(offset), 90, 'square', false, false);
      store.addLashing(leg2R, benchCross2, new THREE.Vector3(0.45, 0.45, z2).add(offset), 90, 'square', false, false);

      store.addLashing(tableCross1, tPlank1, new THREE.Vector3(-0.2, 0.94, z1).add(offset), 90, 'square', false, false);
      store.addLashing(tableCross1, tPlank2, new THREE.Vector3(0.0, 0.94, z1).add(offset), 90, 'square', false, false);
      store.addLashing(tableCross1, tPlank3, new THREE.Vector3(0.2, 0.94, z1).add(offset), 90, 'square', false, false);
      store.addLashing(tableCross2, tPlank1, new THREE.Vector3(-0.2, 0.94, z2).add(offset), 90, 'square', false, false);
      store.addLashing(tableCross2, tPlank2, new THREE.Vector3(0.0, 0.94, z2).add(offset), 90, 'square', false, false);
      store.addLashing(tableCross2, tPlank3, new THREE.Vector3(0.2, 0.94, z2).add(offset), 90, 'square', false, false);

      store.addLashing(benchCross1, bPlankL, new THREE.Vector3(-0.65, 0.5, z1).add(offset), 90, 'square', false, false);
      store.addLashing(benchCross1, bPlankR, new THREE.Vector3(0.65, 0.5, z1).add(offset), 90, 'square', false, false);
      store.addLashing(benchCross2, bPlankL, new THREE.Vector3(-0.65, 0.5, z2).add(offset), 90, 'square', false, false);
      store.addLashing(benchCross2, bPlankR, new THREE.Vector3(0.65, 0.5, z2).add(offset), 90, 'square', false, false);

      store.addLashing(benchCross1, spine, new THREE.Vector3(0, 0.45, z1).add(offset), 90, 'square', false, false);
      store.addLashing(benchCross2, spine, new THREE.Vector3(0, 0.45, z2).add(offset), 90, 'square', false, false);

      return [leg1L, leg1R, tableCross1, benchCross1, leg2L, leg2R, tableCross2, benchCross2, tPlank1, tPlank2, tPlank3, bPlankL, bPlankR, spine];
    }
  },

  // -------------------------------------------------------------
  // 24. PHARAONIC MAIN GATE (بوابة المعبد الفرعوني الكبرى) - NEW!
  // -------------------------------------------------------------
  {
    id: 'pharaonic_main_gate',
    name: 'بوابة المعبد الفرعوني الكبرى (Pharaonic Temple Gate)',
    description: 'بوابة المعسكر الكبرى المصممة خصيصاً لثيم المعبد الفرعوني: صرحان مزدوجان وجسر علوي ودعامات مائلة وساريتان.',
    category: 'خيام',
    difficulty: 'متقدم',
    dimensions: { width: 4.8, length: 2.2, height: 4.2 },
    materials: { staves: 8, medium: 6, long: 3, xlong: 0, lashings: 18, ropeLength: 64 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 30L9 8H13L15 30H6Z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M30 30L27 8H23L21 30H30Z" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="2.5"/>
        <line x1="11" y1="18" x2="25" y2="18" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="18" cy="13" r="2.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pL1 = store.addSparAlongSegment('long', new THREE.Vector3(-1.8, 0.05, 0).add(offset), new THREE.Vector3(-1.4, 3.8, 0).add(offset), false);
      const pL2 = store.addSparAlongSegment('long', new THREE.Vector3(-1.0, 0.05, 0).add(offset), new THREE.Vector3(-1.0, 3.8, 0).add(offset), false);

      const pR1 = store.addSparAlongSegment('long', new THREE.Vector3(1.0, 0.05, 0).add(offset), new THREE.Vector3(1.0, 3.8, 0).add(offset), false);
      const pR2 = store.addSparAlongSegment('long', new THREE.Vector3(1.8, 0.05, 0).add(offset), new THREE.Vector3(1.4, 3.8, 0).add(offset), false);

      const lintel = store.addSparAlongSegment('long', new THREE.Vector3(-2.2, 3.7, 0.06).add(offset), new THREE.Vector3(2.2, 3.7, 0.06).add(offset), false);

      const midBeam = store.addSparAlongSegment('medium', new THREE.Vector3(-1.5, 2.7, 0.06).add(offset), new THREE.Vector3(1.5, 2.7, 0.06).add(offset), false);

      const tieL1 = store.addSparAlongSegment('stave', new THREE.Vector3(-1.7, 1.2, 0).add(offset), new THREE.Vector3(-1.0, 1.2, 0).add(offset), false);
      const tieL2 = store.addSparAlongSegment('stave', new THREE.Vector3(-1.5, 2.4, 0).add(offset), new THREE.Vector3(-1.0, 2.4, 0).add(offset), false);

      const tieR1 = store.addSparAlongSegment('stave', new THREE.Vector3(1.0, 1.2, 0).add(offset), new THREE.Vector3(1.7, 1.2, 0).add(offset), false);
      const tieR2 = store.addSparAlongSegment('stave', new THREE.Vector3(1.0, 2.4, 0).add(offset), new THREE.Vector3(1.5, 2.4, 0).add(offset), false);

      const bL = store.addSparAlongSegment('medium', new THREE.Vector3(-1.4, 2.5, 0).add(offset), new THREE.Vector3(-1.4, 0.05, -1.8).add(offset), false);
      const bR = store.addSparAlongSegment('medium', new THREE.Vector3(1.4, 2.5, 0).add(offset), new THREE.Vector3(1.4, 0.05, -1.8).add(offset), false);

      store.addLashing(pL1, lintel, new THREE.Vector3(-1.4, 3.7, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pL2, lintel, new THREE.Vector3(-1.0, 3.7, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR1, lintel, new THREE.Vector3(1.0, 3.7, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR2, lintel, new THREE.Vector3(1.4, 3.7, 0).add(offset), 90, 'square', false, false);

      store.addLashing(pL2, midBeam, new THREE.Vector3(-1.0, 2.7, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR1, midBeam, new THREE.Vector3(1.0, 2.7, 0).add(offset), 90, 'square', false, false);

      store.addLashing(pL1, tieL1, new THREE.Vector3(-1.7, 1.2, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pL2, tieL1, new THREE.Vector3(-1.0, 1.2, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pL1, tieL2, new THREE.Vector3(-1.5, 2.4, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pL2, tieL2, new THREE.Vector3(-1.0, 2.4, 0).add(offset), 90, 'square', false, false);

      store.addLashing(pR1, tieR1, new THREE.Vector3(1.0, 1.2, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR2, tieR1, new THREE.Vector3(1.7, 1.2, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR1, tieR2, new THREE.Vector3(1.0, 2.4, 0).add(offset), 90, 'square', false, false);
      store.addLashing(pR2, tieR2, new THREE.Vector3(1.5, 2.4, 0).add(offset), 90, 'square', false, false);

      store.addLashing(pL2, bL, new THREE.Vector3(-1.4, 2.5, 0).add(offset), 45, 'diagonal', false, false);
      store.addLashing(pR1, bR, new THREE.Vector3(1.4, 2.5, 0).add(offset), 45, 'diagonal', false, false);

      return [pL1, pL2, pR1, pR2, lintel, midBeam, tieL1, tieL2, tieR1, tieR2, bL, bR];
    }
  },

  // -------------------------------------------------------------
  // 25. PATROL DEN SHELTER (مظلة النادي الخلوي ومجلس السمر) - NEW!
  // -------------------------------------------------------------
  {
    id: 'patrol_den_shelter',
    name: 'مظلة النادي الخلوي (Patrol Den Pergola)',
    description: 'عريشة ومظلة خلوية متكاملة لجلسات السمر واجتماعات الطليعة مع مقاعد محيطية وعوارض تظليل علوية.',
    category: 'خيام',
    difficulty: 'متوسط',
    dimensions: { width: 2.4, length: 2.4, height: 2.8 },
    materials: { staves: 10, medium: 8, long: 0, xlong: 0, lashings: 16, ropeLength: 54 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14L18 6L32 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="14" x2="8" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="28" y1="14" x2="28" y2="30" stroke="currentColor" stroke-width="2"/>
        <line x1="8" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const r = 0.9;
      const p1 = store.addSparAlongSegment('medium', new THREE.Vector3(-r, 0.05, -r).add(offset), new THREE.Vector3(-r, 2.6, -r).add(offset), false);
      const p2 = store.addSparAlongSegment('medium', new THREE.Vector3(r, 0.05, -r).add(offset), new THREE.Vector3(r, 2.6, -r).add(offset), false);
      const p3 = store.addSparAlongSegment('medium', new THREE.Vector3(r, 0.05, r).add(offset), new THREE.Vector3(r, 2.6, r).add(offset), false);
      const p4 = store.addSparAlongSegment('medium', new THREE.Vector3(-r, 0.05, r).add(offset), new THREE.Vector3(-r, 2.6, r).add(offset), false);

      const yR = 2.4;
      const rf1 = store.addSparAlongSegment('medium', new THREE.Vector3(-1.1, yR, -r).add(offset), new THREE.Vector3(1.1, yR, -r).add(offset), false);
      const rf2 = store.addSparAlongSegment('medium', new THREE.Vector3(r, yR + 0.07, -1.1).add(offset), new THREE.Vector3(r, yR + 0.07, 1.1).add(offset), false);
      const rf3 = store.addSparAlongSegment('medium', new THREE.Vector3(1.1, yR, r).add(offset), new THREE.Vector3(-1.1, yR, r).add(offset), false);
      const rf4 = store.addSparAlongSegment('medium', new THREE.Vector3(-r, yR + 0.07, 1.1).add(offset), new THREE.Vector3(-r, yR + 0.07, -1.1).add(offset), false);

      const rft1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.45, yR + 0.14, -r).add(offset), new THREE.Vector3(-0.45, yR + 0.14, r).add(offset), false);
      const rft2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.0, yR + 0.14, -r).add(offset), new THREE.Vector3(0.0, yR + 0.14, r).add(offset), false);
      const rft3 = store.addSparAlongSegment('stave', new THREE.Vector3(0.45, yR + 0.14, -r).add(offset), new THREE.Vector3(0.45, yR + 0.14, r).add(offset), false);

      const bSeat1 = store.addSparAlongSegment('stave', new THREE.Vector3(-r, 0.45, -r).add(offset), new THREE.Vector3(r, 0.45, -r).add(offset), false);
      const bSeat2 = store.addSparAlongSegment('stave', new THREE.Vector3(-r, 0.45, r).add(offset), new THREE.Vector3(r, 0.45, r).add(offset), false);

      store.addLashing(p1, rf1, new THREE.Vector3(-r, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(p2, rf1, new THREE.Vector3(r, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(p2, rf2, new THREE.Vector3(r, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(p3, rf2, new THREE.Vector3(r, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(p3, rf3, new THREE.Vector3(r, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(p4, rf3, new THREE.Vector3(-r, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(p4, rf4, new THREE.Vector3(-r, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(p1, rf4, new THREE.Vector3(-r, yR, -r).add(offset), 90, 'square', false, false);

      store.addLashing(rf1, rft1, new THREE.Vector3(-0.45, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(rf3, rft1, new THREE.Vector3(-0.45, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(rf1, rft2, new THREE.Vector3(0.0, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(rf3, rft2, new THREE.Vector3(0.0, yR, r).add(offset), 90, 'square', false, false);
      store.addLashing(rf1, rft3, new THREE.Vector3(0.45, yR, -r).add(offset), 90, 'square', false, false);
      store.addLashing(rf3, rft3, new THREE.Vector3(0.45, yR, r).add(offset), 90, 'square', false, false);

      store.addLashing(p1, bSeat1, new THREE.Vector3(-r, 0.45, -r).add(offset), 90, 'square', false, false);
      store.addLashing(p2, bSeat1, new THREE.Vector3(r, 0.45, -r).add(offset), 90, 'square', false, false);
      store.addLashing(p4, bSeat2, new THREE.Vector3(-r, 0.45, r).add(offset), 90, 'square', false, false);
      store.addLashing(p3, bSeat2, new THREE.Vector3(r, 0.45, r).add(offset), 90, 'square', false, false);

      return [p1, p2, p3, p4, rf1, rf2, rf3, rf4, rft1, rft2, rft3, bSeat1, bSeat2];
    }
  },

  // -------------------------------------------------------------
  // 26. ECOLOGICAL WASTE STAND (سلة مهملات كشفية معلقة) - NEW!
  // -------------------------------------------------------------
  {
    id: 'camp_waste_stand',
    name: 'سلة مهملات كشفية معلقة (Eco Camp Waste Stand)',
    description: 'حامل كشفي بيئي ثلاثي القوائم لتعليق أكياس المهملات بعيداً عن ملامسة الأرض والحيوانات للحفاظ على نظافة المعسكر.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.0, length: 1.0, height: 1.2 },
    materials: { staves: 6, medium: 0, long: 0, xlong: 0, lashings: 6, ropeLength: 18 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28L18 8L24 28" stroke="currentColor" stroke-width="2"/>
        <line x1="10" y1="18" x2="26" y2="18" stroke="currentColor" stroke-width="2"/>
        <circle cx="18" cy="22" r="3" fill="#10b981" opacity="0.6"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const pTop = new THREE.Vector3(0, 1.15, 0).add(offset);
      const r = 0.5;
      const f1 = new THREE.Vector3(0, 0.05, r).add(offset);
      const f2 = new THREE.Vector3(r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);
      const f3 = new THREE.Vector3(-r * Math.cos(Math.PI / 6), 0.05, -r * Math.sin(Math.PI / 6)).add(offset);

      const s1 = store.addSparAlongSegment('stave', f1, pTop, false);
      const s2 = store.addSparAlongSegment('stave', f2, pTop, false);
      const s3 = store.addSparAlongSegment('stave', f3, pTop, false);

      const b1 = new THREE.Vector3().lerpVectors(f1, pTop, 0.4);
      const b2 = new THREE.Vector3().lerpVectors(f2, pTop, 0.4);
      const b3 = new THREE.Vector3().lerpVectors(f3, pTop, 0.4);

      const r12 = store.addSparAlongSegment('stave', b1, b2, false);
      const r23 = store.addSparAlongSegment('stave', b2, b3, false);
      const r31 = store.addSparAlongSegment('stave', b3, b1, false);

      store.addLashing(s1, s2, pTop, 20, 'tripod', false, false);
      store.addLashing(s2, s3, pTop, 20, 'tripod', false, false);
      store.addLashing(s3, s1, pTop, 20, 'tripod', false, false);

      store.addLashing(s1, r12, b1, 90, 'square', false, false);
      store.addLashing(s2, r12, b2, 90, 'square', false, false);

      store.addLashing(s2, r23, b2, 90, 'square', false, false);
      store.addLashing(s3, r23, b3, 90, 'square', false, false);

      store.addLashing(s3, r31, b3, 90, 'square', false, false);
      store.addLashing(s1, r31, b1, 90, 'square', false, false);

      return [s1, s2, s3, r12, r23, r31];
    }
  },

  // -------------------------------------------------------------
  // 27. CAMP TOOL RACK (حامل أدوات الرواد) - NEW!
  // -------------------------------------------------------------
  {
    id: 'camp_tool_rack',
    name: 'حامل أدوات الرواد (Pioneer Tool Stand)',
    description: 'حامل كشفي آمن لتنظيم وحفظ فؤوس ومناشير ومعاول المخيم بشكل آمن يمنع الحوادث.',
    category: 'ادوات',
    difficulty: 'مبتدئ',
    dimensions: { width: 1.2, length: 0.9, height: 1.1 },
    materials: { staves: 7, medium: 0, long: 0, xlong: 0, lashings: 8, ropeLength: 24 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2.5"/>
        <line x1="10" y1="12" x2="6" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="26" y1="12" x2="30" y2="28" stroke="currentColor" stroke-width="2"/>
        <line x1="18" y1="14" x2="18" y2="24" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const z1 = -0.35;
      const z2 = 0.35;

      const a1L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z1).add(offset), new THREE.Vector3(0, 1.0, z1).add(offset), false);
      const a1R = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z1).add(offset), new THREE.Vector3(0, 1.0, z1).add(offset), false);

      const a2L = store.addSparAlongSegment('stave', new THREE.Vector3(-0.35, 0.05, z2).add(offset), new THREE.Vector3(0, 1.0, z2).add(offset), false);
      const a2R = store.addSparAlongSegment('stave', new THREE.Vector3(0.35, 0.05, z2).add(offset), new THREE.Vector3(0, 1.0, z2).add(offset), false);

      const topBar1 = store.addSparAlongSegment('stave', new THREE.Vector3(-0.1, 0.95, -0.55).add(offset), new THREE.Vector3(-0.1, 0.95, 0.55).add(offset), false);
      const topBar2 = store.addSparAlongSegment('stave', new THREE.Vector3(0.1, 0.95, -0.55).add(offset), new THREE.Vector3(0.1, 0.95, 0.55).add(offset), false);

      const gSpur = store.addSparAlongSegment('stave', new THREE.Vector3(0, 0.15, -0.55).add(offset), new THREE.Vector3(0, 0.15, 0.55).add(offset), false);

      store.addLashing(a1L, a1R, new THREE.Vector3(0, 1.0, z1).add(offset), 45, 'shear', false, false);
      store.addLashing(a2L, a2R, new THREE.Vector3(0, 1.0, z2).add(offset), 45, 'shear', false, false);

      store.addLashing(a1L, topBar1, new THREE.Vector3(-0.1, 0.95, z1).add(offset), 90, 'square', false, false);
      store.addLashing(a1R, topBar2, new THREE.Vector3(0.1, 0.95, z1).add(offset), 90, 'square', false, false);
      store.addLashing(a2L, topBar1, new THREE.Vector3(-0.1, 0.95, z2).add(offset), 90, 'square', false, false);
      store.addLashing(a2R, topBar2, new THREE.Vector3(0.1, 0.95, z2).add(offset), 90, 'square', false, false);

      store.addLashing(a1L, gSpur, new THREE.Vector3(-0.15, 0.15, z1).add(offset), 90, 'square', false, false);
      store.addLashing(a1R, gSpur, new THREE.Vector3(0.15, 0.15, z1).add(offset), 90, 'square', false, false);
      store.addLashing(a2L, gSpur, new THREE.Vector3(-0.15, 0.15, z2).add(offset), 90, 'square', false, false);
      store.addLashing(a2R, gSpur, new THREE.Vector3(0.15, 0.15, z2).add(offset), 90, 'square', false, false);

      return [a1L, a1R, a2L, a2R, topBar1, topBar2, gSpur];
    }
  },

  // -------------------------------------------------------------
  // 28. MULTI-PURPOSE PIONEER LIVING GADGET (كادج ريادي مجمع متعدد الأغراض) - NEW!
  // -------------------------------------------------------------
  {
    id: 'multi_purpose_scout_gadget',
    name: 'كادج ريادي مجمع (سرير شبكي + دكتين + عريشة)',
    description: 'كادج ريادي مجمع متكامل للمخيمات يجمع بين مقصين رئيسيين حاملين، وسرير شبكي معلق للاستراحة، ودكتي جلوس جانبيتين كاملتي الألواح، وعريشة سقفية لتعليق المعدات والمظلة مع منظومة تثبيت متزنة 100%.',
    category: 'ادوات',
    difficulty: 'متقدم',
    dimensions: { width: 2.7, length: 2.5, height: 2.5 },
    materials: { staves: 35, medium: 14, long: 0, xlong: 0, lashings: 84, ropeLength: 168 },
    iconSvg: `
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Scissors X -->
        <line x1="8" y1="30" x2="24" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="28" y1="30" x2="12" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Top Pergola bar -->
        <line x1="8" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <!-- Central Net Bed frame -->
        <rect x="13" y="16" width="10" height="4" rx="0.5" stroke="#facc15" stroke-width="1.5" fill="none"/>
        <line x1="13" y1="18" x2="23" y2="18" stroke="#facc15" stroke-width="1" stroke-dasharray="1 1"/>
        <!-- Left & Right Benches -->
        <line x1="4" y1="23" x2="12" y2="23" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="24" y1="23" x2="32" y2="23" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="5" y1="23" x2="3" y2="30" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <line x1="31" y1="23" x2="33" y2="30" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <!-- Base spreader -->
        <line x1="7" y1="28" x2="29" y2="28" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1"/>
        <!-- Intersection marker -->
        <circle cx="18" cy="15" r="1.5" fill="#facc15"/>
      </svg>
    `,
    buildFn: (store, offset) => {
      const zF = -1.15; // Front Z
      const zR = 1.15;  // Rear Z

      // -------------------------------------------------------------
      // 1. FRONT & REAR MAIN X-FRAMES (المقصان الرئيسيان)
      // -------------------------------------------------------------
      // Front X legs (crossing at x=0, y=1.35, z=zF)
      // Leg 1: Front-Left foot to Top-Right
      const fLegL = store.addSparAlongSegment('medium', 
        new THREE.Vector3(-1.05, 0.05, zF - 0.03).add(offset), 
        new THREE.Vector3(0.65, 2.45, zF - 0.03).add(offset), 
        false
      );
      // Leg 2: Front-Right foot to Top-Left
      const fLegR = store.addSparAlongSegment('medium', 
        new THREE.Vector3(1.05, 0.05, zF + 0.03).add(offset), 
        new THREE.Vector3(-0.65, 2.45, zF + 0.03).add(offset), 
        false
      );

      // Rear X legs (crossing at x=0, y=1.35, z=zR)
      // Leg 3: Rear-Left foot to Top-Right
      const rLegL = store.addSparAlongSegment('medium', 
        new THREE.Vector3(-1.05, 0.05, zR + 0.03).add(offset), 
        new THREE.Vector3(0.65, 2.45, zR + 0.03).add(offset), 
        false
      );
      // Leg 4: Rear-Right foot to Top-Left
      const rLegR = store.addSparAlongSegment('medium', 
        new THREE.Vector3(1.05, 0.05, zR - 0.03).add(offset), 
        new THREE.Vector3(-0.65, 2.45, zR - 0.03).add(offset), 
        false
      );

      // Main shear/diagonal lashings at the intersections of the two X's
      store.addLashing(fLegL, fLegR, new THREE.Vector3(0, 1.35, zF).add(offset), 55, 'diagonal', false, false);
      store.addLashing(rLegL, rLegR, new THREE.Vector3(0, 1.35, zR).add(offset), 55, 'diagonal', false, false);

      // -------------------------------------------------------------
      // 2. BASE SPREADERS & LONGITUDINAL GROUND STRINGERS (قواعد التثبيت الأرضي)
      // -------------------------------------------------------------
      // Front base spreader across feet
      const fSpreader = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.0, 0.12, zF - 0.06).add(offset),
        new THREE.Vector3(1.0, 0.12, zF - 0.06).add(offset),
        false
      );
      store.addLashing(fLegL, fSpreader, new THREE.Vector3(-1.0, 0.12, zF).add(offset), 85, 'square', false, false);
      store.addLashing(fLegR, fSpreader, new THREE.Vector3(1.0, 0.12, zF).add(offset), 85, 'square', false, false);

      // Rear base spreader across feet
      const rSpreader = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.0, 0.12, zR + 0.06).add(offset),
        new THREE.Vector3(1.0, 0.12, zR + 0.06).add(offset),
        false
      );
      store.addLashing(rLegL, rSpreader, new THREE.Vector3(-1.0, 0.12, zR).add(offset), 85, 'square', false, false);
      store.addLashing(rLegR, rSpreader, new THREE.Vector3(1.0, 0.12, zR).add(offset), 85, 'square', false, false);

      // Longitudinal ground stringers tying front and rear feet along ground
      const gRunnerL = store.addSparAlongSegment('medium',
        new THREE.Vector3(-1.05, 0.08, -1.35).add(offset),
        new THREE.Vector3(-1.05, 0.08, 1.35).add(offset),
        false
      );
      store.addLashing(fLegL, gRunnerL, new THREE.Vector3(-1.05, 0.08, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rLegL, gRunnerL, new THREE.Vector3(-1.05, 0.08, zR).add(offset), 90, 'square', false, false);

      const gRunnerR = store.addSparAlongSegment('medium',
        new THREE.Vector3(1.05, 0.08, -1.35).add(offset),
        new THREE.Vector3(1.05, 0.08, 1.35).add(offset),
        false
      );
      store.addLashing(fLegR, gRunnerR, new THREE.Vector3(1.05, 0.08, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rLegR, gRunnerR, new THREE.Vector3(1.05, 0.08, zR).add(offset), 90, 'square', false, false);

      // -------------------------------------------------------------
      // 3. OVERHEAD PERGOLA / ROOF BEAMS (العريشة / المظلة السقفية)
      // -------------------------------------------------------------
      // Left top ridge beam
      const topBeamL = store.addSparAlongSegment('medium',
        new THREE.Vector3(-0.65, 2.42, -1.35).add(offset),
        new THREE.Vector3(-0.65, 2.42, 1.35).add(offset),
        false
      );
      store.addLashing(fLegR, topBeamL, new THREE.Vector3(-0.65, 2.42, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rLegR, topBeamL, new THREE.Vector3(-0.65, 2.42, zR).add(offset), 90, 'square', false, false);

      // Right top ridge beam
      const topBeamR = store.addSparAlongSegment('medium',
        new THREE.Vector3(0.65, 2.42, -1.35).add(offset),
        new THREE.Vector3(0.65, 2.42, 1.35).add(offset),
        false
      );
      store.addLashing(fLegL, topBeamR, new THREE.Vector3(0.65, 2.42, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rLegL, topBeamR, new THREE.Vector3(0.65, 2.42, zR).add(offset), 90, 'square', false, false);

      // 3 Transverse Pergola cross rafters
      const topRafters: Spar[] = [];
      [-1.15, 0.0, 1.15].forEach(zPos => {
        const rafter = store.addSparAlongSegment('stave',
          new THREE.Vector3(-0.75, 2.48, zPos).add(offset),
          new THREE.Vector3(0.75, 2.48, zPos).add(offset),
          false
        );
        store.addLashing(topBeamL, rafter, new THREE.Vector3(-0.65, 2.48, zPos).add(offset), 90, 'square', false, false);
        store.addLashing(topBeamR, rafter, new THREE.Vector3(0.65, 2.48, zPos).add(offset), 90, 'square', false, false);
        topRafters.push(rafter);
      });

      // -------------------------------------------------------------
      // 4. SUSPENDED CENTRAL COT / NET BED (المرقد الشبكي الأوسط المعلق)
      // -------------------------------------------------------------
      // Transverse support ledgers lashed directly to the X legs at y = 0.82m
      const fBedLedger = store.addSparAlongSegment('stave',
        new THREE.Vector3(-0.55, 0.82, zF - 0.05).add(offset),
        new THREE.Vector3(0.55, 0.82, zF - 0.05).add(offset),
        false
      );
      store.addLashing(fLegL, fBedLedger, new THREE.Vector3(-0.45, 0.82, zF).add(offset), 85, 'square', false, false);
      store.addLashing(fLegR, fBedLedger, new THREE.Vector3(0.45, 0.82, zF).add(offset), 85, 'square', false, false);

      const rBedLedger = store.addSparAlongSegment('stave',
        new THREE.Vector3(-0.55, 0.82, zR + 0.05).add(offset),
        new THREE.Vector3(0.55, 0.82, zR + 0.05).add(offset),
        false
      );
      store.addLashing(rLegL, rBedLedger, new THREE.Vector3(-0.45, 0.82, zR).add(offset), 85, 'square', false, false);
      store.addLashing(rLegR, rBedLedger, new THREE.Vector3(0.45, 0.82, zR).add(offset), 85, 'square', false, false);

      // Longitudinal bed rails resting on ledgers (y = 0.88m)
      const bedRailL = store.addSparAlongSegment('medium',
        new THREE.Vector3(-0.42, 0.88, -1.3).add(offset),
        new THREE.Vector3(-0.42, 0.88, 1.3).add(offset),
        false
      );
      store.addLashing(fBedLedger, bedRailL, new THREE.Vector3(-0.42, 0.88, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rBedLedger, bedRailL, new THREE.Vector3(-0.42, 0.88, zR).add(offset), 90, 'square', false, false);

      const bedRailR = store.addSparAlongSegment('medium',
        new THREE.Vector3(0.42, 0.88, -1.3).add(offset),
        new THREE.Vector3(0.42, 0.88, 1.3).add(offset),
        false
      );
      store.addLashing(fBedLedger, bedRailR, new THREE.Vector3(0.42, 0.88, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rBedLedger, bedRailR, new THREE.Vector3(0.42, 0.88, zR).add(offset), 90, 'square', false, false);

      // Transverse end spreaders for the bed frame
      const fBedEnd = store.addSparAlongSegment('stave',
        new THREE.Vector3(-0.48, 0.92, -1.2).add(offset),
        new THREE.Vector3(0.48, 0.92, -1.2).add(offset),
        false
      );
      store.addLashing(bedRailL, fBedEnd, new THREE.Vector3(-0.42, 0.92, -1.2).add(offset), 90, 'square', false, false);
      store.addLashing(bedRailR, fBedEnd, new THREE.Vector3(0.42, 0.92, -1.2).add(offset), 90, 'square', false, false);

      const rBedEnd = store.addSparAlongSegment('stave',
        new THREE.Vector3(-0.48, 0.92, 1.2).add(offset),
        new THREE.Vector3(0.48, 0.92, 1.2).add(offset),
        false
      );
      store.addLashing(bedRailL, rBedEnd, new THREE.Vector3(-0.42, 0.92, 1.2).add(offset), 90, 'square', false, false);
      store.addLashing(bedRailR, rBedEnd, new THREE.Vector3(0.42, 0.92, 1.2).add(offset), 90, 'square', false, false);

      // Woven hammock support slats / cord lattice
      const bedSlats: Spar[] = [];
      [-0.8, -0.48, -0.16, 0.16, 0.48, 0.8].forEach(zPos => {
        const bSlat = store.addSparAlongSegment('stave',
          new THREE.Vector3(-0.48, 0.94, zPos).add(offset),
          new THREE.Vector3(0.48, 0.94, zPos).add(offset),
          false
        );
        store.addLashing(bedRailL, bSlat, new THREE.Vector3(-0.42, 0.94, zPos).add(offset), 90, 'square', false, false);
        store.addLashing(bedRailR, bSlat, new THREE.Vector3(0.42, 0.94, zPos).add(offset), 90, 'square', false, false);
        bedSlats.push(bSlat);
      });

      // -------------------------------------------------------------
      // 5. RIGHT SIDE SCOUT BENCH (دكة الجلوس الكشفية اليمنى)
      // -------------------------------------------------------------
      // Inner rail lashed to the X-frame legs at seat height y = 0.46m
      const rBenchInner = store.addSparAlongSegment('medium',
        new THREE.Vector3(0.72, 0.46, -1.3).add(offset),
        new THREE.Vector3(0.72, 0.46, 1.3).add(offset),
        false
      );
      store.addLashing(fLegR, rBenchInner, new THREE.Vector3(0.72, 0.46, zF).add(offset), 85, 'square', false, false);
      store.addLashing(rLegR, rBenchInner, new THREE.Vector3(0.72, 0.46, zR).add(offset), 85, 'square', false, false);

      // Outer bench rail at x = 1.25m, y = 0.46m
      const rBenchOuter = store.addSparAlongSegment('medium',
        new THREE.Vector3(1.25, 0.46, -1.3).add(offset),
        new THREE.Vector3(1.25, 0.46, 1.3).add(offset),
        false
      );

      // Outrigger angled support legs (front & rear) down to ground
      const rOutriggerF = store.addSparAlongSegment('stave',
        new THREE.Vector3(1.42, 0.05, zF).add(offset),
        new THREE.Vector3(0.72, 0.46, zF).add(offset),
        false
      );
      const rOutriggerR = store.addSparAlongSegment('stave',
        new THREE.Vector3(1.42, 0.05, zR).add(offset),
        new THREE.Vector3(0.72, 0.46, zR).add(offset),
        false
      );

      // Transverse bench cantilevers tying inner rail, outer rail, and outriggers
      const rCantileverF = store.addSparAlongSegment('stave',
        new THREE.Vector3(0.65, 0.40, zF).add(offset),
        new THREE.Vector3(1.35, 0.40, zF).add(offset),
        false
      );
      store.addLashing(rBenchInner, rCantileverF, new THREE.Vector3(0.72, 0.40, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rBenchOuter, rCantileverF, new THREE.Vector3(1.25, 0.40, zF).add(offset), 90, 'square', false, false);
      store.addLashing(rOutriggerF, rBenchOuter, new THREE.Vector3(1.25, 0.40, zF).add(offset), 75, 'diagonal', false, false);

      const rCantileverR = store.addSparAlongSegment('stave',
        new THREE.Vector3(0.65, 0.40, zR).add(offset),
        new THREE.Vector3(1.35, 0.40, zR).add(offset),
        false
      );
      store.addLashing(rBenchInner, rCantileverR, new THREE.Vector3(0.72, 0.40, zR).add(offset), 90, 'square', false, false);
      store.addLashing(rBenchOuter, rCantileverR, new THREE.Vector3(1.25, 0.40, zR).add(offset), 90, 'square', false, false);
      store.addLashing(rOutriggerR, rBenchOuter, new THREE.Vector3(1.25, 0.40, zR).add(offset), 75, 'diagonal', false, false);

      // Right bench seat slats (6 evenly spaced slats)
      const rBenchSlats: Spar[] = [];
      [-0.9, -0.54, -0.18, 0.18, 0.54, 0.9].forEach(zPos => {
        const slat = store.addSparAlongSegment('stave',
          new THREE.Vector3(0.68, 0.50, zPos).add(offset),
          new THREE.Vector3(1.30, 0.50, zPos).add(offset),
          false
        );
        store.addLashing(rBenchInner, slat, new THREE.Vector3(0.72, 0.50, zPos).add(offset), 90, 'square', false, false);
        store.addLashing(rBenchOuter, slat, new THREE.Vector3(1.25, 0.50, zPos).add(offset), 90, 'square', false, false);
        rBenchSlats.push(slat);
      });

      // -------------------------------------------------------------
      // 6. LEFT SIDE BENCH / EQUIPMENT PLATFORM (دكة / منصة المعدات اليسرى)
      // -------------------------------------------------------------
      const lBenchInner = store.addSparAlongSegment('medium',
        new THREE.Vector3(-0.72, 0.46, -1.3).add(offset),
        new THREE.Vector3(-0.72, 0.46, 1.3).add(offset),
        false
      );
      store.addLashing(fLegL, lBenchInner, new THREE.Vector3(-0.72, 0.46, zF).add(offset), 85, 'square', false, false);
      store.addLashing(rLegL, lBenchInner, new THREE.Vector3(-0.72, 0.46, zR).add(offset), 85, 'square', false, false);

      const lBenchOuter = store.addSparAlongSegment('medium',
        new THREE.Vector3(-1.25, 0.46, -1.3).add(offset),
        new THREE.Vector3(-1.25, 0.46, 1.3).add(offset),
        false
      );

      const lOutriggerF = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.42, 0.05, zF).add(offset),
        new THREE.Vector3(-0.72, 0.46, zF).add(offset),
        false
      );
      const lOutriggerR = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.42, 0.05, zR).add(offset),
        new THREE.Vector3(-0.72, 0.46, zR).add(offset),
        false
      );

      const lCantileverF = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.35, 0.40, zF).add(offset),
        new THREE.Vector3(-0.65, 0.40, zF).add(offset),
        false
      );
      store.addLashing(lBenchInner, lCantileverF, new THREE.Vector3(-0.72, 0.40, zF).add(offset), 90, 'square', false, false);
      store.addLashing(lBenchOuter, lCantileverF, new THREE.Vector3(-1.25, 0.40, zF).add(offset), 90, 'square', false, false);
      store.addLashing(lOutriggerF, lBenchOuter, new THREE.Vector3(-1.25, 0.40, zF).add(offset), 75, 'diagonal', false, false);

      const lCantileverR = store.addSparAlongSegment('stave',
        new THREE.Vector3(-1.35, 0.40, zR).add(offset),
        new THREE.Vector3(-0.65, 0.40, zR).add(offset),
        false
      );
      store.addLashing(lBenchInner, lCantileverR, new THREE.Vector3(-0.72, 0.40, zR).add(offset), 90, 'square', false, false);
      store.addLashing(lBenchOuter, lCantileverR, new THREE.Vector3(-1.25, 0.40, zR).add(offset), 90, 'square', false, false);
      store.addLashing(lOutriggerR, lBenchOuter, new THREE.Vector3(-1.25, 0.40, zR).add(offset), 75, 'diagonal', false, false);

      const lBenchSlats: Spar[] = [];
      [-0.9, -0.54, -0.18, 0.18, 0.54, 0.9].forEach(zPos => {
        const slat = store.addSparAlongSegment('stave',
          new THREE.Vector3(-1.30, 0.50, zPos).add(offset),
          new THREE.Vector3(-0.68, 0.50, zPos).add(offset),
          false
        );
        store.addLashing(lBenchInner, slat, new THREE.Vector3(-0.72, 0.50, zPos).add(offset), 90, 'square', false, false);
        store.addLashing(lBenchOuter, slat, new THREE.Vector3(-1.25, 0.50, zPos).add(offset), 90, 'square', false, false);
        lBenchSlats.push(slat);
      });

      return [
        fLegL, fLegR, rLegL, rLegR,
        fSpreader, rSpreader, gRunnerL, gRunnerR,
        topBeamL, topBeamR, ...topRafters,
        fBedLedger, rBedLedger, bedRailL, bedRailR, fBedEnd, rBedEnd, ...bedSlats,
        rBenchInner, rBenchOuter, rOutriggerF, rOutriggerR, rCantileverF, rCantileverR, ...rBenchSlats,
        lBenchInner, lBenchOuter, lOutriggerF, lOutriggerR, lCantileverF, lCantileverR, ...lBenchSlats
      ];
    }
  }
];
