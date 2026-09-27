// Ear training page. Shared helpers (sound, neckSvg, voicingFor, chordModel, STRING_MIDI, $...) come from ../fretboard.js.

const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const BOTH_NAMES = ['C', 'C#/D♭', 'D', 'D#/E♭', 'E', 'F', 'F#/G♭', 'G', 'G#/A♭', 'A', 'A#/B♭', 'B'];
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab'];
const KEY_ROOTS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];
const MAJOR_SET = [0, 2, 4, 5, 7, 9, 11, 12];
const pc = (midi) => ((midi % 12) + 12) % 12;
const noteName = (midi) => SHARPS[pc(midi)];
const octaveOf = (midi) => Math.floor(midi / 12) - 1;
const pretty = (text) => text.replace(/([A-G])b/g, '$1♭');
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const randInt = (low, high) => low + Math.floor(Math.random() * (high - low + 1));
const rootPc = (root) => chordModel.pitchByName[root];
// Spell a degree in a key: flat keys and lowered degrees (b3, b7…) use flats, raised ones (#4) sharps.
const keyNote = (root, semitones) => pretty(((FLAT_KEYS.includes(root) || [1, 3, 8, 10].includes(semitones % 12)) && semitones % 12 !== 6 ? FLATS : SHARPS)[(rootPc(root) + semitones) % 12]);
const intervalNote = (midi, semitones) => pretty(([1, 3, 8, 10].includes(semitones) ? FLATS : SHARPS)[pc(midi + semitones)]);
const tonicMidi = (root) => 48 + rootPc(root);

// A comfortable place to play a pitch: the highest string where it sits in frets 0–9.
function posFor(midi) {
  for (const maxFret of [9, 15]) for (let string = 5; string >= 0; string -= 1) {
    const fret = midi - STRING_MIDI[string];
    if (fret >= 0 && fret <= maxFret) return { s: string, f: fret };
  }
  return { s: 0, f: Math.max(0, midi - STRING_MIDI[0]) };
}

// ---------- sound ----------
let timers = [];
function stopAll() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.ear-page .is-playing').forEach((element) => element.classList.remove('is-playing'));
}
function later(time, fn) { timers.push(setTimeout(fn, time)); }
function glow(element, time, length = 400) {
  if (!element) return;
  later(time, () => element.classList.add('is-playing'));
  later(time + length, () => element.classList.remove('is-playing'));
}
function playMidi(midi, at = 0, { length = 1.6, level = .34 } = {}) {
  const pos = posFor(midi);
  later(at, () => { mic.ignoreUntil = performance.now() + length * 700; sound.pluck(pos.s, pos.f, { level, length }); });
}
function playAt(string, fret, at = 0) { later(at, () => { mic.ignoreUntil = performance.now() + 1100; sound.pluck(string, fret, { level: .34, length: 1.6 }); }); }
function strumAt(frets, at = 0, level = .17) { later(at, () => { mic.ignoreUntil = performance.now() + 1200; sound.strum(frets, { level, gap: .035 }); }); }
function arpAt(frets, at = 0, gap = 190) {
  frets.forEach((fret, string) => { if (fret !== null) playAt(string, fret, at + frets.slice(0, string).filter((item) => item !== null).length * gap); });
}
// I – IV – V – I in the key, so the ear hears where home is. Returns its length in ms.
function cadence(root, at = 0) {
  const base = rootPc(root);
  [0, 5, 7, 0].forEach((offset, index) => {
    const name = chordModel.roots[(base + offset) % 12];
    strumAt(voicingFor(name, 'major'), at + index * 560, index === 3 ? .19 : .15);
  });
  return 2500;
}
// Walk from a degree to the nearest home note through the major scale (the "resolution").
function resolutionPath(semitones) {
  if (semitones === 0) return [0];
  const target = semitones <= 5 ? 0 : 12;
  const between = MAJOR_SET.filter((step) => (target === 0 ? step < semitones && step > 0 : step > semitones && step < 12));
  return [semitones, ...(target === 0 ? between.reverse() : between), target];
}
function playResolution(base, semitones, at = 0) {
  resolutionPath(semitones).forEach((step, index, list) => playMidi(base + step, at + index * 430, { length: index === list.length - 1 ? 2 : .9 }));
}
function playInterval(root, semitones, direction, at = 0) {
  if (direction === 'harmonic') { playMidi(root, at); playMidi(root + semitones, at); return; }
  const [first, second] = direction === 'down' ? [root + semitones, root] : [root, root + semitones];
  playMidi(first, at, { length: 1.2 });
  playMidi(second, at + 750);
}

