// WISEN legacy: de WISEN a Kliskatek, pasando por Farsens. Presentación animada en bucle, en cuatro idiomas. Se pasa sola; a mano con las
// flechas, el teclado, deslizando o tocando los lados. ?diapo=3&idioma=eu deja una diapositiva quieta (para revisar).
// Los chips van en 3D (chip3d.js, three.js); sin WebGL, la foto del die.

import { IDIOMAS, UI, DIAPOS, EJE, MARCAS, KLISKA, ETAPAS } from './textos.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const P = new URLSearchParams(location.search);
const S = { idioma: 'en', i: 0, auto: true, timer: null, escena: null };
const escenario = $('#escenario');

// ------------------------------------------------------------------------------------------- piezas comunes
const AVATAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="25" r="11.5"/><path d="M9 66c0-14 10.5-23 23-23s23 9 23 23z"/></svg>';
const TONOS = ['#0080FF', '#3A8DDE', '#2C6FD6', '#4B7BE5', '#1C9AD6', '#5A6FE0', '#2F86C9', '#3E64C8'];
// los de Kliskatek, resaltados en naranja desde que entran en escena
const deKliska = (n) => KLISKA.findIndex((k) => k.nombres.includes(n));
const gente = (d) => [...(d.personas || []), ...(d.enUni || []), ...(d.quedan || []), ...(d.izq || []), ...(d.der || []), ...(d.centro || []), ...(d.disenio || [])];
const ENTRADA = KLISKA.map((_, k) => DIAPOS.findIndex((d) => gente(d).some((p) => deKliska(p) === k)));
// Alex se fue a Roma tras el doctorado y se hizo cura: de negro y con alzacuello, sin decirlo
const AVATAR_CURA = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="25" r="11.5"/>'
  + '<path d="M9 66c0-14 10.5-23 23-23s23 9 23 23z" fill="#0d0e10"/><rect x="28.6" y="43.2" width="6.8" height="4.6" rx="1" fill="#fff"/></svg>';
const esCura = (n) => n === 'Alex';
// con foto: el equipo de hoy (img/equipo/nombre-apellido.jpg, las del quiosco)
const fotoDe = (nombre) => `img/equipo/${nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ /g, '-')}.jpg`;
// sin apellidos salvo en el equipo de hoy (el de las fotos): el nombre completo solo sirve para reconocer a los de Kliskatek
function persona(nombre, n, extra = '', foto = false, etiqueta = foto ? nombre : nombre.split(' ')[0]) {
  const k = deKliska(nombre) >= 0 ? ' kliska' : '', cura = esCura(nombre);
  const c = k ? '#FF8000' : cura ? '#5B636B' : TONOS[n % TONOS.length];
  return `<div class="persona${k}" style="--n:${n}"><div class="avatar${k}${cura ? ' cura' : ''}${foto ? ' foto' : ''}" style="--c:${c}">${foto ? `<img src="${fotoDe(nombre)}" alt="">` : cura ? AVATAR_CURA : AVATAR}</div>
    <span>${esc(etiqueta)}</span>${extra}</div>`;
}
// un circuito integrado genérico (QFN visto desde arriba), como en el quiosco
const CHIP_SVG = `<svg class="ic" viewBox="0 0 100 100" aria-hidden="true">
  ${[22, 36, 50, 64, 78].map((p) => `<rect x="${p - 3}" y="6" width="6" height="12" rx="1" fill="#9AA4AD"/><rect x="${p - 3}" y="82" width="6" height="12" rx="1" fill="#9AA4AD"/>
  <rect x="6" y="${p - 3}" width="12" height="6" rx="1" fill="#9AA4AD"/><rect x="82" y="${p - 3}" width="12" height="6" rx="1" fill="#9AA4AD"/>`).join('')}
  <rect x="16" y="16" width="68" height="68" rx="7" fill="#23282D" stroke="#4A535B" stroke-width="2"/><circle cx="29" cy="29" r="4" fill="#4A535B"/></svg>`;
const ICONO = {
  hw: '<svg viewBox="0 0 48 48" fill="none" stroke="#C9D2DA" stroke-width="2.6" stroke-linecap="round"><rect x="9" y="9" width="30" height="30" rx="4"/><rect x="18" y="18" width="12" height="12" rx="2"/><path d="M15 9V4M24 9V4M33 9V4M15 44v-5M24 44v-5M33 44v-5M9 15H4M9 24H4M9 33H4M44 15h-5M44 24h-5M44 33h-5"/></svg>',
  fw: '<svg viewBox="0 0 48 48" fill="none" stroke="#C9D2DA" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 14 6 24l10 10M32 14l10 10-10 10M27 9l-6 30"/></svg>',
  sw: '<svg viewBox="0 0 48 48" fill="none" stroke="#C9D2DA" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="38" height="26" rx="3"/><path d="M17 41h14M24 34v7M12 27l7-7 5 4 9-9"/></svg>',
  uni: '<svg viewBox="0 0 48 48"><path d="M3 18 24 9l21 9-21 9z"/><path d="M12 22.5V32c0 3 5.4 6 12 6s12-3 12-6v-9.5"/><path d="M45 18v11"/></svg>',
};
// los logos de Tecnun de cada época: el de 2004 en los PFC; en los puentes, el granate (sello y texto, en blanco) con Farsens
// y el sello de hoy, solo, con la cátedra. El sello cae donde estaba el disco: su centro es el de la universidad en el arco
const TECNUN = {
  2004: { logo: 'img/logo/tecnun-2004.png' },
  2013: { logo: 'img/logo/tecnun-2013-blanco.png' },
  actual: { logo: 'img/logo/unav-sello.svg' },
};
const nodoUni = (d, t, extra = '') => (TECNUN[d.tecnun]
  ? `<div class="nodo uni tecnun t${d.tecnun}"><img class="logo-uni" src="${TECNUN[d.tecnun].logo}" alt="Tecnun · ${esc(t.uni)}">${extra}</div>`
  : `<div class="nodo uni"><div class="disco">${ICONO.uni.replace('<svg', '<svg fill="none"')}</div><b>${esc(t.uni)}</b>${extra}</div>`);
