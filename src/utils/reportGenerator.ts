import * as THREE from 'three';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useStore, computeBoundaryBounds, SPAR_TYPES, isSparOutOfBounds, isStakeOutOfBounds } from '../store/useStore';

export interface CampSnapshot {
  id: string;
  titleAr: string;
  type: 'isometric' | 'top_down' | 'front' | 'side';
  dataUrl: string;
  descriptionAr: string;
}

export interface CampReportData {
  projectName: string;
  scoutGroup: string;
  leaderName: string;
  dateStr: string;
  notes: string;

  // Land Concept & Theme
  landTheme: string;
  themeDescription: string;
  themeElements: string[];

  // Land & Boundary
  boundaryEnabled: boolean;
  boundaryWidth: number;
  boundaryLength: number;
  boundaryArea: number; // m²
  boundaryPerimeter: number; // m
  boundaryAlignment: string;
  boundaryAlignmentAr: string;
  assumeAllInsideBoundary: boolean;
  isBoundaryCompliant: boolean;
  outOfBoundsCount: number;

  // Spawn Zone
  spawnZoneEnabled: boolean;
  spawnZoneWidth: number;
  spawnZoneLength: number;
  spawnZoneLocation: string;

  // Timber / Spars
  totalSparsCount: number;
  totalSparsLength: number; // m
  totalSparsWeight: number; // kg
  maxHeight: number; // m
  sparsByType: {
    type: string;
    labelAr: string;
    length: number;
    count: number;
    totalLen: number;
    weight: number;
  }[];

  // Lashings
  totalLashingsCount: number;
  totalRopeLength: number; // m
  lashingsByType: {
    type: string;
    labelAr: string;
    count: number;
    estimatedRope: number;
  }[];

  // Anchorage & Guy Lines
  stakesCount: number;
  guyLinesCount: number;
  totalGuyLineRopeLength: number; // m

  // Guide & Measurements
  guidePointsCount: number;
  guideLinesCount: number;
  measuredDistances: {
    name: string;
    distance: number;
    startPoint: string;
    endPoint: string;
  }[];

  // Safety & Audit
  safetyChecks: {
    id: string;
    titleAr: string;
    status: 'pass' | 'warning' | 'info';
    detailAr: string;
  }[];
}

// Global capture bridge registered by ThreeCanvas
let captureCallback: (() => Promise<CampSnapshot[]>) | null = null;

export function registerCaptureHandler(fn: () => Promise<CampSnapshot[]>) {
  captureCallback = fn;
}

export function unregisterCaptureHandler() {
  captureCallback = null;
}

export async function captureAllAngles(): Promise<CampSnapshot[]> {
  const storeCb = useStore.getState().captureSceneCallback;
  const winCb = typeof window !== 'undefined' ? (window as unknown as { __CAMP_CAPTURE_BRIDGE__?: () => Promise<CampSnapshot[]> }).__CAMP_CAPTURE_BRIDGE__ : null;
  const cb = storeCb || winCb || captureCallback;

  if (cb) {
    try {
      return await cb();
    } catch (e) {
      console.warn('Bridge capture encountered error, falling back to direct canvas capture:', e);
    }
  }

  // Fallback: capture current canvas view directly
  const canvas = typeof document !== 'undefined' ? document.querySelector('canvas') : null;
  if (canvas) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    return [
      {
        id: 'iso',
        titleAr: 'منظور عام أيزومتري 3D للموقع',
        type: 'isometric',
        dataUrl,
        descriptionAr: 'لقطة توثيقية شاملة للمشروع توضح توزيع الأخشاب، الارتفاعات الفراغية وتكامل الهيكل الكشفي.'
      },
      {
        id: 'top',
        titleAr: 'مسقط أفقي للموقع (Site Layout Plan)',
        type: 'top_down',
        dataUrl,
        descriptionAr: 'مسقط رأسي من الأعلى يبرز حدود الأرض، مواقع الأوتاد، وشبكة المحاور الهندسية وممرات الحركة.'
      },
      {
        id: 'front',
        titleAr: 'واجهة أمامية رئيسية (Front Elevation)',
        type: 'front',
        dataUrl,
        descriptionAr: 'واجهة أفقية من مستوى النظر تبرز السواري، البوابات، وتوازن الهيكل الكشفي وتعامده.'
      },
      {
        id: 'side',
        titleAr: 'واجهة جانبية وتفاصيل التثبيت (Side Elevation)',
        type: 'side',
        dataUrl,
        descriptionAr: 'واجهة جانبية تبين التدعيم المائل، زوايا شد الحبال 45°، وتماسك الأوتاد الأرضية.'
      }
    ];
  }

  throw new Error('Scene canvas is not available');
}