// ---------- data ----------
const DEGREES = [
  { st: 0, num: '1', solf: 'Do', stable: true, feel: 'Home. Complete rest: melodies want to end here.' },
  { st: 1, num: 'b2', solf: 'Ra', chromatic: true, feel: 'Dark and spicy. Slides straight down to Do.' },
  { st: 2, num: '2', solf: 'Re', feel: 'Unfinished, like a question. Steps down to Do.' },
  { st: 3, num: 'b3', solf: 'Me', chromatic: true, feel: 'The minor / blues note. Sounds sad against a major key.' },
  { st: 4, num: '3', solf: 'Mi', stable: true, feel: 'Bright and sweet: the note that makes the key sound major.' },
  { st: 5, num: '4', solf: 'Fa', feel: 'Tense and hanging. Leans down onto Mi.' },
  { st: 6, num: '#4', solf: 'Fi', chromatic: true, feel: 'Floating and strange (the Lydian note). Pushes up to Sol.' },
  { st: 7, num: '5', solf: 'Sol', stable: true, feel: 'Strong and open. Stable, but not quite home.' },
  { st: 8, num: 'b6', solf: 'Le', chromatic: true, feel: 'Dramatic and sad. Sinks down to Sol.' },
  { st: 9, num: '6', solf: 'La', feel: 'Sweet with a touch of sadness. Rises through Ti to Do, or drifts down to Sol.' },
  { st: 10, num: 'b7', solf: 'Te', chromatic: true, feel: 'Bluesy and relaxed: the rock and blues flavour.' },
  { st: 11, num: '7', solf: 'Ti', feel: 'The strongest pull of all: it aches to rise to Do.' }
];
const DEG = Object.fromEntries(DEGREES.map((degree) => [degree.st, degree]));
const INTERVALS = [
  { n: 1, short: 'm2', name: 'Minor 2nd', up: 'Jaws theme', down: 'Für Elise (first two notes)', feel: 'Tense and crunchy: a single fret.' },
  { n: 2, short: 'M2', name: 'Major 2nd', up: 'Frère Jacques (first two notes)', down: 'Mary Had a Little Lamb ("Ma-ry")', feel: 'A plain step: the building block of melodies.' },
  { n: 3, short: 'm3', name: 'Minor 3rd', up: 'Smoke on the Water (first two notes)', down: 'Hey Jude ("Hey Jude")', feel: 'Sad and soulful: the sound of minor.' },
  { n: 4, short: 'M3', name: 'Major 3rd', up: 'When the Saints Go Marching In ("Oh when")', down: 'Swing Low, Sweet Chariot ("Swing low")', feel: 'Happy and bright: the sound of major.' },
  { n: 5, short: 'P4', name: 'Perfect 4th', up: 'Here Comes the Bride / Amazing Grace ("A-maz-")', feel: 'Open and hymn-like, slightly unresolved.' },
  { n: 6, short: 'TT', name: 'Tritone', up: 'The Simpsons theme ("The Simp-")', feel: 'Unstable and eerie: exactly half an octave.' },
  { n: 7, short: 'P5', name: 'Perfect 5th', up: 'Twinkle Twinkle Little Star / Star Wars theme', down: 'The Flintstones ("Flint-stones")', feel: 'Strong, open and hollow: a power chord.' },
  { n: 8, short: 'm6', name: 'Minor 6th', up: 'The Entertainer (the leap after the three pickup notes)', feel: 'Bittersweet and yearning.' },
  { n: 9, short: 'M6', name: 'Major 6th', up: 'My Bonnie Lies over the Ocean ("My Bon-") / the NBC chimes', down: 'Nobody Knows the Trouble I\'ve Seen', feel: 'Warm and sweet: a big, friendly leap.' },
  { n: 10, short: 'm7', name: 'Minor 7th', up: 'Star Trek original theme / "Somewhere" (West Side Story)', feel: 'Bluesy and unresolved: the 7 in a dominant 7 chord.' },
  { n: 11, short: 'M7', name: 'Major 7th', up: 'Take On Me (chorus)', feel: 'Dreamy but very tense: one fret short of the octave.' },
  { n: 12, short: 'P8', name: 'Octave', up: 'Somewhere Over the Rainbow ("Some-where")', feel: 'The same note, higher. Sounds like one note doubled.' }
];
const INT = Object.fromEntries(INTERVALS.map((interval) => [interval.n, interval]));
const CHORD_TYPES = [
  { q: 'major', feel: 'Happy, bright, settled.', listen: 'Listen for a smile.' },
  { q: 'minor', feel: 'Sad, serious, emotional.', listen: 'The middle note has dropped one fret.' },
  { q: 'diminished', feel: 'Tense and spooky: horror-film suspense.', listen: 'Squeezed and dark, two minor 3rds stacked.' },
  { q: 'augmented', feel: 'Dreamy and unresolved, like a question mark.', listen: 'Stretched and floating, two major 3rds stacked.' },
  { q: 'sus2', feel: 'Open and airy, neither happy nor sad.', listen: 'No 3rd: it sounds hollow and modern.' },
  { q: 'sus4', feel: 'Suspended: wants to fall back to major.', listen: 'A note hanging above where the 3rd should be.' },
  { q: 'dominant7', feel: 'Bluesy; wants to move to the next chord.', listen: 'Major, plus a slightly sour note on top.' },
  { q: 'major7', feel: 'Lush, jazzy, dreamy.', listen: 'Major, plus a shimmering note just below the octave.' },
  { q: 'minor7', feel: 'Smooth, mellow, soulful.', listen: 'Minor, but softer and more relaxed.' },
  { q: 'halfDiminished', feel: 'Dark jazz tension.', listen: 'Like diminished, but a little smoother.' }
];
const CHORD_TYPE = Object.fromEntries(CHORD_TYPES.map((type) => [type.q, type]));
const chordName = (root, quality) => pretty(root + chordModel.qualities[quality].suffix);

