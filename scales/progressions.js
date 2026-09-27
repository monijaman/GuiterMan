// "Progressions over a scale" section. Uses SCALES, spell, positionBox (scales.js) and the shared fretboard helpers.
const PG_PROGRESSIONS = [
  { id: 'pop', mode: 'major', label: 'I – V – vi – IV · pop', chords: [[0, 'major', 'I'], [7, 'major', 'V'], [9, 'minor', 'vi'], [5, 'major', 'IV']], scales: ['majorPentatonic', 'major'], about: 'Home, tension, a minor detour, then IV leads back home.' },
  { id: 'classic', mode: 'major', label: 'I – IV – V – I · classic', chords: [[0, 'major', 'I'], [5, 'major', 'IV'], [7, 'major', 'V'], [0, 'major', 'I']], scales: ['majorPentatonic', 'major'], about: 'The three primary chords: tonic, subdominant, dominant, home.' },
  { id: 'fifties', mode: 'major', label: 'I – vi – IV – V · 50s ballad', chords: [[0, 'major', 'I'], [9, 'minor', 'vi'], [5, 'major', 'IV'], [7, 'major', 'V']], scales: ['majorPentatonic', 'major'], about: 'Ends on V, which pulls straight back to I when it loops.' },
  { id: 'turnaround', mode: 'major', label: 'I – vi – ii – V · turnaround', chords: [[0, 'major', 'I'], [9, 'minor', 'vi'], [2, 'minor', 'ii'], [7, 'major', 'V']], scales: ['major', 'majorPentatonic'], about: 'Roots fall in 5ths (A → D → G → C): the strongest root motion in music.' },
  { id: 'jazz', mode: 'major', label: 'ii7 – V7 – Imaj7 · jazz', chords: [[2, 'minor7', 'ii7'], [7, 'dominant7', 'V7'], [0, 'major7', 'Imaj7'], [0, 'major7', 'Imaj7']], scales: ['major', 'majorPentatonic'], about: 'The core jazz cadence. Over each chord the key scale becomes Dorian, Mixolydian, then Ionian.' },
  { id: 'mixo', mode: 'major', label: 'I – bVII – IV – I · rock (borrowed bVII)', chords: [[0, 'major', 'I'], [10, 'major', 'bVII'], [5, 'major', 'IV'], [0, 'major', 'I']], scales: ['mixolydian', 'majorPentatonic', 'major'], about: 'bVII is borrowed from the parallel minor. Mixolydian contains it; the plain major scale does not.' },
  { id: 'blues', mode: 'major', label: '12-bar blues · I7 – IV7 – V7', chords: [[0, 'dominant7', 'I7'], [0, 'dominant7', 'I7'], [0, 'dominant7', 'I7'], [0, 'dominant7', 'I7'], [5, 'dominant7', 'IV7'], [5, 'dominant7', 'IV7'], [0, 'dominant7', 'I7'], [0, 'dominant7', 'I7'], [7, 'dominant7', 'V7'], [5, 'dominant7', 'IV7'], [0, 'dominant7', 'I7'], [7, 'dominant7', 'V7']], scales: ['blues', 'minorPentatonic', 'mixolydian', 'majorPentatonic'], about: 'All dominant 7ths, so no single major or minor scale fits perfectly. The minor-pentatonic "rub" against the chords IS the blues sound.' },
  { id: 'epic', mode: 'minor', label: 'i – VI – III – VII · epic minor', chords: [[0, 'minor', 'i'], [8, 'major', 'VI'], [3, 'major', 'III'], [10, 'major', 'VII']], scales: ['minorPentatonic', 'minor'], about: 'All four chords come straight from natural minor.' },
  { id: 'natural', mode: 'minor', label: 'i – iv – v – i · natural minor', chords: [[0, 'minor', 'i'], [5, 'minor', 'iv'], [7, 'minor', 'v'], [0, 'minor', 'i']], scales: ['minorPentatonic', 'minor'], about: 'A soft, modal minor: the minor v has no strong pull home.' },
  { id: 'harmonic', mode: 'minor', label: 'i – iv – V7 – i · with a major V', chords: [[0, 'minor', 'i'], [5, 'minor', 'iv'], [7, 'dominant7', 'V7'], [0, 'minor', 'i']], scales: ['minor', 'harmonicMinor', 'minorPentatonic'], about: 'V7 contains the raised 7th (G# in A minor). Natural minor clashes on that bar; harmonic minor fixes it.' },
  { id: 'andalusian', mode: 'minor', label: 'i – VII – VI – V · Andalusian', chords: [[0, 'minor', 'i'], [10, 'major', 'VII'], [8, 'major', 'VI'], [7, 'major', 'V']], scales: ['harmonicMinor', 'minor', 'minorPentatonic'], about: 'A descending flamenco line. The final major V needs the raised 7th.' },
  { id: 'dorianVamp', mode: 'minor', label: 'i7 – IV · Dorian vamp', chords: [[0, 'minor7', 'i7'], [5, 'major', 'IV'], [0, 'minor7', 'i7'], [5, 'major', 'IV']], scales: ['dorian', 'minorPentatonic', 'minor'], about: 'The major IV has the natural 6th of the key. Dorian has it; natural minor clashes.' },
  { id: 'minorJazz', mode: 'minor', label: 'iiø7 – V7 – i · minor jazz', chords: [[2, 'halfDiminished', 'iiø7'], [7, 'dominant7', 'V7'], [0, 'minor', 'i'], [0, 'minor', 'i']], scales: ['harmonicMinor', 'minor'], about: 'Minor-key ii–V–i. Harmonic minor covers the V7; the m7b5 comes from natural minor.' }
];
const PG_FUNCTIONS = { major: { 0: 'T', 2: 'S', 4: 'T', 5: 'S', 7: 'D', 9: 'T', 11: 'D' }, minor: { 0: 'T', 2: 'S', 3: 'T', 5: 'S', 7: 'D', 8: 'S', 10: 'D' } };
const PG_FUNCTION_NAMES = { T: 'Tonic', S: 'Subdominant', D: 'Dominant' };
const PG_MODES = {
  '0,2,4,5,7,9,11': 'Ionian (major)', '0,2,3,5,7,9,10': 'Dorian', '0,1,3,5,7,8,10': 'Phrygian', '0,2,4,6,7,9,11': 'Lydian', '0,2,4,5,7,9,10': 'Mixolydian', '0,2,3,5,7,8,10': 'Aeolian (natural minor)', '0,1,3,5,6,8,10': 'Locrian',
  '0,2,3,5,7,8,11': 'Harmonic minor', '0,1,3,5,6,9,10': 'Locrian ♮6', '0,2,4,5,8,9,11': 'Ionian #5', '0,2,3,6,7,9,10': 'Dorian #4', '0,1,4,5,7,8,10': 'Phrygian dominant', '0,3,4,6,7,9,11': 'Lydian #2', '0,1,3,4,6,8,9': 'Altered bb7',
  '0,2,3,5,7,9,11': 'Melodic minor', '0,1,3,5,7,9,10': 'Dorian b2', '0,2,4,6,8,9,11': 'Lydian augmented', '0,2,4,6,7,9,10': 'Lydian dominant', '0,2,4,5,7,8,10': 'Mixolydian b6', '0,2,3,5,6,8,10': 'Locrian ♮2', '0,1,3,4,6,8,10': 'Altered'
};
const PG_TENSIONS = { 1: 'b9', 2: '9', 3: '#9', 4: '3', 5: '11', 6: '#11', 8: 'b13', 9: '13', 10: 'b7', 11: '7' };
const KEY_STEPS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };

