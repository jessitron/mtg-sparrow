const STORAGE_KEY = 'sparrow-deck.progression';

type ProgressionState = {
  enemyUnlocked: boolean;
};

function loadProgression(): ProgressionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.enemyUnlocked === 'boolean') return parsed;
    }
  } catch {}
  return { enemyUnlocked: false };
}

function saveProgression(state: ProgressionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function isEnemyUnlocked(): boolean {
  return loadProgression().enemyUnlocked;
}

// Returns true if state actually changed (false→true), false if already unlocked
export function markEnemyUnlocked(): boolean {
  const state = loadProgression();
  if (!state.enemyUnlocked) {
    saveProgression({ ...state, enemyUnlocked: true });
    return true;
  }
  return false;
}
