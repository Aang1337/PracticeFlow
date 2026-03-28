export type PracticeMode = 'normal' | 'strict' | 'always-strict';

export interface IntervalOption {
  value: number;
  label: string;
}

export interface ModeOption {
  value: PracticeMode;
  label: string;
  description: string;
  icon: string;
}

export const INTERVAL_OPTIONS: IntervalOption[] = [
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '1m' },
  { value: 90, label: '1m 30s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
  { value: 300, label: '5m' },
];

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    description: 'Resume anytime — the overlay is a gentle nudge.',
    icon: '🟢',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Wait 10 seconds before you can resume.',
    icon: '🟡',
  },
  {
    value: 'always-strict',
    label: 'Always Strict',
    description: 'Must wait the full countdown every time.',
    icon: '🔴',
  },
];

export const DEFAULT_INTERVAL = 45;
export const DEFAULT_MODE: PracticeMode = 'always-strict';
export const STRICT_COUNTDOWN = 10;
export const ALWAYS_STRICT_COUNTDOWN = 300;
export const CONTROLS_HIDE_DELAY = 3000;
export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