const pgKey = $('#pgKey');
const pgProgression = $('#pgProgression');
const pgScale = $('#pgScale');
const pgPosition = $('#pgPosition');
pgKey.innerHTML = chordModel.roots.map((root) => `<option>${root}</option>`).join('');
pgKey.value = 'C';
pgProgression.innerHTML = ['major', 'minor'].map((mode) => `<optgroup label="${mode === 'major' ? 'Major keys' : 'Minor keys'}">${PG_PROGRESSIONS.filter((item) => item.mode === mode).map((item) => `<option value="${item.id}">${item.label}</option>`).join('')}</optgroup>`).join('');
const pg = { bar: 0, timer: null, timers: [], beat: 0, demo: false, model: null };

function fillPgScales() {
  const progression = PG_PROGRESSIONS.find((item) => item.id === pgProgression.value);
  const others = Object.keys(SCALES).filter((id) => !progression.scales.includes(id));
  pgScale.innerHTML = `<optgroup label="Suggested">${progression.scales.map((id, index) => `<option value="${id}">${SCALES[id].label}${index === 0 ? ' ★' : ''}</option>`).join('')}</optgroup><optgroup label="Experiment">${others.map((id) => `<option value="${id}">${SCALES[id].label}</option>`).join('')}</optgroup>`;
}
function fillPgPositions() {
  const scale = SCALES[pgScale.value];
  const count = (scale.boxSteps ?? scale.steps).length;
  pgPosition.innerHTML = Array.from({ length: count }, (_, index) => `<option value="${index}">Position ${index + 1}</option>`).join('') + '<option value="all">Whole neck</option>';
}

