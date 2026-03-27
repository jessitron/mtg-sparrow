import { storageSetItem } from './storage';

const STORAGE_KEY = 'sparrow-deck.progression';

type ProgressionState = {
  unlockedSubgroups?: string[];
  completedSubgroups?: string[];
};

function loadProgression(): ProgressionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as ProgressionState;
    }
  } catch {}
  return {};
}

function saveProgression(state: ProgressionState): void {
  try {
    storageSetItem(STORAGE_KEY, JSON.stringify(state));
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

export function hasCompletedSubgroup(subgroup: string): boolean {
  const state = loadProgression();
  return (state.completedSubgroups ?? []).includes(subgroup);
}

export function getUnlockedSubgroups(): string[] {
  return loadProgression().unlockedSubgroups ?? [];
}

export function markSubgroupCompleted(subgroup: string): void {
  const state = loadProgression();
  const existing = state.completedSubgroups ?? [];
  if (!existing.includes(subgroup)) {
    saveProgression({ ...state, completedSubgroups: [...existing, subgroup] });
  }
}
