// Practice page: composing lead lines and melodies. Shared helpers (neckSvg, tabSvg, sound, $...) come from ../fretboard.js.

const SHAPES = {
  Am: [null, 0, 2, 2, 1, 0], C: [null, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], F: [1, 3, 3, 2, 1, 1],
  Dm: [null, null, 0, 2, 3, 1], Em: [0, 2, 2, 0, 0, 0],
  A7: [null, 0, 2, 0, 2, 0], D7: [null, null, 0, 2, 1, 2], E7: [0, 2, 0, 1, 0, 0],
};
const CHORD_TONES = { Am: [9, 0, 4], C: [0, 4, 7], G: [7, 11, 2], F: [5, 9, 0], Dm: [2, 5, 9], Em: [4, 7, 11], A7: [9, 1, 4, 7], D7: [2, 6, 9, 0], E7: [4, 8, 11, 2] };
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

// A line is written bar by bar: [['Am', [notes...]], ['G', [...]]]. Notes are [string, fret, beats, technique]; null = 1-beat rest.
function bars(spec) {
  return spec.flatMap(([chord, notes], index) => [...(index ? ['|'] : []), { chord }, ...notes]);
}

// ---------- playback ----------
let timers = [];
let playingButton = null;
function stopAll() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.is-playing').forEach((item) => item.classList.remove('is-playing'));
  if (playingButton) playingButton.textContent = playingButton.dataset.idle;
  playingButton = null;
}
function later(time, fn) { timers.push(setTimeout(fn, time)); }
function techniqueOptions(technique, fret) {
  if (technique === 'b') return { bend: 2 };
  if (technique === 's') return { slideFrom: Math.max(0, fret - 2) };
  if (technique === 'h' || technique === 'p') return { level: .22 };
  if (technique === 'v') return { length: 2.6 };
  return {};
}
// Plays the melody with a soft strum of each chord every two beats; highlights tab notes (and neck dots) as they sound.
function playLine(line, { bpm = 84, tab, board, button } = {}) {
  stopAll();
  const beat = 60000 / bpm;
  const chordEvents = [];
  let position = 0;
  line.forEach((item, index) => {
    if (item === '|') return;
    if (item && !Array.isArray(item)) { chordEvents.push([position, item.chord]); return; }
    if (!item) { position += 1; return; }
    const [string, fret, beats, technique] = item;
    const time = position * beat;
    later(time, () => sound.pluck(string, fret, techniqueOptions(technique, fret)));
    const element = tab?.querySelector(`[data-index="${index}"]`);
    if (element) {
      later(time, () => element.classList.add('is-playing'));
      later(time + Math.max(80, beats * beat - 20), () => element.classList.remove('is-playing'));
    }
    if (board) later(time, () => flash(board, string, fret, beats * beat));
    position += beats;
  });
  const total = Math.max(4, Math.ceil(position / 4 - 1e-9) * 4);
  chordEvents.forEach(([start, chord], index) => {
    const end = chordEvents[index + 1]?.[0] ?? total;
    for (let at = start; at < end - 1e-9; at += 2) later(at * beat, () => sound.strum(SHAPES[chord], { level: .07, gap: .03 }));
  });
  if (button) {
    playingButton = button;
    button.textContent = button.dataset.playing;
  }
  later(total * beat + 300, stopAll);
}

// ---------- example cards ----------
const EXAMPLES = {};
function renderCards(containerId, list) {
  $(containerId).innerHTML = list.map((example) => {
    EXAMPLES[example.id] = example;
    return `<article class="lick-card"><header><div><small>${example.step}</small><h4>${example.name}</h4></div><button class="play-button" type="button" data-example="${example.id}" data-idle="▶" data-playing="■" aria-label="Play ${example.name}">▶</button></header><div class="tab-scroll">${tabSvg({ name: example.name, notes: example.line }, 0)}</div><p>${example.text}</p></article>`;
  }).join('');
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-example]');
  if (!button) return;
  if (playingButton === button) { stopAll(); return; }
  const example = EXAMPLES[button.dataset.example];
  playLine(example.line, { bpm: example.bpm, tab: button.closest('.lick-card'), button });
});

