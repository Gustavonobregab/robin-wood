import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import fs from 'fs';

/**
 * Converts any audio file (MP3, MP4, WAV) to raw PCM Float32LE.
 * Returns a Buffer ready for the AudioPipeline.
 */
export function decodeAudio(inputPath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(inputPath)) {
            return reject(new Error(`Input file not found: ${inputPath}`));
        }

        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        outputStream.on('end', () => {
            const fullBuffer = Buffer.concat(chunks);
            resolve(fullBuffer);
        });

        outputStream.on('error', (err) => {
            reject(err);
        });


        ffmpeg(inputPath)
            .noVideo()
            .audioChannels(1)
            .audioFrequency(44100)
            .format('f32le')
            .audioCodec('pcm_f32le')
            .on('error', (err) => {
                reject(new Error(`FFmpeg error: ${err.message}`));
            })
            .pipe(outputStream);
    });
}