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
        // shiprise.com sends CORS headers on this endpoint, so we can read the
        // response and detect real failures instead of firing blind.
        const response = await fetch(FLUENTCRM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
        });
        submitSpan.setAttribute('http.response.status_code', response.status);
        if (!response.ok) {
          throw new Error(`FluentCRM responded with ${response.status}`);
        }
        submitSpan.setStatus({ code: SpanStatusCode.OK });
        emitLog('about.signup_success', submitSpan);

        // Replace the form (and its inline privacy disclaimer) with a
        // confirmation echoing back the email the user entered.
        const confirmation = document.createElement('div');
        confirmation.className = 'signup-confirmation';

        const heading = document.createElement('p');
        heading.className = 'signup-confirmation-heading';
        heading.textContent = `Thanks! You're subscribed at ${email}.`;

        const note = document.createElement('p');
        note.className = 'signup-confirmation-note';
        note.textContent = 'Look for a confirmation email from Avdi & Jessitron at ShipRise.';

        confirmation.append(heading, note);
        signupFormEl.replaceWith(confirmation);
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