// 01 motif: A minor pentatonic, 5th position, over Am.
const MOTIF = [[3, 7, 1], [3, 5, .5], [3, 7, .5], [4, 5, 2, 'v']];
renderCards('#motifCards', [
  { id: 'motif', step: 'STEP 1 · THE IDEA', name: 'A four-note motif', line: bars([['Am', MOTIF]]), text: 'D – C – D – E. Two notes on the G string, one on the B string, a long note at the end. Hum it before you play it.' },
  { id: 'repeat', step: 'STEP 2 · REPEAT, NEW ENDING', name: 'Same start, new last note', line: bars([['Am', MOTIF], ['Am', [[3, 7, 1], [3, 5, .5], [3, 7, .5], [2, 7, 2, 'v']]]]), text: 'The second time the motif ends on A, the root, instead of E. Same idea, but now it sounds finished.' },
  { id: 'sequence', step: 'STEP 3 · SEQUENCE', name: 'Walk the motif down the scale', line: bars([['Am', MOTIF], ['Am', [[3, 5, 1], [2, 7, .5], [3, 5, .5], [3, 7, 2]]], ['Am', [[2, 7, 1], [2, 5, .5], [2, 7, .5], [3, 5, 2]]], ['Am', [[2, 7, 4, 'v']]]]), text: 'The same up-and-down shape starts one scale note lower each bar, then lands on the root. Four bars from one idea.' },
  { id: 'express', step: 'STEP 4 · EXPRESSION', name: 'Slide, hammer, bend', line: bars([['Am', [[3, 7, 1, 's'], [3, 5, .5], [3, 7, .5, 'h'], [3, 7, 2, 'b']]], ['Am', [[3, 7, 1, 's'], [3, 5, .5], [3, 7, .5, 'h'], [2, 7, 2, 'v']]]]), text: 'Same notes as steps 1–2, played like a singer: slide into the first note, hammer on, and bend D up to E instead of picking E.' },
]);

// 02 question & answer over Am – G – F – Am.
const QUESTION = [['Am', [[4, 5, 1], [4, 7, 1], [4, 5, .5], [3, 7, .5], [3, 5, 1]]], ['G', [[3, 7, 3, 'v'], null]]];
const ANSWER = [['F', [[3, 5, 1], [2, 5, 1], [3, 5, .5], [3, 7, .5], [4, 5, 1]]], ['Am', [[3, 7, .5], [3, 5, .5], [2, 5, 3, 'v']]]];
renderCards('#phraseCards', [
  { id: 'question', step: 'BARS 1–2', name: 'The question', line: bars(QUESTION), text: 'Moves through G and A, then stops on D, the 5th of G. It hangs in the air.' },
  { id: 'answer', step: 'BARS 3–4', name: 'The answer', line: bars(ANSWER), text: 'Starts with the same long-long-short-short rhythm, then comes down to A, the root, on the Am chord.' },
  { id: 'qa', step: 'ALL FOUR BARS', name: 'Question + answer', line: bars([...QUESTION, ...ANSWER]), text: 'Hear them together: the rest at the end of bar 2 is the breath between the two sentences.' },
]);

