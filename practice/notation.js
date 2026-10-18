// Original study melodies. Position indexes run from low E (0) to high e (5).
const leadScores = {"morning": {"bpm": 72, "notes": [{"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 0.5}, {"position": [5, 5], "beats": 0.5}, {"position": [5, 3], "beats": 2}, {"position": [4, 3], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [5, 7], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [5, 5], "beats": 1.5}, {"position": [5, 3], "beats": 0.5}, {"position": [4, 5], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 6], "beats": 1}, {"position": [4, 5], "beats": 0.5}, {"position": [3, 5], "beats": 0.5}, {"position": [5, 5], "beats": 2}], "chords": ["C", "G", "Am", "F"], "barBeats": 4}, "ember": {"bpm": 80, "notes": [{"position": null, "beats": 1}, {"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [2, 5], "beats": 2}, {"position": [3, 5], "beats": 0.5}, {"position": [2, 7], "beats": 0.5}, {"position": [2, 3], "beats": 1}, {"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [2, 7], "beats": 2}], "chords": ["Am", "G", "F", "Am"], "barBeats": 4}, "waltz": {"bpm": 90, "notes": [{"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 5], "beats": 2}, {"position": [4, 6], "beats": 1}, {"position": [5, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 3], "beats": 3}, {"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [5, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 5], "beats": 3}], "chords": ["C", "Am", "F", "G", "C", "Am", "G", "C"], "barBeats": 3}, "blue": {"bpm": 84, "notes": [{"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 0.5}, {"position": [4, 3], "beats": 0.5}, {"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 7], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [2, 6], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [3, 5], "beats": 0.5}, {"position": [3, 4], "beats": 0.5}, {"position": [2, 7], "beats": 3}], "chords": ["A7", "D7", "E7", "A7"], "barBeats": 4}};
let scoreTimers = [];
function stopScore() {
  scoreTimers.forEach(clearTimeout);
  scoreTimers = [];
  clearLeadHighlight();
  document.querySelectorAll('[data-score-status]').forEach(item => { item.textContent = ''; });
}
function clearLeadHighlight() {
  document.querySelectorAll('.lead-fretboard .is-active').forEach(item => item.classList.remove('is-active'));
}
function showLeadNote(id, index, position) {
  clearLeadHighlight();
  const step = document.querySelector(`[data-lead-map="${id}"] [data-score-step="${index}"]`);
  if (!step) return;
  step.classList.add('is-active');
  const panel = step.closest('.lead-fretboard');
  if (position) panel.querySelectorAll(`.lead-dot[data-fret-hit="${position.join(':')}"]`).forEach(dot => dot.classList.add('is-active'));
}
function playFret(target) {
  stopScore();
  const [string, fret] = target.dataset.fretHit.split(':').map(Number);
  window.ChordDiagram.pluck(string, fret);
  const panel = target.closest('.lead-fretboard');
  panel.querySelectorAll(`.lead-dot[data-fret-hit="${string}:${fret}"]`).forEach(dot => dot.classList.add('is-active'));
}
document.addEventListener('keydown', event => {
  const target = event.target.closest('.lead-dot[data-fret-hit]');
  if (target && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    playFret(target);
  }
});
document.addEventListener('click', event => {
  const fret = event.target.closest('[data-fret-hit]');
  if (fret) { playFret(fret); return; }
  if (event.target.closest('[data-score-stop]')) { stopScore(); return; }
  const button = event.target.closest('[data-score-play]');
  if (!button) return;
  stopScore();
  const id = button.dataset.scorePlay;
  const score = leadScores[id];
  const section = button.closest('section');
  const speed = Number(section.querySelector('[data-score-speed]').value);
  const selectedBar = section.querySelector('[data-score-bar]').value;
  const loop = section.querySelector('[data-score-loop]').checked;
  const backing = section.querySelector('[data-score-backing]').checked;
  const bpm = score.bpm * speed;
  const beatMs = 60000 / bpm;
  const firstBeat = selectedBar === 'all' ? 0 : Number(selectedBar) * score.barBeats;
  const lastBeat = selectedBar === 'all' ? score.chords.length * score.barBeats : firstBeat + score.barBeats;
  const status = section.querySelector('[data-score-status]');
  status.textContent = `${loop ? 'Looping' : 'Playing'} ${selectedBar === 'all' ? 'all bars' : `bar ${Number(selectedBar) + 1}`} at ${Math.round(bpm)} BPM${backing ? ' with chords' : ''}`;
  function playPass() {
    let atBeat = 0;
    score.notes.forEach((note, index) => {
      if (atBeat >= firstBeat && atBeat < lastBeat) {
        const time = (atBeat - firstBeat) * beatMs;
        scoreTimers.push(setTimeout(() => {
          showLeadNote(id, index, note.position);
          if (note.position) {
            const [string, fret] = note.position;
            window.ChordDiagram.pluck(string, fret, { length: note.beats * beatMs / 1000 * .9 });
          }
        }, time));
      }
      atBeat += note.beats;
    });
    if (backing) score.chords.forEach((chord, bar) => {
      const at = bar * score.barBeats;
      if (at >= firstBeat && at < lastBeat) {
        scoreTimers.push(setTimeout(() => window.ChordDiagram.strum(leadBacking[chord], { level: .07, gap: .025 }), (at - firstBeat) * beatMs));
      }
    });
    scoreTimers.push(setTimeout(() => {
      scoreTimers = [];
      clearLeadHighlight();
      if (loop) playPass();
      else status.textContent = 'Finished';
    }, (lastBeat - firstBeat) * beatMs));
  }
  playPass();
});
window.addEventListener('pagehide', stopScore);

// Open-position backing voicings, low E to high e; null means a muted string.
const leadBacking = {
  C: [null, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3],
  Am: [null, 0, 2, 2, 1, 0], F: [null, null, 3, 2, 1, 1],
  A7: [null, 0, 2, 0, 2, 0], D7: [null, null, 0, 2, 1, 2], E7: [0, 2, 0, 1, 0, 0]
};
// Changing a practice setting stops the current pass; Play applies the new values.
document.addEventListener('change', event => {
  if (event.target.matches('[data-score-speed], [data-score-bar], [data-score-loop], [data-score-backing]')) stopScore();
});
