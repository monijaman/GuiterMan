// Arpeggios page. Shared helpers (neckSvg, tabSvg, voicingFor, sound, chordModel...) come from ../fretboard.js.

// ---------- playback ----------
let timers = [];
function stopAll() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.is-playing, .is-now').forEach((item) => item.classList.remove('is-playing', 'is-now'));
}
function later(time, fn) { timers.push(setTimeout(fn, time)); }
function highlight(element, time, length, cls = 'is-playing') {
  if (!element) return;
  later(time, () => element.classList.add(cls));
  later(time + Math.max(60, length - 20), () => element.classList.remove(cls));
}
// Play tab notes (see tabSvg) with optional highlighting of the tab and a fretboard.
function scheduleNotes(notes, { beat, start = 0, tab, board, level = .26, ring = 1.6 }) {
  let position = start;
  notes.forEach((note, index) => {
    if (!Array.isArray(note)) return;
    const time = position * beat;
    const hits = note[0] === 'stack' ? note[1] : [[note[0], note[1]]];
    later(time, () => hits.forEach(([string, fret]) => sound.pluck(string, fret, { level, length: ring })));
    highlight(tab?.querySelector(`[data-index="${index}"]`), time, note[2] * beat);
    if (board) hits.forEach(([string, fret]) => later(time, () => flash(board, string, fret, note[2] * beat)));
    position += note[2];
  });
  return position;
}

// ---------- 01 what is it ----------
const C_SHAPE = [null, 3, 2, 0, 1, 0];
const C_ARP = [[1, 3, 'C', '1'], [2, 2, 'E', '3'], [3, 0, 'G', '5'], [4, 1, 'C', '1'], [5, 0, 'E', '3']];
const C_SCALE = [[1, 3, 'C'], [2, 0, 'D'], [2, 2, 'E'], [2, 3, 'F'], [3, 0, 'G'], [3, 2, 'A'], [4, 0, 'B'], [4, 1, 'C']];
$('#stackChord').innerHTML = ['G', 'E', 'C'].map((note) => `<span>${note}</span>`).join('');
$('#stackArp').innerHTML = C_ARP.map(([, , note, degree], index) => `<span data-step="${index}" style="--i:${index}">${note}<small>${degree}</small></span>`).join('');
$('#scaleRow').innerHTML = C_SCALE.map(([, , note], index) => `<span data-step="${index}" class="${['C', 'E', 'G'].includes(note) ? 'is-chord' : ''}">${note}</span>`).join('');
document.querySelector('#what').addEventListener('click', (event) => {
  const button = event.target.closest('[data-demo]');
  if (!button) return;
  stopAll();
  const demo = button.dataset.demo;
  if (demo === 'chord') { sound.strum(C_SHAPE); highlight($('#stackChord'), 0, 900, 'is-now'); }
  if (demo === 'arp') C_ARP.forEach(([string, fret], index) => { later(index * 330, () => sound.pluck(string, fret, { length: 2.4 })); highlight($(`#stackArp [data-step="${index}"]`), index * 330, 330, 'is-now'); });
  if (demo === 'scale') C_SCALE.forEach(([string, fret], index) => { later(index * 300, () => sound.pluck(string, fret, { length: .8 })); highlight($(`#scaleRow [data-step="${index}"]`), index * 300, 300, 'is-now'); });
});

// ---------- 02 shapes ----------
const apRoot = $('#apRoot');
const apType = $('#apType');
const apView = $('#apView');
const apLabels = $('#apLabels');
apRoot.innerHTML = chordModel.roots.map((root) => `<option>${root}</option>`).join('');
apType.innerHTML = Object.entries(chordModel.qualities).map(([id, quality]) => `<option value="${id}">${quality.label}</option>`).join('');
apRoot.value = 'C';
apType.value = 'major';

