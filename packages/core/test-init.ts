import steal from './src/v1/index'

async function testInit() {
  console.log('=== Teste de Inicialização ===\n')

  // Teste 1: Tentar usar sem inicializar
  console.log('1. Testando uso sem inicializar...')
  try {
    await steal.text('hello').run()
    console.log('   FALHOU: Deveria ter dado erro\n')
  } catch (e: any) {
    console.log(`   OK: ${e.message}\n`)
  }

  const apiUrl = 'http://localhost:3000'

  // Teste 2: Inicializar com key inválida
  console.log('2. Testando com API key inválida...')
  try {
    await steal.init({ apiKey: 'key-invalida-123', apiUrl })
    console.log('   FALHOU: Deveria ter rejeitado a key\n')
  } catch (e: any) {
    console.log(`   OK: ${e.message}\n`)
  }

  // Teste 3: Inicializar com key válida
  console.log('3. Testando com API key válida...')
  try {
    await steal.init({ apiKey: 'sk_live_robin_test_key_001', apiUrl })
    console.log('   OK: Inicializado com sucesso!')
    console.log(`   isInitialized: ${steal.isInitialized()}\n`)
  } catch (e: any) {
    console.log(`   ERRO: ${e.message}\n`)
  }

  // Teste 4: Usar após inicializar
  if (steal.isInitialized()) {
    console.log('4. Testando pipeline após inicializar...')
    try {
      const result = await steal.text('  Hello World  ').trim().run()
      console.log(`   OK: Pipeline executou com sucesso`)
      console.log(`   Resultado: ${JSON.stringify(result)}\n`)
    } catch (e: any) {
      console.log(`   ERRO: ${e.message}\n`)
    }
  }
}

testInit()
