import { initTelemetry, sendStartupSpan } from './telemetry/telemetry';
import { guilds } from './data/combos';
import { renderCard } from './ui/render';

export const APP_VERSION = '0.1.0';

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION);
  sendStartupSpan(APP_VERSION);

  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = `v${APP_VERSION}`;
  }

  const app = document.getElementById('app');
  if (!app) return;

  let currentIndex = Math.floor(Math.random() * guilds.length);

  function showGuild() {
    if (!app) return;
    app.innerHTML = '';
    const card = renderCard(guilds[currentIndex]);
    card.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % guilds.length;
      showGuild();
    });
    card.style.cursor = 'pointer';
    app.appendChild(card);
  }

  showGuild();
});
