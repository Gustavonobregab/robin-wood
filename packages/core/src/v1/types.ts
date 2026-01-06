/**
 * Compression/optimization metrics returned by all pipelines
 */
export type Metrics = {
  /** Original size in bytes (for binary) or characters (for text) */
  originalSize: number
  /** Final size after processing */
  finalSize: number
  /** Bytes/chars saved (originalSize - finalSize) */
  savedSize: number
  /** Compression ratio (originalSize / finalSize). Ex: 2.0 means compressed to half */
  ratio: number
  /** Percentage saved. Ex: 50 means saved 50% */
  percentage: number
}

/**
 * Audio-specific details
 */
export type AudioDetails = {
  /** Duration in seconds */
  duration: number
  /** Sample rate in Hz */
  sampleRate: number
  /** Original duration before processing */
  originalDuration: number
  /** Seconds of silence removed (if removeSilence was applied) */
  silenceRemoved: number
}

/**
 * Text-specific details
 */
export type TextDetails = {
  /** Character count after processing */
  charCount: number
  /** Original character count */
  originalCharCount: number
}

/**
 * Image-specific details
 */
export type ImageDetails = {
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Original width */
  originalWidth: number
  /** Original height */
  originalHeight: number
  /** Image format */
  format: string
}

/**
 * Generic pipeline result structure
 */
export type PipelineResult<TData, TDetails> = {
  /** Processed data */
  data: TData
  /** Compression/optimization metrics */
  metrics: Metrics
  /** Type-specific details */
  details: TDetails
  /** List of operations applied */
  operations: string[]
}

/**
 * Helper to calculate metrics
 */
export function calculateMetrics(originalSize: number, finalSize: number): Metrics {
  const savedSize = originalSize - finalSize
  const ratio = finalSize > 0 ? originalSize / finalSize : 0
  const percentage = originalSize > 0 ? (savedSize / originalSize) * 100 : 0

  return {
    originalSize,
    finalSize,
    savedSize,
    ratio: Math.round(ratio * 100) / 100,
    percentage: Math.round(percentage * 100) / 100
  }
}
