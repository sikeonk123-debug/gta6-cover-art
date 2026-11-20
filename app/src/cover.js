// Neon Coast cover engine: draws a multi-panel sunset-neon poster onto a canvas.
//
// The engine is the app's own design: panels of the person's photos, a
// gradient-map colour grade, bold Anton title lettering with a Pacifico
// script subtitle, grain and a vignette. No Rockstar logo, artwork or font
// is used anywhere; the fonts are Anton and Pacifico under the SIL OFL,
// vendored under app/fonts/.

export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
  { id: '1080x1920', w: 1080, h: 1920, label: 'Story 1080 × 1920' },
];

export const LAYOUTS = [
  { id: 'quad', name: 'Four panels', panels: 4 },
  { id: 'hero', name: 'Hero + three', panels: 4 },
  { id: 'full', name: 'Full bleed', panels: 1 },
  { id: 'nine', name: 'Nine grid', panels: 8 },
  { id: 'tilt', name: 'Tilted snaps', panels: 3 },
  { id: 'duo', name: 'Split duo', panels: 2 },
];

export const GRADES = [
  {
    id: 'sunset', name: 'Sunset',
    stops: [[0, [26, 8, 54]], [0.35, [122, 28, 92]], [0.65, [214, 69, 90]], [0.85, [255, 138, 61]], [1, [255, 209, 102]]],
    wash: 'rgba(255, 110, 60, 0.10)',
  },
  {
    id: 'neon', name: 'Neon',
    stops: [[0, [8, 8, 38]], [0.35, [16, 90, 120]], [0.6, [0, 229, 199]], [0.8, [255, 46, 136]], [1, [255, 240, 250]]],
    wash: 'rgba(255, 46, 136, 0.08)',
  },
  {
    id: 'vice', name: 'Vice',
    stops: [[0, [16, 8, 46]], [0.4, [109, 40, 217]], [0.7, [236, 72, 153]], [0.9, [251, 191, 36]], [1, [255, 245, 220]]],
    wash: 'rgba(124, 58, 237, 0.10)',
  },
  {
    id: 'heat', name: 'Heat',
    stops: [[0, [24, 4, 4]], [0.35, [150, 20, 20]], [0.65, [249, 115, 22]], [0.9, [253, 224, 130]], [1, [255, 250, 230]]],
    wash: 'rgba(249, 115, 22, 0.08)',
  },
  {
    id: 'mono', name: 'Mono',
    stops: [[0, [10, 10, 12]], [0.5, [120, 118, 120]], [1, [250, 246, 240]]],
    wash: 'rgba(255, 210, 160, 0.06)',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** Panel rectangles for a layout, in canvas pixels. `band` is the title zone. */
export function layoutRects(id, W, H) {
  const g = Math.max(4, Math.round(W * 0.008));
  const bandH = Math.round(H * 0.2);
  const top = H - bandH;
  switch (id) {
    case 'hero': {
      const lw = Math.round(W * 0.6) - g;
      const rw = W - lw - g * 3;
      const rh = (top - g * 4) / 3;
      return {
        panels: [
          { x: g, y: g, w: lw, h: top - g * 2 },
          { x: lw + g * 2, y: g, w: rw, h: rh },
          { x: lw + g * 2, y: g * 2 + rh, w: rw, h: rh },
          { x: lw + g * 2, y: g * 3 + rh * 2, w: rw, h: rh },
        ],
        band: { x: 0, y: top, w: W, h: bandH },
      };
    }
    case 'full':
      return { panels: [{ x: 0, y: 0, w: W, h: top }], band: { x: 0, y: top, w: W, h: bandH } };
    case 'nine': {
      const cw = (W - g * 4) / 3;
      const ch = (H - g * 4) / 3;
      const panels = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue;
          panels.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch });
        }
      }
      return { panels, band: { x: g + cw + g, y: g + ch + g, w: cw, h: ch, center: true } };
    }
    case 'tilt': {
      const pw = W * 0.46;
      const ph = H * 0.52;
      return {
        panels: [
          { x: W * 0.06, y: H * 0.16, w: pw, h: ph, rot: -0.07 },
          { x: W * 0.5, y: H * 0.1, w: pw, h: ph, rot: 0.05 },
          { x: W * 0.27, y: H * 0.42, w: pw, h: ph, rot: -0.02 },
        ],
        band: { x: 0, y: 0, w: W, h: Math.round(H * 0.12), top: true },
      };
    }
    case 'duo': {
      const cw = (W - g * 3) / 2;
      return {
        panels: [
          { x: g, y: g, w: cw, h: top - g * 2 },
          { x: g * 2 + cw, y: g, w: cw, h: top - g * 2 },
        ],
        band: { x: 0, y: top, w: W, h: bandH },
      };
    }
    case 'quad':
    default: {
      const cw = (W - g * 3) / 2;
      const ch = (top - g * 3) / 2;
      return {
        panels: [
          { x: g, y: g, w: cw, h: ch },
          { x: g * 2 + cw, y: g, w: cw, h: ch },
          { x: g, y: g * 2 + ch, w: cw, h: ch },
          { x: g * 2 + cw, y: g * 2 + ch, w: cw, h: ch },
        ],
        band: { x: 0, y: top, w: W, h: bandH },
      };
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Maps a pixel's luminance through a grade's colour ramp. */
function rampColor(stops, t) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t <= t1) {
      const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return stops[stops.length - 1][1];
}

