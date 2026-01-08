import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'stream';

/**
 * Compresses Raw Float32 PCM audio back to a light format (MP3 by default).
 * @param buffer The Raw Float32 buffer from AudioPipeline
 * @param format 'mp3' | 'm4a'
 * @param bitrate '128k' | '64k' (lower = smaller file)
 */
export function encodeAudio(
    buffer: Buffer,
    format: 'mp3' | 'm4a' = 'mp3',
    bitrate: string = '128k'
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // 1. Setup Input Stream (Raw Data)
        const inputStream = new Readable();
        inputStream.push(buffer);
        inputStream.push(null);

        // 2. Setup Output Stream (Compressed Data)
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => chunks.push(chunk));
        outputStream.on('end', () => {
            const result = Buffer.concat(chunks);
            resolve(result);
        });
        outputStream.on('error', (err) => reject(err));

        // 3. Configure FFmpeg
        let command = ffmpeg(inputStream)
            .inputFormat('f32le')
            .audioFrequency(44100)
            .audioChannels(1);

        if (format === 'mp3') {
            command = command
                .format('mp3')
                .audioCodec('libmp3lame') // Padrão para MP3
                .audioBitrate(bitrate);
        } else if (format === 'm4a') {
            command = command
                .format('adts') // Container para AAC stream
                .audioCodec('aac')
                .audioBitrate(bitrate);
        }

        // 4. Run
        command
            .on('error', (err) => reject(err))
            .pipe(outputStream, { end: true });
    });
}