function shapeWindow(rootPitch, rootString) {
  let rootFret = (rootPitch - chordModel.stringPitches[rootString] + 12) % 12;
  if (rootFret < 2) rootFret += 12;
  if (rootFret + 3 > MAX_FRET) rootFret -= 12;
  return { rootFret, low: Math.max(0, rootFret - 1), high: rootFret + 3 };
}
function shapeCells() {
  const root = apRoot.value;
  const quality = apType.value;
  const tones = chordModel.spellTones(root, quality);
  const byPitch = new Map(tones.map((tone) => [tone.pitch, tone]));
  const view = apView.value;
  const span = view === 'all' ? null : shapeWindow(chordModel.pitchByName[root], Number(view));
  const seen = new Set();
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const tone = byPitch.get(pitchAt(s, f));
    if (!tone) continue;
    const midi = STRING_MIDI[s] + f;
    let inShape = !span || (f >= span.low && f <= span.high);
    // Each pitch once per shape: the same note on the next string is left for the neighbouring shape.
    if (inShape && span) { if (seen.has(midi)) inShape = false; else seen.add(midi); }
    cells.push({ s, f, midi, inShape, cls: !inShape ? 'faint' : tone.semitones === 0 ? 'root' : 'note', label: apLabels.value === 'degree' ? tone.label : tone.note, title: `${tone.note} (${tone.label}) · string ${6 - s}, fret ${f}` });
  }
  return { cells, tones, span, root, quality };
}
function renderShapes() {
  const { cells, tones, span, root, quality } = shapeCells();
  const definition = chordModel.qualities[quality];
  const symbol = `${root}${definition.suffix}`;
  $('#apBoard').innerHTML = neckSvg(cells, { label: `${symbol} arpeggio` });
  $('#apSummary').innerHTML = `<div class="scale-notes">${tones.map((tone) => `<span class="${tone.semitones === 0 ? 'is-root' : ''}"><b>${tone.note}</b><small>${tone.label}</small></span>`).join('')}</div><p><b>${symbol} arpeggio</b> · formula ${tones.map((tone) => tone.label).join(' – ')}${span ? ` · shape spans frets ${span.low}–${span.high}` : ''} · <a href="../chords/detail.html?root=${encodeURIComponent(root)}&quality=${quality}">${symbol} chord shapes ↗</a></p>`;
}
[apRoot, apType, apView, apLabels].forEach((control) => control.addEventListener('change', renderShapes));
$('#apPlay').addEventListener('click', () => {
  stopAll();
  let { cells } = shapeCells();
  if (apView.value === 'all') {
    const saved = apView.value;
    apView.value = '1';
    cells = shapeCells().cells;
    apView.value = saved;
  }
  const notes = cells.filter((cell) => cell.inShape).sort((a, b) => a.midi - b.midi);
  const run = [...notes, ...notes.slice(0, -1).reverse()];
  run.forEach((cell, index) => later(index * 230, () => { sound.pluck(cell.s, cell.f, { length: 1 }); flash($('#apBoard'), cell.s, cell.f, 230); }));
});
wirePlayback($('#apBoard'));

