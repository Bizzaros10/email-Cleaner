export enum EmailStatus {
  VALID = 'VALID',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DISPOSABLE = 'DISPOSABLE',
  ROLE_BASED = 'ROLE_BASED',
  TYPO_DOMAIN = 'TYPO_DOMAIN',
  DUPLICATE = 'DUPLICATE',
  MISSING_MX = 'MISSING_MX' // Reserved for future backend integration
}

export interface EmailRecord {
  original: string;
  email: string;
  status: EmailStatus;
  sourceFile: string;
  [key: string]: string | number; // Allow other columns to persist
}

export interface CleaningStats {
  totalProcessed: number;
  totalValid: number;
  totalDuplicates: number;
  invalidBreakdown: {
    [key in EmailStatus]?: number;
  };
}

export interface ProcessingResult {
  stats: CleaningStats;
  validRecords: EmailRecord[];
  invalidRecords: EmailRecord[];
}