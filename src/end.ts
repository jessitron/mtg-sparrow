import { initTelemetry, startSpan, startChildSpan, endSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { showSessionEndColumns, getEndPageContext } from './ui/guild-columns';
import { isSubgroupUnlocked, isEnemyUnlocked, getUnlockedSubgroups } from './progression';
import { wireSettings } from './ui/settings';
import { GuildSubgroup } from './session';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'end', 'multi_page');

  wireSettings(APP_VERSION);

  // Root span for the entire end-page visit — stays open until the user leaves
  const pageSpan = startSpan('end.page_view', {
    'app.version': APP_VERSION,
    'end.layout_version': 'reel_v2',
  });

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

  // Record session summary as a child if we arrived from a session
  const urlParams = new URLSearchParams(window.location.search);
  const subgroup = urlParams.get('subgroup');
  const cardsParam = urlParams.get('cards');
  const completedParam = urlParams.get('completed');
  const assessment = urlParams.get('assessment');

  if (subgroup) {
    const attrs: Record<string, string | number | boolean> = {
      'session.subgroup': subgroup,
    };
    if (cardsParam !== null) attrs['session.card_count'] = parseInt(cardsParam, 10);
    if (completedParam !== null) attrs['session.completed'] = completedParam === 'true';
    if (assessment !== null) attrs['session.self_assessment'] = assessment;

    const summarySpan = startChildSpan('session.summary', pageSpan, attrs);
    endSpan(summarySpan);
  }

  const app = document.getElementById('app');
  if (!app) return;

  const alliedUnlocked = isSubgroupUnlocked('allied');
  const enemyUnlocked = isEnemyUnlocked();
  const wedgesUnlocked = isSubgroupUnlocked('wedges');
  const shardsUnlocked = isSubgroupUnlocked('shards');

  setFeedbackContextProvider(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      'feedback.unlocked_levels': getUnlockedSubgroups().join(','),
      'feedback.end.subgroup': params.get('subgroup') ?? '',
      'feedback.end.cards': params.get('cards') ?? '',
      'feedback.end.completed': params.get('completed') ?? '',
      'feedback.end.assessment': params.get('assessment') ?? '',
      ...getEndPageContext(),
    };
  });

  const endCurrentSection = showSessionEndColumns(
    app,
    alliedUnlocked,
    enemyUnlocked,
    wedgesUnlocked,
    shardsUnlocked,
    pageSpan,
    (sub: GuildSubgroup, startedFrom: string) => {
      endCurrentSection();
      endSpan(pageSpan);
      flushSpans();
      window.location.href = `slides?subgroup=${sub}&from=${startedFrom}`;
    },
    (subgroup as GuildSubgroup) || undefined,
  );

  // End section + page spans and flush when the user leaves
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endCurrentSection();
      endSpan(pageSpan);
      flushSpans();
    }
  });
});
