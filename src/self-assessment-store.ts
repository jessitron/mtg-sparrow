import { GuildSubgroup } from './session';

const STORAGE_KEY = 'sparrow-deck.self-assessment';

type SelfAssessmentState = Partial<Record<GuildSubgroup, string>>;

function load(): SelfAssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as SelfAssessmentState;
    }
  } catch {}
  return {};
}

function save(state: SelfAssessmentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function saveAssessment(subgroup: GuildSubgroup, value: string): void {
  const state = load();
  state[subgroup] = value;
  save(state);
}

export function getAssessment(subgroup: GuildSubgroup): string | undefined {
  return load()[subgroup];
}

export function getAllAssessments(): SelfAssessmentState {
  return load();
}
