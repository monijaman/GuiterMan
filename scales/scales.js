const SCALES = {
  major: { label: 'Major (Ionian)', steps: [0, 2, 4, 5, 7, 9, 11], labels: ['1', '2', '3', '4', '5', '6', '7'], mood: 'Bright and resolved: the sound of most pop and folk melodies.', use: 'Major keys; over I, IV and V chords.', parent: 0 },
  minor: { label: 'Natural minor (Aeolian)', steps: [0, 2, 3, 5, 7, 8, 10], labels: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], mood: 'Sad, serious, epic.', use: 'Minor keys; rock and pop ballads in minor.', parent: 9, colour: 'b6 gives the dark, dramatic colour.' },
  majorPentatonic: { label: 'Major pentatonic', steps: [0, 2, 4, 7, 9], labels: ['1', '2', '3', '5', '6'], mood: 'Open, happy, country and southern rock.', use: 'Major chords and major keys; very hard to hit a wrong note.', harmonyFrom: 'major', box: true },
  minorPentatonic: { label: 'Minor pentatonic', steps: [0, 3, 5, 7, 10], labels: ['1', 'b3', '4', '5', 'b7'], mood: 'The rock and blues workhorse.', use: 'Minor keys, blues, rock riffs and solos.', harmonyFrom: 'minor', box: true },
  blues: { label: 'Blues (minor pentatonic + b5)', steps: [0, 3, 5, 6, 7, 10], labels: ['1', 'b3', '4', 'b5', '5', 'b7'], mood: 'Gritty and vocal.', use: 'Blues and rock. Treat the b5 as a passing note, not a resting one.', harmonyFrom: 'minor', boxSteps: [0, 3, 5, 7, 10], colour: 'The b5 "blue note" sits between the 4 and 5.' },
  dorian: { label: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10], labels: ['1', '2', 'b3', '4', '5', '6', 'b7'], mood: 'Minor, but cool and hopeful.', use: 'Minor 7 chords, funk, jazz, Santana-style rock.', parent: 2, colour: 'The natural 6 is what separates it from natural minor.' },
  phrygian: { label: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10], labels: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], mood: 'Dark and Spanish-flavoured.', use: 'Metal riffs, flamenco-style minor vamps.', parent: 4, colour: 'The b2, a half step above the root, is its signature.' },
  lydian: { label: 'Lydian', steps: [0, 2, 4, 6, 7, 9, 11], labels: ['1', '2', '3', '#4', '5', '6', '7'], mood: 'Dreamy, floating, film-score major.', use: 'Major 7 chords, the IV chord of a major key.', parent: 5, colour: 'The #4 replaces the ordinary 4th.' },
  mixolydian: { label: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10], labels: ['1', '2', '3', '4', '5', '6', 'b7'], mood: 'Major with a bluesy edge.', use: 'Dominant 7 chords, classic rock, jam bands.', parent: 7, colour: 'The b7 turns major into a rock/blues sound.' },
  locrian: { label: 'Locrian', steps: [0, 1, 3, 5, 6, 8, 10], labels: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], mood: 'Unstable; rarely a home key.', use: 'Over m7b5 chords.', parent: 11, colour: 'The b5 makes the tonic chord diminished.' },
  harmonicMinor: { label: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11], labels: ['1', '2', 'b3', '4', '5', 'b6', '7'], mood: 'Classical, neoclassical, exotic.', use: 'Minor keys, especially over the V7 chord (E7 in A minor).', colour: 'The raised 7th creates a leading tone and a 1½-step gap.' },
  melodicMinor: { label: 'Melodic minor', steps: [0, 2, 3, 5, 7, 9, 11], labels: ['1', '2', 'b3', '4', '5', '6', '7'], mood: 'Smooth, jazzy minor.', use: 'Minor-major chords and jazz lines.', colour: 'A minor 3rd with an otherwise major scale.' }
};

