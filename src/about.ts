import { initTelemetry, sendStartupSpan, startSpan, endSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { wireSettings } from './ui/settings';
import { APP_VERSION } from './version';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'about', 'multi_page');
  sendStartupSpan(APP_VERSION);

  const pageSpan = startSpan('about.page_view', { 'app.version': APP_VERSION });

  // Wire trace link in settings panel
  const traceId = getTraceId(pageSpan);
  const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
  const traceContainer = document.getElementById('settings-trace-container');
  if (traceLink) {
    traceLink.href = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
  }
  if (traceContainer) {
    traceContainer.hidden = false;
  }

  wireSettings(APP_VERSION);

  // End span and flush when user leaves
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endSpan(pageSpan);
      flushSpans();
    }
  });
});