let grainCanvas = null;
function grainPattern(ctx) {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 140;
    grainCanvas.height = 140;
    const g = grainCanvas.getContext('2d');
    const data = g.createImageData(140, 140);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  return ctx.createPattern(grainCanvas, 'repeat');
}

/** Draws one photo into a panel rect, cover-fit with the panel's crop. */
function drawPanelPhoto(ctx, photo, rect, crop, grade) {
  const off = document.createElement('canvas');
  const scale = Math.min(1, 640 / Math.max(rect.w, rect.h));
  off.width = Math.max(2, Math.round(rect.w * scale));
  off.height = Math.max(2, Math.round(rect.h * scale));
  const o = off.getContext('2d');
  const zoom = crop.zoom || 1;
  const base = Math.max(off.width / photo.naturalWidth, off.height / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * base;
  const ph = photo.naturalHeight * base;
  const dx = (off.width - pw) / 2 + (crop.ox || 0) * off.width;
  const dy = (off.height - ph) / 2 + (crop.oy || 0) * off.height;
  o.drawImage(photo, dx, dy, pw, ph);
  const image = o.getImageData(0, 0, off.width, off.height);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const [r, g, b] = rampColor(grade.stops, lum);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  o.putImageData(image, 0, 0);
  ctx.save();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.drawImage(off, 0, 0, rect.w, rect.h);
  } else {
    ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

/** Draws the empty-panel placeholder where no photo is loaded yet. */
function drawPanelEmpty(ctx, rect, grade) {
  const [r, g, b] = rampColor(grade.stops, 0.35);
  ctx.save();
  ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.setLineDash([Math.max(8, rect.w * 0.03), Math.max(6, rect.w * 0.02)]);
  ctx.strokeRect(rect.x + rect.w * 0.08, rect.y + rect.h * 0.08, rect.w * 0.84, rect.h * 0.84);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `bold ${Math.max(14, rect.w * 0.05)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+ ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

/** Fits text to a width, shrinking the size and wrapping to two lines at most. */
function fitTitle(ctx, text, family, maxWidth, startSize, minSize) {
  let size = startSize;
  const lines = [text];
  while (size > minSize) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return { size, lines };
    size -= 2;
  }
  ctx.font = `${size}px ${family}`;
  if (ctx.measureText(text).width <= maxWidth) return { size, lines };
  const words = text.split(' ');
  if (words.length < 2) return { size, lines };
  for (let cut = 1; cut < words.length; cut++) {
    const a = words.slice(0, cut).join(' ');
    const b = words.slice(cut).join(' ');
    if (ctx.measureText(a).width <= maxWidth && ctx.measureText(b).width <= maxWidth) {
      return { size, lines: [a, b] };
    }
  }
  return { size, lines };
}

function drawTitleBlock(ctx, state, band, W, H) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const badge = (state.badge || '').trim().toUpperCase();
  if (band.center) {
    // Title block inside the nine-grid's middle cell.
    ctx.save();
    const grad = ctx.createLinearGradient(band.x, band.y, band.x, band.y + band.h);
    grad.addColorStop(0, '#171233');
    grad.addColorStop(1, '#0a0819');
    ctx.fillStyle = grad;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.strokeStyle = 'rgba(255, 93, 162, 0.8)';
    ctx.lineWidth = Math.max(2, band.w * 0.008);
    ctx.strokeRect(band.x + band.w * 0.04, band.y + band.h * 0.04, band.w * 0.92, band.h * 0.92);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = band.x + band.w / 2;
    ctx.fillStyle = '#ffd166';
    ctx.font = `${Math.max(12, band.h * 0.09)}px system-ui, sans-serif`;
    ctx.fillText('★ ★ ★ ★ ★', cx, band.y + band.h * 0.16);
    const fit = fitTitle(ctx, title || 'UNTITLED', 'Anton, sans-serif', band.w * 0.86, band.h * 0.2, 12);
    ctx.font = `${fit.size}px Anton, sans-serif`;
    ctx.fillStyle = '#ffffff';
    const lh = fit.size * 1.05;
    const y0 = band.y + band.h * 0.52 - ((fit.lines.length - 1) * lh) / 2;
    fit.lines.forEach((line, i) => ctx.fillText(line, cx, y0 + i * lh));
    if (subtitle) {
      ctx.fillStyle = '#ff5da2';
      ctx.font = `${Math.max(12, band.h * 0.11)}px Pacifico, cursive`;
      ctx.fillText(subtitle, cx, band.y + band.h * 0.82);
    }
    ctx.restore();
    return;
  }
  // Banded layouts: dark band with a neon rule, title left, subtitle below it.
  const grad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  grad.addColorStop(0, 'rgba(12, 10, 28, 0.72)');
  grad.addColorStop(1, 'rgba(12, 10, 28, 0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = '#ff5da2';
  ctx.fillRect(band.x, band.y, band.w, Math.max(3, band.h * 0.03));
  ctx.fillStyle = '#00e5c7';
  ctx.fillRect(band.x, band.y + Math.max(3, band.h * 0.03), band.w * 0.35, Math.max(2, band.h * 0.02));
  const pad = W * 0.04;
  const maxW = W - pad * 2 - (badge ? W * 0.16 : 0);
  const fit = fitTitle(ctx, title || 'UNTITLED', 'Anton, sans-serif', maxW, band.h * 0.52, 14);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const lh = fit.size * 1.02;
  const titleY = band.y + band.h * 0.52 + ((fit.lines.length - 1) * lh) / 2 - (subtitle ? fit.size * 0.12 : 0);
  ctx.font = `${fit.size}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8, 6, 18, 0.9)';
  ctx.lineWidth = Math.max(2, fit.size * 0.1);
  fit.lines.forEach((line, i) => {
    const y = titleY + i * lh;
    ctx.strokeText(line, pad, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, pad, y);
  });
  if (subtitle) {
    ctx.font = `${Math.max(14, band.h * 0.2)}px Pacifico, cursive`;
    ctx.fillStyle = '#ff5da2';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.max(6, band.h * 0.08);
    ctx.fillText(subtitle, pad, band.y + band.h * 0.92);
    ctx.shadowBlur = 0;
  }
  if (badge) {
    ctx.font = `bold ${Math.max(12, band.h * 0.14)}px system-ui, sans-serif`;
    try {
      ctx.letterSpacing = '3px';
    } catch {
      // Older browsers ignore letterSpacing; the badge still draws.
    }
    const bw = ctx.measureText(badge).width + band.h * 0.24;
    const bx = W - pad - bw;
    const by = band.y + band.h * 0.2;
    const bh = band.h * 0.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(1.5, band.h * 0.012);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, bx + bw / 2, by + bh / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // No-op.
    }
  }
}

