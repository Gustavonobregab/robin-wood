import { Pipeline, Operation } from './pipeline';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

export type AudioData = Buffer | ArrayBuffer | Uint8Array;

export type AudioResult = {
    data: AudioData
    duration: number
    sampleRate: number
}

export class AudioPipeline extends Pipeline<AudioData, AudioResult> {
    constructor(data: AudioData, ops: Operation[] = []) {
        // 1. SECURITY: Validate input format
        AudioPipeline.validateInput(data);
        super('audio', data, ops, AudioPipeline.exec)
    }

    speedup(rate: number): AudioPipeline {
        // FFmpeg 'atempo' filter limits are technically 0.5 to 2.0,
        // but we handle chaining in the implementation, so we allow a wider range here.
        if (rate < 0.25 || rate > 100) throw new Error('Speed rate must be between 0.25 and 100');
        return this.add('speedup', { rate }) as AudioPipeline
    }

    normalize(): AudioPipeline {
        return this.add('normalize', {}) as AudioPipeline
    }

    removeSilence(thresholdDb = -40, minDurationMs = 100): AudioPipeline {
        return this.add('removeSilence', { thresholdDb, minDurationMs }) as AudioPipeline
    }

    volume(level: number): AudioPipeline {
        if (level < 0 || level > 2) throw new Error('Volume level must be between 0 and 2');
        return this.add('volume', { level }) as AudioPipeline
    }

    // --- Validation Logic ---
    private static validateInput(data: AudioData): void {
        let buffer: Buffer;

        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            return;
        }

        if (buffer.length < 12) return;

        const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
        const isWave = buffer.toString('ascii', 8, 12) === 'WAVE';
        if (isRiff && isWave) {
            throw new Error("[RobinWood] Error: Raw WAV file detected. Please decode to Float32 PCM first.");
        }

        const isFtyp = buffer.toString('ascii', 4, 8) === 'ftyp';
        if (isFtyp) {
            throw new Error("[RobinWood] Error: MP4/AAC detected. Please decode audio first.");
        }
    }

    private static async exec(data: AudioData, ops: Operation[]): Promise<AudioResult> {
        let result = data;
        const sampleRate = 44100;

        for (const { name, params } of ops) {
            // result is updated step by step
            result = await AudioPipeline.run(result, name, params);
        }

        const float32 = toFloat32Array(result);
        const duration = float32.length / sampleRate;

        return { data: result, duration, sampleRate };
    }

    private static async run(data: AudioData, op: string, params: any): Promise<AudioData> {
        switch (op) {
            case 'speedup':
                // NOW USES FFMPEG
                return speedupWithFFmpeg(data, params.rate);
            case 'normalize':
                return normalize(data);
            case 'removeSilence':
                return removeSilence(data, params.thresholdDb, params.minDurationMs);
            case 'volume':
                return volume(data, params.level);
            default:
                throw new Error(`Unknown operation: ${op}`);
        }
    }
}

// ========== Helpers ==========

function toFloat32Array(data: AudioData): Float32Array {
    if (data instanceof Buffer) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    }
    if (data instanceof ArrayBuffer) {
        return new Float32Array(data);
    }
    if (data instanceof Uint8Array) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    }
    throw new Error('Unsupported audio data type');
}

