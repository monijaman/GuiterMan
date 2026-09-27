// Shared fretboard, tab and sound helpers for the scales and arpeggio pages.
const themeLoader = document.createElement('script');
themeLoader.src = new URL('theme.js', document.currentScript.src).href;
document.head.append(themeLoader);

const chordModel = window.GUITAR_CHORD_DATA;
const sound = window.ChordDiagram;
const STRING_MIDI = [40, 45, 50, 55, 59, 64]; // index 0 = low E
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAX_FRET = 15;
const $ = (selector) => document.querySelector(selector);

const pitchAt = (string, fret) => (STRING_MIDI[string] + fret) % 12;
const key = (string, fret) => `${string}:${fret}`;

// ---------- fretboard renderer ----------
const layout = { left: 40, open: 36, right: 990, top: 22, gap: 31 };
layout.fretWidth = (layout.right - layout.left - layout.open) / MAX_FRET;
function xFor(fret) { return fret === 0 ? layout.left + layout.open / 2 : layout.left + layout.open + (fret - .5) * layout.fretWidth; }
function yFor(string) { return layout.top + (5 - string) * layout.gap; } // high e on top, like tab

function neckSvg(cells, { label = 'Guitar fretboard', hot = false } = {}) {
  const { left, open, right, top, gap, fretWidth } = layout;
  const bottom = top + gap * 5;
  const parts = [];
  for (let fret = 1; fret <= MAX_FRET; fret += 1) {
    const x = left + open + fret * fretWidth;
    parts.push(`<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" class="nb-fret"/>`);
  }
  parts.push(`<line x1="${left + open}" y1="${top - 2}" x2="${left + open}" y2="${bottom + 2}" class="nb-nut"/>`);
  for (const fret of [3, 5, 7, 9, 15]) parts.push(`<circle cx="${xFor(fret)}" cy="${top + gap * 2.5}" r="5" class="nb-inlay"/>`);
  parts.push(`<circle cx="${xFor(12)}" cy="${top + gap * 1.5}" r="5" class="nb-inlay"/><circle cx="${xFor(12)}" cy="${top + gap * 3.5}" r="5" class="nb-inlay"/>`);
  for (let string = 0; string < 6; string += 1) {
    parts.push(`<line x1="${left}" y1="${yFor(string)}" x2="${right}" y2="${yFor(string)}" class="nb-string" stroke-width="${(2.4 - string * .3).toFixed(1)}"/><text x="${left - 22}" y="${yFor(string) + 4}" class="nb-name">${STRING_NAMES[string]}</text>`);
  }
  for (let fret = 0; fret <= MAX_FRET; fret += 1) parts.push(`<text x="${xFor(fret)}" y="${bottom + 22}" class="nb-num${[3, 5, 7, 9, 12, 15].includes(fret) ? ' is-marked' : ''}">${fret === 0 ? 'open' : fret}</text>`);
  for (const cell of cells) {
    const x = xFor(cell.f);
    const y = yFor(cell.s);
    const ring = cell.target ? `<circle cx="${x}" cy="${y}" r="15" class="nb-ring"/>` : '';
    const text = cell.label ? `<text x="${x}" y="${y + 4}" class="nb-label${cell.label.length > 2 ? ' is-long' : ''}">${cell.label}</text>` : '';
    parts.push(`<g class="nb-cell ${cell.cls ?? ''}" data-s="${cell.s}" data-f="${cell.f}"><title>${cell.title ?? ''}</title>${ring}<circle cx="${x}" cy="${y}" r="${hot ? 14 : 11.5}" class="nb-dot"/>${text}</g>`);
  }
  return `<svg class="nb" viewBox="0 0 1000 ${bottom + 32}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}
function wirePlayback(container) {
  container.addEventListener('click', (event) => {
    const cell = event.target.closest('[data-s]');
    if (!cell || container.dataset.quiz) return;
    sound.pluck(Number(cell.dataset.s), Number(cell.dataset.f));
    flash(container, cell.dataset.s, cell.dataset.f);
  });
}
function flash(container, string, fret, time = 380) {
  const cell = container.querySelector(`[data-s="${string}"][data-f="${fret}"]`);
  if (!cell) return;
  cell.classList.add('is-playing');
  setTimeout(() => cell.classList.remove('is-playing'), time);
}

function voicingFor(root, quality) {
  const open = chordModel.openShapes[`${root}:${quality}`];
  return open ? open.frets : chordModel.findVoicings(root, quality, 3)[0]?.frets;
}
function tabText(note, fret) {
  const [, , , technique] = note;
  if (technique === 'b') return `${fret}b${fret + 2}`;
  if (technique === 'h') return `h${fret}`;
  if (technique === 'p') return `p${fret}`;
  if (technique === 's') return `/${fret}`;
  if (technique === 'v') return `${fret}~`;
  return `${fret}`;
}
// Tab notes: [string, fretOffset, beats, technique]; null = rest, '|' = bar line, { chord } = chord name above.
function tabSvg(lick, rootFret, unit = 44) {
  const lineY = (string) => 24 + (5 - string) * 15;
  let x = 30;
  const items = lick.notes.map((note, index) => {
    const at = x;
    if (note === '|') { x += 14; return `<line x1="${at + 7}" y1="${lineY(5)}" x2="${at + 7}" y2="${lineY(0)}" class="tab-bar"/>`; }
    if (note && !Array.isArray(note)) return `<text x="${at}" y="11" class="tab-chord">${note.chord}</text>`;
    x += (note ? note[2] : 1) * unit;
    if (!note) return `<text x="${at + 8}" y="${lineY(3) + 8}" class="tab-rest">𝄽</text>`;
    // ['stack', [[string, fret], ...], beats]: several strings picked together (a pinch).
    if (note[0] === 'stack') return `<g data-index="${index}">${note[1].map(([string, fret]) => `<rect x="${at + 1}" y="${lineY(string) - 7}" width="14" height="14" class="tab-bg"/><text x="${at + 8}" y="${lineY(string) + 4}" class="tab-note">${rootFret + fret}</text>`).join('')}</g>`;
    const fret = rootFret + note[1];
    const label = tabText(note, fret);
    const y = lineY(note[0]);
    const width = label.length * 7.4 + 6;
    return `<g data-index="${index}"><rect x="${at + 8 - width / 2}" y="${y - 7}" width="${width}" height="14" class="tab-bg"/><text x="${at + 8}" y="${y + 4}" class="tab-note">${label}</text></g>`;
  });
  const width = Math.max(x + 10, 260);
  const lines = STRING_NAMES.map((name, string) => `<line x1="20" y1="${lineY(string)}" x2="${width - 4}" y2="${lineY(string)}" class="tab-line"/><text x="2" y="${lineY(string) + 4}" class="tab-name">${name}</text>`).join('');
  return `<svg class="tab" viewBox="0 0 ${width} 110" style="width:${width}px" role="img" aria-label="Tab for ${lick.name}">${lines}${items.join('')}</svg>`;
}
