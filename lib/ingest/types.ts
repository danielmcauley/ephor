export type SourceObservation = {
  metricId: string;
  jurisdictionFips: string;
  periodKey: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd?: Date | null;
  value: number;
  benchmarkValue?: number | null;
  benchmarkLabel?: string | null;
  releaseDate?: Date | null;
  sourceUrl: string;
  metadata?: Record<string, unknown>;
};

export type SourceAdapter = {
  metricId: string;
  fetchObservations: () => Promise<SourceObservation[]>;
};

export type TextResponse = {
  body: string;
  sourceUrl: string;
  lastModified?: Date | null;
};

export type BinaryResponse = {
  body: Buffer;
  sourceUrl: string;
  lastModified?: Date | null;
};
