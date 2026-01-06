import { Pipeline, Operation } from './pipeline'
import { PipelineResult, TextDetails, calculateMetrics } from './types'

export type TextData = string
export type TextResult = PipelineResult<string, TextDetails>

export class TextPipeline extends Pipeline<TextData, TextResult> {
  private originalSize: number

  constructor(data: TextData, ops: Operation[] = []) {
    super('text', data, ops, (d, o) => this.exec(d, o))
    this.originalSize = data.length
  }

  trim(): TextPipeline {
    const pipeline = this.add('trim', {}) as TextPipeline
    pipeline.originalSize = this.originalSize
    return pipeline
  }

  minify(): TextPipeline {
    const pipeline = this.add('minify', {}) as TextPipeline
    pipeline.originalSize = this.originalSize
    return pipeline
  }

  compress(algo: 'gzip' | 'brotli' = 'gzip'): TextPipeline {
    const pipeline = this.add('compress', { algo }) as TextPipeline
    pipeline.originalSize = this.originalSize
    return pipeline
  }

  private async exec(data: TextData, ops: Operation[]): Promise<TextResult> {
    let result = data
    const appliedOps: string[] = []

    for (const { name, params } of ops) {
      result = await TextPipeline.run(result, name, params)
      appliedOps.push(name)
    }

    const finalSize = result.length

    return {
      data: result,
      metrics: calculateMetrics(this.originalSize, finalSize),
      details: {
        charCount: finalSize,
        originalCharCount: this.originalSize
      },
      operations: appliedOps
    }
  }

  private static async run(data: TextData, op: string, params: any): Promise<TextData> {
    switch (op) {
      case 'trim':
        return trim(data)
      case 'minify':
        return minify(data)
      case 'compress':
        return compress(data, params.algo)
      default:
        throw new Error(`Unknown operation: ${op}`)
    }
  }
}

async function trim(data: TextData): Promise<TextData> {
  return data.replace(/\s+/g, ' ').trim()
}

async function minify(data: TextData): Promise<TextData> {
  // Remove multiple newlines, extra spaces, trim each line
  return data
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/\n{2,}/g, '\n')
}

async function compress(data: TextData, algo: string): Promise<TextData> {
  // Note: For text sent to LLMs, we typically want readable text, not binary compressed
  // This function applies text-level compression (removing redundancy)
  // For actual gzip/brotli, the user should handle encoding separately

  if (algo === 'gzip' || algo === 'brotli') {
    // Apply aggressive whitespace removal for LLM context optimization
    return data
      .replace(/\s+/g, ' ')
      .replace(/\s*([,.:;!?])\s*/g, '$1 ')
      .trim()
  }

  return data
}
