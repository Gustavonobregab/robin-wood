import { TextPipeline } from '../v1/text';
import { Operation } from '../v1/pipeline';

async function runTextTests() {
  console.log('📝 INICIANDO TESTES DE TEXTO (MODO BYPASS PRIVATE)...\n');

  // Hack para acessar o método privado estático
  const runPipeline = (TextPipeline as any).exec;

  // --- TESTE 1: TRIM ---
  console.log('🔹 TESTE 1: Trim');
  const rawText = "   Olá    Mundo.   ";
  const opsTrim: Operation[] = [{ name: 'trim', params: {} }];

  const resultTrim = await runPipeline(rawText, opsTrim);
  
  const expected = "Olá Mundo.";
  const passed = resultTrim.data === expected;

  console.log(`   Input:  "${rawText}"`);
  console.log(`   Output: "${resultTrim.data}"`);
  console.log(`   Status: ${passed ? '✅ PASSOU' : '❌ FALHOU'}\n`);

  // --- TESTE 2: ENCADEAMENTO (Trim -> Minify) ---
  console.log('🔹 TESTE 2: Pipeline (Trim -> Minify)');
  const rawChain = "  Teste  Chain  ";
  // Simula a lista de operações acumuladas
  const opsChain: Operation[] = [
    { name: 'trim', params: {} },
    { name: 'minify', params: {} }
  ];

  const resultChain = await runPipeline(rawChain, opsChain);
  
  const expectedChain = "Teste Chain"; // Minify não altera o texto no seu código atual, só o Trim
  const passedChain = resultChain.data === expectedChain;

  console.log(`   Output: "${resultChain.data}"`);
  console.log(`   Status: ${passedChain ? '✅ PASSOU' : '❌ FALHOU'}\n`);
}

runTextTests().catch(console.error);