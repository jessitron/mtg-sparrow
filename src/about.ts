import { initTelemetry, sendStartupSpan, startSpan, startChildSpan, endSpan, emitLog, flushSpans, getTraceId, getSessionId } from './telemetry/telemetry';
import { wireMenu } from './ui/menu';
import { wireSoundToggle } from './ui/sound-toggle';
import { setStorageRecordEvent } from './storage';
import { renderLogo } from './ui/logo';
import { APP_VERSION } from './version';
import { initDebugMode, isDebugMode } from './debug';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'about', 'multi_page');
  sendStartupSpan(APP_VERSION);
  initDebugMode(); // reloads if ?debug param present; otherwise no-op

  const signupFormEl = document.getElementById('convertkit-form');
  const hasSignupForm = signupFormEl !== null;

  const pageSpan = startSpan('about.page_view', {
    'app.version': APP_VERSION,
    'about.has_signup_form': hasSignupForm,
  });

  const debugMode = isDebugMode();
  const recordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => {
    emitLog(name, pageSpan, attrs);
  };
  wireMenu({ appVersion: APP_VERSION, recordEvent, getSessionId, showResetProgress: true, showTraceLink: true });
  wireSoundToggle(recordEvent);
  setStorageRecordEvent(recordEvent);

  const logoContainer = document.getElementById('about-logo');
  if (logoContainer) {
    renderLogo(logoContainer);
  }

  // Track engagement with the signup form container
  if (signupFormEl) {
    signupFormEl.addEventListener('click', () => {
      const interactSpan = startChildSpan('about.signup_interact', pageSpan);
      endSpan(interactSpan);
    });
  }

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

  // End span and flush when user leaves
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endSpan(pageSpan);
      flushSpans();
    }
  });
});
