import { storageSetItem } from './storage';

const SOUND_ENABLED_KEY = 'mtg-sparrow.sound.enabled';

type RecordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => void;

export function isSoundEnabled(): boolean {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  // Default to on if never set
  return stored !== 'false';
}

export function setSoundEnabled(enabled: boolean, recordEvent: RecordEvent): void {
  storageSetItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
  recordEvent('sound.toggle', {
    'sound.enabled': enabled,
  });
}

// Reusable Audio element — prevents garbage collection mid-playback
// and avoids overlapping plays
let activeAudio: HTMLAudioElement | null = null;

/**
 * Play the pronunciation audio for a combo.
 * Returns 'success', 'disabled', or 'error' for use as a span attribute.
 */
export async function playComboAudio(comboId: string): Promise<'success' | 'disabled' | 'error'> {
  if (!isSoundEnabled()) {
    return 'disabled';
  }

  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudio = new Audio(`/audio/${comboId}.mp3`);
    await activeAudio.play();
    return 'success';
  } catch {
    return 'error';
  }
}