// ---------- 01 listen ----------
function relativeSvg() {
  const fw = 58, left = 40, y = 70;
  const x = (fret) => left + fret * fw;
  const parts = [`<line x1="${left - 12}" y1="${y}" x2="${x(6)}" y2="${y}" class="rp-string"/>`];
  for (let fret = 1; fret <= 6; fret += 1) parts.push(`<line x1="${x(fret) - fw / 2}" y1="${y - 18}" x2="${x(fret) - fw / 2}" y2="${y + 18}" class="rp-fret"/>`);
  for (let fret = 0; fret <= 5; fret += 1) parts.push(`<text x="${x(fret)}" y="${y + 38}" class="rp-num">${fret || 'open'}</text>`);
  parts.push(`<path d="M${x(0) + 8} ${y - 20} Q${(x(0) + x(3)) / 2} ${y - 62} ${x(3) - 8} ${y - 20}" class="rp-arc" marker-end="url(#rpHead)"/><text x="${(x(0) + x(3)) / 2}" y="${y - 50}" class="rp-arc-label">3 frets = minor 3rd</text>`);
  parts.push(`<g class="rp-dot is-ref"><circle cx="${x(0)}" cy="${y}" r="16"/><text x="${x(0)}" y="${y + 5}">A</text></g><g class="rp-dot is-target"><circle cx="${x(3)}" cy="${y}" r="16"/><text x="${x(3)}" y="${y + 5}">?</text></g>`);
  const steps = [['1', 'Hear the reference', 'home or open string'], ['2', 'Feel the distance', 'step, leap, degree'], ['3', 'Name it', 'C: 3 frets above A']];
  steps.forEach(([num, title, sub], index) => {
    const bx = 410 + index * 166;
    parts.push(`<g class="rp-step"><rect x="${bx}" y="22" width="152" height="92" rx="10"/><circle cx="${bx + 22}" cy="46" r="13"/><text x="${bx + 22}" y="51" class="rp-step-num">${num}</text><text x="${bx + 12}" y="80" class="rp-step-title">${title}</text><text x="${bx + 12}" y="99" class="rp-step-sub">${sub}</text></g>`);
    if (index < 2) parts.push(`<path d="M${bx + 153} 68 L${bx + 164} 68" class="rp-arc" marker-end="url(#rpHead)"/>`);
  });
  return `<svg class="e-svg" viewBox="0 0 910 132" role="img" aria-label="Reference note A, then a note three frets higher, named C"><defs><marker id="rpHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="rp-head"/></marker></defs>${parts.join('')}</svg>`;
}
$('#relativePic').innerHTML = relativeSvg();
$('#anchors').innerHTML = STRING_NAMES.map((name, string) => `<button type="button" class="anchor" data-anchor="${string}"><span>${6 - string}</span><b>${name.toUpperCase()}</b><small>${noteName(STRING_MIDI[string])}${octaveOf(STRING_MIDI[string])}</small></button>`).join('') + '<button type="button" class="anchor is-all" data-anchor="all"><b>▶</b><small>all six</small></button>';
$('#anchors').addEventListener('click', (event) => {
  const button = event.target.closest('[data-anchor]');
  if (!button) return;
  stopAll();
  const strings = button.dataset.anchor === 'all' ? [0, 1, 2, 3, 4, 5] : [Number(button.dataset.anchor)];
  strings.forEach((string, index) => { playAt(string, 0, index * 650); glow($(`[data-anchor="${string}"]`), index * 650, 600); });
});

// ---------- 02 scale degrees ----------
const degKey = $('#degKey');
degKey.innerHTML = KEY_ROOTS.map((root) => `<option value="${root}">${pretty(root)} major</option>`).join('');
function ladderSvg() {
  const unit = 29, bottom = 372, cx = 120;
  const y = (st) => bottom - st * unit;
  const parts = [`<line x1="${cx}" y1="${y(12) - 10}" x2="${cx}" y2="${y(0) + 10}" class="dl-rail"/>`];
  const arrows = [[2, 0], [5, 4], [9, 7], [11, 12]];
  arrows.forEach(([from, to]) => {
    const dy = y(to) - y(from);
    parts.push(`<path d="M${cx + 40} ${y(from)} C${cx + 88} ${y(from)} ${cx + 88} ${y(to)} ${cx + 42} ${y(to)}" class="dl-arrow" marker-end="url(#dlHead)"/>`);
    parts.push(`<text x="${cx + 92}" y="${(y(from) + y(to)) / 2 + 4}" class="dl-arrow-label">${dy < 0 ? 'up' : 'down'}</text>`);
  });
  MAJOR_SET.forEach((st) => {
    const degree = DEG[st % 12];
    const cls = st % 12 === 0 ? 'is-home' : degree.stable ? 'is-stable' : 'is-tense';
    parts.push(`<g class="dl-step ${cls}" data-deg="${st}"><circle cx="${cx}" cy="${y(st)}" r="17"/><text x="${cx}" y="${y(st) + 4}" class="dl-solf">${degree.solf}</text><text x="${cx + 26}" y="${y(st) + 4}" class="dl-num">${st === 12 ? '8' : degree.num}</text><text x="${cx - 30}" y="${y(st) + 5}" class="dl-note" data-note="${st}"></text></g>`);
  });
  [[4, 5], [11, 12]].forEach(([a, b]) => parts.push(`<text x="${cx - 100}" y="${(y(a) + y(b)) / 2 + 4}" class="dl-half">½ step</text>`));
  return `<svg class="e-svg ladder" viewBox="0 0 260 ${bottom + 34}" role="img" aria-label="Scale degree ladder with tendencies"><defs><marker id="dlHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="rp-head"/></marker></defs>${parts.join('')}</svg>`;
}
$('#degLadder').innerHTML = ladderSvg();
function renderDegrees() {
  const root = degKey.value;
  document.querySelectorAll('.dl-note').forEach((text) => { text.textContent = keyNote(root, Number(text.dataset.note) % 12); });
  $('#degCards').innerHTML = DEGREES.map((degree) => `<button type="button" class="deg-card${degree.chromatic ? ' is-chromatic' : ''}${degree.stable ? ' is-stable' : ''}" data-deg="${degree.st}"><span class="deg-num">${degree.num}</span><b>${degree.solf} <em>${keyNote(root, degree.st)}</em></b><small>${degree.feel}</small></button>`).join('');
}
function playDegree(st) {
  stopAll();
  const root = degKey.value;
  const start = $('#degWithCadence').checked ? cadence(root) : 0;
  const midi = tonicMidi(root) + st;
  playMidi(midi, start, { length: 1.8 });
  document.querySelectorAll(`[data-deg="${st}"]`).forEach((element) => glow(element, start, 900));
  if ($('#degResolve').checked && st % 12 !== 0) playResolution(tonicMidi(root), st, start + 1100);
}
degKey.addEventListener('change', renderDegrees);
$('#degCadence').addEventListener('click', () => { stopAll(); cadence(degKey.value); });
$('#degrees').addEventListener('click', (event) => { const item = event.target.closest('[data-deg]'); if (item) playDegree(Number(item.dataset.deg)); });
renderDegrees();

