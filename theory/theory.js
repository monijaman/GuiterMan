// Music theory page. Shared helpers (tabSvg, sound, chordModel, flash, neckSvg, STRING_MIDI, $...) come from ../fretboard.js.

const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1];
const MINOR_STEPS = [2, 1, 2, 2, 1, 2, 2];
const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
const MAJOR_QUALITIES = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
const MINOR_QUALITIES = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
const SUFFIX = { major: '', minor: 'm', diminished: 'dim', dominant7: '7' };
const QUALITY_SHORT = { major: 'Maj', minor: 'Min', diminished: 'Dim' };

// Open shapes used by the chord-linking lessons, low E first (null = don't play).
const SHAPES = {
  C: [null, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], D: [null, null, 0, 2, 3, 2], A: [null, 0, 2, 2, 2, 0], E: [0, 2, 2, 1, 0, 0],
  F: [null, null, 3, 2, 1, 1], Am: [null, 0, 2, 2, 1, 0], Em: [0, 2, 2, 0, 0, 0], Dm: [null, null, 0, 2, 3, 1], B7: [null, 2, 1, 2, 0, 2]
};
const KEY_CHORDS = { C: ['C', 'Dm', 'Em', 'F', 'G', 'Am'], G: ['G', 'Am', 'C', 'D', 'Em'], D: ['D', 'Em', 'G', 'A'], A: ['A', 'D', 'E'], E: ['E', 'A', 'B7'] };

const stepName = (semitones) => (Math.abs(semitones) === 1 ? 'S' : Math.abs(semitones) === 2 ? 'T' : 'jump');
const pcOf = (name) => (NATURAL[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + 12) % 12;
const pretty = (name) => name.replace(/b(?=$|m|dim)/, '♭').replace(/^([A-G])b/, '$1♭');

// Spell a 7-note scale so each letter appears once: returns [{ name, pc }].
function spellScale(root, steps = MAJOR_STEPS) {
  const letter = LETTERS.indexOf(root[0]);
  let pitch = pcOf(root);
  return steps.map((step, index) => {
    const natural = LETTERS[(letter + index) % 7];
    let accidental = (pitch - NATURAL[natural] + 12) % 12;
    if (accidental > 6) accidental -= 12;
    const note = { name: natural + (accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental)), pc: pitch };
    pitch = (pitch + step) % 12;
    return note;
  });
}
function parseChord(name) {
  const match = name.match(/^([A-G][#b]?)(m|7)?$/);
  return { root: match[1], quality: match[2] === 'm' ? 'minor' : match[2] === '7' ? 'dominant7' : 'major' };
}
function boxSvg(frets, root, quality, title) {
  const modelRoot = chordModel.roots[pcOf(root)];
  return sound.svg(frets, chordModel.voicingNotes(frets, modelRoot, quality), { title });
}
function chordBox(name) {
  const { root, quality } = parseChord(name);
  return boxSvg(SHAPES[name], root, quality, name);
}
function bassOf(name) {
  const frets = SHAPES[name];
  const string = frets.findIndex((fret) => fret !== null);
  return STRING_MIDI[string] + frets[string];
}
// Where to play a pitch: the lowest fret on the given strings, frets 0–5 first.
function posFor(midi, strings = [0, 1, 2]) {
  for (const maxFret of [5, 12]) {
    let best = null;
    for (const string of strings) {
      const fret = midi - STRING_MIDI[string];
      if (fret >= 0 && fret <= maxFret && (!best || fret < best.f)) best = { s: string, f: fret };
    }
    if (best) return best;
  }
  return strings.length < 6 ? posFor(midi, [0, 1, 2, 3, 4, 5]) : { s: 0, f: 0 };
}
const posLabel = ({ s, f }) => `${STRING_NAMES[s]}${f}`;
const stackPairs = (frets) => frets.map((fret, string) => (fret === null ? null : [string, fret])).filter(Boolean);

// ---------- the walk engine ----------
// Bass-walk from one chord's root to the next through the key's major scale; chromatic when the
// scale has nothing between them, shortened to the last two notes when the gap is too wide.
function buildWalk({ from, to, key, chromatic = false, fromBass = bassOf(from), toBass = bassOf(to) }) {
  const dir = Math.sign(toBass - fromBass);
  const between = [];
  for (let pitch = fromBass + dir; dir && pitch !== toBass; pitch += dir) between.push(pitch);
  const scale = spellScale(key);
  const inScale = (midi) => scale.find((note) => note.pc === midi % 12);
  let notes = between.filter(inScale);
  let kind = 'scale';
  let full = null;
  if (chromatic || !notes.length) { notes = between; kind = between.length ? 'chromatic' : 'direct'; }
  else if (notes.length > 3) { full = notes; notes = notes.slice(-2); kind = 'trimmed'; }
  const nameOf = (midi) => pretty(inScale(midi)?.name ?? (dir < 0 ? FLATS : SHARPS)[midi % 12]);
  const path = [fromBass, ...notes, toBass];
  return {
    from, to, key, dir, kind, notes, path, full: full?.map(nameOf),
    names: path.map(nameOf),
    kinds: path.map((midi, index) => (index === 0 ? 'is-start' : index === path.length - 1 ? 'is-end' : inScale(midi) ? 'is-pass' : 'is-chrom')),
    positions: path.map((midi) => posFor(midi))
  };
}
function explainWalk(walk) {
  const [first] = walk.names;
  const last = walk.names.at(-1);
  const inner = walk.names.slice(1, -1).join(' – ');
  const way = walk.dir > 0 ? 'up' : 'down';
  if (walk.kind === 'direct') return `${pretty(walk.from)} and ${pretty(walk.to)} share the bass note ${first}, or it is only a semitone away. Just change chord: the bass already moves smoothly.`;
  if (walk.kind === 'chromatic') return `Walking ${way} from ${first} to ${last} fret by fret gives ${inner}. At least one of these is outside the ${pretty(walk.key)} major scale, so keep it short.`;
  if (walk.kind === 'trimmed') return `The full walk ${first} – ${walk.full.join(' – ')} – ${last} is too long for one bar, so jump to the last two notes: ${inner}.`;
  return `Walk ${way} the ${pretty(walk.key)} major scale from ${first} to ${last}: ${inner}.`;
}
const KIND_LABEL = { scale: 'Scale walk', chromatic: 'Chromatic', trimmed: 'Shortened', direct: 'Direct' };

// Tab items for tabSvg: [string, fret, beats, technique, neckStep]; stacks carry [.., frets, neckStep].
function walkItems(walk, { chordBeats = Math.max(1, 4 - walk.notes.length), landBeats = 2 } = {}) {
  const last = walk.path.length - 1;
  return [
    { chord: pretty(walk.from) }, ['stack', stackPairs(SHAPES[walk.from]), chordBeats, SHAPES[walk.from], 0],
    ...walk.notes.map((midi, index) => [walk.positions[index + 1].s, walk.positions[index + 1].f, 1, undefined, index + 1]),
    '|', { chord: pretty(walk.to) }, ['stack', stackPairs(SHAPES[walk.to]), landBeats, SHAPES[walk.to], last]
  ];
}

// ---------- playback ----------
let timers = [];
function stopAll() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.theory-page .is-playing').forEach((item) => item.classList.remove('is-playing'));
}
function later(time, fn) { timers.push(setTimeout(fn, time)); }
function mark(elements, time, length) {
  elements.forEach((element) => {
    later(time, () => element.classList.add('is-playing'));
    later(time + Math.max(80, length - 30), () => element.classList.remove('is-playing'));
  });
}
function playItems(items, root, bpm = 84) {
  stopAll();
  const beat = 60000 / bpm;
  let position = 0;
  items.forEach((item, index) => {
    if (!Array.isArray(item)) return;
    const time = position * beat;
    const length = item[2] * beat;
    if (item[0] === 'stack') later(time, () => sound.strum(item[3], { level: .15, gap: .03 }));
    else later(time, () => sound.pluck(item[0], item[1], { level: .34, length: 1.1 }));
    mark([...root.querySelectorAll(`[data-index="${index}"]`)], time, length);
    if (item[4] != null) mark([...root.querySelectorAll(`[data-step="${item[4]}"]`)], time, length);
    position += item[2];
  });
}
const playable = new Map();
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-stop]')) { stopAll(); return; }
  const button = event.target.closest('[data-play-walk]');
  const entry = button && playable.get(button.dataset.playWalk);
  if (!entry) return;
  const root = button.closest('.walk-card, figure, .num-result') ?? button.closest('section');
  playItems(entry.items, root, Number(button.closest('section')?.querySelector('.tempo-select')?.value ?? 84));
});

