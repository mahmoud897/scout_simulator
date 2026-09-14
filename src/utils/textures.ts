import * as THREE from 'three';

function createWoodBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#543d2b');
  grad.addColorStop(0.3, '#604837');
  grad.addColorStop(0.7, '#4c3524');
  grad.addColorStop(1, '#543d2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  
  ctx.fillStyle = 'rgba(38, 24, 15, 0.45)';
  for (let i = 0; i < 30; i++) {
    const w = 4 + Math.random() * 8;
    const x = Math.random() * 256;
    ctx.fillRect(x, 0, w, 256);
  }
  
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 100; i++) {
    ctx.beginPath();
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const len = 15 + Math.random() * 40;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, y + len);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return texture;
}

function createWoodRingsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  ctx.fillStyle = '#dbb893';
  ctx.fillRect(0, 0, 128, 128);
  
  const cx = 64;
  const cy = 64;
  ctx.strokeStyle = 'rgba(92, 64, 43, 0.4)';
  
  for (let r = 5; r < 60; r += 4 + Math.random() * 2) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      const radialOffset = (Math.sin(a * 4) * 0.8) + (Math.cos(a * 6) * 0.5);
      const currR = r + radialOffset;
      const x = cx + Math.cos(a) * currR;
      const y = cy + Math.sin(a) * currR;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createRopeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();
  
  ctx.fillStyle = '#d2b48c';
  ctx.fillRect(0, 0, 64, 64);
  
  ctx.fillStyle = 'rgba(101, 74, 43, 0.3)';
  for (let x = -64; x < 128; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 64, 64);
    ctx.lineTo(x + 64 + 3, 64);
    ctx.lineTo(x + 3, 0);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

// Generate textures once on import
export const woodBarkTexture = createWoodBarkTexture();
export const woodRingsTexture = createWoodRingsTexture();
export const ropeTexture = createRopeTexture();
export const woodBarkTextureRef = { current: woodBarkTexture };
export const woodRingsTextureRef = { current: woodRingsTexture };
export const ropeTextureRef = { current: ropeTexture };
