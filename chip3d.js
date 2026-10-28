// Un chip en 3D con three.js, girando despacio y con el campo RF a su alrededor. Empieza cerrado, con su marcado; luego
// se levanta la tapa (el plástico de arriba) y se ve el die, con la foto del microscopio de textura, y sus bond wires de
// los pads de la foto a las patas, según el pinout del datasheet. Dos encapsulados:
//   qfn:  el QFN-16 del ROCKY100 (4 × 4 mm, 4 patas por lado; DS-ROCKY100-V04);
//   soic: el SOIC-14 del ANDY100 (8,65 × 3,9 mm, el die sobre su leadframe; DS-ANDY100-V09).
// montarChip(caja, { textura, pads, paquete, marca }) devuelve { destruir }.

import * as THREE from 'three';

// pads de la foto del die (u, v de 0 a 1 sobre rocky100-textura.jpg), con el lado del QFN y la pata (0-3, en el orden de
// la foto) a la que va su hilo; null, sin hilo. Lados: 'i' RF+ (1), 2 y 3 sin conectar, RF− (4); 'a' VREGL, GLOAD, VDD,
// EV4 (16-13); 'd' CS, SCK, MOSI, MISO (12-9); 'b' VSS, VBAT, VIO, RFU (5-8). En cada lado de cinco pads hay uno de más
// (GND o VDD) que va sin hilo: el del medio, a falta del bond diagram
const SIN = [0, 1, null, 2, 3];
// ANDY100 en SOIC-14 (u, v sobre andy100-die.jpg, la micro-foto de 2010 girada; pata 1-14): RF+ y RF− a las patas 1 y
// 14, desde los pads redondos de RF; abajo (cara de las patas 1-7) CAL, gnd, VIO, EERST, SCK, MOSI; arriba (8-14) MISO, CS, GND, VDD, 1V8. La 13
// (float) va sin hilo
const PADS_SOIC = {
  andy100: [
    [0.075, 0.598, 1], [0.075, 0.374, 14],
    ...[0.209, 0.303, 0.456, 0.539, 0.706, 0.796].map((u, k) => [u, 0.883, k + 2]),
    ...[0.833, 0.750, 0.583, 0.500, 0.332].map((u, k) => [u, 0.098, k + 8]),
  ],
};
const PADS = {
  rocky100: [
    [0.111, 0.477, 'i', 0], [0.111, 0.564, 'i', 3],
    ...[0.214, 0.359, 0.503, 0.649, 0.793].map((u, k) => [u, 0.064, 'a', SIN[k]]),
    ...[0.217, 0.353, 0.493, 0.630, 0.768].map((v, k) => [0.955, v, 'd', SIN[k]]),
    ...[0.220, 0.365, 0.509, 0.652, 0.797].map((u, k) => [u, 0.936, 'b', SIN[k]]),
  ],
};

const ORO = 0xE2B95A;

