// "Make a song" workshop. Reuses the helpers defined in scales.js (neckSvg, tabSvg, spell, voicingFor, ...).
const PROGRESSIONS = {
  epic: { label: 'i – VI – III – VII · epic minor', mode: 'minor', degrees: [0, 5, 2, 6], why: 'It starts on the home chord, drops to the big-sounding VI, lifts through III and VII, and the VII leads straight back to i.' },
  rockMinor: { label: 'i – VII – VI – VII · rock minor', mode: 'minor', degrees: [0, 6, 5, 6], why: 'The bass steps down a whole step each time, then climbs back: a classic rock and film sound.' },
  pop: { label: 'I – V – vi – IV · pop', mode: 'major', degrees: [0, 4, 5, 3], why: 'Home, tension (V), a minor detour (vi), then the IV sets up the return home. Hundreds of hits use it.' },
  ballad: { label: 'I – vi – IV – V · ballad', mode: 'major', degrees: [0, 5, 3, 4], why: 'The 1950s ballad loop: the V at the end pulls strongly back to I when the loop repeats.' }
};
const STRUM = ['D', null, 'D', 'U', null, 'U', 'D', 'U'];
const COUNTS = ['1', '&', '2', '&', '3', '&', '4', '&'];
const ARP_STRINGS = [null, 3, 4, 5, 4, 3, 4, 3]; // null = the chord's bass string
const songKey = $('#songKey');
const songProgression = $('#songProgression');
songKey.innerHTML = chordModel.roots.map((root) => `<option>${root}</option>`).join('');
songKey.value = 'A';
songProgression.innerHTML = Object.entries(PROGRESSIONS).map(([id, item]) => `<option value="${id}">${item.label}</option>`).join('');
let songTimers = [];
let song = null;

function buildSong() {
  const progression = PROGRESSIONS[songProgression.value];
  const tonic = chordModel.pitchByName[songKey.value];
  const chords = progression.degrees.map((degree) => {
    const chord = chordModel.diatonicChord(tonic, progression.mode, degree);
    const tones = chordModel.spellTones(chord.root, chord.quality);
    return { ...chord, symbol: `${chord.root}${chordModel.qualities[chord.quality].suffix}`, tones, frets: voicingFor(chord.root, chord.quality) };
  });

  // Lead box: the relative minor's fifth-position shape (same notes as the major key).
  const minorTonic = progression.mode === 'major' ? tonic + 9 : tonic;
  let rootFret = (minorTonic - 4 + 12) % 12;
  if (rootFret < 3) rootFret += 12;
  const scalePitches = new Set(SCALES.minor.steps.map((step) => (minorTonic + step) % 12));
  const low = rootFret;
  const high = rootFret + 3;
  const palette = [];
  for (let s = 2; s < 6; s += 1) for (let f = low; f <= high; f += 1) {
    const midi = STRING_MIDI[s] + f;
    if (scalePitches.has(midi % 12) && !palette.some((item) => item.midi === midi)) palette.push({ s, f, midi });
  }
  palette.sort((a, b) => a.midi - b.midi);

  // Beat-1 targets: a chord tone for each bar, as close as possible to the previous target (smooth voice leading).
  const targets = [];
  chords.forEach((chord) => {
    const pcs = new Set(chord.tones.map((tone) => tone.pitch));
    const options = palette.map((item, index) => ({ ...item, index })).filter((item) => pcs.has(item.midi % 12));
    const reference = targets.length ? targets.at(-1).midi : palette[Math.floor(palette.length / 2)].midi;
    options.sort((a, b) => Math.abs(a.midi - reference) - Math.abs(b.midi - reference) || (targets.length && a.midi === reference ? 1 : 0) - (targets.length && b.midi === reference ? 1 : 0) || b.midi - a.midi);
    const pick = options[0];
    const tone = chord.tones.find((item) => item.pitch === pick.midi % 12);
    targets.push({ ...pick, note: tone.note, label: tone.label });
  });
  const at = (index) => palette[Math.max(0, Math.min(palette.length - 1, index))];
  const melody = [];
  targets.forEach((target, bar) => {
    const next = targets[(bar + 1) % targets.length];
    const a = target.index;
    const b = next.index;
    const neighbour = at(a + 1 < palette.length ? a + 1 : a - 1);
    let step1;
    let step2;
    // Approach the next target by step; when it is next door, dip away first so the line keeps moving.
    if (b - a >= 2) { step1 = at(b - 2); step2 = at(b - 1); } else if (a - b >= 2) { step1 = at(b + 2); step2 = at(b + 1); } else if (b === a + 1) { step1 = at(a - 1); step2 = at(a); } else if (b === a - 1) { step1 = at(a + 1); step2 = at(a); } else { step1 = at(a - 1); step2 = at(a + 1); }
    melody.push({ bar, notes: [[target.s, target.f, 1.5, 'target'], [neighbour.s, neighbour.f, .5], [step1.s, step1.f, 1], [step2.s, step2.f, 1]] });
  });
  return { progression, chords, rootFret, low, high, scalePitches, targets, melody, tonic };
}

