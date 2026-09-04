export interface Source {
  id: string;
  name: string;
  url: string;
  isFile?: boolean;
  filePath?: string;
}

export interface Category {
  id: string;
  name: string;
  sources: Source[];
  collapsed?: boolean;
  color?: string;
}

export interface OpenCountRecord {
  count: number;
  lastOpened: string;
}

export interface AppConfig {
  version: string;
  categories: Category[];
  openCounts: Record<string, OpenCountRecord>;
  settings?: {
    theme?: string;
  };
}

export const SPECIAL_CATEGORY_IDS = {
  FREQUENTLY_OPENED: '__frequently_opened__',
} as const;
