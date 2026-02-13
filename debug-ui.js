// Script para diagnosticar problemas de UI
// Execute no console do navegador quando a tela estiver branca

function debugUI() {
    console.log('🔍 Diagnosticando problemas de UI...');
    
    // 1. Verificar se o React está montado
    console.log('⚛️ 1. Verificando React...');
    const rootElement = document.getElementById('root');
    if (rootElement) {
        console.log('✅ Root element encontrado');
        console.log('Conteúdo do root:', rootElement.innerHTML.substring(0, 200) + '...');
        
        if (rootElement.children.length === 0) {
            console.log('❌ Root element está vazio - React não montou');
        } else {
            console.log(`✅ Root element tem ${rootElement.children.length} filhos`);
        }
    } else {
        console.log('❌ Root element não encontrado');
    }
    
    // 2. Verificar se há erros de JavaScript
    console.log('🐛 2. Verificando erros...');
    const errorElements = document.querySelectorAll('[data-error], [data-exception]');
    if (errorElements.length > 0) {
        console.log('❌ Encontrados elementos de erro:', errorElements);
    } else {
        console.log('✅ Nenhum elemento de erro encontrado');
    }
    
    // 3. Verificar se há CSS carregado
    console.log('🎨 3. Verificando CSS...');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`✅ ${stylesheets.length} stylesheets encontrados`);
    
    // 4. Verificar se há console errors
    console.log('📋 4. Verificando console errors recentes...');
    const originalError = console.error;
    const errors = [];
    
    // 5. Verificar estado dos hooks
    console.log('🪝 5. Verificando estado dos componentes...');
    const appData = window.appData;
    const authData = window.authData;
    
    console.log('App Data:', appData ? 'Disponível' : 'Não disponível');
    console.log('Auth Data:', authData ? 'Disponível' : 'Não disponível');
    
    // 6. Tentar forçar re-render
    console.log('🔄 6. Tentando forçar re-render...');
    if (rootElement && rootElement.children.length === 0) {
        console.log('⚠️ Tentando recarregar componentes...');
        
        // Disparar evento de recarregamento
        window.dispatchEvent(new Event('load'));
        
        // Tentar remover e re-adicionar o root
        setTimeout(() => {
            if (rootElement.children.length === 0) {
                console.log('🔄 Forçando reload da página...');
                location.reload();
            }
        }, 2000);
    }
    
    // 7. Verificar se há problemas com as rotas
    console.log('🛣️ 7. Verificando rotas...');
    const currentPath = window.location.hash || window.location.pathname;
    console.log(`Path atual: ${currentPath}`);
    
    // 8. Verificar se há problemas com os providers
    console.log('📦 8. Verificando providers...');
    console.log('React disponível:', typeof React !== 'undefined');
    console.log('ReactDOM disponível:', typeof ReactDOM !== 'undefined');
    console.log('React Router disponível:', typeof ReactRouter !== 'undefined');
    
    console.log('\n🎯 Diagnóstico UI concluído!');
    console.log('Se a tela continua branca, tente:');
    console.log('1. Recarregar a página (F5)');
    console.log('2. Limpar cache (Ctrl+Shift+R)');
    console.log('3. Verificar console para erros');
    console.log('4. Tentar acessar diretamente: /#/login');
}

// Executar diagnóstico
debugUI();