// si no está el logo (img/logo/...), su nombre en texto
const logo = (src, clase = 'logo-empresa') =>
  `<img class="${clase}" src="${src}" alt="Farsens" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'logo-texto',textContent:'FARSENS'}))">`;
// una fila de avatares pequeños con su papel (quién tuvo la idea, quién diseñó cada chip)
const filaPersonas = (d, t) => (d.disenio ? `<div class="disenio">${d.disenio.map((p, n) => persona(p, n + 2, `<small>${esc(t.disenio[n])}</small>`)).join('')}</div>` : '');
const cargo = (t, p) => (t.cargos && t.cargos[p] ? `<small class="cargo">${esc(t.cargos[p])}</small>` : '');
// "Ibon: …" → el nombre en negrita
const conNombre = (s) => esc(s).replace(/^([^:：]+[:：])/, '<b>$1</b>');

// el borde de una pieza de puzle, de p0 a p1, con lengüeta hacia fuera (s = 1), hacia dentro (-1) o recto (0)
function borde(p0, p1, s) {
  if (!s) return `L${p1[0]} ${p1[1]}`;
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const pt = (u, v) => `${(p0[0] + dx * u + dy * v * s).toFixed(1)} ${(p0[1] + dy * u - dx * v * s).toFixed(1)}`;
  return `L${pt(0.36, 0)} C${pt(0.40, 0)} ${pt(0.28, 0.24)} ${pt(0.5, 0.24)} C${pt(0.72, 0.24)} ${pt(0.60, 0)} ${pt(0.64, 0)} L${pt(1, 0)}`;
}
function piezaPuzle(f, c) {
  const H = (r, k) => ((r + k) % 2 ? 1 : -1), V = (r, k) => ((r * 2 + k) % 3 ? 1 : -1);
  const arriba = f === 0 ? 0 : -H(f - 1, c), der = c === 2 ? 0 : V(f, c), abajo = f === 2 ? 0 : H(f, c), izq = c === 0 ? 0 : -V(f, c - 1);
  return `M0 0 ${borde([0, 0], [100, 0], arriba)} ${borde([100, 0], [100, 100], der)} ${borde([100, 100], [0, 100], abajo)} ${borde([0, 100], [0, 0], izq)} Z`;
}