// ---------- 03 picking patterns ----------
// Steps: 'B' = bass (lowest sounding string, normally the root), 'alt' = alternate bass, 0–5 = string (0 = low E).
const PATTERNS = {
  rolling: { name: 'Rolling (p-i-m-a)', meter: '4/4', seq: [['B'], [3], [4], [5], ['B'], [3], [4], [5]], hand: 'Fingers: thumb · index · middle · ring', text: 'Thumb on the bass, then index, middle and ring on G, B, e. Smooth and even: the classic fingerpicked ballad sound.', use: 'Folk and pop ballads, soft verses.' },
  updown: { name: 'Up and down', meter: '4/4', seq: [['B'], [3], [4], [5], [4], [3], [4], [3]], hand: 'Pick or fingers', text: 'Climb to the top string and come back down. Very flowing, like a piano part.', use: 'Pop verses, intros, piano-style guitar.' },
  travis: { name: 'Alternating bass (Travis)', meter: '4/4', seq: [['B', 5], [4], ['alt'], [3], ['B', 4], [5], ['alt'], [3]], hand: 'Thumb keeps a steady 1-2-3-4', text: 'The thumb alternates between the root and another bass string on every beat while the fingers fill the gaps. It sounds like bass and guitar at once.', use: 'Country, folk and fingerstyle.' },
  pinch: { name: 'Pinch', meter: '4/4', seq: [['B', 5], [3], [4], [3], ['alt', 5], [3], [4], [3]], hand: 'Thumb + ring together on 1 and 3', text: 'Thumb and ring finger pluck together on the beat (a "pinch"); the inner strings fill in. The top note can carry a melody.', use: 'Indie, worship, singer-songwriter.' },
  ballad68: { name: '6/8 ballad', meter: '6/8', seq: [['B'], [3], [4], [5], [4], [3]], hand: 'Count 1-2-3-4-5-6, lean on 1 and 4', text: 'Six eighth notes per bar with a gentle swing on 1 and 4. It feels like a slow waltz.', use: 'Slow ballads, love songs, slow rock in 6/8.' },
  pick: { name: 'Flatpick "let ring"', meter: '4/4', seq: [['B'], [2], [3], [4], [5], [4], [3], [2]], hand: 'Pick: down–down–down… then up', text: 'With a pick, sweep down from the bass one string at a time, then back up. Hold the chord so every note keeps ringing.', use: 'Rock and pop intros, clean electric guitar.' }
};
function resolveString(target, frets, used) {
  const sounding = frets.map((fret, index) => fret === null ? null : index).filter((index) => index !== null);
  const bass = sounding[0];
  if (target === 'B') return bass;
  if (target === 'alt') {
    const preferred = bass < 2 && frets[2] !== null ? 2 : sounding.find((index) => index > bass);
    return preferred ?? bass;
  }
  if (frets[target] !== null && target > bass) return target;
  return sounding.find((index) => index > Math.max(target, bass) && !used.has(index)) ?? sounding.at(-1);
}
function patternBar(patternId, frets) {
  return PATTERNS[patternId].seq.map((step) => {
    const used = new Set();
    const strings = step.map((target) => { const string = resolveString(target, frets, used); used.add(string); return string; });
    const unique = [...new Set(strings)];
    return unique.length > 1 ? ['stack', unique.map((string) => [string, frets[string]]), .5] : [unique[0], frets[unique[0]], .5];
  });
}
$('#patternGrid').innerHTML = Object.entries(PATTERNS).map(([id, pattern]) => {
  const notes = [{ chord: 'C' }, ...patternBar(id, C_SHAPE)];
  return `<article class="pattern-card" data-pattern-card="${id}"><header><div><small>${pattern.meter} · ${pattern.hand}</small><h3>${pattern.name}</h3></div><button class="play-button" type="button" data-pattern="${id}" aria-label="Play ${pattern.name}">▶</button></header><div class="tab-scroll">${tabSvg({ name: pattern.name, notes }, 0, 34)}</div><p>${pattern.text}</p><p class="pattern-use"><b>Used in:</b> ${pattern.use}</p></article>`;
}).join('');
$('#patternGrid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-pattern]');
  if (!button) return;
  stopAll();
  const id = button.dataset.pattern;
  const card = button.closest('.pattern-card');
  const notes = [{ chord: 'C' }, ...patternBar(id, C_SHAPE)];
  const beat = 60000 / 80;
  const end = scheduleNotes(notes, { beat, tab: card });
  scheduleNotes(notes, { beat, start: end, tab: card });
});

