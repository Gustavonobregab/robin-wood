import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

/**
 * Compresses Raw Float32 PCM audio back to a light format (MP3 by default).
 * @param buffer The Raw Float32 buffer from AudioPipeline
 * @param format 'mp3' | 'm4a'
 * @param bitrate '128k' | '64k' (lower = smaller file)
 */
export function encodeAudio(
    // CORREÇÃO AQUI: Aceitamos os 3 tipos, assim o 'instanceof' para de reclamar
    buffer: Buffer | ArrayBuffer | Uint8Array,
    format: 'mp3' | 'm4a' = 'mp3',
    bitrate: string = '128k'
): Promise<Buffer> {
    return new Promise((resolve, reject) => {

        // 1. Setup Input Stream (Raw Data)
        let inputBuffer: Buffer;

        // Lógica separada para satisfazer o TypeScript
        if (Buffer.isBuffer(buffer)) {
            inputBuffer = buffer;
        } else if (buffer instanceof Uint8Array) {
            inputBuffer = Buffer.from(buffer);
        } else if (buffer instanceof ArrayBuffer) {
            inputBuffer = Buffer.from(buffer);
        } else {
            return reject(new Error("Invalid buffer type for encoder"));
        }

        const inputStream = new Readable();
        inputStream.push(inputBuffer);
        inputStream.push(null);

        // 2. Setup Output Stream (Compressed Data)
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));

        // 3. Configure FFmpeg
        let command = ffmpeg(inputStream)
            .inputFormat('f32le')
            .audioFrequency(44100)
            .audioChannels(1);

        if (format === 'mp3') {
            command = command
                .format('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate(bitrate);
        } else if (format === 'm4a') {
            command = command
                .format('adts')
                .audioCodec('aac')
                .audioBitrate(bitrate);
        }

        // 4. Run with Error Shielding
        command
            .on('error', (err) => {
                // Ignora o erro se for apenas o stream fechando cedo demais
                if (err.message.includes('Output stream closed')) return;
                reject(err);
            })
            .on('end', () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            })
            .pipe(outputStream, { end: true });
    });
}