import steal from '../v1/index'; // Importa o objeto principal 'steal'
import { AudioData } from '../v1/audio';

// --- FUNÇÃO AJUDANTE PARA GERAR ÁUDIO FALSO ---
// Gera 2 segundos de som (onda senoidal) em formato Buffer
// Isso evita que você precise baixar arquivos .wav para testar
function generateFakeAudio(seconds: number): Buffer {
  const sampleRate = 44100;
  const numSamples = seconds * sampleRate;
  const float32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Gera uma onda de 440Hz (Nota Lá)
    float32[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
  }
  
  return Buffer.from(float32.buffer);
}

// --- FUNÇÃO PRINCIPAL DE TESTE ---
async function main() {
  console.log("🌲 RobinWood Playground: Iniciando testes manuais...\n");

  // ==========================================
  // 1. TESTE DE TEXTO
  // ==========================================
  console.log("📝 [TEXTO] Testando pipeline...");

  const rawText = "   Olá,    este é um   texto    com muitos espaços.   ";
  console.log(`   Input: "${rawText}"`);

  // Pipeline: Carrega -> Trim (Remove espaços) -> Run
  const textResult = await steal.text(rawText)
    .trim()
    .run(); // <--- Agora usamos .run() baseado no seu pipeline.ts

  console.log(`   Output: "${textResult.data}"`);
  console.log(`   Taxa de compressão: ${(textResult.ratio * 100).toFixed(1)}%`);
  
  if (textResult.data === "Olá, este é um texto com muitos espaços.") {
    console.log("   ✅ Sucesso!\n");
  } else {
    console.log("   ❌ Falhou (Resultado inesperado)\n");
  }

  // ==========================================
  // 2. TESTE DE ÁUDIO
  // ==========================================
  console.log("🔊 [ÁUDIO] Testando pipeline...");

  // Gera 2 segundos de áudio sintético
  const audioBuffer = generateFakeAudio(2.0); 
  console.log(`   Input: Áudio de 2.0s gerado em memória.`);

  // Pipeline: Carrega -> Speedup (2x) -> Volume (50%) -> Run
  const audioResult = await steal.audio(audioBuffer)
    .speedup(2.0)   // Deve reduzir duração pela metade
    .volume(0.5)    // Deve reduzir amplitude
    .run();

  console.log(`   Duração Final: ${audioResult.duration.toFixed(3)}s`);
  console.log(`   Sample Rate: ${audioResult.sampleRate}Hz`);

  // Validação simples
  const isDurationCorrect = Math.abs(audioResult.duration - 1.0) < 0.1; // Esperado 1.0s (2s / 2)
  
  if (isDurationCorrect) {
    console.log("   ✅ Sucesso! (Duração correta)\n");
  } else {
    console.log("   ❌ Falhou na duração.\n");
  }

  console.log("🏁 Testes finalizados.");
}

main().catch(err => console.error("Erro fatal:", err));