/**
 * Draws the cover described by `state` onto `canvas` (its own size).
 * `photos` is a Map from photo id to an HTMLImageElement.
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = gradeById(state.grade);
  const { panels, band } = layoutRects(state.layout, W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f6f1e7';
  ctx.fillRect(0, 0, W, H);
  if (state.layout === 'tilt') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${rampColor(grade.stops, 0.75).map((v) => v | 0).join(', ')})`);
    sky.addColorStop(0.55, `rgb(${rampColor(grade.stops, 0.5).map((v) => v | 0).join(', ')})`);
    sky.addColorStop(1, `rgb(${rampColor(grade.stops, 0.15).map((v) => v | 0).join(', ')})`);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }
  panels.forEach((rect, i) => {
    const crop = state.panels[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = crop.photo ? photos.get(crop.photo) : null;
    if (rect.rot) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.008;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-rect.w / 2 - W * 0.012, -rect.h / 2 - H * 0.012, rect.w + W * 0.024, rect.h + H * 0.024);
      ctx.restore();
    }
    if (photo) {
      drawPanelPhoto(ctx, photo, rect, crop, grade);
    } else {
      drawPanelEmpty(ctx, rect, grade);
    }
    ctx.fillStyle = grade.wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(10, 8, 20, 0.25)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  // Grain, then a vignette.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  drawTitleBlock(ctx, state, band, W, H);
  return canvas;
}

/** Renders a fresh canvas at the given size. */
export function renderCover(width, height, state, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return drawCover(canvas, state, photos);
}
