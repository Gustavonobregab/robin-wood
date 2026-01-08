import { AudioPipeline } from '../v1/audio';
import { Operation } from '../v1/pipeline';

// ==========================================
// AJUDANTES (Geradores de Som)
// ==========================================
function createTone(durationSec: number, sampleRate = 44100, amplitude = 0.5): Buffer {
  const numSamples = Math.floor(durationSec * sampleRate);
  const float32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    float32[i] = amplitude * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
  }
  return Buffer.from(float32.buffer);
}

function createSilence(durationSec: number, sampleRate = 44100): Buffer {
  const numSamples = Math.floor(durationSec * sampleRate);
  const float32 = new Float32Array(numSamples).fill(0);
  return Buffer.from(float32.buffer);
}

function getPeak(buffer: Buffer): number {
    const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    let max = 0;

    // FIX: Use standard for-loop instead of iterator (faster & compatible with ES5)
    for (let i = 0; i < float32.length; i++) {
        const abs = Math.abs(float32[i]);
        if (abs > max) max = abs;
    }

    return max;
}

// ==========================================
// EXECUÇÃO DO TESTE
// ==========================================
async function runAudioTests() {
  console.log('🔊 INICIANDO TESTES (MODO BYPASS PRIVATE)...\n');

  // Hack para acessar o método privado estático 'exec' sem mudar o código fonte
  const runPipeline = (AudioPipeline as any).exec;

  // --- TESTE 1: SPEEDUP ---
  console.log('🔹 TESTE 1: Speedup (2x)');
  const inputSpeed = createTone(2.0);
  // Simulando o array de operações que a classe criaria internamente
  const opsSpeed: Operation[] = [{ name: 'speedup', params: { rate: 2 } }];
  
  const resultSpeed = await runPipeline(inputSpeed, opsSpeed);
  
  const diff = Math.abs(resultSpeed.duration - 1.0);
  console.log(`   Duração Original: 2.0s`);
  console.log(`   Duração Final:    ${resultSpeed.duration.toFixed(3)}s`);
  console.log(`   Status:           ${diff < 0.05 ? '✅ PASSOU' : '❌ FALHOU'}\n`);

  // --- TESTE 2: VOLUME ---
  console.log('🔹 TESTE 2: Volume (0.5)');
  const inputVol = createTone(1.0, 44100, 1.0);
  const opsVol: Operation[] = [{ name: 'volume', params: { level: 0.5 } }];

  const resultVol = await runPipeline(inputVol, opsVol);
  const peak = getPeak(resultVol.data as Buffer);

  console.log(`   Pico Esperado: 0.5`);
  console.log(`   Pico Obtido:   ${peak.toFixed(4)}`);
  console.log(`   Status:        ${Math.abs(peak - 0.5) < 0.001 ? '✅ PASSOU' : '❌ FALHOU'}\n`);

  // --- TESTE 3: REMOVE SILENCE ---
  console.log('🔹 TESTE 3: Remove Silence');
  const part1 = createTone(0.5);
  const partSilence = createSilence(1.0);
  const part2 = createTone(0.5);
  const inputSilence = Buffer.concat([part1, partSilence, part2]); // Total 2.0s

  const opsSilence: Operation[] = [{ name: 'removeSilence', params: { thresholdDb: -40, minDurationMs: 100 } }];
  
  const resultSilence = await runPipeline(inputSilence, opsSilence);
  const diffSilence = Math.abs(resultSilence.duration - 1.0);

  console.log(`   Duração Original: 2.0s`);
  console.log(`   Duração Final:    ${resultSilence.duration.toFixed(3)}s`);
  console.log(`   Status:           ${diffSilence < 0.1 ? '✅ PASSOU' : '❌ FALHOU'}\n`);
}

runAudioTests().catch(console.error);