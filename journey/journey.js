// Journey page: four questions (mood, genre, tempo, level) turned into a complete playing plan.
// Shared helpers (neckSvg, tabSvg, sound, chordModel, wirePlayback, flash, STRING_MIDI, $...) come from ../fretboard.js.

// ---------- questions ----------
const MOODS = [
  { id: 'happy', icon: '☀', label: 'Happy', desc: 'bright, sunny, confident' },
  { id: 'sad', icon: '☂', label: 'Sad', desc: 'melancholic, heartfelt' },
  { id: 'calm', icon: '≈', label: 'Calm', desc: 'peaceful, warm, gentle' },
  { id: 'dreamy', icon: '☁', label: 'Dreamy', desc: 'floating, magical, cinematic' },
  { id: 'hopeful', icon: '↗', label: 'Hopeful', desc: 'bittersweet, cool, soulful' },
  { id: 'epic', icon: '▲', label: 'Epic', desc: 'heroic, driving, huge' },
  { id: 'dark', icon: '☾', label: 'Dark', desc: 'tense, heavy, menacing' },
  { id: 'bluesy', icon: '♪', label: 'Bluesy', desc: 'gritty, swaggering, soulful' },
  { id: 'mysterious', icon: '✦', label: 'Mysterious', desc: 'exotic, ancient, suspenseful' }
];
const GENRES = [
  { id: 'pop', icon: '★', label: 'Pop', desc: 'catchy and modern', tip: 'Pop lives on four-chord loops and a steady, simple rhythm. Leave space for the vocal or the lead line.' },
  { id: 'rock', icon: '⚡', label: 'Rock', desc: 'driving and loud', tip: 'Rock wants energy: down-strokes, light palm muting and, with distortion, power chords.' },
  { id: 'blues', icon: '♭', label: 'Blues', desc: '12 bars, soulful', tip: 'Blues uses dominant 7 chords, a swung rhythm and the blues scale over everything.' },
  { id: 'folk', icon: '♣', label: 'Folk / acoustic', desc: 'campfire, storytelling', tip: 'Open chords ringing, a steady strum or Travis picking, and a melody you could sing.' },
  { id: 'country', icon: '☆', label: 'Country', desc: 'twangy and bright', tip: 'A boom-chick bass-and-strum rhythm, and major pentatonic licks with a bent minor 3rd.' },
  { id: 'jazz', icon: '♯', label: 'Jazz', desc: 'rich and sophisticated', tip: 'Seventh chords and ii–V–I movement. Comp short chords on every beat; aim for chord tones.' },
  { id: 'funk', icon: '✺', label: 'Funk', desc: 'tight groove', tip: 'Rhythm first: a sixteenth-note feel, muted scratches, short stabs, often a two-chord vamp.' },
  { id: 'metal', icon: '◆', label: 'Metal', desc: 'heavy and aggressive', tip: 'Power chords, palm-muted chugs on the low strings, and dark modes like Phrygian and Aeolian.' },
  { id: 'reggae', icon: '◐', label: 'Reggae', desc: 'laid-back offbeat', tip: 'Short, choppy chords on the offbeats only. The bass and drums carry the downbeat.' },
  { id: 'flamenco', icon: '✿', label: 'Spanish / flamenco', desc: 'passionate and fiery', tip: 'The Andalusian cadence and the Phrygian b2 give the Spanish colour. Rumba strum and tremolo picking.' },
  { id: 'ballad', icon: '♡', label: 'Ballad', desc: 'intimate singer-songwriter', tip: 'Slow tempo, arpeggiated chords and space between phrases. Every note can ring.' },
  { id: 'lofi', icon: '☕', label: 'Lo-fi / chill', desc: 'mellow and jazzy', tip: 'Major 7 and minor 7 chords, a lazy swung rhythm and soft picking.' }
];
const TEMPOS = [
  { id: 'slow', icon: '◡', label: 'Slow & gentle', desc: 'around 70 BPM', bpm: 70, tip: 'Slow tempos expose timing. Keep every strum even and let notes ring their full length.' },
  { id: 'medium', icon: '◠', label: 'Mid-tempo groove', desc: 'around 96 BPM', bpm: 96, tip: 'The easiest tempo to groove at. Nod your head on every beat and tap your foot.' },
  { id: 'fast', icon: '»', label: 'Fast & driving', desc: 'around 132 BPM', bpm: 132, tip: 'Learn it slowly first, then raise the metronome by 5 BPM at a time. Relax the picking hand.' }
];
const LEVELS = [
  { id: 'beginner', icon: '1', label: 'Beginner', desc: 'open chords, simple patterns' },
  { id: 'intermediate', icon: '2', label: 'Intermediate', desc: 'barre chords, full scale positions' },
  { id: 'advanced', icon: '3', label: 'Advanced', desc: '7th chords, the whole neck' }
];
const QUESTIONS = [
  { id: 'mood', title: 'What should it feel like?', hint: 'The mood decides the mode: the set of notes everything is built from.', options: MOODS },
  { id: 'genre', title: 'Which style?', hint: 'The genre decides the progression, the rhythm and the picking.', options: GENRES },
  { id: 'tempo', title: 'How fast?', hint: 'You can change the exact tempo later.', options: TEMPOS },
  { id: 'level', title: 'Where are you on guitar?', hint: 'This picks chord shapes and scales you can actually play.', options: LEVELS }
];

// ---------- theory data ----------
const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const MODES = {
  major: { label: 'Major (Ionian)', steps: [0, 2, 4, 5, 7, 9, 11], labels: ['1', '2', '3', '4', '5', '6', '7'], colour: [2], keys: ['G', 'C', 'D', 'A', 'E'], why: 'The major 3rd (<b>3</b>) above the root makes it sound bright and settled.' },
  minor: { label: 'Natural minor (Aeolian)', steps: [0, 2, 3, 5, 7, 8, 10], labels: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], colour: [2, 5], keys: ['A', 'E', 'D', 'B'], why: 'The minor 3rd (<b>b3</b>) and the <b>b6</b> give it its sad, serious weight.' },
  dorian: { label: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10], labels: ['1', '2', 'b3', '4', '5', '6', 'b7'], colour: [5], keys: ['A', 'E', 'D'], why: 'A minor scale with a <b>natural 6</b>: sad and hopeful at the same time. The major IV chord gives it away.' },
  phrygian: { label: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10], labels: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], colour: [1], keys: ['E', 'A', 'B'], why: 'The <b>b2</b>, one fret above the root, makes it dark and tense. It is the metal and Spanish sound.' },
  lydian: { label: 'Lydian', steps: [0, 2, 4, 6, 7, 9, 11], labels: ['1', '2', '3', '#4', '5', '6', '7'], colour: [3], keys: ['D', 'G', 'C', 'A'], why: 'A major scale with a raised <b>#4</b>: it floats instead of settling. Film composers love it.' },
  mixolydian: { label: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10], labels: ['1', '2', '3', '4', '5', '6', 'b7'], colour: [6], keys: ['A', 'E', 'G', 'D'], why: 'A major scale with a <b>b7</b>: happy, with swagger. Classic rock and blues.' },
  harmonicMinor: { label: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11], labels: ['1', '2', 'b3', '4', '5', 'b6', '7'], colour: [5, 6], keys: ['A', 'E', 'D'], why: 'Natural minor with a raised <b>7</b>. The 1½-step gap between <b>b6</b> and <b>7</b> sounds exotic and ancient.' },
  phrygianDominant: { label: 'Phrygian dominant', steps: [0, 1, 4, 5, 7, 8, 10], labels: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], colour: [1, 2], keys: ['E', 'A'], why: 'A <b>b2</b> with a major <b>3</b>: the sound of flamenco and Middle-Eastern music.' }
};
const MOOD_MODE = { happy: 'major', sad: 'minor', calm: 'major', dreamy: 'lydian', hopeful: 'dorian', epic: 'minor', dark: 'phrygian', bluesy: 'mixolydian', mysterious: 'harmonicMinor' };
const MINORISH = ['sad', 'epic', 'dark', 'mysterious', 'hopeful'];

