// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo; ?shot=cover shows the cover alone. The query picks the scene:
// `photo` is the sample (samples/<photo>.jpg), `layout`, `grade`, `caption`
// the title words, `subtitle`, `badge` and `size` (WxH). window.__shotReady
// is set once the scene has painted.
export function shotParams(query) {
  return {
    shot: query.get('shot'),
    photo: query.get('photo') ?? 'pier',
    layout: query.get('layout') ?? 'quad',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'neon coast',
    badge: query.get('badge') ?? 'NEON COAST',
    size: query.get('size') ?? '1080x1080',
  };
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
