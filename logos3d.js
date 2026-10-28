// La portada: los logos de la historia hechos de partículas, que se transforman uno en otro (WISEN → Farsens antiguo →
// Farsens nuevo → Kliskatek, y vuelta a empezar). Cada logo se muestrea de su imagen (posición y color de los píxeles
// opacos); en cada paso las partículas barren de izquierda a derecha y se abomban en profundidad antes de posarse.
// montarLogos(caja, { logos: [src, ...] }) devuelve { destruir }, o null sin WebGL.

import * as THREE from 'three';

const N = 12000;                       // partículas
const ANCHO = 5.2, ALTO = 2.4;        // la caja en la que cabe cada logo
const QUIETO = 1.6, PASO = 1.6;       // segundos quieto en cada logo y de transición
const FINAL = 3.2;                    // en Kliskatek, un rato más

// los píxeles de una imagen, como puntos (x, y) centrados y su color; los muy oscuros se aclaran (fondo oscuro). Cada
// píxel atrae partículas según su opacidad: un relleno tenue (las cajas del Farsens antiguo) se queda en bruma y las letras se leen
function muestrear(img) {
  const W = 420, k = Math.min(W / img.width, (W * ALTO / ANCHO) / img.height);
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, pts = [], acu = [];
  const escala = Math.min(ANCHO / w, ALTO / h);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    const i = 4 * (y * w + x);
    if (d[i + 3] < 20) continue;
    let [r, gr, b] = [d[i], d[i + 1], d[i + 2]].map((v) => v / 255);
    const lum = 0.3 * r + 0.59 * gr + 0.11 * b;
    if (lum < 0.35) { const m = (0.45 - lum) / 0.45; r += (0.75 - r) * m; gr += (0.78 - gr) * m; b += (0.82 - b) * m; }
    pts.push([(x - w / 2) * escala, (h / 2 - y) * escala, r, gr, b]);
    acu.push((acu.length ? acu[acu.length - 1] : 0) + d[i + 3]);
  }
  // N puntos al azar, con más probabilidad cuanto más opacos (con repetición si hay pocos), con un poco de grosor
  const total = acu[acu.length - 1];
  const elige = () => {
    const v = Math.random() * total;
    let a = 0, b = acu.length - 1;
    while (a < b) { const m = (a + b) >> 1; if (acu[m] < v) a = m + 1; else b = m; }
    return pts[a];
  };
  return Array.from({ length: N }, () => {
    const p = elige();
    return [p[0] + (Math.random() - 0.5) * escala, p[1] + (Math.random() - 0.5) * escala, (Math.random() - 0.5) * 0.18, p[2], p[3], p[4]];
  });
}

const cargar = (src) => new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = src; });

function punto() {                     // la textura de cada partícula: un punto suave
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function montarLogos(caja, op = {}) {
  let ren;
  try { ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  caja.appendChild(ren.domElement);
  const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cam.position.set(0, 0, 9.5);
  const grupo = new THREE.Group();
  escena.add(grupo);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tex = punto();
  const mat = new THREE.PointsMaterial({ size: 0.05, map: tex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 1 });
  grupo.add(new THREE.Points(geo, mat));

  let logos = null, raf = 0, vivo = true;
  const azar = Float32Array.from({ length: N }, () => Math.random());
  Promise.all((op.logos || []).map(cargar)).then((ims) => { if (vivo) logos = ims.map(muestrear); }).catch((e) => console.warn(e));

  const encuadre = () => {
    const w = caja.clientWidth || 1, h = caja.clientHeight || 1;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.position.z = 9.5 * Math.max(1, 1.25 / cam.aspect);     // estrecho (móvil): más lejos
    cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(encuadre); ro.observe(caja); encuadre();

  const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const t0 = performance.now();
  const cuadro = () => {
    raf = requestAnimationFrame(cuadro);
    const t = (performance.now() - t0) / 1000;
    grupo.rotation.y = Math.sin(t * 0.45) * 0.32;
    grupo.rotation.x = Math.sin(t * 0.31) * 0.08;
    if (logos) {
      // en qué tramo estamos: el logo de origen a, el de destino b y el avance del paso (0 si está quieto)
      const n = logos.length, ciclo = n * (QUIETO + PASO) - QUIETO + FINAL;
      let c = t % ciclo, a = 0, f = 0;
      for (a = 0; a < n; a += 1) {
        const quieto = a === n - 1 ? FINAL : QUIETO;
        if (c < quieto) { f = 0; break; }
        c -= quieto;
        if (c < PASO) { f = c / PASO; break; }
        c -= PASO;
      }
      a %= n;
      const A = logos[a], B = logos[(a + 1) % n];
      for (let i = 0; i < N; i += 1) {
        const p = A[i], q = B[i];
        // barrido: los de la izquierda salen antes; cada uno tarda el 55 % del paso
        const s = suave((f * 1.55 - 0.55 * ((p[0] + ANCHO / 2) / ANCHO) - 0.1 * azar[i]) / 0.55);
        const arco = Math.sin(Math.PI * s);
        pos[3 * i] = p[0] + (q[0] - p[0]) * s;
        pos[3 * i + 1] = p[1] + (q[1] - p[1]) * s + arco * (azar[i] - 0.5) * 0.9;
        pos[3 * i + 2] = p[2] + (q[2] - p[2]) * s + arco * (0.8 + 1.4 * azar[i]);
        const brillo = 1 + arco * 0.6;
        col[3 * i] = (p[3] + (q[3] - p[3]) * s) * brillo;
        col[3 * i + 1] = (p[4] + (q[4] - p[4]) * s) * brillo;
        col[3 * i + 2] = (p[5] + (q[5] - p[5]) * s) * brillo;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    }
    ren.render(escena, cam);
  };
  cuadro();

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose(); mat.dispose(); tex.dispose();
      ren.forceContextLoss();
      ren.dispose();
      ren.domElement.remove();
    },
  };
}
