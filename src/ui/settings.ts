import { startSpan, endSpan, flushSpans, getSessionId } from '../telemetry/telemetry';

/**
 * Create and inject the menu DOM (button, backdrop, panel) into document.body.
 * Called once before wiring event listeners.
 */
function injectMenuDOM(): void {
  // Menu button (fixed top-right, hamburger icon)
  const btn = document.createElement('button');
  btn.id = 'menu-btn';
  btn.className = 'menu-btn';
  btn.title = 'Menu';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;
  document.body.appendChild(btn);

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'settings-backdrop';
  backdrop.className = 'settings-backdrop';
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.className = 'settings-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Menu');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = `
    <button id="settings-close-btn" class="settings-close-btn" aria-label="Close menu">&times;</button>
    <h2 class="settings-title">MTG Colors</h2>
    <div id="settings-version" class="settings-version"></div>
    <a class="settings-about-link" href="about">About</a>
    <button id="settings-share-btn" class="settings-share-btn">\u{1F517} Share</button>
    <button id="settings-reset-btn" class="settings-reset-btn" title="forget what you've unlocked">Reset Progress</button>
    <div id="settings-trace-container" class="settings-trace-container" hidden>
      <a id="settings-trace-link" class="settings-trace-link trace-link" target="_blank" rel="noopener noreferrer">Current trace</a>
    </div>`;
  document.body.appendChild(panel);
}

/**
 * Wire the settings panel: version display, open/close, and reset progress.
 * @param appVersion - the current app version string
 */
export function wireSettings(
  appVersion: string,
): void {
  // Inject menu DOM into the page
  injectMenuDOM();

  // Populate version in settings panel
  const settingsVersionEl = document.getElementById('settings-version');
  if (settingsVersionEl) {
    settingsVersionEl.textContent = `v${appVersion}`;
  }

  const gearBtn = document.getElementById('menu-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const settingsCloseBtn = document.getElementById('settings-close-btn');

  function openSettings(): void {
    if (settingsPanel) settingsPanel.hidden = false;
    if (settingsBackdrop) settingsBackdrop.hidden = false;
    if (settingsPanel) settingsPanel.removeAttribute('aria-hidden');
    if (settingsBackdrop) settingsBackdrop.removeAttribute('aria-hidden');
  }

  function closeSettings(): void {
    if (settingsPanel) settingsPanel.hidden = true;
    if (settingsBackdrop) settingsBackdrop.hidden = true;
  }

  gearBtn?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    openSettings();
  });

  settingsCloseBtn?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    closeSettings();
  });

  settingsBackdrop?.addEventListener('click', () => {
    closeSettings();
  });

  const resetBtn = document.getElementById('settings-reset-btn');
  resetBtn?.addEventListener('click', async () => {
    const span = startSpan('settings.reset_progress', {
      'reset.app_version': appVersion,
    });
    endSpan(span);
    await flushSpans();
    localStorage.clear();
    window.location.href = '.';
  });

  // Share / Copy link button
  const shareBtn = document.getElementById('settings-share-btn');
  shareBtn?.addEventListener('click', () => {
    const sessionId = getSessionId();
    const url = new URL(window.location.href);
    url.searchParams.set('utm_source', 'share');
    url.searchParams.set('utm_id', sessionId);
    const shareUrl = url.toString();

    navigator.clipboard.writeText(shareUrl).then(() => {
      if (shareBtn) {
        shareBtn.textContent = 'Copied!';
        setTimeout(() => { shareBtn.textContent = '\u{1F517} Share'; }, 2000);
      }
    });

    const span = startSpan('share.copy_link', {
      'share.session_id': sessionId,
      'share.url': shareUrl,
    });
    endSpan(span);
  });
}