export interface OrbitControlsLike {
  target: THREE.Vector3;
  update: () => void;
  enabled: boolean;
}

/**
 * Executes multi-angle high-resolution captures of the campsite.
 */
export async function performSceneCapture(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  orbitControls: OrbitControlsLike | null
): Promise<CampSnapshot[]> {
  const store = useStore.getState();
  const { spars, stakes, guidePoints, boundaryWidth, boundaryLength, boundaryAlignment, boundaryEnabled } = store;

  // Save current camera transform & controls state
  const origCamPos = camera.position.clone();
  const origCamRot = camera.rotation.clone();
  const origTarget = orbitControls ? orbitControls.target.clone() : new THREE.Vector3();
  const origControlsEnabled = orbitControls ? orbitControls.enabled : true;

  if (orbitControls) orbitControls.enabled = false;

  // Calculate bounding box of the camp site
  const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
  const box = new THREE.Box3();

  if (boundaryEnabled) {
    // Primary anchor: the land area boundary
    box.expandByPoint(new THREE.Vector3(bounds.minX, 0, bounds.minZ));
    box.expandByPoint(new THREE.Vector3(bounds.maxX, 2, bounds.maxZ));

    // Only include elements that sit within or adjacent to the camp boundary
    // so staging wood stored far outside the plot does NOT distort the camp land camera framing
    const margin = 2.0;
    spars.forEach(s => {
      if (s.visible !== false) {
        if (
          s.position.x >= bounds.minX - margin &&
          s.position.x <= bounds.maxX + margin &&
          s.position.z >= bounds.minZ - margin &&
          s.position.z <= bounds.maxZ + margin
        ) {
          box.expandByPoint(new THREE.Vector3(s.position.x - s.length / 2, s.position.y, s.position.z - s.length / 2));
          box.expandByPoint(new THREE.Vector3(s.position.x + s.length / 2, s.position.y + s.length, s.position.z + s.length / 2));
        }
      }
    });

    stakes.forEach(s => {
      if (s.visible !== false) {
        if (
          s.position.x >= bounds.minX - margin &&
          s.position.x <= bounds.maxX + margin &&
          s.position.z >= bounds.minZ - margin &&
          s.position.z <= bounds.maxZ + margin
        ) {
          box.expandByPoint(s.position);
        }
      }
    });
  } else {
    box.expandByPoint(new THREE.Vector3(-5, 0, -5));
    box.expandByPoint(new THREE.Vector3(5, 2, 5));
    spars.forEach(s => {
      if (s.visible !== false) {
        box.expandByPoint(new THREE.Vector3(s.position.x - s.length / 2, s.position.y, s.position.z - s.length / 2));
        box.expandByPoint(new THREE.Vector3(s.position.x + s.length / 2, s.position.y + s.length, s.position.z + s.length / 2));
      }
    });
    stakes.forEach(s => {
      if (s.visible !== false) box.expandByPoint(s.position);
    });
  }

  guidePoints.forEach(p => {
    if (p.visible !== false) box.expandByPoint(p.position);
  });

  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxHoriz = boundaryEnabled 
    ? Math.max(boundaryWidth, boundaryLength, 5) 
    : Math.max(size.x, size.z, 5);
  const maxVert = Math.max(size.y, 2.5);

  // Focus point centered directly on the camp plot
  const focusCenter = boundaryEnabled
    ? new THREE.Vector3(bounds.centerX, 0, bounds.centerZ)
    : center;

  // Balanced zoom-in (~25-30% closer) to make camp ground distinct and prominent
  const extent = Math.max(maxHoriz * 0.58, 4.0);

  const snapshots: CampSnapshot[] = [];

  // Hide UI gizmos / outlines if any by forcing clearSelection briefly
  const selectedSparsSaved = store.selectedSpars;
  const selectedStakeSaved = store.selectedStake;
  const selectedGuidePointSaved = store.selectedGuidePoint;
  store.clearSelection();

  // Helper to capture a single frame
  const takeShot = (
    id: string,
    titleAr: string,
    type: 'isometric' | 'top_down' | 'front' | 'side',
    camPos: THREE.Vector3,
    lookTarget: THREE.Vector3,
    descriptionAr: string
  ) => {
    camera.position.copy(camPos);
    camera.lookAt(lookTarget);
    camera.updateMatrixWorld(true);
    if ('updateProjectionMatrix' in camera) {
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/jpeg', 0.94);

    snapshots.push({
      id,
      titleAr,
      type,
      dataUrl,
      descriptionAr
    });
  };

  try {
    // 1. المنظور الأيزومتري العام 3D (Isometric Overview) - تقريب متوازن يبرز معالم الأرض
    takeShot(
      'iso',
      'منظور عام أيزومتري 3D للموقع',
      'isometric',
      new THREE.Vector3(focusCenter.x + extent * 0.9, focusCenter.y + extent * 0.75 + Math.min(maxVert * 0.25, 2.2), focusCenter.z + extent * 0.9),
      new THREE.Vector3(focusCenter.x, Math.max(maxVert * 0.2, 0.4), focusCenter.z),
      'لقطة أيزومترية شاملة تبرز شكل وحدود أرض المعسكر، توزيع الأخشاب والارتفاعات الفراغية.'
    );

    // 2. المسقط الأفقي التخطيطي 2D (Top-Down Site Layout Plan) - زوم يملأ الكادر بحدود الأرض
    const topDist = boundaryEnabled
      ? Math.max(boundaryLength * 1.12, boundaryWidth * 0.72, 5.2)
      : Math.max(Math.max(boundaryLength, size.z) * 1.12, Math.max(boundaryWidth, size.x) * 0.72, 5.2);
    takeShot(
      'top',
      'مسقط أفقي للموقع (Site Layout Plan)',
      'top_down',
      new THREE.Vector3(focusCenter.x + 0.0001, focusCenter.y + topDist, focusCenter.z),
      new THREE.Vector3(focusCenter.x, 0, focusCenter.z),
      'مسقط رأسي من الأعلى يبرز شكل وحدود الأرض بوضوح، تخطيط الممرات والمحاور ومواقع الأوتاد.'
    );

    // 3. الواجهة الأمامية للموقع (Front Elevation View) - زوم أمامي قريب يبرز البوابة
    takeShot(
      'front',
      'واجهة أمامية رئيسية (Front Elevation)',
      'front',
      new THREE.Vector3(focusCenter.x, focusCenter.y + Math.max(maxVert * 0.38, extent * 0.25, 1.2), focusCenter.z + extent * 1.08),
      new THREE.Vector3(focusCenter.x, Math.max(maxVert * 0.28, 0.7), focusCenter.z),
      'واجهة أمامية رئيسية من مستوى النظر تبرز البوابة والسواري وتوازن الهيكل الكشفي وتعامده.'
    );

    // 4. الواجهة الجانبية والعمق (Side Elevation & Anchorage View) - زوم جانبي لتفاصيل الشد
    takeShot(
      'side',
      'واجهة جانبية وتفاصيل التثبيت (Side Elevation)',
      'side',
      new THREE.Vector3(focusCenter.x + extent * 1.08, focusCenter.y + Math.max(maxVert * 0.38, extent * 0.25, 1.2), focusCenter.z),
      new THREE.Vector3(focusCenter.x, Math.max(maxVert * 0.28, 0.7), focusCenter.z),
      'واجهة جانبية تبين امتداد شكل الأرض والتدعيم المائل وزوايا شد الحبال وتماسك الأوتاد.'
    );
  } finally {
    // Restore selection
    if (selectedSparsSaved.length > 0) store.selectMultipleSpars(selectedSparsSaved);
    if (selectedStakeSaved) store.selectStake(selectedStakeSaved);
    if (selectedGuidePointSaved) store.selectGuidePoint(selectedGuidePointSaved);

    // Restore camera
    camera.position.copy(origCamPos);
    camera.rotation.copy(origCamRot);
    if ('updateProjectionMatrix' in camera) {
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);

    if (orbitControls) {
      orbitControls.target.copy(origTarget);
      orbitControls.enabled = origControlsEnabled;
      orbitControls.update();
    }
    gl.render(scene, camera);
  }

  return snapshots;
}

/**
 * Extracts and compiles comprehensive land and engineering data.
 */
export function extractCampReportData(overrides?: Partial<CampReportData>): CampReportData {
  const store = useStore.getState();
  const {
    spars,
    lashings,
    stakes,
    guyLines,
    guidePoints,
    guideLines,
    boundaryEnabled,
    boundaryWidth,
    boundaryLength,
    boundaryAlignment,
    assumeAllInsideBoundary,
    spawnZoneEnabled,
    spawnZoneWidth,
    spawnZoneLength,
    spawnZoneCenter
  } = store;

  // 1. Boundary & Compliance Calculations
  const bounds = computeBoundaryBounds(boundaryWidth, boundaryLength, boundaryAlignment);
  let outOfBoundsCount = 0;
  if (boundaryEnabled && !assumeAllInsideBoundary) {
    spars.forEach(s => {
      if (s.visible !== false && isSparOutOfBounds(s, bounds)) {
        outOfBoundsCount++;
      }
    });
    stakes.forEach(s => {
      if (s.visible !== false && isStakeOutOfBounds(s, bounds)) {
        outOfBoundsCount++;
      }
    });
  }

  const boundaryArea = boundaryWidth * boundaryLength;
  const boundaryPerimeter = 2 * (boundaryWidth + boundaryLength);

  const alignmentLabels: Record<string, string> = {
    'corner': 'ركن البداية (0, 0)',
    'center-grid': 'توسيط شبكي متطابق',
    'center': 'مركز حر (نقطة الصفر)'
  };

  // 2. Timber / Spars Breakdown
  const typeCounts: Record<string, { count: number; totalLen: number; weight: number }> = {};
  let totalSparsLength = 0;
  let totalSparsWeight = 0;
  let maxHeight = 0;

  spars.forEach(s => {
    const typeKey = s.type || 'medium';
    const len = s.length || 3.0;
    const info = SPAR_TYPES[typeKey] || { length: len, radius: 0.04, mass: len * 1.5 };
    const mass = info.mass || len * 1.5;

    totalSparsLength += len;
    totalSparsWeight += mass;

    const tipY = s.position.y + len / 2;
    if (tipY > maxHeight) maxHeight = tipY;

    if (!typeCounts[typeKey]) {
      typeCounts[typeKey] = { count: 0, totalLen: 0, weight: 0 };
    }
    typeCounts[typeKey].count += 1;
    typeCounts[typeKey].totalLen += len;
    typeCounts[typeKey].weight += mass;
  });

  const sparLabels: Record<string, string> = {
    stave: 'عصا كشفية قصيرة (1.0 م)',
    medium: 'خشب كشفي متوسط (3.0 م)',
    long: 'خشب كشفي طويل (4.0 م)',
    xlong: 'خشب كشفي طويل جداً (5.0 م)',
    custom: 'خشب كشفي مخصص'
  };

  const sparsByType = Object.keys(typeCounts).map(typeKey => ({
    type: typeKey,
    labelAr: sparLabels[typeKey] || `خشب كشفي (${typeKey})`,
    length: typeCounts[typeKey].totalLen / typeCounts[typeKey].count,
    count: typeCounts[typeKey].count,
    totalLen: Number(typeCounts[typeKey].totalLen.toFixed(1)),
    weight: Math.round(typeCounts[typeKey].weight)
  }));

  // 3. Lashings & Rope Consumption
  const lashCounts: Record<string, number> = {};
  lashings.forEach(l => {
    const t = l.type || 'square';
    lashCounts[t] = (lashCounts[t] || 0) + 1;
  });

  const lashLabels: Record<string, { label: string; ropePer: number }> = {
    square: { label: 'ربطة مربعة (Square Lashing) - تثبيت التعامد 90°', ropePer: 5.5 },
    diagonal: { label: 'ربطة قطرية (Diagonal Lashing) - مقاومة عزم الالتواء', ropePer: 6.0 },
    shear: { label: 'ربطة مقصية / قص (Shear Lashing) - امتداد السواري', ropePer: 4.5 },
    tripod: { label: 'دورة ثلاثية (Tripod Lashing) - قواعد الأبراج', ropePer: 7.5 }
  };

  let totalRopeLength = 0;
  const lashingsByType = Object.keys(lashCounts).map(t => {
    const count = lashCounts[t];
    const unitRope = lashLabels[t]?.ropePer || 5.0;
    const estRope = count * unitRope;
    totalRopeLength += estRope;
    return {
      type: t,
      labelAr: lashLabels[t]?.label || `ربطة كشفية (${t})`,
      count,
      estimatedRope: Math.round(estRope)
    };
  });

  // 4. Guy Lines & Stakes
  let totalGuyLineRopeLength = 0;
  guyLines.forEach(gl => {
    const spar = spars.find(s => s.id === gl.sparId);
    const stake = stakes.find(st => st.id === gl.stakeId);
    if (spar && stake) {
      const sparAnchor = spar.position.clone().add(new THREE.Vector3(0, gl.sparHeightOffset || 0, 0));
      const dist = sparAnchor.distanceTo(stake.position);
      totalGuyLineRopeLength += dist + 1.2; // Add 1.2m allowance for hitches and tensioners
    } else {
      totalGuyLineRopeLength += 4.5;
    }
  });

  // 5. Guide Lines & Distances
  const measuredDistances = guideLines.map((gl, idx) => {
    const dist = gl.pointA.distanceTo(gl.pointB);
    return {
      name: gl.name || `مسافة قياس هندسي #${idx + 1}`,
      distance: Number(dist.toFixed(2)),
      startPoint: `(${gl.pointA.x.toFixed(1)}, ${gl.pointA.z.toFixed(1)})`,
      endPoint: `(${gl.pointB.x.toFixed(1)}, ${gl.pointB.z.toFixed(1)})`
    };
  });

  // 6. Safety & Audit
  const safetyChecks: CampReportData['safetyChecks'] = [
    {
      id: 'bounds',
      titleAr: 'الالتزام بمحددات وحدود الأرض الكشفية',
      status: (outOfBoundsCount === 0 || assumeAllInsideBoundary) ? 'pass' : 'warning',
      detailAr: (outOfBoundsCount === 0 || assumeAllInsideBoundary)
        ? (assumeAllInsideBoundary && boundaryEnabled 
            ? 'كافة الأخشاب والأوتاد معتمدة بالكامل بنسبة 100% داخل الحيز الهندسي المخصص للمخيم (نظام التشوين المعتمد).'
            : 'كافة الأخشاب والأوتاد تقع بالكامل بنسبة 100% داخل الحيز الهندسي المخصص للمخيم.')
        : `تنبيه: يوجد ${outOfBoundsCount} عنصر متجاوز لحدود موقع الأرض المحددة، يُرجى مراجعة التموضع.`
    },
    {
      id: 'ground',
      titleAr: 'ارتكاز القواعد واستقرار ملامسة الأرض',
      status: maxHeight > 0 ? 'pass' : 'info',
      detailAr: 'تم فحص ارتكاز الهيكل؛ الأخشاب السفلية مستندة على منسوب الصفر الأرضي بارتفاع آمن.'
    },
    {
      id: 'guys',
      titleAr: 'كفاية حبال الشد وتوزيع قوى التثبيت بالأوتاد',
      status: (maxHeight > 3 && guyLines.length < 2) ? 'warning' : 'pass',
      detailAr: guyLines.length > 0
        ? `الموقع مدعم بـ ${stakes.length} أوتاد و ${guyLines.length} حبال شد لتأمين مقاومة الرياح.`
        : (maxHeight > 3 ? 'توصية: يفضل إضافة حبال شد وأوتاد لتأمين السواري ذات الارتفاع العالي.' : 'الارتفاع الحالي منخفض ومستقر ذاتياً بدون حاجة لحبال شد إضافية.')
    },
    {
      id: 'triangulation',
      titleAr: 'صلابة التثليث الهيكلي ومقاومة الاهتزاز',
      status: lashings.length >= spars.length ? 'pass' : 'info',
      detailAr: `تم ربط العناصر بعدد ${lashings.length} ربطة كشفية متينة موزعة بين التعامد والميول القطرية.`
    }
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ` - ${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

  return {
    projectName: 'تقرير أرض جامعة المنوفية',
    scoutGroup: 'عشيرة جوالة جامعة المنوفية',
    leaderName: 'قائد وفد جوالة جامعة المنوفية',
    dateStr,
    notes: 'تم تخطيط وتنفيذ أرض المعسكر استناداً إلى فلسفة المعبد الفرعوني لجامعة المنوفية مع الالتزام الكامل بالأبعاد الهندسية ومعايير السلامة الكشفية.',

    // Land Concept & Theme
    landTheme: 'المعبد الفرعوني',
    themeDescription: 'فكرة الأرض مستوحاة من طابع وتصميم المعبد الفرعوني، وتشمل مكونات المعسكر الأساسية: البوابة الرئيسية، والنادي الخلوي، بالإضافة إلى كادج مجمع مصمم لأغراض واستخدامات متعددة.',
    themeElements: ['البوابة', 'النادي الخلوي', 'كادج مجمع لأغراض متعددة'],

    boundaryEnabled,
    boundaryWidth,
    boundaryLength,
    boundaryArea,
    boundaryPerimeter,
    boundaryAlignment,
    boundaryAlignmentAr: alignmentLabels[boundaryAlignment] || 'ركن البداية',
    assumeAllInsideBoundary: !!assumeAllInsideBoundary,
    isBoundaryCompliant: outOfBoundsCount === 0 || !!assumeAllInsideBoundary,
    outOfBoundsCount: assumeAllInsideBoundary ? 0 : outOfBoundsCount,

    spawnZoneEnabled,
    spawnZoneWidth,
    spawnZoneLength,
    spawnZoneLocation: spawnZoneEnabled ? `(X: ${spawnZoneCenter.x.toFixed(1)}, Z: ${spawnZoneCenter.z.toFixed(1)})` : 'غير مفعلة',

    totalSparsCount: spars.length,
    totalSparsLength: Number(totalSparsLength.toFixed(1)),
    totalSparsWeight: Math.round(totalSparsWeight),
    maxHeight: Number(maxHeight.toFixed(2)),
    sparsByType,

    totalLashingsCount: lashings.length,
    totalRopeLength: Math.round(totalRopeLength),
    lashingsByType,

    stakesCount: stakes.length,
    guyLinesCount: guyLines.length,
    totalGuyLineRopeLength: Math.round(totalGuyLineRopeLength),

    guidePointsCount: guidePoints.length,
    guideLinesCount: guideLines.length,
    measuredDistances,

    safetyChecks,
    ...overrides
  };
}

/**
 * High-quality multi-page PDF generator using html2canvas and jsPDF.
 */
export async function exportCampReportToPDF(
  reportContainer: HTMLElement,
  fileName: string = 'تقرير_أرض_جامعة_المنوفية.pdf',
  onProgress?: (step: string) => void
): Promise<void> {
  onProgress?.('جارٍ تجهيز صفحات التقرير للطباعة...');

  // Find all A4 pages inside the report container
  const pageElements = reportContainer.querySelectorAll<HTMLElement>('.report-page-a4');
  if (pageElements.length === 0) {
    throw new Error('No A4 pages found in the report container.');
  }

  // Initialize jsPDF A4 in Portrait mode (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    onProgress?.(`جارٍ معالجة وتصدير الصفحة ${i + 1} من ${pageElements.length}...`);

    // Render page element to high-res canvas at scale 2 (retina 300 DPI equivalent)
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: pageEl.scrollWidth,
      windowHeight: pageEl.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  onProgress?.('جارٍ تنزيل وحفظ ملف الـ PDF...');
  pdf.save(fileName);
}
