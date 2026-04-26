export interface CollectionEntry {
  sticker_num: string;
  count: number;
  history_taps: number;
  max_dups: number;
  is_favorite: boolean;
}

export interface StickerInfo {
  code: string;
  label: string;
  role: string;
  section: 'fcw' | 'team' | 'cc' | 'extra';
  group?: string;
  teamCode?: string;
  teamName?: string;
  extraIndex?: number;
  extraVariant?: 'BASE' | 'BRO' | 'SIL' | 'ORO';
  extraPlayerName?: string;
  extraCountry?: string;
}

export interface TeamDef {
  code: string;
  name: string;
  group: string;
  flag: string;
}

export type FilterType = 'all' | 'missing' | 'repeated';