// Solo scales. boxSteps = the pentatonic skeleton used to draw positions for 6-note scales.
const SOLO_SCALES = {
  majorPentatonic: { label: 'Major pentatonic', steps: [0, 2, 4, 7, 9], labels: ['1', '2', '3', '5', '6'], why: 'Five notes with nothing to clash: the easiest way to sound good over major chords.' },
  minorPentatonic: { label: 'Minor pentatonic', steps: [0, 3, 5, 7, 10], labels: ['1', 'b3', '4', '5', 'b7'], why: 'The rock and blues workhorse. Five notes, two per string, almost no wrong notes.' },
  blues: { label: 'Blues scale', steps: [0, 3, 5, 6, 7, 10], labels: ['1', 'b3', '4', 'b5', '5', 'b7'], boxSteps: [0, 3, 5, 7, 10], why: 'Minor pentatonic plus the <b>b5</b> "blue note". Use it as a passing note.' },
  majorBlues: { label: 'Major blues (country)', steps: [0, 2, 3, 4, 7, 9], labels: ['1', '2', 'b3', '3', '5', '6'], boxSteps: [0, 2, 4, 7, 9], why: 'Major pentatonic plus the <b>b3</b>. Slide or bend the b3 up to the 3 for instant country twang.' },
  ...Object.fromEntries(Object.entries(MODES).map(([id, mode]) => [id, { label: mode.label, steps: mode.steps, labels: mode.labels, why: `The full seven-note ${mode.label.toLowerCase()} scale. ${mode.why}` }]))
};
const MODE_SCALES = {
  major: ['majorPentatonic', 'major', 'majorBlues'],
  minor: ['minorPentatonic', 'minor', 'blues'],
  dorian: ['minorPentatonic', 'dorian', 'blues'],
  phrygian: ['phrygian', 'minorPentatonic', 'minor'],
  lydian: ['lydian', 'majorPentatonic', 'major'],
  mixolydian: ['majorPentatonic', 'mixolydian', 'blues', 'minorPentatonic'],
  harmonicMinor: ['harmonicMinor', 'minorPentatonic', 'minor'],
  phrygianDominant: ['phrygianDominant', 'phrygian', 'minorPentatonic']
};

// Progressions use numerals relative to the tonic's major scale (bVII = a whole step below the tonic).
// g = genres/moods it suits best.
const PROGRESSIONS = {
  major: [
    { r: ['I', 'V', 'vi', 'IV'], g: ['pop', 'rock', 'reggae', 'happy'], note: 'The most-used pop loop: home, lift, a touch of sadness, back.' },
    { r: ['I', 'IV', 'I', 'V'], g: ['folk', 'country', 'calm'], note: 'Campfire folk and country: simple and singable.' },
    { r: ['I', 'vi', 'IV', 'V'], g: ['ballad', 'pop', 'calm'], note: 'The 1950s doo-wop / ballad progression.' },
    { r: ['I', 'IV', 'V', 'IV'], g: ['rock', 'reggae', 'blues', 'country'], note: 'Three-chord rock and roll.' },
    { r: ['ii7', 'V7', 'Imaj7', 'vi7'], g: ['jazz', 'lofi'], note: 'The jazz workhorse ii–V–I, with a vi turnaround.' },
    { r: ['Imaj7', 'IVmaj7'], g: ['lofi', 'funk', 'calm'], note: 'A two-chord dreamy vamp.' },
    { r: ['vi', 'IV', 'I', 'V'], g: ['pop', 'rock', 'epic'], note: 'The same chords as I–V–vi–IV, but starting on vi: more emotional.' },
    { r: ['I', 'iii', 'IV', 'V'], g: ['ballad', 'folk'], note: 'A gentle climb up the scale.' }
  ],
  minor: [
    { r: ['i', 'bVI', 'bIII', 'bVII'], g: ['pop', 'ballad', 'folk', 'sad', 'lofi'], note: 'The emotional minor loop heard in countless ballads.' },
    { r: ['i', 'bVII', 'bVI', 'bVII'], g: ['rock', 'metal', 'epic'], note: 'A driving rock and metal descent.' },
    { r: ['bVI', 'bVII', 'i', 'i'], g: ['epic', 'metal', 'rock'], note: 'The "epic" climb into the minor home chord.' },
    { r: ['i', 'iv', 'v', 'i'], g: ['folk', 'ballad', 'sad'], note: 'Pure natural minor: folky and old.' },
    { r: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'V7', 'iv7', 'i7', 'V7'], g: ['blues', 'jazz'], note: 'The 12-bar minor blues.' },
    { r: ['i7', 'iv7', 'bVIImaj7', 'bIIImaj7'], g: ['jazz', 'lofi'], note: 'A lush minor-seventh cycle.' },
    { r: ['i', 'iv', 'bVII', 'bIII'], g: ['pop', 'ballad', 'reggae', 'funk'], note: 'Circle movement that keeps flowing forward.' }
  ],
  dorian: [
    { r: ['i', 'IV'], g: ['funk', 'rock', 'pop', 'reggae', 'hopeful'], note: 'The Dorian vamp. The major IV chord holds the magic natural 6.' },
    { r: ['i7', 'IV7'], g: ['funk', 'jazz', 'lofi'], note: 'Funky seventh-chord vamp.' },
    { r: ['i', 'IV', 'i', 'bVII'], g: ['rock', 'folk', 'ballad'], note: 'Santana-style minor with lift.' },
    { r: ['i', 'bIII', 'IV', 'i'], g: ['pop', 'ballad'], note: 'Climbs to the bright IV and back.' }
  ],
  phrygian: [
    { r: ['i', 'bII'], g: ['metal', 'dark', 'rock'], note: 'The Phrygian half step: menace in two chords.' },
    { r: ['i', 'bII', 'bIII', 'bII'], g: ['metal', 'flamenco', 'rock'], note: 'A creeping, heavy riff progression.' },
    { r: ['i', 'bVI', 'bvii', 'i'], g: ['ballad', 'pop', 'folk'], note: 'Dark but melodic.' }
  ],
  lydian: [
    { r: ['I', 'II'], g: ['pop', 'rock', 'dreamy', 'ballad'], note: 'The Lydian lift: major I to major II, where the #4 lives.' },
    { r: ['Imaj7', 'II', 'vii', 'Imaj7'], g: ['jazz', 'lofi', 'calm'], note: 'Floating and cinematic.' },
    { r: ['I', 'II', 'V', 'I'], g: ['folk', 'country', 'reggae'], note: 'Bright and open, with a cinematic sparkle.' }
  ],
  mixolydian: [
    { r: ['I', 'bVII', 'IV', 'I'], g: ['rock', 'pop', 'folk', 'reggae', 'bluesy'], note: 'Classic rock Mixolydian: the flat-seven chord.' },
    { r: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], g: ['blues', 'jazz', 'country'], note: 'The 12-bar blues, every chord a dominant 7.' },
    { r: ['I', 'v', 'bVII', 'IV'], g: ['pop', 'ballad'], note: 'Laid-back and a little melancholy.' },
    { r: ['I7', 'IV7'], g: ['funk', 'reggae'], note: 'A two-chord groove vamp.' }
  ],
  harmonicMinor: [
    { r: ['i', 'iv', 'V7', 'i'], g: ['folk', 'ballad', 'mysterious', 'pop'], note: 'The raised 7th turns v into a major V7 that pulls hard home.' },
    { r: ['i', 'bVI', 'V7', 'V7'], g: ['metal', 'rock', 'flamenco'], note: 'Neoclassical drama.' },
    { r: ['i', 'ii°', 'V7', 'i'], g: ['jazz', 'lofi'], note: 'Minor ii–V–i.' }
  ],
  phrygianDominant: [
    { r: ['iv', 'bIII', 'bII', 'I'], g: ['flamenco', 'folk', 'ballad'], note: 'The Andalusian cadence (Am–G–F–E in E): the essential Spanish sound.' },
    { r: ['I', 'bII', 'I', 'bII'], g: ['flamenco', 'metal'], note: 'The Phrygian dominant vamp.' },
    { r: ['I', 'bII', 'bIII', 'bII'], g: ['flamenco', 'rock'], note: 'A climbing flamenco riff.' }
  ]
};

