const themeLoader = document.createElement('script');
themeLoader.src = '../theme.js';
document.head.append(themeLoader);

const chordModel = window.GUITAR_CHORD_DATA;
const diagram = window.ChordDiagram;
const parameters = new URLSearchParams(location.search);
const rootPicker = document.querySelector('#chordRoot');
const qualityPicker = document.querySelector('#chordQuality');
rootPicker.innerHTML = chordModel.roots.map((root) => `<option value="${root}">${root}</option>`).join('');
qualityPicker.innerHTML = Object.entries(chordModel.qualities).map(([key, quality]) => `<option value="${key}">${quality.label}</option>`).join('');
let selectedRoot = parameters.get('root') || 'C';
let selectedQuality = parameters.get('quality') || 'major';
if (!chordModel.roots.includes(selectedRoot)) selectedRoot = 'C';
if (!chordModel.qualities[selectedQuality]) selectedQuality = 'major';
rootPicker.value = selectedRoot;
qualityPicker.value = selectedQuality;

const intervalNames = { 1: 'Root', 2: 'Major 2nd', b3: 'Minor 3rd', 3: 'Major 3rd', 4: 'Perfect 4th', b5: 'Diminished 5th', 5: 'Perfect 5th', '#5': 'Augmented 5th', 6: 'Major 6th', bb7: 'Diminished 7th', b7: 'Minor 7th', 7: 'Major 7th', 9: 'Major 9th' };
const altSymbols = {
  major: ['', 'M', 'maj'], minor: ['m', 'min', '−'], dominant7: ['7', 'dom7'], major7: ['maj7', 'M7', 'Δ7'], minor7: ['m7', 'min7', '−7'],
  sus2: ['sus2'], sus4: ['sus4', 'sus'], diminished: ['dim', '°'], augmented: ['aug', '+'], power: ['5'], major6: ['6', 'M6'], minor6: ['m6', 'min6'],
  add9: ['add9', '(add9)', 'add2'], dominant9: ['9'], sus7: ['7sus4', '7sus'], halfDiminished: ['m7b5', 'ø7', '−7♭5'], diminished7: ['dim7', '°7']
};
const enharmonic = { 'C#': 'Db', Eb: 'D#', 'F#': 'Gb', Ab: 'G#', Bb: 'A#' };
// Chords that are not built from a key's scale borrow their key placement from a simpler parent chord.
const parentQuality = { sus2: 'major', sus4: 'major', power: 'major', major6: 'major', add9: 'major', dominant9: 'dominant7', sus7: 'dominant7', augmented: 'major', minor6: 'minor', diminished7: 'diminished' };
// Movable grips, as fret offsets from the root on string 6 (E shape) or string 5 (A shape).
const movableShapes = {
  major: { E: [0, 2, 2, 1, 0, 0], A: [null, 0, 2, 2, 2, 0] },
  minor: { E: [0, 2, 2, 0, 0, 0], A: [null, 0, 2, 2, 1, 0] },
  dominant7: { E: [0, 2, 0, 1, 0, 0], A: [null, 0, 2, 0, 2, 0] },
  major7: { E: [0, null, 1, 1, 0, null], A: [null, 0, 2, 1, 2, 0] },
  minor7: { E: [0, 2, 0, 0, 0, 0], A: [null, 0, 2, 0, 1, 0] },
  sus2: { A: [null, 0, 2, 2, 0, 0] },
  sus4: { E: [0, 2, 2, 2, 0, 0], A: [null, 0, 2, 2, 3, 0] },
  power: { E: [0, 2, 2, null, null, null], A: [null, 0, 2, 2, null, null] },
  major6: { E: [0, null, -1, 1, 0, null], A: [null, 0, 2, 2, 2, 2] },
  minor6: { E: [0, null, -1, 0, 0, null], A: [null, 0, 2, 2, 1, 2] },
  dominant9: { A: [null, 0, -1, 0, 0, null] },
  sus7: { E: [0, 2, 0, 2, 0, 0], A: [null, 0, 2, 0, 3, 0] },
  halfDiminished: { E: [0, null, 0, 0, -1, null], A: [null, 0, 1, 0, 1, null] },
  diminished7: { E: [0, null, -1, 0, -1, null], A: [null, 0, 1, -1, 1, null] },
  diminished: { A: [null, 0, 1, 2, 1, null] }
};

