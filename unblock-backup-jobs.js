// Script para desbloquear jobs do backup que estão com propriedade incorreta
// Execute este script no console do navegador após fazer login

async function unblockBackupJobs() {
    try {
        console.log('🔓 Iniciando desbloqueio de jobs do backup...');
        
        // Verificar se está no ambiente correto
        if (typeof window === 'undefined') {
            throw new Error('Ambiente de janela não encontrado. Execute no console do navegador.');
        }
        
        // Importar Supabase do contexto global da aplicação
        const { supabase } = window;
        if (!supabase) {
            throw new Error('Supabase não encontrado. Certifique-se de estar na página da aplicação BIG Gestor.');
        }
        
        // Verificar se o usuário está logado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.error('Erro de autenticação:', authError);
            throw new Error(`Erro de autenticação: ${authError.message}`);
        }
        
        if (!user) {
            throw new Error('Usuário não está logado. Faça login primeiro.');
        }

        console.log(`✅ Usuário logado: ${user.email}`);
        console.log(`🆔 User ID: ${user.id}`);

        // Importar blobService do contexto global
        const { blobService } = window;
        if (!blobService) {
            throw new Error('blobService não encontrado. Certifique-se de estar na página da aplicação BIG Gestor.');
        }

        console.log('🔍 Carregando jobs...');
        
        // Carregar todos os jobs
        const jobsData = await blobService.get(user.id, 'jobs');
        
        console.log(`📊 Dados recebidos:`, jobsData);

        if (!jobsData) {
            console.log('ℹ️ Nenhum dado encontrado, criando array vazio...');
            jobsData = [];
        }
        
        if (!Array.isArray(jobsData)) {
            console.log('⚠️ Dados não são array, convertendo...');
            jobsData = [];
        }

        if (jobsData.length === 0) {
            console.log('ℹ️ Nenhum job encontrado para desbloquear.');
            alert('Nenhum job encontrado para desbloquear.');
            return;
        }

        console.log(`📊 Encontrados ${jobsData.length} jobs para processar...`);

        // Filtrar jobs que precisam ser corrigidos
        const jobsToFix = jobsData.filter(job => {
            try {
                // Jobs que não pertencem ao usuário atual por ID ou username
                const hasCorrectOwner = (
                    job.ownerId === user.id || 
                    job.ownerUsername === user.username ||
                    job.isTeamJob === true
                );
                
                // Jobs que não estão deletados
                const isActive = !job.isDeleted;
                
                const needsFix = isActive && !hasCorrectOwner;
                
                if (needsFix) {
                    console.log(`🔍 Job que precisa de correção: ${job.name}`, {
                        jobId: job.id,
                        ownerId: job.ownerId,
                        ownerUsername: job.ownerUsername,
                        isTeamJob: job.isTeamJob,
                        isDeleted: job.isDeleted
                    });
                }
                
                return needsFix;
            } catch (error) {
                console.error(`Erro ao processar job:`, job, error);
                return false;
            }
        });

        console.log(`🎯 ${jobsToFix.length} jobs precisam ser corrigidos...`);

        if (jobsToFix.length === 0) {
            console.log('ℹ️ Nenhum job precisa ser corrigido.');
            alert('Nenhum job precisa ser corrigido (todos já estão com propriedade correta).');
            return;
        }

        // Corrigir propriedade dos jobs
        const updatedJobs = jobsData.map(job => {
            const needsFix = jobsToFix.includes(job);
            
            if (needsFix) {
                console.log(`🔧 Corrigindo job: ${job.name}`);
                console.log(`   Antes: ownerId=${job.ownerId}, ownerUsername=${job.ownerUsername}`);
                
                return {
                    ...job,
                    ownerId: user.id,
                    ownerUsername: user.username,
                    isTeamJob: false
                };
            }
            
            return job;
        });

        console.log('💾 Salvando jobs corrigidos...');
        
        // Salvar os jobs corrigidos
        await blobService.set(user.id, 'jobs', updatedJobs);
        console.log('✅ Jobs desbloqueados com sucesso!');

        // Estatísticas
        const stats = {
            totalJobs: jobsData.length,
            jobsFixed: jobsToFix.length,
            fixedJobs: updatedJobs.filter(job => 
                job.ownerId === user.id && 
                job.ownerUsername === user.username &&
                !job.isDeleted
            ).length
        };

        console.log('📈 Estatísticas da correção:', stats);

        // Mostrar mensagem de sucesso
        alert(`🎉 Desbloqueio concluído!\n\n` +
              `📊 Resumo:\n` +
              `• ${stats.totalJobs} jobs totais\n` +
              `• ${stats.jobsFixed} jobs corrigidos\n` +
              `• ${stats.fixedJobs} jobs agora pertencem a você\n\n` +
              `Recarregue a página para ver as mudanças!`);

        return stats;

    } catch (error) {
        console.error('❌ Erro no desbloqueio:', error);
        console.error('Stack trace:', error.stack);
        
        let errorMessage = error.message;
        
        // Mensagens mais amigáveis
        if (error.message.includes('Supabase não encontrado')) {
            errorMessage = 'Você precisa estar na página do BIG Gestor para executar este script.';
        } else if (error.message.includes('Usuário não está logado')) {
            errorMessage = 'Faça login no BIG Gestor antes de executar este script.';
        } else if (error.message.includes('blobService não encontrado')) {
            errorMessage = 'Recarregue a página e tente novamente.';
        }
        
        alert(`❌ Erro no desbloqueio: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
        throw error;
    }
}

// Executar função automaticamente
console.log('🚀 Script de desbloqueio carregado. Executando...');
unblockBackupJobs();