function renderSong() {
  stopSong();
  song = buildSong();
  const { progression, chords } = song;
  const keyName = `${songKey.value} ${progression.mode}`;
  $('#songChordIntro').innerHTML = `The key of <b>${keyName}</b> gives seven chords (see <a href="#harmony">Harmony</a>). This progression picks four of them: <b>${chords.map((chord) => `${chord.numeral} = ${chord.symbol}`).join(', ')}</b>. ${progression.why} One bar (four beats) per chord.`;
  $('#workshopChords').innerHTML = chords.map((chord, index) => {
    const next = chords[(index + 1) % chords.length];
    const shared = chord.tones.filter((tone) => next.tones.some((other) => other.pitch === tone.pitch)).map((tone) => tone.note);
    const notes = chordModel.voicingNotes(chord.frets, chord.root, chord.quality);
    return `<div class="song-chord"><div class="song-chord-head"><div><small>${chord.numeral}</small><a href="../chords/detail.html?root=${encodeURIComponent(chord.root)}&quality=${chord.quality}"><b>${chord.symbol}</b></a></div><button class="play-button" type="button" data-song-chord="${index}" aria-label="Play ${chord.symbol}">▶</button></div>${sound.svg(chord.frets, notes, { title: chord.symbol })}<p>${chord.tones.map((tone) => tone.note).join(' · ')}<br><span>${shared.length ? `Shares ${shared.join(', ')} with ${next.symbol}` : `No notes shared with ${next.symbol}`}</span></p></div>`;
  }).join('');

  $('#strumGrid').innerHTML = chords.map((chord, bar) => `<div class="strum-bar"><b>${chord.symbol}</b><div>${STRUM.map((dir, step) => `<span id="strum-${bar}-${step}" class="${dir ? 'is-hit' : ''}"><i>${dir === 'D' ? '↓' : dir === 'U' ? '↑' : '·'}</i><small>${COUNTS[step]}</small></span>`).join('')}</div></div>`).join('');

  // Arpeggio tab
  const arpNotes = [];
  song.arpIndex = [];
  chords.forEach((chord, bar) => {
    if (bar) arpNotes.push('|');
    arpNotes.push({ chord: chord.symbol });
    const bass = chord.frets.findIndex((fret) => fret !== null);
    const top = chord.frets.length - 1 - [...chord.frets].reverse().findIndex((fret) => fret !== null);
    ARP_STRINGS.forEach((string) => {
      let s = string ?? bass;
      if (chord.frets[s] === null || s < bass) s = top;
      song.arpIndex.push(arpNotes.length);
      arpNotes.push([s, chord.frets[s], .5]);
    });
  });
  song.arpNotes = arpNotes;
  $('#arpTab').innerHTML = tabSvg({ name: 'Arpeggio part', notes: arpNotes }, 0, 34);

  // Lead tab
  const leadNotes = [];
  song.leadIndex = [];
  song.melody.forEach(({ notes }, bar) => {
    if (bar) leadNotes.push('|');
    leadNotes.push({ chord: chords[bar].symbol });
    notes.forEach((note) => { song.leadIndex.push(leadNotes.length); leadNotes.push(note[3] === 'target' ? [note[0], note[1], note[2]] : note); });
  });
  song.leadNotes = leadNotes;
  $('#leadTab').innerHTML = tabSvg({ name: 'Lead melody', notes: leadNotes }, 0, 40);
  $('#targetRow').innerHTML = song.targets.map((target, bar) => `<span><small>Bar ${bar + 1} · ${chords[bar].symbol}</small><b>${target.note}</b><em>the ${target.label === '1' ? 'root' : target.label === '5' ? '5th' : '3rd'} of ${chords[bar].symbol}</em></span>`).join('');

  // Lead box on the neck with the targets ringed
  const targetKeys = new Set(song.targets.map((target) => key(target.s, target.f)));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const pitch = pitchAt(s, f);
    if (!song.scalePitches.has(pitch)) continue;
    const inBox = f >= song.low - 1 && f <= song.high + 1;
    cells.push({ s, f, cls: !inBox ? 'faint' : pitch === song.tonic % 12 ? 'root' : 'note', target: targetKeys.has(key(s, f)), label: keyNoteName(pitch) });
  }
  $('#songBoard').innerHTML = neckSvg(cells, { label: 'Lead box with target notes' });

  const sections = [['Intro', 'Arpeggios', 'arp'], ['Verse', 'Strumming', 'strum'], ['Solo', 'Lead + light strum', 'lead'], ['Outro', 'Arpeggios, end on the home chord', 'arp']];
  $('#songForm').innerHTML = sections.map(([name, how], index) => `<div class="form-part" id="form-${index}"><small>${index * 4 + 1}–${index * 4 + 4}</small><b>${name}</b><span>${how}</span><em>${chords.map((chord) => chord.symbol).join(' ')}</em></div>`).join('');
}
// Spell a pitch the way the song's key spells it.
function keyNoteName(pitch) {
  const tones = spell(songKey.value, PROGRESSIONS[songProgression.value].mode === 'major' ? SCALES.major : SCALES.minor);
  return tones.find((tone) => tone.pitch === pitch)?.note ?? SHARPS[pitch];
}

