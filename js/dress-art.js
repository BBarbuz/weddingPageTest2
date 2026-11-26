/* ------------------------------------------------------------------
   DressArt — generuje ilustracje sukien w SVG na podstawie parametrów
   (sylwetka, dekolt, kolor, koronka, tren...). Dzięki temu strona działa
   bez żadnych zdjęć. Gdy dodasz własne zdjęcia (pole `photos`), zastąpią
   one ilustracje.
------------------------------------------------------------------- */

const DressArt = (() => {
  let uid = 0;
  const W = 300, H = 420, HEM = 386;

  /* odbicie lustrzane ścieżki względem osi x = 150 */
  const mirror = (d) =>
    d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(W - +x).toFixed(1)},${y}`);

  const SKIRT = {
    aline: {
      d: `M124,150 C114,220 84,320 62,${HEM} Q150,${HEM + 12} 238,${HEM} C216,320 186,220 176,150 Z`,
      hw: 88, fold: { sy: 156, sw: 22, cy: 270, cw: 52 },
    },
    ball: {
      d: `M124,150 C76,176 30,292 20,${HEM} Q150,${HEM + 14} 280,${HEM} C270,292 224,176 176,150 Z`,
      hw: 130, fold: { sy: 158, sw: 30, cy: 250, cw: 96 },
    },
    mermaid: {
      d: `M124,150 C116,200 120,262 128,292 C112,332 82,364 60,${HEM + 2} Q150,${HEM + 12} 240,${HEM + 2} C218,364 188,332 172,292 C180,262 184,200 176,150 Z`,
      hw: 90, fold: { sy: 296, sw: 20, cy: 345, cw: 50 },
    },
    sheath: {
      d: `M124,150 C120,220 112,320 104,${HEM + 2} Q150,${HEM + 8} 196,${HEM + 2} C188,320 180,220 176,150 Z`,
      hw: 46, fold: { sy: 170, sw: 24, cy: 280, cw: 36 },
    },
  };

  /* górna krawędź gorsetu: zawsze od (112,86) do (188,86) */
  const NECK = {
    sweetheart:  'M112,86 Q114,74 128,74 Q144,74 150,92 Q156,74 172,74 Q186,74 188,86',
    v:           'M112,86 L117,50 L128,48 L150,112 L172,48 L183,50 L188,86',
    offshoulder: 'M112,86 Q150,100 188,86',
    square:      'M112,86 L117,48 L127,48 L128,94 L172,94 L173,48 L183,48 L188,86',
    bateau:      'M112,86 L115,52 Q150,64 185,52 L188,86',
    halter:      'M112,86 Q126,78 138,46 L144,44 Q150,74 156,44 L162,46 Q174,78 188,86',
  };
  const BODY = ' C192,106 180,132 176,150 L124,150 C120,132 108,106 112,86 Z';

  const SLEEVE_L = 'M117,50 Q102,54 98,72 L84,168 Q90,172 97,170 L113,98 Q114,90 112,86 Z';
  const BAND_L = 'M112,86 Q100,82 88,90 L92,104 Q102,97 114,101 Z';
  const SASH = 'M123,143 Q150,148 177,143 L176.5,155 Q150,160 123.5,155 Z';

  /* ---------- kolory ---------- */
  const rgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lum = (hex) => {
    const [r, g, b] = rgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const shade = (hex, amt) => {
    const c = rgb(hex).map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
    return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  };

  const trainPath = (hw) => {
    const l = 150 - hw, r = 150 + hw;
    return `M${l},${HEM - 2} Q150,${HEM + 10} ${r},${HEM - 2} Q${r + 30},${HEM + 8} ${r + 22},${HEM + 14} Q150,${HEM + 30} ${l - 22},${HEM + 14} Q${l - 30},${HEM + 8} ${l},${HEM - 2} Z`;
  };

  const foldPaths = (sk) => {
    const { sy, sw, cy, cw } = sk.fold;
    return [-0.8, -0.5, -0.2, 0.1, 0.4, 0.7]
      .map((t) => `M${150 + t * sw},${sy} Q${150 + t * cw},${cy} ${150 + t * sk.hw * 0.96},${HEM + 4}`)
      .join(' ');
  };

  function render(p, hex, opts = {}) {
    const id = 'da' + ++uid;
    const vb = opts.viewBox || `0 0 ${W} ${H}`;
    const sk = SKIRT[p.silhouette] || SKIRT.aline;
    const light = lum(hex) > 0.72;
    const outline = light ? 'rgba(110,85,60,.22)' : 'rgba(0,0,0,.28)';
    const laceC = light ? 'rgba(140,112,82,.42)' : 'rgba(255,255,255,.32)';
    const sparkC = light ? '#C9AE7E' : '#FFFFFF';
    const bodice = (NECK[p.neckline] || NECK.sweetheart) + BODY;
    const train = p.train ? trainPath(sk.hw) : '';
    const hasSleeves = p.sleeves && p.neckline !== 'offshoulder';
    const sashC = light ? '#D8C09A' : shade(hex, -0.25);

    const sleeves = hasSleeves
      ? [SLEEVE_L, mirror(SLEEVE_L)]
          .map((d) => `<path d="${d}" fill="${hex}" fill-opacity=".42" stroke="${outline}" stroke-width=".8"/>
                       <path d="${d}" fill="url(#${id}l)" opacity=".9"/>`)
          .join('')
      : '';

    const bands = p.neckline === 'offshoulder'
      ? [BAND_L, mirror(BAND_L)]
          .map((d) => `<path d="${d}" fill="${shade(hex, light ? -0.02 : 0.04)}" stroke="${outline}" stroke-width=".8"/>`)
          .join('')
      : '';

    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Suknia ${p.name}" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="${id}s" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".16"/>
      <stop offset=".3" stop-color="#000" stop-opacity="0"/>
      <stop offset=".46" stop-color="#fff" stop-opacity="${light ? 0.35 : 0.14}"/>
      <stop offset=".62" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".2"/>
    </linearGradient>
    <linearGradient id="${id}v" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".12"/>
      <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".1"/>
    </linearGradient>
    <radialGradient id="${id}g" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#3a2a1e" stop-opacity=".22"/>
      <stop offset="1" stop-color="#3a2a1e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}mf" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="${HEM}">
      <stop offset="0" stop-color="#fff"/>
      <stop offset=".75" stop-color="#fff" stop-opacity=".15"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="url(#${id}mf)"/>
    </mask>
    <pattern id="${id}l" width="16" height="16" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="${laceC}" stroke-width=".7">
        <circle cx="8" cy="8" r="1.8"/>
        <circle cx="4.6" cy="8" r="1.5"/><circle cx="11.4" cy="8" r="1.5"/>
        <circle cx="8" cy="4.6" r="1.5"/><circle cx="8" cy="11.4" r="1.5"/>
        <path d="M0,0 Q4,2 0,4 M16,0 Q12,2 16,4 M0,16 Q4,14 0,12 M16,16 Q12,14 16,12"/>
      </g>
    </pattern>
    <pattern id="${id}k" width="9" height="11" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="3" r=".7" fill="${sparkC}" fill-opacity=".85"/>
      <circle cx="6.5" cy="8.5" r=".55" fill="${sparkC}" fill-opacity=".7"/>
    </pattern>
    <clipPath id="${id}c">
      ${train ? `<path d="${train}"/>` : ''}<path d="${sk.d}"/><path d="${bodice}"/>
    </clipPath>
  </defs>
  <ellipse cx="150" cy="${HEM + 10}" rx="${sk.hw + 34}" ry="12" fill="url(#${id}g)"/>
  ${train ? `<path d="${train}" fill="${shade(hex, -0.05)}" stroke="${outline}"/>` : ''}
  ${sleeves}
  <path d="${sk.d}" fill="${hex}" stroke="${outline}"/>
  <path d="${bodice}" fill="${hex}" stroke="${outline}"/>
  <g clip-path="url(#${id}c)">
    <path d="${foldPaths(sk)}" fill="none" stroke="#fff" stroke-opacity="${light ? 0.9 : 0.12}" stroke-width="1.6"/>
    <path d="${foldPaths(sk)}" fill="none" stroke="#000" stroke-opacity="${light ? 0.05 : 0.18}" stroke-width="1" transform="translate(3 0)"/>
    ${p.lace ? `<path d="${bodice}" fill="url(#${id}l)"/>` : ''}
    ${p.lace === 'full' ? `<path d="${sk.d}" fill="url(#${id}l)" mask="url(#${id}m)"/>` : ''}
    ${p.sparkle ? `<path d="${sk.d}" fill="url(#${id}k)"/>${train ? `<path d="${train}" fill="url(#${id}k)"/>` : ''}` : ''}
    <rect width="${W}" height="${H}" fill="url(#${id}s)"/>
    <rect width="${W}" height="${H}" fill="url(#${id}v)"/>
  </g>
  ${p.sash ? `<path d="${SASH}" fill="${sashC}" stroke="${outline}" stroke-width=".6"/>` : ''}
  ${bands}
</svg>`;
  }

  return { render, lum };
})();
