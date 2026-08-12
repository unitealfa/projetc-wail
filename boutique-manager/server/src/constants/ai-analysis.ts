export const AI_ANALYSIS_STATUS = {
  PENDING: 'PENDING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;

export type AiAnalysisStatus = (typeof AI_ANALYSIS_STATUS)[keyof typeof AI_ANALYSIS_STATUS];
