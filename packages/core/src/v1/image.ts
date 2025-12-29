import { Pipeline, Operation } from './pipeline';

export type ImageData = Buffer | ArrayBuffer | Uint8Array;
export type ImageResult = { data: ImageData; width: number; height: number };

export class ImagePipeline extends Pipeline<ImageData, ImageResult> {
  constructor(data: ImageData, ops: Operation[] = []) {
    super('image', data, ops, ImagePipeline.exec);
  }

  resize(w: number, h: number) { return this.add('resize', { w, h }) as ImagePipeline; }
  quality(q: number) { return this.add('quality', { q }) as ImagePipeline; }
  format(fmt: 'jpg' | 'png' | 'webp') { return this.add('format', { fmt }) as ImagePipeline; }

  private static async exec(data: ImageData, ops: Operation[]): Promise<ImageResult> {
    let result = data;
    for (const { name, params } of ops) result = await ImagePipeline.run(result, name, params);
    return { data: result, width: 0, height: 0 };
  }

  private static async run(data: ImageData, op: string, params: any): Promise<ImageData> {
    switch (op) {
      case 'resize': return resize(data, params.w, params.h);
      case 'quality': return quality(data, params.q);
      case 'format': return format(data, params.fmt);
      default: throw new Error(`Unknown: ${op}`);
    }
  }
}

async function resize(data: ImageData, w: number, h: number): Promise<ImageData> {
  console.log(`Resize ${w}x${h}`);
  return data;
}

async function quality(data: ImageData, q: number): Promise<ImageData> {
  console.log(`Quality ${q}`);
  return data;
}

async function format(data: ImageData, fmt: string): Promise<ImageData> {
  console.log(`Format ${fmt}`);
  return data;
}