// ------------------------------------------------------------------------------------------- cada tipo de diapositiva
const DIBUJAR = {
  portada: (d, t) => `
    <div class="diapo dos portada">
      <div class="lado-txt">
        <div class="kicker entra d2">${esc(t.kicker)}</div>
        <h1 class="grande entra d2">${esc(t.titulo)}</h1>
        <div class="sub entra d3">${esc(t.sub)}</div>
      </div>
      <div class="lado-img entra d2"><div class="logos3d"></div></div>
    </div>`,

  idea: (d, t) => `
    <div class="diapo dos">
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
        ${filaPersonas(d, t)}
      </div>
      <div class="lado-img entra d2">
        <iframe class="modelo3d" src="modelo3d.html?modelo=sinpilas&medida=temp&idioma=${S.idioma}" tabindex="-1"></iframe>
      </div>
    </div>`,

  pfc: (d, t) => `
    <div class="diapo dos">
      <div class="lado-txt">
        ${d.tecnun ? `<img class="logo-tecnun entra" src="${TECNUN[d.tecnun].logo}" alt="Tecnun" onerror="this.remove()">` : ''}
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
      </div>
      <div class="lado-img"><div class="puzle">${d.personas.map((p, n) => {
        const f = Math.floor(n / 3), c = n % 3, a = n * 2.4 + 0.6;
        return `<div class="pieza" style="--n:${n};--c:${deKliska(p) >= 0 ? '#FF8000' : TONOS[n % TONOS.length]};left:${c * 33.333}%;top:${f * 33.333}%;
          --dx:${(Math.cos(a) * 48).toFixed(1)}cqh;--dy:${(Math.sin(a) * 40).toFixed(1)}cqh;--rot:${(n * 37) % 70 - 35}deg">
          <svg viewBox="-25 -25 150 150" aria-hidden="true"><path d="${piezaPuzle(f, c)}"/></svg>${persona(p, n)}</div>`;
      }).join('')}<div class="sello">✓ ${esc(t.si)}</div></div></div>
    </div>`,

  wisen: (d, t) => `
    <div class="diapo dos wisen">
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
        <div class="fila-personas">${d.personas.map((p, n) => persona(p, n, cargo(t, p))).join('')}</div>
      </div>
      <div class="lado-img">
        <div class="marca"><img src="img/logo/wisen-blanco.png" alt="WISEN · Wireless Sensors Research Group"
          onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'WISEN'}))"></div>
        <div class="aleman entra d4">${esc(t.aleman)}</div>
      </div>
    </div>`,

  demostrador: (d, t) => `
    <div class="diapo dos">
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
        <img class="foto-proto entra d4" src="img/fotos/fpga-demo.jpg" alt="" onerror="this.remove()">
      </div>
      <div class="lado-img entra">
        <iframe class="modelo3d" src="modelo3d.html?modelo=demostrador&idioma=${S.idioma}" tabindex="-1"></iframe>
      </div>
    </div>`,

  farsens: (d, t) => `
    <div class="diapo dos${d.quedan ? ' goteo' : ''}">
      <div class="lado-txt">
        ${logo(d.logo)}
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
      </div>
      <div class="lado-img entra d2"><div class="puente${d.tecnun ? ` t${d.tecnun}` : ''}">
        ${d.quedan ? arbol(d.quedan, d.enUni, d.tecnun) : ARCO}
        ${nodoUni(d, t)}
        <div class="nodo empresa"><div class="disco">${logo(d.logo, '')}</div></div>
        ${d.quedan ? hojasArbol(d, t) : ''}
        ${d.enUni ? hojasUni(d, t) : ''}
        <div class="mas">${esc(t.mas)}</div>
      </div></div>
    </div>`,

  // Kliskatek y la universidad: la cátedra y los proyectos fin de grado, como en Farsens
  catedra: (d, t) => `
    <div class="diapo dos catedra goteo">
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
      </div>
      <div class="lado-img entra d2"><div class="puente">
        ${arbol(d.quedan, [], d.tecnun)}
        ${nodoUni(d, t, `<span class="sello-catedra">${esc(t.catedra)}</span>`)}
        <div class="nodo empresa"><div class="disco"><img src="img/logo/kliskatek-white.svg" alt="Kliskatek"></div></div>
        ${hojasArbol(d, t)}
      </div></div>
    </div>`,

  // un equipo de Farsens: dos grupos que confluyen en la empresa (2008: universidad y fuera; ROCKY100: Farsens y universidad)
  grupos: (d, t) => {
    // columnas de cada grupo según cuántos son; el centro, más ancho si lleva su propio grupo (la universidad)
    const cols = (n) => (n <= 2 ? n : n <= 4 ? 2 : n <= 9 ? 3 : Math.ceil(n / 3));
    const grupo = (clase, tit, gente, n0) => `<div class="grupo ${clase}"><div class="grupo-tit">${esc(tit)}</div>
      <div class="rejilla-p" style="grid-template-columns:repeat(${cols(gente.length)}, 1fr)">${gente.map((p, n) => persona(p, n0 + n, cargo(t, p))).join('')}</div></div>`;
    return `
    <div class="diapo grupos">
      <div class="kicker entra">${esc(t.kicker)}</div>
      <h1 class="entra">${esc(t.titulo)}</h1>
      <div class="texto entra d2">${esc(t.texto)}</div>
      <div class="confluencia" style="grid-template-columns:${cols(d.izq.length)}fr ${d.centro ? 2.2 : 1.5}fr ${cols(d.der.length)}fr">
        ${grupo('uni', t.izq, d.izq, 0)}
        <div class="union"><div class="nudo"><svg viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
            <path class="via" d="M0 100 H 140"/><path class="via" d="M400 100 H 260"/>
            ${[0, 1, 2].map((n) => `<circle class="gota" r="5"><animateMotion dur="1.8s" begin="${n * 0.6}s" repeatCount="indefinite" path="M0 100 H 140"/></circle>
            <circle class="gota n" r="5"><animateMotion dur="1.8s" begin="${n * 0.6 + 0.3}s" repeatCount="indefinite" path="M400 100 H 260"/></circle>`).join('')}</svg>
          <div class="sede">${logo(d.logo, '')}</div></div>
          ${d.centro ? grupo('centro', t.centro, d.centro, d.izq.length + d.der.length) : ''}</div>
        ${grupo('fuera', t.der, d.der, d.izq.length)}
      </div>
    </div>`;
  },

  chip: (d, t) => `
    <div class="diapo dos chip">
      <div class="lado-img entra"><div class="chip3d" data-textura="${d.textura}" data-pads="${d.chip}"
          data-paquete="${d.paquete || 'qfn'}" data-marca="${(d.marca || []).join('|')}"></div>
        ${d.foto ? `<img class="foto-tag" src="${d.foto}" alt="" onerror="this.remove()">` : ''}</div>
      <div class="lado-txt">
        <div class="cab-chip entra">${logo(d.logo)}${d.icono ? `<img class="icono-caso" src="${d.icono}" alt="">` : ''}</div>
        <div class="kicker entra d2">${esc(t.kicker)}</div>
        <h1 class="entra d2">${esc(t.titulo)}</h1>
        ${t.nombre ? `<div class="homenaje entra d3">${esc(t.nombre)}</div>` : ''}
        <div class="texto entra d3">${esc(t.texto)}</div>
        ${d.premio ? `<div class="premio entra d4"><svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 6l7 14 15 2-11 10 3 15-14-7-14 7 3-15L10 22l15-2z" fill="#FFC446" stroke="#FFE3A0" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M14 46c-6-6-8-14-6-22M50 46c6-6 8-14 6-22M20 54c4 2 8 3 12 3s8-1 12-3" fill="none" stroke="#C9A24B" stroke-width="2.4" stroke-linecap="round"/></svg>
          <div><b>${esc(t.premio)}</b><span>${esc(t.premioSub)}</span></div></div>` : ''}
        ${filaPersonas(d, t)}
        ${t.pie ? `<div class="pie-txt entra d5">${conNombre(t.pie)}</div>` : ''}
      </div>
    </div>`,

  leccion: (d, t) => `
    <div class="diapo dos">
      <div class="lado-img entra"><div class="orbita leccion"><div class="anillo"></div>
        ${[0, 240].map((a) => `<i class="radio" style="--a:${a}deg"></i>`).join('')}
        ${[0, 1, 2, 3].map((n) => `<i class="paquete" style="--n:${n}"></i>`).join('')}
        <div class="centro">${CHIP_SVG}</div>
        ${['hw', 'fw', 'sw'].map((k, n) => `<div class="sat" style="--n:${n};--a:${n * 120}deg">${ICONO[k]}<b>${esc(t.items[n])}</b></div>`).join('')}
        <div class="dato-centro"><div class="valores">${t.datos.map((v, n) => `<span style="--n:${n}">${esc(v)}</span>`).join('')}</div>
          <small>${esc(t.dato)}</small></div>
      </div></div>
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
        <div class="leccion-frase entra" style="animation-delay:5.8s">${esc(t.leccion)}</div>
      </div>
    </div>`,

  kliskatek: (d, t) => `
    <div class="diapo dos kliskatek">
      <div class="lado-txt">
        <div class="kicker entra">${esc(t.kicker)}</div>
        <h1 class="entra">${esc(t.titulo)}</h1>
        <div class="texto entra d2">${esc(t.texto)}</div>
      </div>
      <div class="lado-img"><div class="sistema">
        <div class="pila-3d"><div class="pila">${d.iconos.map((ic, n) => `<div class="placa" style="--n:${n}">${ic ? `<img src="${ic}" alt="">` : CHIP_SVG}</div>`).join('')}</div></div>
        <ul class="capas">${t.capas.map(([nom, det], n) => `<li style="--n:${n}"><b>${esc(nom)}</b><span>${esc(det)}</span></li>`).join('')}</ul>
      </div></div>
    </div>`,

  // los productos propios: una tarjeta por familia, con su placa y sus radios
  sense: (d, t) => `
    <div class="diapo sense">
      <div class="kicker entra">${esc(t.kicker)}</div>
      <h1 class="entra">${esc(t.titulo)}</h1>
      <div class="texto entra d2">${esc(t.texto)}</div>
      <div class="familias">${d.familias.map((f, n) => `
        <div class="familia" style="--n:${n}">
          <div class="foto-fam${f.cuadrada ? ' cuadrada' : ''}"><img src="${f.img}" alt=""></div>
          <div class="cab-fam"><b>${f.nombre}</b><span class="radios">${f.radios.map((r) => `<img src="img/iconos/${r}.svg" alt="${r}">`).join('')}</span></div>
          <span class="desc">${esc(t.familias[n])}</span>
        </div>`).join('')}</div>
    </div>`,

  // la pirámide de ISA-95 de abajo arriba: cada nivel con su número a la izquierda; entre el 0 y el 1, el bus de campo, y
  // entre el 1 y el 2, el de control, cada uno con sus protocolos; del 2 al MES y al ERP, sin bus
  industria: (d, t) => {
    const caja = (ic, nombre, clase = '') => `<div class="caja-ind${clase}">${IND[ic]}<b>${esc(nombre)}</b></div>`;
    const bus = (k, protos, w) => `<div class="fila-ind" style="--w:${w}%;--d:${0.75 + k * 0.5}s"><span></span>
      <div class="cont-ind bus-ind b${k}"><span class="bus-nombre">${esc(t.buses[k])}</span>
      ${protos.map((b, n) => `<span class="proto" style="--n:${n};--k:${protos.length}">${esc(b)}</span>`).join('')}</div></div>`;
    const fila = (i, w, cont, extra = '') => `<div class="fila-ind n${i}" style="--w:${w}%;--d:${0.5 + i * 0.5}s">
      <div class="etq-ind"><b>${i}</b><span>${esc(t.niveles[i])}</span>${extra}</div><div class="cont-ind">${cont}</div></div>`;
    const campo = ['sensores', 'actuadores'].map((g) => `<div class="rama ${g}">${d[g].map((ic, n) => `
      <div class="disp" style="--n:${n}"><i class="dato"></i><div class="icono-ind">${IND[ic]}</div><span>${esc(t[g][n])}</span></div>`).join('')}</div>`).join('');
    return `
    <div class="diapo industria">
      <div class="kicker entra">${esc(t.kicker)}</div>
      <h1 class="entra">${esc(t.titulo)}</h1>
      <div class="texto entra d2">${esc(t.texto)}</div>
      <div class="isa">
        <svg class="silueta" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,100 100,100 65,0 35,0"/></svg>
        ${fila(4, 26, `<div class="caja-ind integra">${IND.erp}<b>ERP<small>${esc(t.integra)}</small></b></div>`)}
        ${fila(3, 34, caja('mes', 'MES'))}
        ${fila(2, 50, d.supervision.map((ic, n) => caja(ic, t.supervision[n])).join(''))}
        ${bus(1, d.busControl, 60)}
        ${fila(1, 62, d.control.map((ic, n) => caja(ic, t.control[n])).join(''))}
        ${bus(0, d.busCampo, 96)}
        ${fila(0, 100, campo, `<small class="ley-campo"><i>${esc(t.campo[0])}</i><i>${esc(t.campo[1])}</i></small>`)}
      </div>
    </div>`;
  },

  equipo: (d, t) => `
    <div class="diapo equipo">
      <div class="kicker entra">${esc(t.kicker)}</div>
      <h1 class="entra">${esc(t.titulo)}</h1>
      <div class="texto entra d2">${esc(t.texto)}</div>
      <div class="personas">${d.personas.map((p, n) => {
        const k = d.veteranos.indexOf(p);
        return persona(p, n, `<small class="chip-desde">${k < 0 ? '·' : esc(t.desde[k])}</small>`, true)
          .replace('class="persona', `class="persona${k < 0 ? '' : ' veterano'}`);
      }).join('')}</div>
    </div>`,

  cierre: (d, t) => `
    <div class="diapo cierre">
      <img class="logo-grande entra" src="img/logo/kliskatek-white.svg" alt="Kliskatek">
      <div class="kicker entra d2">${esc(t.kicker)}</div>
      <h1 class="entra d2">${esc(t.titulo)}</h1>
      <div class="texto entra d3">${esc(t.texto)}</div>
      <div class="hitos">${d.hitos.map(([anio, rotulo], n) => `<div class="hito${n === d.hitos.length - 1 ? ' ultimo' : ''}"
        style="--n:${n};left:${pos(anio)}%"><i></i><b>${esc(t.hitos[n])}</b><small>${rotulo}</small></div>`).join('')}</div>
    </div>`,
};

// de la universidad a la empresa: los estudiantes viajan por el arco (Farsens y Kliskatek)
const CAMINO = 'M202 128 C 380 108, 560 160, 640 300';   // del borde del disco de la universidad a la empresa
const ARCO = `<svg class="arco" viewBox="0 0 880 780" preserveAspectRatio="none" aria-hidden="true">
  <path class="camino" d="${CAMINO}"/>
  ${Array.from({ length: 7 }, (_, n) => `<circle class="alumno" r="7" opacity="0">
    <animateMotion dur="3.5s" begin="${(1 + n * 0.5).toFixed(1)}s" repeatCount="indefinite" path="${CAMINO}"/>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="3.5s" begin="${(1 + n * 0.5).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('')}
</svg>`;

// el goteo de Farsens: los que hicieron allí su PFC viajan por el arco, uno cada PASO s; los que se quedan llegan en
// naranja y se enganchan al árbol de la empresa (una rama crece del logo hasta su hoja). Coordenadas del viewBox 880 × 780.
const CENTRO_FARSENS = [590, 300];
// las hojas, repartidas por debajo de la empresa, de izquierda (172°) a derecha (42°)
const hojas = (n) => Array.from({ length: n }, (_, k) => (n === 1 ? 100 : 172 - (130 * k) / (n - 1)))
  .map((a) => [590 + 250 * Math.cos(a * Math.PI / 180), 300 + 250 * Math.sin(a * Math.PI / 180)]);
// las hojas del árbol, vacías hasta que su nombre llega (con su nota debajo, si la tiene: Eñaut, hoy en Kliskatek)
const hojasArbol = (d, t) => d.quedan.map((p, k) => {
  const [x, y] = hojas(d.quedan.length)[k];
  const nota = t.notas && t.notas[p] ? `<small class="cargo">${esc(t.notas[p])}</small>` : '';
  return `<div class="hoja" data-k="${k}" style="left:${(100 * x / 880).toFixed(2)}%;top:${(100 * y / 780).toFixed(2)}%">${persona(p, k, nota)}</div>`;
}).join('');
// los que cuelgan de la universidad (Andoni, en Tecnun): bajo su nodo, a la izquierda del arco
const DISCO_UNI = [104, 117, 96];                                 // el disco de la universidad: centro y radio (con margen)
const SALIDA_UNI = [22, 150];                                     // el borde izquierdo del disco: la rama baja por fuera del rótulo
// con el logo granate (sello y texto a su derecha) el arco sale después del texto y la rama de Andoni, de debajo del sello
const GEOM_UNI = {
  2013: { camino: 'M355 112 C 450 100, 580 160, 640 300', disco: [104, 117, 0], salida: [104, 194] },
};
const geomUni = (era) => ({ camino: CAMINO, disco: DISCO_UNI, salida: SALIDA_UNI, ...(GEOM_UNI[era] || {}) });
const HOJAS_UNI = [[150, 480]];
const hojasUni = (d, t) => d.enUni.map((p, k) => {
  const [x, y] = HOJAS_UNI[k];
  const nota = t.notas && t.notas[p] ? `<small class="cargo">${esc(t.notas[p])}</small>` : '';
  return `<div class="hoja" data-k="u${k}" style="left:${(100 * x / 880).toFixed(2)}%;top:${(100 * y / 780).toFixed(2)}%">${persona(p, k + 6, nota)}</div>`;
}).join('');
const arbol = (quedan, enUni = [], era) => `<svg class="arco" viewBox="0 0 880 780" preserveAspectRatio="none" aria-hidden="true">
  <path class="camino" d="${geomUni(era).camino}"/>
  ${enUni.map((_, k) => { const [x, y] = HOJAS_UNI[k], [cx, cy] = geomUni(era).salida;
    return `<path class="rama uni" data-k="u${k}" pathLength="1" d="M${cx} ${cy} Q ${cx - 52} ${y - 120}, ${x} ${y}"/>`; }).join('')}
  ${quedan.map((_, k) => { const [x, y] = hojas(quedan.length)[k], [cx, cy] = CENTRO_FARSENS;
    return `<path class="rama" data-k="${k}" pathLength="1" d="M${cx} ${cy} Q ${(cx + x) / 2} ${cy + 40}, ${x.toFixed(0)} ${y.toFixed(0)}"/>`; }).join('')}
  <g class="viajeros"></g>
</svg>`;

function animarGoteo(el, d) {
  setTimeout(() => {                                             // los de la universidad, ya están
    if (!el.isConnected) return;
    el.querySelectorAll('[data-k^="u"]').forEach((x) => x.classList.add('puesta'));
    (d.enUni || []).forEach(llegaAEscena);
  }, 1200);
  const svg = el.querySelector('svg.arco'), camino = svg.querySelector('.camino'), capa = svg.querySelector('.viajeros');
  const L = camino.getTotalLength(), PASO = 1.0, VIAJE = 3.4, NS = 'http://www.w3.org/2000/svg', DISCO = geomUni(d.tecnun).disco;
  const viajes = d.pfc.map((nom, n) => ({ nom, n, queda: d.quedan.indexOf(nom), g: null, fin: false }));
  const total = 0.8 + d.pfc.length * PASO + VIAJE;
  let t0 = performance.now();
  const cuadro = (ahora) => {
    if (!el.isConnected) return;
    let t = (ahora - t0) / 1000;
    if (t > total + 1) {                                          // otra vuelta, ya solo con los que pasan
      t0 = ahora; t = 0;
      viajes.forEach((v) => { if (v.queda < 0) v.fin = false; });
    }
    for (const v of viajes) {
      const u = (t - 0.8 - v.n * PASO) / VIAJE;
      if (v.fin || u < 0) continue;
      if (!v.g) {
        v.g = document.createElementNS(NS, 'g');
        v.g.setAttribute('class', v.queda < 0 ? 'viajero' : 'viajero queda');
        v.g.setAttribute('opacity', '0');                          // nace invisible y ya en el arco: que no asome en ningún sitio
        const p0 = camino.getPointAtLength(0);
        v.g.setAttribute('transform', `translate(${p0.x.toFixed(1)} ${p0.y.toFixed(1)})`);
        v.g.innerHTML = `<circle class="alumno" r="7"/><text class="nombre-pfc" x="12" y="-12">${esc(v.nom.split(' ')[0])}</text>`;
        capa.appendChild(v.g);
        if (v.queda >= 0) llegaAEscena(v.nom);                     // si es de Kliskatek, su sitio de arriba se llena ya
      }
      if (u >= 1) {
        if (v.queda >= 0) el.querySelectorAll(`[data-k="${v.queda}"]`).forEach((x) => x.classList.add('puesta'));
        v.g.remove(); v.g = null; v.fin = true;
        continue;
      }
      const e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      const p = camino.getPointAtLength(L * e);
      v.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      const fuera = Math.min(1, Math.max(0, (Math.hypot(p.x - DISCO[0], p.y - DISCO[1]) - DISCO[2]) / 30));   // no asoma sobre el disco
      v.g.setAttribute('opacity', Math.min(fuera, v.queda < 0 ? (1 - u) * 6 : 1).toFixed(2));
    }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

// la integración industrial, nivel a nivel de la pirámide (iconos de trazo, viewBox 48, en currentColor)
const trazo = (d) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IND = {
  plc: trazo(`<rect x="5" y="9" width="38" height="30" rx="3"/><path d="M17 9v30M29 9v30"/>${[11, 23, 35].map((x, n) =>
    `<circle class="led l${n + 1}" cx="${x}" cy="15" r="1.8" fill="currentColor" stroke="none"/><path d="M${x - 2} 22h4M${x - 2} 27h4M${x - 2} 32h4" stroke-width="2"/>`).join('')}`),
  edge: trazo('<rect x="5" y="22" width="38" height="18" rx="3"/><path d="M11 31h3M17 31h3M23 31h3"/><circle class="led l1" cx="36" cy="31" r="1.8" fill="currentColor" stroke="none"/><path d="M24 22v-6"/><path class="ondas" d="M18 11a8 8 0 0 1 12 0M14 7a14 14 0 0 1 20 0"/>'),
  movimiento: trazo('<rect x="5" y="9" width="38" height="30" rx="3"/><path d="M16 30a9 9 0 1 1 16 0"/><path d="M32 30l1-6-6 2"/><circle class="led l2" cx="11" cy="15" r="1.8" fill="currentColor" stroke="none"/><path d="M10 34h8"/>'),
  scada: trazo('<rect x="4" y="7" width="40" height="28" rx="3"/><path class="traza-scada" d="M9 28l7-8 6 4 7-10 6 6 5-4"/><path d="M18 42h12M24 35v7"/>'),
  mes: trazo('<rect x="9" y="7" width="30" height="36" rx="3"/><path d="M18 7V4h12v3M15 18l3 3 5-6M27 18h7M15 29l3 3 5-6M27 29h7"/>'),
  erp: trazo('<path d="M6 42V18l18-11 18 11v24z"/><path d="M14 42V30h8v12M28 26h6M28 33h6"/>'),
  hmi: trazo('<rect x="4" y="7" width="40" height="28" rx="3"/><rect x="9" y="12" width="14" height="10" rx="1.5"/><path d="M28 13h11M28 18h11M28 23h7M9 28h30M18 35l-2 7M30 35l2 7M13 42h22"/>'),
  posicion: trazo('<rect x="4" y="27" width="40" height="11" rx="2"/><path d="M10 27v4M16 27v6M22 27v4M28 27v6M34 27v4M40 27v6"/><path class="cursor-pos" d="M24 21l-5-8h10z" fill="currentColor"/>'),
  velocidad: trazo('<path d="M7 36a17 17 0 1 1 34 0"/><path d="M12 22l3 2M24 13v4M36 22l-3 2"/><path class="aguja" d="M24 36l8-11"/><circle cx="24" cy="36" r="2.6" fill="currentColor"/>'),
  presencia: trazo('<rect x="4" y="18" width="13" height="12" rx="2"/><path d="M17 21h3v6h-3"/><path class="ondas" d="M25 17a9 9 0 0 1 0 14M31 12a16 16 0 0 1 0 24"/><rect x="38" y="16" width="6" height="16" rx="1.5"/>'),
  temperatura: trazo('<path d="M19 9a5 5 0 0 1 10 0v19a9 9 0 1 1-10 0z"/><path class="mercurio" d="M24 35V17"/><circle cx="24" cy="35" r="3.5" fill="currentColor"/>'),
  rfid: trazo('<rect x="4" y="13" width="24" height="22" rx="3"/><circle cx="12" cy="22" r="3.5"/><path d="M9 30h14M20 20h4M20 24h4"/><path class="ondas" d="M33 17a10 10 0 0 1 0 14M38 12a17 17 0 0 1 0 24"/>'),
  bomba: trazo('<circle cx="22" cy="25" r="11"/><path d="M22 14V7h14v6M4 25h7M14 40l-4 4h24l-4-4"/><g class="rodete"><path d="M22 25l-6-4M22 25l7-1M22 25l-1 7"/></g>'),
  motor: trazo('<rect x="4" y="13" width="28" height="22" rx="4"/><path d="M10 13v22M16 13v22M22 13v22M32 21h4v6h-4M36 24h8M9 35v5M27 35v5"/>'),
  interruptor: trazo('<rect x="5" y="15" width="38" height="18" rx="9"/><circle class="palanca" cx="33" cy="24" r="5.5" fill="currentColor"/>'),
};

const pos = (anio) => (100 * (anio - EJE[0])) / (EJE[1] - EJE[0]);

// ------------------------------------------------------------------------------------------- la línea del tiempo
function pintarEje() {
  const anios = [];
  for (let a = EJE[0]; a <= EJE[1]; a += 1) anios.push(a);
  // las etapas, sin huecos: WISEN, Farsens, un verde algo distinto de 2021 a 2023 y Kliskatek
  const ETAPAS = [[2005, 2008.8, '#5A78FF'], [2008.8, 2021.2, '#8CC63F'], [2021.2, 2023.2, '#4FB58A'], [2023.2, 2026, '#0080FF']];
  $('#marcas').innerHTML = anios.map((a) => `<i style="left:${pos(a)}%"></i>`).join('')
    + MARCAS.map((a) => `<span style="left:${pos(a)}%">${a}</span>`).join('')
    + ETAPAS.map(([a, b, c]) => `<b class="etapa" style="left:${pos(a)}%;width:${pos(b) - pos(a)}%;background:${c}"></b>`).join('');
}
function moverCursor(d, t) {
  const p = pos(d.anio), cur = $('#cursor');
  cur.style.left = `${p}%`;
  cur.style.setProperty('--alinear', p < 12 ? '-8%' : p > 88 ? '-92%' : '-50%');
  $('#recorrido').style.width = `${p}%`;
  $('#cursor-anio').textContent = d.cuando;
  $('#cursor-rol').textContent = d.etapa || ETAPAS[d.era];
  cur.classList.remove('cambia'); void cur.offsetWidth; cur.classList.add('cambia');
}

// la barra de arriba: los de Kliskatek que ya han entrado en la historia (los nuevos, con un destello)
// Los que entran a mitad de diapositiva (por el arco o colgando de la universidad) esperan con el sitio vacío hasta que
// sale su nombre: llegaAEscena()
function pintarEscena() {
  const d = DIAPOS[S.i];
  const tarde = new Set([...(d.quedan || []), ...(d.enUni || [])].map(deKliska).filter((k) => k >= 0));
  const orden = KLISKA.map((k, n) => n).sort((a, b) => ENTRADA[a] - ENTRADA[b] || a - b);
  // desde el equipo de hoy, cada uno con su foto pequeña (en esa diapositiva, a la vez que salen las grandes)
  const conFoto = S.i >= DIAPOS.findIndex((x) => x.tipo === 'equipo');
  $('#escena .escena-sitios').innerHTML = orden.map((k, i) => {
    const espera = ENTRADA[k] === S.i && tarde.has(k);
    const dentro = ENTRADA[k] >= 0 && ENTRADA[k] <= S.i && !espera;
    const foto = dentro && conFoto ? `<img class="foto-mini${d.tipo === 'equipo' ? ' llega' : ''}" style="--k:${i}" src="${fotoDe(KLISKA[k].nombres.at(-1))}" alt="" onerror="this.remove()">` : '';
    return `<div class="sitio${dentro ? ' dentro' : ''}${ENTRADA[k] === S.i && !espera ? ' nuevo' : ''}${espera ? ' espera' : ''}" data-kl="${k}">
      <div class="mini">${dentro ? AVATAR + foto : ''}</div><span>${dentro ? esc(KLISKA[k].corto) : ''}</span></div>`;
  }).join('');
}
function llegaAEscena(nombre) {
  const k = deKliska(nombre), el = k >= 0 && $(`#escena .sitio.espera[data-kl="${k}"]`);
  if (!el) return;
  el.className = 'sitio dentro nuevo tarde';
  el.querySelector('.mini').innerHTML = AVATAR;
  el.querySelector('span').textContent = KLISKA[k].corto;
}

// ------------------------------------------------------------------------------------------- 3D
let modulo3d = null, moduloLogos = null;
const cargar3d = () => (modulo3d ||= import('./chip3d.js').catch((e) => { console.warn('sin 3D:', e); return null; }));
const cargarLogos = () => (moduloLogos ||= import('./logos3d.js').catch((e) => { console.warn('sin 3D:', e); return null; }));
// la portada: de WISEN a Kliskatek, en partículas
const LOGOS = ['img/logo/wisen-blanco.png', 'img/logo/farsens-viejo-particulas.png', 'img/logo/farsens-nuevo.png', 'img/logo/kliskatek-white.svg'];
async function montar3d(el) {
  for (const caja of $$('.logos3d', el)) {
    const m = await cargarLogos();
    if (!el.isConnected) return;
    const h = m && m.montarLogos(caja, { logos: LOGOS });
    if (h) caja._chip = h;
    else caja.innerHTML = '<img class="respaldo" src="img/logo/kliskatek-white.svg" alt="Kliskatek">';
  }
  for (const caja of $$('.chip3d', el)) {
    const m = await cargar3d();
    if (!el.isConnected) return;
    let h = null;
    try { h = m && m.montarChip(caja, { textura: caja.dataset.textura, pads: caja.dataset.pads,
      paquete: caja.dataset.paquete, marca: (caja.dataset.marca || '').split('|').filter(Boolean) }); } catch (e) { console.warn(e); }
    if (h) caja._chip = h;
    else caja.innerHTML = `<img class="respaldo" src="${caja.dataset.textura}" alt="" onerror="this.remove()">`;
  }
}
const desmontar3d = (el) => $$('.chip3d, .logos3d', el).forEach((c) => { if (c._chip) c._chip.destruir(); c._chip = null; });

// ------------------------------------------------------------------------------------------- pasar diapositivas
function mostrar() {
  const d = DIAPOS[S.i], t = d[S.idioma];
  const caja = $('#diapos');
  const tmp = document.createElement('div');
  tmp.innerHTML = DIBUJAR[d.tipo](d, t).trim();
  const nueva = tmp.firstElementChild;
  caja.appendChild(nueva);
  requestAnimationFrame(() => requestAnimationFrame(() => nueva.classList.add('visible')));
  [...caja.children].filter((el) => el !== nueva && !el.classList.contains('sale')).forEach((el) => {
    el.classList.remove('visible'); el.classList.add('sale');
    setTimeout(() => { desmontar3d(el); el.remove(); }, 950);
  });
  escenario.dataset.era = d.era;
  moverCursor(d, t);
  pintarEscena();
  montar3d(nueva);
  clearInterval(S.escena);
  if (d.quedan) animarGoteo(nueva, d);
  if (d.tipo === 'kliskatek') {                // las capas se encienden de abajo arriba: el dato sube hasta las APIs
    let k = -4;
    S.escena = setInterval(() => {
      k = k >= d.iconos.length + 1 ? 0 : k + 1;
      $$('.placa', nueva).forEach((p, n) => p.classList.toggle('activa', n === k));
      $$('.capas li', nueva).forEach((p, n) => p.classList.toggle('activa', n === k));
    }, 900);
  }
  programar(d.dur);
}

function programar(seg) {
  clearTimeout(S.timer);
  if (S.auto) S.timer = setTimeout(() => ir(1, false), seg * 1000);
}

function ir(paso, aMano = true) {
  S.i = (S.i + paso + DIAPOS.length) % DIAPOS.length;
  mostrar();
  if (aMano) programar(DIAPOS[S.i].dur + 10);   // a mano, se queda un rato más antes de seguir sola
}

function pausar(parar) {
  S.auto = !parar;
  $('#pausa').classList.toggle('parado', parar);
  $('#pausa').setAttribute('aria-label', UI[S.idioma][parar ? 'seguir' : 'pausa']);
  if (parar) clearTimeout(S.timer); else programar(4);
}

// ------------------------------------------------------------------------------------------- idioma
function aplicarIdioma(id, redibujar = true) {
  S.idioma = IDIOMAS.includes(id) ? id : 'en';
  document.documentElement.lang = S.idioma === 'zh' ? 'zh-CN' : S.idioma;   // chino simplificado, de China continental
  const u = UI[S.idioma];
  $$('.idiomas button').forEach((b) => b.classList.toggle('activo', b.dataset.idioma === S.idioma));
  $('#anterior').setAttribute('aria-label', u.anterior);
  $('#siguiente').setAttribute('aria-label', u.siguiente);
  $('#pantalla').setAttribute('aria-label', u.pantalla);
  $('#pausa').setAttribute('aria-label', S.auto ? u.pausa : u.seguir);
  $('#girar span').textContent = u.girar;
  $('#escena .escena-tit').textContent = u.escena;
  try { localStorage.setItem('historia.idioma', S.idioma); } catch (e) { /* sin almacenamiento */ }
  if (redibujar) mostrar();
}

function idiomaInicial() {
  if (P.get('idioma')) return P.get('idioma');
  try { const g = localStorage.getItem('historia.idioma'); if (g) return g; } catch (e) { /* nada */ }
  const nav = (navigator.languages || [navigator.language || 'en']).map((l) => l.slice(0, 2).toLowerCase());
  return nav.find((l) => IDIOMAS.includes(l)) || 'en';
}

// ------------------------------------------------------------------------------------------- arranque
function iniciar() {
  pintarEje();
  aplicarIdioma(idiomaInicial(), false);
  if (P.has('diapo')) { S.i = Math.max(0, Math.min(DIAPOS.length - 1, Number(P.get('diapo')) || 0)); S.auto = false; pausar(true); }
  mostrar();

  $('#anterior').addEventListener('click', () => ir(-1));
  $('#siguiente').addEventListener('click', () => ir(1));
  $('#pausa').addEventListener('click', () => pausar(S.auto));
  $('#pantalla').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else { await document.documentElement.requestFullscreen(); await screen.orientation.lock('landscape').catch(() => {}); }
    } catch (e) { /* iOS: sin pantalla completa */ }
  });
  $$('.idiomas button').forEach((b) => b.addEventListener('click', () => aplicarIdioma(b.dataset.idioma)));
  window.addEventListener('keydown', (ev) => {
    if (['ArrowRight', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); ir(1); }
    else if (['ArrowLeft', 'PageUp'].includes(ev.key)) { ev.preventDefault(); ir(-1); }
    else if (ev.key.toLowerCase() === 'p') pausar(S.auto);
  });
  // deslizar de lado pasa de diapositiva; un toque en un borde, también
  let ini = null;
  escenario.addEventListener('pointerdown', (ev) => { ini = ev.target.closest('button') ? null : { x: ev.clientX, y: ev.clientY }; });
  escenario.addEventListener('pointerup', (ev) => {
    if (!ini) return;
    const dx = ev.clientX - ini.x, dy = ev.clientY - ini.y, r = escenario.getBoundingClientRect();
    ini = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.4 * Math.abs(dy)) ir(dx < 0 ? 1 : -1);
    else if (Math.hypot(dx, dy) < 12 && ev.pointerType === 'touch') {
      const x = (ev.clientX - r.left) / r.width;
      if (x > 0.8) ir(1); else if (x < 0.2) ir(-1);
    }
  });
  window.historia = { ir: (n) => { S.i = n; mostrar(); }, S };   // para revisar desde la consola
}

iniciar();
