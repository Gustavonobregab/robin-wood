import { Pipeline, Operation } from './pipeline'

export type AudioData = Buffer | ArrayBuffer | Uint8Array

export type AudioResult = {
    data: AudioData
    duration: number
    sampleRate: number
}

export class AudioPipeline extends Pipeline<AudioData, AudioResult> {
    constructor(data: AudioData, ops: Operation[] = []) {
        // 1. SECURITY: Validate if dev didn't send a file with header (MP3/WAV) by mistake
        AudioPipeline.validateInput(data);

        super('audio', data, ops, AudioPipeline.exec)
    }

    speedup(rate: number): AudioPipeline {
        if (rate <= 0 || rate > 4) throw new Error('Speed rate must be between 0 and 4')
        return this.add('speedup', { rate }) as AudioPipeline
    }

    normalize(): AudioPipeline {
        return this.add('normalize', {}) as AudioPipeline
    }

    removeSilence(thresholdDb = -40, minDurationMs = 100): AudioPipeline {
        return this.add('removeSilence', { thresholdDb, minDurationMs }) as AudioPipeline
    }

    volume(level: number): AudioPipeline {
        if (level < 0 || level > 2) throw new Error('Volume level must be between 0 and 2')
        return this.add('volume', { level }) as AudioPipeline
    }

    // --- Validation Logic (Guard Clause) ---
    private static validateInput(data: AudioData): void {
        let buffer: Buffer;

        // FIX HERE: Separate checks so TypeScript doesn't get lost in types
        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            return; // Unknown type, let it pass (will likely fail later)
        }

        // If buffer is too small, don't even try to validate
        if (buffer.length < 12) return;

        // Check WAV Signature (RIFF....WAVE)
        const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
        const isWave = buffer.toString('ascii', 8, 12) === 'WAVE';

        if (isRiff && isWave) {
            throw new Error(
                "[RobinWood] Error: You passed a raw WAV file (with header). " +
                "This library expects decoded audio data (Float32 PCM Array). " +
                "Please decode the file (remove the header and convert to float) before passing it to the pipeline."
            );
        }

        // Check MP4/M4A Signature (....ftyp)
        const isFtyp = buffer.toString('ascii', 4, 8) === 'ftyp';
        if (isFtyp) {
            throw new Error(
                "[RobinWood] Error: You passed an MP4/AAC file. " +
                "This library does not decode compressed audio. " +
                "Please convert to RAW PCM (Float32) before using."
            );
        }

        // Check MP3 Signature (ID3)
        const isId3 = buffer.toString('ascii', 0, 3) === 'ID3';
        if (isId3) {
            throw new Error(
                "[RobinWood] Error: You passed an MP3 file. " +
                "This library does not decode compressed audio. " +
                "Please convert to RAW PCM (Float32) before using."
            );
        }
    }

    private static async exec(data: AudioData, ops: Operation[]): Promise<AudioResult> {
        let result = data
        const sampleRate = 44100

        for (const { name, params } of ops) {
            result = await AudioPipeline.run(result, name, params)
        }

        const float32 = toFloat32Array(result)
        const duration = float32.length / sampleRate

        return { data: result, duration, sampleRate }
    }

    private static async run(data: AudioData, op: string, params: any): Promise<AudioData> {
        switch (op) {
            case 'speedup':
                return speedup(data, params.rate)
            case 'normalize':
                return normalize(data)
            case 'removeSilence':
                return removeSilence(data, params.thresholdDb, params.minDurationMs)
            case 'volume':
                return volume(data, params.level)
            default:
                throw new Error(`Unknown operation: ${op}`)
        }
    }
}

// ========== Helpers ==========

function toFloat32Array(data: AudioData): Float32Array {
    if (data instanceof Buffer) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4)
    }
    if (data instanceof ArrayBuffer) {
        return new Float32Array(data)
    }
    if (data instanceof Uint8Array) {
        return new Float32Array(data.buffer, data.byteOffset, data.length / 4)
    }
    throw new Error('Unsupported audio data type')
}

function toBuffer(data: Float32Array): Buffer {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
}

function dbToAmplitude(db: number): number {
    const clampedDb = Math.max(-60, Math.min(0, db))
    return Math.pow(10, clampedDb / 20)
}


async function speedup(data: AudioData, rate: number): Promise<AudioData> {
    const audioData = toFloat32Array(data)
    const originalLength = audioData.length
    const newLength = Math.floor(originalLength / rate)
    const newAudio = new Float32Array(newLength)

    for (let i = 0; i < newLength; i++) {
        const originalIndex = i * rate
        const index1 = Math.floor(originalIndex)
        const index2 = Math.min(index1 + 1, originalLength - 1)
        const fraction = originalIndex - index1

        const sample1 = audioData[index1] || 0
        const sample2 = audioData[index2] || 0
        newAudio[i] = sample1 + (sample2 - sample1) * fraction
    }

    return toBuffer(newAudio)
}

async function normalize(data: AudioData): Promise<AudioData> {
    const audioData = toFloat32Array(data)

    let peak = 0
    for (let i = 0; i < audioData.length; i++) {
        peak = Math.max(peak, Math.abs(audioData[i]))
    }

    if (peak === 0) return data

    const normalized = new Float32Array(audioData.length)
    const scale = 1.0 / peak

    for (let i = 0; i < audioData.length; i++) {
        normalized[i] = audioData[i] * scale
    }

    return toBuffer(normalized)
}

async function removeSilence(
    data: AudioData,
    thresholdDb: number,
    minDurationMs: number
): Promise<AudioData> {
    const audioData = toFloat32Array(data)
    const sampleRate = 44100
    const threshold = dbToAmplitude(thresholdDb)
    const minSamples = Math.floor((minDurationMs / 1000) * sampleRate)

    // Detect silence ranges
    const silentRanges: Array<{ start: number; end: number }> = []
    let startSilence = -1
    let silenceCount = 0

    for (let i = 0; i < audioData.length; i++) {
        const amplitude = Math.abs(audioData[i])

        if (amplitude < threshold) {
            silenceCount++
            if (startSilence === -1) startSilence = i
        } else {
            if (startSilence !== -1 && silenceCount >= minSamples) {
                silentRanges.push({ start: startSilence, end: i })
            }
            startSilence = -1
            silenceCount = 0
        }
    }

    if (startSilence !== -1 && silenceCount >= minSamples) {
        silentRanges.push({ start: startSilence, end: audioData.length })
    }

    if (silentRanges.length === 0) return data

    // Calculate new length
    let totalSamples = audioData.length
    for (const range of silentRanges) {
        totalSamples -= range.end - range.start
    }

    // Build new audio without silence
    const newAudio = new Float32Array(totalSamples)
    let newIndex = 0
    let lastEnd = 0

    for (const range of silentRanges) {
        const samplesToCopy = range.start - lastEnd
        newAudio.set(audioData.slice(lastEnd, range.start), newIndex)
        newIndex += samplesToCopy
        lastEnd = range.end
    }

    if (lastEnd < audioData.length) {
        newAudio.set(audioData.slice(lastEnd), newIndex)
    }

    return toBuffer(newAudio)
}

async function volume(data: AudioData, level: number): Promise<AudioData> {
    const audioData = toFloat32Array(data)
    const adjusted = new Float32Array(audioData.length)

    for (let i = 0; i < audioData.length; i++) {
        adjusted[i] = audioData[i] * level
    }

    return toBuffer(adjusted)
}