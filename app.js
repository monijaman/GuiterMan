const themeLoader = document.createElement('script');
themeLoader.src = 'theme.js';
document.head.append(themeLoader);

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRINGS = [
  { name: 'E', midi: 64, note: 4 }, { name: 'B', midi: 59, note: 11 },
  { name: 'G', midi: 55, note: 7 }, { name: 'D', midi: 50, note: 2 },
  { name: 'A', midi: 45, note: 9 }, { name: 'E', midi: 40, note: 4 }
];
const SCALE_INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], pentatonic: [0, 3, 5, 7, 10], harmonic: [0, 2, 3, 5, 7, 8, 11] };
const SCALE_FORMULAS = { major: 'W – W – H – W – W – W – H', minor: 'W – H – W – W – H – W – W', pentatonic: '3 – 2 – 2 – 3 – 2 semitones', harmonic: 'W – H – W – W – H – 3 – H' };
const CHORDS = [
  { name: 'Em', quality: 'E minor', qualityId: 'minor', frets: [0, 2, 2, 0, 0, 0], fingers: ['', '2', '3', '', '', ''], notes: 'E · B · E · G · B · E', root: 'E' },
  { name: 'Am', quality: 'A minor', qualityId: 'minor', frets: ['x', 0, 2, 2, 1, 0], fingers: ['', '', '2', '3', '1', ''], notes: 'A · E · A · C · E', root: 'A' },
  { name: 'C', quality: 'C major', qualityId: 'major', frets: ['x', 3, 2, 0, 1, 0], fingers: ['', '3', '2', '', '1', ''], notes: 'C · E · G · C · E', root: 'C' },
  { name: 'G', quality: 'G major', qualityId: 'major', frets: [3, 2, 0, 0, 0, 3], fingers: ['2', '1', '', '', '', '3'], notes: 'G · B · D · G · B · G', root: 'G' },
  { name: 'D', quality: 'D major', qualityId: 'major', frets: ['x', 'x', 0, 2, 3, 2], fingers: ['', '', '', '1', '3', '2'], notes: 'D · A · D · F#', root: 'D' },
  { name: 'Dm', quality: 'D minor', qualityId: 'minor', frets: ['x', 'x', 0, 2, 3, 1], fingers: ['', '', '', '2', '3', '1'], notes: 'D · A · D · F', root: 'D' }
];

function noteAt(midi) { return NOTES[((midi % 12) + 12) % 12]; }

function fretboardSvg(root, intervals, maxFret, compact = false) {
  const width = 1000;
  const height = compact ? 260 : 300;
  const left = compact ? 44 : 54;
  const right = 14;
  const top = compact ? 29 : 34;
  const bottom = compact ? 24 : 30;
  const boardWidth = width - left - right;
  const boardHeight = height - top - bottom;
  const fretWidth = boardWidth / maxFret;
  const stringGap = boardHeight / 5;
  const rootIndex = NOTES.indexOf(root);
  const scaleNotes = new Set(intervals.map((step) => (rootIndex + step) % 12));
  const fretLines = Array.from({ length: maxFret + 1 }, (_, fret) => {
    const x = left + fret * fretWidth;
    const weight = fret === 0 ? 5 : fret === 12 ? 2.6 : 1.25;
    return `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + boardHeight}" stroke="${fret === 0 ? '#46534c' : '#aab8ae'}" stroke-width="${weight}"/>${fret > 0 && (maxFret <= 5 || fret % 2 === 0) ? `<text x="${x - fretWidth / 2}" y="${height - 4}" class="fret-number">${fret}</text>` : ''}`;
  }).join('');
  const strings = STRINGS.map((string, row) => {
    const y = top + row * stringGap;
    const lineWidth = Math.max(.8, 2.6 - row * .35);
    const notes = Array.from({ length: maxFret + 1 }, (_, fret) => {
      const x = fret === 0 ? left - 17 : left + (fret - .5) * fretWidth;
      const note = (string.note + fret) % 12;
      const active = scaleNotes.has(note);
      const isRoot = note === rootIndex;
      const radius = compact ? (isRoot ? 13 : 10) : (isRoot ? 13 : 10.5);
      const label = compact ? '' : `<text x="${x}" y="${y + 3.2}" text-anchor="middle" class="note-label" fill="${isRoot ? '#20231f' : active ? '#fff' : '#8a8d83'}">${NOTES[note]}</text>`;
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${isRoot ? '#ec7056' : active ? '#7f982f' : '#d9ded5'}" opacity="${active ? 1 : .78}"/>${label}`;
    }).join('');
    return `<text x="12" y="${y + 4}" class="string-name">${string.name}</text><line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#7a8980" stroke-width="${lineWidth}"/>${notes}`;
  }).join('');
  const dots = maxFret >= 12 ? [3, 5, 7, 9, 12].map((fret) => {
    const cx = left + (fret - .5) * fretWidth;
    const cy = top + boardHeight / 2;
    const double = fret === 12;
    return `<circle cx="${cx}" cy="${double ? cy - stringGap * .5 : cy}" r="3" fill="#84948a" opacity=".55"/>${double ? `<circle cx="${cx}" cy="${cy + stringGap * .5}" r="3" fill="#84948a" opacity=".55"/>` : ''}`;
  }).join('') : '';
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${root} scale notes on guitar fretboard, frets 0 to ${maxFret}"><style>.fret-number{font:12px 'DM Mono',monospace;fill:#657168;text-anchor:middle}.string-name{font:12px 'DM Mono',monospace;fill:#49574f}.note-label{font:9px 'DM Mono',monospace}</style>${fretLines}${strings}${dots}</svg>`;
}