function texturaMarcado(lineas, aspecto = 1024 / 460) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = Math.round(1024 / aspecto);
  const g = c.getContext('2d');
  g.fillStyle = '#1a1d20'; g.fillRect(0, 0, c.width, c.height);
  for (let n = 0; n < 9000; n += 1) {            // el grano del plástico
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  g.fillStyle = '#9aa2a8'; g.textAlign = 'center';
  const y0 = c.height / 2 - ((lineas.length - 1) * 115) / 2 + 40;     // el bloque de líneas, centrado
  lineas.forEach((l, n) => {
    g.font = `${n === 0 ? 700 : 600} ${n === 0 ? 120 : 80}px Oxanium, "Segoe UI", sans-serif`;
    g.fillText(l, c.width / 2, y0 + n * 115);
  });
  g.beginPath(); g.arc(70, c.height - 80, 24, 0, Math.PI * 2); g.fillStyle = '#2a2f33'; g.fill();   // marca del pin 1
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function montarChip(caja, op = {}) {
  let ren;
  try { ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return null; }   // sin WebGL: la foto
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ren.outputColorSpace = THREE.SRGBColorSpace;
  ren.toneMapping = THREE.ACESFilmicToneMapping;
  caja.appendChild(ren.domElement);

  const escena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  escena.add(new THREE.HemisphereLight(0xdde8ff, 0x0b0d10, 1.3));
  const sol = new THREE.DirectionalLight(0xffffff, 2.6); sol.position.set(4, 10, 7); escena.add(sol);
  const contra = new THREE.DirectionalLight(0x0080ff, 2.2); contra.position.set(-7, 3, -6); escena.add(contra);
  const calida = new THREE.PointLight(0xff8000, 18, 18); calida.position.set(5, 2, 4); escena.add(calida);

  const raiz = new THREE.Group(); escena.add(raiz);
  const chip = new THREE.Group(); raiz.add(chip);
  const matOro = new THREE.MeshStandardMaterial({ color: ORO, metalness: 1, roughness: 0.28 });
  const matPlata = new THREE.MeshStandardMaterial({ color: 0xbfc6cc, metalness: 0.72, roughness: 0.28 });   // sin entorno que reflejar: medio metal, que se vea
  const matCuerpo = new THREE.MeshStandardMaterial({ color: 0x1b1f23, roughness: 0.62, metalness: 0.1 });

  // la tapa: el plástico de arriba, con el marcado; se levanta y se desvanece (materiales transparentes para eso)
  const tapa = new THREE.Group(); chip.add(tapa);
  const matTapa = matCuerpo.clone(); matTapa.transparent = true;
  const ponTapa = (w, h, d, y, lineas) => {
    const cara = new THREE.MeshStandardMaterial({ map: texturaMarcado(lineas, w / d), roughness: 0.6, metalness: 0.1, transparent: true });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [matTapa, matTapa, cara, matTapa, matTapa, matTapa]);
    m.position.y = y + h / 2; tapa.add(m);
  };
  // un hilo de oro del pad a su sitio en el leadframe, con su lazo
  const hilo = (a, b, alto) => {
    const curva = new THREE.CatmullRomCurve3([
      a, new THREE.Vector3(a.x + (b.x - a.x) * 0.22, a.y + alto, a.z + (b.z - a.z) * 0.22), b]);
    chip.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.016, 6), matOro));
  };
  // el die: una losa con la foto encima; cuando carga la foto, sus hilos (cada encapsulado dice adónde va cada pad)
  const ponDie = (dw, alto, y, alHilo) => new THREE.TextureLoader().load(op.textura, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = ren.capabilities.getMaxAnisotropy();
    const dh = dw / (tex.image.width / tex.image.height);
    const lado = new THREE.MeshStandardMaterial({ color: 0x5d6670, metalness: 0.7, roughness: 0.35 });
    const cara = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.35, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18 });
    const die = new THREE.Mesh(new THREE.BoxGeometry(dw, alto, dh), [lado, lado, cara, lado, lado, lado]);
    die.position.y = y + alto / 2; chip.add(die);
    alHilo((u, v) => new THREE.Vector3((u - 0.5) * dw, y + alto + 0.01, (v - 0.5) * dh));
  });

  if (op.paquete === 'soic') {
    // SOIC-14: 8,65 × 3,9 mm, 14 patas de ala de gaviota. Abajo, el cuerpo con el leadframe (la isla del die y los 14
    // dedos que salen a las patas); arriba, la tapa. Las patas 1-7 dan hacia la cámara (+z), de izquierda a derecha, y
    // las 8-14 al fondo, de derecha a izquierda: la 14 frente a la 1
    const W = 6.4, D = 2.9, H = 1.1, BASE = 0.5;
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(W, BASE, D), matCuerpo);
    cuerpo.position.y = -BASE / 2; chip.add(cuerpo);
    ponTapa(W, H - BASE, D, 0, op.marca?.length ? op.marca : ['ANDY100']);
    const paso = W / 7.2;
    const xPata = (n) => (n <= 7 ? (n - 4) * paso : (11 - n) * paso), lado = (n) => (n <= 7 ? 1 : -1);
    for (let n = 1; n <= 14; n += 1) {
      const pata = new THREE.Group();
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.45), matPlata); a.position.set(0, 0, 0.22); pata.add(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.7, 0.14), matPlata); b.position.set(0, -0.3, 0.42); pata.add(b);
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.5), matPlata); c.position.set(0, -0.62, 0.64); pata.add(c);
      pata.position.set(xPata(n), -0.05, lado(n) * D / 2);
      if (lado(n) < 0) pata.rotation.y = Math.PI;
      chip.add(pata);
    }
    // el leadframe por dentro: la isla y un dedo por pata, del canto hacia el die (los de las puntas, en diagonal)
    const ISLA = [2.0, 1.5], y0 = 0.01;
    const isla = new THREE.Mesh(new THREE.BoxGeometry(ISLA[0], 0.03, ISLA[1]), matPlata);
    isla.position.y = y0; chip.add(isla);
    const punta = (n) => new THREE.Vector3(xPata(n) * 0.62, y0 + 0.03, lado(n) * (ISLA[1] / 2 + 0.28));
    for (let n = 1; n <= 14; n += 1) {
      const fuera = new THREE.Vector3(xPata(n), y0, lado(n) * (D / 2 - 0.02)), dentro = punta(n);
      const largo = fuera.distanceTo(dentro);
      const dedo = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, largo), matPlata);
      dedo.position.copy(fuera).add(dentro).multiplyScalar(0.5);
      dedo.rotation.y = Math.atan2(dentro.x - fuera.x, dentro.z - fuera.z);
      chip.add(dedo);
    }
    ponDie(1.45, 0.12, y0 + 0.015, (pad) => {
      for (const [u, v, n] of PADS_SOIC[op.pads] || []) hilo(pad(u, v), punta(n).add(new THREE.Vector3(0, 0.01, -lado(n) * 0.06)), 0.32);
    });
  } else {
    // QFN-16: el cuerpo con su pad y los dedos de oro, el die encima y los hilos; y la tapa (escala: 1 mm = 1,55)
    const W = 6.2, H = 0.8, PASO = 0.65 * 1.55, E = W / 2 - 0.55;
    chip.add(new THREE.Mesh(new THREE.BoxGeometry(W, H, W), matCuerpo));
    const pad = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.02, W - 0.5), new THREE.MeshStandardMaterial({ color: 0x2a2f34, roughness: 0.4, metalness: 0.5 }));
    pad.position.y = H / 2 + 0.01; chip.add(pad);
    ponTapa(W, 0.62, W, H / 2, op.marca?.length ? op.marca : ['ROCKY100']);
    // dónde está la pata k (0-3) de cada lado, a la distancia d del centro: [x, z, a lo largo de x]
    const sitio = (lado, k, d) => {
      const o = (k - 1.5) * PASO;
      return { i: [-d, o, 0], d: [d, o, 0], a: [o, -d, 1], b: [o, d, 1] }[lado];
    };
    for (const lado of ['i', 'a', 'd', 'b']) for (let k = 0; k < 4; k += 1) {
      const [x, z, ax] = sitio(lado, k, W / 2);                   // la pata de cobre, en el canto
      const pata = new THREE.Mesh(new THREE.BoxGeometry(ax ? 0.46 : 0.06, 0.3, ax ? 0.06 : 0.46), matPlata);
      pata.position.set(x, -H / 2 + 0.15, z); chip.add(pata);
      const [fx, fz] = sitio(lado, k, E);                          // y su dedo de oro por dentro, donde cae el hilo
      const dedo = new THREE.Mesh(new THREE.BoxGeometry(ax ? 0.34 : 0.5, 0.03, ax ? 0.5 : 0.34), matOro);
      dedo.position.set(fx, H / 2 + 0.03, fz); chip.add(dedo);
    }
    ponDie(3.6, 0.24, H / 2 + 0.02, (pad) => {
      for (const [u, v, lado, pata] of PADS[op.pads] || []) {
        if (pata === null) continue;                               // pad de más, sin hilo
        const [fx, fz] = sitio(lado, pata, E);
        hilo(pad(u, v), new THREE.Vector3(fx, H / 2 + 0.05, fz), 0.3);
      }
    });
  }

  // el campo RF: anillos que se abren desde el chip
  const anillos = [0, 1, 2].map((n) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 120),
      new THREE.MeshBasicMaterial({ color: n === 1 ? 0xff8000 : 0x2e9bff, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.y = -0.1; raiz.add(m);
    return m;
  });

  // la cámara se aleja si la caja es estrecha (móvil)
  let cerca = 0;                                                    // 0 cerrado, 1 abierto y la cámara ya acercada
  const encuadre = () => {
    const w = caja.clientWidth || 1, h = caja.clientHeight || 1;
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    const lejos = (op.paquete === 'soic' ? 18.5 : 16.5) * (1 - cerca * (op.paquete === 'soic' ? 0.3 : 0.14));
    const k = Math.max(1, 1.1 / cam.aspect);
    cam.position.set(0, 9.2 * k * (lejos / 14.5), 9.6 * k * (lejos / 14.5));
    cam.lookAt(0, -0.3, 0);
    cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(encuadre); ro.observe(caja); encuadre();

  // inclinarlo con el ratón o el dedo
  const objetivo = { x: 0, y: 0 };
  const mover = (ev) => {
    const r = caja.getBoundingClientRect();
    objetivo.y = ((ev.clientX - r.left) / r.width - 0.5) * 0.9;
    objetivo.x = ((ev.clientY - r.top) / r.height - 0.5) * 0.5;
  };
  caja.addEventListener('pointermove', mover);

  const t0 = performance.now(), ABRE = 3.4;                        // segundos cerrado (con la entrada)
  let raf = 0, giro = 0, inc = { x: 0, y: 0 };
  const cuadro = () => {
    raf = requestAnimationFrame(cuadro);
    const t = (performance.now() - t0) / 1000;
    const entrada = Math.min(1, t / 1.6), e = 1 - (1 - entrada) ** 3;
    giro += 0.0035;
    inc.x += (objetivo.x - inc.x) * 0.05; inc.y += (objetivo.y - inc.y) * 0.05;
    raiz.scale.setScalar(0.55 + 0.45 * e);
    raiz.rotation.y = -0.6 + giro + inc.y + (1 - e) * 1.5;
    raiz.rotation.x = 0.06 * Math.sin(t * 0.7) + inc.x;
    chip.position.y = (op.paquete === 'soic' ? 0.3 : 0) + 0.12 * Math.sin(t * 0.9);
    // la tapa: cerrada hasta ABRE, luego sube, se ladea y se desvanece; y la cámara se acerca al die
    const f = Math.min(1, Math.max(0, (t - ABRE) / 1.8)), fe = f * f * (3 - 2 * f);
    tapa.position.y = fe * 3.2;
    tapa.rotation.z = fe * 0.35; tapa.rotation.x = -fe * 0.2;
    const op1 = 1 - Math.min(1, Math.max(0, (f - 0.35) / 0.65));
    tapa.traverse((o) => { for (const m of [].concat(o.material || [])) { m.opacity = op1; m.depthWrite = op1 > 0.6; } });
    tapa.visible = op1 > 0.01;
    const c = Math.min(1, Math.max(0, (t - ABRE - 0.8) / 2.2)), ce = c * c * (3 - 2 * c);
    if (Math.abs(ce - cerca) > 1e-4) { cerca = ce; encuadre(); }
    anillos.forEach((a, n) => {
      const f = ((t * 0.32 + n / 3) % 1);
      a.scale.setScalar(3.4 + f * 5.5);
      a.material.opacity = entrada * 0.55 * (1 - f) * Math.min(1, f * 6);
    });
    ren.render(escena, cam);
  };
  cuadro();

  return {
    destruir() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      caja.removeEventListener('pointermove', mover);
      escena.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        for (const m of [].concat(o.material || [])) { if (m.map) m.map.dispose(); m.dispose(); }
      });
      ren.forceContextLoss();
      ren.dispose();
      ren.domElement.remove();
    },
  };
}
