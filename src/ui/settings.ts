import { startSpan, endSpan, flushSpans } from '../telemetry/telemetry';

/**
 * Wire the settings panel: version display, open/close, and reset progress.
 * @param appVersion - the current app version string
 */
export function wireSettings(
  appVersion: string,
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
  resetBtn?.addEventListener('click', async () => {
    const span = startSpan('settings.reset_progress', {
      'reset.app_version': appVersion,
    });
    endSpan(span);
    await flushSpans();
    localStorage.clear();
    window.location.href = '/';
  });
}