// 03 chord-tone melody over C – G – Am – F.
const TARGETS = [['C', 'E', '3rd'], ['G', 'D', '5th'], ['Am', 'C', '3rd'], ['F', 'A', '3rd']];
$('#melodyTargets').innerHTML = `<div class="jam-chords">${TARGETS.map(([chord, note, degree], index) => `<button type="button" data-chord="${chord}"><small>BAR ${index + 1}</small><b>${chord}</b><span>target ${note} · ${degree}</span></button>`).join('')}</div>`;
$('#melodyTargets').addEventListener('click', (event) => {
  const button = event.target.closest('[data-chord]');
  if (button) sound.strum(SHAPES[button.dataset.chord]);
});
renderCards('#melodyCards', [
  { id: 'skeleton', step: 'STEP 1 · SKELETON', name: 'One chord tone per bar', line: bars([['C', [[4, 5, 4]]], ['G', [[3, 7, 4]]], ['Am', [[3, 5, 4]]], ['F', [[2, 7, 4]]]]), text: 'E – D – C – A: each note belongs to its chord, and each is a small step from the last. Already a melody.' },
  { id: 'connected', step: 'STEP 2 · CONNECT', name: 'Scale notes in between', line: bars([['C', [[4, 5, 1.5], [4, 8, .5], [4, 6, 1], [4, 5, 1]]], ['G', [[3, 7, 2], [4, 5, 1], [3, 7, 1]]], ['Am', [[3, 5, 2], [3, 7, .5], [3, 5, .5], [3, 4, 1]]], ['F', [[2, 7, 3, 'v'], null]]]), text: 'Targets stay on beat 1. The notes between are passing notes from C major that lead into the next target.' },
  { id: 'finished', step: 'STEP 3 · RHYTHM & REPETITION', name: 'The finished melody', line: bars([['C', [[4, 8, .5], [4, 6, .5], [4, 5, 2], null]], ['G', [[4, 6, .5], [4, 5, .5], [3, 7, 2], null]], ['Am', [[4, 5, .5], [3, 7, .5], [3, 5, 2], null]], ['F', [[3, 7, .5], [3, 5, .5], [2, 7, 3, 'v']]]]), text: 'One rhythm, short-short-long, repeated every bar and sliding down the scale: a sequence that still lands on every target.' },
]);

// 04 rhythm: E, G, A over Am.
const twice = (notes) => bars([['Am', notes], ['Am', notes]]);
renderCards('#rhythmCards', [
  { id: 'even', step: 'RHYTHM 1', name: 'Even', line: twice([[4, 5, 1], [4, 8, 1], [5, 5, 2]]), text: 'Notes on the beat. Clear, but square; it sounds like a scale exercise.' },
  { id: 'push', step: 'RHYTHM 2', name: 'Pushed', line: twice([[4, 5, .5], [4, 8, 1], [5, 5, 2.5]]), text: 'The A arrives on the "&" of 2, just before the beat. The same notes suddenly groove.' },
  { id: 'pickup', step: 'RHYTHM 3', name: 'Rest, then run', line: twice([null, [4, 5, .5], [4, 5, .5], [4, 8, .5], [5, 5, 1.5, 'v']]), text: 'Rest on beat 1, repeat the first note, then hold the top note. Sounds like a sung phrase: "take me home".' },
]);

// 05 12-bar blues solo in A.
renderCards('#soloCards', [{
  id: 'blues', step: '12-BAR BLUES IN A · 92 BPM', name: 'A solo with a beginning, middle and peak', bpm: 92,
  line: bars([
    ['A7', [[2, 7, 1], [2, 5, .5], [1, 7, .5], [2, 5, 1], [2, 7, 1]]],
    ['A7', [[2, 7, 3, 'v'], null]],
    ['A7', [[2, 7, 1], [3, 5, .5], [2, 7, .5], [3, 7, 1, 'b'], [2, 7, 1]]],
    ['A7', [[2, 7, 2, 'v'], null, null]],
    ['D7', [[3, 5, .5], [3, 7, .5], [3, 5, .5], [2, 7, .5], [3, 5, 2, 'v']]],
    ['D7', [[3, 5, .5], [3, 7, .5], [3, 5, .5], [2, 7, .5], [3, 5, 2, 'v']]],
    ['A7', [[4, 5, .5], [4, 8, .5], [4, 5, .5], [3, 7, .5], [2, 7, 2, 'v']]],
    ['A7', [null, null, null, [3, 7, 1]]],
    ['E7', [[5, 8, 1, 'b'], [5, 5, .5], [4, 8, .5], [4, 5, 2, 'v']]],
    ['D7', [[5, 5, .5], [4, 8, .5], [4, 5, .5], [3, 7, .5], [3, 5, 2, 'v']]],
    ['A7', [[3, 7, .5], [3, 5, .5], [2, 7, 1], [2, 5, 1], [1, 7, 1]]],
    ['E7', [[1, 7, 2], [2, 5, 1], [2, 6, 1]]],
  ]),
  text: 'Bars 1–4 low and sparse, bars 5–8 one riff repeated then answered, bar 9 the peak: a bend on the high e string. The last note, G#, is the 3rd of E7 and leads back to A.',
}]);

