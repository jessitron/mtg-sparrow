import { initTelemetry, startSpan, endSpan, emitLog, flushSpans, getSessionId } from './telemetry/telemetry';
import { buildSelfAssessment, SELF_ASSESSMENT_MIN_CARDS } from './ui/self-assessment';
import { wireMenu } from './ui/menu';
import { setStorageRecordEvent } from './storage';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';
import { getUnlockedSubgroups } from './progression';
import { saveAssessment } from './self-assessment-store';
import { GuildSubgroup } from './session';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'assessment', 'multi_page');

  const recordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => {
    emitLog(name, undefined, attrs);
  };
  wireMenu({ appVersion: APP_VERSION, recordEvent, getSessionId, showResetProgress: true, showTraceLink: false });
  setStorageRecordEvent(recordEvent);

  setFeedbackContextProvider(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      'feedback.unlocked_levels': getUnlockedSubgroups().join(','),
      'feedback.assessment.subgroup': urlParams.get('subgroup') ?? '',
      'feedback.assessment.cards': urlParams.get('cards') ?? '',
    };
  });

  // Flush spans when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSpans();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const subgroup = urlParams.get('subgroup') || 'allied';
  const cards = parseInt(urlParams.get('cards') || '0', 10);
  const completed = urlParams.get('completed') === 'true';

  async function navigateToEnd(_assessment: string | null): Promise<void> {
    // Await flush before navigating so spans are exported before page unload
    await flushSpans();
    window.location.href = `end?subgroup=${subgroup}`;
  }

  // Skip assessment if fewer than minimum cards were shown
  if (cards < SELF_ASSESSMENT_MIN_CARDS) {
    navigateToEnd(null);
    return;
  }

  const app = document.getElementById('app');
  if (!app) return;

  const assessmentSection = buildSelfAssessment((value: string) => {
    saveAssessment(subgroup as GuildSubgroup, value);
    const span = startSpan('assessment', {
      'session.self_assessment': value,
      'session.subgroup': subgroup,
      'session.card_count': cards,
      'session.completed': completed,
      'app.version': APP_VERSION,
    });
    endSpan(span);
    navigateToEnd(value);
  });

  app.appendChild(assessmentSection);
});
