import { initTelemetry, sendStartupSpan, startSpan, getTraceId, flushSpans } from './telemetry/telemetry';
import { wireSettings } from './ui/settings';

export const APP_VERSION = '0.19.0';

let welcomeScreenLoadTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'welcome', 'multi_page');
  const startupSpan = sendStartupSpan(APP_VERSION);

  // Wire trace link in settings panel
  const traceId = getTraceId(startupSpan);
  const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
  const traceContainer = document.getElementById('settings-trace-container');
  if (traceLink) {
    traceLink.href = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
  }
  if (traceContainer) {
    traceContainer.hidden = false;
  }

  wireSettings(APP_VERSION);

  welcomeScreenLoadTime = Date.now();

  document.getElementById('start-button')?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const dwellMs = Date.now() - welcomeScreenLoadTime;
    window.location.href = `slides?subgroup=allied&from=welcome&welcome_dwell_ms=${dwellMs}`;
  });

  // Mana gas drag telemetry — fired from mana-gas.js when a symbol is dragged and released
  window.addEventListener('mana-gas-drag', ((e: CustomEvent) => {
    const { color, duration_ms, release_vx, release_vy } = e.detail;
    const span = startSpan('mana_gas.drag', {
      'mana_gas.drag.color': color,
      'mana_gas.drag.duration_ms': duration_ms,
      'mana_gas.drag.release_vx': release_vx,
      'mana_gas.drag.release_vy': release_vy,
    });
    span.end();
  }) as EventListener);

  // Flush spans when page is hidden (captures abandoned welcome sessions)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSpans();
    }
  });
});
