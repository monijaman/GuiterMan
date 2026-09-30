const themeScriptUrl = document.currentScript.src;
const themeStylesheet = document.createElement('link');
themeStylesheet.rel = 'stylesheet';
themeStylesheet.href = new URL('site-theme.css', themeScriptUrl).href;
document.head.append(themeStylesheet);

let activeTheme = 'dark';
try {
  if (localStorage.getItem('guitar-field-notes-theme') === 'light') activeTheme = 'light';
} catch {}
document.body.dataset.theme = activeTheme;

const themeButton = document.createElement('button');
themeButton.className = 'theme-toggle';
themeButton.type = 'button';
function updateThemeButton() {
  const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
  themeButton.textContent = `${nextTheme === 'light' ? '☼' : '◐'} ${nextTheme} mode`;
  themeButton.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
  themeButton.setAttribute('aria-pressed', String(activeTheme === 'dark'));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme === 'dark' ? '#141916' : '#f4f2e9');
}
updateThemeButton();
themeButton.addEventListener('click', () => {
  activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = activeTheme;
  try { localStorage.setItem('guitar-field-notes-theme', activeTheme); } catch {}
  updateThemeButton();
});
document.querySelector('.topbar')?.append(themeButton);

const langLoader = document.createElement('script');
langLoader.src = new URL('lang.js', themeScriptUrl).href;
document.head.append(langLoader);