// ---------- drawing: compact bass-zone neck ----------
const MN = { left: 38, open: 30, fw: 52, top: 34, gap: 24, frets: 5 };
const mnX = (fret) => (fret === 0 ? MN.left + MN.open / 2 : MN.left + MN.open + (fret - .5) * MN.fw);
const mnY = (string) => MN.top + (5 - string) * MN.gap;
let svgCount = 0;

function miniNeck(points, arrows = [], { label = 'Fretboard, frets 0 to 5', zone = true, className = '' } = {}) {
  const id = `mn${++svgCount}`;
  const right = MN.left + MN.open + MN.frets * MN.fw;
  const bottom = mnY(0);
  const parts = [`<defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="tn-head"/></marker></defs>`];
  if (zone) parts.push(`<rect x="${MN.left - 30}" y="${mnY(2) - 13}" width="${right - MN.left + 36}" height="${mnY(0) - mnY(2) + 26}" rx="8" class="tn-zone"/>`);
  for (let fret = 1; fret <= MN.frets; fret += 1) {
    const x = MN.left + MN.open + fret * MN.fw;
    parts.push(`<line x1="${x}" y1="${MN.top - 4}" x2="${x}" y2="${bottom + 4}" class="tn-fret"/>`);
  }
  parts.push(`<line x1="${MN.left + MN.open}" y1="${MN.top - 5}" x2="${MN.left + MN.open}" y2="${bottom + 5}" class="tn-nut"/>`);
  for (const fret of [3, 5]) parts.push(`<circle cx="${mnX(fret)}" cy="${(mnY(2) + mnY(3)) / 2}" r="4" class="tn-inlay"/>`);
  for (let string = 0; string < 6; string += 1) {
    parts.push(`<line x1="${MN.left}" y1="${mnY(string)}" x2="${right}" y2="${mnY(string)}" class="tn-string" stroke-width="${(2.6 - string * .32).toFixed(2)}"/><text x="${MN.left - 20}" y="${mnY(string) + 4}" class="tn-name">${STRING_NAMES[string]}</text>`);
  }
  for (let fret = 0; fret <= MN.frets; fret += 1) parts.push(`<text x="${mnX(fret)}" y="${MN.top - 16}" class="tn-num">${fret}</text>`);
  for (const [i, j] of arrows) {
    const a = points[i];
    const b = points[j];
    const x1 = mnX(a.f), y1 = mnY(a.s), x2 = mnX(b.f), y2 = mnY(b.s);
    let d;
    if (a.s === b.s) {
      const side = Math.sign(x2 - x1);
      d = `M${x1 + side * 7} ${y1 - 10} Q${(x1 + x2) / 2} ${y1 - 30} ${x2 - side * 8} ${y2 - 12}`;
    } else {
      const length = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / length, uy = (y2 - y1) / length;
      const sx = x1 + ux * 13, sy = y1 + uy * 13, ex = x2 - ux * 15, ey = y2 - uy * 15;
      d = `M${sx} ${sy} Q${(sx + ex) / 2} ${(sy + ey) / 2 - 9} ${ex} ${ey}`;
    }
    parts.push(`<path d="${d}" class="tn-arrow" marker-end="url(#${id})"/>`);
  }
  points.forEach((point, index) => {
    const x = mnX(point.f), y = mnY(point.s);
    const order = point.order ? `<text x="${x}" y="${y + 23}" class="tn-order">${point.order}</text>` : '';
    const tag = point.tag ? `<text x="${x + 16}" y="${y + 4}" class="tn-tag">${point.tag}</text>` : '';
    parts.push(`<g class="tn-pt ${point.cls ?? ''}" data-step="${point.step ?? index}"><title>${point.title ?? point.label}</title><circle cx="${x}" cy="${y}" r="11.5" class="tn-dot"/><text x="${x}" y="${y + 4}" class="tn-label${point.label.length > 1 ? ' is-long' : ''}">${point.label}</text>${order}${tag}</g>`);
  });
  return `<svg class="tn ${className}" viewBox="0 0 ${right + 12} ${bottom + 30}" role="img" aria-label="${label}">${parts.join('')}</svg>`;
}
function walkNeck(walk, options = {}) {
  const points = walk.positions.map((pos, index) => ({
    ...pos, label: walk.names[index], cls: walk.kinds[index], order: index && index < walk.path.length - 1 ? String(index) : '',
    title: `${walk.names[index]}: ${STRING_NAMES[pos.s]} string, ${pos.f ? `fret ${pos.f}` : 'open'}`
  }));
  const arrows = points.slice(1).map((_, index) => [index, index + 1]);
  return miniNeck(points, arrows, { label: `Bass walk ${walk.names.join(', ')}`, ...options });
}
function chainHtml(walk) {
  return walk.names.map((name, index) => {
    const step = index ? `<i class="step-${stepName(walk.path[index] - walk.path[index - 1])}">${stepName(walk.path[index] - walk.path[index - 1])}</i>` : '';
    return `${step}<span class="${walk.kinds[index]}">${name}</span>`;
  }).join('');
}
function walkCard(walk, id, text = '') {
  const items = walkItems(walk);
  playable.set(id, { items });
  return `<article class="walk-card">
    <header><h3>${pretty(walk.from)} <span aria-hidden="true">→</span> ${pretty(walk.to)}</h3><span class="walk-kind is-${walk.kind}">${KIND_LABEL[walk.kind]}</span><span class="walk-key">key of ${pretty(walk.key)}</span></header>
    <div class="walk-boxes"><div>${chordBox(walk.from)}</div><span class="walk-arrow" aria-hidden="true">→</span><div>${chordBox(walk.to)}</div></div>
    <div class="walk-neck">${walkNeck(walk)}</div>
    <p class="walk-chain">${chainHtml(walk)}</p>
    <p class="walk-frets">${walk.positions.map(posLabel).join(' → ')}</p>
    <div class="tab-scroll">${tabSvg({ name: `${walk.from} to ${walk.to}`, notes: items }, 0)}</div>
    <p class="walk-text">${text ? `${text} ` : ''}<span>${explainWalk(walk)}</span></p>
    <button class="hear-button" type="button" data-play-walk="${id}">▶ Play the link</button>
  </article>`;
}

