import type { Theme } from './types';
import { classicThemes } from './classic';
import { modernThemes } from './modern';
import { extraThemes } from './extra';
import { designerThemes } from './designer';

export type { Theme };
export type { ThemeLayout, ThemeColors } from './types';
export const THEMES: Theme[] = [...classicThemes, ...modernThemes, ...extraThemes, ...designerThemes];

export interface ThemeGroup {
  label: string;
  themes: Theme[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  { label: '排版样式', themes: designerThemes },
  { label: '经典', themes: classicThemes },
  { label: '潮流', themes: modernThemes },
  { label: '更多风格', themes: extraThemes },
];
