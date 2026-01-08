import steal, { decodeAudio } from '../v1/index';
import * as fs from 'fs';
import * as path from 'path';

// ==========================================
// AJUDANTE: SALVAR WAV (Para ouvir o resultado)
// ==========================================
function saveWav(filename: string, data: Buffer | ArrayBuffer | Uint8Array, sampleRate: number) {
    let buffer: Buffer;

    // Resolve tipos para evitar erro do TS
    if (Buffer.isBuffer(data)) {
        buffer = data;
    } else if (data instanceof Uint8Array) {
        buffer = Buffer.from(data);
    } else {
        buffer = Buffer.from(data);
    }

    const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    const numSamples = float32.length;
    const outputBuffer = Buffer.alloc(44 + numSamples * 2);

    // Header WAV (16-bit Mono)
    outputBuffer.write('RIFF', 0);
    outputBuffer.writeUInt32LE(36 + numSamples * 2, 4);
    outputBuffer.write('WAVE', 8);
    outputBuffer.write('fmt ', 12);
    outputBuffer.writeUInt32LE(16, 16);
    outputBuffer.writeUInt16LE(1, 20);
    outputBuffer.writeUInt16LE(1, 22);
    outputBuffer.writeUInt32LE(sampleRate, 24);
    outputBuffer.writeUInt32LE(sampleRate * 2, 28);
    outputBuffer.writeUInt16LE(2, 32);
    outputBuffer.writeUInt16LE(16, 34);
    outputBuffer.write('data', 36);
    outputBuffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
        let s = Math.max(-1, Math.min(1, float32[i]));
        let int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
        outputBuffer.writeInt16LE(Math.floor(int16), 44 + (i * 2));
    }

    const outputPath = path.resolve(__dirname, '../../', filename);
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`   💾 Saved file to: ${filename}`);
}

// --- FUNÇÃO PARA ENCONTRAR QUALQUER ARQUIVO DE MÍDIA ---
function findMediaFile(dir: string): string | null {
    const extensions = ['.m4a', '.mp4', '.mp3', '.wav', '.ogg', '.flac', '.mov', '.webm'];

    if (!fs.existsSync(dir)) return null;

    const files = fs.readdirSync(dir);

    // Procura o primeiro arquivo que tenha uma das extensões acima
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
            return file;
        }
    }
    return null;
}

// --- FUNÇÃO PRINCIPAL DE TESTE ---
async function main() {
    console.log("🌲 RobinWood Playground: Starting universal test...\n");

    const rootDir = path.resolve(__dirname, '../../');

    // 1. Procura qualquer arquivo de áudio/vídeo na raiz
    console.log("🔍 Scanning for media files in root folder...");
    const mediaFile = findMediaFile(rootDir);

    if (mediaFile) {
        const inputPath = path.join(rootDir, mediaFile);
        console.log(`   📂 FOUND: '${mediaFile}'`);
        console.log("   🔄 Converting to RAW PCM (Float32)...");

        try {
            // O DECODIFICADOR É UNIVERSAL (Usa FFmpeg)
            const rawBuffer = await decodeAudio(inputPath);

            console.log(`   🚀 Processing pipeline (Speedup 1.5x + Normalize)...`);

            const realResult = await steal.audio(rawBuffer)
                .speedup(1.5)
                .normalize()
                .run();

            const originalDuration = rawBuffer.length / 4 / 44100;
            console.log(`   Original Duration: ${originalDuration.toFixed(2)}s`);
            console.log(`   Final Duration:    ${realResult.duration.toFixed(2)}s`);

            saveWav('result_universal.wav', realResult.data as Buffer, realResult.sampleRate);
            console.log("   ✅ SUCCESS! Processed any format successfully.\n");

        } catch (err) {
            console.error("   ❌ Conversion Error:", err);
        }
    } else {
        console.log("   ⚠️ No media file found!");
        console.log("   Please drop an audio file (.m4a, .mp3, .mp4) in the package root to test.");
    }

    console.log("🏁 Done.");
}

main().catch(err => console.error("Fatal Error:", err));