function chordSymbol(root, quality) { return `${root}${chordModel.qualities[quality].suffix}`; }
function chordLink(root, quality, extraClass = '') {
  return `<a class="${extraClass}" href="detail.html?root=${encodeURIComponent(root)}&quality=${quality}">${chordSymbol(root, quality)}</a>`;
}
function fretText(frets) { return frets.map((fret) => fret === null ? 'x' : fret).join(' '); }

function movableForms(root, quality) {
  const shapes = movableShapes[quality];
  if (!shapes) return [];
  const rootPitch = chordModel.pitchByName[root];
  const forms = [];
  for (const [shape, offsets] of Object.entries(shapes)) {
    const stringIndex = shape === 'E' ? 0 : 1;
    let rootFret = (rootPitch - chordModel.stringPitches[stringIndex] + 12) % 12;
    // Open-position versions of these shapes are covered separately; shapes that reach behind the root need room.
    if (rootFret === 0 || rootFret + Math.min(...offsets.filter((offset) => offset !== null)) < 1) rootFret += 12;
    if (rootFret > 14) continue;
    forms.push({ name: `${shape}-shape · root on string ${shape === 'E' ? 6 : 5}`, frets: offsets.map((offset) => offset === null ? null : rootFret + offset) });
  }
  return forms;
}

function selectedVoicings(root, quality) {
  const forms = [];
  const add = (form) => {
    if (!forms.some((existing) => existing.frets.join(',') === form.frets.join(','))) forms.push(form);
  };
  const open = chordModel.openShapes[`${root}:${quality}`];
  if (open) add({ ...open });
  movableForms(root, quality).forEach(add);
  for (const form of chordModel.findVoicings(root, quality, 6)) {
    if (forms.length >= 6) break;
    const openPosition = form.frets.includes(0) && form.maxFret <= 4;
    add({ frets: form.frets, name: openPosition ? 'Open-position grip' : `Up the neck · fret ${form.minFret}` });
  }
  return forms.slice(0, 6).sort((a, b) => lowestFret(a.frets) - lowestFret(b.frets));
}
function lowestFret(frets) {
  const fretted = frets.filter((fret) => fret !== null && fret > 0);
  return fretted.length ? Math.min(...fretted) : 0;
}

function neckMapSvg(root, quality) {
  const tones = chordModel.spellTones(root, quality);
  const frets = 12;
  const left = 34;
  const right = 990;
  const top = 22;
  const gap = 30;
  const fretWidth = (right - left) / (frets + 1);
  const stringOrder = [5, 4, 3, 2, 1, 0]; // high e on top, like tab
  const names = ['E', 'A', 'D', 'G', 'B', 'e'];
  const xFor = (fret) => left + (fret + .5) * fretWidth;
  const lines = [];
  for (let fret = 0; fret <= frets + 1; fret += 1) {
    const xLine = left + fret * fretWidth;
    lines.push(`<line x1="${xLine}" y1="${top}" x2="${xLine}" y2="${top + gap * 5}" class="${fret === 1 ? 'nm-nut' : 'nm-fret'}"/>`);
  }
  stringOrder.forEach((stringIndex, row) => {
    const yLine = top + row * gap;
    lines.push(`<line x1="${left}" y1="${yLine}" x2="${right}" y2="${yLine}" class="nm-string"/><text x="${left - 14}" y="${yLine + 4}" class="nm-name">${names[stringIndex]}</text>`);
  });
  const inlays = [3, 5, 7, 9, 12].map((fret) => `<text x="${xFor(fret)}" y="${top + gap * 5 + 22}" class="nm-num">${fret}</text>`).join('') + `<text x="${xFor(0)}" y="${top + gap * 5 + 22}" class="nm-num">open</text>`;
  const dots = [];
  stringOrder.forEach((stringIndex, row) => {
    for (let fret = 0; fret <= frets; fret += 1) {
      const pitch = (chordModel.stringPitches[stringIndex] + fret) % 12;
      const tone = tones.find((item) => item.pitch === pitch);
      if (!tone) continue;
      const cls = tone.semitones === 0 ? 'nm-dot is-root' : `nm-dot tone-${tones.indexOf(tone)}`;
      dots.push(`<g><title>${tone.note} (${tone.label}) · string ${6 - stringIndex}, fret ${fret}</title><circle cx="${xFor(fret)}" cy="${top + row * gap}" r="11" class="${cls}"/><text x="${xFor(fret)}" y="${top + row * gap + 4}" class="nm-label">${tone.note}</text></g>`);
    }
  });
  return `<svg class="neck-map" viewBox="0 0 1000 ${top + gap * 5 + 32}" role="img" aria-label="Every ${chordSymbol(root, quality)} chord tone from the open strings to fret 12">${lines.join('')}${inlays}${dots.join('')}</svg>`;
}

