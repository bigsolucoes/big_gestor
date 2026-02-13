// Script para desbloquear jobs com Supabase 100% online
// Execute este script no console do navegador após fazer login

async function unblockJobsOnline() {
    try {
        console.log('🔓 Iniciando desbloqueio online dos jobs...');
        
        // Verificar ambiente
        if (typeof window === 'undefined') {
            throw new Error('Execute no console do navegador.');
        }
        
        // Verificar se Supabase está disponível
        const { supabase } = window;
        if (!supabase) {
            throw new Error('Supabase não encontrado. Recarregue a página.');
        }
        
        console.log('✅ Supabase encontrado:', supabase);
        
        // Verificar usuário logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            throw new Error(`Erro de autenticação: ${authError.message}`);
        }
        
        if (!user) {
            throw new Error('Usuário não está logado. Faça login primeiro.');
        }
        
        console.log(`✅ Usuário logado: ${user.email}`);
        console.log(`🆔 User ID: ${user.id}`);
        console.log(`👤 Username: ${user.user_metadata?.username || user.email?.split('@')[0]}`);
        
        // Verificar blobService
        const { blobService } = window;
        if (!blobService) {
            throw new Error('blobService não encontrado. Recarregue a página.');
        }
        
        console.log('✅ blobService encontrado');
        
        // Buscar jobs do Supabase Storage
        console.log('🔍 Buscando jobs no Supabase Storage...');
        
        let jobsData = [];
        
        try {
            jobsData = await blobService.get(user.id, 'jobs');
            console.log(`📊 Encontrados ${jobsData?.length || 0} jobs no storage`);
        } catch (error) {
            console.log('⚠️ Erro ao buscar jobs:', error);
        }
        
        // Se não encontrou, tentar métodos alternativos
        if (!jobsData || jobsData.length === 0) {
            console.log('🔧 Tentando métodos alternativos...');
            
            // Método 1: Buscar direto do storage
            try {
                const { data, error } = await supabase.storage
                    .from('user-data')
                    .list(user.id, {
                        limit: 100
                    });
                
                if (!error && data) {
                    console.log(`📊 Encontrados ${data.length} arquivos no storage`);
                    
                    for (let file of data) {
                        if (file.name.includes('jobs')) {
                            const { data: fileData, error: downloadError } = await supabase.storage
                                .from('user-data')
                                .download(`${user.id}/${file.name}`);
                            
                            if (!downloadError && fileData) {
                                const text = await fileData.text();
                                const parsed = JSON.parse(text);
                                if (Array.isArray(parsed)) {
                                    jobsData = parsed;
                                    console.log(`📊 Jobs carregados do arquivo: ${file.name}`);
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ Erro no método alternativo:', e);
            }
        }
        
        // Se ainda não encontrou, criar do localStorage
        if (!jobsData || jobsData.length === 0) {
            console.log('🔧 Buscando jobs no localStorage...');
            
            try {
                const keys = Object.keys(localStorage);
                for (let key of keys) {
                    if (key.includes('jobs') || key.includes('big_gestor')) {
                        const data = localStorage.getItem(key);
                        if (data) {
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.jobs && Array.isArray(parsed.jobs)) {
                                    jobsData = parsed.jobs;
                                    console.log(`📊 Jobs encontrados no localStorage (${key})`);
                                    break;
                                } else if (Array.isArray(parsed)) {
                                    jobsData = parsed;
                                    console.log(`📊 Jobs encontrados no localStorage (${key})`);
                                    break;
                                }
                            } catch (e) {
                                // Continuar
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('⚠️ Erro ao buscar localStorage:', e);
            }
        }
        
        if (!jobsData || jobsData.length === 0) {
            console.log('⚠️ Nenhum job encontrado. Criando jobs de exemplo...');
            
            const jobCount = parseInt(prompt('Quantos jobs você quer criar? (Digite 16)', '16')) || 16;
            
            jobsData = [];
            for (let i = 1; i <= jobCount; i++) {
                jobsData.push({
                    id: `job-${Date.now()}-${i}`,
                    name: `Job ${i} - ${user.user_metadata?.username || user.email?.split('@')[0]}`,
                    ownerId: user.id,
                    ownerUsername: user.user_metadata?.username || user.email?.split('@')[0],
                    isDeleted: false,
                    isTeamJob: false,
                    status: 'Briefing',
                    value: 1000 * i,
                    clientId: `client-${i}`,
                    createdAt: new Date().toISOString(),
                    payments: [],
                    tasks: [],
                    annotations: []
                });
            }
            
            console.log(`📊 Criados ${jobsData.length} jobs de exemplo`);
        }
        
        console.log(`📊 Total de jobs para processar: ${jobsData.length}`);
        
        // Mostrar detalhes dos jobs
        jobsData.forEach((job, index) => {
            console.log(`🔍 Job ${index + 1}:`, {
                id: job.id,
                name: job.name,
                ownerId: job.ownerId,
                ownerUsername: job.ownerUsername,
                isDeleted: job.isDeleted,
                status: job.status
            });
        });
        
        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            const currentOwnerId = job.ownerId;
            const currentOwnerUsername = job.ownerUsername;
            const userUsername = user.user_metadata?.username || user.email?.split('@')[0];
            
            const hasCorrectOwner = (
                currentOwnerId === user.id || 
                currentOwnerUsername === userUsername ||
                job.isTeamJob === true
            );
            
            const isActive = !job.isDeleted;
            const needsFix = isActive && !hasCorrectOwner;
            
            if (needsFix) {
                console.log(`🔧 Job que precisa de correção: ${job.name}`, {
                    id: job.id,
                    currentOwnerId,
                    currentOwnerUsername,
                    shouldBeOwnerId: user.id,
                    shouldBeUsername: userUsername
                });
            }
            
            return needsFix;
        });
        
        console.log(`🎯 ${jobsToFix.length} jobs precisam ser corrigidos...`);
        
        if (jobsToFix.length === 0) {
            console.log('ℹ️ Nenhum job precisa ser corrigido.');
            
            // Forçar correção de todos os jobs para garantir
            console.log('🔧 Forçando correção de todos os jobs para garantir...');
            jobsToFix.push(...jobsData);
        }
        
        // Corrigir propriedade dos jobs
        const updatedJobs = jobsData.map(job => {
            const needsFix = jobsToFix.includes(job);
            const userUsername = user.user_metadata?.username || user.email?.split('@')[0];
            
            if (needsFix) {
                console.log(`🔧 Corrigindo job: ${job.name}`);
                console.log(`   Antes: ownerId=${job.ownerId}, ownerUsername=${job.ownerUsername}`);
                
                return {
                    ...job,
                    ownerId: user.id,
                    ownerUsername: userUsername,
                    isTeamJob: false
                };
            }
            
            return job;
        });
        
        // Salvar os jobs corrigidos
        console.log('💾 Salvando jobs corrigidos...');
        
        try {
            await blobService.set(user.id, 'jobs', updatedJobs);
            console.log('✅ Jobs salvos com sucesso no Supabase Storage');
        } catch (error) {
            console.error('❌ Erro ao salvar jobs:', error);
            throw new Error('Não foi possível salvar os jobs no Supabase.');
        }
        
        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            jobsFixed: jobsToFix.length,
            fixedJobs: updatedJobs.filter(job => 
                job.ownerId === user.id && 
                !job.isDeleted
            ).length
        };
        
        console.log('📈 Estatísticas:', stats);
        
        // Mostrar mensagem de sucesso
        alert(`🎉 Desbloqueio online concluído!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs totais\n` +
              `• ${stats.jobsFixed} jobs corrigidos\n` +
              `• ${stats.fixedJobs} jobs agora pertencem a você\n\n` +
              `✅ Sistema 100% Online no Supabase!\n\n` +
              `Agora você deve conseguir:\n` +
              `✅ Arrastar os jobs no Kanban\n` +
              `✅ Editar os jobs\n` +
              `✅ Excluir os jobs\n` +
              `✅ Ver detalhes dos jobs\n` +
              `✅ Adicionar anotações\n` +
              `✅ Gerenciar pagamentos\n\n` +
              `Recarregue a página para ver as mudanças!`);
        
        return stats;
        
    } catch (error) {
        console.error('❌ Erro no desbloqueio online:', error);
        alert(`❌ Erro: ${error.message}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script de desbloqueio online carregado. Executando...');
unblockJobsOnline();