// ---------- helpers ----------
function spell(root, scale) {
  const rootPitch = chordModel.pitchByName[root];
  const rootLetter = LETTERS.indexOf(root[0]);
  return scale.steps.map((step, index) => {
    const label = scale.labels[index];
    const degree = Number(label.replace(/[b#]/g, ''));
    const letter = LETTERS[(rootLetter + degree - 1) % 7];
    const pitch = (rootPitch + step) % 12;
    let accidental = (pitch - NATURAL[letter] + 12) % 12;
    if (accidental > 6) accidental -= 12;
    return { note: letter + (accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental)), label, pitch, step };
  });
}
function stepName(semitones) { return { 1: 'H', 2: 'W', 3: 'W+H', 4: '2W' }[semitones] ?? `${semitones}`; }

// Build a hand-position box by walking up the scale N notes per string (2 for pentatonic, 3 for 7-note scales).
function positionBox(root, steps, index) {
  const rootPitch = chordModel.pitchByName[root];
  const perString = steps.length === 7 ? 3 : 2;
  let startFret = (rootPitch - 4 + 12) % 12 + steps[index];
  if (startFret > 12) startFret -= 12;
  const pitches = new Set(steps.map((step) => (rootPitch + step) % 12));
  const cells = new Set();
  let midi = STRING_MIDI[0] + startFret;
  for (let string = 0; string < 6; string += 1) {
    let placed = 0;
    // The next string starts with the next scale note above the last one placed.
    while (placed < perString) {
      const fret = midi - STRING_MIDI[string];
      if (pitches.has(midi % 12) && fret >= 0) {
        cells.add(key(string, fret));
        placed += 1;
      }
      midi += 1;
      if (midi - STRING_MIDI[string] > MAX_FRET + 2) break;
    }
  }
  return cells;
}

// ---------- 01 fretboard ----------
const fbMode = $('#fbMode');
const fbNote = $('#fbNote');
fbNote.innerHTML = SHARPS.map((name, pitch) => `<option value="${pitch}">${name}${name.includes('#') ? ` / ${LETTERS[(LETTERS.indexOf(name[0]) + 1) % 7]}b` : ''}</option>`).join('');
function renderFretboard() {
  const mode = fbMode.value;
  $('#fbNoteWrap').hidden = mode !== 'find';
  const cells = [];
  for (let s = 0; s < 6; s += 1) {
    for (let f = 0; f <= MAX_FRET; f += 1) {
      const pitch = pitchAt(s, f);
      const natural = !SHARPS[pitch].includes('#');
      if (mode === 'natural' && !natural) continue;
      if (mode === 'find' && pitch !== Number(fbNote.value)) continue;
      const cls = mode === 'find' ? 'root' : natural ? (pitch === 0 ? 'root' : 'note') : 'sharp';
      cells.push({ s, f, cls, label: SHARPS[pitch], title: `${SHARPS[pitch]} · string ${6 - s}, fret ${f}` });
    }
  }
  $('#fbBoard').innerHTML = neckSvg(cells, { label: 'Fretboard note map' });
}
fbMode.addEventListener('change', renderFretboard);
fbNote.addEventListener('change', renderFretboard);
wirePlayback($('#fbBoard'));
renderFretboard();

// Quiz: find a natural note on a named string.
const quiz = { asked: 0, right: 0, target: null };
const quizBoard = $('#quizBoard');
quizBoard.dataset.quiz = 'on';
function quizCells(reveal = null) {
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= 12; f += 1) {
    const isAnswer = reveal && s === reveal.s && pitchAt(s, f) === reveal.pitch;
    cells.push({ s, f, cls: isAnswer ? 'root' : 'hot', label: isAnswer ? SHARPS[reveal.pitch] : '' });
  }
  return cells;
}
function nextQuestion() {
  const naturals = [0, 2, 4, 5, 7, 9, 11];
  quiz.target = { s: Math.floor(Math.random() * 6), pitch: naturals[Math.floor(Math.random() * 7)] };
  $('#quizPrompt').textContent = `Find ${SHARPS[quiz.target.pitch]} on the ${STRING_NAMES[quiz.target.s]} string (string ${6 - quiz.target.s})`;
  quizBoard.innerHTML = neckSvg(quizCells(), { label: 'Quiz fretboard', hot: true });
}
$('#quizStart').addEventListener('click', () => {
  Object.assign(quiz, { asked: 0, right: 0 });
  $('#quizScore').textContent = '0 / 0';
  $('#quizBoardWrap').hidden = false;
  $('#quizStart').textContent = 'Restart';
  $('#quizFeedback').textContent = 'Tap the fret. Frets 0–12 count; the same note an octave up counts too.';
  nextQuestion();
});
quizBoard.addEventListener('click', (event) => {
  const cell = event.target.closest('[data-s]');
  if (!cell || !quiz.target || quizBoard.dataset.locked) return;
  const s = Number(cell.dataset.s);
  const f = Number(cell.dataset.f);
  sound.pluck(s, f);
  const correct = s === quiz.target.s && pitchAt(s, f) === quiz.target.pitch;
  quiz.asked += 1;
  if (correct) quiz.right += 1;
  $('#quizScore').textContent = `${quiz.right} / ${quiz.asked}`;
  $('#quizFeedback').textContent = correct ? `Yes, ${SHARPS[quiz.target.pitch]} is at fret ${f}.` : s !== quiz.target.s ? `That's the ${STRING_NAMES[s]} string. Look on the ${STRING_NAMES[quiz.target.s]} string.` : `That's ${SHARPS[pitchAt(s, f)]}. ${SHARPS[quiz.target.pitch]} is shown in coral.`;
  quizBoard.innerHTML = neckSvg(quizCells(quiz.target), { label: 'Quiz fretboard', hot: true });
  quizBoard.dataset.locked = 'yes';
  setTimeout(() => { delete quizBoard.dataset.locked; nextQuestion(); }, correct ? 900 : 2200);
});

// ---------- 02 scales ----------
const scRoot = $('#scRoot');
const scType = $('#scType');
const scPosition = $('#scPosition');
const scLabels = $('#scLabels');
scRoot.innerHTML = chordModel.roots.map((root) => `<option>${root}</option>`).join('');
scType.innerHTML = Object.entries(SCALES).map(([id, scale]) => `<option value="${id}">${scale.label}</option>`).join('');
const params = new URLSearchParams(location.search);
scRoot.value = chordModel.roots.includes(params.get('root')) ? params.get('root') : 'A';
scType.value = SCALES[params.get('scale')] ? params.get('scale') : 'minorPentatonic';

function fillPositions() {
  const scale = SCALES[scType.value];
  const count = (scale.boxSteps ?? scale.steps).length;
  const previous = scPosition.value;
  scPosition.innerHTML = `<option value="all">Whole neck</option>` + Array.from({ length: count }, (_, index) => `<option value="${index}">Position ${index + 1}</option>`).join('');
  scPosition.value = previous && Number(previous) < count ? previous : '0';
}
function currentScaleCells() {
  const root = scRoot.value;
  const scale = SCALES[scType.value];
  const tones = spell(root, scale);
  const byPitch = new Map(tones.map((tone) => [tone.pitch, tone]));
  const position = scPosition.value;
  const box = position === 'all' ? null : positionBox(root, scale.boxSteps ?? scale.steps, Number(position));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const tone = byPitch.get(pitchAt(s, f));
    if (!tone) continue;
    let inBox = !box || box.has(key(s, f));
    // Blue notes are added to pentatonic boxes wherever they fall inside the box's fret span.
    if (box && !inBox && scale.boxSteps && !scale.boxSteps.includes(tone.step)) {
      const frets = [...box].map((cell) => Number(cell.split(':')[1]));
      inBox = f > Math.min(...frets) && f < Math.max(...frets);
    }
    const blue = scale.boxSteps && !scale.boxSteps.includes(tone.step);
    const cls = !inBox ? 'faint' : tone.step === 0 ? 'root' : blue ? 'blue' : 'note';
    cells.push({ s, f, cls, inBox, label: scLabels.value === 'degree' ? tone.label : tone.note, title: `${tone.note} (${tone.label}) · string ${6 - s}, fret ${f}` });
  }
  return { cells, tones, scale, root };
}
function renderScale() {
  const { cells, tones, scale, root } = currentScaleCells();
  $('#scBoard').innerHTML = neckSvg(cells, { label: `${root} ${scale.label} on the fretboard` });
  const steps = [...scale.steps, 12].slice(1).map((step, index) => stepName(step - scale.steps[index]));
  $('#scSummary').innerHTML = `<div class="scale-notes">${tones.map((tone) => `<span class="${tone.step === 0 ? 'is-root' : ''}"><b>${tone.note}</b><small>${tone.label}</small></span>`).join('')}</div><p><b>${root} ${scale.label}</b> · ${tones.length} notes · steps <code>${steps.join(' – ')}</code> <small>(W = whole step = 2 frets, H = half step = 1 fret)</small></p>`;
  const parentLine = scale.parent !== undefined ? `Same notes as <b>${chordModel.rootName(chordModel.pitchByName[root] - scale.parent)} major</b>, starting from ${root}.` : scale.harmonyFrom === 'major' ? `Same notes as <b>${chordModel.rootName(chordModel.pitchByName[root] + 9)} minor pentatonic</b>.` : scale.harmonyFrom === 'minor' ? `Same notes as <b>${chordModel.rootName(chordModel.pitchByName[root] + 3)} major pentatonic</b>.` : 'A minor scale with altered upper notes; it has no simple relative major.';
  $('#scCards').innerHTML = `<article class="theory-panel"><h3>Sound</h3><p>${scale.mood}</p></article><article class="theory-panel"><h3>Use it over</h3><p>${scale.use}</p></article><article class="theory-panel"><h3>Relatives</h3><p>${parentLine}${scale.colour ? ` ${scale.colour}` : ''}</p></article><article class="theory-panel"><h3>How to practise</h3><p>Learn one position at a time: play it up and down, then say each note name, then find every root. Next, link neighbouring positions by sliding along one string.</p></article>`;
  renderHarmony();
}
let scaleTimers = [];
$('#scPlay').addEventListener('click', () => {
  scaleTimers.forEach(clearTimeout);
  const root = scRoot.value;
  const scale = SCALES[scType.value];
  const position = scPosition.value === 'all' ? 0 : Number(scPosition.value);
  const box = positionBox(root, scale.boxSteps ?? scale.steps, position);
  const pitches = new Set(spell(root, scale).map((tone) => tone.pitch));
  const { cells } = currentScaleCells();
  // Play the notes inside the chosen position (blue notes included), low to high and back.
  const notes = cells.filter((cell) => cell.inBox && (scPosition.value !== 'all' || box.has(key(cell.s, cell.f))) && pitches.has(pitchAt(cell.s, cell.f)))
    .map((cell) => ({ ...cell, midi: STRING_MIDI[cell.s] + cell.f }))
    .sort((a, b) => a.midi - b.midi || a.s - b.s)
    .filter((cell, index, list) => index === 0 || cell.midi !== list[index - 1].midi);
  const run = [...notes, ...notes.slice(0, -1).reverse()];
  run.forEach((cell, index) => scaleTimers.push(setTimeout(() => {
    sound.pluck(cell.s, cell.f, { length: .9 });
    flash($('#scBoard'), cell.s, cell.f, 260);
  }, index * 240)));
});
[scRoot, scType, scPosition, scLabels].forEach((control) => control.addEventListener('change', () => {
  if (control === scType) fillPositions();
  history.replaceState(null, '', `?root=${encodeURIComponent(scRoot.value)}&scale=${scType.value}${location.hash}`);
  renderScale();
}));
wirePlayback($('#scBoard'));

