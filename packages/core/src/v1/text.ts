import { Pipeline, Operation } from './pipeline';

export type TextData = string;
export type TextResult = { data: string; ratio: number };

export class TextPipeline extends Pipeline<TextData, TextResult> {
  constructor(data: TextData, ops: Operation[] = []) {
    super('text', data, ops, TextPipeline.exec);
  }

  trim() { return this.add('trim', {}) as TextPipeline; }
  minify() { return this.add('minify', {}) as TextPipeline; }
  compress(algo: 'gzip' | 'brotli' = 'gzip') { return this.add('compress', { algo }) as TextPipeline; }

  private static async exec(data: TextData, ops: Operation[]): Promise<TextResult> {
    const original = data.length;
    let result = data;
    for (const { name, params } of ops) result = await TextPipeline.run(result, name, params);
    return { data: result, ratio: original / result.length };
  }

  private static async run(data: TextData, op: string, params: any): Promise<TextData> {
    switch (op) {
      case 'trim': return trim(data);
      case 'minify': return minify(data);
      case 'compress': return compress(data, params.algo);
      default: throw new Error(`Unknown: ${op}`);
    }
  }
}

async function trim(data: TextData): Promise<TextData> {
  return data.replace(/\s+/g, ' ').trim();
}

async function minify(data: TextData): Promise<TextData> {
  console.log('Minify');
  return data;
}

async function compress(data: TextData, algo: string): Promise<TextData> {
  console.log(`Compress ${algo}`);
  return data;
}

