export type PracticeMode = 'normal' | 'strict' | 'always-strict';

export const INTERVALS = [30, 60, 90] as const;

export const DEFAULT_INTERVAL = 60;
export const DEFAULT_MODE: PracticeMode = 'normal';

export const STRICT_COUNTDOWN = 300; // 5 minutes in seconds
export const ALWAYS_STRICT_COUNTDOWN = 300; // 5 minutes in seconds

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