// 06 song jobs.
const HOOK_A = [[4, 5, .5], [5, 5, .5], [4, 5, .5], [5, 5, .5], [5, 8, 1], [5, 7, 1]];
renderCards('#jobCards', [
  { id: 'hook', step: 'JOB 1 · INTRO HOOK', name: 'A riff that loops', line: bars([['Am', HOOK_A], ['F', [[4, 5, .5], [5, 5, .5], [4, 5, .5], [5, 5, .5], [5, 8, 2, 'v']]], ['C', HOOK_A], ['G', [[4, 8, .5], [5, 7, .5], [4, 8, .5], [5, 7, .5], [5, 10, 2, 'v']]]]), text: 'Am – F – C – G. The rocking two-string figure repeats every bar; only the last note changes to suit each chord.' },
  { id: 'fill', step: 'JOB 2 · VOCAL FILL', name: 'Answer the singer', line: bars([['C', [null, null, null, null]], ['G', [null, null, [3, 7, .5], [4, 5, .5], [4, 8, 1]]], ['Am', [null, null, null, null]], ['F', [null, null, [4, 6, .5], [4, 5, .5], [3, 5, 1, 'v']]]]), text: 'The rests are where the vocal line goes. The guitar speaks only in the last two beats of bars 2 and 4.' },
  { id: 'ending', step: 'JOB 3 · ENDING', name: 'Walk down and land', line: bars([['G', [[5, 8, .5], [5, 5, .5], [4, 8, .5], [4, 5, .5], [3, 7, 1], [3, 5, 1]]], ['Am', [[2, 7, 4, 'v']]]]), text: 'A descending run over G that arrives on A, the root, on beat 1 of the final Am. Hold it and let it ring.' },
]);

