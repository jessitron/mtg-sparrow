import { initTelemetry, startSpan, startChildSpan, endSpan, emitLog, flushSpans, getTraceId, getSessionId } from './telemetry/telemetry';
import { showSessionEndColumns, getEndPageContext } from './ui/guild-columns';
import { isSubgroupUnlocked, getUnlockedSubgroups } from './progression';
import { wireMenu } from './ui/menu';
import { setStorageRecordEvent } from './storage';
import { GuildSubgroup } from './session';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';
import { initDebugMode, isDebugMode } from './debug';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'end', 'multi_page');
  initDebugMode(); // reloads if ?debug param present; otherwise no-op

  const debugMode = isDebugMode();

  // Root span for the entire end-page visit — stays open until the user leaves
  const pageSpan = startSpan('end.page_view', {
    'app.version': APP_VERSION,
    'end.layout_version': 'reel_v2',
  });

  const recordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => {
    emitLog(name, pageSpan, attrs);
  };
  wireMenu({ appVersion: APP_VERSION, recordEvent, getSessionId, showResetProgress: true, showTraceLink: true });
  setStorageRecordEvent(recordEvent);

  // Wire trace link in settings panel (must be after wireMenu which injects the DOM)
  const traceId = getTraceId(pageSpan);
  const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
  const traceContainer = document.getElementById('settings-trace-container');
  if (traceLink) {
    traceLink.href = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
  }
  if (traceContainer && debugMode) {
    traceContainer.hidden = false;
  }

  // Record session summary as a child if we arrived from a session
  const urlParams = new URLSearchParams(window.location.search);
  const subgroup = urlParams.get('subgroup');

  if (subgroup) {
    const summarySpan = startChildSpan('session.summary', pageSpan, {
      'session.subgroup': subgroup,
    });
    endSpan(summarySpan);
  }

  const app = document.getElementById('app');
  if (!app) return;

  const alliedUnlocked = isSubgroupUnlocked('allied');
  const enemyUnlocked = isSubgroupUnlocked('enemy');
  const wedgesUnlocked = isSubgroupUnlocked('wedges');
  const shardsUnlocked = isSubgroupUnlocked('shards');

  setFeedbackContextProvider(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      'feedback.unlocked_levels': getUnlockedSubgroups().join(','),
      'feedback.end.subgroup': params.get('subgroup') ?? '',
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