// ---------- drawing: keyboard, ladder, staircase ----------
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
function keyboardSvg({ to = 24, marks = {}, labels = {}, steps = [] }) {
  const W = 30, H = 124, BW = 18, BH = 76;
  const whites = [];
  const blacks = [];
  for (let pitch = 0; pitch <= to; pitch += 1) (WHITE_PCS.includes(pitch % 12) ? whites : blacks).push(pitch);
  const whiteIndex = (pitch) => whites.indexOf(pitch);
  const cx = (pitch) => (WHITE_PCS.includes(pitch % 12) ? whiteIndex(pitch) * W + W / 2 : (whiteIndex(pitch - 1) + 1) * W);
  const parts = [];
  whites.forEach((pitch, index) => {
    parts.push(`<rect x="${index * W + .5}" y=".5" width="${W}" height="${H}" rx="3" class="kb-white ${marks[pitch] ?? ''}"/>`);
    if (labels[pitch]) parts.push(`<text x="${index * W + W / 2}" y="${H - 10}" class="kb-label ${marks[pitch] ?? ''}">${labels[pitch]}</text>`);
  });
  blacks.forEach((pitch) => {
    const x = cx(pitch);
    parts.push(`<rect x="${x - BW / 2}" y=".5" width="${BW}" height="${BH}" rx="2" class="kb-black ${marks[pitch] ?? ''}"/>`);
    if (labels[pitch]) parts.push(`<text x="${x}" y="${BH - 9}" class="kb-label kb-on-black ${marks[pitch] ?? ''}">${labels[pitch]}</text>`);
  });
  steps.forEach(([a, b, label]) => {
    const x1 = cx(a) + 3, x2 = cx(b) - 3;
    parts.push(`<path d="M${x1} ${H + 8} Q${(x1 + x2) / 2} ${H + 26} ${x2} ${H + 8}" class="kb-step step-${label}"/><text x="${(x1 + x2) / 2}" y="${H + 38}" class="kb-step-label step-${label}">${label}</text>`);
  });
  const width = whites.length * W + 1;
  return `<svg class="th-svg kb" viewBox="0 0 ${width} ${H + (steps.length ? 46 : 4)}" role="img" aria-label="Piano keyboard">${parts.join('')}</svg>`;
}
function scaleKeyboard(root, steps) {
  const start = pcOf(root);
  const marks = {};
  const labels = {};
  const run = [start];
  steps.forEach((step) => run.push(run.at(-1) + step));
  const names = spellScale(root, steps).map((note) => pretty(note.name));
  run.forEach((pitch, index) => { marks[pitch] = index % 7 === 0 ? 'is-root' : 'is-on'; labels[pitch] = names[index % 7]; });
  return keyboardSvg({ to: Math.max(12, run.at(-1)), marks, labels, steps: run.slice(1).map((pitch, index) => [run[index], pitch, stepName(steps[index])]) });
}
function ladderSvg() {
  const cw = 44, y = 62;
  const x = (fret) => 34 + fret * cw;
  const parts = [`<line x1="${x(0) - 14}" y1="${y}" x2="${x(12) + 18}" y2="${y}" class="ld-string"/>`];
  for (let fret = 0; fret <= 12; fret += 1) {
    const pc = (9 + fret) % 12;
    const natural = !SHARPS[pc].includes('#');
    if (fret) parts.push(`<line x1="${x(fret) - cw / 2}" y1="${y - 16}" x2="${x(fret) - cw / 2}" y2="${y + 16}" class="ld-fret"/>`);
    parts.push(`<g class="ld-note${natural ? ' is-natural' : ''}${fret % 12 === 0 ? ' is-root' : ''}" data-f="${fret}"><circle cx="${x(fret)}" cy="${y}" r="14"/><text x="${x(fret)}" y="${y + 4}">${SHARPS[pc]}</text></g><text x="${x(fret)}" y="${y + 36}" class="ld-num">${fret || 'open'}</text>`);
  }
  for (const [a, b, label] of [[0, 2, 'T'], [2, 3, 'S'], [7, 8, 'S']]) {
    parts.push(`<path d="M${x(a)} ${y - 20} Q${(x(a) + x(b)) / 2} ${y - 44} ${x(b)} ${y - 20}" class="kb-step step-${label}"/><text x="${(x(a) + x(b)) / 2}" y="${y - 40}" class="kb-step-label step-${label}">${label === 'T' ? 'T: A→B' : label === 'S' && a === 2 ? 'S: B→C' : 'S: E→F'}</text>`);
  }
  return `<svg class="th-svg ladder" viewBox="0 0 ${x(12) + 34} ${y + 46}" role="img" aria-label="Notes on the A string from open to fret 12">${parts.join('')}</svg>`;
}
function stairSvg(root, steps) {
  const names = spellScale(root, steps).map((note) => pretty(note.name));
  names.push(names[0]);
  const cw = 56, u = 11, pad = 10, base = 12 * u + 36;
  const parts = [];
  let level = 0;
  names.forEach((name, index) => {
    const h = (level + 2) * u;
    const x = pad + index * cw;
    parts.push(`<rect x="${x + 4}" y="${base - h}" width="${cw - 8}" height="${h}" rx="4" class="st-bar${index % 7 === 0 ? ' is-root' : ''}"/><text x="${x + cw / 2}" y="${base - h + 17}" class="st-name${index % 7 === 0 ? ' is-root' : ''}">${name}</text><text x="${x + cw / 2}" y="${base + 16}" class="st-deg">${index + 1 === 8 ? '8 (1)' : index + 1}</text>`);
    if (index < steps.length) {
      const label = stepName(steps[index]);
      parts.push(`<text x="${x + cw}" y="${base + 38}" class="st-step step-${label}">${label}</text>`);
      level += steps[index];
    }
  });
  parts.push(`<line x1="${pad}" y1="${base}" x2="${pad + 8 * cw}" y2="${base}" class="st-base"/>`);
  return `<svg class="th-svg stair" viewBox="0 0 ${pad * 2 + 8 * cw} ${base + 48}" role="img" aria-label="${root} scale staircase: ${names.join(' ')}">${parts.join('')}</svg>`;
}

// ---------- 01 / 02 / 03 ----------
const chromaticLabels = {};
for (let pitch = 0; pitch <= 12; pitch += 1) chromaticLabels[pitch] = SHARPS[pitch % 12];
$('#kbChromatic').innerHTML = keyboardSvg({ to: 12, labels: chromaticLabels, marks: { 4: 'is-on', 5: 'is-on', 11: 'is-on', 12: 'is-on', 0: 'is-root', 2: 'is-root' }, steps: [[0, 2, 'T'], [4, 5, 'S'], [11, 12, 'S']] });
$('#ladder').innerHTML = ladderSvg();
$('#ladder').addEventListener('click', (event) => {
  const note = event.target.closest('[data-f]');
  if (note) sound.pluck(1, Number(note.dataset.f));
});
$('#stairMajor').innerHTML = stairSvg('C', MAJOR_STEPS);
$('#kbMajor').innerHTML = scaleKeyboard('C', MAJOR_STEPS);
$('#stairMinor').innerHTML = stairSvg('A', MINOR_STEPS);
$('#kbMinor').innerHTML = scaleKeyboard('A', MINOR_STEPS);

