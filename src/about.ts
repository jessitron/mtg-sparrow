import { initTelemetry, sendStartupSpan, startSpan, startChildSpan, endSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { wireSettings } from './ui/settings';
import { renderLogo } from './ui/logo';
import { APP_VERSION } from './version';
import { initDebugMode } from './debug';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'about', 'multi_page');
  sendStartupSpan(APP_VERSION);

  const signupFormEl = document.getElementById('convertkit-form');
  const hasSignupForm = signupFormEl !== null;

  const pageSpan = startSpan('about.page_view', {
    'app.version': APP_VERSION,
    'about.has_signup_form': hasSignupForm,
  });

  wireSettings(APP_VERSION);

  const debugMode = initDebugMode();

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