function renderChord(chord) {
  const frets = chord.frets.map((fret) => fret === 'x' ? null : fret);
  const notes = window.GUITAR_CHORD_DATA.voicingNotes(frets, chord.root, chord.qualityId);
  return window.ChordDiagram.svg(frets, notes, { title: `${chord.name} chord` });
}

document.querySelector('#heroFretboard').innerHTML = fretboardSvg('G', SCALE_INTERVALS.major, 12, true);
document.querySelector('#chordGrid').innerHTML = CHORDS.map((chord) => `<a class="chord-card" href="chords/detail.html?root=${chord.root}&quality=${chord.qualityId}"><h3>${chord.name}</h3><p class="chord-quality">${chord.quality}</p>${renderChord(chord)}<p class="finger-note">${chord.notes}</p></a>`).join('');

const scaleRoot = document.querySelector('#scaleRoot');
const scaleType = document.querySelector('#scaleType');
function renderScale() {
  const root = scaleRoot.value;
  const type = scaleType.value;
  document.querySelector('#fullFretboard').innerHTML = fretboardSvg(root, SCALE_INTERVALS[type], 12);
  document.querySelector('#scaleFormula').textContent = SCALE_FORMULAS[type];
  document.querySelector('#scaleFormulaNote').textContent = type === 'pentatonic' ? 'Intervals count semitones between notes.' : 'Whole step = 2 frets · half step = 1 fret';
}
scaleRoot.addEventListener('change', renderScale);
scaleType.addEventListener('change', renderScale);
renderScale();

const MAJOR_KEYS = {
  C: { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'] },
  G: { notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], chords: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#°'] },
  D: { notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'], chords: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#°'] },
  A: { notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'], chords: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#°'] },
  F: { notes: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'], chords: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'E°'] }
};
const DEGREE_LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
function renderKey() {
  const key = MAJOR_KEYS[document.querySelector('#keySelect').value];
  document.querySelector('#keyNotes').innerHTML = key.notes.map((note) => `<span class="key-note">${note}</span>`).join('');
  document.querySelector('#diatonicChords').innerHTML = key.chords.map((chord, i) => `<div class="degree-chord"><small>${DEGREE_LABELS[i]}</small><b>${chord}</b></div>`).join('');
}
document.querySelector('#keySelect').addEventListener('change', renderKey);
renderKey();

const pickInfo = {
  arpeggio: { text: 'Play chord tones one at a time: root, 3rd, 5th, 3rd. Try it slowly over Am.', notes: [[5, 110], [3, 220], [2, 261.63], [3, 220], [4, 164.81], [3, 220], [2, 261.63], [3, 220]] },
  finger: { text: 'Use thumb on bass strings, then index, middle, ring on G, B, high E. Keep the pattern even.', notes: [[5, 110], [4, 164.81], [3, 220], [2, 261.63], [4, 164.81], [3, 220], [2, 261.63], [3, 220]] },
  single: { text: 'Pick one note per beat. Follow A natural minor: A, B, C, D, E, F, G, then back down.', notes: [[5, 110], [5, 123.47], [4, 130.81], [4, 146.83], [3, 164.81], [3, 174.61], [2, 196], [2, 220]] }
};
let selectedPick = 'arpeggio';
document.querySelectorAll('.pick-tab').forEach((button) => button.addEventListener('click', () => {
  selectedPick = button.dataset.pick;
  document.querySelectorAll('.pick-tab').forEach((tab) => tab.classList.toggle('is-selected', tab === button));
  document.querySelector('#pickDescription').textContent = pickInfo[selectedPick].text;
}));