// ---------- 03 intervals ----------
function intervalNeck(n) {
  const fw = 18, gap = 11, left = 10, top = 10, rootFret = 3;
  const x = (fret) => left + (fret - .5) * fw;
  const y = (string) => top + (5 - string) * gap;
  const parts = [];
  for (let fret = 0; fret <= 15; fret += 1) parts.push(`<line x1="${left + fret * fw}" y1="${top}" x2="${left + fret * fw}" y2="${top + gap * 5}" class="in-fret${fret === 0 ? ' is-nut' : ''}"/>`);
  for (let string = 0; string < 6; string += 1) parts.push(`<line x1="${left}" y1="${y(string)}" x2="${left + 15 * fw}" y2="${y(string)}" class="in-string"/>`);
  const cross = n >= 3 && n <= 9 ? { s: 2, f: rootFret + n - 5 } : n >= 10 ? { s: 3, f: rootFret + n - 10 } : null;
  parts.push(`<line x1="${x(rootFret)}" y1="${y(1)}" x2="${x(rootFret + n)}" y2="${y(1)}" class="in-span"/>`);
  if (cross) parts.push(`<line x1="${x(rootFret)}" y1="${y(1)}" x2="${x(cross.f)}" y2="${y(cross.s)}" class="in-span is-cross"/>`);
  parts.push(`<circle cx="${x(rootFret + n)}" cy="${y(1)}" r="5.5" class="in-dot"/>`);
  if (cross) parts.push(`<circle cx="${x(cross.f)}" cy="${y(cross.s)}" r="5.5" class="in-dot is-cross"/>`);
  parts.push(`<circle cx="${x(rootFret)}" cy="${y(1)}" r="5.5" class="in-dot is-root"/>`);
  return `<svg class="e-svg int-neck" viewBox="0 0 ${left * 2 + 15 * fw} ${top * 2 + gap * 5}" role="img" aria-label="${INT[n].name} from C on the A string">${parts.join('')}</svg>`;
}
$('#intCards').innerHTML = INTERVALS.map((interval) => `<article class="int-card"><header><span class="int-short">${interval.short}</span><div><h3>${interval.name}</h3><small>${interval.n} semitone${interval.n > 1 ? 's' : ''} · C → ${intervalNote(48, interval.n)}</small></div></header>${intervalNeck(interval.n)}<p class="int-feel">${interval.feel}</p><p class="int-hook"><b>↑</b> ${interval.up}${interval.down ? `<br><b>↓</b> ${interval.down}` : ''}</p><div class="int-buttons"><button type="button" data-int="${interval.n}" data-dir="up">▶ Up</button><button type="button" data-int="${interval.n}" data-dir="down">▶ Down</button><button type="button" data-int="${interval.n}" data-dir="harmonic">▶ Together</button></div></article>`).join('');
$('#intCards').addEventListener('click', (event) => {
  const button = event.target.closest('[data-int]');
  if (!button) return;
  stopAll();
  playInterval(48, Number(button.dataset.int), button.dataset.dir);
});

// ---------- 04 chord sounds ----------
const chordRoot = $('#chordRoot');
chordRoot.innerHTML = ['C', 'D', 'E', 'G', 'A'].map((root) => `<option>${root}</option>`).join('');
function renderChordCards() {
  const root = chordRoot.value;
  $('#chordCards').innerHTML = CHORD_TYPES.map((type) => {
    const frets = voicingFor(root, type.q);
    const formula = chordModel.qualities[type.q].tones.map((tone) => tone.label).join(' – ');
    return `<article class="chord-card"><h3>${chordName(root, type.q)} <small>${chordModel.qualities[type.q].label}</small></h3>${frets ? sound.svg(frets, chordModel.voicingNotes(frets, root, type.q), { title: chordName(root, type.q) }) : ''}<p class="chord-formula">${formula}</p><p><b>${type.feel}</b> ${type.listen}</p><div class="int-buttons"><button type="button" data-chord="${type.q}" data-how="strum">▶ Strum</button><button type="button" data-chord="${type.q}" data-how="arp">▶ Note by note</button></div></article>`;
  }).join('');
}
chordRoot.addEventListener('change', renderChordCards);
$('#chordCards').addEventListener('click', (event) => {
  const button = event.target.closest('[data-chord]');
  if (!button) return;
  stopAll();
  const frets = voicingFor(chordRoot.value, button.dataset.chord);
  if (button.dataset.how === 'strum') strumAt(frets); else arpAt(frets);
});
renderChordCards();