function buildProgression() {
  const progression = PG_PROGRESSIONS.find((item) => item.id === pgProgression.value);
  const keyRoot = pgKey.value;
  const tonic = chordModel.pitchByName[keyRoot];
  const scale = SCALES[pgScale.value];
  const scaleTones = spell(keyRoot, scale);
  const scalePcs = new Set(scaleTones.map((tone) => tone.pitch));
  const keyPcs = new Set(KEY_STEPS[progression.mode].map((step) => (tonic + step) % 12));
  const chords = progression.chords.map(([offset, quality, numeral]) => {
    const root = chordModel.rootName(tonic + offset);
    const tones = chordModel.spellTones(root, quality);
    const rootPitch = chordModel.pitchByName[root];
    const chordSemis = tones.map((tone) => tone.semitones % 12);
    const inKey = tones.every((tone) => keyPcs.has(tone.pitch));
    const missing = tones.filter((tone) => !scalePcs.has(tone.pitch));
    // What each scale note does over this chord.
    const roles = scaleTones.map((tone) => {
      const semis = (tone.pitch - rootPitch + 12) % 12;
      const chordTone = tones.find((item) => item.pitch === tone.pitch);
      if (chordTone) return { ...tone, role: 'land', vsChord: chordTone.label };
      const avoid = chordSemis.includes((semis + 11) % 12);
      return { ...tone, role: avoid ? 'avoid' : 'colour', vsChord: PG_TENSIONS[semis] ?? String(semis) };
    });
    let mode = null;
    if (scale.steps.length === 7 && scalePcs.has(rootPitch)) {
      const rotation = [...scalePcs].map((pc) => (pc - rootPitch + 12) % 12).sort((a, b) => a - b).join(',');
      mode = PG_MODES[rotation] ?? null;
    }
    return { offset, quality, numeral, root, tones, symbol: `${root}${chordModel.qualities[quality].suffix}`, fn: PG_FUNCTIONS[progression.mode][offset] ?? 'S', inKey, missing, roles, mode, frets: voicingFor(root, quality) };
  });
  return { progression, keyRoot, tonic, scale, scaleTones, scalePcs, chords };
}

function boxCells(model) {
  const { keyRoot, scale, scaleTones } = model;
  const position = pgPosition.value;
  const box = position === 'all' ? null : positionBox(keyRoot, scale.boxSteps ?? scale.steps, Number(position));
  const boxFrets = box ? [...box].map((cell) => Number(cell.split(':')[1])) : [0, MAX_FRET];
  const low = Math.min(...boxFrets);
  const high = Math.max(...boxFrets);
  const byPitch = new Map(scaleTones.map((tone) => [tone.pitch, tone]));
  return { box, low, high, byPitch };
}
function renderPgBoard() {
  const model = pg.model;
  const chord = model.chords[pg.bar];
  const { box, low, high, byPitch } = boxCells(model);
  const chordPcs = new Map(chord.tones.map((tone) => [tone.pitch, tone]));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const pitch = pitchAt(s, f);
    const tone = byPitch.get(pitch);
    const chordTone = chordPcs.get(pitch);
    if (tone) {
      const blue = model.scale.boxSteps && !model.scale.boxSteps.includes(tone.step);
      const inBox = !box || box.has(key(s, f)) || (blue && f > low && f < high);
      const cls = !inBox ? 'faint' : tone.step === 0 ? 'root' : blue ? 'blue' : 'note';
      cells.push({ s, f, cls, target: inBox && Boolean(chordTone), label: tone.note, title: `${tone.note}: ${chordTone ? `${chordTone.label} of ${chord.symbol}` : 'scale note'}` });
    } else if (chordTone && f >= low && f <= high) {
      cells.push({ s, f, cls: 'outside', target: true, label: chordTone.note, title: `${chordTone.note}: ${chordTone.label} of ${chord.symbol}, not in the scale` });
    }
  }
  $('#pgBoard').innerHTML = neckSvg(cells, { label: `${model.keyRoot} ${model.scale.label} with ${chord.symbol} chord tones` });
}