// ---------- playback ----------
function stopSong() {
  songTimers.forEach(clearTimeout);
  songTimers = [];
  document.querySelectorAll('#song .is-playing, #song .is-now').forEach((item) => item.classList.remove('is-playing', 'is-now'));
}
function at(time, fn) { songTimers.push(setTimeout(fn, time)); }
function mark(selector, time, length) {
  at(time, () => document.querySelector(selector)?.classList.add('is-now'));
  at(time + length - 10, () => document.querySelector(selector)?.classList.remove('is-now'));
}
function lightTab(container, index, time, length) {
  at(time, () => container.querySelector(`[data-index="${index}"]`)?.classList.add('is-playing'));
  at(time + length, () => container.querySelector(`[data-index="${index}"]`)?.classList.remove('is-playing'));
}
function scheduleStrum(startBeat, beat, level = .18) {
  song.chords.forEach((chord, bar) => STRUM.forEach((dir, step) => {
    if (!dir) return;
    const time = (startBeat + bar * 4 + step * .5) * beat;
    const frets = dir === 'D' ? chord.frets : chord.frets.map((fret, index) => index < 2 ? null : fret);
    at(time, () => sound.strum(frets, { level: dir === 'D' ? level : level * .6, gap: dir === 'D' ? .016 : .01 }));
    mark(`#strum-${bar}-${step}`, time, beat / 2);
  }));
}
function scheduleArp(startBeat, beat) {
  let position = startBeat;
  song.arpNotes.forEach((note, index) => {
    if (!Array.isArray(note)) return;
    const time = position * beat;
    at(time, () => sound.pluck(note[0], note[1], { length: 1.8, level: .24 }));
    lightTab($('#arpTab'), index, time, note[2] * beat);
    position += note[2];
  });
}
function scheduleLead(startBeat, beat) {
  let position = startBeat;
  song.leadNotes.forEach((note, index) => {
    if (!Array.isArray(note)) return;
    const time = position * beat;
    at(time, () => { sound.pluck(note[0], note[1], { length: Math.max(.7, note[2] * beat / 1000 + .4), level: .34 }); flash($('#songBoard'), note[0], note[1], note[2] * beat); });
    lightTab($('#leadTab'), index, time, note[2] * beat);
    position += note[2];
  });
  // Soft chord on each downbeat so the melody has something to sit on.
  song.chords.forEach((chord, bar) => at((startBeat + bar * 4) * beat, () => sound.strum(chord.frets, { level: .07, gap: .02 })));
}
function playPart(part) {
  stopSong();
  const beat = 60000 / Number($('#songTempo').value);
  const lead = 4; // one bar of count-in clicks
  for (let click = 0; click < lead; click += 1) at(click * beat, () => sound.pluck(5, 12, { length: .08, level: .12 }));
  if (part === 'strum') scheduleStrum(lead, beat);
  if (part === 'arp') scheduleArp(lead, beat);
  if (part === 'lead') scheduleLead(lead, beat);
  if (part === 'song') {
    const plan = [['arp', 0], ['strum', 1], ['lead', 2], ['arp', 3]];
    plan.forEach(([name, section]) => {
      const start = lead + section * 16;
      if (name === 'arp') scheduleArp(start, beat);
      if (name === 'strum') scheduleStrum(start, beat);
      if (name === 'lead') { scheduleLead(start, beat); scheduleStrum(start, beat, .07); }
      mark(`#form-${section}`, start * beat, 16 * beat);
    });
    const home = song.chords[0];
    at((lead + 64) * beat, () => sound.strum(home.frets, { level: .22, gap: .05 }));
  }
}
$('#song').addEventListener('click', (event) => {
  const partButton = event.target.closest('[data-part]');
  if (partButton) playPart(partButton.dataset.part);
  const chordButton = event.target.closest('[data-song-chord]');
  if (chordButton) sound.strum(song.chords[Number(chordButton.dataset.songChord)].frets);
});
$('#songStop').addEventListener('click', stopSong);
[songKey, songProgression].forEach((control) => control.addEventListener('change', renderSong));
wirePlayback($('#songBoard'));
renderSong();