// ---------- 05 gym ----------
const ALL_NOTE_OPTIONS = SHARPS.map((_, index) => ({ id: String(index), label: BOTH_NAMES[index] }));
const DRILLS = [
  {
    id: 'pitch', name: 'Higher or lower', how: 'Two notes play. Is the second note higher or lower than the first?',
    levels: ['Big jumps', 'Medium steps', 'Small steps (1–2 frets)'],
    make(level) {
      const [low, high] = [[5, 12], [2, 4], [1, 2]][level];
      const first = randInt(45, 64);
      const same = level > 0 && Math.random() < .15;
      const diff = same ? 0 : randInt(low, high) * (Math.random() < .5 ? 1 : -1);
      const second = first + diff;
      const play = () => { playMidi(first, 0, { length: 1 }); playMidi(second, 800); };
      return {
        prompt: 'Is the second note higher or lower?', play, after: play,
        options: [{ id: 'up', label: '↑ Higher' }, { id: 'down', label: '↓ Lower' }, ...(level > 0 ? [{ id: 'same', label: '= Same' }] : [])],
        answer: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
        explain: () => `${noteName(first)} → ${noteName(second)}: ${same ? 'the same note' : `${Math.abs(diff)} semitone${Math.abs(diff) > 1 ? 's' : ''} ${diff > 0 ? 'up' : 'down'}`}.`
      };
    }
  },
  {
    id: 'degree', name: 'Scale degrees', how: 'The chords of a key play first, then one note. Which step of the scale is it? This is the most useful ear skill: it works in any key.',
    levels: ['Do Mi Sol (1 3 5)', 'Do to Sol (1–5)', 'All seven (major scale)', 'All twelve (chromatic)'],
    extra: { label: 'KEY', options: [['random', 'Random key'], ...KEY_ROOTS.map((root) => [root, `${pretty(root)} major`])] },
    make(level, extra) {
      const sets = [[0, 4, 7], [0, 2, 4, 5, 7], [0, 2, 4, 5, 7, 9, 11], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
      const root = extra === 'random' ? pick(KEY_ROOTS) : extra;
      const tonic = tonicMidi(root);
      const st = pick(sets[level]);
      const octave = Math.random() < .3 && tonic + st + 12 <= 76 ? 12 : 0;
      return {
        prompt: `Key of <b>${pretty(root)} major</b>. Which degree is the last note?`,
        play: () => { const start = cadence(root); playMidi(tonic + octave + st, start, { length: 2 }); },
        reference: () => { const start = cadence(root); playMidi(tonic, start, { length: 2 }); },
        referenceLabel: 'Hear home (Do)',
        options: sets[level].map((step) => ({ id: String(step), label: DEG[step].num, sub: DEG[step].solf })),
        answer: String(st),
        hear: (id) => { playMidi(tonic, 0, { length: 1 }); playMidi(tonic + Number(id), 700); },
        explain: () => `It was <b>${DEG[st].num} · ${DEG[st].solf}</b> (the note ${keyNote(root, st)} in ${pretty(root)} major). ${DEG[st].feel} Listen to it resolve home.`,
        after: () => playResolution(tonic + octave, st)
      };
    }
  },
  {
    id: 'interval', name: 'Intervals', how: 'Two notes play. How far apart are they? Think of the song hooks from section 03.',
    levels: ['M3 · P5 · Octave', '+ M2 · m3 · P4', '+ m2 · m6 · M6', 'All twelve'],
    extra: { label: 'DIRECTION', options: [['up', 'Ascending'], ['down', 'Descending'], ['harmonic', 'Together'], ['mixed', 'Mixed']] },
    make(level, extra) {
      const sets = [[4, 7, 12], [2, 3, 4, 5, 7, 12], [1, 2, 3, 4, 5, 7, 8, 9, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]];
      const n = pick(sets[level]);
      const direction = extra === 'mixed' ? pick(['up', 'down', 'harmonic']) : extra;
      const root = randInt(45, 60);
      const hook = direction === 'down' && INT[n].down ? `↓ ${INT[n].down}` : `↑ ${INT[n].up}`;
      return {
        prompt: `${direction === 'harmonic' ? 'Two notes together' : direction === 'down' ? 'Two notes, going down' : 'Two notes, going up'}. Which interval?`,
        play: () => playInterval(root, n, direction),
        options: sets[level].map((step) => ({ id: String(step), label: INT[step].short, sub: INT[step].name })),
        answer: String(n),
        hear: (id) => playInterval(root, Number(id), direction),
        explain: () => `It was a <b>${INT[n].name}</b>: ${n} semitone${n > 1 ? 's' : ''} (${noteName(root)} → ${intervalNote(root, n)}). ${INT[n].feel} Hook: ${hook}.`,
        after: () => playInterval(root, n, direction === 'harmonic' ? 'up' : direction)
      };
    }
  },
  {
    id: 'chord', name: 'Chord quality', how: 'A chord plays. Is it major, minor or something else? Listen for its mood (section 04).',
    levels: ['Major / minor', '+ diminished · augmented', '+ 7th chords', '+ sus and m7♭5'],
    extra: { label: 'PLAY AS', options: [['strum', 'Strummed'], ['arp', 'Note by note'], ['both', 'Both']] },
    make(level, extra) {
      const sets = [['major', 'minor'], ['major', 'minor', 'diminished', 'augmented'], ['major', 'minor', 'dominant7', 'major7', 'minor7'], ['major', 'minor', 'diminished', 'augmented', 'sus2', 'sus4', 'dominant7', 'major7', 'minor7', 'halfDiminished']];
      const root = pick(chordModel.roots);
      const quality = pick(sets[level]);
      const playChord = (q) => {
        const frets = voicingFor(root, q);
        if (extra !== 'arp') strumAt(frets);
        if (extra !== 'strum') arpAt(frets, extra === 'both' ? 1300 : 0);
      };
      return {
        prompt: 'What kind of chord is it?', play: () => playChord(quality), after: () => playChord(quality),
        options: sets[level].map((q) => ({ id: q, label: chordModel.qualities[q].label })),
        answer: quality,
        hear: (id) => playChord(id),
        explain: () => `It was <b>${chordName(root, quality)}</b> (${chordModel.qualities[quality].label}: ${chordModel.qualities[quality].tones.map((tone) => tone.label).join(' – ')}). ${CHORD_TYPE[quality].feel} ${CHORD_TYPE[quality].listen}`
      };
    }
  },
  {
    id: 'name', name: 'Name the note', how: 'A reference note plays first (its name is shown), then a mystery note. Name the mystery note by measuring from the reference.',
    levels: ['Natural notes (A–G)', 'All twelve notes'],
    extra: { label: 'REFERENCE', options: [['45', 'A · open 5th string'], ['40', 'E · open 6th string'], ['48', 'C · 5th string, fret 3']] },
    make(level, extra) {
      const reference = Number(extra);
      const offsets = Array.from({ length: 12 }, (_, index) => index).filter((offset) => level > 0 || !SHARPS[pc(reference + offset)].includes('#'));
      const offset = pick(offsets);
      const target = reference + offset;
      const refPos = reference === 40 ? { s: 0, f: 0 } : { s: 1, f: reference - 45 };
      const options = level > 0 ? ALL_NOTE_OPTIONS : ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((name) => ({ id: String(chordModel.pitchByName[name]), label: name }));
      return {
        prompt: `Reference: <b>${noteName(reference)}</b>. What is the second note?`,
        play: () => { playAt(refPos.s, refPos.f, 0); playAt(refPos.s, refPos.f + offset, 900); },
        reference: () => playAt(refPos.s, refPos.f, 0), referenceLabel: `Hear ${noteName(reference)}`,
        options, answer: String(pc(target)),
        hear: (id) => { playAt(refPos.s, refPos.f, 0); playAt(refPos.s, refPos.f + ((Number(id) - pc(reference) + 12) % 12), 900); },
        explain: () => `It was <b>${BOTH_NAMES[pc(target)]}</b>, ${offset} semitone${offset === 1 ? '' : 's'} above ${noteName(reference)}${offset ? ` (a ${INT[offset].name.toLowerCase()})` : ''}. On the ${STRING_NAMES[refPos.s]} string it's fret ${refPos.f + offset}.`,
        after: () => { playAt(refPos.s, refPos.f, 0); playAt(refPos.s, refPos.f + offset, 900); }
      };
    }
  },
  {
    id: 'find', name: 'Find it on the neck', how: 'The open string plays, then a note on the same string. Which fret was it? Check on your guitar.',
    levels: ['Frets 1–5', 'Frets 1–7', 'Frets 1–12'],
    make(level) {
      const maxFret = [5, 7, 12][level];
      const string = randInt(0, 5);
      const fret = randInt(1, maxFret);
      return {
        prompt: `The open <b>${STRING_NAMES[string]}</b> string (${6 - string}${['th', 'th', 'th', 'rd', 'nd', 'st'][string]}) plays, then a note on it. Which fret?`,
        play: () => { playAt(string, 0, 0); playAt(string, fret, 900); },
        reference: () => playAt(string, 0, 0), referenceLabel: 'Hear the open string',
        options: Array.from({ length: maxFret + 1 }, (_, index) => ({ id: String(index), label: String(index), sub: noteName(STRING_MIDI[string] + index) })),
        frets: true, answer: String(fret),
        hear: (id) => { playAt(string, 0, 0); playAt(string, Number(id), 900); },
        explain: () => `Fret <b>${fret}</b>: ${noteName(STRING_MIDI[string] + fret)}, ${fret} semitone${fret > 1 ? 's' : ''} above the open ${noteName(STRING_MIDI[string])} (${INT[fret]?.name.toLowerCase() ?? ''}).`,
        after: () => { playAt(string, 0, 0); playAt(string, fret, 900); }
      };
    }
  },
  {
    id: 'playback', name: 'Play it back', how: 'Listen, then play the same note on your guitar. The microphone checks your answer. Turn the microphone on in section 06 (or with the button below).',
    levels: ['Open position, natural notes', 'Open position, all notes', 'Anywhere, frets 0–12'],
    extra: { label: 'MATCH', options: [['any', 'Any octave'], ['exact', 'Exact octave']] },
    make(level, extra) {
      const maxFret = [3, 4, 12][level];
      const spots = [];
      for (let string = 0; string < 6; string += 1) for (let fret = 0; fret <= maxFret; fret += 1) {
        if (level === 0 && SHARPS[pc(STRING_MIDI[string] + fret)].includes('#')) continue;
        spots.push({ s: string, f: fret });
      }
      const spot = pick(spots);
      const target = STRING_MIDI[spot.s] + spot.f;
      return {
        prompt: `Play this note on your guitar ${extra === 'exact' ? '(same octave)' : '(any octave)'}.`,
        play: () => playAt(spot.s, spot.f, 0), after: () => playAt(spot.s, spot.f, 0),
        mic: true, target, exact: extra === 'exact',
        options: [{ id: 'giveup', label: 'Show me' }], answer: 'mic',
        explain: () => `The note was <b>${noteName(target)}${octaveOf(target)}</b>, e.g. the ${STRING_NAMES[spot.s]} string ${spot.f ? `at fret ${spot.f}` : 'open'}.`
      };
    }
  }
];

const STATS_KEY = 'guitar-field-notes-ear-stats';
let stats = {};
try { stats = JSON.parse(localStorage.getItem(STATS_KEY) ?? '{}'); } catch {}
function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {} }
const gym = { index: 1, levels: {}, extras: {}, q: null, answered: false, streak: 0, micHits: 0 };
const drill = () => DRILLS[gym.index];