function renderPgAnalysis() {
  const model = pg.model;
  const chord = model.chords[pg.bar];
  const fnClass = `fn-${chord.fn.toLowerCase()}`;
  const lands = chord.roles.filter((role) => role.role === 'land');
  const verdict = chord.missing.length
    ? `<p class="pg-verdict is-warn"><b>Heads-up:</b> the scale lacks ${chord.missing.map((tone) => `<b>${tone.note}</b> (the ${tone.label} of ${chord.symbol})`).join(', ')}. ${model.progression.id === 'blues' && chord.missing.some((tone) => tone.label === '3') ? 'In blues that clash is the point: bend the b3 up toward the 3rd, or play the 3rd from major pentatonic/Mixolydian over this chord.' : `Over this bar, swap in ${chord.missing.map((tone) => tone.note).join(', ')} (shown as dashed dots) or pick a scale that contains ${chord.missing.length > 1 ? 'them' : 'it'}.`}</p>`
    : `<p class="pg-verdict is-ok"><b>Fits:</b> every note of ${chord.symbol} is in ${model.keyRoot} ${model.scale.label.toLowerCase()}. Land on ${lands.map((role) => role.note).join(', ')}.</p>`;
  $('#pgAnalysis').innerHTML = `<header><span>${pg.bar + 1}</span><div><p class="eyebrow">BAR ${pg.bar + 1} · <b class="${fnClass}">${PG_FUNCTION_NAMES[chord.fn]}</b>${chord.inKey ? '' : ' · OUTSIDE THE KEY'}</p><h3>${chord.symbol} (${chord.numeral}) over ${model.keyRoot} ${model.scale.label}</h3></div></header>
    ${chord.mode ? `<p>From ${chord.root}, the ${model.keyRoot} ${model.scale.label.toLowerCase()} scale reads <b>${chord.roles.slice().sort((a, b) => ((a.pitch - chordModel.pitchByName[chord.root] + 12) % 12) - ((b.pitch - chordModel.pitchByName[chord.root] + 12) % 12)).map((role) => role.note).join(' ')}</b>: that is <b>${chord.root} ${chord.mode}</b>. Same notes, new centre.</p>` : ''}
    ${verdict}
    <div class="pg-roles">${chord.roles.map((role) => `<span class="role-${role.role}"><b>${role.note}</b><small>${role.vsChord}</small><em>${role.role === 'land' ? 'chord tone · land' : role.role === 'avoid' ? 'avoid · pass through' : 'colour'}</em></span>`).join('')}</div>
    <p class="pg-role-key"><b>Chord tone</b>: rest here, especially on beat 1. <b>Colour</b>: adds flavour (9ths, 6ths, 11ths); fine on weak beats or held for effect. <b>Avoid</b>: a half step above a chord tone; clashes if held, so pass through it.</p>`;
  document.querySelectorAll('#pgTimeline [data-bar]').forEach((item) => item.classList.toggle('is-selected', Number(item.dataset.bar) === pg.bar));
}