// ---------- 03 harmony ----------
const TRIADS = { '4,7': 'major', '3,7': 'minor', '3,6': 'diminished', '4,8': 'augmented' };
const SEVENTHS = { '4,7,11': 'major7', '4,7,10': 'dominant7', '3,7,10': 'minor7', '3,6,10': 'halfDiminished', '3,6,9': 'diminished7' };
const ODD_SEVENTHS = { '3,7,11': 'm(maj7)', '4,8,11': '+maj7' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function renderHarmony() {
  const root = scRoot.value;
  const selected = SCALES[scType.value];
  const scale = selected.steps.length === 7 ? selected : SCALES[selected.harmonyFrom];
  const tones = spell(root, scale);
  const intro = scale === selected
    ? `Stacking thirds inside <b>${root} ${selected.label}</b> gives these seven chords.`
    : `A ${selected.label.toLowerCase()} has gaps, so it can't build a full set of chords. It is used over the chords of its parent key, <b>${root} ${scale.label}</b>, shown here.`;
  const cards = tones.map((tone, index) => {
    const at = (offset) => tones[(index + offset) % 7];
    const interval = (offset) => (at(offset).pitch - tone.pitch + 12) % 12;
    const triad = TRIADS[`${interval(2)},${interval(4)}`];
    const seventhKey = `${interval(2)},${interval(4)},${interval(6)}`;
    const seventh = SEVENTHS[seventhKey];
    const numeralBase = ROMAN[index];
    const numeral = triad === 'minor' || triad === 'diminished' ? numeralBase.toLowerCase() + (triad === 'diminished' ? '°' : '') : numeralBase + (triad === 'augmented' ? '+' : '');
    const linkRoot = chordModel.rootName(tone.pitch);
    const triadName = `${tone.note}${chordModel.qualities[triad].suffix}`;
    const seventhName = seventh ? `${tone.note}${chordModel.qualities[seventh].suffix}` : `${tone.note}${ODD_SEVENTHS[seventhKey] ?? '7'}`;
    return `<article class="harmony-card ${index === 0 ? 'is-tonic' : ''}"><div class="harmony-top"><small>${numeral}</small><button class="play-button" type="button" data-strum="${linkRoot}:${triad}" aria-label="Play ${triadName}">▶</button></div><a href="../chords/detail.html?root=${encodeURIComponent(linkRoot)}&quality=${triad}"><b>${triadName}</b></a><span>${[0, 2, 4].map((offset) => at(offset).note).join(' · ')}</span>${seventh ? `<a class="harmony-seventh" href="../chords/detail.html?root=${encodeURIComponent(linkRoot)}&quality=${seventh}">${seventhName}</a>` : `<span class="harmony-seventh">${seventhName}</span>`}</article>`;
  }).join('');
  $('#harmonyBody').innerHTML = `<p class="harmony-intro">${intro} Upper case = major, lower case = minor, ° = diminished, + = augmented. Row two of each card is the four-note (7th) version.</p><div class="harmony-grid">${cards}</div>`;
}
$('#harmonyBody').addEventListener('click', (event) => {
  const button = event.target.closest('[data-strum]');
  if (!button) return;
  const [root, quality] = button.dataset.strum.split(':');
  const frets = voicingFor(root, quality);
  if (frets) sound.strum(frets);
});

// ---------- 04 lead ----------
// Minor pentatonic position 1, as fret offsets from the root on string 6.
const BOX_ONE = [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]];
const BLUE_NOTES = [[1, 1], [3, 3]];
const LICKS = [
  { name: 'Question & answer', step: 'Step 4', text: 'The first phrase stops on the 5th (a question). After a rest the answer falls to the root.', notes: [[4, 3, .5], [5, 0, .5], [4, 3, .5], [4, 0, 1.5, 'v'], null, [3, 2, .5], [3, 0, .5], [2, 2, 2, 'v']] },
  { name: 'Bend to the 5th', step: 'Step 5', text: 'Bend the 4th up a whole step until it matches the 5th, then walk down to the root.', notes: [[3, 2, 1, 'b'], [4, 0, .5], [3, 2, .5], [3, 0, .5], [2, 2, 1.5, 'v']] },
  { name: 'Motif, moved down', step: 'Step 3', text: 'One three-note shape (high–middle–low) played three times, each a string set lower.', notes: [[5, 0, .5], [4, 3, .5], [4, 0, 1], [4, 0, .5], [3, 2, .5], [3, 0, 1], [3, 2, .5], [3, 0, .5], [2, 2, 2, 'v']] },
  { name: 'Blue-note slur', step: 'Step 6', text: 'Hammer from the b3 to the 4th, touch the b5 blue note, and pull back off. Resolve to the root.', notes: [[3, 0, .5], [3, 2, .5, 'h'], [3, 3, .5, 'h'], [3, 2, .5, 'p'], [3, 0, .5, 'p'], [2, 2, 1.5, 'v']] },
  { name: 'Slide into a chord tone', step: 'Step 2', text: 'Slide into the b3 on the high string: over Am it is the chord\'s 3rd, so it sounds deliberate.', notes: [[5, 3, 1, 's'], [5, 0, .5], [4, 3, .5], [5, 0, 1], [4, 0, 1, 'v']] }
];
const leadKey = $('#leadKey');
leadKey.innerHTML = chordModel.roots.map((root) => `<option value="${root}">${root} minor</option>`).join('');
leadKey.value = 'A';
const lead = { chord: 0, playing: false, timer: null, beat: 0 };
function leadRootFret() {
  let fret = (chordModel.pitchByName[leadKey.value] - 4 + 12) % 12;
  if (fret < 3) fret += 12;
  return fret;
}
function progression() {
  const tonic = chordModel.pitchByName[leadKey.value];
  return [[0, 'minor', 'i'], [8, 'major', 'VI'], [10, 'major', 'VII'], [0, 'minor', 'i']].map(([offset, quality, numeral]) => {
    const root = chordModel.rootName(tonic + offset);
    return { root, quality, numeral, symbol: `${root}${chordModel.qualities[quality].suffix}`, tones: chordModel.spellTones(root, quality) };
  });
}
function renderLead() {
  const rootFret = leadRootFret();
  const scale = SCALES.minorPentatonic;
  const tones = spell(leadKey.value, SCALES.blues);
  const byPitch = new Map(tones.map((tone) => [tone.pitch, tone]));
  const box = new Set(BOX_ONE.flatMap((frets, s) => frets.map((offset) => key(s, rootFret + offset))));
  const blue = new Set(BLUE_NOTES.map(([s, offset]) => key(s, rootFret + offset)));
  const chords = progression();
  const chord = chords[lead.chord];
  const targets = new Map(chord.tones.map((tone) => [tone.pitch, tone]));
  const scalePitches = new Set(spell(leadKey.value, scale).map((tone) => tone.pitch));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const pitch = pitchAt(s, f);
    const id = key(s, f);
    const target = targets.get(pitch);
    if (scalePitches.has(pitch) || blue.has(id)) {
      const tone = byPitch.get(pitch);
      const inBox = box.has(id) || blue.has(id);
      const cls = !inBox ? 'faint' : blue.has(id) ? 'blue' : tone.step === 0 ? 'root' : 'note';
      cells.push({ s, f, cls, target: Boolean(target) && inBox, label: tone.note, title: `${tone.note} (${tone.label})${target ? ` · ${target.label} of ${chord.symbol}` : ''}` });
    } else if (target && f >= rootFret - 1 && f <= rootFret + 4) {
      // Chord tones outside the pentatonic (e.g. F over the F chord) still make great landing notes.
      cells.push({ s, f, cls: 'outside', target: true, label: target.note, title: `${target.note} · ${target.label} of ${chord.symbol} (from the full minor scale)` });
    }
  }
  $('#leadBoard').innerHTML = neckSvg(cells, { label: `${leadKey.value} minor pentatonic position 1 with ${chord.symbol} chord tones` });
  $('#jamChords').innerHTML = chords.map((item, index) => `<button type="button" class="${index === lead.chord ? 'is-current' : ''}" data-chord="${index}"><small>${item.numeral}</small><b>${item.symbol}</b><span>${item.tones.map((tone) => tone.note).join(' ')}</span></button>`).join('');
  $('#jamInfo').textContent = `Progression: ${chords.map((item) => item.symbol).join(' – ')} · one bar each. Click a chord to see its landing notes.`;
  renderLicks(rootFret);
}
$('#jamChords').addEventListener('click', (event) => {
  const button = event.target.closest('[data-chord]');
  if (!button) return;
  lead.chord = Number(button.dataset.chord);
  renderLead();
});
function jamTick() {
  const chords = progression();
  const beat = lead.beat % 4;
  if (beat === 0) {
    lead.chord = Math.floor(lead.beat / 4) % chords.length;
    renderLead();
  }
  const chord = chords[lead.chord];
  const frets = voicingFor(chord.root, chord.quality);
  if (frets) sound.strum(beat === 0 ? frets : frets.map((fret, index) => index < 3 ? null : fret), { level: beat === 0 ? .2 : .1, gap: .02 });
  lead.beat += 1;
}
$('#jamButton').addEventListener('click', () => {
  if (lead.playing) {
    clearInterval(lead.timer);
    lead.playing = false;
    $('#jamButton').textContent = '▶ Start jam track';
    return;
  }
  lead.playing = true;
  lead.beat = 0;
  $('#jamButton').textContent = '■ Stop jam track';
  jamTick();
  lead.timer = setInterval(jamTick, 60000 / Number($('#leadTempo').value));
});
$('#leadTempo').addEventListener('change', () => {
  if (!lead.playing) return;
  clearInterval(lead.timer);
  lead.timer = setInterval(jamTick, 60000 / Number($('#leadTempo').value));
});
leadKey.addEventListener('change', () => { lead.chord = 0; renderLead(); });
wirePlayback($('#leadBoard'));