const majorKey = $('#majorKey');
const MAJOR_ROOTS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];
majorKey.innerHTML = MAJOR_ROOTS.map((root) => `<option value="${root}">${pretty(root)} major</option>`).join('');
function renderMajorNeck() {
  const scale = spellScale(majorKey.value);
  const cells = [];
  for (let string = 0; string < 6; string += 1) {
    for (let fret = 0; fret <= MAX_FRET; fret += 1) {
      const note = scale.find((item) => item.pc === pitchAt(string, fret));
      if (note) cells.push({ s: string, f: fret, label: pretty(note.name), cls: note === scale[0] ? 'root' : '', title: pretty(note.name) });
    }
  }
  const zone = `<rect x="${layout.left - 6}" y="${yFor(2) - layout.gap / 2}" width="${xFor(5) + layout.fretWidth / 2 - layout.left + 6}" height="${layout.gap * 3}" rx="6" class="neck-zone"/>`;
  $('#majorNeck').innerHTML = neckSvg(cells, { label: `${majorKey.value} major scale on the fretboard` }).replace(/(<svg[^>]*>)/, `$1${zone}`);
  $('#majorNeckCaption').innerHTML = `<b>${pretty(majorKey.value)} major</b>: ${scale.map((note) => pretty(note.name)).join(' – ')} · T T S T T T S · click any dot to hear it`;
}
wirePlayback($('#majorNeck'));
majorKey.addEventListener('change', renderMajorNeck);
renderMajorNeck();
$('#majorPlay').addEventListener('click', () => {
  stopAll();
  const rootMidi = 40 + ((pcOf(majorKey.value) - 4 + 12) % 12);
  const run = [rootMidi];
  MAJOR_STEPS.forEach((step) => run.push(run.at(-1) + step));
  run.forEach((midi, index) => {
    const pos = posFor(midi, [0, 1, 2, 3, 4, 5]);
    later(index * 340, () => { sound.pluck(pos.s, pos.f, { length: .9 }); flash($('#majorNeck'), pos.s, pos.f, 330); });
  });
});

$('#cmpMajor').innerHTML = walkNeck(buildWalk({ from: 'G', to: 'C', key: 'C' }));
$('#cmpMinor').innerHTML = walkNeck(buildWalk({ from: 'Am', to: 'C', key: 'C' }));

// ---------- 04 chord numbers ----------
function patternSvg() {
  const W = 70, H = 54;
  const row = (numerals, qualities, y, title) => `<text x="0" y="${y - 8}" class="np-title">${title}</text>` + numerals.map((numeral, index) => `<g class="np-cell is-${qualities[index]}"><rect x="${index * W + 1}" y="${y}" width="${W - 6}" height="${H}" rx="6"/><text x="${index * W + W / 2 - 2}" y="${y + 26}" class="np-num">${numeral}</text><text x="${index * W + W / 2 - 2}" y="${y + 44}" class="np-q">${QUALITY_SHORT[qualities[index]]}</text></g>`).join('');
  return `<svg class="th-svg" viewBox="0 0 ${7 * W} ${2 * H + 62}" role="img" aria-label="Chord number pattern for major and minor keys">${row(MAJOR_NUMERALS, MAJOR_QUALITIES, 22, 'MAJOR KEY')}${row(MINOR_NUMERALS, MINOR_QUALITIES, H + 56, 'MINOR KEY')}</svg>`;
}
function stackSvg() {
  const scale = spellScale('C');
  const W = 66, S = 30, top = 8;
  const parts = [];
  scale.forEach((note, index) => {
    const tones = [0, 2, 4].map((offset) => pretty(scale[(index + offset) % 7].name));
    const quality = MAJOR_QUALITIES[index];
    tones.forEach((tone, level) => {
      const y = top + (2 - level) * (S + 4);
      parts.push(`<g class="np-cell is-${quality}${level === 0 ? ' is-base' : ''}"><rect x="${index * W + 8}" y="${y}" width="${W - 16}" height="${S}" rx="5"/><text x="${index * W + W / 2}" y="${y + 20}" class="np-tone">${tone}</text></g>`);
    });
    const y = top + 3 * (S + 4) + 18;
    parts.push(`<text x="${index * W + W / 2}" y="${y}" class="np-chord">${pretty(note.name)}${SUFFIX[quality]}</text><text x="${index * W + W / 2}" y="${y + 18}" class="np-numeral">${MAJOR_NUMERALS[index]}</text>`);
  });
  parts.push(`<text x="4" y="${top + 3 * (S + 4) + 58}" class="np-foot">Bottom row = the root. Stack the 3rd and 5th scale notes above it. Key of C.</text>`);
  return `<svg class="th-svg" viewBox="0 0 ${7 * W} ${top + 3 * (S + 4) + 66}" role="img" aria-label="Chords of C major built by stacking thirds">${parts.join('')}</svg>`;
}
$('#numberPattern').innerHTML = patternSvg();
$('#stackPic').innerHTML = stackSvg();

