const STORAGE_KEY = 'sparrow-deck.progression';

type ProgressionState = {
  enemyUnlocked?: boolean; // legacy, migrated on load
  unlockedSubgroups?: string[];
  completedSubgroups?: string[];
};

function loadProgression(): ProgressionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy enemyUnlocked field
      if (parsed.enemyUnlocked === true || (parsed.completedSubgroups ?? []).length > 0) {
        const unlockedSubgroups: string[] = parsed.unlockedSubgroups ?? [];
        // Seed from old enemyUnlocked flag
        if (parsed.enemyUnlocked === true && !unlockedSubgroups.includes('enemy')) {
          unlockedSubgroups.push('enemy');
        }
        // Completed subgroups imply unlocked
        for (const sub of (parsed.completedSubgroups ?? [])) {
          if (!unlockedSubgroups.includes(sub)) {
            unlockedSubgroups.push(sub);
          }
        }
        const migrated: ProgressionState = {
          unlockedSubgroups,
          completedSubgroups: parsed.completedSubgroups,
        };
        saveProgression(migrated);
        return migrated;
      }
      // Return as-is if already in new format
      return parsed as ProgressionState;
    }
  } catch {}
  return {};
}

function saveProgression(state: ProgressionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function isSubgroupUnlocked(subgroup: string): boolean {
  return (loadProgression().unlockedSubgroups ?? []).includes(subgroup);
}

// Returns true if state actually changed (not previously unlocked), false if already unlocked
export function markSubgroupUnlocked(subgroup: string): boolean {
  const state = loadProgression();
  const existing = state.unlockedSubgroups ?? [];
  if (!existing.includes(subgroup)) {
    saveProgression({ ...state, unlockedSubgroups: [...existing, subgroup] });
    return true;
  }
  return false;
}

// Backward-compatible aliases
export function isEnemyUnlocked(): boolean {
  return isSubgroupUnlocked('enemy');
}

export function markEnemyUnlocked(): boolean {
  return markSubgroupUnlocked('enemy');
}

export function hasCompletedSubgroup(subgroup: string): boolean {
  const state = loadProgression();
  return (state.completedSubgroups ?? []).includes(subgroup);
}

export function markSubgroupCompleted(subgroup: string): void {
  const state = loadProgression();
  const existing = state.completedSubgroups ?? [];
  if (!existing.includes(subgroup)) {
    saveProgression({ ...state, completedSubgroups: [...existing, subgroup] });
  }
}
