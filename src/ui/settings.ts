import { Span } from '@opentelemetry/api';
import { addSpanEvent } from '../telemetry/telemetry';

/**
 * Wire the settings panel: version display, open/close, and reset progress.
 * @param appVersion - the current app version string
 * @param getSessionSpan - returns the current session span (or null if no session active)
 */
export function wireSettings(
  appVersion: string,
  getSessionSpan: () => Span | null,
): void {
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
  resetBtn?.addEventListener('click', () => {
    const sessionSpan = getSessionSpan();
    if (sessionSpan) {
      addSpanEvent(sessionSpan, 'settings.reset_progress', {
        'reset.app_version': appVersion,
      });
    }
    localStorage.removeItem('sparrow-deck.progression');
    window.location.reload();
  });
}