// Same colour stripe in every key: the chord names change, the major/minor pattern doesn't.
function familySvg(keys = ['C', 'G', 'D', 'A', 'F']) {
  const L = 64, W = 66, H = 38, top = 30;
  const parts = MAJOR_NUMERALS.map((numeral, index) => `<text x="${L + index * W + W / 2 - 3}" y="${top - 10}" class="np-numeral">${numeral}</text>`);
  keys.forEach((root, row) => {
    const y = top + row * (H + 6);
    parts.push(`<text x="0" y="${y + H / 2 + 5}" class="np-chord fm-key">Key of ${pretty(root)}</text>`);
    keyChords(root, 'major').forEach((chord, index) => parts.push(`<g class="np-cell is-${chord.quality}"><rect x="${L + index * W}" y="${y}" width="${W - 6}" height="${H}" rx="6"/><text x="${L + index * W + W / 2 - 3}" y="${y + H / 2 + 5}" class="np-tone">${chord.name.replace('dim', '°')}</text></g>`));
  });
  return `<svg class="th-svg" viewBox="-4 0 ${L + 7 * W + 4} ${top + keys.length * (H + 6)}" role="img" aria-label="The chords of C, G, D, A and F major: the same major, minor and diminished colour pattern in every key">${parts.join('')}</svg>`;
}
// Skip one, take one: each row picks scale notes 1, 3 and 5 counted from a different start.
function skipSvg(root = 'C') {
  const scale = spellScale(root);
  const L = 92, W = 36, H = 30, top = 34, cols = 11;
  const parts = [];
  for (let col = 0; col < cols; col += 1) parts.push(`<text x="${L + col * W + W / 2}" y="${top - 14}" class="sk-head${col % 7 === 0 ? ' is-root' : ''}">${pretty(scale[col % 7].name)}</text>`);
  keyChords(root, 'major').forEach((chord, row) => {
    const y = top + row * H + H / 2;
    parts.push(`<text x="0" y="${y + 5}" class="np-numeral sk-num">${chord.numeral}</text><text x="34" y="${y + 5}" class="np-chord sk-chord">${chord.name}</text>`);
    for (let col = 0; col < cols; col += 1) {
      const picked = col >= row && col <= row + 4 && (col - row) % 2 === 0;
      const x = L + col * W + W / 2;
      parts.push(picked
        ? `<g class="np-cell is-${chord.quality}"><circle cx="${x}" cy="${y}" r="12"/><text x="${x}" y="${y + 4}" class="np-q">${pretty(scale[col % 7].name)}</text></g>`
        : `<circle cx="${x}" cy="${y}" r="3" class="sk-skip"/>`);
    }
    parts.push(`<path d="M${L + row * W + W / 2 + 12} ${y}H${L + (row + 4) * W + W / 2 - 12}" class="sk-link"/>`);
  });
  return `<svg class="th-svg" viewBox="0 0 ${L + cols * W + 4} ${top + 7 * H + 6}" role="img" aria-label="Building the seven chords of ${root} major by taking every other scale note">${parts.join('')}</svg>`;
}
// Count the frets inside the chord: 4+3 = major, 3+4 = minor, 3+3 = diminished.
function gapSvg() {
  const rows = [['C', 'major', [4, 3], ['C', 'E', 'G']], ['D', 'minor', [3, 4], ['D', 'F', 'A']], ['B', 'diminished', [3, 3], ['B', 'D', 'F']]];
  const L = 96, W = 42, H = 74, top = 6;
  const parts = [];
  rows.forEach(([root, quality, gaps, names], row) => {
    const y = top + row * H + 40;
    const start = pcOf(root);
    const tones = [0, gaps[0], gaps[0] + gaps[1]];
    parts.push(`<text x="0" y="${y - 2}" class="np-chord gp-name">${root}${SUFFIX[quality]}</text><text x="0" y="${y + 15}" class="np-foot">${quality}</text>`);
    parts.push(`<line x1="${L}" y1="${y}" x2="${L + 8 * W}" y2="${y}" class="ld-string"/>`);
    for (let fret = 0; fret <= 8; fret += 1) parts.push(`<line x1="${L + fret * W}" y1="${y - 8}" x2="${L + fret * W}" y2="${y + 8}" class="ld-fret"/>`);
    for (let step = 0; step < 8; step += 1) {
      const x = L + step * W + W / 2;
      const hit = tones.indexOf(step);
      parts.push(hit >= 0
        ? `<g class="np-cell is-${quality}"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + 4}" class="np-q">${names[hit]}</text></g>`
        : `<text x="${x}" y="${y + 4}" class="gp-off">${SHARPS[(start + step) % 12]}</text>`);
    }
    gaps.forEach((gap, index) => {
      const x1 = L + tones[index] * W + W / 2, x2 = L + tones[index + 1] * W + W / 2;
      parts.push(`<path d="M${x1 + 4} ${y - 16} Q${(x1 + x2) / 2} ${y - 34} ${x2 - 4} ${y - 16}" class="kb-step ${gap === 4 ? 'step-T' : 'step-S'}"/><text x="${(x1 + x2) / 2}" y="${y - 28}" class="kb-step-label gp-gap ${gap === 4 ? 'step-T' : 'step-S'}">${gap} frets</text>`);
    });
  });
  return `<svg class="th-svg" viewBox="0 -6 ${L + 8 * W + 6} ${top + rows.length * H + 4}" role="img" aria-label="Fret gaps inside C major (4 then 3), D minor (3 then 4) and B diminished (3 then 3)">${parts.join('')}</svg>`;
}
// One song, three keys: I – V – vi – IV traces the same zig-zag through every row.
function moveSvg(progression = ['I', 'V', 'vi', 'IV'], keys = ['C', 'G', 'D']) {
  const L = 76, W = 60, H = 56, top = 40;
  const parts = MAJOR_NUMERALS.map((numeral, index) => `<text x="${L + index * W + W / 2 - 3}" y="${top - 18}" class="np-numeral">${numeral}</text>`);
  keys.forEach((root, row) => {
    const y = top + row * H;
    parts.push(`<text x="0" y="${y + 25}" class="np-chord fm-key">Key of ${pretty(root)}</text>`);
    keyChords(root, 'major').forEach((chord, index) => {
      const order = progression.indexOf(chord.numeral);
      const x = L + index * W;
      const badge = order >= 0 ? `<circle cx="${x + W - 10}" cy="${y + 4}" r="9" class="mv-dot"/><text x="${x + W - 10}" y="${y + 8}" class="mv-order">${order + 1}</text>` : '';
      parts.push(`<g class="np-cell ${order >= 0 ? `is-${chord.quality}` : 'is-off'}"><rect x="${x}" y="${y}" width="${W - 6}" height="40" rx="6"/><text x="${x + W / 2 - 3}" y="${y + 25}" class="np-tone">${chord.name.replace('dim', '°')}</text></g>${badge}`);
    });
  });
  return `<svg class="th-svg" viewBox="0 0 ${L + 7 * W + 4} ${top + keys.length * H - 10}" role="img" aria-label="${progression.join(' ')} in the keys of ${keys.join(', ')}">${parts.join('')}</svg>`;
}
$('#familyPic').innerHTML = familySvg();
$('#skipPic').innerHTML = skipSvg();
$('#gapPic').innerHTML = gapSvg();
$('#movePic').innerHTML = moveSvg();

// The 1–4–5 box: the same hand shape on the neck in any key, just slid up or down.
const shapeCells = [['G', 3, 'root'], ['C', 8, 'blue']].flatMap(([root, fret, cls]) => [
  { s: 0, f: fret, label: 'I', cls, title: `${root}: the I chord of ${root}, E string fret ${fret}` },
  { s: 1, f: fret, label: 'IV', cls, title: `${pretty(spellScale(root)[3].name)}: the IV chord of ${root}, A string fret ${fret}` },
  { s: 1, f: fret + 2, label: 'V', cls, title: `${pretty(spellScale(root)[4].name)}: the V chord of ${root}, A string fret ${fret + 2}` }
]);
$('#shapeNeck').innerHTML = neckSvg(shapeCells, { label: 'Roots of the I, IV and V chords in G (frets 3 and 5) and in C (frets 8 and 10)' });
wirePlayback($('#shapeNeck'));