function renderTabs() {
  $('#gymTabs').innerHTML = DRILLS.map((item, index) => `<button type="button" role="tab" aria-selected="${index === gym.index}" class="${index === gym.index ? 'is-selected' : ''}" data-drill="${index}">${item.name}</button>`).join('');
}
function renderScore() {
  const record = stats[drill().id] ?? { right: 0, total: 0, best: 0 };
  $('#gymScore').innerHTML = `<span><b>${gym.streak}</b> streak</span><span><b>${record.right}/${record.total}</b> all-time</span><span><b>${record.best}</b> best streak</span>`;
}
function selectDrill(index) {
  stopAll();
  gym.index = index;
  gym.streak = 0;
  const current = drill();
  renderTabs();
  $('#gymTitle').textContent = current.name;
  $('#gymHow').innerHTML = current.how;
  $('#gymLevel').innerHTML = current.levels.map((label, level) => `<option value="${level}">Level ${level + 1} · ${label}</option>`).join('');
  $('#gymLevel').value = gym.levels[current.id] ?? 0;
  $('#gymExtraWrap').hidden = !current.extra;
  if (current.extra) {
    $('#gymExtraLabel').textContent = current.extra.label;
    $('#gymExtra').innerHTML = current.extra.options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    $('#gymExtra').value = gym.extras[current.id] ?? current.extra.options[0][0];
  }
  newQuestion(false);
}
function newQuestion(autoplay = true) {
  stopAll();
  const current = drill();
  gym.q = current.make(Number($('#gymLevel').value), current.extra ? $('#gymExtra').value : null);
  gym.answered = false;
  gym.micHits = 0;
  $('#gymPrompt').innerHTML = gym.q.prompt;
  $('#gymRef').hidden = !gym.q.reference;
  $('#gymRef').textContent = gym.q.referenceLabel ?? 'Reference';
  $('#gymAnswers').className = `gym-answers${gym.q.frets ? ' is-frets' : ''}`;
  $('#gymAnswers').innerHTML = gym.q.options.map((option, index) => `<button type="button" data-answer="${option.id}"><kbd>${index + 1 <= 9 ? index + 1 : ''}</kbd><b>${option.label}</b>${option.sub ? `<small>${option.sub}</small>` : ''}</button>`).join('') + (gym.q.mic ? `<p class="mic-hint" id="micHint">${mic.on ? '🎤 Listening… play the note.' : '<button type="button" class="hear-button" data-mic-start>🎤 Turn on the microphone</button>'}</p>` : '');
  $('#gymFeedback').innerHTML = '<p class="fb-wait">Press <b>Play</b> (or Space) to hear it, then answer. Number keys pick an answer; Enter moves on.</p>';
  renderScore();
  if (autoplay) gym.q.play();
}
function answer(id) {
  if (gym.answered || !gym.q) return;
  gym.answered = true;
  const current = drill();
  const correct = id === gym.q.answer;
  const record = stats[current.id] ?? { right: 0, total: 0, best: 0 };
  record.total += 1;
  if (correct) { record.right += 1; gym.streak += 1; record.best = Math.max(record.best, gym.streak); } else gym.streak = 0;
  stats[current.id] = record;
  saveStats();
  renderScore();
  renderStats();
  document.querySelectorAll('#gymAnswers [data-answer]').forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === gym.q.answer) button.classList.add('is-correct');
    if (button.dataset.answer === id && !correct) button.classList.add('is-wrong');
  });
  const levelUp = correct && gym.streak > 0 && gym.streak % 10 === 0 && Number($('#gymLevel').value) < current.levels.length - 1;
  const chosen = gym.q.options.find((option) => option.id === id);
  $('#gymFeedback').innerHTML = `<p class="fb-result ${correct ? 'is-right' : 'is-wrong'}">${correct ? '✓ Correct!' : `✗ Not quite${chosen && id !== 'giveup' ? ` (you chose ${chosen.label})` : ''}.`}</p><p>${gym.q.explain()}</p><div class="fb-actions">${gym.q.after ? '<button type="button" class="hear-button" data-fb="after">▶ Hear it again</button>' : ''}${!correct && gym.q.hear && chosen && id !== 'giveup' ? `<button type="button" class="hear-button" data-fb="hear" data-id="${id}">▶ Hear your answer (${chosen.label})</button>` : ''}<button type="button" class="hear-button is-next" data-fb="next">Next →</button></div>${levelUp ? `<p class="fb-level">🎉 ${gym.streak} in a row! Try <b>level ${Number($('#gymLevel').value) + 2}</b>. <button type="button" class="hear-button" data-fb="levelup">Level up</button></p>` : ''}`;
  if (gym.q.after) later(correct ? 350 : 500, () => gym.q.after());
}
$('#gymTabs').addEventListener('click', (event) => { const tab = event.target.closest('[data-drill]'); if (tab) selectDrill(Number(tab.dataset.drill)); });
$('#gymLevel').addEventListener('change', () => { gym.levels[drill().id] = Number($('#gymLevel').value); gym.streak = 0; newQuestion(false); });
$('#gymExtra').addEventListener('change', () => { gym.extras[drill().id] = $('#gymExtra').value; newQuestion(false); });
$('#gymPlay').addEventListener('click', () => { stopAll(); gym.q?.play(); });
$('#gymRef').addEventListener('click', () => { stopAll(); gym.q?.reference?.(); });
$('#gymNext').addEventListener('click', () => newQuestion());
$('#gymAnswers').addEventListener('click', (event) => {
  if (event.target.closest('[data-mic-start]')) { startMic(); return; }
  const button = event.target.closest('[data-answer]');
  if (button) answer(button.dataset.answer);
});
$('#gymFeedback').addEventListener('click', (event) => {
  const button = event.target.closest('[data-fb]');
  if (!button) return;
  stopAll();
  const action = button.dataset.fb;
  if (action === 'after') gym.q.after();
  if (action === 'hear') gym.q.hear(button.dataset.id);
  if (action === 'next') newQuestion();
  if (action === 'levelup') { $('#gymLevel').value = Number($('#gymLevel').value) + 1; gym.levels[drill().id] = Number($('#gymLevel').value); gym.streak = 0; newQuestion(); }
});
document.addEventListener('keydown', (event) => {
  if (event.target.closest('input, select, textarea') || event.ctrlKey || event.metaKey || event.altKey) return;
  const gymRect = $('#gym').getBoundingClientRect();
  if (gymRect.bottom < 0 || gymRect.top > innerHeight) return;
  if (event.key === ' ') { event.preventDefault(); stopAll(); gym.q?.play(); }
  else if (event.key === 'Enter') { event.preventDefault(); if (gym.answered) newQuestion(); else { stopAll(); gym.q?.play(); } }
  else if (/^[1-9]$/.test(event.key)) { const option = gym.q?.options[Number(event.key) - 1]; if (option && !gym.q.mic) answer(option.id); }
});