// ---------- 04 song examples ----------
const EXAMPLES = [
  { id: 'folk', name: 'Folk ballad', key: 'G major', chords: [['G', 'major'], ['E', 'minor'], ['C', 'major'], ['D', 'major']], pattern: 'rolling', tempo: 76,
    why: 'I–vi–IV–V in G uses four open chords, so the picking hand can stay relaxed. The rolling pattern keeps the bass (the root) on beat 1 and 3, which tells the listener each chord change clearly while the voice sits on top.',
    form: ['Intro · arpeggio, 2 loops', 'Verse · arpeggio', 'Chorus · strum D D U U D U', 'Verse · arpeggio', 'Outro · slow arpeggio, end on G'],
    tips: ['Let the bass notes ring into the next bar.', 'In the chorus switch to strumming: the contrast makes the chorus feel bigger.', 'Hum a melody over it using the top notes of each bar.'] },
  { id: 'pop', name: 'Pop verse', key: 'C major', chords: [['C', 'major'], ['G', 'major'], ['A', 'minor'], ['F', 'major']], pattern: 'updown', tempo: 84,
    why: 'I–V–vi–IV is the most common pop loop. A constant up-and-down eighth-note arpeggio works like a piano part: it fills the space under a vocal without the volume of a strum.',
    form: ['Intro · arpeggio', 'Verse · arpeggio (quiet)', 'Pre-chorus · arpeggio, louder', 'Chorus · full strum', 'Bridge · arpeggio only on beats 1 and 3'],
    tips: ['F is a barre: if it is hard, play the xx3211 mini F shape.', 'Build intensity by picking harder, not faster.', 'Palm-mute lightly in verse one, open up in verse two.'] },
  { id: 'waltz', name: '6/8 ballad', key: 'D major', chords: [['D', 'major'], ['B', 'minor'], ['G', 'major'], ['A', 'major']], pattern: 'ballad68', tempo: 60,
    why: 'Six notes per bar give the gentle rocking feel of a slow love song. Leaning on the bass (beat 1) and the top string (beat 4) creates the "one-two-three, four-five-six" sway.',
    form: ['Intro · 2 loops of arpeggio', 'Verse · arpeggio', 'Chorus · strum on 1 and 4 only', 'Instrumental · arpeggio with melody on the top string', 'Outro · end on a held D chord'],
    tips: ['Count "1-2-3-4-5-6" out loud the first few times.', 'Keep it slow; 6/8 ballads rarely rush.', 'Try the same chords with the rolling pattern to hear the 4/4 version.'] },
  { id: 'rock', name: 'Dark rock intro', key: 'A minor', chords: [['A', 'minor'], ['C', 'major'], ['D', 'major'], ['F', 'major']], pattern: 'pick', tempo: 92,
    why: 'Minor key with a bright D major (borrowed from A Dorian) gives a moody, cinematic loop. A flatpicked "let ring" arpeggio on a clean or slightly overdriven electric is the classic way to open a rock song before the band comes in.',
    form: ['Intro · arpeggio alone', 'Verse · arpeggio + bass and drums', 'Chorus · power chords', 'Solo · Am pentatonic over the same loop', 'Outro · arpeggio fades on Am'],
    tips: ['Use a little reverb or delay if you have it.', 'Keep all down-strokes on the way down for an even attack.', 'The F barre can be played as xx3211.'] },
  { id: 'fingerstyle', name: 'Fingerstyle folk', key: 'C major', chords: [['C', 'major'], ['A', 'minor'], ['F', 'major'], ['G', 'major']], pattern: 'travis', tempo: 92,
    why: 'The alternating-bass (Travis) pattern gives one guitar the sound of bass and rhythm together. Over I–vi–IV–V the thumb plays the root on the beat while the fingers pick the chord between.',
    form: ['Intro · Travis pattern', 'Verse · Travis pattern', 'Chorus · Travis pattern, add strummed accents', 'Instrumental · melody on the top string, thumb keeps going', 'Outro · slow down, end on C'],
    tips: ['Practise the thumb alone first: root, alt, root, alt.', 'Rest your pinky on the guitar top for stability.', 'Speed comes last; evenness comes first.'] },
  { id: 'indie', name: 'Indie / worship', key: 'G major', chords: [['E', 'minor'], ['C', 'major'], ['G', 'major'], ['D', 'major']], pattern: 'pinch', tempo: 80,
    why: 'vi–IV–I–V starting on Em feels hopeful but unresolved. Pinching bass and treble together on the beat creates a clear pulse, and the top string notes form a simple melody over the changes.',
    form: ['Intro · pinch pattern', 'Verse · pinch pattern', 'Build · add a capo-2 second guitar strumming', 'Chorus · full strum', 'Bridge · pinches on beat 1 only'],
    tips: ['Put a capo on fret 2 to fit your voice: the shapes stay the same.', 'Make the pinches slightly louder than the inner notes.', 'Try Cadd9 (x32033) instead of C for a shimmering sound.'] }
];
let currentExample = 0;
let examplePattern = null;
function exampleNotes(example, patternId) {
  const notes = [];
  example.chords.forEach(([root, quality], bar) => {
    if (bar) notes.push('|');
    notes.push({ chord: `${root}${chordModel.qualities[quality].suffix}` });
    notes.push(...patternBar(patternId, voicingFor(root, quality)));
  });
  return notes;
}
function renderExample() {
  stopAll();
  const example = EXAMPLES[currentExample];
  const patternId = examplePattern ?? example.pattern;
  $('#exampleTabs').innerHTML = EXAMPLES.map((item, index) => `<button type="button" role="tab" aria-selected="${index === currentExample}" class="${index === currentExample ? 'is-current' : ''}" data-example="${index}"><small>${item.key}</small>${item.name}</button>`).join('');
  const chordCards = example.chords.map(([root, quality], bar) => {
    const frets = voicingFor(root, quality);
    const symbol = `${root}${chordModel.qualities[quality].suffix}`;
    return `<div class="song-chord" data-bar="${bar}"><div class="song-chord-head"><div><small>Bar ${bar + 1}</small><a href="../chords/detail.html?root=${encodeURIComponent(root)}&quality=${quality}"><b>${symbol}</b></a></div></div>${sound.svg(frets, chordModel.voicingNotes(frets, root, quality), { title: symbol })}</div>`;
  }).join('');
  $('#exampleBody').innerHTML = `<header><span>${currentExample + 1}</span><div><p class="eyebrow">EXAMPLE · ${example.key.toUpperCase()} · ${PATTERNS[patternId].meter}</p><h3>${example.name}: ${example.chords.map(([root, quality]) => `${root}${chordModel.qualities[quality].suffix}`).join(' – ')}</h3></div></header>
    <div class="scale-toolbar"><label>PATTERN<select id="examplePattern">${Object.entries(PATTERNS).map(([id, pattern]) => `<option value="${id}" ${id === patternId ? 'selected' : ''}>${pattern.name}${id === example.pattern ? ' (suggested)' : ''}</option>`).join('')}</select></label><button class="hear-button" type="button" id="examplePlay">▶ Play example (2 loops)</button><button class="hear-button" type="button" id="exampleStop">■ Stop</button><p class="toolbar-hint">${example.tempo} BPM</p></div>
    <div class="workshop-chords">${chordCards}</div>
    <div class="tab-scroll song-tab" id="exampleTab">${tabSvg({ name: example.name, notes: exampleNotes(example, patternId) }, 0, 30)}</div>
    <div class="example-info"><div><h4>Why arpeggios work here</h4><p>${example.why}</p></div><div><h4>Where it goes in the song</h4><ol class="song-map">${example.form.map((part) => `<li class="${/arpeggio|pattern|pinch/i.test(part) ? 'is-arp' : ''}">${part}</li>`).join('')}</ol></div></div>
    <div class="song-try"><b>Try this</b><ul>${example.tips.map((tip) => `<li>${tip}</li>`).join('')}</ul></div>`;
  $('#examplePattern').addEventListener('change', (event) => { examplePattern = event.target.value; renderExample(); });
  $('#examplePlay').addEventListener('click', () => {
    stopAll();
    const notes = exampleNotes(example, patternId);
    const beat = 60000 / example.tempo;
    const barBeats = PATTERNS[patternId].seq.length * .5;
    let start = 0;
    for (let loop = 0; loop < 2; loop += 1) {
      example.chords.forEach((_, bar) => highlight($(`#exampleBody [data-bar="${bar}"]`), (start + bar * barBeats) * beat, barBeats * beat, 'is-now'));
      start = scheduleNotes(notes, { beat, start, tab: $('#exampleTab') });
    }
    const [root, quality] = example.chords[0];
    later(start * beat, () => sound.strum(voicingFor(root, quality), { gap: .06 }));
  });
  $('#exampleStop').addEventListener('click', stopAll);
}
$('#exampleTabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-example]');
  if (!button) return;
  currentExample = Number(button.dataset.example);
  examplePattern = null;
  renderExample();
});
renderExample();