const NUMBER_KEYS = { major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'], minor: ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#'] };
const PROGRESSIONS = {
  major: [['I', 'IV', 'V'], ['I', 'vi', 'IV', 'V'], ['ii', 'V', 'I'], ['I', 'ii', 'V', 'I'], ['I', 'V', 'vi', 'IV']],
  minor: [['i', 'VI', 'III', 'VII'], ['i', 'iv', 'VII'], ['i', 'VI', 'VII'], ['i', 'iv', 'v']]
};
const numMode = $('#numMode');
const numProg = $('#numProg');
let numKey = 'C';
function keyChords(root, mode) {
  const scale = spellScale(root, mode === 'major' ? MAJOR_STEPS : MINOR_STEPS);
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES;
  const numerals = mode === 'major' ? MAJOR_NUMERALS : MINOR_NUMERALS;
  return scale.map((note, index) => ({ numeral: numerals[index], quality: qualities[index], pc: note.pc, name: pretty(note.name) + SUFFIX[qualities[index]] }));
}
const detailUrl = (chord) => `../chords/detail.html?root=${encodeURIComponent(chordModel.roots[chord.pc])}&quality=${chord.quality}`;
function renderNumbers() {
  const mode = numMode.value;
  const progression = PROGRESSIONS[mode][Number(numProg.value)] ?? PROGRESSIONS[mode][0];
  const numerals = mode === 'major' ? MAJOR_NUMERALS : MINOR_NUMERALS;
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES;
  const head = `<thead><tr><th>Key</th>${numerals.map((numeral, index) => `<th class="${progression.includes(numeral) ? 'is-prog' : ''}">${numeral}<small>${QUALITY_SHORT[qualities[index]]}</small></th>`).join('')}</tr></thead>`;
  const rows = NUMBER_KEYS[mode].map((root) => {
    const chords = keyChords(root, mode);
    return `<tr class="${root === numKey ? 'is-selected' : ''}"><td><button type="button" data-num-key="${root}">${pretty(root)}${mode === 'minor' ? 'm' : ''} ▶</button></td>${chords.map((chord) => `<td class="${progression.includes(chord.numeral) ? 'is-prog' : ''}"><a href="${detailUrl(chord)}">${chord.name}</a></td>`).join('')}</tr>`;
  }).join('');
  $('#numTable').innerHTML = head + `<tbody>${rows}</tbody>`;

  const chords = keyChords(numKey, mode);
  const picked = progression.map((numeral) => chords.find((chord) => chord.numeral === numeral));
  const items = [];
  const chips = picked.map((chord) => {
    const frets = voicingFor(chordModel.roots[chord.pc], chord.quality);
    items.push({ chord: chord.name }, ['stack', frets ? stackPairs(frets) : [], 2, frets ?? [null, null, null, null, null, null]]);
    const box = frets ? boxSvg(frets, chordModel.roots[chord.pc], chord.quality, chord.name) : '';
    return `<a class="num-chip" data-index="${items.length - 1}" href="${detailUrl(chord)}"><span>${chord.numeral}</span>${box}<b>${chord.name}</b></a>`;
  });
  playable.set('prog', { items });
  $('#numResult').innerHTML = `<div class="num-result-head"><p><b>${pretty(numKey)} ${mode}</b> · ${progression.join(' – ')} = ${picked.map((chord) => chord.name).join(' – ')}</p><button class="hear-button" type="button" data-play-walk="prog">▶ Play</button></div><div class="chord-strip">${chips.join('')}</div>`;
}
function fillProgressions() {
  numProg.innerHTML = PROGRESSIONS[numMode.value].map((progression, index) => `<option value="${index}">${progression.join(' – ')}</option>`).join('');
}
numMode.addEventListener('change', () => { numKey = numMode.value === 'major' ? 'C' : 'A'; fillProgressions(); renderNumbers(); });
numProg.addEventListener('change', renderNumbers);
$('#numTable').addEventListener('click', (event) => {
  const button = event.target.closest('[data-num-key]');
  if (!button) return;
  numKey = button.dataset.numKey;
  renderNumbers();
  playItems(playable.get('prog').items, $('#numResult'), 84);
});
fillProgressions();
renderNumbers();

// Chord boxes for all seven chords of a key, playable one after another.
const boxKey = $('#boxKey');
boxKey.innerHTML = NUMBER_KEYS.major.map((root) => `<option value="${root}"${root === 'C' ? ' selected' : ''}>${pretty(root)} major</option>`).join('');
function renderKeyBoxes() {
  const items = [];
  const chips = keyChords(boxKey.value, 'major').map((chord) => {
    const frets = voicingFor(chordModel.roots[chord.pc], chord.quality);
    items.push({ chord: chord.name }, ['stack', frets ? stackPairs(frets) : [], 2, frets ?? [null, null, null, null, null, null]]);
    const box = frets ? boxSvg(frets, chordModel.roots[chord.pc], chord.quality, chord.name) : '';
    return `<a class="num-chip is-small is-${chord.quality}" data-index="${items.length - 1}" href="${detailUrl(chord)}"><span>${chord.numeral}</span>${box}<b>${chord.name}</b></a>`;
  });
  playable.set('keyBoxes', { items });
  $('#keyBoxes').innerHTML = chips.join('');
}
boxKey.addEventListener('change', renderKeyBoxes);
renderKeyBoxes();

// Circle of fifths
const CIRCLE_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const CIRCLE_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
let circleKey = 0;
function renderCircle() {
  const c = 160;
  const at = (index, radius) => [c + radius * Math.sin(index * Math.PI / 6), c - radius * Math.cos(index * Math.PI / 6)];
  const role = (index) => {
    const offset = (index - circleKey + 12) % 12;
    return offset === 0 ? 'is-home' : offset === 1 || offset === 11 ? 'is-near' : '';
  };
  const minorRole = (index) => {
    const offset = (index - circleKey + 12) % 12;
    return offset === 0 ? 'is-rel' : offset === 1 || offset === 11 ? 'is-minor-near' : '';
  };
  const parts = [`<circle cx="${c}" cy="${c}" r="136" class="cf-ring"/><circle cx="${c}" cy="${c}" r="88" class="cf-ring"/>`];
  CIRCLE_MAJOR.forEach((name, index) => {
    const [x, y] = at(index, 136);
    const [mx, my] = at(index, 88);
    parts.push(`<g class="cf-node ${role(index)}" data-ck="${index}"><circle cx="${x}" cy="${y}" r="22"/><text x="${x}" y="${y + 5}">${pretty(name)}</text></g>`);
    parts.push(`<g class="cf-node cf-minor ${minorRole(index)}" data-ck="${index}"><circle cx="${mx}" cy="${my}" r="18"/><text x="${mx}" y="${my + 4}">${pretty(CIRCLE_MINOR[index])}</text></g>`);
  });
  parts.push(`<text x="${c}" y="${c - 6}" class="cf-center">${pretty(CIRCLE_MAJOR[circleKey])}</text><text x="${c}" y="${c + 14}" class="cf-center-sub">major</text>`);
  $('#circle').innerHTML = `<svg class="th-svg circle" viewBox="0 0 320 320" role="img" aria-label="Circle of fifths">${parts.join('')}</svg>`;
  const chords = keyChords(CIRCLE_MAJOR[circleKey], 'major');
  $('#circleCaption').innerHTML = `<b>Key of ${pretty(CIRCLE_MAJOR[circleKey])}:</b> I = ${chords[0].name}, IV = ${chords[3].name}, V = ${chords[4].name}, relative minor (vi) = ${chords[5].name}. All chords: ${chords.map((chord) => chord.name).join(' · ')}. Click another key.`;
}
$('#circle').addEventListener('click', (event) => {
  const node = event.target.closest('[data-ck]');
  if (!node) return;
  circleKey = Number(node.dataset.ck);
  renderCircle();
});
renderCircle();