function progressionsFor(root, quality) {
  const lookupQuality = chordModel.keysContaining(root, quality).length ? quality : parentQuality[quality];
  if (!lookupQuality) return { keys: [], rows: [] };
  const keys = chordModel.keysContaining(root, lookupQuality);
  const home = keys.find((key) => key.degree === 0) || keys[0];
  if (!home) return { keys, rows: [] };
  const tonic = chordModel.pitchByName[home.keyRoot];
  const patterns = home.mode === 'major'
    ? [['Pop / rock', [0, 4, 5, 3]], ['Three-chord classic', [0, 3, 4, 0]], ['Fifties doo-wop', [0, 5, 3, 4]], ['Jazz ii–V–I', [1, 4, 0]]]
    : [['Epic minor', [0, 5, 2, 6]], ['Minor blues', [0, 3, 4, 0]], ['Descending', [0, 6, 5, 4]], ['Minor ii–v–i', [1, 4, 0]]];
  const rows = patterns
    .filter(([, degrees]) => degrees.includes(home.degree))
    .map(([name, degrees]) => ({
      name,
      chords: degrees.map((degree) => {
        const chord = chordModel.diatonicChord(tonic, home.mode, degree);
        const isSelf = degree === home.degree;
        return { ...chord, root: isSelf ? root : chord.root, quality: isSelf ? quality : chord.quality, isSelf };
      })
    }));
  return { keys, rows, home, lookupQuality };
}

// Each chord is its own page to search engines: give it a canonical URL, description and share tags.
function updateSeo(symbol, qualityLabel, names, shapeCount) {
  const url = `https://monijaman.github.io/GuiterMan/chords/detail.html?root=${encodeURIComponent(selectedRoot)}&quality=${selectedQuality}`;
  const description = `${symbol} guitar chord (${selectedRoot} ${qualityLabel}): notes ${names.join(', ')}, ${shapeCount} playable shape${shapeCount === 1 ? '' : 's'} with note names, a full-neck map, related keys and progressions.`;
  const setMeta = (attribute, name, content) => {
    let meta = document.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, name); document.head.append(meta); }
    meta.setAttribute('content', content);
  };
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = url;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', `${symbol} guitar chord`);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', `${symbol} guitar chord`);
  setMeta('name', 'twitter:description', description);
}

