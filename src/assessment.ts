import { initTelemetry, startSpan, endSpan, flushSpans } from './telemetry/telemetry';
import { buildSelfAssessment, SELF_ASSESSMENT_MIN_CARDS } from './ui/self-assessment';
import { wireSettings } from './ui/settings';

const APP_VERSION = '0.16.0';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'assessment', 'multi_page');

  wireSettings(APP_VERSION, () => null);

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

  function navigateToEnd(assessment: string | null): void {
    const params = new URLSearchParams({
      subgroup,
      cards: String(cards),
      completed: String(completed),
    });
    if (assessment !== null) {
      params.set('assessment', assessment);
    }
    flushSpans();
    window.location.href = `end.html?${params.toString()}`;
  }

  // Skip assessment if fewer than minimum cards were shown
  if (cards < SELF_ASSESSMENT_MIN_CARDS) {
    navigateToEnd(null);
    return;
  }

  const app = document.getElementById('app');
  if (!app) return;

  const assessmentSection = buildSelfAssessment((value: string) => {
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