function toBuffer(data: Float32Array): Buffer {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

function dbToAmplitude(db: number): number {
    const clampedDb = Math.max(-60, Math.min(0, db));
    return Math.pow(10, clampedDb / 20);
}

// ========== Operations ==========

/**
 * 🚀 NEW: High Quality Speedup using FFmpeg 'atempo' filter.
 * This preserves pitch (no chipmunk effect) and avoids aliasing noise.
 */
/**
 * 🚀 NEW: High Quality Speedup using FFmpeg 'atempo' filter.
 * This preserves pitch (no chipmunk effect) and avoids aliasing noise.
 */
async function speedupWithFFmpeg(data: AudioData, rate: number): Promise<AudioData> {
    return new Promise((resolve, reject) => {
        // 1. Convert Buffer to Readable Stream
        let buffer: Buffer;

        // CORREÇÃO: Resolvemos os tipos separadamente para evitar o erro TS2769
        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            return reject(new Error("Invalid data type for FFmpeg processing"));
        }

        const inputStream = new Readable();
        inputStream.push(buffer);
        inputStream.push(null); // Signal end of stream

        // 2. Prepare Output Stream (to collect results)
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => {
            const resultBuffer = Buffer.concat(chunks);
            resolve(resultBuffer);
        });
        outputStream.on('error', (err) => reject(err));

        // 3. Construct FFmpeg Filters
        // The 'atempo' filter is limited to [0.5, 2.0].
        // For higher rates (e.g., 4.0), we must chain them: "atempo=2.0,atempo=2.0"
        const filters: string[] = [];
        let remainingRate = rate;

        while (remainingRate > 2.0) {
            filters.push('atempo=2.0');
            remainingRate /= 2.0;
        }
        while (remainingRate < 0.5) {
            filters.push('atempo=0.5');
            remainingRate /= 0.5;
        }
        // Push the remainder (if it's not exactly 1.0)
        if (remainingRate !== 1.0) {
            filters.push(`atempo=${remainingRate}`);
        }

        // 4. Run FFmpeg Pipeline
        ffmpeg(inputStream)
            // Input settings: We must tell FFmpeg exactly what this raw stream is
            .inputFormat('f32le')
            .audioFrequency(44100)
            .audioChannels(1)
            // Processing
            .audioFilters(filters)
            // Output settings
            .format('f32le')
            .audioCodec('pcm_f32le')
            .pipe(outputStream, { end: true });
    });
}

async function normalize(data: AudioData): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
        peak = Math.max(peak, Math.abs(audioData[i]));
    }
    if (peak === 0) return data;

    const normalized = new Float32Array(audioData.length);
    const scale = 1.0 / peak;

    for (let i = 0; i < audioData.length; i++) {
        normalized[i] = audioData[i] * scale;
    }
    return toBuffer(normalized);
}

async function removeSilence(
    data: AudioData,
    thresholdDb: number,
    minDurationMs: number
): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    const sampleRate = 44100;
    const threshold = dbToAmplitude(thresholdDb);
    const minSamples = Math.floor((minDurationMs / 1000) * sampleRate);

    const silentRanges: Array<{ start: number; end: number }> = [];
    let startSilence = -1;
    let silenceCount = 0;

    for (let i = 0; i < audioData.length; i++) {
        const amplitude = Math.abs(audioData[i]);
        if (amplitude < threshold) {
            silenceCount++;
            if (startSilence === -1) startSilence = i;
        } else {
            if (startSilence !== -1 && silenceCount >= minSamples) {
                silentRanges.push({ start: startSilence, end: i });
            }
            startSilence = -1;
            silenceCount = 0;
        }
    }

    if (startSilence !== -1 && silenceCount >= minSamples) {
        silentRanges.push({ start: startSilence, end: audioData.length });
    }

    if (silentRanges.length === 0) return data;

    let totalSamples = audioData.length;
    for (const range of silentRanges) {
        totalSamples -= range.end - range.start;
    }

    const newAudio = new Float32Array(totalSamples);
    let newIndex = 0;
    let lastEnd = 0;

    for (const range of silentRanges) {
        const samplesToCopy = range.start - lastEnd;
        newAudio.set(audioData.slice(lastEnd, range.start), newIndex);
        newIndex += samplesToCopy;
        lastEnd = range.end;
    }

    if (lastEnd < audioData.length) {
        newAudio.set(audioData.slice(lastEnd), newIndex);
    }
    return toBuffer(newAudio);
}

async function volume(data: AudioData, level: number): Promise<AudioData> {
    const audioData = toFloat32Array(data);
    const adjusted = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
        adjusted[i] = audioData[i] * level;
    }
    return toBuffer(adjusted);
}