let pickTimers = [];
document.querySelector('#playPicking').addEventListener('click', (event) => {
  pickTimers.forEach(clearTimeout);
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span aria-hidden="true">♫</span> Playing pattern…';
  const strings = document.querySelectorAll('.pick-string');
  pickInfo[selectedPick].notes.forEach(([stringNum, frequency], index) => {
    pickTimers.push(setTimeout(() => {
      strings.forEach((row) => row.classList.toggle('active', Number(row.dataset.string) === stringNum));
      playPickedNote(frequency);
      if (index === pickInfo[selectedPick].notes.length - 1) pickTimers.push(setTimeout(() => {
        strings.forEach((row) => row.classList.remove('active'));
        button.disabled = false;
        button.innerHTML = '<span aria-hidden="true">▶</span> Hear the pattern';
      }, 430));
    }, index * 360));
  });
});

const PRACTICE_KEY = 'guitar-field-notes-practice';
const PRACTICE_DAYS_KEY = 'guitar-field-notes-days';
function readStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function renderPractice() {
  const state = readStored(PRACTICE_KEY, {});
  document.querySelectorAll('[data-practice]').forEach((checkbox) => { checkbox.checked = Boolean(state[checkbox.dataset.practice]); });
  const done = Object.values(state).filter(Boolean).length;
  document.querySelector('#practiceCount').textContent = `${done} / 4 DONE`;
  const days = readStored(PRACTICE_DAYS_KEY, []);
  document.querySelector('#streakCount').textContent = `${days.length} practice ${days.length === 1 ? 'day' : 'days'}`;
}
document.querySelectorAll('[data-practice]').forEach((checkbox) => checkbox.addEventListener('change', () => {
  const state = readStored(PRACTICE_KEY, {});
  state[checkbox.dataset.practice] = checkbox.checked;
  localStorage.setItem(PRACTICE_KEY, JSON.stringify(state));
  if (Object.values(state).filter(Boolean).length === 4) {
    const days = readStored(PRACTICE_DAYS_KEY, []);
    const today = new Date().toISOString().slice(0, 10);
    if (!days.includes(today)) days.push(today);
    localStorage.setItem(PRACTICE_DAYS_KEY, JSON.stringify(days));
  }
  renderPractice();
}));
document.querySelector('#resetPractice').addEventListener('click', () => {
  localStorage.removeItem(PRACTICE_KEY);
  renderPractice();
});
renderPractice();

document.querySelectorAll('.song-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.song-filter').forEach((filter) => filter.classList.toggle('is-selected', filter === button));
  const filter = button.dataset.filter;
  document.querySelectorAll('.song-row').forEach((song) => { song.hidden = filter !== 'all' && song.dataset.level !== filter; });
}));

let audioContext;
let metronomeTimer;
let beatIndex = 0;
let tempo = 76;
function updateTempo(value) {
  tempo = Math.max(40, Math.min(180, Number(value)));
  document.querySelector('#tempoValue').textContent = tempo;
  document.querySelector('#tempoSlider').value = tempo;
  if (metronomeTimer) restartMetronome();
}
function tick() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = beatIndex % 4 === 0 ? 1050 : 760;
  gain.gain.setValueAtTime(.16, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .07);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .08);
  const dots = document.querySelectorAll('#metronomeBeat i');
  dots.forEach((dot, index) => dot.classList.toggle('active', index === beatIndex % 4));
  beatIndex += 1;
}
function playPickedNote(frequency) {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.12, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .3);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .31);
}
function stopMetronome() {
  clearInterval(metronomeTimer);
  metronomeTimer = undefined;
  document.querySelector('#metronomeToggle').innerHTML = '<span aria-hidden="true">▶</span> Start metronome';
  document.querySelectorAll('#metronomeBeat i').forEach((dot) => dot.classList.remove('active'));
}
function restartMetronome() {
  clearInterval(metronomeTimer);
  tick();
  metronomeTimer = setInterval(tick, 60000 / tempo);
}
document.querySelector('#metronomeToggle').addEventListener('click', () => {
  if (metronomeTimer) stopMetronome();
  else {
    beatIndex = 0;
    restartMetronome();
    document.querySelector('#metronomeToggle').innerHTML = '<span aria-hidden="true">■</span> Stop metronome';
  }
});
document.querySelector('#tempoDown').addEventListener('click', () => updateTempo(tempo - 1));
document.querySelector('#tempoUp').addEventListener('click', () => updateTempo(tempo + 1));
document.querySelector('#tempoSlider').addEventListener('input', (event) => updateTempo(event.target.value));