// ---------- 06 microphone note detector ----------
const mic = { on: false, ctx: null, analyser: null, stream: null, buf: null, timer: null, ignoreUntil: 0, shown: null };
// Autocorrelation pitch detection: find the lag at which the signal best matches itself.
function detectPitch(buffer, sampleRate) {
  let size = buffer.length;
  let rms = 0;
  for (let index = 0; index < size; index += 1) rms += buffer[index] * buffer[index];
  if (Math.sqrt(rms / size) < .012) return -1;
  let start = 0, end = size - 1;
  for (let index = 0; index < size / 2; index += 1) if (Math.abs(buffer[index]) < .2) { start = index; break; }
  for (let index = 1; index < size / 2; index += 1) if (Math.abs(buffer[size - index]) < .2) { end = size - index; break; }
  const trimmed = buffer.slice(start, end);
  size = trimmed.length;
  const maxLag = Math.min(size, Math.floor(sampleRate / 70));
  const correlation = new Float32Array(maxLag);
  for (let lag = 0; lag < maxLag; lag += 1) {
    let sum = 0;
    for (let index = 0; index < size - lag; index += 1) sum += trimmed[index] * trimmed[index + lag];
    correlation[lag] = sum;
  }
  let dip = 0;
  while (dip < maxLag - 1 && correlation[dip] > correlation[dip + 1]) dip += 1;
  let best = -1, bestLag = -1;
  for (let lag = dip; lag < maxLag; lag += 1) if (correlation[lag] > best) { best = correlation[lag]; bestLag = lag; }
  if (bestLag <= 0 || bestLag >= maxLag - 1) return -1;
  const [a, b, c] = [correlation[bestLag - 1], correlation[bestLag], correlation[bestLag + 1]];
  const curve = (a + c - 2 * b) / 2;
  const shift = curve ? -(c - a) / 2 / (2 * curve) : 0;
  return sampleRate / (bestLag + shift);
}
function renderDetectorBoard(midi) {
  const cells = [];
  for (let string = 0; string < 6; string += 1) for (let fret = 0; fret <= MAX_FRET; fret += 1) {
    const here = STRING_MIDI[string] + fret;
    if (midi !== null && pc(here) === pc(midi)) cells.push({ s: string, f: fret, cls: here === midi ? 'root' : 'faint', label: noteName(here), title: `${noteName(here)}${octaveOf(here)} · string ${6 - string}, fret ${fret}` });
  }
  $('#detBoard').innerHTML = neckSvg(cells, { label: midi === null ? 'Fretboard' : `Every place to play ${noteName(midi)}` });
}
function micTick() {
  mic.analyser.getFloatTimeDomainData(mic.buf);
  if (performance.now() < mic.ignoreUntil) return;
  const frequency = detectPitch(mic.buf, mic.ctx.sampleRate);
  if (frequency < 70 || frequency > 1400) { $('#detInfo').textContent = 'Listening… play one note at a time.'; gym.micHits = 0; return; }
  const exact = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);
  $('#detName').textContent = noteName(midi);
  $('#detOctave').textContent = octaveOf(midi);
  $('#detNeedle').style.left = `${50 + cents}%`;
  $('#detNeedle').className = Math.abs(cents) <= 8 ? 'is-in' : '';
  $('#detInfo').textContent = `${frequency.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${cents} cents${Math.abs(cents) <= 8 ? ' · in tune' : cents < 0 ? ' · a little flat' : ' · a little sharp'}`;
  if (mic.shown !== midi) { mic.shown = midi; renderDetectorBoard(midi); }
  // Play-it-back drill: the same note for a few readings in a row counts as an answer.
  if (gym.q?.mic && !gym.answered) {
    const match = gym.q.exact ? midi === gym.q.target : pc(midi) === pc(gym.q.target);
    gym.micHits = match ? gym.micHits + 1 : 0;
    const hint = $('#micHint');
    if (hint) hint.textContent = `🎤 Hearing ${noteName(midi)}${octaveOf(midi)}${match ? ' ✓' : '…'}`;
    if (gym.micHits >= 4) answer('mic');
  }
}
async function startMic() {
  if (mic.on) return;
  try {
    mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (error) {
    $('#micStatus').textContent = `Couldn't open the microphone (${error.name}). Allow microphone access in the browser; if the page was opened as a file, serve it from localhost instead.`;
    return;
  }
  mic.ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = mic.ctx.createMediaStreamSource(mic.stream);
  mic.analyser = mic.ctx.createAnalyser();
  mic.analyser.fftSize = 2048;
  source.connect(mic.analyser);
  mic.buf = new Float32Array(mic.analyser.fftSize);
  mic.timer = setInterval(micTick, 90);
  mic.on = true;
  $('#micToggle').textContent = '■ Stop microphone';
  $('#micStatus').textContent = 'Listening. Play one note at a time and let it ring.';
  const hint = $('#micHint');
  if (hint) hint.textContent = '🎤 Listening… play the note.';
}
function stopMic() {
  clearInterval(mic.timer);
  mic.stream?.getTracks().forEach((track) => track.stop());
  mic.ctx?.close();
  Object.assign(mic, { on: false, ctx: null, analyser: null, stream: null, shown: null });
  $('#micToggle').textContent = '🎤 Start microphone';
  $('#micStatus').textContent = 'Microphone off.';
}
$('#micToggle').addEventListener('click', () => (mic.on ? stopMic() : startMic()));
renderDetectorBoard(null);
wirePlayback($('#detBoard'));

// ---------- 07 progress ----------
function renderStats() {
  $('#statsTable').innerHTML = `<thead><tr><th>Drill</th><th>Right</th><th>Answered</th><th>Accuracy</th><th>Best streak</th></tr></thead><tbody>${DRILLS.map((item) => {
    const record = stats[item.id] ?? { right: 0, total: 0, best: 0 };
    const accuracy = record.total ? Math.round(record.right / record.total * 100) : 0;
    return `<tr><td><button type="button" class="stats-link" data-goto="${DRILLS.indexOf(item)}">${item.name}</button></td><td>${record.right}</td><td>${record.total}</td><td><div class="acc"><i style="width:${accuracy}%"></i></div>${record.total ? `${accuracy}%` : '–'}</td><td>${record.best}</td></tr>`;
  }).join('')}</tbody>`;
}
$('#statsTable').addEventListener('click', (event) => { const link = event.target.closest('[data-goto]'); if (link) { selectDrill(Number(link.dataset.goto)); $('#gym').scrollIntoView({ behavior: 'smooth' }); } });
$('#statsReset').addEventListener('click', () => { if (confirm('Reset all ear-training scores in this browser?')) { stats = {}; saveStats(); renderStats(); renderScore(); } });
document.addEventListener('click', (event) => { if (event.target.closest('[data-stop]')) stopAll(); });

renderStats();
selectDrill(1);
