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
// un rasgo de cada uno, sin decirlo: el fondo (c), la ropa (cuerpo), lo que lleva encima (encima, dibujado sobre el cuerpo)
// y lo que queda detrás de la figura (detras; la figura lo tapa, aunque sea translúcida). De normal no se ve: cada uno lo enseña un rato de vez en cuando (lucirRasgos)
const CABEZA = '<circle cx="32" cy="25" r="11.5"/>', CUERPO = 'M9 66c0-14 10.5-23 23-23s23 9 23 23z';
// electrones (−) y huecos (+) en una órbita alrededor de la figura
const ORBITA = [0, 1, 2, 3].map((k) => `<g>${k % 2
  ? '<circle r="4" fill="#1F4FA8" stroke="#fff" stroke-width="1.1"/><path d="M-2 0h4M0-2v4" stroke="#fff" stroke-width="1.2"/>'
  : '<circle r="4" fill="#FFD24D" stroke="#B8860B" stroke-width=".6"/><path d="M-2 0h4" stroke="#1B1E22" stroke-width="1.4"/>'}`
  + `<animateMotion dur="3s" begin="-${k * 0.75}s" repeatCount="indefinite" path="M6 40a26 15 0 1 0 52 0a26 15 0 1 0-52 0"/></g>`).join('');