function renderPgDegrees() {
  const model = pg.model;
  const mode = model.progression.mode;
  const used = new Set(model.chords.map((chord) => chord.offset));
  const diatonic = KEY_STEPS[mode].map((step, degree) => {
    const chord = chordModel.diatonicChord(model.tonic, mode, degree);
    const fn = PG_FUNCTIONS[mode][step];
    return `<span class="fn-${fn.toLowerCase()} ${used.has(step) ? 'is-used' : ''}"><small>${chord.numeral}</small><b>${chord.root}${chordModel.qualities[chord.quality].suffix}</b><em>${PG_FUNCTION_NAMES[fn]}</em></span>`;
  }).join('');
  const borrowed = model.chords.filter((chord, index, list) => !chord.inKey && list.findIndex((item) => item.symbol === chord.symbol) === index).map((chord) => `<span class="is-used is-borrowed"><small>${chord.numeral}</small><b>${chord.symbol}</b><em>Outside the key</em></span>`).join('');
  $('#pgDegrees').innerHTML = `<p><b>The chords of ${model.keyRoot} ${mode}</b> · highlighted = used in this progression</p><div>${diatonic}${borrowed}</div>`;
}

function renderPgTimeline() {
  const model = pg.model;
  $('#pgTimeline').innerHTML = model.chords.map((chord, bar) => `<button type="button" data-bar="${bar}" class="fn-${chord.fn.toLowerCase()} ${bar === pg.bar ? 'is-selected' : ''}"><small>Bar ${bar + 1} · ${chord.numeral}</small><b>${chord.symbol}</b><span>${chord.tones.map((tone) => tone.note).join(' ')}</span><em class="${chord.missing.length ? 'is-warn' : ''}">${chord.missing.length ? `⚠ scale lacks ${chord.missing.map((tone) => tone.note).join(', ')}` : chord.mode ? `✓ ${chord.root} ${chord.mode.replace(/ \(.*\)/, '')}` : '✓ fits'}</em></button>`).join('');
}

// Demo solo: a chord tone on beat 1, then stepwise scale notes toward the next bar's target.
function demoSolo() {
  const model = pg.model;
  const { box, low, high } = boxCells(model);
  const lowFret = box ? low : 5;
  const highFret = box ? high : 9;
  const palette = [];
  for (let s = 1; s < 6; s += 1) for (let f = lowFret; f <= highFret; f += 1) {
    const midi = STRING_MIDI[s] + f;
    const inScale = model.scalePcs.has(midi % 12) && (!box || box.has(key(s, f)));
    if (inScale && !palette.some((item) => item.midi === midi)) palette.push({ s, f, midi });
  }
  palette.sort((a, b) => a.midi - b.midi);
  const outsideSpot = (pc) => {
    for (let s = 5; s >= 1; s -= 1) for (let f = lowFret; f <= highFret; f += 1) if ((STRING_MIDI[s] + f) % 12 === pc) return { s, f, midi: STRING_MIDI[s] + f };
    return null;
  };
  let previous = palette[Math.floor(palette.length / 2)]?.midi ?? 60;
  const targets = model.chords.map((chord) => {
    const pcs = new Set(chord.tones.map((tone) => tone.pitch));
    const options = palette.filter((item) => pcs.has(item.midi % 12));
    chord.missing.forEach((tone) => { const spot = outsideSpot(tone.pitch); if (spot) options.push(spot); });
    options.sort((a, b) => (a.midi === previous) - (b.midi === previous) || Math.abs(a.midi - previous) - Math.abs(b.midi - previous));
    const pick = options[0] ?? palette[0];
    previous = pick.midi;
    return pick;
  });
  const nearestIndex = (midi) => palette.reduce((best, item, index) => Math.abs(item.midi - midi) < Math.abs(palette[best].midi - midi) ? index : best, 0);
  const bars = targets.map((target, bar) => {
    const next = targets[(bar + 1) % targets.length];
    const a = nearestIndex(target.midi);
    const b = nearestIndex(next.midi);
    const at = (index) => palette[Math.max(0, Math.min(palette.length - 1, index))];
    const neighbour = at(a + 1 < palette.length ? a + 1 : a - 1);
    let step1;
    let step2;
    if (b - a >= 2) { step1 = at(b - 2); step2 = at(b - 1); } else if (a - b >= 2) { step1 = at(b + 2); step2 = at(b + 1); } else if (b === a + 1) { step1 = at(a - 1); step2 = at(a); } else if (b === a - 1) { step1 = at(a + 1); step2 = at(a); } else { step1 = at(a - 1); step2 = at(a + 1); }
    return [[target.s, target.f, 1.5], [neighbour.s, neighbour.f, .5], [step1.s, step1.f, 1], [step2.s, step2.f, 1]];
  });
  return bars;
}
function renderPgTab() {
  const notes = [];
  pg.solo.forEach((bar, index) => {
    if (index) notes.push('|');
    notes.push({ chord: pg.model.chords[index].symbol });
    notes.push(...bar);
  });
  $('#pgTab').innerHTML = tabSvg({ name: 'Demo solo', notes }, 0, 46);
}

