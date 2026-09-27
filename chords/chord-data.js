window.GUITAR_CHORD_DATA = (() => {
  const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const pitchByName = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const naturalPitch = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const qualities = {
    major: { label: 'Major', suffix: '', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5' }], sound: 'Bright and settled. The major third sits four semitones above the root.' },
    minor: { label: 'Minor', suffix: 'm', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 7, label: '5' }], sound: 'The minor third is one semitone lower than the major third; the fifth stays the same.' },
    dominant7: { label: 'Dominant 7', suffix: '7', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5', optional: true }, { degree: 7, semitones: 10, label: 'b7' }], sound: 'A major triad plus a flattened seventh. It commonly pulls toward a chord a fourth above.' },
    major7: { label: 'Major 7', suffix: 'maj7', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5', optional: true }, { degree: 7, semitones: 11, label: '7' }], sound: 'A major triad plus the seventh note of the major scale. The close 7-to-root color is smooth and airy.' },
    minor7: { label: 'Minor 7', suffix: 'm7', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 7, label: '5', optional: true }, { degree: 7, semitones: 10, label: 'b7' }], sound: 'A minor triad with a flattened seventh, often used for a mellow tonic or a ii chord.' },
    sus2: { label: 'Suspended 2', suffix: 'sus2', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 2, semitones: 2, label: '2' }, { degree: 5, semitones: 7, label: '5' }], sound: 'The third is replaced by the second, leaving the chord open and neither clearly major nor minor.' },
    sus4: { label: 'Suspended 4', suffix: 'sus4', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 4, semitones: 5, label: '4' }, { degree: 5, semitones: 7, label: '5' }], sound: 'The third is replaced by the fourth. Resolve the fourth down to the third to hear the suspension release.' },
    diminished: { label: 'Diminished', suffix: 'dim', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 6, label: 'b5' }], sound: 'A minor third and a flattened fifth create a compact, tense sound that wants to move.' },
    augmented: { label: 'Augmented', suffix: 'aug', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 8, label: '#5' }], sound: 'A major third and raised fifth make the chord feel bright and unsettled.' },
    power: { label: 'Power chord', suffix: '5', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 5, semitones: 7, label: '5' }], sound: 'Only the root and fifth. With no third it is neither major nor minor, which keeps it clean under distortion.' },
    major6: { label: 'Major 6', suffix: '6', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5' }, { degree: 6, semitones: 9, label: '6' }], sound: 'A major triad plus the sixth. Sweet and stable, without the pull of a seventh.' },
    minor6: { label: 'Minor 6', suffix: 'm6', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 7, label: '5' }, { degree: 6, semitones: 9, label: '6' }], sound: 'A minor triad plus the major sixth. Dark but slightly bittersweet.' },
    add9: { label: 'Add 9', suffix: 'add9', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5' }, { degree: 9, semitones: 14, label: '9' }], sound: 'A major triad with the ninth added on top and no seventh. Shimmering and open.' },
    dominant9: { label: 'Dominant 9', suffix: '9', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 4, label: '3' }, { degree: 5, semitones: 7, label: '5', optional: true }, { degree: 7, semitones: 10, label: 'b7' }, { degree: 9, semitones: 14, label: '9' }], sound: 'A dominant 7 with the ninth added. The fifth is often left out on guitar.' },
    sus7: { label: '7 sus 4', suffix: '7sus4', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 4, semitones: 5, label: '4' }, { degree: 5, semitones: 7, label: '5' }, { degree: 7, semitones: 10, label: 'b7' }], sound: 'A dominant 7 with the third replaced by the fourth. It delays the resolution of a V chord.' },
    halfDiminished: { label: 'Minor 7 flat 5', suffix: 'm7b5', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 6, label: 'b5' }, { degree: 7, semitones: 10, label: 'b7' }], sound: 'Also called half-diminished (ø). It is the vii chord of a major key and the ii chord of a minor key.' },
    diminished7: { label: 'Diminished 7', suffix: 'dim7', tones: [{ degree: 1, semitones: 0, label: '1' }, { degree: 3, semitones: 3, label: 'b3' }, { degree: 5, semitones: 6, label: 'b5' }, { degree: 7, semitones: 9, label: 'bb7' }], sound: 'Stacked minor thirds. The shape repeats every three frets, so one grip covers four chord names.' }
  };
  const usage = {
    major: 'The home chord of most pop, rock and folk songs. Resolve here to sound finished.',
    minor: 'Sad, serious or reflective. The vi chord in a major key and the home chord of a minor key.',
    dominant7: 'The V chord that pulls home, and the backbone of the 12-bar blues.',
    major7: 'Soft, jazzy or dreamy. Try it as the I or IV chord in a ballad.',
    minor7: 'The ii chord of a ii–V–I, and a relaxed tonic in soul, R&B and funk.',
    sus2: 'Adds air to strummed parts. Swap it with the plain major chord for movement.',
    sus4: 'Play it just before the major chord for a classic suspend-and-release.',
    diminished: 'A passing chord between two chords a whole step apart, or the vii° of a major key.',
    augmented: 'A passing chord from I to IV or I to vi; the raised fifth climbs by a half step.',
    power: 'Rock and metal riffs. Keep the same grip and slide it along the neck.',
    major6: 'Swing, western and surf endings. A gentler substitute for a major chord.',
    minor6: 'Gypsy jazz, bossa nova and film noir; a moody minor tonic.',
    add9: 'Singer-songwriter strumming and worship music. A richer stand-in for a plain major chord.',
    dominant9: 'Funk vamps and blues turnarounds.',
    sus7: 'Soul and gospel V chords, or a vamp that never quite lands.',
    halfDiminished: 'The ii chord before V in a minor key: m7b5 → 7 → minor.',
    diminished7: 'A passing chord a half step below its target, e.g. C#dim7 → Dm.'
  };
  const openShapes = {
    'C:major': { name: 'Open C shape', frets: [null, 3, 2, 0, 1, 0] },
    'G:major': { name: 'Open G shape', frets: [3, 2, 0, 0, 0, 3] },
    'D:major': { name: 'Open D shape', frets: [null, null, 0, 2, 3, 2] },
    'A:major': { name: 'Open A shape', frets: [null, 0, 2, 2, 2, 0] },
    'E:major': { name: 'Open E shape', frets: [0, 2, 2, 1, 0, 0] },
    'A:minor': { name: 'Open Am shape', frets: [null, 0, 2, 2, 1, 0] },
    'E:minor': { name: 'Open Em shape', frets: [0, 2, 2, 0, 0, 0] },
    'D:minor': { name: 'Open Dm shape', frets: [null, null, 0, 2, 3, 1] },
    'C:dominant7': { name: 'Open C7 shape', frets: [null, 3, 2, 3, 1, 0] },
    'D:dominant7': { name: 'Open D7 shape', frets: [null, null, 0, 2, 1, 2] },
    'E:dominant7': { name: 'Open E7 shape', frets: [0, 2, 0, 1, 0, 0] },
    'G:dominant7': { name: 'Open G7 shape', frets: [3, 2, 0, 0, 0, 1] },
    'A:dominant7': { name: 'Open A7 shape', frets: [null, 0, 2, 0, 2, 0] },
    'C:major7': { name: 'Open Cmaj7 shape', frets: [null, 3, 2, 0, 0, 0] },
    'A:major7': { name: 'Open Amaj7 shape', frets: [null, 0, 2, 1, 2, 0] },
    'E:major7': { name: 'Open Emaj7 shape', frets: [0, 2, 1, 1, 0, 0] },
    'A:minor7': { name: 'Open Am7 shape', frets: [null, 0, 2, 0, 1, 0] },
    'E:minor7': { name: 'Open Em7 shape', frets: [0, 2, 0, 0, 0, 0] },
    'D:sus2': { name: 'Open Dsus2 shape', frets: [null, null, 0, 2, 3, 0] },
    'D:sus4': { name: 'Open Dsus4 shape', frets: [null, null, 0, 2, 3, 3] },
    'A:sus4': { name: 'Open Asus4 shape', frets: [null, 0, 2, 2, 3, 0] },
    'E:sus4': { name: 'Open Esus4 shape', frets: [0, 2, 2, 2, 0, 0] },
    'A:sus2': { name: 'Open Asus2 shape', frets: [null, 0, 2, 2, 0, 0] },
    'C:add9': { name: 'Open Cadd9 shape', frets: [null, 3, 2, 0, 3, 0] },
    'G:add9': { name: 'Open Gadd9 shape', frets: [3, 0, 0, 2, 0, 3] },
    'B:dominant7': { name: 'Open B7 shape', frets: [null, 2, 1, 2, 0, 2] },
    'D:minor7': { name: 'Open Dm7 shape', frets: [null, null, 0, 2, 1, 1] },
    'D:major7': { name: 'Open Dmaj7 shape', frets: [null, null, 0, 2, 2, 2] },
    'G:major7': { name: 'Open Gmaj7 shape', frets: [3, 2, 0, 0, 0, 2] },
    'F:major7': { name: 'Open Fmaj7 shape', frets: [null, null, 3, 2, 1, 0] },
    'E:power': { name: 'Open E5 shape', frets: [0, 2, 2, null, null, null] },
    'A:power': { name: 'Open A5 shape', frets: [null, 0, 2, 2, null, null] },
    'D:power': { name: 'Open D5 shape', frets: [null, null, 0, 2, 3, null] },
    'A:major6': { name: 'Open A6 shape', frets: [null, 0, 2, 2, 2, 2] },
    'E:major6': { name: 'Open E6 shape', frets: [0, 2, 2, 1, 2, 0] },
    'A:minor6': { name: 'Open Am6 shape', frets: [null, 0, 2, 2, 1, 2] },
    'E:minor6': { name: 'Open Em6 shape', frets: [0, 2, 2, 0, 2, 0] },
    'A:sus7': { name: 'Open A7sus4 shape', frets: [null, 0, 2, 0, 3, 0] },
    'E:sus7': { name: 'Open E7sus4 shape', frets: [0, 2, 0, 2, 0, 0] },
    'D:sus7': { name: 'Open D7sus4 shape', frets: [null, null, 0, 2, 1, 3] },
    'F:major': { name: 'F barre chord', frets: [1, 3, 3, 2, 1, 1] },
    'F:minor': { name: 'Fm barre chord', frets: [1, 3, 3, 1, 1, 1] },
    'F#:major': { name: 'F# barre chord', frets: [2, 4, 4, 3, 2, 2] },
    'F#:minor': { name: 'F#m barre chord', frets: [2, 4, 4, 2, 2, 2] },
    'G:minor': { name: 'Gm barre chord', frets: [3, 5, 5, 3, 3, 3] },
    'Bb:major': { name: 'Bb barre chord', frets: [null, 1, 3, 3, 3, 1] },
    'Bb:minor': { name: 'Bbm barre chord', frets: [null, 1, 3, 3, 2, 1] },
    'B:major': { name: 'B barre chord', frets: [null, 2, 4, 4, 4, 2] },
    'B:minor': { name: 'Bm barre chord', frets: [null, 2, 4, 4, 3, 2] },
    'C:minor': { name: 'Cm barre chord', frets: [null, 3, 5, 5, 4, 3] },
    'C#:minor': { name: 'C#m barre chord', frets: [null, 4, 6, 6, 5, 4] },
    'C#:major': { name: 'C# barre chord', frets: [null, 4, 6, 6, 6, 4] },
    'Eb:major': { name: 'Eb barre chord', frets: [null, 6, 8, 8, 8, 6] },
    'Ab:major': { name: 'Ab barre chord', frets: [4, 6, 6, 5, 4, 4] },
    'G#:minor': { name: 'G#m barre chord', frets: [4, 6, 6, 4, 4, 4] },
    'Ab:minor': { name: 'Abm barre chord', frets: [4, 6, 6, 4, 4, 4] },
    'Eb:minor': { name: 'Ebm barre chord', frets: [null, 6, 8, 8, 7, 6] }
  };
  const stringPitches = [4, 9, 2, 7, 11, 4];

  function spellTones(root, quality) {
    const rootPitch = pitchByName[root];
    const rootLetter = letters.indexOf(root[0]);
    return qualities[quality].tones.map((tone) => {
      const letter = letters[(rootLetter + tone.degree - 1) % letters.length];
      const targetPitch = (rootPitch + tone.semitones) % 12;
      let accidental = (targetPitch - naturalPitch[letter] + 12) % 12;
      if (accidental > 6) accidental -= 12;
      const mark = accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental);
      return { ...tone, note: `${letter}${mark}`, pitch: targetPitch };
    });
  }

  function findVoicings(root, quality, limit = 3) {
    const tones = qualities[quality].tones;
    const rootPitch = pitchByName[root];
    const chordPitches = new Set(tones.map((tone) => (rootPitch + tone.semitones) % 12));
    const requiredPitches = tones.filter((tone) => !tone.optional).map((tone) => (rootPitch + tone.semitones) % 12);
    const candidates = [];
    function walk(stringIndex, selected) {
      if (stringIndex === stringPitches.length) {
        const sounding = selected.filter((fret) => fret !== null);
        if (sounding.length < Math.max(3, requiredPitches.length)) return;
        const fretted = sounding.filter((fret) => fret > 0);
        if (fretted.length && Math.max(...fretted) - Math.min(...fretted) > 3) return;
        const played = new Set(selected.flatMap((fret, index) => fret === null ? [] : [(stringPitches[index] + fret) % 12]));
        if (!requiredPitches.every((pitch) => played.has(pitch))) return;
        const minFret = fretted.length ? Math.min(...fretted) : 0;
        const maxFret = fretted.length ? Math.max(...fretted) : 0;
        // Four fingers: extra fretted notes only work when the index finger can barre the lowest fret.
        const barreCount = fretted.filter((fret) => fret === minFret).length;
        if (fretted.length - (barreCount > 1 ? barreCount - 1 : 0) > 4) return;
        const firstSounding = selected.findIndex((fret) => fret !== null);
        const lastSounding = selected.length - 1 - [...selected].reverse().findIndex((fret) => fret !== null);
        const innerMutes = selected.slice(firstSounding, lastSounding + 1).filter((fret) => fret === null).length;
        const bassIsRoot = (stringPitches[firstSounding] + selected[firstSounding]) % 12 === rootPitch;
        // Open strings only belong with shapes near the nut.
        if (maxFret >= 5 && sounding.includes(0)) return;
        const score = selected.filter((fret) => fret === null).length * 4 + innerMutes * 9 + (bassIsRoot ? 0 : 7) + sounding.reduce((total, fret) => total + fret * .12, 0) + (maxFret - minFret) * .8;
        candidates.push({ frets: [...selected], minFret, maxFret, score });
        return;
      }
      walk(stringIndex + 1, [...selected, null]);
      for (let fret = 0; fret <= 15; fret += 1) {
        if (!chordPitches.has((stringPitches[stringIndex] + fret) % 12)) continue;
        const nextSelected = [...selected, fret];
        const fretted = nextSelected.filter((value) => value !== null && value > 0);
        if (!fretted.length || Math.max(...fretted) - Math.min(...fretted) <= 4) walk(stringIndex + 1, nextSelected);
      }
    }
    walk(0, []);
    const bands = limit <= 3 ? [[0, 3], [4, 7], [8, 12]] : [[0, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12]];
    const forms = [];
    for (const [low, high] of bands) {
      const match = candidates.filter((candidate) => candidate.minFret >= low && candidate.minFret <= high).sort((a, b) => a.score - b.score)[0];
      if (match && !forms.some((form) => form.frets.join(',') === match.frets.join(','))) forms.push(match);
    }
    return forms.slice(0, limit);
  }

  const sharpNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // Name every note a voicing sounds, spelled to match the chord (Eb rather than D#).
  function voicingNotes(frets, root, quality) {
    const tones = spellTones(root, quality);
    return frets.map((fret, index) => {
      if (fret === null) return null;
      const pitch = (stringPitches[index] + fret) % 12;
      const tone = tones.find((item) => item.pitch === pitch);
      return tone ? { note: tone.note, label: tone.label, isRoot: tone.semitones === 0, pitch } : { note: sharpNames[pitch], label: '', isRoot: false, pitch };
    });
  }

  // Diatonic chords of every major and natural-minor key, used to show where a chord belongs.
  const majorKey = { steps: [0, 2, 4, 5, 7, 9, 11], triads: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'], sevenths: ['major7', 'minor7', 'minor7', 'major7', 'dominant7', 'minor7', 'halfDiminished'], numerals: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] };
  const minorKey = { steps: [0, 2, 3, 5, 7, 8, 10], triads: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'], sevenths: ['minor7', 'halfDiminished', 'major7', 'minor7', 'minor7', 'major7', 'dominant7'], numerals: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] };
  const keyNames = { major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'], minor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'] };
  function rootName(pitch) { return roots[((pitch % 12) + 12) % 12]; }
  function keysContaining(root, quality) {
    const pitch = pitchByName[root];
    const found = [];
    for (const [mode, key] of [['major', majorKey], ['minor', minorKey]]) {
      for (let tonic = 0; tonic < 12; tonic += 1) {
        key.steps.forEach((step, index) => {
          if ((tonic + step) % 12 !== pitch) return;
          if (key.triads[index] !== quality && key.sevenths[index] !== quality) return;
          const numeral = key.sevenths[index] === quality ? `${key.numerals[index].replace('°', 'ø')}7` : key.numerals[index];
          found.push({ key: `${keyNames[mode][tonic]} ${mode}`, keyRoot: rootName(tonic), mode, numeral, degree: index });
        });
      }
    }
    return found;
  }
  function diatonicChord(tonicPitch, mode, degree) {
    const key = mode === 'major' ? majorKey : minorKey;
    return { root: rootName(tonicPitch + key.steps[degree]), quality: key.triads[degree], numeral: key.numerals[degree] };
  }

  return { roots, pitchByName, qualities, usage, openShapes, stringPitches, spellTones, findVoicings, voicingNotes, keysContaining, diatonicChord, rootName };
})();