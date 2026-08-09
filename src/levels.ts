import { ColorCombo, colleges, alliedGuilds, enemyGuilds, wedges, shards } from './data/combos';

export type GuildSubgroup = 'allied' | 'enemy' | 'wedges' | 'shards' | 'colleges';

export interface LevelDefinition {
  id: GuildSubgroup;
  title: string;
  description: string;
  pool: ColorCombo[];
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 'allied',
    title: 'Allied Guilds',
    description: 'Allied guilds are pairs of neighboring colors. Hover or click for deets.',
    pool: alliedGuilds,
  },
  {
    id: 'enemy',
    title: 'Enemy Guilds',
    description: 'Enemy guilds pair colors from opposite sides of the circle.',
    pool: enemyGuilds,
  },
  {
    id: 'wedges',
    title: 'Wedges',
    description: 'Wedges combine one color with the two across from it.',
    pool: wedges,
  },
  {
    id: 'shards',
    title: 'Shards',
    description: 'Shards combine one color with the two on either side.',
    pool: shards,
  },
  {
    id: 'colleges',
    title: 'Strixhaven Colleges',
    description: 'Five magical schools, each built on the tension between two enemy colors.',
    pool: colleges,
  },
];
