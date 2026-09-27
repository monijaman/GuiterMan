// Shared chord-box renderer: strings run low E → high e from left to right,
// frets run top to bottom, and every dot is labelled with the note it sounds.
window.ChordDiagram = (() => {
  const stringMidi = [40, 45, 50, 55, 59, 64];

  function startFretFor(frets) {
    const fretted = frets.filter((fret) => fret !== null && fret > 0);
    if (!fretted.length) return 1;
    const max = Math.max(...fretted);
    return max <= 4 ? 1 : Math.min(...fretted);
  }

  // A barre is drawn when the lowest fretted fret is held on several strings
  // with nothing open or muted between them (the index finger lies across them).
  function findBarre(frets) {
    const fretted = frets.filter((fret) => fret !== null && fret > 0);
    if (fretted.length < 3) return null;
    const low = Math.min(...fretted);
    const first = frets.indexOf(low);
    const last = frets.lastIndexOf(low);
    if (first === last) return null;
    // Near the nut, two notes on one fret are normally two fingers (open D, Dm7) unless
    // five fretted notes leave no other way to hold them (Bb: x 1 3 3 2 1).
    const count = frets.filter((fret) => fret === low).length;
    if (count < 3 && fretted.length <= 4 && startFretFor(frets) === 1) return null;
    for (let index = first; index <= last; index += 1) {
      if (frets[index] === null || frets[index] < low) return null;
    }
    return { fret: low, from: first, to: last };
  }

  /**
   * @param {Array<number|null>} frets  six entries, low E first; null = muted, 0 = open
   * @param {Array<{note:string,label:string,isRoot:boolean}|null>} notes  one per string
   * @param {{title?:string, degrees?:boolean, className?:string}} options
   */
  function svg(frets, notes, options = {}) {
    const startFret = startFretFor(frets);
    const fretted = frets.filter((fret) => fret !== null && fret > 0);
    const rows = Math.max(4, fretted.length ? Math.max(...fretted) - startFret + 1 : 4);
    const left = 22;
    const stringGap = 30;
    const right = left + stringGap * 5;
    const top = 30;
    const fretGap = 30;
    const bottom = top + fretGap * rows;
    const labelY = bottom + 18;
    const height = labelY + (options.degrees ? 16 : 6);
    const width = right + 46;
    const x = (index) => left + index * stringGap;
    const y = (fret) => top + (fret - startFret + .5) * fretGap;

    const fretLines = Array.from({ length: rows + 1 }, (_, row) => {
      const nut = row === 0 && startFret === 1;
      return `<line x1="${left}" y1="${top + row * fretGap}" x2="${right}" y2="${top + row * fretGap}" class="${nut ? 'cd-nut' : 'cd-fret'}"/>`;
    }).join('');
    const strings = frets.map((_, index) => `<line x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${bottom}" class="cd-string" stroke-width="${(2.1 - index * .22).toFixed(2)}"/>`).join('');
    const fretNumbers = Array.from({ length: rows }, (_, row) => `<text x="${right + 17}" y="${top + (row + .5) * fretGap + 4}" class="cd-fr">${startFret + row}fr</text>`).join('');
    const tops = frets.map((fret, index) => {
      if (fret === null) return `<text x="${x(index)}" y="${top - 9}" class="cd-mute">×</text>`;
      if (fret === 0) return `<circle cx="${x(index)}" cy="${top - 13}" r="6" class="cd-open${notes[index]?.isRoot ? ' is-root' : ''}"/>`;
      return '';
    }).join('');
    const barre = findBarre(frets);
    const barreBar = barre ? `<rect x="${x(barre.from) - 11}" y="${y(barre.fret) - 11}" width="${x(barre.to) - x(barre.from) + 22}" height="22" rx="11" class="cd-barre"/>` : '';
    const dots = frets.map((fret, index) => {
      if (fret === null || fret === 0) return '';
      const tone = notes[index];
      const cls = tone?.isRoot ? 'cd-dot is-root' : 'cd-dot';
      const label = tone?.note ?? '';
      return `<circle cx="${x(index)}" cy="${y(fret)}" r="11.5" class="${cls}"/><text x="${x(index)}" y="${y(fret) + 4}" class="cd-dot-label${label.length > 1 ? ' is-long' : ''}">${label}</text>`;
    }).join('');
    const noteRow = notes.map((tone, index) => tone ? `<text x="${x(index)}" y="${labelY}" class="cd-note${tone.isRoot ? ' is-root' : ''}">${tone.note}</text>` : '').join('');
    const degreeRow = options.degrees ? notes.map((tone, index) => tone ? `<text x="${x(index)}" y="${labelY + 14}" class="cd-degree">${tone.label}</text>` : '').join('') : '';
    const spoken = frets.map((fret, index) => fret === null ? 'muted' : `${notes[index]?.note ?? ''} at fret ${fret}`).join(', ');
    return `<svg class="cd ${options.className ?? ''}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title ?? 'Chord'} diagram, low E to high e: ${spoken}">${fretLines}${strings}${barreBar}${fretNumbers}${tops}${dots}${noteRow}${degreeRow}</svg>`;
  }

  let audio;
  function context() {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume?.();
    return audio;
  }
  // One plucked string. `bend` (in semitones) glides the pitch up like a string bend.
  function voice(midi, start, { level = .22, length = 2.2, bend = 0, slideFrom = null } = {}) {
    const ctx = context();
    const master = ctx.createGain();
    master.gain.value = level;
    master.connect(ctx.destination);
    const pitch = (value) => 440 * 2 ** ((value - 69) / 12);
    for (const [type, amount, detune] of [['triangle', 1, 0], ['sine', .35, 1200]]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.detune.value = detune;
      osc.frequency.setValueAtTime(pitch(slideFrom ?? midi), start);
      if (slideFrom !== null) osc.frequency.exponentialRampToValueAtTime(pitch(midi), start + .12);
      if (bend) {
        osc.frequency.setValueAtTime(pitch(midi), start + .09);
        osc.frequency.exponentialRampToValueAtTime(pitch(midi + bend), start + .28);
      }
      env.gain.setValueAtTime(0, start);
      env.gain.linearRampToValueAtTime(amount, start + .008);
      env.gain.exponentialRampToValueAtTime(.001, start + length);
      osc.connect(env).connect(master);
      osc.start(start);
      osc.stop(start + length + .1);
    }
  }
  // Plucked-string strum, low string first. Muted strings are skipped.
  function strum(frets, { gap = .045, level = .22 } = {}) {
    try {
      const start = context().currentTime + .03;
      let offset = 0;
      frets.forEach((fret, index) => {
        if (fret === null) return;
        voice(stringMidi[index] + fret, start + offset, { level });
        offset += gap;
      });
    } catch {}
  }
  // A single fretted note; stringIndex 0 = low E.
  function pluck(stringIndex, fret, options = {}) {
    try {
      voice(stringMidi[stringIndex] + fret, context().currentTime + .02, { level: .3, length: 1.6, ...options, slideFrom: options.slideFrom == null ? null : stringMidi[stringIndex] + options.slideFrom });
    } catch {}
  }

  return { svg, strum, pluck, startFretFor };
})();