const STRUMS = {
  pop: { name: 'Pop strum', slots: ['D', null, 'D', 'U', null, 'U', 'D', 'U'], tip: 'The "old faithful" pattern: D · D U · U D U. Accent beats 2 and 4 slightly.' },
  folk: { name: 'Folk strum', slots: ['D', null, 'D', 'U', 'D', null, 'D', 'U'], tip: 'Even and bouncy. Let the open strings ring.' },
  ballad: { name: 'Slow ballad', slots: ['D', null, null, null, 'D', null, 'D', 'U'], tip: 'Let the first strum ring for two whole beats. Space is what makes a ballad feel slow.' },
  rock: { name: 'Driving eighths', slots: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], tip: 'All down-strokes, lightly palm-muted. Lift the mute on beat 1 of each new chord for a punch.' },
  country: { name: 'Boom-chick', slots: ['B', null, 'D', 'U', 'A', null, 'D', 'U'], tip: 'Pick the root (B) on beat 1 and an alternate bass note (A) on beat 3, strum the upper strings in between.' },
  blues: { name: 'Shuffle', slots: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'], swing: true, tip: 'Swing every pair: long–short, long–short ("daa-da daa-da").' },
  jazz: { name: 'Four to the floor', slots: ['D', null, 'D', null, 'D', null, 'D', null], short: true, tip: 'Short, even strums on every beat. Release the fretting pressure right after each strum.' },
  funk: { name: 'Funk scratch', slots: ['D', 'x', 'U', 'x', 'D', 'U', 'x', 'U'], short: true, tip: 'The hand never stops. "x" = relax the fretting hand for a muted scratch.' },
  metal: { name: 'Palm-muted chug', slots: ['D', 'D', 'D', 'D', 'D', 'D', null, 'D'], mute: true, tip: 'Down-picks on the low strings with a heavy palm mute. The gap on beat 4 makes it breathe.' },
  reggae: { name: 'Offbeat skank', slots: [null, 'U', null, 'U', null, 'U', null, 'U'], short: true, tip: 'Only the "&"s, short and choppy on the top strings. Mute straight after each chop.' },
  flamenco: { name: 'Rumba strum', slots: ['D', null, 'D', 'U', 'x', 'U', 'D', 'U'], tip: 'Rumba flamenca: strum, then slap the strings with the palm on beat 3 (x).' },
  lofi: { name: 'Lazy half-time', slots: ['D', null, null, 'U', null, 'U', null, null], swing: true, tip: 'Soft and slightly behind the beat. Let chords ring into each other.' }
};
const GENRE_STRUMS = { pop: ['pop', 'folk', 'ballad'], rock: ['rock', 'pop'], blues: ['blues', 'rock'], folk: ['folk', 'pop', 'country'], country: ['country', 'folk'], jazz: ['jazz', 'lofi'], funk: ['funk', 'pop'], metal: ['metal', 'rock'], reggae: ['reggae', 'pop'], flamenco: ['flamenco', 'folk'], ballad: ['ballad', 'pop'], lofi: ['lofi', 'ballad'] };

// Picking roles: B = bass (root string), A = alternate bass, G/b/e = the three treble strings. Arrays = pinch.
const PICKS = {
  arpeggio: { name: 'Rolling arpeggio', seq: ['B', 'G', 'b', 'e', 'b', 'G', 'b', 'G'], fingers: 'p i m a m i m i', tip: 'Thumb on the bass, then roll up and back through the top three strings. Let everything ring.' },
  travis: { name: 'Travis picking', seq: [['B', 'e'], 'b', 'A', 'G', 'B', 'b', 'A', 'G'], fingers: 'p+a m p i p m p i', tip: 'The thumb alternates root and another bass string on every beat; the fingers fill in the "&"s.' },
  pinch: { name: 'Pinch & roll', seq: [['B', 'e'], 'G', 'b', 'G', ['A', 'b'], 'G', 'b', 'G'], fingers: 'p+a i m i p+m i m i', tip: 'Pluck bass and treble together (a pinch) on beats 1 and 3.' },
  ballad: { name: 'Up-and-down ballad', seq: ['B', 'G', 'b', 'e', 'A', 'G', 'b', 'G'], fingers: 'p i m a p i m i', tip: 'Two rolls per bar, the second from the alternate bass. Slow and even.' },
  power: { name: 'Alternate-picked arpeggio', seq: ['B', 'A', 'G', 'A', 'B', 'A', 'G', 'A'], fingers: '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑', tip: 'With a pick: strict down–up alternate picking. Mute unused strings with the side of the hand.' },
  chug: { name: 'Chug & accent', seq: ['B', 'B', 'B', ['B', 'A', 'G'], 'B', 'B', ['B', 'A', 'G'], 'B'], fingers: '↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓', tip: 'Palm-muted root notes, with open accents where the full chord rings.' },
  boogie: { name: 'Bass & stab', seq: ['B', 'B', ['G', 'b', 'e'], 'B', 'A', 'A', ['G', 'b', 'e'], 'A'], fingers: 'p p i+m+a p p p i+m+a p', tip: 'Walking bass on the low strings, short chord stabs from the fingers. Swing it.' },
  comp: { name: 'Bass & comp', seq: ['B', ['stop'], ['G', 'b', 'e'], ['stop'], 'A', ['stop'], ['G', 'b', 'e'], ['stop']], fingers: 'p · i+m+a · p · i+m+a ·', tip: 'Jazz-style: thumb plays a bass note, fingers answer with a short chord on beats 2 and 4.' },
  offbeat: { name: 'Offbeat chops', seq: [['stop'], ['G', 'b', 'e'], ['stop'], ['G', 'b', 'e'], ['stop'], ['G', 'b', 'e'], ['stop'], ['G', 'b', 'e']], fingers: '· i+m+a · i+m+a · i+m+a · i+m+a', tip: 'Pluck the top three strings together on every "&" and damp them straight away.' },
  tremolo: { name: 'p–a–m–i tremolo', seq: ['B', 'e', 'e', 'e', 'A', 'e', 'e', 'e'], fingers: 'p a m i p a m i', tip: 'Classical/flamenco tremolo: thumb on the bass, then ring–middle–index on the same treble string.' },
  funk: { name: 'Single-string funk', seq: ['b', ['stop'], 'b', 'G', ['stop'], 'b', 'G', 'b'], fingers: '↓ · ↓ ↑ · ↑ ↓ ↑', tip: 'Short, staccato notes on the top strings. Keep the pick hand moving in sixteenths.' }
};
const GENRE_PICKS = { pop: ['arpeggio', 'pinch'], rock: ['power', 'arpeggio'], blues: ['boogie', 'travis'], folk: ['travis', 'arpeggio'], country: ['travis', 'pinch'], jazz: ['comp', 'arpeggio'], funk: ['funk', 'comp'], metal: ['chug', 'power'], reggae: ['offbeat', 'arpeggio'], flamenco: ['tremolo', 'arpeggio'], ballad: ['ballad', 'arpeggio'], lofi: ['pinch', 'ballad'] };

// ---------- state ----------
const state = { answers: {}, step: 0, root: null, bpm: 96, prog: 0, voicing: 'auto', strum: 0, pick: 0, scale: null, pos: null, labels: 'note', arp: 0, seed: 1 };
let plan = null;
const optionsFor = (question) => QUESTIONS.find((item) => item.id === question).options;
const answerOf = (question) => optionsFor(question).find((option) => option.id === state.answers[question]);

