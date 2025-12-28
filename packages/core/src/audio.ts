import { spawn } from 'child_process';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  AudioContent,
  Policy,
  Stage,
  StageResult,
  AccelerateAction,
} from './types';

function estimateBase64Bytes(b64: string): number {
  const len = b64.length;
  if (len === 0) return 0;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((len * 3) / 4) - padding);
}


async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });
  });
}


async function speedUpAudio(
  inputPath: string,
  outputPath: string,
  speedFactor: number
): Promise<void> {
  // atempo filter only accepts values between 0.5 and 2.0
  // For higher speeds, we chain multiple atempo filters
  const atempoFilters: string[] = [];
  let remaining = speedFactor;

  while (remaining > 2.0) {
    atempoFilters.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    atempoFilters.push('atempo=0.5');
    remaining /= 0.5;
  }
  atempoFilters.push(`atempo=${remaining}`);

  const filterChain = atempoFilters.join(',');

  await runFFmpeg([
    '-i', inputPath,
    '-filter:a', filterChain,
    '-y',
    outputPath,
  ]);
}

export const accelerateStage: Stage<AudioContent> = {
  name: 'audio:accelerate',
  modality: 'audio',
  actionKey: 'accelerate',
  order: 10,
  contentType: 'audio',

  enabled(policy: Policy): boolean {
    return (
      policy.audio.enabled === true &&
      policy.audio.actions.accelerate?.enabled === true
    );
  },

  async process(
    content: AudioContent,
    actionConfig: unknown
  ): Promise<StageResult<AudioContent>> {
    const start = Date.now();
    const config = actionConfig as AccelerateAction;

    // percent: 50 = 1.5x, 100 = 2x, 0 = 1x
    const speedFactor = 1 + config.percent / 100;

    const unitsBefore = estimateBase64Bytes(content.data);

    // If speed factor is 1.0, no processing needed
    if (speedFactor === 1.0) {
      return {
        content,
        unitsBefore,
        unitsAfter: unitsBefore,
        durationMs: Date.now() - start,
      };
    }

    // Create temp directory
    const tempDir = await mkdtemp(join(tmpdir(), 'robin-wood-'));
    const inputPath = join(tempDir, `input.${content.format}`);
    const outputPath = join(tempDir, `output.${content.format}`);

    try {
      // Decode base64 and write to temp file
      const inputBuffer = Buffer.from(content.data, 'base64');
      await writeFile(inputPath, inputBuffer);

      // Process with ffmpeg
      await speedUpAudio(inputPath, outputPath, speedFactor);

      // Read output and encode to base64
      const outputBuffer = await readFile(outputPath);
      const outputBase64 = outputBuffer.toString('base64');
      const unitsAfter = outputBuffer.length;

      // Calculate new duration (approximate)
      const newDuration = content.duration
        ? content.duration / speedFactor
        : undefined;

      return {
        content: {
          ...content,
          data: outputBase64,
          duration: newDuration,
        },
        unitsBefore,
        unitsAfter,
        durationMs: Date.now() - start,
      };
    } finally {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      await unlink(tempDir).catch(() => {});
    }
  },
};


export const AUDIO_STAGES: Stage<AudioContent>[] = [
  accelerateStage,
  // Future: trimSilenceStage, normalizeStage, etc.
];
