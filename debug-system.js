// Script de diagnóstico completo do sistema
// Execute no console do navegador

async function diagnoseSystem() {
    console.log('🔍 Iniciando diagnóstico completo do sistema...');
    
    const results = {
        server: false,
        supabase: false,
        auth: false,
        storage: false,
        data: false,
        services: false
    };
    
    try {
        // 1. Testar servidor
        console.log('📡 1. Testando servidor...');
        const serverResponse = await fetch(window.location.origin);
        results.server = serverResponse.ok;
        console.log(`✅ Servidor: ${results.server ? 'OK' : 'FALHOU'}`);
        
        // 2. Testar Supabase
        console.log('🗄️ 2. Testando Supabase...');
        if (window.supabase) {
            results.supabase = true;
            console.log('✅ Supabase: OK (window.supabase disponível)');
            
            // 3. Testar autenticação
            console.log('🔐 3. Testando autenticação...');
            const { data: { user }, error: authError } = await window.supabase.auth.getUser();
            if (!authError && user) {
                results.auth = true;
                console.log(`✅ Auth: OK (usuário: ${user.email})`);
                console.log(`   User ID: ${user.id}`);
                console.log(`   Username: ${user.user_metadata?.username || 'N/A'}`);
            } else {
                console.log(`❌ Auth: FALHOU - ${authError?.message || 'Usuário não logado'}`);
            }
            
            // 4. Testar blobService
            console.log('💾 4. Testando blobService...');
            if (window.blobService) {
                results.storage = true;
                console.log('✅ blobService: OK (window.blobService disponível)');
                
                if (results.auth) {
                    try {
                        // 5. Testar acesso aos dados
                        console.log('📊 5. Testando acesso aos dados...');
                        const jobs = await window.blobService.get(user.id, 'jobs');
                        const clients = await window.blobService.get(user.id, 'clients');
                        const settings = await window.blobService.get(user.id, 'settings');
                        
                        results.data = true;
                        console.log('✅ Dados: OK');
                        console.log(`   Jobs: ${jobs?.length || 0} encontrados`);
                        console.log(`   Clients: ${clients?.length || 0} encontrados`);
                        console.log(`   Settings: ${settings ? 'OK' : 'Não encontrados'}`);
                        
                        // 6. Testar escrita
                        console.log('✏️ 6. Testando escrita...');
                        const testData = { test: true, timestamp: Date.now() };
                        await window.blobService.set(user.id, 'system_test', testData);
                        const retrieved = await window.blobService.get(user.id, 'system_test');
                        
                        if (retrieved && retrieved.test) {
                            results.services = true;
                            console.log('✅ Serviços: OK (leitura/escrita funcionando)');
                            
                            // Limpar teste
                            await window.blobService.del(user.id, 'system_test');
                        } else {
                            console.log('❌ Serviços: FALHOU (escrita/leitura não funcionando)');
                        }
                        
                    } catch (dataError) {
                        console.log(`❌ Dados: FALHOU - ${dataError.message}`);
                    }
                } else {
                    console.log('⚠️ Dados: Pulado (usuário não autenticado)');
                }
            } else {
                console.log('❌ blobService: FALHOU (window.blobService não disponível)');
            }
        } else {
            console.log('❌ Supabase: FALHOU (window.supabase não disponível)');
        }
        
        // 7. Verificar console errors
        console.log('🐛 7. Verificando errors no console...');
        const consoleErrors = [];
        const originalError = console.error;
        console.error = function(...args) {
            consoleErrors.push(args.join(' '));
            originalError.apply(console, args);
        };
        
        // Resumo final
        console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
        console.log('='.repeat(50));
        console.log(`Servidor: ${results.server ? '✅' : '❌'}`);
        console.log(`Supabase: ${results.supabase ? '✅' : '❌'}`);
        console.log(`Auth: ${results.auth ? '✅' : '❌'}`);
        console.log(`Storage: ${results.storage ? '✅' : '❌'}`);
        console.log(`Dados: ${results.data ? '✅' : '❌'}`);
        console.log(`Serviços: ${results.services ? '✅' : '❌'}`);
        
        const workingCount = Object.values(results).filter(Boolean).length;
        const totalCount = Object.keys(results).length;
        
        console.log(`\n🎯 Status Geral: ${workingCount}/${totalCount} sistemas funcionando`);
        
        if (workingCount === totalCount) {
            console.log('🎉 SISTEMA 100% FUNCIONAL!');
        } else if (workingCount >= totalCount / 2) {
            console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
        } else {
            console.log('❌ SISTENTE COM PROBLEMAS CRÍTICOS');
        }
        
        // Restaurar console.error
        setTimeout(() => {
            console.error = originalError;
        }, 1000);
        
        return results;
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
        return results;
    }
}

// Executar diagnóstico
console.log('🚀 Executando diagnóstico do sistema...');
diagnoseSystem();
