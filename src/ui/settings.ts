import { startSpan, endSpan, flushSpans, getSessionId } from '../telemetry/telemetry';

/**
 * Create and inject the menu DOM (button, backdrop, panel) into document.body.
 * Called once before wiring event listeners.
 */
function injectMenuDOM(): void {
  // Menu button (fixed top-right)
  const btn = document.createElement('button');
  btn.id = 'settings-gear-btn';
  btn.className = 'settings-gear-btn';
  btn.title = 'Settings';
  btn.setAttribute('aria-label', 'Settings');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
  panel.setAttribute('aria-label', 'Settings');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = `
    <button id="settings-close-btn" class="settings-close-btn" aria-label="Close settings">&times;</button>
    <h2 class="settings-title">Settings</h2>
    <div id="settings-version" class="settings-version"></div>
    <div id="settings-trace-container" class="settings-trace-container" hidden>
      <a id="settings-trace-link" class="settings-trace-link trace-link" target="_blank" rel="noopener noreferrer">Current trace</a>
    </div>
    <a class="settings-github-link" href="https://github.com/jessitron/mtg-sparrow" target="_blank" rel="noopener noreferrer">
      <img src="images/github-mark.svg" alt="" class="settings-github-icon" aria-hidden="true" width="16" height="16">
      GitHub
    </a>
    <a class="settings-about-link" href="about">About</a>
    <button id="settings-share-btn" class="settings-share-btn">Copy link</button>
    <hr class="settings-divider"/>
    <button id="settings-reset-btn" class="settings-reset-btn">Reset progress</button>`;
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

  const gearBtn = document.getElementById('settings-gear-btn');
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
        setTimeout(() => { shareBtn.textContent = 'Copy link'; }, 2000);
      }
    });

    const span = startSpan('share.copy_link', {
      'share.session_id': sessionId,
      'share.url': shareUrl,
    });
    endSpan(span);
  });
}
