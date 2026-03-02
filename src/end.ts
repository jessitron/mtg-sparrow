import { initTelemetry, startSpan, endSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { showSessionEndColumns } from './ui/guild-columns';
import { isSubgroupUnlocked, isEnemyUnlocked } from './progression';
import { wireSettings } from './ui/settings';
import { GuildSubgroup } from './session';

const APP_VERSION = '0.19.0';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'end', 'multi_page');

  wireSettings(APP_VERSION);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSpans();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const subgroup = urlParams.get('subgroup');
  const cardsParam = urlParams.get('cards');
  const completedParam = urlParams.get('completed');
  const assessment = urlParams.get('assessment');

  // Record session summary span if we arrived from a session
  if (subgroup) {
    const attrs: Record<string, string | number | boolean> = {
      'session.subgroup': subgroup,
      'app.version': APP_VERSION,
    };
    if (cardsParam !== null) attrs['session.card_count'] = parseInt(cardsParam, 10);
    if (completedParam !== null) attrs['session.completed'] = completedParam === 'true';
    if (assessment !== null) attrs['session.self_assessment'] = assessment;

    attrs['end.layout_version'] = 'rows_v1';
    const span = startSpan('session.summary', attrs);
    endSpan(span);

    // Wire trace link in settings panel
    const traceId = getTraceId(span);
    const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
    const traceContainer = document.getElementById('settings-trace-container');
    if (traceLink) {
      traceLink.href = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
    }
    if (traceContainer) {
      traceContainer.hidden = false;
    }
  }

  const app = document.getElementById('app');
  if (!app) return;

  const alliedUnlocked = isSubgroupUnlocked('allied');
  const enemyUnlocked = isEnemyUnlocked();

  showSessionEndColumns(
    app,
    alliedUnlocked,
    enemyUnlocked,
    (sub: GuildSubgroup, startedFrom: string) => {
      flushSpans();
      window.location.href = `slides?subgroup=${sub}&from=${startedFrom}`;
    },
  );
});
