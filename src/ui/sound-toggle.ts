import { isSoundEnabled, setSoundEnabled } from '../audio';

type RecordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => void;

const speakerOnSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
</svg>`;

const speakerOffSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <line x1="23" y1="9" x2="17" y2="15"/>
  <line x1="17" y1="9" x2="23" y2="15"/>
</svg>`;

export function wireSoundToggle(recordEvent: RecordEvent): void {
  const btn = document.createElement('button');
  btn.id = 'sound-toggle-btn';
  btn.className = 'sound-toggle-btn';

  let enabled = isSoundEnabled();

  function updateIcon(): void {
    btn.innerHTML = enabled ? speakerOnSvg : speakerOffSvg;
    btn.title = enabled ? 'Sound on — click to mute' : 'Sound off — click to unmute';
    btn.setAttribute('aria-label', enabled ? 'Mute sound' : 'Unmute sound');
  }

  updateIcon();

  btn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    enabled = !enabled;
    setSoundEnabled(enabled, recordEvent);
    updateIcon();
  });

  document.body.appendChild(btn);
}
