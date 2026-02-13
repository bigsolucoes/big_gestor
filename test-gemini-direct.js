// Script para testar API Gemini diretamente
// Execute no console do navegador

async function testGeminiDirect() {
    console.log('🧪 Teste Direto da API Gemini...');
    
    try {
        // 1. Verificar se API key está disponível
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        console.log('🔑 API Key:', API_KEY ? 'Presente' : 'Ausente');
        console.log('🔑 API Key Length:', API_KEY?.length || 0);
        
        if (!API_KEY) {
            console.log('❌ API Key não encontrada');
            return;
        }
        
        // 2. Importar e inicializar Gemini
        console.log('📦 Importando GoogleGenAI...');
        const { GoogleGenAI } = await import('@google/genai');
        
        console.log('🤖 Inicializando Gemini...');
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        console.log('✅ Gemini inicializado com sucesso');
        
        // 3. Fazer chamada de teste simples
        console.log('📤 Fazendo chamada de teste...');
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = 'Responda apenas com: "API Gemini funcionando corretamente"';
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📥 Resposta recebida:', text);
        console.log('🎉 Teste concluído com sucesso!');
        
        // 4. Testar com function calling
        console.log('🔧 Testando function calling...');
        
        const functionCallPrompt = 'Crie um cliente de teste chamado "João Silva" com email "joao@teste.com"';
        
        const functionResult = await model.generateContent(functionCallPrompt);
        const functionResponse = await functionResult.response;
        const functionText = functionResponse.text();
        
        console.log('🔧 Resposta function calling:', functionText);
        
    } catch (error) {
        console.error('❌ Erro no teste direto:', error);
        console.error('❌ Detalhes:', error.message);
        console.error('❌ Stack:', error.stack);
        
        // Verificar tipo de erro
        if (error.message.includes('API_KEY')) {
            console.log('🔑 Problema com API Key');
        } else if (error.message.includes('quota')) {
            console.log('📊 Problema de quota/cota');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            console.log('🌐 Problema de rede/conexão');
        } else if (error.message.includes('CORS')) {
            console.log('🌐 Problema de CORS');
        } else {
            console.log('❓ Erro desconhecido');
        }
    }
}

// Executar teste
testGeminiDirect();
