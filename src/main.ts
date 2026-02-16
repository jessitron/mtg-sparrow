import { initTelemetry, sendStartupSpan } from './telemetry/telemetry';

export const APP_VERSION = '0.1.0';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION);
  sendStartupSpan(APP_VERSION);

  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = `v${APP_VERSION}`;
  }
});