// ---------- 05 bass notes ----------
const BASS_CHORDS = ['C', 'D', 'E', 'G', 'A', 'Am', 'Em', 'Dm', 'F', 'B7'];
$('#bassBoxes').innerHTML = BASS_CHORDS.map((name) => `<figure class="bass-chip">${chordBox(name)}<figcaption><b>${name === 'F' ? 'F (small)' : name}</b> bass ${pretty(SHARPS[bassOf(name) % 12])}</figcaption></figure>`).join('');
const bassPoints = new Map();
BASS_CHORDS.forEach((name) => {
  const pos = posFor(bassOf(name));
  const id = posLabel(pos);
  if (!bassPoints.has(id)) bassPoints.set(id, { ...pos, label: SHARPS[bassOf(name) % 12], tags: [] });
  bassPoints.get(id).tags.push(name);
});
$('#bassMap').innerHTML = miniNeck([...bassPoints.values()].map((point) => ({ ...point, cls: 'is-start', tag: point.tags.join(' '), title: `${point.label}: bass of ${point.tags.join(', ')}` })), [], { label: 'Bass notes of the open chords', className: 'tn-wide' });

// ---------- 06 method ----------
function flowSvg() {
  const box = (x, y, w, h, lines, cls = '') => `<g class="fl-box ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${lines.map((line, index) => `<text x="${x + w / 2}" y="${y + h / 2 + 5 + (index - (lines.length - 1) / 2) * 17}" class="${index ? 'fl-small' : ''}">${line}</text>`).join('')}</g>`;
  const arrow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" class="fl-arrow" marker-end="url(#flHead)"/>`;
  const tag = (x, y, text) => `<g class="fl-tag"><rect x="${x - 38}" y="${y - 12}" width="76" height="20" rx="10"/><text x="${x}" y="${y + 3}">${text}</text></g>`;
  return `<svg class="th-svg flow" viewBox="0 0 620 372" role="img" aria-label="Decision chart for linking two chords">
    <defs><marker id="flHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="tn-head"/></marker></defs>
    ${box(160, 8, 300, 50, ['1 · Find both bass notes', 'C (A string 3) → G (low E 3)'])}
    ${arrow(310, 58, 310, 86)}
    ${box(160, 88, 300, 50, ['2 · Scale notes in between?', 'go the shorter way'])}
    ${arrow(270, 138, 110, 196)}${arrow(310, 138, 310, 196)}${arrow(350, 138, 510, 196)}
    ${tag(170, 162, '1 – 3')}${tag(310, 166, 'none')}${tag(450, 162, '4 or more')}
    ${box(10, 198, 200, 70, ['Walk them', 'one note per beat', 'C → B → A → G'], 'is-scale')}
    ${box(220, 198, 180, 70, ['Go chromatic', 'fret by fret', 'G → G# → A'], 'is-chrom')}
    ${box(410, 198, 200, 70, ['Use the last 1–2', 'approach notes', 'E → … A → B → C'], 'is-trim')}
    ${arrow(110, 268, 250, 310)}${arrow(310, 268, 310, 308)}${arrow(510, 268, 370, 310)}
    ${box(160, 312, 300, 50, ['3 · New chord on beat 1', 'the walk leads the ear there'], 'is-land')}
  </svg>`;
}
$('#flow').innerHTML = flowSvg();
$('#dirDown').innerHTML = walkNeck(buildWalk({ from: 'C', to: 'G', key: 'C' }));
const upPath = [48, 50, 52, 53, 55];
$('#dirUp').innerHTML = walkNeck({ path: upPath, names: ['C', 'D', 'E', 'F', 'G'], kinds: ['is-start', 'is-pass', 'is-pass', 'is-pass', 'is-wrong'], positions: upPath.map((midi) => posFor(midi)) });

// ---------- 07 / 08 library ----------
const LIBRARY = [
  { from: 'C', to: 'G', key: 'C', text: 'The lesson\'s headline example. B and A belong to both C major and G major, so this walk works in either key.' },
  { from: 'G', to: 'C', key: 'C', text: 'The same notes climbing back up: V → I, a very common way to end a phrase.' },
  { from: 'A', to: 'D', key: 'D', text: 'A must-know beginner link. In the key of D the note before D is C#, not C, so it\'s the 4th fret.' },
  { from: 'D', to: 'A', key: 'D', text: 'Walking back down: open D string, then frets 4 and 2 on the A string, landing on the open A.' },
  { from: 'G', to: 'D', key: 'G', text: 'I → V in G. Three notes up the A string: strum G on beat 1 only, then one note per beat.' },
  { from: 'D', to: 'G', key: 'G', text: 'V → I in G. The C at fret 3 is the same note the C chord stands on.' },
  { from: 'E', to: 'A', key: 'A', text: 'I → IV in A. Climb the low E string: F# (fret 2), G# (fret 4), then open A.' },
  { from: 'C', to: 'F', key: 'C', text: 'I → IV in C with the small F shape (xx3211): D and E on the D string lead up to F at fret 3.' },
  { from: 'Am', to: 'Dm', key: 'C', text: 'vi → ii in C, or i → iv in A minor.' },
  { from: 'Am', to: 'C', key: 'C', text: 'The minor sound: a tone, then a semitone. Also i → III in A minor.' },
  { from: 'Em', to: 'G', key: 'G', text: 'vi → I in G with a single linking note.' },
  { from: 'B7', to: 'E', key: 'E', text: 'V7 → I in E: the strongest pull in the key, with a three-note walk down to the open low E.' }
];
const CHROMATIC = [
  { from: 'G', to: 'Am', key: 'C', text: 'G and A are a tone apart and C major has nothing between them. G# (low E, fret 4) pulls hard into A.' },
  { from: 'Am', to: 'G', key: 'C', text: 'The same move downward, a favourite in folk and blues. Going down, the in-between note is usually called A♭.' },
  { from: 'C', to: 'D', key: 'G', text: 'IV → V in G. The C# on fret 4 of the A string leads straight up to the open D.' },
  { from: 'D', to: 'E', key: 'A', toBass: 52, text: 'IV → V in A. Walk up the D string: open, fret 1, fret 2. Fret 2 is already the E in the E chord shape, so strum the chord from there.' },
  { from: 'C', to: 'A', key: 'C', chromatic: true, text: 'C major to A major, a chord from outside the key. Four frets down the A string, every fret in turn.' }
];
$('#walkLibrary').innerHTML = LIBRARY.map((spec, index) => walkCard(buildWalk(spec), `lib${index}`, spec.text)).join('');
$('#walkChromatic').innerHTML = CHROMATIC.map((spec, index) => walkCard(buildWalk(spec), `chr${index}`, spec.text)).join('');
$('#chromPic').innerHTML = `<div class="th-pair"><div><p class="th-pair-label">Scale walk · C – B – A</p>${walkNeck(buildWalk({ from: 'C', to: 'A', key: 'C' }))}</div><div><p class="th-pair-label">Chromatic walk · C – B – B♭ – A</p>${walkNeck(buildWalk({ from: 'C', to: 'A', key: 'C', chromatic: true }))}</div></div>`;

// ---------- hero ----------
const heroWalk = buildWalk({ from: 'C', to: 'G', key: 'C' });
$('#heroArt').innerHTML = walkNeck(heroWalk, { className: 'tn-hero' });
playable.set('hero', { items: walkItems(heroWalk) });

// ---------- 09 rhythm ----------
const RHYTHMS = [
  { title: 'One note on beat 4', from: 'C', to: 'G', notes: [[45, 1]], chordBeats: 3, text: 'The smallest link: an approach note just before the change. Start here.' },
  { title: 'Two notes on beats 3 and 4', from: 'C', to: 'G', notes: [[47, 1], [45, 1]], chordBeats: 2, text: 'The standard walk. Two strums, two bass notes, new chord.' },
  { title: 'Three notes on beats 2, 3 and 4', from: 'G', to: 'D', notes: [[45, 1], [47, 1], [48, 1]], chordBeats: 1, text: 'For wider gaps. The first chord only gets beat 1, so strum it firmly.' },
  { title: 'Eighth notes on beat 4', from: 'C', to: 'G', notes: [[47, .5], [45, .5]], chordBeats: 3, text: 'Squeeze the walk into "4 &". Pick down–up. It sounds busier and more "pro".' }
];
function rhythmFigure(rhythm, id) {
  const W = 76, bar = 16, top = 26, h = 50;
  const walkNotes = rhythm.notes.map(([midi, beats]) => ({ midi, beats, pos: posFor(midi) }));
  const items = [{ chord: rhythm.from }, ['stack', stackPairs(SHAPES[rhythm.from]), rhythm.chordBeats, SHAPES[rhythm.from]], ...walkNotes.map(({ pos, beats }) => [pos.s, pos.f, beats]), '|', { chord: rhythm.to }, ['stack', stackPairs(SHAPES[rhythm.to]), 2, SHAPES[rhythm.to]]];
  playable.set(id, { items });
  const parts = [];
  const beatX = (beat) => beat * W + (beat >= 4 ? bar : 0);
  const eighths = rhythm.notes.some(([, beats]) => beats < 1);
  ['1', '2', '3', '4', '1'].forEach((label, index) => parts.push(`<text x="${beatX(index) + (eighths && index === 3 ? W / 4 : W / 2)}" y="14" class="rg-beat">${label}</text>`));
  if (eighths) parts.push(`<text x="${beatX(3) + W * .75}" y="14" class="rg-beat">&amp;</text>`);
  let position = 0;
  items.forEach((item, index) => {
    if (!Array.isArray(item)) return;
    const land = position >= 4;
    const width = land ? W : item[2] * W;
    const x = beatX(position) + 2;
    const cls = item[0] === 'stack' ? (land ? 'rg-land' : 'rg-chord') : 'rg-walk';
    const label = item[0] === 'stack' ? `${land ? rhythm.to : rhythm.from} ↓` : SHARPS[(STRING_MIDI[item[0]] + item[1]) % 12];
    const sub = item[0] === 'stack' ? (land ? 'new chord' : 'strum') : posLabel({ s: item[0], f: item[1] });
    parts.push(`<g class="rg-cell ${cls}" data-index="${index}"><rect x="${x}" y="${top}" width="${width - 4}" height="${h}" rx="6"/><text x="${x + (width - 4) / 2}" y="${top + 24}" class="rg-main">${label}</text><text x="${x + (width - 4) / 2}" y="${top + 40}" class="rg-sub">${sub}</text></g>`);
    position += item[2];
  });
  parts.push(`<line x1="${beatX(4) - bar / 2}" y1="${top - 4}" x2="${beatX(4) - bar / 2}" y2="${top + h + 4}" class="rg-bar"/>`);
  return `<figure class="th-figure"><svg class="th-svg rhythm" viewBox="0 0 ${beatX(5)} ${top + h + 6}" role="img" aria-label="${rhythm.title}">${parts.join('')}</svg><figcaption><b>${rhythm.title}.</b> ${rhythm.text}</figcaption><button class="hear-button" type="button" data-play-walk="${id}">▶ Hear it</button></figure>`;
}
$('#rhythmGrids').innerHTML = RHYTHMS.map((rhythm, index) => rhythmFigure(rhythm, `rh${index}`)).join('');

// ---------- 10 song ----------
const SONG = ['G', 'Em', 'C', 'D'];
const songWalks = SONG.map((from, index) => buildWalk({ from, to: SONG[(index + 1) % SONG.length], key: 'G' }));
const songItems = [];
const chipIndex = [];
songWalks.forEach((walk) => {
  songItems.push({ chord: walk.from }, ['stack', stackPairs(SHAPES[walk.from]), Math.max(1, 4 - walk.notes.length), SHAPES[walk.from]]);
  chipIndex.push(songItems.length - 1);
  walk.notes.forEach((midi, index) => songItems.push([walk.positions[index + 1].s, walk.positions[index + 1].f, 1]));
  songItems.push('|');
});
songItems.push({ chord: 'G' }, ['stack', stackPairs(SHAPES.G), 4, SHAPES.G]);
playable.set('song', { items: songItems });
$('#songPlay').dataset.playWalk = 'song';
$('#songChips').innerHTML = SONG.map((name, index) => `<div class="song-chip" data-index="${chipIndex[index]}"><span>${['I', 'vi', 'IV', 'V'][index]}</span>${chordBox(name)}</div>`).join('');
$('#songTab').innerHTML = tabSvg({ name: 'G Em C D with links', notes: songItems }, 0);
$('#songLinks').innerHTML = songWalks.map((walk) => `<article><h3>${walk.from} → ${walk.to} <span class="walk-kind is-${walk.kind}">${KIND_LABEL[walk.kind]}</span></h3><p class="walk-chain">${chainHtml(walk)}</p><p>${explainWalk(walk)}</p></article>`).join('');

// ---------- 11 builder ----------
const bKey = $('#bKey');
const bFrom = $('#bFrom');
const bTo = $('#bTo');
bKey.innerHTML = Object.keys(KEY_CHORDS).map((key) => `<option value="${key}">${key} major</option>`).join('');
function fillBuilderChords() {
  const options = KEY_CHORDS[bKey.value].map((name) => `<option>${name}</option>`).join('');
  bFrom.innerHTML = options;
  bTo.innerHTML = options;
  bTo.selectedIndex = Math.min(KEY_CHORDS[bKey.value].length - 1, bKey.value === 'C' ? 4 : 1);
}
function renderBuilder() {
  stopAll();
  const walk = buildWalk({ from: bFrom.value, to: bTo.value, key: bKey.value, chromatic: $('#bChrom').checked });
  $('#builderOut').innerHTML = walkCard(walk, 'builder', `${pretty(bFrom.value)} is the ${keyChords(bKey.value, 'major').find((chord) => chord.pc === pcOf(parseChord(bFrom.value).root))?.numeral ?? '?'} chord and ${pretty(bTo.value)} is the ${keyChords(bKey.value, 'major').find((chord) => chord.pc === pcOf(parseChord(bTo.value).root))?.numeral ?? '?'} chord in ${bKey.value} major.`);
}
bKey.addEventListener('change', () => { fillBuilderChords(); renderBuilder(); });
bFrom.addEventListener('change', renderBuilder);
bTo.addEventListener('change', renderBuilder);
$('#bChrom').addEventListener('change', renderBuilder);
$('#bSwap').addEventListener('click', () => { [bFrom.value, bTo.value] = [bTo.value, bFrom.value]; renderBuilder(); });
fillBuilderChords();
renderBuilder();
