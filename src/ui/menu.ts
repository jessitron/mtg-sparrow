import { storageClear } from '../storage';
import { wireFeedback } from './feedback';

type RecordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => void;

export interface MenuOptions {
  appVersion: string;
  recordEvent: RecordEvent;
  getSessionId: () => string;
  showResetProgress?: boolean;
  showTraceLink?: boolean;
  onReset?: () => void;
}

function injectMenuDOM(showResetProgress: boolean, showTraceLink: boolean): void {
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

  const resetHtml = showResetProgress
    ? `<button id="settings-reset-btn" class="settings-reset-btn" title="forget what you've unlocked">Reset Progress</button>`
    : '';
  const traceHtml = showTraceLink
    ? `<div id="settings-trace-container" class="settings-trace-container" hidden>
        <a id="settings-trace-link" class="settings-trace-link trace-link" target="_blank" rel="noopener noreferrer">Current trace</a>
      </div>`
    : '';

  panel.innerHTML = `
    <button id="settings-close-btn" class="settings-close-btn" aria-label="Close menu">&times;</button>
    <h2 class="settings-title"><a href="/" class="settings-title-link">MTG Colors</a></h2>
    <div id="settings-version" class="settings-version"></div>
    <a class="settings-about-link" href="end">Levels</a>
    <a class="settings-about-link" href="about">About</a>
    <button id="settings-share-btn" class="settings-share-btn">Share \u{1F517}</button>
    <button id="settings-feedback-btn" class="settings-feedback-btn">Feedback</button>
    ${resetHtml}
    ${traceHtml}`;
  document.body.appendChild(panel);
}

/**
 * Inject and wire the hamburger menu.
 * All telemetry goes through the recordEvent callback — no direct telemetry imports.
 */
export function wireMenu(options: MenuOptions): void {
  const {
    appVersion,
    recordEvent,
    getSessionId,
    showResetProgress = false,
    showTraceLink = false,
    onReset,
  } = options;

  injectMenuDOM(showResetProgress, showTraceLink);

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
    document.dispatchEvent(new CustomEvent('dialog-open'));
  }

  function closeSettings(): void {
    if (settingsPanel) settingsPanel.hidden = true;
    if (settingsBackdrop) settingsBackdrop.hidden = true;
    document.dispatchEvent(new CustomEvent('dialog-close'));
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
        setTimeout(() => { shareBtn.textContent = 'Share \u{1F517}'; }, 2000);
      }
    });

    recordEvent('share.copy_link', {
      'share.session_id': sessionId,
      'share.url': shareUrl,
    });
  });

  // Feedback button
  wireFeedback(recordEvent, getSessionId);

  // Reset Progress button (only injected when showResetProgress is true)
  if (showResetProgress) {
    const resetBtn = document.getElementById('settings-reset-btn');
    resetBtn?.addEventListener('click', () => {
      recordEvent('settings.reset_progress', { 'reset.app_version': appVersion });
      if (onReset) {
        onReset();
      } else {
        storageClear();
        window.location.href = '.';
      }
    });
  }
}