// ---------- helpers ----------
const pcOfName = (name) => chordModel.pitchByName[name];
const rootNameOf = (pc) => chordModel.roots[((pc % 12) + 12) % 12];
function spellSteps(rootName, steps, labels) {
  const rootPc = pcOfName(rootName);
  const letter = LETTERS.indexOf(rootName[0]);
  return steps.map((step, index) => {
    const degree = Number(labels[index].replace(/[b#]/g, ''));
    const natural = LETTERS[(letter + degree - 1) % 7];
    const pitch = (rootPc + step) % 12;
    let accidental = (pitch - NATURAL[natural] + 12) % 12;
    if (accidental > 6) accidental -= 12;
    return { note: natural + (accidental > 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental)), label: labels[index], pitch, step };
  });
}
const pretty = (text) => text.replace(/([A-G])b/g, '$1♭');
function rng(seed) {
  let value = seed >>> 0;
  return () => { value = (value + 0x6D2B79F5) >>> 0; let t = value; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function parseNumeral(text) {
  const match = text.match(/^([b#]*)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/);
  const accidental = [...match[1]].reduce((total, sign) => total + (sign === '#' ? 1 : -1), 0);
  const upper = match[2] === match[2].toUpperCase();
  const degree = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].indexOf(match[2].toUpperCase());
  const suffix = match[3];
  let quality = upper ? 'major' : 'minor';
  if (suffix === '°') quality = 'diminished';
  else if (suffix === 'maj7') quality = 'major7';
  else if (suffix === '7') quality = upper ? 'dominant7' : 'minor7';
  return { offset: (MAJOR_OFFSETS[degree] + accidental + 12) % 12, quality, numeral: text };
}
function colourise(quality, offset, modeId) {
  if (quality === 'major') return offset === 7 || (offset === 0 && modeId === 'mixolydian') ? 'dominant7' : 'major7';
  if (quality === 'minor') return 'minor7';
  if (quality === 'diminished') return 'halfDiminished';
  return quality;
}
function simplify(quality) {
  return { major7: 'major', minor7: 'minor', halfDiminished: 'diminished' }[quality] ?? quality;
}
const voicingCache = new Map();
function voicings(rootName, quality) {
  const id = `${rootName}:${quality}`;
  if (!voicingCache.has(id)) voicingCache.set(id, chordModel.findVoicings(rootName, quality, 6));
  return voicingCache.get(id);
}
function chooseVoicing(rootName, quality, preference, anchor) {
  const open = chordModel.openShapes[`${rootName}:${quality}`]?.frets;
  const forms = voicings(rootName, quality);
  const nearest = (list) => [...list].sort((a, b) => Math.abs(a.minFret - anchor) - Math.abs(b.minFret - anchor))[0];
  if (preference === 'open') {
    if (open) return { frets: open, kind: 'open shape' };
    const low = forms.filter((form) => form.minFret <= 5);
    const pick = low.length ? low.sort((a, b) => a.score - b.score)[0] : forms[0];
    return pick ? { frets: pick.frets, kind: pick.minFret > 1 ? `barre · fret ${pick.minFret}` : 'first position' } : null;
  }
  const movable = forms.filter((form) => form.minFret >= 1 && !form.frets.includes(0));
  const pick = nearest(movable.length ? movable : forms);
  return pick ? { frets: pick.frets, kind: `movable · fret ${pick.minFret}` } : (open ? { frets: open, kind: 'open shape' } : null);
}

// Hand-position box: walk up the scale N notes per string (2 for 5/6-note skeletons, 3 for 7-note scales).
function positionBox(rootPc, steps, index) {
  const perString = steps.length === 7 ? 3 : 2;
  let startFret = (rootPc - 4 + 12) % 12 + steps[index];
  if (startFret > 12) startFret -= 12;
  const pitches = new Set(steps.map((step) => (rootPc + step) % 12));
  const cells = [];
  let midi = STRING_MIDI[0] + startFret;
  for (let string = 0; string < 6; string += 1) {
    let placed = 0;
    while (placed < perString) {
      const fret = midi - STRING_MIDI[string];
      if (pitches.has(midi % 12) && fret >= 0) { cells.push({ s: string, f: fret, midi }); placed += 1; }
      midi += 1;
      if (midi - STRING_MIDI[string] > MAX_FRET + 2) break;
    }
  }
  const frets = cells.map((cell) => cell.f);
  return { cells, min: Math.min(...frets), max: Math.max(...frets) };
}
// A position with the scale's extra notes (blue note, b3...) added where they fall inside it.
function fullBox(rootPc, scale, index) {
  const skeleton = positionBox(rootPc, scale.boxSteps ?? scale.steps, index);
  if (!scale.boxSteps) return skeleton;
  const extras = scale.steps.filter((step) => !scale.boxSteps.includes(step)).map((step) => (rootPc + step) % 12);
  const cells = [...skeleton.cells];
  for (let string = 0; string < 6; string += 1) for (let fret = skeleton.min; fret <= skeleton.max; fret += 1) {
    if (extras.includes(pitchAt(string, fret))) cells.push({ s: string, f: fret, midi: STRING_MIDI[string] + fret, extra: true });
  }
  return { ...skeleton, cells };
}

// ---------- plan ----------
function resolveMode(mood, genre) {
  if (genre === 'blues') return MINORISH.includes(mood) ? 'minor' : 'mixolydian';
  if (genre === 'flamenco' && MINORISH.includes(mood)) return 'phrygianDominant';
  if (genre === 'funk' && ['sad', 'hopeful', 'dark', 'mysterious'].includes(mood)) return 'dorian';
  if (genre === 'metal' && mood === 'sad') return 'minor';
  return MOOD_MODE[mood];
}
function rankedProgressions(modeId, mood, genre) {
  return PROGRESSIONS[modeId].map((prog, index) => ({ ...prog, score: (prog.g.includes(genre) ? 4 : 0) + (prog.g.includes(mood) ? 2 : 0) - index * .01 })).sort((a, b) => b.score - a.score);
}
function keyCandidates(modeId, genre) {
  const keys = [...MODES[modeId].keys];
  const prefer = genre === 'metal' ? ['E', 'A'] : genre === 'blues' ? ['E', 'A'] : genre === 'jazz' || genre === 'lofi' ? ['C', 'F', 'D'] : [];
  return [...prefer.filter((name) => keys.includes(name)), ...keys.filter((name) => !prefer.includes(name))];
}
function chordsFor(prog, rootPc, modeId, anchor) {
  const { genre, level } = state.answers;
  const preference = state.voicing === 'open' ? 'open' : state.voicing === 'barre' ? 'barre' : state.voicing === 'color' ? (level === 'beginner' ? 'open' : 'barre') : level === 'advanced' ? 'barre' : 'open';
  return prog.r.map((numeral) => {
    const parsed = parseNumeral(numeral);
    let quality = parsed.quality;
    if (genre === 'metal') quality = 'power';
    else if (state.voicing === 'color' || (state.voicing === 'auto' && level === 'advanced')) quality = colourise(quality, parsed.offset, modeId);
    else if (state.voicing === 'auto' && level === 'beginner' && !chordModel.openShapes[`${rootNameOf(rootPc + parsed.offset)}:${quality}`]) quality = simplify(quality);
    const rootName = rootNameOf(rootPc + parsed.offset);
    const voicing = chooseVoicing(rootName, quality, preference, anchor) ?? { frets: [null, null, null, null, null, null], kind: 'no shape found' };
    return { numeral, pc: (rootPc + parsed.offset) % 12, rootName, quality, name: pretty(rootName + chordModel.qualities[quality].suffix), frets: voicing.frets, kind: voicing.kind };
  });
}
function recommendedPosition(rootPc, scale) {
  const count = (scale.boxSteps ?? scale.steps).length;
  const boxes = Array.from({ length: count }, (_, index) => positionBox(rootPc, scale.boxSteps ?? scale.steps, index));
  if (boxes[0].min <= 9) return 0;
  return boxes.reduce((best, box, index) => (box.min < boxes[best].min ? index : best), 0);
}
function buildPlan() {
  const { mood, genre, level } = state.answers;
  const modeId = resolveMode(mood, genre);
  const progressions = rankedProgressions(modeId, mood, genre);
  const scales = [...MODE_SCALES[modeId]];
  if ((genre === 'blues' || genre === 'rock') && scales.includes('blues')) scales.sort((a, b) => (b === 'blues') - (a === 'blues'));
  if (genre === 'country' && scales.includes('majorBlues')) scales.sort((a, b) => (b === 'majorBlues') - (a === 'majorBlues'));
  if (level !== 'beginner' && ['phrygian', 'lydian', 'harmonicMinor', 'phrygianDominant', 'dorian'].includes(modeId)) scales.sort((a, b) => (b === modeId) - (a === modeId));
  if (!state.scale || !scales.includes(state.scale)) state.scale = scales[0];
  const rootPc = pcOfName(state.root);
  const scale = SOLO_SCALES[state.scale];
  const count = (scale.boxSteps ?? scale.steps).length;
  const recommended = recommendedPosition(rootPc, scale);
  if (state.pos === null || state.pos >= count) state.pos = recommended;
  const box = fullBox(rootPc, scale, state.pos);
  const anchor = positionBox(rootPc, scale.boxSteps ?? scale.steps, recommended).min;
  const prog = progressions[state.prog] ?? progressions[0];
  const chords = chordsFor(prog, rootPc, modeId, Math.max(1, anchor));
  const strums = GENRE_STRUMS[genre];
  const picks = GENRE_PICKS[genre];
  return { modeId, mode: MODES[modeId], progressions, prog, chords, scales, scale, rootPc, count, recommended, box, anchor, strums, picks };
}
function chooseKey() {
  const { genre, level } = state.answers;
  const modeId = resolveMode(state.answers.mood, genre);
  const candidates = keyCandidates(modeId, genre);
  if (level !== 'beginner') return candidates[0];
  const prog = rankedProgressions(modeId, state.answers.mood, genre)[0];
  const openCount = (rootName) => prog.r.map(parseNumeral).filter((chord) => chordModel.openShapes[`${rootNameOf(pcOfName(rootName) + chord.offset)}:${genre === 'metal' ? 'power' : simplify(chord.quality)}`]).length;
  return candidates.reduce((best, name) => (openCount(name) > openCount(best) ? name : best), candidates[0]);
}

// ---------- playback ----------
let timers = [];
function stopAll() {
  timers.forEach(clearTimeout);
  timers = [];
  document.querySelectorAll('.journey-page .is-playing, .journey-page .is-now').forEach((item) => item.classList.remove('is-playing', 'is-now'));
}
function later(time, fn) { timers.push(setTimeout(fn, time)); }
function glow(element, time, length, cls = 'is-now') {
  if (!element) return;
  later(time, () => element.classList.add(cls));
  later(time + Math.max(60, length - 20), () => element.classList.remove(cls));
}
const beatMs = () => 60000 / state.bpm;
const playedStrings = (frets) => frets.map((fret, string) => (fret === null ? null : string)).filter((string) => string !== null);
function roleString(frets, role) {
  const played = playedStrings(frets);
  const bass = played[0];
  if (role === 'B') return bass;
  if (role === 'A') return played.find((string) => string > bass && string <= 3) ?? played[1] ?? bass;
  const target = { G: 3, b: 4, e: 5 }[role];
  if (frets[target] !== null && frets[target] !== undefined) return target;
  return played.reduce((best, string) => (Math.abs(string - target) < Math.abs(best - target) ? string : best), played.at(-1));
}
function strike(frets, kind, { short = false, mute = false, level = .14 } = {}) {
  const played = playedStrings(frets);
  if (!played.length) return;
  const length = short || mute ? .16 : 1.5;
  if (kind === 'x') { played.filter((string) => string >= 2 && string <= 4).forEach((string, index) => later(index * 7, () => sound.pluck(string, frets[string], { level: .06, length: .035 }))); return; }
  let strings = played;
  if (kind === 'D' && mute) strings = played.slice(0, 3);
  if (kind === 'U') strings = played.filter((string) => string >= 2).reverse();
  if (kind === 'B') strings = [roleString(frets, 'B')];
  if (kind === 'A') strings = [roleString(frets, 'A')];
  const single = kind === 'B' || kind === 'A';
  strings.forEach((string, index) => later(index * 13, () => sound.pluck(string, frets[string], { level: single ? .3 : level, length })));
}
function slotTime(index, beat, swing) { return index * beat / 2 + (swing && index % 2 ? beat / 6 : 0); }

function playChords(mode) {
  stopAll();
  const beat = beatMs();
  const strum = STRUMS[plan.strums[state.strum] ?? plan.strums[0]];
  const pick = PICKS[plan.picks[state.pick] ?? plan.picks[0]];
  const repeats = plan.chords.length <= 2 ? 2 : 1;
  const bars = Array.from({ length: plan.chords.length * repeats }, (_, index) => index % plan.chords.length);
  bars.forEach((chordIndex, bar) => {
    const chord = plan.chords[chordIndex];
    const start = bar * beat * 4;
    document.querySelectorAll(`[data-bar="${chordIndex}"]`).forEach((element) => glow(element, start, beat * 4));
    if (mode === 'chords') { later(start, () => strike(chord.frets, 'D')); later(start + beat * 2, () => strike(chord.frets, 'D', { level: .1 })); }
    if (mode === 'strum') strum.slots.forEach((kind, index) => {
      const time = start + slotTime(index, beat, strum.swing);
      glow(document.querySelector(`#strumGrid [data-slot="${index}"]`), time, beat / 2, 'is-playing');
      if (kind) later(time, () => strike(chord.frets, kind, strum));
    });
    if (mode === 'pick') pick.seq.forEach((roles, index) => {
      const time = start + slotTime(index, beat, state.answers.genre === 'blues');
      glow(document.querySelector(`#pickTab [data-index="${chordIndex * 10 + index + 1}"]`), time, beat / 2, 'is-playing');
      const list = Array.isArray(roles) ? roles : [roles];
      if (list[0] === 'stop') return;
      later(time, () => list.forEach((role) => { const string = roleString(chord.frets, role); sound.pluck(string, chord.frets[string], { level: .28, length: 1.3 }); }));
    });
  });
}

// ---------- quiz ----------
function renderQuiz() {
  const question = QUESTIONS[state.step];
  $('#quizProgress').innerHTML = QUESTIONS.map((item, index) => `<button type="button" class="${index === state.step ? 'is-current' : ''}${state.answers[item.id] ? ' is-done' : ''}" data-goto="${index}" ${index > Object.keys(state.answers).length ? 'disabled' : ''}><b>${index + 1}</b>${item.id}${state.answers[item.id] ? ` · ${answerOf(item.id).label}` : ''}</button>`).join('');
  $('#quizBody').innerHTML = `<h2>${question.title}</h2><p class="quiz-hint">${question.hint}</p><div class="quiz-options quiz-${question.id}">${question.options.map((option) => `<button type="button" class="quiz-option${state.answers[question.id] === option.id ? ' is-selected' : ''}" data-answer="${option.id}"><span class="qo-icon" aria-hidden="true">${option.icon}</span><b>${option.label}</b><small>${option.desc}</small></button>`).join('')}</div>`;
  $('#quizBack').disabled = state.step === 0;
}
function finishQuiz(scroll = true) {
  state.root = chooseKey();
  state.bpm = answerOf('tempo').bpm;
  if (state.answers.genre === 'ballad' || state.answers.genre === 'lofi') state.bpm = Math.min(state.bpm, 84);
  Object.assign(state, { prog: 0, voicing: 'auto', strum: 0, pick: 0, scale: null, pos: null, arp: 0, seed: 1 });
  history.replaceState(null, '', `?${new URLSearchParams(state.answers)}`);
  $('#quiz').hidden = true;
  $('#results').hidden = false;
  renderAll();
  if (scroll) $('#results').scrollIntoView({ behavior: 'smooth' });
}
$('#quiz').addEventListener('click', (event) => {
  const option = event.target.closest('[data-answer]');
  const goto = event.target.closest('[data-goto]');
  if (goto) { state.step = Number(goto.dataset.goto); renderQuiz(); return; }
  if (!option) return;
  state.answers[QUESTIONS[state.step].id] = option.dataset.answer;
  if (state.step < QUESTIONS.length - 1) { state.step += 1; renderQuiz(); } else finishQuiz();
});
$('#quizBack').addEventListener('click', () => { state.step = Math.max(0, state.step - 1); renderQuiz(); });
$('#quizRandom').addEventListener('click', () => {
  QUESTIONS.forEach((question) => { state.answers[question.id] = question.options[Math.floor(Math.random() * question.options.length)].id; });
  finishQuiz();
});
$('#restart').addEventListener('click', () => {
  stopAll();
  state.step = 0;
  $('#results').hidden = true;
  $('#quiz').hidden = false;
  renderQuiz();
  $('#quiz').scrollIntoView({ behavior: 'smooth' });
});

// ---------- 01 sound ----------
function modeStripSvg() {
  const W = 50, H = 34;
  const names = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
  const spelled = spellSteps(state.root, plan.mode.steps, plan.mode.labels);
  const colourSteps = plan.mode.colour.map((index) => plan.mode.steps[index]);
  const row = (steps, y, title, withNames) => `<text x="0" y="${y - 8}" class="ms-title">${title}</text>` + names.map((name, semitone) => {
    const on = steps.includes(semitone);
    const colour = withNames && colourSteps.includes(semitone);
    const note = withNames && on ? spelled.find((item) => item.step === semitone)?.note : '';
    return `<g class="ms-cell${on ? ' is-on' : ''}${colour ? ' is-colour' : ''}${semitone === 0 ? ' is-root' : ''}"><rect x="${semitone * W + 1}" y="${y}" width="${W - 4}" height="${H}" rx="5"/><text x="${semitone * W + W / 2 - 1}" y="${y + 22}">${on ? name : '·'}</text>${note ? `<text x="${semitone * W + W / 2 - 1}" y="${y + H + 16}" class="ms-note">${pretty(note)}</text>` : ''}</g>`;
  }).join('');
  return `<svg class="j-svg" viewBox="0 0 ${12 * W} ${2 * H + 88}" role="img" aria-label="${plan.mode.label} compared with the major scale">${row(MODES.major.steps, 22, 'MAJOR SCALE (REFERENCE)', false)}${row(plan.mode.steps, H + 58, `YOUR MODE: ${pretty(state.root)} ${plan.mode.label.toUpperCase()}`, true)}</svg>`;
}
function renderSound() {
  const mood = answerOf('mood'), genre = answerOf('genre'), tempo = answerOf('tempo'), level = answerOf('level');
  $('#soundTitle').innerHTML = `${pretty(state.root)} ${plan.mode.label}`;
  $('#soundLead').innerHTML = `${mood.label} + ${genre.label} → <b>${pretty(state.root)} ${plan.mode.label.toLowerCase()}</b> at <b>${state.bpm} BPM</b>, with shapes for ${level.id === 'intermediate' || level.id === 'advanced' ? 'an' : 'a'} ${level.label.toLowerCase()} player.`;
  $('#keySelect').innerHTML = chordModel.roots.map((name) => `<option value="${name}"${keyCandidates(plan.modeId, state.answers.genre).includes(name) ? ' class="is-suggested"' : ''}>${pretty(name)}${keyCandidates(plan.modeId, state.answers.genre).includes(name) ? ' ★' : ''}</option>`).join('');
  $('#keySelect').value = state.root;
  const tempos = [...new Set([60, 70, 80, 84, 90, 96, 100, 110, 120, 132, 140, 160, state.bpm])].sort((a, b) => a - b);
  $('#tempoSelect').innerHTML = tempos.map((bpm) => `<option value="${bpm}">${bpm} BPM</option>`).join('');
  $('#tempoSelect').value = state.bpm;
  $('#answerCard').innerHTML = `<p class="eyebrow">YOUR ANSWERS</p><ul>${[mood, genre, tempo, level].map((item, index) => `<li><span aria-hidden="true">${item.icon}</span><div><small>${QUESTIONS[index].id}</small><b>${item.label}</b></div><button type="button" data-change="${index}">change</button></li>`).join('')}</ul><p class="sound-keys">Good keys for this sound: ${keyCandidates(plan.modeId, state.answers.genre).map((name) => `<button type="button" data-key="${name}" class="${name === state.root ? 'is-selected' : ''}">${pretty(name)}</button>`).join('')}</p>`;
  $('#modeStrip').innerHTML = modeStripSvg();
  $('#modeCaption').innerHTML = `<b>Why it sounds ${mood.label.toLowerCase()}:</b> ${plan.mode.why} The highlighted notes (coral) are the "colour notes" that separate this mode from the major scale.`;
  $('#soundFacts').innerHTML = `<article><h3>${genre.label} flavour</h3><p>${genre.tip}</p></article><article><h3>${tempo.label} · ${state.bpm} BPM</h3><p>${tempo.tip}</p></article><article><h3>How this page works</h3><p>Everything below is built from these choices. Change the key, tempo, progression, shapes or scale at any time and every diagram, tab and sound updates.</p></article>`;
}
$('#answerCard').addEventListener('click', (event) => {
  const change = event.target.closest('[data-change]');
  const keyButton = event.target.closest('[data-key]');
  if (change) { stopAll(); state.step = Number(change.dataset.change); $('#results').hidden = true; $('#quiz').hidden = false; renderQuiz(); $('#quiz').scrollIntoView({ behavior: 'smooth' }); }
  if (keyButton) { state.root = keyButton.dataset.key; state.pos = null; renderAll(); }
});
$('#keySelect').addEventListener('change', (event) => { state.root = event.target.value; state.pos = null; renderAll(); });
$('#tempoSelect').addEventListener('change', (event) => { state.bpm = Number(event.target.value); stopAll(); });

// ---------- 02 chords ----------
const detailUrl = (chord) => `../chords/detail.html?root=${encodeURIComponent(chord.rootName)}&quality=${chord.quality}`;
function chordBoxSvg(chord) {
  return sound.svg(chord.frets, chordModel.voicingNotes(chord.frets, chord.rootName, chord.quality), { title: chord.name });
}
function renderChords() {
  $('#progSelect').innerHTML = plan.progressions.map((prog, index) => `<option value="${index}">${prog.r.join(' – ')}${index === 0 ? ' ★' : ''}</option>`).join('');
  $('#progSelect').value = state.prog;
  $('#voicingSelect').value = state.voicing;
  $('#progNote').innerHTML = `<b>${plan.prog.r.join(' – ')}</b> = ${plan.chords.map((chord) => chord.name).join(' – ')}. ${plan.prog.note}`;
  $('#chordChips').innerHTML = plan.chords.map((chord, index) => `<a class="j-chip" data-bar="${index}" href="${detailUrl(chord)}"><span class="j-chip-num">${index + 1} · ${chord.numeral}</span>${chordBoxSvg(chord)}<b>${chord.name}</b><small>${chord.kind}</small></a>`).join('');
  $('#progAlts').innerHTML = plan.progressions.map((prog, index) => {
    if (index === state.prog) return '';
    const chords = prog.r.map((numeral) => { const parsed = parseNumeral(numeral); return pretty(rootNameOf(plan.rootPc + parsed.offset) + chordModel.qualities[parsed.quality].suffix); });
    return `<article class="alt-card"><h3>${prog.r.join(' – ')}</h3><p class="alt-chords">${chords.join(' – ')}</p><p>${prog.note}</p><button type="button" class="hear-button" data-prog="${index}">Use this progression</button></article>`;
  }).join('');
}
$('#progSelect').addEventListener('change', (event) => { state.prog = Number(event.target.value); state.arp = 0; renderAll(); });
$('#voicingSelect').addEventListener('change', (event) => { state.voicing = event.target.value; renderAll(); });
$('#progAlts').addEventListener('click', (event) => {
  const button = event.target.closest('[data-prog]');
  if (!button) return;
  state.prog = Number(button.dataset.prog);
  state.arp = 0;
  renderAll();
  $('#chords').scrollIntoView({ behavior: 'smooth' });
});

// ---------- 03 strumming ----------
function renderStrum() {
  $('#strumSelect').innerHTML = plan.strums.map((id, index) => `<option value="${index}">${STRUMS[id].name}${index === 0 ? ' ★' : ''}</option>`).join('') ;
  $('#strumSelect').value = state.strum;
  const strum = STRUMS[plan.strums[state.strum]];
  $('#strumTitle').textContent = strum.name;
  const W = 72, counts = ['1', '&', '2', '&', '3', '&', '4', '&'];
  const glyph = { D: '↓', U: '↑', B: 'B', A: 'A', x: '×' };
  const cells = strum.slots.map((kind, index) => `<g class="sg-cell${kind ? ` is-${kind}` : ''}${index % 2 ? ' is-off' : ''}" data-slot="${index}"><rect x="${index * W + 2}" y="26" width="${W - 6}" height="74" rx="8"/><text x="${index * W + W / 2 - 1}" y="18" class="sg-count">${counts[index]}</text><text x="${index * W + W / 2 - 1}" y="72" class="sg-glyph">${kind ? glyph[kind] : '·'}</text></g>`).join('');
  $('#strumGrid').innerHTML = `<svg class="j-svg strum-svg" viewBox="0 0 ${8 * W} 110" role="img" aria-label="${strum.name} strum pattern">${cells}</svg>`;
  $('#strumTip').innerHTML = `<b>${strum.name}${strum.swing ? ' (swung)' : ''}.</b> ${strum.tip} <span class="sg-legend">↓ down · ↑ up · B bass note · A alternate bass · × muted scratch · · miss the strings but keep moving</span>`;
}
$('#strumSelect').addEventListener('change', (event) => { state.strum = Number(event.target.value); stopAll(); renderStrum(); });

// ---------- 04 picking ----------
function pickItems(pick) {
  const items = [];
  plan.chords.forEach((chord, bar) => {
    items.push({ chord: chord.name });
    pick.seq.forEach((roles) => {
      const list = Array.isArray(roles) ? roles : [roles];
      if (list[0] === 'stop') { items.push(['stack', [], .5]); return; }
      const pairs = [...new Set(list.map((role) => roleString(chord.frets, role)))].map((string) => [string, chord.frets[string]]);
      items.push(pairs.length === 1 ? [pairs[0][0], pairs[0][1], .5] : ['stack', pairs, .5]);
    });
    if (bar < plan.chords.length - 1) items.push('|');
  });
  return items;
}
function renderPick() {
  $('#pickSelect').innerHTML = plan.picks.map((id, index) => `<option value="${index}">${PICKS[id].name}${index === 0 ? ' ★' : ''}</option>`).join('');
  $('#pickSelect').value = state.pick;
  const pick = PICKS[plan.picks[state.pick]];
  $('#pickTitle').textContent = pick.name;
  $('#pickTab').innerHTML = tabSvg({ name: pick.name, notes: pickItems(pick) }, 0, 40);
  $('#pickTip').innerHTML = `<b>Fingers / pick strokes:</b> <code>${pick.fingers}</code> (one per eighth note, repeated every bar). ${pick.tip}`;
}
$('#pickSelect').addEventListener('change', (event) => { state.pick = Number(event.target.value); stopAll(); renderPick(); });

// ---------- 05 scale ----------
function scaleCells(box, rootPc, scale, labels) {
  const tones = spellSteps(rootNameOf(rootPc), scale.steps, scale.labels);
  const byPitch = new Map(tones.map((tone) => [tone.pitch, tone]));
  const inBox = new Set(box.cells.map((cell) => key(cell.s, cell.f)));
  const cells = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const tone = byPitch.get(pitchAt(s, f));
    if (!tone) continue;
    const here = inBox.has(key(s, f));
    cells.push({ s, f, cls: !here ? 'faint' : tone.step === 0 ? 'root' : scale.boxSteps && !scale.boxSteps.includes(tone.step) ? 'blue' : 'note', label: labels === 'degree' ? tone.label : pretty(tone.note), title: `${tone.note} (${tone.label}) · string ${6 - s}, fret ${f}` });
  }
  return { cells, tones };
}
function miniBoxSvg(box, rootPc) {
  const fw = 19, gap = 9, left = 8, top = 8;
  const parts = [];
  for (let fret = 0; fret <= MAX_FRET; fret += 1) parts.push(`<line x1="${left + fret * fw}" y1="${top}" x2="${left + fret * fw}" y2="${top + gap * 5}" class="mb-fret${fret === 0 ? ' is-nut' : ''}"/>`);
  for (let string = 0; string < 6; string += 1) parts.push(`<line x1="${left}" y1="${top + (5 - string) * gap}" x2="${left + MAX_FRET * fw}" y2="${top + (5 - string) * gap}" class="mb-string"/>`);
  box.cells.forEach((cell) => parts.push(`<circle cx="${left + (cell.f === 0 ? -.35 : cell.f - .5) * fw}" cy="${top + (5 - cell.s) * gap}" r="3.6" class="mb-dot${pitchAt(cell.s, cell.f) === rootPc ? ' is-root' : ''}"/>`));
  return `<svg class="j-svg mini-box" viewBox="0 0 ${left * 2 + MAX_FRET * fw} ${top * 2 + gap * 5}" role="img" aria-label="Position frets ${box.min} to ${box.max}">${parts.join('')}</svg>`;
}
function renderScale() {
  const scale = plan.scale;
  $('#scaleSelect').innerHTML = plan.scales.map((id, index) => `<option value="${id}">${SOLO_SCALES[id].label}${index === 0 ? ' ★' : ''}</option>`).join('');
  $('#scaleSelect').value = state.scale;
  $('#posSelect').innerHTML = Array.from({ length: plan.count }, (_, index) => { const box = positionBox(plan.rootPc, scale.boxSteps ?? scale.steps, index); return `<option value="${index}">Position ${index + 1} · frets ${box.min}–${box.max}${index === plan.recommended ? ' ★' : ''}</option>`; }).join('');
  $('#posSelect').value = state.pos;
  $('#labelSelect').value = state.labels;
  $('#scaleTitle').innerHTML = `${pretty(state.root)} ${scale.label}`;
  const { cells, tones } = scaleCells(plan.box, plan.rootPc, scale, state.labels);
  $('#scaleNotes').innerHTML = `<div class="scale-notes">${tones.map((tone) => `<span class="${tone.step === 0 ? 'is-root' : ''}"><b>${pretty(tone.note)}</b><small>${tone.label}</small></span>`).join('')}</div><p>${scale.why}</p>`;
  $('#scaleBoard').innerHTML = neckSvg(cells, { label: `${state.root} ${scale.label}` });
  const rootCell = plan.box.cells.filter((cell) => pitchAt(cell.s, cell.f) === plan.rootPc).sort((a, b) => a.s - b.s)[0];
  const next = positionBox(plan.rootPc, scale.boxSteps ?? scale.steps, (state.pos + 1) % plan.count);
  const scalesPageId = ['majorPentatonic', 'minorPentatonic', 'blues', 'major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'harmonicMinor'].includes(state.scale) ? state.scale : null;
  $('#whereCards').innerHTML = `
    <article><h3>${state.pos === plan.recommended ? '★ Start here' : 'You are here'}</h3><p><b>Position ${state.pos + 1}</b>, frets <b>${plan.box.min}–${plan.box.max}</b>. Put your index finger at fret ${Math.max(1, plan.box.min)} and use one finger per fret.</p></article>
    <article><h3>Find home</h3><p>${rootCell ? `Your first root note: <b>${pretty(state.root)}</b> on the ${STRING_NAMES[rootCell.s]} string, fret ${rootCell.f}. Start and end phrases there.` : 'Look for the coral root dots.'}</p></article>
    <article><h3>Then move</h3><p>Position ${(state.pos + 1) % plan.count + 1} starts around fret ${next.min}. Slide along one string to join the two, and the pattern repeats every 12 frets.</p></article>
    <article><h3>Go deeper</h3><p>${scalesPageId ? `<a href="../scales/index.html?root=${encodeURIComponent(state.root)}&scale=${scalesPageId}#scales">Open this scale on the Scales page</a> for positions, harmony and licks.` : 'The Scales page covers the related modes and pentatonic boxes.'}</p></article>`;
  $('#posStrip').innerHTML = Array.from({ length: plan.count }, (_, index) => {
    const box = fullBox(plan.rootPc, scale, index);
    return `<button type="button" class="pos-card${index === state.pos ? ' is-selected' : ''}" data-pos="${index}">${miniBoxSvg(box, plan.rootPc)}<span>Position ${index + 1} · frets ${box.min}–${box.max}${index === plan.recommended ? ' ★' : ''}</span></button>`;
  }).join('');
  $('#scaleAlts').innerHTML = plan.scales.filter((id) => id !== state.scale).map((id) => `<article class="alt-card"><h3>${pretty(state.root)} ${SOLO_SCALES[id].label}</h3><p class="alt-chords">${spellSteps(state.root, SOLO_SCALES[id].steps, SOLO_SCALES[id].labels).map((tone) => pretty(tone.note)).join(' ')}</p><p>${SOLO_SCALES[id].why}</p><button type="button" class="hear-button" data-scale="${id}">Use this scale</button></article>`).join('');
}
$('#scaleSelect').addEventListener('change', (event) => { state.scale = event.target.value; state.pos = null; renderAll(); });
$('#posSelect').addEventListener('change', (event) => { state.pos = Number(event.target.value); renderAll(); });
$('#labelSelect').addEventListener('change', (event) => { state.labels = event.target.value; renderScale(); });
$('#posStrip').addEventListener('click', (event) => { const card = event.target.closest('[data-pos]'); if (card) { state.pos = Number(card.dataset.pos); renderAll(); } });
$('#scaleAlts').addEventListener('click', (event) => { const button = event.target.closest('[data-scale]'); if (button) { state.scale = button.dataset.scale; state.pos = null; renderAll(); $('#scale').scrollIntoView({ behavior: 'smooth' }); } });
function boxRun() {
  const unique = [...new Map([...plan.box.cells].sort((a, b) => a.midi - b.midi || a.s - b.s).map((cell) => [cell.midi, cell])).values()];
  return unique;
}
$('#scalePlay').addEventListener('click', () => {
  stopAll();
  const run = boxRun();
  [...run, ...run.slice(0, -1).reverse()].forEach((cell, index) => later(index * 230, () => { sound.pluck(cell.s, cell.f, { length: .8 }); flash($('#scaleBoard'), cell.s, cell.f, 220); }));
});
wirePlayback($('#scaleBoard'));

// ---------- 06 arpeggios ----------
const INTERVAL_LABEL = { 0: 'R', 1: 'b9', 2: '9', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7' };
function uniqueChords() { return [...new Map(plan.chords.map((chord) => [chord.name, chord])).values()]; }
function arpCells(chord) {
  const tones = chordModel.qualities[chord.quality].tones.map((tone) => (chord.pc + tone.semitones) % 12);
  const scalePitches = new Set(plan.scale.steps.map((step) => (plan.rootPc + step) % 12));
  const low = Math.max(0, plan.box.min - 1), high = plan.box.max + 1;
  const cells = [];
  const run = [];
  for (let s = 0; s < 6; s += 1) for (let f = 0; f <= MAX_FRET; f += 1) {
    const pitch = pitchAt(s, f);
    const inSpan = f >= low && f <= high;
    const label = INTERVAL_LABEL[(pitch - chord.pc + 12) % 12];
    if (tones.includes(pitch)) {
      cells.push({ s, f, cls: !inSpan ? 'faint' : pitch === chord.pc ? 'root' : 'note', target: inSpan, label, title: `${SHARPS[pitch]} (${label}) · string ${6 - s}, fret ${f}` });
      if (inSpan) run.push({ s, f, midi: STRING_MIDI[s] + f });
    } else if (inSpan && scalePitches.has(pitch)) cells.push({ s, f, cls: 'sharp', label: '', title: `${SHARPS[pitch]} (scale note)` });
  }
  const unique = [...new Map(run.sort((a, b) => a.midi - b.midi || b.s - a.s).map((cell) => [cell.midi, cell])).values()];
  return { cells, run: unique, tones };
}
function renderArps() {
  const chords = uniqueChords();
  if (state.arp >= chords.length) state.arp = 0;
  const chord = chords[state.arp];
  $('#arpChips').innerHTML = chords.map((item, index) => `<button type="button" class="arp-chip${index === state.arp ? ' is-selected' : ''}" data-arp="${index}">${item.name}</button>`).join('');
  const { cells, tones } = arpCells(chord);
  $('#arpBoard').innerHTML = neckSvg(cells, { label: `${chord.name} arpeggio` });
  const formula = chordModel.qualities[chord.quality].tones.map((tone) => tone.label).join(' – ');
  const openRun = playedStrings(chord.frets);
  const shapeItems = [{ chord: chord.name }, ...openRun.map((string) => [string, chord.frets[string], .5]), ...openRun.slice(0, -1).reverse().map((string) => [string, chord.frets[string], .5])];
  $('#arpInfo').innerHTML = `<article><h3>${chord.name} = ${tones.map((pitch) => SHARPS[pitch]).join(' – ')}</h3><p>Formula <b>${formula}</b>. The ringed dots are every ${chord.name} note inside your scale position (frets ${Math.max(0, plan.box.min - 1)}–${plan.box.max + 1}). Over the ${chord.name} bar, land on these; pass through the grey scale notes between them.</p></article><article><h3>From the chord shape</h3><p>Hold the ${chord.name} shape from section 02 and pick it one string at a time, low to high and back:</p><div class="tab-scroll">${tabSvg({ name: `${chord.name} shape arpeggio`, notes: shapeItems }, 0, 40)}</div></article><article><h3>Next step</h3><p>Play each arpeggio for one bar while the progression loops in your head, changing exactly on beat 1. The <a href="../arpeggios/index.html">Arpeggios page</a> has movable shapes for every chord type.</p></article>`;
}
$('#arpChips').addEventListener('click', (event) => { const chip = event.target.closest('[data-arp]'); if (chip) { state.arp = Number(chip.dataset.arp); renderArps(); } });
$('#arpPlay').addEventListener('click', () => {
  stopAll();
  const { run } = arpCells(uniqueChords()[state.arp]);
  [...run, ...run.slice(0, -1).reverse()].forEach((cell, index) => later(index * 220, () => { sound.pluck(cell.s, cell.f, { length: 1 }); flash($('#arpBoard'), cell.s, cell.f, 210); }));
});
wirePlayback($('#arpBoard'));

// ---------- 07 lead ----------
const RHYTHMS = [[1, 1, 1, 1], [1.5, .5, 1, 1], [1, .5, .5, 2], [2, 1, 1], [1, 1, 2], [.5, .5, 1, 2]];
function buildLead() {
  const random = rng(state.seed * 7919 + plan.chords.length * 31 + plan.rootPc);
  const run = boxRun();
  const bars = plan.chords.slice(0, 8);
  const chordPcs = (chord) => chordModel.qualities[chord.quality].tones.map((tone) => (chord.pc + tone.semitones) % 12);
  const nearestTone = (pcs, from) => {
    const options = run.map((cell, index) => ({ index, distance: Math.abs(index - from) })).filter(({ index }) => pcs.includes(run[index].midi % 12)).sort((a, b) => a.distance - b.distance);
    return (random() < .3 && options[1] ? options[1] : options[0])?.index ?? Math.min(from, run.length - 1);
  };
  let current = nearestTone([plan.rootPc], Math.floor(run.length / 2));
  const targets = [];
  bars.forEach((chord, index) => { current = nearestTone(chordPcs(chord), index ? current : Math.floor(run.length / 2)); targets.push(current); });
  const items = [];
  const played = [];
  bars.forEach((chord, bar) => {
    const last = bar === bars.length - 1;
    const rhythm = last ? [2, 2] : RHYTHMS[Math.floor(random() * RHYTHMS.length)];
    const goal = last ? nearestTone([plan.rootPc], targets[bar]) : targets[bar + 1];
    let index = targets[bar];
    items.push({ chord: chord.name });
    rhythm.forEach((beats, slot) => {
      if (slot > 0) {
        const remaining = rhythm.length - slot;
        const diff = goal - index;
        let step = diff === 0 ? (random() < .5 ? 1 : -1) : Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) / (remaining + 1)));
        if (last && slot === rhythm.length - 1) step = goal - index;
        index = Math.min(run.length - 1, Math.max(0, index + step));
      }
      const cell = run[index];
      items.push([cell.s, cell.f, beats]);
      played.push(cell);
    });
    if (!last) items.push('|');
  });
  return { items, played, bars };
}
let lead = null;
function renderLead() {
  lead = buildLead();
  $('#leadTab').innerHTML = tabSvg({ name: 'Lead line', notes: lead.items }, 0);
  const targetKeys = new Set(lead.played.map((cell) => key(cell.s, cell.f)));
  const { cells } = scaleCells(plan.box, plan.rootPc, plan.scale, 'note');
  $('#leadBoard').innerHTML = neckSvg(cells.map((cell) => ({ ...cell, target: targetKeys.has(key(cell.s, cell.f)) })), { label: 'Lead line notes in the scale position' });
  $('#leadTips').innerHTML = `<article><h3>Targets</h3><p>Every bar starts on a note of that bar's chord (${lead.bars.map((chord) => chord.name).join(', ')}). That's why it sounds "right" over the changes.</p></article><article><h3>Make it yours</h3><p>Keep the first note of each bar, change everything in between. Or keep the notes and change the rhythm. Press <b>New variation</b> for more ideas.</p></article><article><h3>Add expression</h3><p>Slide into the first note, bend the note before a target up to it, and add vibrato to the last note. Ringed dots on the neck show the notes used.</p></article>`;
}
$('#leadNew').addEventListener('click', () => { stopAll(); state.seed += 1; renderLead(); });
function playLead(withChords) {
  stopAll();
  const beat = beatMs();
  let time = 0;
  let bar = -1;
  lead.items.forEach((item, index) => {
    if (item && !Array.isArray(item) && item.chord) {
      bar += 1;
      const chord = lead.bars[bar];
      if (withChords) { later(time, () => strike(chord.frets, 'D', { level: .08 })); later(time + beat * 2, () => strike(chord.frets, 'D', { level: .06 })); }
      document.querySelectorAll(`[data-bar="${plan.chords.indexOf(chord)}"]`).forEach((element) => glow(element, time, beat * 4));
      return;
    }
    if (!Array.isArray(item)) return;
    const [string, fret, beats] = item;
    later(time, () => { sound.pluck(string, fret, { level: .36, length: Math.min(2, beats * beat / 1000 + .3) }); flash($('#leadBoard'), string, fret, beats * beat - 20); });
    glow($('#leadTab').querySelector(`[data-index="${index}"]`), time, beats * beat, 'is-playing');
    time += beats * beat;
  });
}

// ---------- 08 roadmap ----------
function renderRoadmap() {
  const signature = Object.values(state.answers).join('-');
  let done = {};
  try { done = JSON.parse(localStorage.getItem(`journey:${signature}`) ?? '{}'); } catch {}
  const chordNames = [...new Set(plan.chords.map((chord) => chord.name))].join(', ');
  const steps = [
    ['Learn the chord shapes', `Practise ${chordNames} until every string rings clearly.`, '#chords'],
    ['Change chords in time', `Change on beat 1 at ${Math.max(50, state.bpm - 30)} BPM, then work up to ${state.bpm}. One strum per bar is fine at first.`, '#chords'],
    ['Strumming pattern', `${STRUMS[plan.strums[state.strum]].name}: first on muted strings, then with the chords.`, '#rhythm'],
    ['Picking pattern', `${PICKS[plan.picks[state.pick]].name} over one chord, then through the whole progression.`, '#picking'],
    ['Scale: your first position', `${pretty(state.root)} ${plan.scale.label}, position ${state.pos + 1}. Play it up and down while saying the note names.`, '#scale'],
    ['Scale: connect a second position', 'Slide from one position into the next along a single string. Then find every root on the neck.', '#scale'],
    ['Arpeggios', `Play the arpeggio of each chord (${chordNames}) inside your position, one bar each.`, '#arps'],
    ['Lead line', 'Learn the generated melody, then make three variations of your own.', '#lead'],
    ['Put it together', 'Record yourself strumming or picking the progression on your phone, then play the lead and improvise over it.', '#lead'],
    ['Write your own', 'Change one thing: an alternative progression, a different key, or a new rhythm. You have just written a new piece.', '#chords']
  ];
  const count = steps.filter((_, index) => done[index]).length;
  $('#roadmapList').innerHTML = `<li class="roadmap-meter"><div><b>${count} / ${steps.length}</b> steps done</div><div class="meter"><i style="width:${count / steps.length * 100}%"></i></div></li>` + steps.map(([title, text, link], index) => `<li class="${done[index] ? 'is-done' : ''}"><label><input type="checkbox" data-step="${index}"${done[index] ? ' checked' : ''}><span class="rm-num">${index + 1}</span><div><h3>${title}</h3><p>${text}</p></div></label><a href="${link}">Go →</a></li>`).join('');
  $('#roadmapList').onchange = (event) => {
    const box = event.target.closest('[data-step]');
    if (!box) return;
    done[box.dataset.step] = box.checked;
    try { localStorage.setItem(`journey:${signature}`, JSON.stringify(done)); } catch {}
    renderRoadmap();
  };
}

// ---------- wiring ----------
function renderAll() {
  stopAll();
  plan = buildPlan();
  renderSound();
  renderChords();
  renderStrum();
  renderPick();
  renderScale();
  renderArps();
  renderLead();
  renderRoadmap();
}
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-stop]')) { stopAll(); return; }
  const button = event.target.closest('[data-play]');
  if (!button) return;
  const mode = button.dataset.play;
  if (mode === 'lead' || mode === 'leadOnly') playLead(mode === 'lead');
  else playChords(mode);
});

const params = new URLSearchParams(location.search);
if (QUESTIONS.every((question) => optionsFor(question.id).some((option) => option.id === params.get(question.id)))) {
  QUESTIONS.forEach((question) => { state.answers[question.id] = params.get(question.id); });
  finishQuiz(false);
} else renderQuiz();