function renderLicks(rootFret) {
  $('#licks').innerHTML = LICKS.map((lick, index) => `<article class="lick-card"><header><div><small>${lick.step}</small><h4>${lick.name}</h4></div><button class="play-button" type="button" data-lick="${index}" aria-label="Play ${lick.name}">▶</button></header><div class="tab-scroll">${tabSvg(lick, rootFret)}</div><p>${lick.text}</p></article>`).join('') + `<p class="tab-key">Tab: lines are strings (high e on top), numbers are frets. <b>b</b> bend · <b>h</b> hammer-on · <b>p</b> pull-off · <b>/</b> slide in · <b>~</b> vibrato</p>`;
}
let lickTimers = [];
$('#licks').addEventListener('click', (event) => {
  const button = event.target.closest('[data-lick]');
  if (!button) return;
  lickTimers.forEach(clearTimeout);
  lickTimers = [];
  const lick = LICKS[Number(button.dataset.lick)];
  const card = button.closest('.lick-card');
  const rootFret = leadRootFret();
  const beat = 60000 / Number($('#leadTempo').value);
  let time = 0;
  lick.notes.forEach((note, index) => {
    if (!note) { time += beat; return; }
    const [string, offset, length, technique] = note;
    const fret = rootFret + offset;
    lickTimers.push(setTimeout(() => {
      sound.pluck(string, fret, { bend: technique === 'b' ? 2 : 0, slideFrom: technique === 's' ? fret - 2 : null, length: Math.max(.6, length * beat / 1000 + .5) });
      flash($('#leadBoard'), string, fret, length * beat);
      card.querySelectorAll('[data-index]').forEach((item) => item.classList.toggle('is-playing', Number(item.dataset.index) === index));
    }, time));
    time += length * beat;
  });
  lickTimers.push(setTimeout(() => card.querySelectorAll('[data-index]').forEach((item) => item.classList.remove('is-playing')), time + 200));
});

fillPositions();
renderScale();
renderLead();