function renderChord() {
  const definition = chordModel.qualities[selectedQuality];
  const notes = chordModel.spellTones(selectedRoot, selectedQuality);
  const symbol = chordSymbol(selectedRoot, selectedQuality);
  const names = notes.map((note) => note.note);
  const voicings = selectedVoicings(selectedRoot, selectedQuality);
  document.title = `${symbol} chord: notes, shapes & theory — Guitar Field Notes`;
  updateSeo(symbol, definition.label.toLowerCase(), names, voicings.length);

  const alias = enharmonic[selectedRoot] ? ` Same sound as <strong>${enharmonic[selectedRoot]}${definition.suffix}</strong>.` : '';
  document.querySelector('#chordHero').innerHTML = `<p class="eyebrow">CHORD GUIDE / ${definition.label.toUpperCase()}</p><h1>${symbol}<br><em>${selectedRoot} ${definition.label.toLowerCase()}.</em></h1><p>Notes: <strong>${names.join(' · ')}</strong>. ${chordModel.usage[selectedQuality] ?? ''}${alias}</p><button class="hear-button" type="button" data-play="0">▶ Hear ${symbol}</button>`;

  const symbols = (altSymbols[selectedQuality] || [definition.suffix]).map((suffix) => `${selectedRoot}${suffix}`).join(' · ');
  const intervalRows = notes.map((tone) => `<tr><td><b class="${tone.semitones === 0 ? 'is-root' : ''}">${tone.note}</b></td><td>${tone.label}</td><td>${intervalNames[tone.label] ?? tone.label}${tone.optional ? ' <small>(optional)</small>' : ''}</td><td>${tone.semitones}</td></tr>`).join('');

  const voicingCards = voicings.map((form, index) => {
    const toneNames = chordModel.voicingNotes(form.frets, selectedRoot, selectedQuality);
    const lowToHigh = toneNames.filter(Boolean).map((tone) => tone.note).join(' ');
    const position = lowestFret(form.frets);
    return `<article class="voicing-card"><header><div><h3>${form.name}</h3><p>${form.frets.includes(0) && Math.max(...form.frets.filter((fret) => fret !== null)) <= 4 ? 'Open position' : `Starts at fret ${position}`}</p></div><button class="play-button" type="button" data-play="${index}" aria-label="Play ${form.name}">▶</button></header>${diagram.svg(form.frets, toneNames, { title: `${symbol} ${form.name}`, degrees: true })}<dl class="voicing-facts"><div><dt>Frets</dt><dd>${fretText(form.frets)}</dd></div><div><dt>Notes low → high</dt><dd>${lowToHigh}</dd></div></dl></article>`;
  }).join('');

  const { keys, rows, home, lookupQuality } = progressionsFor(selectedRoot, selectedQuality);
  const borrowed = lookupQuality && lookupQuality !== selectedQuality;
  const keyChips = keys.map((key) => `<a class="key-chip" href="detail.html?root=${encodeURIComponent(key.keyRoot)}&quality=${key.mode === 'major' ? 'major' : 'minor'}"><b>${key.numeral}</b> in ${key.key}</a>`).join('');
  const progressionRows = rows.map((row) => `<div class="progression-row"><span>${row.name}</span><div>${row.chords.map((chord) => `<a class="${chord.isSelf ? 'is-self' : ''}" href="detail.html?root=${encodeURIComponent(chord.root)}&quality=${chord.quality}"><b>${chordSymbol(chord.root, chord.quality)}</b><small>${chord.numeral}</small></a>`).join('<i>→</i>')}</div></div>`).join('');
  const whereSection = keys.length ? `<section class="chord-keys"><div class="chord-page-heading"><h2>Where ${symbol} lives</h2><p>${borrowed ? `${symbol} is a colour version of ${chordSymbol(selectedRoot, lookupQuality)}; use it anywhere ${chordSymbol(selectedRoot, lookupQuality)} fits.` : 'Keys that contain this chord, with its Roman-numeral role in each.'}</p></div><div class="key-chips">${keyChips}</div>${progressionRows ? `<h3 class="sub-heading">Try it in a progression · key of ${home.key}</h3>${progressionRows}` : ''}</section>` : '';

  const rootPitch = chordModel.pitchByName[selectedRoot];
  const family = Object.entries(chordModel.qualities).filter(([key]) => key !== selectedQuality).map(([key, value]) => `<a href="detail.html?root=${encodeURIComponent(selectedRoot)}&quality=${key}"><b>${chordSymbol(selectedRoot, key)}</b> ${value.label}</a>`).join('');
  const neighbours = [];
  if (selectedQuality === 'major') neighbours.push(['Relative minor', chordModel.rootName(rootPitch + 9), 'minor'], ['Parallel minor', selectedRoot, 'minor']);
  if (selectedQuality === 'minor') neighbours.push(['Relative major', chordModel.rootName(rootPitch + 3), 'major'], ['Parallel major', selectedRoot, 'major']);
  neighbours.push(['A half step up', chordModel.rootName(rootPitch + 1), selectedQuality], ['A half step down', chordModel.rootName(rootPitch - 1), selectedQuality]);
  const neighbourLinks = neighbours.map(([label, root, quality]) => `<a href="detail.html?root=${encodeURIComponent(root)}&quality=${quality}"><small>${label}</small><b>${chordSymbol(root, quality)}</b></a>`).join('');

  document.querySelector('#chordDetail').innerHTML = `
    <div class="chord-meta-grid">
      <div class="chord-meta"><span>CHORD TONES</span><strong>${names.join(' · ')}</strong></div>
      <div class="chord-meta"><span>FORMULA</span><strong>${notes.map((tone) => tone.label).join(' · ')}</strong></div>
      <div class="chord-meta"><span>SEMITONES FROM ROOT</span><strong>${notes.map((tone) => tone.semitones).join(' · ')}</strong></div>
      <div class="chord-meta"><span>ALSO WRITTEN</span><strong>${symbols}</strong></div>
    </div>
    <div class="chord-page-heading"><h2>Guitar shapes</h2><p>Strings run low E → high e, left to right · dots show the note you play · <span class="legend-root">●</span> root · ○ open · × don't play · <b>fr</b> = fret number</p></div>
    <section class="voicing-grid">${voicingCards}</section>
    <section class="neck-section"><div class="chord-page-heading"><h2>Every ${symbol} note on the neck</h2><p>Any group of these notes forms ${symbol}. High e on top, like tab. Hover a dot for its string and fret.</p></div><div class="neck-scroll">${neckMapSvg(selectedRoot, selectedQuality)}</div></section>
    <section class="chord-explainer">
      <article class="theory-panel"><h3>What makes this chord?</h3><p>${definition.sound} A chord's quality comes from the intervals between its notes, not from the shape you use.</p><table class="interval-table"><thead><tr><th>Note</th><th>Degree</th><th>Interval</th><th>Semitones</th></tr></thead><tbody>${intervalRows}</tbody></table></article>
      <article class="theory-panel"><h3>How to build ${symbol}</h3><p>Start on ${selectedRoot}. Count up the chromatic scale (every fret is one semitone) and add ${notes.slice(1).map((note) => `${note.note} at +${note.semitones}`).join(', ')}. Any string, any octave — as long as those notes sound, it's ${symbol}.</p><h4>Practice tips</h4><ul class="tip-list"><li>Pick each string one at a time and listen for buzzing or muted notes.</li><li>Find the coral root note in every shape — it names the chord.</li><li>Move the E- and A-shapes along the neck: the same grip plays ${definition.label.toLowerCase()} chords on every root.</li></ul></article>
    </section>
    ${whereSection}
    <section class="chord-related"><div class="chord-page-heading"><h2>Related chords</h2></div><div class="neighbour-links">${neighbourLinks}</div><h3 class="sub-heading">Other ${selectedRoot} chords</h3><div class="related-chords">${family}</div><a class="chord-all-link" href="index.html">← Browse every chord</a></section>`;

  document.querySelectorAll('[data-play]').forEach((button) => button.addEventListener('click', () => {
    const form = voicings[Number(button.dataset.play)];
    if (form) diagram.strum(form.frets);
  }));
}
function updateFromPickers() {
  selectedRoot = rootPicker.value;
  selectedQuality = qualityPicker.value;
  history.replaceState(null, '', `?root=${encodeURIComponent(selectedRoot)}&quality=${selectedQuality}`);
  renderChord();
}
rootPicker.addEventListener('change', updateFromPickers);
qualityPicker.addEventListener('change', updateFromPickers);
renderChord();
