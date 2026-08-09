import { SpanStatusCode } from '@opentelemetry/api';
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

  const signupFormEl = document.getElementById('signup-form') as HTMLFormElement | null;
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

  // Wire the FluentCRM newsletter signup form
  if (signupFormEl) {
    const FLUENTCRM_ENDPOINT = 'https://shiprise.com/?fluentcrm=1&route=contact&hash=31428679-dba5-4c2a-ba37-0efe38f90ec9';
    const LEAD_SOURCE = 'mtgcolors-quest-about';
    const emailEl = document.getElementById('signup-email') as HTMLInputElement | null;
    const nameEl = document.getElementById('signup-full-name') as HTMLInputElement | null;
    const honeypotEl = document.getElementById('signup-website') as HTMLInputElement | null;
    const submitEl = signupFormEl.querySelector('.signup-submit') as HTMLButtonElement | null;
    const statusEl = document.getElementById('signup-status');

    const setStatus = (message: string, isError: boolean) => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.toggle('is-error', isError);
    };

    let submitting = false;
    signupFormEl.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting) return;

      // Honeypot: silently pretend success for bots that fill the hidden field
      if (honeypotEl && honeypotEl.value.trim() !== '') {
        emitLog('about.signup_honeypot', pageSpan);
        setStatus("Thanks! You're subscribed.", false);
        signupFormEl.reset();
        return;
      }

      const email = emailEl?.value.trim() ?? '';
      const fullName = nameEl?.value.trim() ?? '';
      if (!email || !fullName) {
        setStatus('Please enter your name and email.', true);
        return;
      }

      const submitSpan = startChildSpan('about.signup_submit', pageSpan, {
        'app.version': APP_VERSION,
        'signup.lead_source': LEAD_SOURCE,
      });

      submitting = true;
      if (submitEl) submitEl.disabled = true;
      setStatus('Subscribing…', false);

      const payload = new URLSearchParams({
        email,
        full_name: fullName,
        lead_source: LEAD_SOURCE,
      });

      try {
        const response = await fetch(FLUENTCRM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        submitSpan.setStatus({ code: SpanStatusCode.OK });
        emitLog('about.signup_success', submitSpan);
        setStatus('Thanks! Look for a confirmation email from Avdi & Jessitron at ShipRise.', false);
        signupFormEl.reset();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        submitSpan.setStatus({ code: SpanStatusCode.ERROR, message });
        submitSpan.setAttribute('error', true);
        emitLog('about.signup_error', submitSpan, { 'error.message': message });
        setStatus('Something went wrong. Please try again.', true);
      } finally {
        endSpan(submitSpan);
        submitting = false;
        if (submitEl) submitEl.disabled = false;
      }
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
