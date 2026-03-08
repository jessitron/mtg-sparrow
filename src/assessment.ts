import { initTelemetry, startSpan, endSpan, flushSpans } from './telemetry/telemetry';
import { buildSelfAssessment, SELF_ASSESSMENT_MIN_CARDS } from './ui/self-assessment';
import { wireSettings } from './ui/settings';
import { APP_VERSION } from './version';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'assessment', 'multi_page');

  wireSettings(APP_VERSION);

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

  async function navigateToEnd(assessment: string | null): Promise<void> {
    const params = new URLSearchParams({
      subgroup,
      cards: String(cards),
      completed: String(completed),
    });
    if (assessment !== null) {
      params.set('assessment', assessment);
    }
    // Await flush before navigating so spans are exported before page unload
    await flushSpans();
    window.location.href = `end?${params.toString()}`;
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