// ---------- 07 sketchpad ----------
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const PROGRESSIONS = [
  { id: 'pop-minor', name: 'Am – F – C – G', chords: ['Am', 'F', 'C', 'G'], scale: MAJOR, root: 9 },
  { id: 'pop-major', name: 'C – G – Am – F', chords: ['C', 'G', 'Am', 'F'], scale: MAJOR, root: 0 },
  { id: 'minor', name: 'Am – G – F – Am', chords: ['Am', 'G', 'F', 'Am'], scale: MAJOR, root: 9 },
  { id: 'blues', name: 'A7 – D7 – A7 – E7 (blues)', chords: ['A7', 'D7', 'A7', 'E7'], scale: [9, 0, 2, 3, 4, 7], root: 9 },
];
const MAX_BARS = 8;
const skProg = $('#skProg');
skProg.innerHTML = PROGRESSIONS.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
let sketch = [];
try {
  const saved = JSON.parse(localStorage.getItem('gfn-sketch') || 'null');
  if (saved) { sketch = Array.isArray(saved.notes) ? saved.notes : []; if (PROGRESSIONS.some((item) => item.id === saved.prog)) skProg.value = saved.prog; }
} catch {}
const progression = () => PROGRESSIONS.find((item) => item.id === skProg.value);
const beatsUsed = (notes) => notes.reduce((sum, note) => sum + (note ? note[2] : 1), 0);
function sketchLine(notes) {
  const { chords } = progression();
  const line = [];
  let position = 0;
  let nextBar = 0;
  for (const note of notes) {
    while (position >= nextBar * 4 - 1e-9) { if (nextBar) line.push('|'); line.push({ chord: chords[nextBar % 4] }); nextBar += 1; }
    line.push(note);
    position += note ? note[2] : 1;
  }
  return line;
}
function save() {
  try { localStorage.setItem('gfn-sketch', JSON.stringify({ prog: skProg.value, notes: sketch })); } catch {}
}
function renderSketch() {
  const prog = progression();
  const used = beatsUsed(sketch);
  const full = used >= MAX_BARS * 4 - 1e-9;
  const bar = Math.min(Math.floor(used / 4 + 1e-9), MAX_BARS - 1);
  const chord = prog.chords[bar % 4];
  const tones = CHORD_TONES[chord];
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const pc = pitchAt(s, f);
    if (!prog.scale.includes(pc)) continue;
    cells.push({ s, f, cls: pc === prog.root ? 'root' : pc === 3 ? 'blue' : 'note', label: NOTE_NAMES[pc], target: !full && tones.includes(pc), title: `${NOTE_NAMES[pc]} · string ${6 - s}, fret ${f}` });
  }
  $('#skBoard').innerHTML = neckSvg(cells, { label: `Sketchpad fretboard, ${prog.name}` });
  const beatInBar = used - bar * 4;
  $('#skHint').innerHTML = full
    ? `<b>All ${MAX_BARS} bars written.</b> Press play, or undo to change the ending.`
    : `Writing <b>bar ${bar + 1} of ${MAX_BARS}</b> over <b>${chord}</b>, beat ${Number((beatInBar + 1).toFixed(1))}. Chord tones: ${tones.map((pc) => NOTE_NAMES[pc]).join(' · ')}.${beatInBar < 1e-9 && used ? ' This is beat 1: land on a ringed note.' : ''}`;
  $('#skTab').innerHTML = sketch.length ? tabSvg({ name: 'your sketch', notes: sketchLine(sketch) }, 0, 40) : '<p class="sketch-empty">Your tab appears here. Click a note on the neck to begin.</p>';
}
$('#skBoard').addEventListener('click', (event) => {
  const cell = event.target.closest('[data-s]');
  if (!cell) return;
  const string = Number(cell.dataset.s);
  const fret = Number(cell.dataset.f);
  sound.pluck(string, fret);
  flash($('#skBoard'), string, fret);
  const room = MAX_BARS * 4 - beatsUsed(sketch);
  if (room <= 1e-9) return;
  sketch.push([string, fret, Math.min(Number($('#skLen').value), room)]);
  save();
  renderSketch();
});
$('#skRest').addEventListener('click', () => { if (beatsUsed(sketch) <= MAX_BARS * 4 - 1) { sketch.push(null); save(); renderSketch(); } });
$('#skUndo').addEventListener('click', () => { sketch.pop(); save(); renderSketch(); });
$('#skClear').addEventListener('click', () => { stopAll(); sketch = []; save(); renderSketch(); });
skProg.addEventListener('change', () => { stopAll(); save(); renderSketch(); });
const skPlay = $('#skPlay');
skPlay.dataset.idle = '▶ Play my line';
skPlay.dataset.playing = '■ Stop';
skPlay.addEventListener('click', () => {
  if (playingButton === skPlay) { stopAll(); return; }
  // Pad to the end of the bar (at least four bars) so the backing finishes the phrase.
  const padded = [...sketch];
  const used = beatsUsed(sketch);
  const target = Math.max(16, Math.ceil(used / 4 - 1e-9) * 4);
  for (let at = used; at < target - 1e-9; at += 1) padded.push(null);
  playLine(sketchLine(padded), { bpm: Number($('#skTempo').value), tab: $('#skTab'), board: $('#skBoard'), button: skPlay });
});
renderSketch();

// ---------- 08 practice checklist ----------
const planBoxes = [...document.querySelectorAll('[data-plan]')];
function planState() {
  try { return JSON.parse(localStorage.getItem('gfn-compose-plan') || '{}'); } catch { return {}; }
}
function renderPlan() {
  $('#planCount').textContent = `${planBoxes.filter((box) => box.checked).length} / ${planBoxes.length} DONE`;
}
const savedPlan = planState();
planBoxes.forEach((box) => {
  box.checked = Boolean(savedPlan[box.dataset.plan]);
  box.addEventListener('change', () => {
    try { localStorage.setItem('gfn-compose-plan', JSON.stringify(Object.fromEntries(planBoxes.map((item) => [item.dataset.plan, item.checked])))); } catch {}
    renderPlan();
  });
});
$('#planReset').addEventListener('click', () => {
  planBoxes.forEach((box) => { box.checked = false; });
  try { localStorage.removeItem('gfn-compose-plan'); } catch {}
  renderPlan();
});
renderPlan();
