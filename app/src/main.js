// Neon Coast Cover Studio: the editor. A photo and a caption become a
// multi-panel sunset-neon poster, exported as a PNG. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCover, LAYOUTS, GRADES, SIZES, layoutById, layoutRects } from './cover.js';
import { shotParams, markShotReady } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelList = document.getElementById('panelList');
const photoList = document.getElementById('photoList');

/** The photo registry: id -> loaded image. Samples ship with the app. */
const photos = new Map();
let uploadCount = 0;

function defaultPanels(count, photoId) {
  const crops = [
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1.4, ox: -0.12, oy: 0.08 },
    { zoom: 1.3, ox: 0.14, oy: -0.06 },
    { zoom: 1.6, ox: 0, oy: 0.12 },
    { zoom: 1.2, ox: -0.08, oy: -0.1 },
    { zoom: 1.5, ox: 0.1, oy: 0.1 },
    { zoom: 1.35, ox: 0, oy: -0.12 },
    { zoom: 1.7, ox: -0.14, oy: 0 },
  ];
  return Array.from({ length: count }, (_, i) => ({
    photo: photoId,
    zoom: crops[i % crops.length].zoom,
    ox: crops[i % crops.length].ox,
    oy: crops[i % crops.length].oy,
  }));
}

let state = {
  layout: 'quad',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'neon coast',
  badge: 'NEON COAST',
  size: '1080x1080',
  panels: defaultPanels(4, 'pier'),
};
let selectedPanel = 0;

/** Undo/redo history: JSON snapshots of the state, newest last. */
const past = [];
const future = [];
function snapshot() {
  return JSON.stringify(state);
}
function commit() {
  past.push(snapshot());
  if (past.length > 60) past.shift();
  future.length = 0;
  syncHistoryButtons();
}
function restore(json) {
  state = JSON.parse(json);
  if (selectedPanel >= state.panels.length) selectedPanel = 0;
  syncControls();
  redraw();
}
function undo() {
  if (!past.length) return;
  future.push(snapshot());
  restore(past.pop());
  syncHistoryButtons();
}
function redo() {
  if (!future.length) return;
  past.push(snapshot());
  restore(future.pop());
  syncHistoryButtons();
}
function syncHistoryButtons() {
  document.getElementById('undo').disabled = past.length === 0;
  document.getElementById('redo').disabled = future.length === 0;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(id) {
  if (!photos.has(id)) photos.set(id, await loadImage(`samples/${id}.jpg`));
  return photos.get(id);
}

/** Resizes the panels array when the layout changes, keeping existing crops. */
function applyLayout(id) {
  const count = layoutById(id).panels;
  const firstPhoto = state.panels[0]?.photo ?? 'pier';
  const kept = state.panels.slice(0, count);
  while (kept.length < count) kept.push({ photo: firstPhoto, zoom: 1.2, ox: 0, oy: 0 });
  state.panels = kept;
  state.layout = id;
}

function sizeOf() {
  return SIZES.find((s) => s.id === state.size) ?? SIZES[0];
}

function redraw() {
  const { w, h } = sizeOf();
  const full = document.body.classList.contains('shot-cover');
  const scale = full ? 1 : Math.min(1, 720 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  drawCover(canvas, state, photos);
  drawSelection();
  document.getElementById('sizeLabel').textContent = `${w} × ${h}`;
}

/** Outlines the selected panel on the preview (preview only, never exported). */
function drawSelection() {
  if (document.body.classList.contains('shot-cover')) return;
  const { panels } = layoutRects(state.layout, canvas.width, canvas.height);
  const rect = panels[selectedPanel];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff5da2';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`PANEL ${selectedPanel + 1}`, rect.x + 8, rect.y + 20);
  ctx.restore();
}

function syncControls() {
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  syncPanelList();
  syncPhotoList();
  syncCropControls();
}

function syncPanelList() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === selectedPanel ? ' active' : '');
    b.textContent = `Panel ${i + 1}${panel.photo ? '' : ' · empty'}`;
    b.addEventListener('click', () => {
      selectedPanel = i;
      syncPanelList();
      syncCropControls();
      redraw();
    });
    panelList.appendChild(b);
  });
}

function syncPhotoList() {
  photoList.innerHTML = '';
  for (const [id, img] of photos) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.panels[selectedPanel]?.photo === id ? ' active' : '');
    b.title = id;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = id;
    b.appendChild(thumb);
    b.addEventListener('click', () => {
      commit();
      state.panels[selectedPanel].photo = id;
      syncPhotoList();
      redraw();
    });
    photoList.appendChild(b);
  }
}

