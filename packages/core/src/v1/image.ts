import { Pipeline, Operation } from './pipeline'
import { PipelineResult, ImageDetails, calculateMetrics } from './types'

export type ImageData = Buffer | ArrayBuffer | Uint8Array
export type ImageResult = PipelineResult<ImageData, ImageDetails>

export class ImagePipeline extends Pipeline<ImageData, ImageResult> {
  private originalSize: number
  private currentWidth: number
  private currentHeight: number
  private originalWidth: number
  private originalHeight: number
  private currentFormat: string

  constructor(data: ImageData, ops: Operation[] = []) {
    super('image', data, ops, (d, o) => this.exec(d, o))
    this.originalSize = getByteLength(data)

    // Try to detect image dimensions from header
    const dimensions = detectImageDimensions(data)
    this.currentWidth = dimensions.width
    this.currentHeight = dimensions.height
    this.originalWidth = dimensions.width
    this.originalHeight = dimensions.height
    this.currentFormat = dimensions.format
  }

  resize(w: number, h: number): ImagePipeline {
    const pipeline = this.add('resize', { w, h }) as ImagePipeline
    pipeline.originalSize = this.originalSize
    pipeline.originalWidth = this.originalWidth
    pipeline.originalHeight = this.originalHeight
    pipeline.currentWidth = w
    pipeline.currentHeight = h
    pipeline.currentFormat = this.currentFormat
    return pipeline
  }

  quality(q: number): ImagePipeline {
    if (q < 0 || q > 100) throw new Error('Quality must be between 0 and 100')
    const pipeline = this.add('quality', { q }) as ImagePipeline
    pipeline.originalSize = this.originalSize
    pipeline.originalWidth = this.originalWidth
    pipeline.originalHeight = this.originalHeight
    pipeline.currentWidth = this.currentWidth
    pipeline.currentHeight = this.currentHeight
    pipeline.currentFormat = this.currentFormat
    return pipeline
  }

  format(fmt: 'jpg' | 'png' | 'webp'): ImagePipeline {
    const pipeline = this.add('format', { fmt }) as ImagePipeline
    pipeline.originalSize = this.originalSize
    pipeline.originalWidth = this.originalWidth
    pipeline.originalHeight = this.originalHeight
    pipeline.currentWidth = this.currentWidth
    pipeline.currentHeight = this.currentHeight
    pipeline.currentFormat = fmt
    return pipeline
  }

  private async exec(data: ImageData, ops: Operation[]): Promise<ImageResult> {
    let result = data
    const appliedOps: string[] = []

    for (const { name, params } of ops) {
      result = await ImagePipeline.run(result, name, params)
      appliedOps.push(name)
    }

    const finalSize = getByteLength(result)

    return {
      data: result,
      metrics: calculateMetrics(this.originalSize, finalSize),
      details: {
        width: this.currentWidth,
        height: this.currentHeight,
        originalWidth: this.originalWidth,
        originalHeight: this.originalHeight,
        format: this.currentFormat
      },
      operations: appliedOps
    }
  }

  private static async run(data: ImageData, op: string, params: any): Promise<ImageData> {
    switch (op) {
      case 'resize':
        return resize(data, params.w, params.h)
      case 'quality':
        return quality(data, params.q)
      case 'format':
        return format(data, params.fmt)
      default:
        throw new Error(`Unknown operation: ${op}`)
    }
  }
}

// ========== Helpers ==========

function getByteLength(data: ImageData): number {
  if (data instanceof Buffer) return data.length
  if (data instanceof ArrayBuffer) return data.byteLength
  if (data instanceof Uint8Array) return data.byteLength
  return 0
}

function detectImageDimensions(data: ImageData): { width: number; height: number; format: string } {
  let buffer: Buffer

  if (Buffer.isBuffer(data)) {
    buffer = data
  } else if (data instanceof Uint8Array) {
    buffer = Buffer.from(data)
  } else if (data instanceof ArrayBuffer) {
    buffer = Buffer.from(data)
  } else {
    return { width: 0, height: 0, format: 'unknown' }
  }

  if (buffer.length < 24) {
    return { width: 0, height: 0, format: 'unknown' }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height, format: 'png' }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    // Parse JPEG to find SOF marker for dimensions
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xFF) {
        offset++
        continue
      }
      const marker = buffer[offset + 1]
      // SOF0-SOF2 markers contain image dimensions
      if (marker >= 0xC0 && marker <= 0xC2) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height, format: 'jpg' }
      }
      const length = buffer.readUInt16BE(offset + 2)
      offset += 2 + length
    }
    return { width: 0, height: 0, format: 'jpg' }
  }

  // WebP: RIFF....WEBP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    // VP8 format
    if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
      const width = buffer.readUInt16LE(26) & 0x3FFF
      const height = buffer.readUInt16LE(28) & 0x3FFF
      return { width, height, format: 'webp' }
    }
    // VP8L format
    if (buffer.toString('ascii', 12, 16) === 'VP8L') {
      const bits = buffer.readUInt32LE(21)
      const width = (bits & 0x3FFF) + 1
      const height = ((bits >> 14) & 0x3FFF) + 1
      return { width, height, format: 'webp' }
    }
    return { width: 0, height: 0, format: 'webp' }
  }

  return { width: 0, height: 0, format: 'unknown' }
}

// Note: These are placeholder implementations
// Real image processing would require a library like sharp

async function resize(data: ImageData, w: number, h: number): Promise<ImageData> {
  // Placeholder: In production, use sharp or similar
  console.log(`[RobinWood] resize to ${w}x${h} - requires sharp library for actual processing`)
  return data
}

async function quality(data: ImageData, q: number): Promise<ImageData> {
  // Placeholder: In production, use sharp or similar
  console.log(`[RobinWood] quality ${q} - requires sharp library for actual processing`)
  return data
}

async function format(data: ImageData, fmt: string): Promise<ImageData> {
  // Placeholder: In production, use sharp or similar
  console.log(`[RobinWood] format ${fmt} - requires sharp library for actual processing`)
  return data
}