function renderProgressions() {
  pg.model = buildProgression();
  if (pg.bar >= pg.model.chords.length) pg.bar = 0;
  pg.solo = demoSolo();
  $('#pgAbout').textContent = pg.model.progression.about;
  renderPgDegrees();
  renderPgTimeline();
  renderPgBoard();
  renderPgAnalysis();
  renderPgTab();
}
function selectBar(bar) {
  pg.bar = bar;
  renderPgBoard();
  renderPgAnalysis();
}

// ---------- playback ----------
function stopPg() {
  clearInterval(pg.timer);
  pg.timer = null;
  pg.timers.forEach(clearTimeout);
  pg.timers = [];
  document.querySelectorAll('#pgTimeline .is-now, #pgTab .is-playing').forEach((item) => item.classList.remove('is-now', 'is-playing'));
}
function pgTick() {
  const beatMs = 60000 / Number($('#pgTempo').value);
  const bars = pg.model.chords.length;
  const bar = Math.floor(pg.beat / 4) % bars;
  const beatInBar = pg.beat % 4;
  const chord = pg.model.chords[bar];
  if (beatInBar === 0) {
    selectBar(bar);
    document.querySelectorAll('#pgTimeline [data-bar]').forEach((item) => item.classList.toggle('is-now', Number(item.dataset.bar) === bar));
    if (pg.demo) {
      let time = 0;
      // Tab indexes: each bar is '|' (not before the first), a chord label, then four notes.
      const firstIndex = bar * 6 + 1;
      pg.solo[bar].forEach(([s, f, length], index) => {
        pg.timers.push(setTimeout(() => {
          sound.pluck(s, f, { level: .32, length: Math.max(.6, length * beatMs / 1000 + .3) });
          flash($('#pgBoard'), s, f, length * beatMs);
          const tabNote = $(`#pgTab [data-index="${firstIndex + index}"]`);
          tabNote?.classList.add('is-playing');
          pg.timers.push(setTimeout(() => tabNote?.classList.remove('is-playing'), length * beatMs));
        }, time));
        time += length * beatMs;
      });
    }
  }
  if (chord.frets) sound.strum(beatInBar === 0 ? chord.frets : chord.frets.map((fret, index) => index < 2 ? null : fret), { level: beatInBar === 0 ? (pg.demo ? .1 : .18) : (pg.demo ? .05 : .09), gap: .02 });
  pg.beat += 1;
}
function startPg(demo) {
  stopPg();
  pg.demo = demo;
  pg.beat = 0;
  pgTick();
  pg.timer = setInterval(pgTick, 60000 / Number($('#pgTempo').value));
}
$('#pgBacking').addEventListener('click', () => startPg(false));
$('#pgDemo').addEventListener('click', () => startPg(true));
$('#pgStop').addEventListener('click', stopPg);
$('#pgTempo').addEventListener('change', () => { if (pg.timer) startPg(pg.demo); });
$('#pgTimeline').addEventListener('click', (event) => {
  const button = event.target.closest('[data-bar]');
  if (button) selectBar(Number(button.dataset.bar));
});
pgKey.addEventListener('change', () => { stopPg(); renderProgressions(); });
pgProgression.addEventListener('change', () => {
  stopPg();
  const progression = PG_PROGRESSIONS.find((item) => item.id === pgProgression.value);
  if (progression.mode === 'minor' && pgKey.value === 'C') pgKey.value = 'A';
  pg.bar = 0;
  fillPgScales();
  fillPgPositions();
  renderProgressions();
});
pgScale.addEventListener('change', () => { stopPg(); fillPgPositions(); renderProgressions(); });
pgPosition.addEventListener('change', renderProgressions);
wirePlayback($('#pgBoard'));
fillPgScales();
fillPgPositions();
renderProgressions();