function syncCropControls() {
  const panel = state.panels[selectedPanel];
  if (!panel) return;
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('panX').value = panel.ox;
  document.getElementById('panY').value = panel.oy;
  document.getElementById('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
}

function download(canvasEl, name) {
  canvasEl.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

function exportOne(size) {
  const cover = renderCover(size.w, size.h, state, photos);
  download(cover, `cover-${size.w}x${size.h}.png`);
  status.textContent = `Saved cover-${size.w}x${size.h}.png`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exportAll() {
  for (const size of SIZES) {
    exportOne(size);
    await sleep(450);
  }
  status.textContent = `Saved all ${SIZES.length} sizes.`;
}

function buildControlRows() {
  const layoutRow = document.getElementById('layoutRow');
  LAYOUTS.forEach((layout) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = layout.id;
    b.textContent = layout.name;
    b.addEventListener('click', () => {
      commit();
      applyLayout(layout.id);
      syncControls();
      redraw();
    });
    layoutRow.appendChild(b);
  });
  const gradeRow = document.getElementById('gradeRow');
  GRADES.forEach((grade) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip swatch';
    b.dataset.grade = grade.id;
    b.style.setProperty('--sw', `rgb(${grade.stops[2][1].map((v) => v | 0).join(', ')})`);
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      commit();
      state.grade = grade.id;
      syncControls();
      redraw();
    });
    gradeRow.appendChild(b);
  });
  const sizeRow = document.getElementById('sizeRow');
  SIZES.forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.size = size.id;
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.size = size.id;
      syncControls();
      redraw();
    });
    sizeRow.appendChild(b);
  });
}

function wireEditor() {
  buildControlRows();
  document.getElementById('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('title').addEventListener('change', commit);
  document.getElementById('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('subtitle').addEventListener('change', commit);
  document.getElementById('badge').addEventListener('input', (e) => {
    state.badge = e.target.value;
    redraw();
  });
  document.getElementById('badge').addEventListener('change', commit);
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    syncCropControls();
    redraw();
  });
  document.getElementById('zoom').addEventListener('change', commit);
  document.getElementById('panX').addEventListener('input', (e) => {
    state.panels[selectedPanel].ox = Number(e.target.value);
    redraw();
  });
  document.getElementById('panX').addEventListener('change', commit);
  document.getElementById('panY').addEventListener('input', (e) => {
    state.panels[selectedPanel].oy = Number(e.target.value);
    redraw();
  });
  document.getElementById('panY').addEventListener('change', commit);
  document.getElementById('fillAll').addEventListener('click', () => {
    commit();
    const photo = state.panels[selectedPanel].photo;
    state.panels.forEach((p) => {
      p.photo = photo;
    });
    syncPhotoList();
    redraw();
  });
  document.getElementById('resetCrop').addEventListener('click', () => {
    commit();
    state.panels[selectedPanel].zoom = 1;
    state.panels[selectedPanel].ox = 0;
    state.panels[selectedPanel].oy = 0;
    syncCropControls();
    redraw();
  });
  document.getElementById('addPhoto').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const id = `up${++uploadCount}`;
      const img = await loadImage(URL.createObjectURL(file));
      photos.set(id, img);
      state.panels[selectedPanel].photo = id;
    }
    commit();
    syncPhotoList();
    redraw();
    e.target.value = '';
  });
  document.getElementById('export').addEventListener('click', () => exportOne(sizeOf()));
  document.getElementById('exportAll').addEventListener('click', exportAll);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);

  // Drag to pan the selected panel's photo; scroll to zoom it.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const { panels } = layoutRects(state.layout, canvas.width, canvas.height);
    const hit = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (hit === -1) return;
    selectedPanel = hit;
    syncPanelList();
    syncCropControls();
    dragging = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[selectedPanel];
    panel.ox = dragging.ox + ((e.clientX - dragging.x) / rect.width) * (canvas.width / rect.width);
    panel.oy = dragging.oy + ((e.clientY - dragging.y) / rect.height) * (canvas.height / rect.height);
    syncCropControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = null;
      commit();
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selectedPanel];
    panel.zoom = Math.min(4, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
    syncCropControls();
    redraw();
  }, { passive: false });
}

async function init() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  wireEditor();
  await loadSample('pier');
  await loadSample('boulevard');
  if (shot) {
    const scene = shotParams(query);
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    state.badge = scene.badge;
    state.size = scene.size;
    state.panels = defaultPanels(layoutById(scene.layout).panels, scene.photo);
    if (shot === 'cover') document.body.classList.add('shot-cover');
    await document.fonts.ready;
    syncControls();
    redraw();
    markShotReady();
    return;
  }
  await document.fonts.ready;
  syncControls();
  syncPhotoList();
  redraw();
}

init();