const RASGOS = {
  Alex: { c: '#5B636B', clase: 'cura', cuerpo: '#0d0e10', encima: '<rect x="28.6" y="43.2" width="6.8" height="4.6" rx="1" fill="#fff"/>' },
  Hoss: { encima: '<g transform="translate(45 53) scale(1.2) translate(-47 -53)"><path d="M42 47.5v-2.6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2.6" fill="none" stroke="#2A2F35" stroke-width="1.8"/>'
    + '<rect x="35" y="47" width="24" height="15" rx="2.2" fill="#2A2F35"/><path d="M35 52.5h24" stroke="#454C54" stroke-width=".8"/>'
    + '<path d="M47 52.2c-.9-.7-2.6-.8-3.6.3-1.2 1.4-.8 4.2.7 5.8.6.6 1.3.8 2 .4.6-.3 1.2-.3 1.8 0 .7.4 1.4.2 2-.4.6-.6 1.1-1.6 1.3-2.4'
    + 'a1.9 1.9 0 0 1-.4-3.1c-.6-.9-1.6-1.2-2.4-1-.6.1-1 .4-1.4.4z" fill="#E8ECEF"/><path d="M47.2 51.6c0-1 .7-1.9 1.6-2.1-.1 1-.7 1.8-1.6 2.1z" fill="#E8ECEF"/></g>' },
  Santi: { clase: 'fuma', encima: '<rect x="35" y="29.2" width="4" height="2.4" fill="#D9A066"/>'
    + '<rect x="39" y="29.2" width="9.5" height="2.4" fill="#fff" stroke="#9AA4AD" stroke-width=".4"/>'
    + '<rect x="48.5" y="29.2" width="1.6" height="2.4" fill="#FF7A1A"/><circle cx="50" cy="30.4" r="1.6" fill="#FFB347" opacity=".55"/>'
    + '<g class="humo" fill="none" stroke="#E8ECEF" stroke-width="2.4" stroke-linecap="round" opacity=".9">'
    + '<path d="M50.5 27c-3-3 3-5.5 0-8.5s3-5.5 0-8.5"/><path d="M55.5 25c-2.4-2.4 2.4-4.4 0-6.8s2.4-4.4 0-6.8" opacity=".55" stroke-width="1.8"/></g>' },
  Julia: { clase: 'mechero', sigue: 'Santi', encima: '<g transform="rotate(8 15 44)"><rect x="11.5" y="37" width="7" height="14" rx="1.6" fill="#E53935"/>'
    + '<rect x="11.5" y="37" width="2" height="14" rx="1" fill="#fff" opacity=".25"/><rect x="11.8" y="33.2" width="6.4" height="4.2" rx=".6" fill="#B8C1C9"/>'
    + '<circle cx="16.2" cy="34.6" r="1.5" fill="#6B747C"/><g class="llama"><path d="M14.6 32.6c-2.6-2.4-1.8-5.8.6-8.6.4 2.2 2.6 3 2.4 5.6-.1 1.6-1.4 3-3 3z" fill="#FFB347"/>'
    + '<path d="M15 32.4c-1.2-1.2-.8-2.8.4-4.2.2 1.1 1.3 1.6 1.1 2.8-.1.8-.7 1.4-1.5 1.4z" fill="#FFF3C4"/></g></g>' },
  Gabi: { encima: '<clipPath id="camiseta-athletic"><path d="M9 66c0-14 10.5-23 23-23s23 9 23 23z"/></clipPath>'
    + `<g clip-path="url(#camiseta-athletic)" fill="#E2001A">${[12, 22, 32, 42, 52].map((x) => `<rect x="${x - 2.6}" y="40" width="5.2" height="26"/>`).join('')}</g>` },
  Edu: { clase: 'zahori', encima: '<g class="agua" fill="none" stroke="#3BA3FF" stroke-width="1.6" stroke-linecap="round">'
    + '<path d="M22 61.5c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 3.2 1.2 4.8 0"/><path d="M25 64.5c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0"/></g>'
    + '<g class="horquilla" fill="none" stroke="#8A5A2B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M19.5 56.5 32 47.5 44.5 56.5M32 47.5V37.5"/><path d="M32 41.5l2.6-1.8" stroke-width="1.4"/></g>'
    + '<circle cx="19.5" cy="56.5" r="2.4" fill="#F2D3B3"/><circle cx="44.5" cy="56.5" r="2.4" fill="#F2D3B3"/>' },
  Mikel: { clase: 'pala', encima: '<g transform="rotate(-6 32 16)"><path d="M15.6 18.6c-.8-6.4 7.4-10.4 16.4-10.4s17.2 4 16.4 10.4c-4.8 2.4-28 2.4-32.8 0z" fill="#1B1E22"/>'
    + '<path d="M16.4 18.4c5.4 2 25.8 2 31.2 0" stroke="#3A4047" stroke-width=".8" fill="none"/><path d="M32 8.4V6" stroke="#1B1E22" stroke-width="1.4" stroke-linecap="round"/></g>'
    + '<g transform="translate(-5 3) rotate(10 50 54)"><rect x="48.6" y="42" width="3" height="11" rx="1" fill="#6B4A2B"/>'
    + '<rect x="44.5" y="19" width="11.2" height="25" rx="5.4" fill="#C98F4E" stroke="#6B4A2B" stroke-width=".8"/>'
    + '<path d="M47.4 22.5v18M50.1 21v21M52.8 22.5v18" stroke="#B07A3E" stroke-width=".5"/><circle cx="50.1" cy="54" r="2.6" fill="#F2D3B3"/></g>'
    + '<g class="pelota"><circle cx="20" cy="30" r="3.2" fill="#F5F1E6" stroke="#9AA4AD" stroke-width=".5"/>'
    + '<path d="M17.4 28.6c1.6.8 3.6.8 5.2 0M17.4 31.4c1.6-.8 3.6-.8 5.2 0" fill="none" stroke="#C2185B" stroke-width=".5"/></g>' },
  Felipe: { clase: 'sonambulo', encima: '<path d="M20.6 24.2c-.8-8.4 5-13 11.4-13 4.6 0 8 1.6 11.2.2 2.8-1.2 5.4-3.4 7.6-2.2l-5.4 9.6c-6 2-15.6 3.6-24.8 5.4z" fill="#1F2A5A"/>'
    + `<g fill="#FFD24D">${[[26, 18, 1.6], [33, 15.2, 1.3], [38.5, 18.4, 1.5], [44, 13.4, 1.1]].map(([x, y, r]) => {   // estrellitas de cuatro puntas
      const a = r * .3, b = r * .7;
      return `<path d="M${x} ${y - r}l${a} ${b} ${b} ${a}-${b} ${a}-${a} ${b}-${a}-${b}-${b}-${a} ${b}-${a}z"/>`;
    }).join('')}</g>`
    + '<circle cx="51.4" cy="9.6" r="2.8" fill="#FFD24D"/>'
    + '<g class="zzz" fill="#fff" font-family="Oxanium, sans-serif" font-weight="800"><text x="13" y="23" font-size="6.4">Z</text>'
    + '<text x="10" y="16.4" font-size="4.8">z</text><text x="12" y="10.6" font-size="3.6">z</text></g>'
    + '<g class="grito"><path d="M8.4 11h11.4a2.2 2.2 0 0 1 2.2 2.2v6.2a2.2 2.2 0 0 1-2.2 2.2h-.4l2.6 3-5.4-3H8.4a2.2 2.2 0 0 1-2.2-2.2v-6.2A2.2 2.2 0 0 1 8.4 11z" fill="#fff"/>'
    + '<text x="14.1" y="19.6" text-anchor="middle" fill="#B3261E" font-family="Oxanium, sans-serif" font-weight="800" font-size="8">!!</text></g>' },
  Myriam: { clase: 'cumples', encima: '<g transform="rotate(-6 32 52)"><rect x="17" y="40" width="30" height="24" rx="1" fill="#F5F1E6" stroke="#9AA4AD" stroke-width=".5"/>'
    + '<text x="32" y="45.4" text-anchor="middle" fill="#1B1E22" font-family="Georgia, serif" font-weight="700" font-size="3.6">Farsens Times</text>'
    + '<path d="M19 47h26" stroke="#1B1E22" stroke-width=".5"/><g fill="#B8C1C9"><rect x="19" y="49" width="13" height="1.2"/><rect x="19" y="51.4" width="13" height="1.2"/>'
    + '<rect x="19" y="53.8" width="13" height="1.2"/><rect x="19" y="56.2" width="10" height="1.2"/></g>'
    + '<rect x="35" y="52" width="9" height="5" rx=".8" fill="#F48FB1"/><rect x="35" y="54.2" width="9" height="1" fill="#fff"/>'
    + '<path d="M39.5 52v-2.4" stroke="#5A6FE0" stroke-width=".9"/><ellipse cx="39.5" cy="48.8" rx=".8" ry="1.2" fill="#FFB347"/></g>'
    + `<g class="confeti">${[[12, 14, '#FFD24D'], [20, 8, '#F48FB1'], [44, 9, '#7FD67F'], [52, 16, '#fff'], [27, 4, '#FF8A3D'], [38, 3, '#9B7BFF']]
      .map(([x, y, c], k) => `<rect x="${x}" y="${y}" width="2.4" height="1.4" rx=".4" fill="${c}" transform="rotate(${k * 37} ${x} ${y})" style="--k:${k}"/>`).join('')}</g>` },
  Iago: { clase: 'altavoz', encima: '<path d="M38.6 26.4 52 19.6v15.6l-13.4-5.4z" fill="#FF8A3D" stroke="#B85A1A" stroke-width=".6" stroke-linejoin="round"/>'
    + '<ellipse cx="52" cy="27.4" rx="1.8" ry="7.8" fill="#FFD9B8" stroke="#B85A1A" stroke-width=".6"/>'
    + '<rect x="36.2" y="25.8" width="3.4" height="4.6" rx=".8" fill="#4A535B"/><path d="M44 30.6v5.6" stroke="#4A535B" stroke-width="2" stroke-linecap="round"/>'
    + '<g class="voz" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"><path d="M56 22.4a8 8 0 0 1 0 10"/>'
    + '<path d="M59 19.6a12 12 0 0 1 0 15.6"/><path d="M62 16.8a16 16 0 0 1 0 21.2"/></g>' },
  Iñaki: { clase: 'navaja', encima: [
    ['h1', 22, 56, 12.5, 43.5, '<rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx=".6" fill="#23282D"/><path d="M-1 -3.3v1.1M1 -3.3v1.1M-1 2.2v1.1M1 2.2v1.1M-3.3 -1h1.1M-3.3 1h1.1M2.2 -1h1.1M2.2 1h1.1" stroke="#23282D" stroke-width=".6"/>'],
    ['h2', 22, 56, 32, 40.5, '<path d="M-1.4 -2 -3.2 0l1.8 2M1.4 -2 3.2 0l-1.8 2M.6 -2.6-.6 2.6" fill="none" stroke="#2C6FD6" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/>'],
    ['h3', 42, 56, 51.5, 43.5, '<rect x="-3.2" y="-2.6" width="6.4" height="4.2" rx=".6" fill="none" stroke="#2E9E5B" stroke-width=".8"/><path d="M-1.2 2.8h2.4M0 1.6v1.2" stroke="#2E9E5B" stroke-width=".8"/>'],
  ].map(([h, px, py, x, y, g]) => `<g class="${h}"><path d="M${px} ${py}L${x} ${y}" stroke="#7D8790" stroke-width="2.6" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${y}" r="5.4" fill="#E8ECEF" stroke="#5F6870" stroke-width=".7"/><g transform="translate(${x} ${y}) scale(1.15)">${g}</g></g>`).join('')
    + '<rect x="17.5" y="52" width="29" height="8.4" rx="4.2" fill="#D32F2F" stroke="#8E1B1B" stroke-width=".6"/>'
    + '<path d="M32 53.8v4.8M29.6 56.2h4.8" stroke="#fff" stroke-width="1.5"/><circle cx="22" cy="56" r=".9" fill="#E8ECEF"/><circle cx="42" cy="56" r=".9" fill="#E8ECEF"/>' },
  Andoni: { clase: 'pedestal', vacio: true, encima: `<g class="figura">${CABEZA}<path d="${CUERPO}"/></g>`
    + `<g class="laurel" fill="#3E8E41">${[...Array(10)].map((_, k) => {   // la corona de laurel de las estatuas, a los dos lados de la cabeza
      const g = (k < 5 ? 196 + k * 15 : 284 + (k - 5) * 15) * Math.PI / 180, x = 32 + 9.4 * Math.cos(g), y = 22.6 + 9.4 * Math.sin(g);
      return `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.1" transform="rotate(${(g * 180 / Math.PI + 90 + (k < 5 ? -25 : 25)).toFixed(0)} ${x} ${y})"/>`;
    }).join('')}</g>`
    + '<g class="peana"><rect x="13" y="52" width="38" height="3.4" rx=".8" fill="#F2EEE6" stroke="#A9A39A" stroke-width=".5"/>'
    + '<rect x="17" y="55.4" width="30" height="10" fill="#E4DED3" stroke="#A9A39A" stroke-width=".5"/>'
    + '<path d="M22 56.4v8.6M27.3 56.4v8.6M32.6 56.4v8.6M37.9 56.4v8.6M43 56.4v8.6" stroke="#C4BCAF" stroke-width=".8"/></g>' },
  Mario: { clase: 'padel', encima: '<g transform="translate(-6 2) rotate(14 48 48)"><rect x="46.4" y="38" width="3.4" height="12" rx="1.2" fill="#23282D"/>'
    + '<path d="M48.1 10.4c5.6 0 9.2 4.4 9.2 10.6 0 6.4-4.2 11.4-7.4 17.6h-3.6C43 32.4 38.9 27.4 38.9 21c0-6.2 3.6-10.6 9.2-10.6z" fill="#23282D" stroke="#D7F23C" stroke-width="1.1"/>'
    + [14, 17.5, 21, 24.5, 28].map((y, f) => [-4.5, -1.5, 1.5, 4.5].filter((x, c) => !(f === 4 && (c === 0 || c === 3)))
      .map((x) => `<circle cx="${48.1 + x}" cy="${y}" r=".75" fill="#8F9AA4"/>`).join('')).join('')
    + '<circle cx="50.5" cy="49.6" r="2.4" fill="#F2D3B3"/></g>'
    + '<circle class="bola" cx="16" cy="20" r="2.6" fill="#D7F23C" stroke="#9DB41F" stroke-width=".4"/>'
    + '<path d="M25.6 43.8 30.6 50M38.4 43.8 33.4 50" stroke="#C2185B" stroke-width="2.2" stroke-linecap="round"/>'
    + '<circle cx="32" cy="53.4" r="4.4" fill="#FFD24D" stroke="#C99A1A" stroke-width=".6"/>'
    + '<text x="32" y="55.7" text-anchor="middle" fill="#7A5A00" font-family="Oxanium, sans-serif" font-weight="800" font-size="6">1</text>' },
  Ainara: { clase: 'calidad', vacio: true, encima: '<g class="prisa" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7">'
    + '<path d="M4 30h7M2 36h8M5 42h6"/></g><g class="persigue">' + CABEZA + `<path d="${CUERPO}"/>`
    + '<rect x="35" y="36" width="15" height="21" rx="1.6" fill="#8A5A2B"/><rect x="36.6" y="39" width="11.8" height="16.6" rx=".6" fill="#fff"/>'
    + '<rect x="39.6" y="34.6" width="5.8" height="3.4" rx="1" fill="#9AA4AD"/>'
    + [42.4, 47, 51.6].map((y, k) => `<rect x="38" y="${y - 1.4}" width="2.8" height="2.8" rx=".4" fill="none" stroke="#9AA4AD" stroke-width=".5"/>`
      + `<path d="M42.4 ${y}h4.6" stroke="#C9D1D8" stroke-width=".9"/><path class="marca m${k}" d="${k < 2 ? `M38.4 ${y}l1 1.1 1.8-2.4` : `M38.4 ${y - 1}l2 2M40.4 ${y - 1}l-2 2`}"`
      + ` fill="none" stroke="${k < 2 ? '#2E9E5B' : '#D32F2F'}" stroke-width=".9" stroke-linecap="round" pathLength="1"/>`).join('') + '</g>' },
  'Aritz Alonso': { clase: 'terminator', vacio: true, encima: '<linearGradient id="cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7FA"/>'
    + '<stop offset=".45" stop-color="#9AA4AD"/><stop offset=".7" stop-color="#DDE3E8"/><stop offset="1" stop-color="#6B747C"/></linearGradient>'
    + '<clipPath id="cabeza-cromo"><circle cx="32" cy="25" r="11.5"/></clipPath>'
    + '<circle cx="32" cy="25" r="11.5" fill="url(#cromo)"/><g clip-path="url(#cabeza-cromo)"><rect class="reflejo" x="14" y="8" width="5" height="34" fill="#fff" opacity=".7" transform="rotate(25 32 25)"/></g>'
    + `<path d="${CUERPO}" fill="#1B1E22"/><path d="M26.4 43.6 31 58l-4 3.6-5.6-15.4zM37.6 43.6 33 58l4 3.6 5.6-15.4z" fill="#2E3338"/>`
    + '<path d="M22 23.2h8.6l-.8 3.6a2 2 0 0 1-2 1.6h-3.6a2 2 0 0 1-2-1.6zM33.4 23.2H42l-.6 3.6a2 2 0 0 1-2 1.6h-3.6a2 2 0 0 1-2-1.6z" fill="#0D0E10"/>'
    + '<path d="M30.6 23.6h2.8M20.6 23.4h1.6M42 23.4h1.6" stroke="#0D0E10" stroke-width="1"/><circle class="ojo" cx="38" cy="25.4" r="1.1" fill="#FF2A2A"/>'
    + '<g class="maquina" fill="none" stroke="#FFD400"><rect x="18" y="11" width="28" height="28" stroke-width=".6" stroke-dasharray="1.6 1.2"/>'
    + '<path d="M18 16v-5h5M41 11h5v5M46 34v5h-5M23 39h-5v-5" stroke-width="1.6"/></g>' },
  Jurgi: { clase: 'monte', detras: '<path d="M-2 47 12 22l7 9 13-20 13 22 7-10 14 24z" fill="#4A5A6B"/>'
    + '<path d="M12 22l-3 5.4 3-1.4 2.2 1.6zM32 11l-4.4 6.8 3-1.2 2.4 1.8 2.2-2zM52 23l-2.4 4.2 2.6-1 2 1.2z" fill="#F4F7FA"/>',
  encima: '<path d="M24.6 44.6 22.4 66M39.4 44.6 41.6 66" stroke="#E8772E" stroke-width="2.4" stroke-linecap="round"/>'
    + '<path d="M48.6 47 53 34.6" stroke="#23282D" stroke-width="1.2" stroke-linecap="round"/><circle cx="53" cy="34.4" r="1.1" fill="#23282D"/>'
    + '<rect x="40" y="46.4" width="11" height="8.4" rx=".8" fill="#2E7D32" stroke="#1B4D1F" stroke-width=".5"/>'
    + '<rect x="42.4" y="48.6" width="4" height="4" rx=".4" fill="#23282D"/><circle cx="49" cy="52.6" r=".6" fill="#FFD24D"/>'
    + '<circle cx="44" cy="56" r="2.4" fill="#F2D3B3"/>'
    + '<g class="senal" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"><path d="M50.4 30.6a4.2 4.2 0 0 1 5.2 0"/>'
    + '<path d="M48.4 27.6a7.6 7.6 0 0 1 9.2 0"/><path d="M46.4 24.6a11 11 0 0 1 13.2 0"/></g>' },
  Diego: { clase: 'parrilla', encima: '<g class="llamas" fill="#FF8A3D"><path d="M22 62c-1.4-2.6.4-4.6 1.6-6.4.4 1.8 2 2.4 1.6 4.6-.2 1.2-1.6 2.2-3.2 1.8z"/>'
    + '<path d="M31 63c-1.8-3 .4-5.6 2-7.6.4 2.2 2.4 3 2 5.6-.2 1.4-2 2.6-4 2z"/><path d="M40 62c-1.4-2.6.4-4.6 1.6-6.4.4 1.8 2 2.4 1.6 4.6-.2 1.2-1.6 2.2-3.2 1.8z"/></g>'
    + '<ellipse cx="32" cy="52.6" rx="17" ry="7" fill="#2A2F35"/><ellipse cx="32" cy="52" rx="15" ry="5.8" fill="#3A4047"/>'
    + '<path d="M18.6 50h26.8M17.6 52.4h28.8M18.8 54.8h26.4" stroke="#7D8790" stroke-width=".5"/>'
    + '<rect x="20" y="48.4" width="9" height="2.6" rx="1.3" fill="#B5543A" transform="rotate(-8 24.5 49.7)"/>'
    + '<rect x="21.4" y="52.4" width="8" height="2.4" rx="1.2" fill="#A0462F" transform="rotate(6 25.4 53.6)"/>'
    + '<path d="M31.6 48.6c2.6-1 6.4-.6 7.2 1.2.8 1.8-1 3.6-3.6 3.8-2.8.2-5.2-.8-5.2-2.6 0-1 .6-1.8 1.6-2.4z" fill="#7A3B22"/>'
    + '<path d="M33 50.4c1.4-.2 3 .2 3.6 1" stroke="#C47A4F" stroke-width=".5" fill="none"/>'
    + '<path d="M39.6 53.2c1.8-1.6 4.8-1.4 5.4.4.4 1.4-.8 2.6-2.4 2.6l-2.2.2-1.6 1.4c-.6.4-1.2-.2-.8-.8l1-1.4c-.4-.8-.2-1.6.6-2.4z" fill="#D9934A"/>'
    + '<g class="humo-bbq" fill="none" stroke="#E8ECEF" stroke-width="1.6" stroke-linecap="round" opacity=".75">'
    + '<path d="M26 45c-1.8-2 1.8-3.6 0-5.6"/><path d="M33 44.4c-1.8-2 1.8-3.6 0-5.6"/><path d="M40 45c-1.8-2 1.8-3.6 0-5.6"/></g>' },
  Rio: { clase: 'hotpot', encima: '<g class="vapor" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7">'
    + '<path d="M21 44c-1.6-1.8 1.6-3.2 0-5s1.6-3.2 0-5"/><path d="M26.4 42.6c-1.6-1.8 1.6-3.2 0-5s1.6-3.2 0-5"/></g>'
    + '<path d="M15.6 50h32.8v4.6c0 4.4-7.4 7.6-16.4 7.6s-16.4-3.2-16.4-7.6z" fill="#B8C1C9" stroke="#7D8790" stroke-width=".6"/>'
    + '<path d="M13.4 51.4h2.4M48.2 51.4h2.4" stroke="#7D8790" stroke-width="1.6" stroke-linecap="round"/>'
    + '<ellipse cx="32" cy="50" rx="16.4" ry="4.4" fill="#D9DEE3" stroke="#7D8790" stroke-width=".6"/>'
    + '<clipPath id="olla-hotpot"><ellipse cx="32" cy="50" rx="15" ry="3.6"/></clipPath><g clip-path="url(#olla-hotpot)">'
    + '<rect x="16" y="45" width="32" height="10" fill="#F3E3C3"/><path d="M16 45h16c-3 2-3 8 0 10H16z" fill="#D9381E"/>'
    + '<g class="burbujas" fill="#fff" opacity=".7"><circle cx="21" cy="50.4" r=".8"/><circle cx="26" cy="49" r=".6"/><circle cx="38" cy="50.6" r=".8"/><circle cx="43" cy="49.4" r=".6"/></g>'
    + '<path d="M24 51.6h2.4M39 48.6h3" stroke="#3E8E41" stroke-width=".8" stroke-linecap="round"/></g>'
    + '<g class="palillos"><path d="M33.4 39.4c1.2-1.4 3.4-1.2 3.6.6.2 1.4-1.4 1.8-1.4 3 0 1 1.4 1.2 1 2.4-.4 1.4-2.6 1.4-3.2.2-.4-.8.4-1.6 0-2.4-.4-.8-1.4-1-1-2.2z" fill="#C98FA0" stroke="#8E5A6A" stroke-width=".4"/>'
    + '<path d="M34 39.4 54 24M36.4 40 56 26.4" stroke="#8A5A2B" stroke-width="1.3" stroke-linecap="round"/></g>'
    + '<text class="duda" x="44" y="38" fill="#fff" font-family="Oxanium, sans-serif" font-weight="800" font-size="9">?</text>' },
  Jon: { clase: 'soldador', encima: '<rect x="15" y="47" width="27" height="15" rx="1.2" fill="#2E7D32" stroke="#1B4D1F" stroke-width=".6"/>'
    + '<path d="M17.6 51.4h6l2 2h6M17.6 57.4h9l2-2h9" fill="none" stroke="#C9A227" stroke-width=".6"/>'
    + '<rect x="19" y="49" width="5" height="4" rx=".4" fill="#23282D"/><rect x="30" y="56.4" width="4.4" height="2" rx=".4" fill="#C98F4E"/>'
    + '<rect x="26.4" y="48.6" width="2" height="4.4" rx=".4" fill="#5A6FE0"/>'
    + [[33, 51.4], [37.6, 51.4], [37.6, 55.4], [21, 58.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#D9DEE3"/>`).join('')
    + '<path d="M38.2 51.2 54 36.4" stroke="#9AA4AD" stroke-width="1.4" stroke-linecap="round"/>'
    + '<path d="M47.6 42.4 58 32.6" stroke="#1F4FA8" stroke-width="4" stroke-linecap="round"/><path d="M50.4 39.8l1.6 1.6" stroke="#23282D" stroke-width="1.2"/>'
    + '<circle class="punta" cx="38" cy="51.4" r="1.3" fill="#FFB347"/>'
    + '<g class="humo-estano" fill="none" stroke="#E8ECEF" stroke-width="1.2" stroke-linecap="round" opacity=".8">'
    + '<path d="M36.6 48c-1.4-1.6 1.4-2.8 0-4.4s1.4-2.8 0-4.4"/></g>' },
  Beñat: { clase: 'speaker', encima: '<path d="M19.6 25a12.4 12.4 0 0 1 24.8 0" fill="none" stroke="#23282D" stroke-width="2"/>'
    + '<rect x="17.4" y="21.6" width="4.6" height="8" rx="2" fill="#23282D"/><rect x="42" y="21.6" width="4.6" height="8" rx="2" fill="#23282D"/>'
    + '<path d="M19.6 29.4c0 4.4 4 6.6 9.6 6.4" fill="none" stroke="#23282D" stroke-width="1.2"/><ellipse cx="30.2" cy="35.6" rx="1.8" ry="1.4" fill="#23282D"/>'
    + '<g class="voz" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"><path d="M34 36.6l4 1.4"/><path d="M33.6 39.4l3.6 2.6"/><path d="M34.6 33.8l4.2.2"/></g>'
    + '<g class="balon"><circle cx="14" cy="44" r="5.6" fill="#E8772E" stroke="#8A3A0E" stroke-width=".6"/>'
    + '<path d="M8.4 44h11.2M14 38.4v11.2M10 40a6.4 6.4 0 0 1 0 8M18 40a6.4 6.4 0 0 0 0 8" fill="none" stroke="#8A3A0E" stroke-width=".6"/></g>' },
  Yon: { clase: 'fotos', encima: '<path d="M22 28c-3 6-2 12 2 16M42 28c3 6 2 12-2 16" fill="none" stroke="#23282D" stroke-width="1.2"/>'
    + '<rect x="21" y="19" width="17" height="12" rx="2" fill="#23282D"/><rect x="24" y="16.6" width="6" height="3" rx=".8" fill="#23282D"/>'
    + '<rect x="35.6" y="19.6" width="10" height="10.8" rx="1" fill="#3A4047"/><rect x="45" y="18.6" width="12" height="12.8" rx="1.4" fill="#D9DEE3"/>'
    + '<path d="M48.6 18.6v12.8M53 18.6v12.8" stroke="#9AA4AD" stroke-width="1"/><rect x="56.4" y="19.4" width="2.4" height="11.2" rx=".8" fill="#23282D"/>'
    + '<circle cx="28" cy="25" r="1.4" fill="#5A6FE0"/><rect x="33" y="21" width="2.4" height="1.4" rx=".3" fill="#C2185B"/>'
    + '<g class="flash"><circle cx="27" cy="15" r="5" fill="#fff" opacity=".85"/><path d="M27 6v4M27 20v4M18 15h4M32 15h4M20.6 8.6l2.8 2.8M30.6 18.6l2.8 2.8M33.4 8.6l-2.8 2.8M23.4 18.6l-2.8 2.8" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></g>' },
  Susana: { clase: 'discute', encima: '<rect x="19.6" y="20.6" width="4.2" height="9.6" rx="1" fill="#23282D" transform="rotate(-14 21.7 25.4)"/>'
    + '<g transform="translate(0 1)"><rect x="18" y="50" width="20" height="12" rx=".6" fill="#C98F4E" stroke="#8A5A2B" stroke-width=".5"/>'
    + '<path d="M27 50v12" stroke="#E8D3A8" stroke-width="2"/><rect x="30" y="53" width="6" height="4" fill="#fff"/><path d="M31 54.4h4M31 55.8h3" stroke="#9AA4AD" stroke-width=".4"/>'
    + '<rect x="21" y="41" width="16" height="9" rx=".6" fill="#B07A3E" stroke="#8A5A2B" stroke-width=".5"/><path d="M29 41v9" stroke="#E8D3A8" stroke-width="1.8"/></g>'
    + '<g class="bronca"><path d="M8.4 9h12.6a2.2 2.2 0 0 1 2.2 2.2v6.2a2.2 2.2 0 0 1-2.2 2.2h-1.6l.4 3.4-3.6-3.4H8.4a2.2 2.2 0 0 1-2.2-2.2v-6.2A2.2 2.2 0 0 1 8.4 9z" fill="#fff"/>'
    + '<text x="14.7" y="17.2" text-anchor="middle" fill="#D32F2F" font-family="Oxanium, sans-serif" font-weight="800" font-size="6.4">#@!</text></g>' },
  Eñaut: { clase: 'ia', encima: '<path d="M20.4 20.4c-.4-6.6 5-10.4 11.6-10.4s12 3.8 11.6 10.4c-7.4-1.6-15.8-1.6-23.2 0z" fill="#1F2A5A"/>'
    + '<path d="M21 19.8c-3.4.2-6.6 1.2-8.4 2.6 1.4-2.8 4.6-4.8 8.6-5.2z" fill="#1F2A5A"/>'
    + '<path d="M29.6 19.4a2.4 2.4 0 0 1 4.8 0" fill="none" stroke="#fff" stroke-width=".8"/><path d="M32 10v2.4" stroke="#fff" stroke-width=".8"/>'
    + '<path d="M45.4 14h10.8a2.2 2.2 0 0 1 2.2 2.2v5.6a2.2 2.2 0 0 1-2.2 2.2h-8l-4.6 3.6.8-3.6h-.8a2.2 2.2 0 0 1-2.2-2.2v-5.6a2.2 2.2 0 0 1 2.2-2.2z" fill="#fff"/>'
    + '<path class="destello" d="M47.4 16.2l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" fill="#7B61FF"/>'
    + '<g class="puntos" fill="#5F6870"><circle cx="51.6" cy="19.2" r=".9"/><circle cx="54" cy="19.2" r=".9"/><circle cx="56.4" cy="19.2" r=".9"/></g>' },
  Ivan: { encima: '<g transform="translate(-1 -5) rotate(-10 44 52)"><rect x="36" y="38" width="16" height="27" rx="3.2" fill="#1B1E22" stroke="#8F9AA4" stroke-width=".7"/>'
    + '<rect x="37.4" y="39.6" width="13.2" height="23.8" rx="2.2" fill="#2C6FD6"/><rect x="41.6" y="40.6" width="4.8" height="1.4" rx=".7" fill="#1B1E22"/>'
    + [0, 1, 2].map((f) => [0, 1, 2].map((c) => `<rect x="${38.9 + c * 3.9}" y="${44 + f * 4.4}" width="2.6" height="2.6" rx=".7" fill="${['#FFB347', '#7FD67F', '#fff'][(f + c) % 3]}"/>`).join('')).join('')
    + '</g>' },
  Dani: { cuerpo: '#1F2A3A', encima: '<path d="M26.6 43.6h10.8L32 59z" fill="#fff"/>'
    + '<path d="M26.6 43.6 32 59l-3.4 2.4-5.2-15.6zM37.4 43.6 32 59l3.4 2.4 5.2-15.6z" fill="#2E3D52"/>'
    + '<path d="M30.7 44.4h2.6l.6 2.2-1.9.9-1.9-.9zM30.3 47.3l1.7-.8 1.7.8.7 8.5-2.4 2.6-2.4-2.6z" fill="#C8102E"/>' },
  Andrés: { detras: ORBITA, encima: `<clipPath id="orbita-delante"><rect x="0" y="40" width="64" height="24"/></clipPath><g clip-path="url(#orbita-delante)">${ORBITA}</g>` },
  Roc: { clase: 'tarta', encima: '<ellipse cx="32" cy="58.5" rx="15.5" ry="3.8" fill="#fff" stroke="#C9D1D8" stroke-width=".6"/>'
    + '<g stroke="#8A6239" stroke-width=".6" stroke-linejoin="round"><path d="M19 50.5 44.5 47v8.6L19 58.2z" fill="#FFF1C9"/>'
    + '<path d="M19 56.2 44.5 53.4v2.2L19 58.2z" fill="#C98F4E"/><path d="M19 50.5 38.5 44.2l6 2.8z" fill="#C2185B"/></g>'
    + '<g class="ondas" fill="none" stroke="#1F4FA8" stroke-width="1.8" stroke-linecap="round" transform="translate(12 1) rotate(38 32.4 44.1)">'
    + '<path d="M28.6 40.6a5 5 0 0 1 7.6 0"/><path d="M25.8 37.6a9 9 0 0 1 13.2 0"/><path d="M23 34.6a13 13 0 0 1 18.8 0"/></g>' },
  Ibon: { clase: 'oraculo', encima: '<radialGradient id="bola-oraculo" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#F3E9FF"/>'
    + '<stop offset=".35" stop-color="#9B7BFF"/><stop offset="1" stop-color="#3B1F8C"/></radialGradient>'
    + '<path d="M24.5 64.5l2.6-5.4h9.8l2.6 5.4z" fill="#6B4A2B"/><path d="M26.2 60.4h11.6" stroke="#8A6239" stroke-width="1.4"/>'
    + '<circle class="bola" cx="32" cy="50.5" r="9.6" fill="url(#bola-oraculo)" stroke="#E7DCFF" stroke-width=".5"/>'
    + '<path class="niebla" d="M25.6 52.4c2.4-1.8 4.6 1.6 7 0s4.4-1.4 5.8.2" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>'
    + '<g class="destellos" fill="#FFF6C9"><path d="M16 38l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'
    + '<path d="M48.5 36l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/></g>' },
  Aritz: { clase: 'ausente', vacio: true, encima: '<g fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 2.4" opacity=".55">'
    + '<circle cx="32" cy="25" r="11.5"/><path d="M9 66c0-14 10.5-23 23-23s23 9 23 23"/></g>' },
  Iñakiko: { clase: 'patatas', encima: '<g transform="rotate(-16 32 44)" stroke="#4A535B" stroke-width=".9">'
    + '<rect x="8" y="51" width="3" height="5.5" rx="1" fill="#E53935"/><rect x="26" y="47" width="3.6" height="8.5" rx="1" fill="#2A2F35"/>'
    + '<rect x="2" y="37" width="18" height="14" rx="2.5" fill="#8F9AA4"/><rect x="18" y="40" width="38" height="8" rx="1.2" fill="#C9D1D8"/>'
    + '<rect x="18" y="38.8" width="3.4" height="10.4" rx=".8" fill="#8F9AA4"/><rect x="52.6" y="39.2" width="3.4" height="9.6" rx=".8" fill="#8F9AA4"/>'
    + '<g class="patata" stroke="none"><ellipse cx="60" cy="44" rx="5.4" ry="4.1" fill="#C4934F"/><circle cx="58.4" cy="42.8" r=".7" fill="#8A6230"/>'
    + '<circle cx="61.8" cy="45.2" r=".7" fill="#8A6230"/></g></g>' },
};
const AVATAR_RASGO = (r) => `<svg class="rasgo" viewBox="0 0 64 64" aria-hidden="true">${r.detras ? `${r.detras}<g fill="var(--c2)">${CABEZA}<path d="${CUERPO}"/></g>` : ''}${r.vacio ? '' : `${CABEZA}<path d="${CUERPO}"${r.cuerpo ? ` fill="${r.cuerpo}"` : ''}/>`}${r.encima || ''}</svg>`;
// con foto: el equipo de hoy (img/equipo/nombre-apellido.jpg, las del quiosco)
const fotoDe = (nombre) => `img/equipo/${nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ /g, '-')}.jpg`;
// sin apellidos salvo en el equipo de hoy (el de las fotos): el nombre completo solo sirve para reconocer a los de Kliskatek
function persona(nombre, n, extra = '', foto = false, etiqueta = foto ? nombre : nombre.split(' ')[0]) {
  const k = deKliska(nombre) >= 0 ? ' kliska' : '', r = !foto && RASGOS[nombre];
  const c = k ? '#FF8000' : TONOS[n % TONOS.length];
  return `<div class="persona${k}" style="--n:${n}"><div class="avatar${k}${r ? ` con-rasgo${r.clase ? ` ${r.clase}` : ''}` : ''}${foto ? ' foto' : ''}"${r ? ` data-nombre="${esc(nombre)}"` : ''} style="--c:${c}${r ? `;--c2:${r.c || c}` : ''}">${foto ? `<img src="${fotoDe(nombre)}" alt="">` : r ? AVATAR + AVATAR_RASGO(r) : AVATAR}</div>
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

// cada uno a su aire, y varios a la vez: la primera vez entre 0,5 y 10 s después de salir; luego lo enseña 3,5 s y descansa
// de 6 a 15 s (10,5 de media): un cuarto del tiempo con rasgo
const azar = (min, max) => (min + Math.random() * (max - min)) * 1000;
// El que sigue a otro (Julia a Santi) se enciende con él si están en la misma diapositiva; si no, va a su aire
function lucirRasgos() {
  const ahora = performance.now(), hay = $$('#diapos > .visible:not(.sale) .avatar.con-rasgo');
  const de = (nombre) => hay.find((a) => a.dataset.nombre === nombre);
  const lucir = (a) => { a.classList.add('luce'); setTimeout(() => a.matches(':hover') || a.classList.remove('luce'), 3500); };
  hay.forEach((a) => {
    const sigue = RASGOS[a.dataset.nombre].sigue;
    if (a.classList.contains('luce') || (sigue && de(sigue))) return;
    if (!a._toca) a._toca = ahora + azar(0.5, 10);
    else if (ahora >= a._toca) {
      lucir(a);
      hay.filter((b) => RASGOS[b.dataset.nombre].sigue === a.dataset.nombre).forEach(lucir);
      a._toca = ahora + 3500 + azar(6, 15);
    }
  });
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
  setInterval(lucirRasgos, 250);
  // con el ratón encima, enseña el rasgo mientras siga ahí
  $('#diapos').addEventListener('pointerover', (ev) => { const a = ev.target.closest('.avatar.con-rasgo'); if (a) a.classList.add('luce'); });
  $('#diapos').addEventListener('pointerout', (ev) => {
    const a = ev.target.closest('.avatar.con-rasgo');
    if (a && !a.contains(ev.relatedTarget)) a.classList.remove('luce');
  });

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
