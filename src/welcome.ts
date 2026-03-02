import { initTelemetry, sendStartupSpan, flushSpans } from './telemetry/telemetry';
import { wireSettings } from './ui/settings';

export const APP_VERSION = '0.19.0';

let welcomeScreenLoadTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'welcome', 'multi_page');
  sendStartupSpan(APP_VERSION);

  wireSettings(APP_VERSION, () => null);

  welcomeScreenLoadTime = Date.now();

  document.getElementById('start-button')?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const dwellMs = Date.now() - welcomeScreenLoadTime;
    window.location.href = `slides.html?subgroup=allied&from=welcome&welcome_dwell_ms=${dwellMs}`;
  });

  // Flush spans when page is hidden (captures abandoned welcome sessions)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSpans();
    }
  });
});
