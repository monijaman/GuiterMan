// Original study melodies. Position indexes run from low E (0) to high e (5).
const leadScores = {"morning": {"bpm": 72, "notes": [{"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 0.5}, {"position": [5, 5], "beats": 0.5}, {"position": [5, 3], "beats": 2}, {"position": [4, 3], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [5, 7], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [5, 5], "beats": 1.5}, {"position": [5, 3], "beats": 0.5}, {"position": [4, 5], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 6], "beats": 1}, {"position": [4, 5], "beats": 0.5}, {"position": [3, 5], "beats": 0.5}, {"position": [5, 5], "beats": 2}]}, "ember": {"bpm": 80, "notes": [{"position": null, "beats": 1}, {"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [2, 5], "beats": 2}, {"position": [3, 5], "beats": 0.5}, {"position": [2, 7], "beats": 0.5}, {"position": [2, 3], "beats": 1}, {"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [2, 7], "beats": 2}]}, "waltz": {"bpm": 90, "notes": [{"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [4, 5], "beats": 2}, {"position": [4, 6], "beats": 1}, {"position": [5, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 3], "beats": 3}, {"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [5, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 5], "beats": 3}]}, "blue": {"bpm": 84, "notes": [{"position": [2, 7], "beats": 1}, {"position": [3, 5], "beats": 0.5}, {"position": [4, 3], "beats": 0.5}, {"position": [4, 5], "beats": 1}, {"position": [5, 3], "beats": 1}, {"position": [4, 7], "beats": 1}, {"position": [4, 5], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [3, 5], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [4, 3], "beats": 1}, {"position": [2, 6], "beats": 1}, {"position": [3, 4], "beats": 1}, {"position": [3, 5], "beats": 0.5}, {"position": [3, 4], "beats": 0.5}, {"position": [2, 7], "beats": 3}]}};
let scoreTimers = [];
function stopScore() {
  scoreTimers.forEach(clearTimeout);
  scoreTimers = [];
  document.querySelectorAll('[data-score-status]').forEach(item => { item.textContent = ''; });
}
document.addEventListener('click', event => {
  if (event.target.closest('[data-score-stop]')) { stopScore(); return; }
  const button = event.target.closest('[data-score-play]');
  if (!button) return;
  stopScore();
  const id = button.dataset.scorePlay;
  const score = leadScores[id];
  const status = document.querySelector(`[data-score-status="${id}"]`);
  status.textContent = `Playing at ${score.bpm} BPM`;
  let elapsed = 0;
  score.notes.forEach(note => {
    if (note.position) {
      const [string, fret] = note.position;
      scoreTimers.push(setTimeout(() => window.ChordDiagram.pluck(string, fret, { length: note.beats * 60 / score.bpm * .9 }), elapsed));
    }
    elapsed += note.beats * 60000 / score.bpm;
  });
  scoreTimers.push(setTimeout(() => { status.textContent = 'Finished'; }, elapsed));
});
window.addEventListener('pagehide', stopScore);
