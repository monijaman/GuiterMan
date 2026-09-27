const themeLoader = document.createElement('script');
themeLoader.src = '../theme.js';
document.head.append(themeLoader);

const chordData = window.GUITAR_CHORD_DATA;
const groups = {
  major: 'triads', minor: 'triads', power: 'triads', dominant7: 'seventh', major7: 'seventh', minor7: 'seventh', halfDiminished: 'seventh',
  sus2: 'suspended', sus4: 'suspended', sus7: 'suspended', diminished: 'altered', augmented: 'altered', diminished7: 'altered',
  major6: 'extended', minor6: 'extended', add9: 'extended', dominant9: 'extended'
};
let selectedFamily = 'all';
const directory = document.querySelector('#chordDirectory');
const chordEntries = chordData.roots.flatMap((root) => Object.entries(chordData.qualities).map(([quality, definition]) => {
  const tones = chordData.spellTones(root, quality).map((tone) => tone.note).join(' ');
  const symbol = `${root}${definition.suffix}`;
  return { root, quality, symbol, label: `${root} ${definition.label}`, tones, searchable: `${root} ${definition.label} ${symbol} ${tones}`.toLowerCase() };
}));
directory.innerHTML = chordEntries.map((chord) => `<a class="chord-directory-card" href="detail.html?root=${encodeURIComponent(chord.root)}&quality=${chord.quality}" data-family="${groups[chord.quality]}" data-search="${chord.searchable}"><span class="chord-directory-mark">${chord.root}</span><span><strong>${chord.label}</strong><small>${chord.symbol} · ${chord.tones}</small></span><span aria-hidden="true">↗</span></a>`).join('');
function filterChords() {
  const query = document.querySelector('#chordSearch').value.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('.chord-directory-card').forEach((card) => {
    const show = (selectedFamily === 'all' || card.dataset.family === selectedFamily) && card.dataset.search.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  document.querySelector('#chordCount').textContent = `${visible} ${visible === 1 ? 'chord' : 'chords'}`;
}
document.querySelector('#chordSearch').addEventListener('input', filterChords);
document.querySelectorAll('.chord-filter').forEach((button) => button.addEventListener('click', () => {
  selectedFamily = button.dataset.filter;
  document.querySelectorAll('.chord-filter').forEach((filter) => filter.classList.toggle('is-selected', filter === button));
  filterChords();
}));
filterChords();