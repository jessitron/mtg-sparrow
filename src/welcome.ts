import { initTelemetry, sendStartupSpan, startSpan, startChildSpan, endSpan, emitLog, getTraceId, flushSpans, getSessionId } from './telemetry/telemetry';
import { wireMenu } from './ui/menu';
import { setStorageRecordEvent } from './storage';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';
import { getUnlockedSubgroups } from './progression';
import { initDebugMode, isDebugMode } from './debug';

let welcomeScreenLoadTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'welcome', 'multi_page');
  sendStartupSpan(APP_VERSION);
  initDebugMode(); // reloads if ?debug param present; otherwise no-op

  // Long-lived page span — parent for all welcome page activity
  const pageSpan = startSpan('welcome.page_view', { 'app.version': APP_VERSION });

  const debugMode = isDebugMode();
  const recordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => {
    emitLog(name, pageSpan, attrs);
  };
  wireMenu({ appVersion: APP_VERSION, recordEvent, getSessionId, showResetProgress: true, showTraceLink: true });
  setStorageRecordEvent(recordEvent);

  setFeedbackContextProvider(() => ({
    'feedback.unlocked_levels': getUnlockedSubgroups().join(','),
  }));

  // Wire trace link in settings panel (must be after wireSettings which injects the DOM)
  const traceId = getTraceId(pageSpan);
  const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
  const traceContainer = document.getElementById('settings-trace-container');
  if (traceLink) {
    traceLink.href = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
  }
  if (traceContainer && debugMode) {
    traceContainer.hidden = false;
  }

  welcomeScreenLoadTime = Date.now();

  document.querySelectorAll('.welcome-start-btn').forEach((btn) => {
    btn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const dwellMs = Date.now() - welcomeScreenLoadTime;
      pageSpan.setAttribute('welcome.dwell_ms', dwellMs);
      endSpan(pageSpan);
      flushSpans();
      window.location.href = `slides?subgroup=allied&from=welcome&welcome_dwell_ms=${dwellMs}`;
    });
  });

  // Minimize / restore welcome card
  const welcomeCard = document.getElementById('welcome-screen') as HTMLElement | null;
  const minimizeBtn = document.getElementById('welcome-minimize-btn') as HTMLButtonElement | null;
  const restoreBtn = document.getElementById('gas-restore-btn') as HTMLButtonElement | null;

  if (minimizeBtn && restoreBtn && welcomeCard) {
    minimizeBtn.addEventListener('click', () => {
      welcomeCard.classList.add('welcome--minimizing');
      welcomeCard.addEventListener('transitionend', () => {
        welcomeCard.classList.remove('welcome--minimizing');
        welcomeCard.classList.add('welcome--minimized');
        restoreBtn.style.display = 'flex';
      }, { once: true });
      const span = startChildSpan('welcome.minimize', pageSpan, {});
      span.end();
    });

    restoreBtn.addEventListener('click', () => {
      restoreBtn.style.display = 'none';
      welcomeCard.classList.remove('welcome--minimized');
      const span = startChildSpan('welcome.restore', pageSpan, {});
      span.end();
    });
  }

  // Mana gas drag telemetry — fired from mana-gas.js when a symbol is dragged and released
  window.addEventListener('mana-gas-drag', ((e: CustomEvent) => {
    const { color, duration_ms, release_vx, release_vy } = e.detail;
    const dragStartTime = Date.now() - duration_ms;
    const span = startChildSpan('mana_gas.drag', pageSpan, {
      'mana_gas.drag.color': color,
      'mana_gas.drag.duration_ms': duration_ms,
      'mana_gas.drag.release_vx': release_vx,
      'mana_gas.drag.release_vy': release_vy,
    }, dragStartTime);
    span.end();
  }) as EventListener);

  // Flush spans when page is hidden (captures abandoned welcome sessions)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endSpan(pageSpan);
      flushSpans();
    }
  });
});