// ---------- 05 soloing ----------
const SOLOS = [
  { name: 'Am – F – C – G · rock/pop, 5th position', chords: [['A', 'minor'], ['F', 'major'], ['C', 'major'], ['G', 'major']], low: 4, high: 8, tempo: 84, hint: 'Triad arpeggios. Watch how each bar starts next to where the last one ended.' },
  { name: 'Dm7 – G7 – Cmaj7 · jazz ii–V–I', chords: [['D', 'minor7'], ['G', 'dominant7'], ['C', 'major7'], ['C', 'major7']], low: 7, high: 10, tempo: 96, hint: 'Four-note 7th arpeggios. Listen for the 7th of each chord falling to the 3rd of the next.' },
  { name: 'E7 – A7 – B7 – E7 · blues', chords: [['E', 'dominant7'], ['A', 'dominant7'], ['B', 'dominant7'], ['E', 'dominant7']], low: 4, high: 8, tempo: 92, hint: 'Dominant 7 arpeggios give the "right" notes over each blues chord, beyond the one-box pentatonic.' },
  { name: 'Em – C – G – D · pop, 7th position', chords: [['E', 'minor'], ['C', 'major'], ['G', 'major'], ['D', 'major']], low: 7, high: 10, tempo: 88, hint: 'The same idea higher up the neck, in G major.' }
];
const soloSelect = $('#soloSelect');
soloSelect.innerHTML = SOLOS.map((solo, index) => `<option value="${index}">${solo.name}</option>`).join('');
let soloChord = 0;
function positionFor(midi, low, high) {
  for (let s = 0; s < 6; s += 1) {
    const fret = midi - STRING_MIDI[s];
    if (fret >= low && fret <= high) return { s, f: fret };
  }
  return null;
}
function tonesInWindow(root, quality, low, high) {
  const pcs = new Set(chordModel.spellTones(root, quality).map((tone) => tone.pitch));
  const list = [];
  for (let midi = STRING_MIDI[0] + low; midi <= STRING_MIDI[5] + high; midi += 1) if (pcs.has(midi % 12) && positionFor(midi, low, high)) list.push(midi);
  return list;
}
function soloLine(solo) {
  const notes = [];
  let previous = null;
  solo.chords.forEach(([root, quality], bar) => {
    const tones = tonesInWindow(root, quality, solo.low, solo.high);
    const rootPc = chordModel.pitchByName[root];
    // Start on the lowest root, then on each change start next to the previous note (but not on it).
    let index = Math.max(0, tones.findIndex((midi) => midi % 12 === rootPc));
    if (previous !== null) {
      const nearest = tones.filter((midi) => midi !== previous).sort((a, b) => Math.abs(a - previous) - Math.abs(b - previous))[0];
      index = tones.indexOf(nearest);
    }
    let direction = bar % 2 === 0 ? 1 : -1;
    if (index + direction < 0 || index + direction >= tones.length) direction *= -1;
    if (bar) notes.push('|');
    notes.push({ chord: `${root}${chordModel.qualities[quality].suffix}` });
    const last = bar === solo.chords.length - 1;
    const count = last ? 6 : 8;
    for (let step = 0; step < count; step += 1) {
      const { s, f } = positionFor(tones[index], solo.low, solo.high);
      notes.push([s, f, .5]);
      previous = tones[index];
      if (index + direction < 0 || index + direction >= tones.length) direction *= -1;
      index += direction;
    }
    if (last) {
      // End on the nearest root, held for a beat.
      const roots = tones.filter((midi) => midi % 12 === rootPc);
      const end = roots.reduce((best, midi) => Math.abs(midi - previous) < Math.abs(best - previous) ? midi : best, roots[0]);
      const { s, f } = positionFor(end, solo.low, solo.high);
      notes.push([s, f, 1, 'v']);
    }
  });
  return notes;
}
function renderSolo() {
  stopAll();
  const solo = SOLOS[Number(soloSelect.value)];
  $('#soloHint').textContent = solo.hint;
  $('#soloChords').innerHTML = solo.chords.map(([root, quality], index) => `<button type="button" class="${index === soloChord ? 'is-current' : ''}" data-solo-chord="${index}"><small>Bar ${index + 1}</small><b>${root}${chordModel.qualities[quality].suffix}</b><span>${chordModel.spellTones(root, quality).map((tone) => tone.note).join(' ')}</span></button>`).join('');
  $('#soloTab').innerHTML = tabSvg({ name: solo.name, notes: soloLine(solo) }, 0, 34);
  renderSoloBoard(solo);
}
function renderSoloBoard(solo) {
  const [root, quality] = solo.chords[soloChord];
  const tones = chordModel.spellTones(root, quality);
  const current = new Map(tones.map((tone) => [tone.pitch, tone]));
  const others = new Set(solo.chords.flatMap(([r, q]) => chordModel.spellTones(r, q).map((tone) => tone.pitch)));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = solo.low; f <= solo.high; f += 1) {
    const pitch = pitchAt(s, f);
    const tone = current.get(pitch);
    if (tone) cells.push({ s, f, cls: tone.semitones === 0 ? 'root' : 'note', label: tone.note, title: `${tone.note} (${tone.label} of ${root}${chordModel.qualities[quality].suffix})` });
    else if (others.has(pitch)) cells.push({ s, f, cls: 'faint', label: SHARPS[pitch] });
  }
  $('#soloBoard').innerHTML = neckSvg(cells, { label: 'Arpeggio solo position' });
  document.querySelectorAll('#soloChords button').forEach((button, index) => button.classList.toggle('is-current', index === soloChord));
}
soloSelect.addEventListener('change', () => { soloChord = 0; renderSolo(); });
$('#soloChords').addEventListener('click', (event) => {
  const button = event.target.closest('[data-solo-chord]');
  if (!button) return;
  soloChord = Number(button.dataset.soloChord);
  renderSoloBoard(SOLOS[Number(soloSelect.value)]);
});
$('#soloPlay').addEventListener('click', () => {
  stopAll();
  const solo = SOLOS[Number(soloSelect.value)];
  const beat = 60000 / solo.tempo;
  solo.chords.forEach(([root, quality], bar) => later(bar * 4 * beat, () => {
    soloChord = bar;
    renderSoloBoard(solo);
    sound.strum(voicingFor(root, quality), { level: .08, gap: .02 });
  }));
  scheduleNotes(soloLine(solo), { beat, tab: $('#soloTab'), board: $('#soloBoard'), level: .32, ring: 1 });
});
wirePlayback($('#soloBoard'));

renderShapes();
renderSolo();
